import { toast } from "sonner";

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

let refreshPromise: Promise<string | null> | null = null;

const getAccessTokenKey = (typeUser: UserType) =>
  typeUser === "customer" ? "customer_access_token" : "employee_access_token";

const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json().catch(() => null);

        return response.ok && typeof data?.accessToken === "string"
          ? data.accessToken
          : null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

const clearUnauthorizedSession = (typeUser: UserType) => {
  if (typeof window === "undefined") return;

  if (typeUser === "customer") {
    localStorage.removeItem("customer_access_token");
    localStorage.removeItem("customer");
    window.dispatchEvent(new Event("customer_unauthorized"));
  } else {
    localStorage.removeItem("employee_access_token");
    localStorage.removeItem("employee");
    localStorage.removeItem("employee_auth_mode");
    window.location.replace("/is");
  }

  toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
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

  if (
    result.response.status === 401 &&
    storedToken &&
    !config.skipUnauthorized
  ) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      localStorage.setItem(accessTokenKey, newAccessToken);
      result = await request(newAccessToken);
    }
  }

  if (!result.response.ok) {
    if (result.response.status === 401 && !config.skipUnauthorized) {
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
