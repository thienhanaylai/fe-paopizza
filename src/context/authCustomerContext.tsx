"use client";
import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { http } from "../utils/config.api";

const ACCESS_TOKEN_KEY = "customer_access_token";
const USER_KEY = "customer";

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
  getInfo: () => Promise<{
    success: boolean;
    message?: string;
    ref_id?: {
      _id: string;
      name: string;
    };
  }>;
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
      const data = await http(
        `/api/v1${endpoint}`,
        {
          method: "POST",
          body: JSON.stringify({ name: fullname, phone, password }),
        },
        "customer",
        { skipUnauthorized: true },
      );
      return {
        success: true,
        message: data.message || "Đăng ký tài khoản thành công!",
        data,
      };
    } catch (error) {
      const status = (error as { status?: number; data?: { message?: string; error?: string } })?.status;
      const errData = (error as { data?: { message?: string; error?: string } })?.data;
      if (status === 500) {
        return {
          success: false,
          message: errData?.error || "Lỗi đăng ký!",
        };
      }
      if (status === 400) {
        return {
          success: false,
          message: errData?.message || "Lỗi đăng ký!",
        };
      }
      return {
        success: false,
        message: "Không thể kết nối tới máy chủ",
      };
    }
  };

  const customerLogin = async (phone: string, password: string) => {
    const endpoint = "/auth/CustomerLogin";

    try {
      const data = (await http(
        `/api/v1${endpoint}`,
        {
          method: "POST",
          body: JSON.stringify({ username: phone, password }),
        },
        "customer",
        { skipUnauthorized: true },
      )) as LoginApiResponse;

      if (!data.accessToken || !data.user?.id) {
        return {
          success: false,
          message: data.message || "Đăng nhập thất bại",
        };
      }

      setAccessToken(data.accessToken);
      const dataCustomer = await http(
        "/api/v1/users/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        },
        "customer",
        { skipUnauthorized: true },
      );

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
    } catch (error) {
      const status = (error as { status?: number; data?: { message?: string } })?.status;
      const message = (error as { data?: { message?: string } })?.data?.message;

      if (status === 401) {
        return {
          success: false,
          message: message || "Số điện thoại hoặc mật khẩu không chính xác.",
        };
      }
      if (status === 403) {
        return {
          success: false,
          message: message || "Vui lòng dùng tài khoản khách hàng để đăng nhập.",
        };
      }
      return {
        success: false,
        message: "Không thể kếtzzzz nối tới máy chủ",
      };
    }
  };

  const getInfo = async () => {
    const endpoint = "/users/me";
    try {
      const data = await http(
        `/api/v1${endpoint}`,
        {
          method: "GET",
        },
        "customer",
      );

      return data.data;
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 401) {
        console.error("Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
        logout();
        return null;
      }

      console.error("Lỗi hệ thống khi gọi getInfo:", error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    clearStoredAuth();
    window.location.reload();
    window.location.replace("/");
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
