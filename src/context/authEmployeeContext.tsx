"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { http } from "../utils/config.api";

const ACCESS_TOKEN_KEY = "employee_access_token";
const USER_KEY = "employee";
const AUTH_MODE_KEY = "employee_auth_mode";

export type EmployeeRole = null | "admin" | "manager" | "staff";
export type EmployeeLevel = "intern" | "fresher" | "junior" | "senior" | "store_manager";
export type EmployeeStation = "store_manager" | "manager" | "cashier" | "kitchen" | "delivery" | "barista";

//auth mode dùng để xác định đăng nhập chế độ nào
type AuthMode = null | "admin" | "manager" | "staff";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  level?: EmployeeLevel;
  station?: EmployeeStation;
  store_id?: string;
  employee_id?: string;
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
  localStorage.removeItem(AUTH_MODE_KEY);
}

function readStoredAuthMode(): AuthMode {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(AUTH_MODE_KEY);
  if (raw === "admin" || raw === "manager" || raw === "staff") {
    return raw;
  }

  return null;
}
interface AuthContextType {
  user: Employee | null;
  accessToken: string | null;
  isSessionReady: boolean;
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
  const [user, setUser] = useState<Employee | null>(() => readStoredUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredToken());
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(() => readStoredAuthMode() ?? readStoredUser()?.role ?? null);

  const employeeLogin = async (username: string, password: string, preferredRole: AuthMode = "staff") => {
    const endpoint = "/auth/EmployeeLogin";

    try {
      const data = (await http(
        `/api/v1${endpoint}`,
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
        },
        null,
        { skipUnauthorized: true },
      )) as LoginApiResponse;

      if (!data.accessToken || !data.user?.id) {
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
      let storeId: string | undefined;
      let emp_id: string | undefined;
      let info = {};
      try {
        const infoData = await http(
          "/api/v1/users/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
            },
          },
          null,
          { skipUnauthorized: true },
        );
        info = infoData.data.ref_id;
        const storeRef = infoData?.data?.ref_id?.store_id;
        storeId = typeof storeRef === "string" ? storeRef : storeRef?._id;
        emp_id = infoData?.data?.ref_id?._id;
      } catch {
        storeId = undefined;
      }

      const mappedUser: Employee = {
        id: data.user.id,
        name: data.user.name || username,
        email: data.user.email || username,
        role: normalizedRole,
        level: data.user.level,
        station: info?.station || "",
        store_id: storeId,
        employee_id: emp_id,
      };

      setUser(mappedUser);

      setAccessToken(data.accessToken);
      if (data.accessToken) {
        Cookies.set("employee_access_token", data.accessToken, { expires: 7, path: "/" });
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
        localStorage.setItem(AUTH_MODE_KEY, preferredRole);
      }

      return {
        success: true,
        message: data.message || "Đăng nhập thành công",
      };
    } catch (error) {
      const status = (error as { status?: number; data?: { message?: string } })?.status;
      const message = (error as { data?: { message?: string } })?.data?.message;

      if (status === 401 || status === 404) {
        return {
          success: false,
          message: message || "Số điện thoại hoặc mật khẩu không chính xác.",
        };
      }

      if (status === 403) {
        return {
          success: false,
          message: message || "Tài khoản bạn không có quyền truy cập.",
        };
      }

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
      const data = await http(`/api/v1${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    window.location.replace("/is");
  };

  useEffect(() => {
    let isActive = true;
    const storedToken = readStoredToken();

    if (!storedToken) {
      setUser(null);
      setAccessToken(null);
      setIsSessionReady(true);
      return () => {
        isActive = false;
      };
    }

    const validateSession = async () => {
      try {
        await http("/api/v1/users/me", { method: "GET" });

        if (isActive) {
          setAccessToken(readStoredToken());
        }
      } catch (error) {
        if ((error as { status?: number })?.status === 401 && isActive) {
          setUser(null);
          setAccessToken(null);
          clearStoredAuth();
        }
      } finally {
        if (isActive) {
          setIsSessionReady(true);
        }
      }
    };

    void validateSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (authMode) {
      localStorage.setItem(AUTH_MODE_KEY, authMode);
    } else {
      localStorage.removeItem(AUTH_MODE_KEY);
    }
  }, [authMode]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isSessionReady,
      authMode,
      setAuthMode,
      employeeLogin,
      getInfo,
      logout,
      isAuthenticated: !!user,
    }),
    [user, accessToken, isSessionReady, authMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useEmployeeAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return context;
}

export function getRoleLabel(role: EmployeeRole): string {
  if (!role) return "N/A";
  const labels: Record<NonNullable<EmployeeRole>, string> = {
    admin: "Admin",
    manager: "Quản lý cửa hàng",
    staff: "Nhân viên",
  };
  return labels[role];
}

export function getRoleColor(role: EmployeeRole): string {
  if (!role) return "bg-gray-100 text-gray-600";
  const colors: Record<NonNullable<EmployeeRole>, string> = {
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
    cashier: "Cashier",
    delivery: "Delivery",
    manager: "Quản lý",
    barista: "Barista",
    store_manager: "Cừa hàng trưởng",
  };
  return labels[station];
}

export function getStationColor(station: EmployeeStation): string {
  const colors: Record<EmployeeStation, string> = {
    kitchen: "bg-orange-100 text-orange-700",
    cashier: "bg-cyan-100 text-cyan-700",
    delivery: "bg-green-100 text-green-700",
    manager: "bg-indigo-100 text-indigo-700",
    barista: "bg-teal-100 text-teal-700",
    store_manager: "bg-red-100 text-red-700",
  };
  return colors[station];
}
