import { http } from "../utils/config.api";

export type store_status = "active" | "maintenance" | "close";

export type StoreData = {
  _id: string;
  name: string;
  address: { streetNumber: string; district: string; city: string };
  employee_count: number;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  location: { type: string; coordinates: [number] } | null;
  manager_by: { _id: string; name: string; email: string; phone: string; station: string } | null;
  status: store_status;
  isDeleted: boolean;
  createdAt: string;
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
      manager_by: payload.manager_by && payload.manager_by !== "null" ? payload.manager_by : null,
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

export const updateStore = async (payload: {
  store_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  manager_by: string;
  status?: store_status;
}) => {
  try {
    const finalPayload = {
      ...payload,
      manager_by: payload.manager_by && payload.manager_by !== "null" ? payload.manager_by : null,
    };

    const response = await http(
      "/api/v1/stores/update",
      {
        method: "POST",
        body: JSON.stringify(finalPayload),
      },
      "",
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
