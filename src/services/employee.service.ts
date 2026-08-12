import { http } from "../utils/config.api";

export type EmployeeStation = "manager" | "store_manager" | "cashier" | "kitchen" | "delivery" | "barista";
export type EmployeeRole = "admin" | "manager" | "staff";
export type SalaryType = "hourly" | "monthly";

export interface CreateEmployeePayload {
  username: string;
  password: string;
  store_id?: string;
  name: string;
  birthday: string;
  email: string;
  phone: string;
  station: EmployeeStation;
  salaryType: SalaryType;
  role: EmployeeRole;
  address?: string;
  salary?: number;
}

export interface UpdateEmployeePayload {
  employee_id: string;
  store_id?: string | null;
  name?: string;
  birthday?: string;
  email?: string;
  phone?: string;
  station?: string;
  salaryType?: string;
  role?: string;
  address?: string;
  salary?: number;
  status?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EmployeeDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  station?: EmployeeStation;
  salaryType?: SalaryType;
  salary?: number;
  status?: boolean;
  address?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  store_id?:
    | string
    | {
        _id: string;
        name: string;
      };
}

export const getAllEmployee = async (page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    params.append("limit", String(limit || 1000));

    const response = await http(`/api/v1/employees?${params.toString()}`, {
      method: "GET",
    });
    return response as { data: EmployeeDetail[]; pagination: PaginationInfo };
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
};

export const getEmployeesByStore = async (storeId: string) => {
  try {
    const response = await http(`/api/v1/employees/store/${storeId}`, {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
};

export const getEmployeeById = async (employeeId: string): Promise<EmployeeDetail> => {
  const response = await http(`/api/v1/employees/${employeeId}`, {
    method: "GET",
  });
  return response.data as EmployeeDetail;
};

export const getEmployeeByRole = async (role: string) => {
  try {
    const response = await http(`/api/v1/employees/role=${role}`, {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
};

export const createEmployee = async (payload: CreateEmployeePayload) => {
  try {
    const response = await http("/api/v1/employees/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
};

export const updateEmployee = async (payload: UpdateEmployeePayload) => {
  try {
    const response = await http("/api/v1/employees/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: string) => {
  try {
    const response = await http(`/api/v1/employees/delete/${employeeId}`, {
      method: "POST",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi:", error);
    throw error;
  }
};
