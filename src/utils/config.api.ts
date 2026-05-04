import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const http = async (
  endpoint: string,
  options: RequestInit = {},
  typeUser: string | null = null,
  config: { skipUnauthorized?: boolean } = {},
) => {
  let ACCESS_TOKEN_KEY = "employee_access_token";
  if (typeUser === "customer") {
    ACCESS_TOKEN_KEY = "customer_access_token";
  }
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const finalHeaders = {
    ...headers,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: finalHeaders,
  });

  let data: any = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !config.skipUnauthorized) {
      if (typeof window !== "undefined") {
        if (typeUser === "customer") {
          localStorage.removeItem("customer_access_token");
          localStorage.removeItem("customer");
          window.dispatchEvent(new Event("customer_unauthorized"));
        } else {
          localStorage.removeItem("employee_access_token");
          localStorage.removeItem("employee");
          localStorage.removeItem("employee_auth_mode");
          const loginPath = "/is";
          window.location.replace(loginPath);
        }

        toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      }
    }
    const error = new Error(data?.message || `API error: ${response.status}`) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
