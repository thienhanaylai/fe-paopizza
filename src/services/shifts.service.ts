import { http } from "../utils/config.api";

export type ShiftStation = "manager" | "store_manager" | "cashier" | "kitchen" | "delivery" | "barista";
export type ShiftEmployeeStatus = "PENDING" | "APPROVED" | "WORKING" | "DONE";
export type ShiftStatus = "pending" | "open" | "close";

export interface ShiftStaffInvolved {
  check_in: string | null;
  check_out: string | null;
}

export interface ShiftEmployeeRef {
  _id: string;
  name?: string;
  phone?: string;
  station?: string;
}

export interface ShiftStoreRef {
  _id: string;
  name?: string;
}

export interface ShiftEmployeeItem {
  employee_id: string | ShiftEmployeeRef;
  station: ShiftStation;
  status: ShiftEmployeeStatus;
  staff_involved: ShiftStaffInvolved;
}

export interface Shift {
  _id: string;
  store_id: string | ShiftStoreRef;
  date: string;
  start_time: string;
  end_time: string;
  shift_status?: ShiftStatus;
  list_employee: ShiftEmployeeItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftResponse {
  data: Shift;
  message?: string;
}

export interface ShiftListResponse {
  data: Shift[];
  message?: string;
}

export interface ShiftQueryParams {
  store_id?: string;
  employee_id?: string;
  status?: ShiftEmployeeStatus;
  from_date?: string;
  to_date?: string;
}

export interface CreateShiftPayload {
  store_id: string;
  date: string;
  start_time: string;
  end_time: string;
  list_employee?: ShiftEmployeeItem[];
}

export interface RegisterShiftPayload {
  employee_id?: string;
  store_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  station?: ShiftStation;
}

export interface UpdateShiftPayload {
  shift_id: string;
  store_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  list_employee?: ShiftEmployeeItem[];
}

export interface AssignEmployeePayload {
  shift_id: string;
  employee_id: string;
  station: ShiftStation;
  status?: ShiftEmployeeStatus;
}

export interface UpdateEmployeeInShiftPayload {
  shift_id: string;
  employee_id: string;
  station?: ShiftStation;
  status?: ShiftEmployeeStatus;
  check_in?: string | null;
  check_out?: string | null;
}

export interface RemoveEmployeeFromShiftPayload {
  shift_id: string;
  employee_id: string;
}

const buildQueryString = (params?: ShiftQueryParams) => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const getShifts = async (params?: ShiftQueryParams, typeUser?: string): Promise<Shift[]> => {
  try {
    const response = (await http(
      `/api/v1/shifts${buildQueryString(params)}`,
      { method: "GET" },
      typeUser || null,
    )) as ShiftListResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch shifts:", error);
    throw error;
  }
};

export const getShiftById = async (shiftId: string, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(`/api/v1/shifts/${shiftId}`, { method: "GET" }, typeUser || null)) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch shift:", error);
    throw error;
  }
};

export const createShift = async (payload: CreateShiftPayload, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(
      "/api/v1/shifts/create",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser || null,
    )) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi tạo ca:", error);
    throw error;
  }
};

export const registerShift = async (payload: RegisterShiftPayload, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(
      "/api/v1/shifts/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser || null,
    )) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi đăng ký ca:", error);
    throw error;
  }
};

export const updateShift = async (payload: UpdateShiftPayload, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(
      "/api/v1/shifts/update",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser || null,
    )) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật ca:", error);
    throw error;
  }
};

export const deleteShift = async (shiftId: string, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(`/api/v1/shifts/${shiftId}`, { method: "DELETE" }, typeUser || null)) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi xóa ca:", error);
    throw error;
  }
};

export const assignEmployeeToShift = async (payload: AssignEmployeePayload, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(
      "/api/v1/shifts/assign",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser || null,
    )) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi gán nhân viên:", error);
    throw error;
  }
};

export const updateEmployeeInShift = async (payload: UpdateEmployeeInShiftPayload, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(
      "/api/v1/shifts/updateEmployee",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      typeUser || null,
    )) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật nhân viên trong ca:", error);
    throw error;
  }
};

export const removeEmployeeFromShift = async (payload: RemoveEmployeeFromShiftPayload, typeUser?: string): Promise<Shift> => {
  try {
    const response = (await http(
      "/api/v1/shifts/removeEmployee",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      typeUser || null,
    )) as ShiftResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi xóa nhân viên khỏi ca:", error);
    throw error;
  }
};
