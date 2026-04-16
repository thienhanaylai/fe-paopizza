"use client";
import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

const ACCESS_TOKEN_KEY = "customer_access_token";
const USER_KEY = "customer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type AuthMode = null | "login" | "register";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  point?: number;
  address?: string;
  email?: string;
  createAt?: Date;
  role: null;
}

interface LoginApiResponse {
  message?: string;
  accessToken?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

function readStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Customer;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
interface AuthContextType {
  user: Customer | null;
  accessToken: string | null;
  customerRegister: (fullname: string, phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  customerLogin: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  getInfo: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  authMode: AuthMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Customer | null>(readStoredUser);
  const [accessToken, setAccessToken] = useState<string | null>(readStoredToken);
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  const customerRegister = async (fullname: string, phone: string, password: string) => {
    const endpoint = "/customers/register";
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: fullname, phone, password }),
      });
      const data = await response.json();

      if (response.status === 500) {
        return {
          success: false,
          message: data.error || "Lỗi đăng ký!",
        };
      }
      if (response.status === 400) {
        return {
          success: false,
          message: data.message || "Lỗi đăng ký!",
        };
      }
      return {
        success: true,
        message: data.message || "Đăng ký tài khoản thành công!",
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Không thể kết nối tới máy chủ",
      };
    }
  };

  const customerLogin = async (phone: string, password: string) => {
    const endpoint = "/auth/CustomerLogin";

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: phone, password }),
      });

      const data = (await response.json()) as LoginApiResponse;

      if (response.status === 401) {
        return {
          success: false,
          message: data.message || "Số điện thoại hoặc mật khẩu không chính xác.",
        };
      }
      if (!response.ok || !data.accessToken || !data.user?.id) {
        return {
          success: false,
          message: data.message || "Đăng nhập thất bại",
        };
      }

      setAccessToken(data.accessToken);
      const resp = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.accessToken}`,
        },
      });
      const dataCustomer = await resp.json();

      const dataCus: Customer = {
        id: dataCustomer.data._id,
        name: dataCustomer.data.ref_id.name,
        phone: dataCustomer.data.ref_id.phone,
        point: dataCustomer.data.ref_id.point,
        address: dataCustomer.data.ref_id.address,
        email: dataCustomer.data.ref_id.email,
        createAt: dataCustomer.data.createdAt,
        role: null,
      };
      setUser(dataCus);

      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(dataCus));
      }
      window.location.reload();
      return {
        success: true,
        message: data.message || "Đăng nhập thành công",
      };
    } catch {
      return {
        success: false,
        message: "Không thể kết nối tới máy chủ",
      };
    }
  };

  const getInfo = async () => {
    const endpoint = "/users/me";
    try {
      let token;
      if (typeof window !== "undefined") {
        token = localStorage.getItem(ACCESS_TOKEN_KEY);
      }
      if (!token) {
        console.warn("Chưa đăng nhập!");
        return null;
      }
      const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.status === 401) {
        console.error("Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
        logout();
        return null;
      }

      if (!response.ok) {
        throw new Error(data.message || "Lỗi khi lấy thông tin người dùng");
      }

      return data.data;
    } catch (error) {
      console.error("Lỗi hệ thống khi gọi getInfo:", error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    window.location.reload();
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      authMode,
      setAuthMode,
      customerLogin,
      customerRegister,
      getInfo,
      logout,
      isAuthenticated: !!user,
    }),
    [user, accessToken, authMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return context;
}
