import { http } from "../utils/config.api";

export type UserType = "Employee" | "Customer";

export type Role = null | "admin" | "manager" | "staff";

export type Employee = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  salary: number;
  birthday: string;
  createdAt: string;
  address: string;
  station: string;
  salaryType: string;
  store_id: string;
};

export type Customer = {
  name: string;
  email: string;
  phone: string;
  point: number;
  address: string;
  _id: string;
  createdAt: string;
};

export interface User {
  _id: string;
  role: Role;
  user_type: UserType;
  isDeleted: boolean;
  status: boolean;
  username: string;
  ref_id: Customer | Employee;
}
export const getAllUser = async () => {
  try {
    const response = await http("/api/v1/users", {
      method: "GET",
    });
    const data = response.data;
    return Array.isArray(data) ? data.filter(user => user?.isDeleted === false) : data;
  } catch (error) {
    console.error("Lỗi fetch list user:", error);
    throw error;
  }
};

export const createUser = async (payload: {
  role: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  station: string;
  salary: number;
  salaryType: string;
  store_id: string;
  username: string;
  password: string;
}) => {
  try {
    if (payload.role === "customer") {
      const finalPayload = {
        password: payload.password,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        email: payload.email,
      };
      const response = await http(
        "/api/v1/customers/register",
        {
          method: "POST",
          body: JSON.stringify(finalPayload),
        },
        "",
      );
      return response;
    } else {
      const finalPayload = {
        username: payload.username,
        password: payload.password,
        store_id: payload.store_id,
        name: payload.name,
        birthday: payload.birthday,
        email: payload.email,
        phone: payload.phone,
        station: payload.station,
        salaryType: payload.salaryType,
        role: payload.role,
        address: payload.address,
        salary: payload.salary,
      };
      const response = await http(
        "/api/v1/employees/create",
        {
          method: "POST",
          body: JSON.stringify(finalPayload),
        },
        "",
      );
      return response;
    }
  } catch (error) {
    console.error("Lỗi fetch list user:", error);
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  payload: {
    username?: string;
    role?: Role | null;
    status?: boolean;
  },
) => {
  try {
    const response = await http(`/api/v1/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi update user:", error);
    throw error;
  }
};

export const updateUserStatus = async (
  userId: string,
  payload: {
    status: boolean;
  },
) => {
  try {
    const response = await http(`/api/v1/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi update status user:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const response = await http(`/api/v1/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ isDeleted: true }),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi delete user:", error);
    throw error;
  }
};

export const updateEmployee = async (payload: {
  employee_id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthday?: string;
  station?: string;
  salary?: number;
  salaryType?: string;
  store_id?: string | null;
}) => {
  try {
    const response = await http("/api/v1/employees/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi update employee:", error);
    throw error;
  }
};

export const updateCustomer = async (payload: {
  user_id: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
}) => {
  try {
    const response = await http("/api/v1/customers/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi update customer:", error);
    throw error;
  }
};
