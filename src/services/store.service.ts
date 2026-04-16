import { http } from "../utils/config.api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type store_status = "active" | "maintenance" | "close";

export type StoreData1 = {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  manager_by: { _id: string; name: string; email: string; phone: string; station: string } | null;
  status: store_status;
  isDeleted: boolean;
};

export const getAllStore = async () => {
  try {
    const response = await http("/api/v1/stores", {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const createStore = async (payload: {
  name: string;
  address: string;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  manager_by: string;
}) => {
  try {
    const finalPayload = {
      ...payload,
      manager_by: payload.manager_by || null,
    };

    const response = await http("/api/v1/stores/create", {
      method: "POST",
      body: JSON.stringify(finalPayload),
    });

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
