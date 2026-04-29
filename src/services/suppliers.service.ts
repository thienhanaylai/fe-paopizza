import { http } from "../utils/config.api";



export const getAllSupplier = async () => {
  try {
    const response = await http("/api/v1/supplier", {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
