import { toast } from "sonner";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
type UserType = string | null;
type HttpConfig = {
  skipUnauthorized?: boolean;
};

type ApiResponse = {
  response: Response;
  // API responses differ by endpoint, so callers narrow this result themselves.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

type RefreshResult = {
  accessToken: string | null;
  errorCode?: string;
  message?: string;
};

type SessionType = "customer" | "employee";
type TokenPayload = {
  role?: string | null;
  userType?: "Customer" | "Employee";
};

const ACCOUNT_LOCKED_MESSAGE = "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
const AUTH_NOTICE_KEY = "auth_notice";

const refreshPromises: Record<SessionType, Promise<RefreshResult> | null> = {
  customer: null,
  employee: null,
};

const getSessionType = (typeUser: UserType): SessionType =>
  typeUser === "customer" ? "customer" : "employee";

const getApiUserType = (sessionType: SessionType) =>
  sessionType === "customer" ? "Customer" : "Employee";

const getAccessTokenKey = (typeUser: UserType) =>
  typeUser === "customer" ? "customer_access_token" : "employee_access_token";

const decodeTokenPayload = (token: string): TokenPayload | null => {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;

    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload)) as TokenPayload;
  } catch {
    return null;
  }
};

const tokenMatchesSession = (token: string, sessionType: SessionType) => {
  const payload = decodeTokenPayload(token);
  if (!payload) return false;

  if (payload.userType) {
    return payload.userType === getApiUserType(sessionType);
  }

  // Backward compatibility for tokens issued before userType was added.
  return sessionType === "customer" ? payload.role == null : typeof payload.role === "string";
};

const revokeRefreshSession = (sessionType: SessionType) => {
  void fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userType: getApiUserType(sessionType) }),
    credentials: "include",
    keepalive: true,
  }).catch(() => undefined);
};

const refreshAccessToken = async (typeUser: UserType): Promise<RefreshResult> => {
  if (typeof window === "undefined") return { accessToken: null };

  const sessionType = getSessionType(typeUser);
  let refreshPromise = refreshPromises[sessionType];

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userType: getApiUserType(sessionType) }),
          credentials: "include",
        });
        const data = await response.json().catch(() => null);

        if (
          response.ok &&
          typeof data?.accessToken === "string" &&
          data?.userType === getApiUserType(sessionType) &&
          tokenMatchesSession(data.accessToken, sessionType)
        ) {
          return { accessToken: data.accessToken };
        }

        return {
          accessToken: null,
          errorCode: response.ok
            ? "SESSION_TYPE_MISMATCH"
            : data?.errorCode,
          message: response.ok
            ? "Phiên đăng nhập không đúng loại tài khoản."
            : data?.message,
        };
      } catch {
        return { accessToken: null };
      } finally {
        refreshPromises[sessionType] = null;
      }
    })();
    refreshPromises[sessionType] = refreshPromise;
  }

  return refreshPromise;
};

const clearUnauthorizedSession = (
  typeUser: UserType,
  message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
  isAccountLocked = false,
) => {
  if (typeof window === "undefined") return;

  const sessionType = getSessionType(typeUser);
  revokeRefreshSession(sessionType);

  if (sessionType === "customer") {
    localStorage.removeItem("customer_access_token");
    localStorage.removeItem("customer");
    window.dispatchEvent(new Event("customer_unauthorized"));
    if (isAccountLocked) {
      toast.error(message);
    } else {
      toast.warning(message);
    }
  } else {
    localStorage.removeItem("employee_access_token");
    localStorage.removeItem("employee");
    localStorage.removeItem("employee_auth_mode");
    Cookies.remove("employee_access_token", { path: "/" });
    sessionStorage.setItem(AUTH_NOTICE_KEY, message);
    window.location.replace("/is");
  }
};

export const http = async (
  endpoint: string,
  options: RequestInit = {},
  typeUser: UserType = null,
  config: HttpConfig = {},
) => {
  const accessTokenKey = getAccessTokenKey(typeUser);
  const storedToken =
    typeof window === "undefined" ? null : localStorage.getItem(accessTokenKey);

  if (
    storedToken &&
    !config.skipUnauthorized &&
    !tokenMatchesSession(storedToken, getSessionType(typeUser))
  ) {
    const message = "Phiên đăng nhập không đúng loại tài khoản. Vui lòng đăng nhập lại.";
    clearUnauthorizedSession(typeUser, message);

    const error = new Error(message) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = 401;
    error.data = { errorCode: "SESSION_TYPE_MISMATCH", message };
    throw error;
  }

  const request = async (token: string | null): Promise<ApiResponse> => {
    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);

    return { response, data };
  };

  let result = await request(storedToken);
  let sessionCleared = false;

  if (
    result.response.status === 401 &&
    storedToken &&
    !config.skipUnauthorized
  ) {
    const refreshResult = await refreshAccessToken(typeUser);

    if (refreshResult.accessToken) {
      localStorage.setItem(accessTokenKey, refreshResult.accessToken);
      result = await request(refreshResult.accessToken);
    } else if (refreshResult.errorCode === "ACCOUNT_LOCKED") {
      clearUnauthorizedSession(
        typeUser,
        refreshResult.message || ACCOUNT_LOCKED_MESSAGE,
        true,
      );
      sessionCleared = true;
    } else if (refreshResult.errorCode === "SESSION_TYPE_MISMATCH") {
      clearUnauthorizedSession(
        typeUser,
        refreshResult.message || "Phiên đăng nhập không đúng loại tài khoản. Vui lòng đăng nhập lại.",
      );
      sessionCleared = true;
    }
  }

  if (!result.response.ok) {
    const isAccountLocked =
      result.response.status === 403 &&
      result.data?.errorCode === "ACCOUNT_LOCKED";

    if (isAccountLocked && !config.skipUnauthorized && !sessionCleared) {
      clearUnauthorizedSession(
        typeUser,
        result.data?.message || ACCOUNT_LOCKED_MESSAGE,
        true,
      );
    } else if (
      result.response.status === 401 &&
      !config.skipUnauthorized &&
      !sessionCleared
    ) {
      clearUnauthorizedSession(typeUser);
    }
    const error = new Error(
      result.data?.message || `API error: ${result.response.status}`,
    ) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = result.response.status;
    error.data = result.data;
    throw error;
  }

  return result.data;
};
