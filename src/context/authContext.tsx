"use client";
import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type EmployeeRole = "admin" | "store_manager" | "staff";
export type AppRole = EmployeeRole | "customer";
export type EmployeeLevel = "intern" | "fresher" | "junior" | "senior" | "store_manager";
export type EmployeeStation = "kitchen" | "crs" | "delivery" | "management";
export type AuthType = "customer" | "employee";

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

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  level?: EmployeeLevel;
  station?: EmployeeStation;
}

export type AuthUser = Customer | Employee;

interface AuthContextType {
  user: AuthUser | null;
  authType: AuthType | null;
  accessToken: string | null;
  customerRegister: (fullname: string, phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  customerLogin: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  employeeLogin: (
    username: string,
    password: string,
    preferredRole?: EmployeeRole,
  ) => Promise<{ success: boolean; message?: string }>;
  getInfo: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  authMode: AuthMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LoginApiResponse {
  message?: string;
  accessToken?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: AppRole | null;
    level?: EmployeeLevel;
    station?: EmployeeStation;
  };
}

const ACCESS_TOKEN_KEY = "access_token";
const USER_KEY = "user";
const AUTH_TYPE_KEY = "user_type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

function readStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function readStoredAuthType(): AuthType | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(AUTH_TYPE_KEY);
  return value === "customer" || value === "employee" ? value : null;
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
    return JSON.parse(raw) as AuthUser;
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
  localStorage.removeItem(AUTH_TYPE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [authType, setAuthType] = useState<AuthType | null>(readStoredAuthType);
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

      setAuthType("customer");
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
        localStorage.setItem(AUTH_TYPE_KEY, "customer");
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

  const employeeLogin = async (username: string, password: string, preferredRole: EmployeeRole = "staff") => {
    const endpoint = "/auth/EmployeeLogin";

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginApiResponse;

      if (!response.ok || !data.accessToken || !data.user?.id) {
        return {
          success: false,
          message: data.message || "Đăng nhập nhân viên thất bại",
        };
      }

      const normalizedRole: EmployeeRole = data.user.role && data.user.role !== "customer" ? data.user.role : preferredRole;

      const mappedUser: Employee = {
        id: data.user.id,
        name: data.user.name || username,
        email: data.user.email || username,
        role: normalizedRole,
        level: data.user.level,
        station: data.user.station,
      };

      setUser(mappedUser);
      setAuthType("employee");
      setAccessToken(data.accessToken);

      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
        localStorage.setItem(AUTH_TYPE_KEY, "employee");
      }

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

      return data;
    } catch (error) {
      console.error("Lỗi hệ thống khi gọi getInfo:", error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthType(null);
    setAccessToken(null);
    window.location.reload();
    clearStoredAuth();
  };

  const value = useMemo(
    () => ({
      user,
      authType,
      accessToken,
      authMode,
      setAuthMode,
      customerLogin,
      customerRegister,
      employeeLogin,
      getInfo,
      logout,
      isAuthenticated: !!user,
    }),
    [user, authType, accessToken, authMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    admin: "Admin",
    store_manager: "Quản lý cửa hàng",
    staff: "Nhân viên",
    customer: "Khách hàng",
  };
  return labels[role];
}

export function getRoleColor(role: AppRole): string {
  const colors: Record<AppRole, string> = {
    admin: "bg-red-100 text-red-700",
    store_manager: "bg-blue-100 text-blue-700",
    staff: "bg-green-100 text-green-700",
    customer: "bg-orange-100 text-orange-700",
  };
  return colors[role];
}

export function getLevelLabel(level: EmployeeLevel): string {
  const labels: Record<EmployeeLevel, string> = {
    intern: "Intern",
    fresher: "Fresher",
    junior: "Junior",
    senior: "Senior",
    store_manager: "Store Manager",
  };
  return labels[level];
}

export function getLevelColor(level: EmployeeLevel): string {
  const colors: Record<EmployeeLevel, string> = {
    intern: "bg-gray-100 text-gray-600",
    fresher: "bg-teal-100 text-teal-700",
    junior: "bg-blue-100 text-blue-700",
    senior: "bg-purple-100 text-purple-700",
    store_manager: "bg-red-100 text-red-700",
  };
  return colors[level];
}

export function getStationLabel(station: EmployeeStation): string {
  const labels: Record<EmployeeStation, string> = {
    kitchen: "Bếp",
    crs: "CRS",
    delivery: "Delivery",
    management: "Quản lý",
  };
  return labels[station];
}

export function getStationColor(station: EmployeeStation): string {
  const colors: Record<EmployeeStation, string> = {
    kitchen: "bg-orange-100 text-orange-700",
    crs: "bg-cyan-100 text-cyan-700",
    delivery: "bg-green-100 text-green-700",
    management: "bg-indigo-100 text-indigo-700",
  };
  return colors[station];
}
