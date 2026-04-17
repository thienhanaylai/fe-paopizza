"use client";
import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";
import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "employee_access_token";
const USER_KEY = "employee";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type EmployeeRole = null | "admin" | "manager" | "staff";
export type EmployeeLevel = "intern" | "fresher" | "junior" | "senior" | "store_manager";
export type EmployeeStation = "kitchen" | "crs" | "delivery" | "management";

//auth mode dùng để xác định đăng nhập chế độ nào
type AuthMode = null | "admin" | "manager" | "staff";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  level?: EmployeeLevel;
  station?: EmployeeStation;
}

interface LoginApiResponse {
  message?: string;
  accessToken?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: EmployeeRole | null;
    level?: EmployeeLevel;
    station?: EmployeeStation;
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
    return JSON.parse(raw) as Employee;
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
  user: Employee | null;
  accessToken: string | null;
  employeeLogin: (
    username: string,
    password: string,
    preferredRole?: AuthMode,
  ) => Promise<{ success: boolean; message?: string }>;
  getInfo: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  authMode: AuthMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(readStoredUser);
  const [accessToken, setAccessToken] = useState<string | null>(readStoredToken);
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  const employeeLogin = async (username: string, password: string, preferredRole: AuthMode = "staff") => {
    const endpoint = "/auth/EmployeeLogin";

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginApiResponse;

      if (response.status === 401 || response.status === 404) {
        return {
          success: false,
          message: data.message || "Số điện thoại hoặc mật khẩu không chính xác.",
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          message: data.message || "Tài khoản bạn không có quyền truy cập.",
        };
      }
      if (!response.ok || !data.accessToken || !data.user?.id) {
        return {
          success: false,
          message: data.message || "Đăng nhập nhân viên thất bại",
        };
      }
      if (data.user.role != preferredRole) {
        return {
          success: false,
          message: "Bạn không có quyền đăng nhập ở vai trò này!",
        };
      } else setAuthMode(preferredRole);

      const normalizedRole: EmployeeRole = data.user.role ? data.user.role : preferredRole;

      const mappedUser: Employee = {
        id: data.user.id,
        name: data.user.name || username,
        email: data.user.email || username,
        role: normalizedRole,
        level: data.user.level,
        station: data.user.station,
      };

      setUser(mappedUser);

      setAccessToken(data.accessToken);
      if (data.accessToken) {
        Cookies.set("employee_access_token", data.accessToken, { expires: 7, path: "/" });
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
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
      employeeLogin,
      getInfo,
      logout,
      isAuthenticated: !!user,
    }),
    [user, accessToken, authMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useEmployeeAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return context;
}

export function getRoleLabel(role: EmployeeRole): string {
  const labels: Record<EmployeeRole, string> = {
    admin: "Admin",
    manager: "Quản lý cửa hàng",
    staff: "Nhân viên",
  };
  return labels[role];
}

export function getRoleColor(role: EmployeeRole): string {
  const colors: Record<EmployeeRole, string> = {
    admin: "bg-red-100 text-red-700",
    manager: "bg-blue-100 text-blue-700",
    staff: "bg-green-100 text-green-700",
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
