import { http } from "../utils/config.api";

export type store_status = "active" | "maintenance" | "close";

export type StoreAddress = { streetNumber: string; district: string; city: string };
export type StoreLocation = { type: "Point"; coordinates: [number, number] };

export type StoreData = {
  _id: string;
  name: string;
  address: StoreAddress;
  employee_count: number;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  location: StoreLocation | null;
  manager_by: { _id: string; name: string; email: string; phone: string; station: string } | null;
  status: store_status;
  isDeleted: boolean;
  createdAt: string;
};

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getAllStore = async (page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    params.append("limit", String(limit || 1000));

    const response = await http(`/api/v1/stores?${params.toString()}`, {
      method: "GET",
    });

    return response as { data: StoreData[]; pagination: PaginationInfo };
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const createStore = async (payload: {
  name: string;
  address: StoreAddress;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  manager_by: string;
  location?: StoreLocation;
  status?: store_status;
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
  address: StoreAddress;
  phone: string;
  email: string;
  time_open: string;
  time_close: string;
  manager_by: string;
  status?: store_status;
  location?: StoreLocation;
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
