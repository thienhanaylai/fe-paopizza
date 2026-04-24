import { http } from "../utils/config.api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apipaopizza.ngb.id.vn";

export const getAllEmployee = async () => {
  try {
    const response = await http("/api/v1/employees", {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    throw error;
  }
};

export const getEmployeeByRole = async (role: string) => {
  try {
    const response = await http(`/api/v1/employees/role=${role}`, {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    throw error;
  }
};
