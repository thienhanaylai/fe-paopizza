import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "store_manager" | "staff" | "customer";
export type EmployeeLevel = "intern" | "fresher" | "junior" | "senior" | "store_manager";
export type EmployeeStation = "kitchen" | "crs" | "delivery" | "management";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  level?: EmployeeLevel;
  station?: EmployeeStation;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  admin: {
    id: "1",
    name: "Admin PaoPizza",
    email: "admin@paopizza.com",
    role: "admin",
    level: "store_manager",
    station: "management",
  },
  store_manager: {
    id: "2",
    name: "Nguyen Van A",
    email: "manager@paopizza.com",
    role: "store_manager",
    level: "store_manager",
    station: "management",
  },
  staff: { id: "3", name: "Tran Thi B", email: "staff@paopizza.com", role: "staff", level: "junior", station: "crs" },
  customer: { id: "4", name: "Le Van C", email: "customer@paopizza.com", role: "customer" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string, role: UserRole): boolean => {
    const mockUser = mockUsers[role];
    if (mockUser) {
      setUser({ ...mockUser, email });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    store_manager: "Quản lý cửa hàng",
    staff: "Nhân viên",
    customer: "Khách hàng",
  };
  return labels[role];
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
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
