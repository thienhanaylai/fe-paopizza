const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const http = async (endpoint: string, options: RequestInit = {}) => {
  const ACCESS_TOKEN_KEY = "access_token";
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};
