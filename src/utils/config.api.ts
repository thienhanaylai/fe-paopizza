const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const http = async (endpoint: string, options: RequestInit = {}, typeUser: string | null = null) => {
  let ACCESS_TOKEN_KEY = "employee_access_token";
  if (typeUser === "customer") ACCESS_TOKEN_KEY = "customer_access_token";
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

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

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};
