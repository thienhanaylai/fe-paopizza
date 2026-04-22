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
  salary_type: string;
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
    return response.data;
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
  salary_type: string;
  store_id: string;
  username: string;
  password: string;
}) => {
  try {
    console.log(payload);
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
        salary_type: payload.salary_type,
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
