import { http } from "../utils/config.api";

export interface InventoryIngredientRef {
  _id: string;
  name: string;
  unit: string;
  category: string;
  costPerUnit: number;
}

export interface InventorySupplierRef {
  _id: string;
  name: string;
}

export interface InventoryBatch {
  _id: string;
  supplier_id: InventorySupplierRef | string | null;
  expiry_date: string;
  quantity: number;
}

export interface InventoryIngredientItem {
  _id: string;
  ingredient_id: InventoryIngredientRef;
  current_stock: number;
  min_stock_level: number;
  batches?: InventoryBatch[];
}

export interface InventoryStoreRef {
  _id: string;
  name: string;
}

export interface Inventory {
  _id: string;
  store_id: InventoryStoreRef;
  ingredients: InventoryIngredientItem[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface InventoryResponse {
  data: Inventory;
  message?: string;
}

export interface UpdateInventoryPayload {
  store_id: string;
  ingredient_id: string;
  current_stock?: number;
  min_stock_level?: number;
}

interface InventoryStockPayloadBase {
  store_id: string;
  ingredient_id: string;
  quantity: number;
  min_stock_level?: number;
}

export type UpdateInventoryStockPayload = InventoryStockPayloadBase &
  (
    | { type: "add"; supplier_id: string; expiry_date: string }
    | { type: "subtract"; supplier_id?: never; expiry_date?: never }
    | { type: "set"; supplier_id?: never; expiry_date?: never }
  );

export interface SummaryShiftItemPayload {
  ingredient_id?: string;
  current_stock: number;
}

export interface SummaryShiftPayload {
  store_id: string;
  employee_id?: string;
  payload: SummaryShiftItemPayload[] | Record<string, number>;
}

export const getInventory = async (store_id: string | null, typeUser: string): Promise<Inventory> => {
  try {
    const response = await http(
      `/api/v1/inventory/${store_id}`,
      {
        method: "GET",
      },
      typeUser,
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const createOrUpdateInventory = async (payload: UpdateInventoryPayload, typeUser: string): Promise<Inventory> => {
  try {
    const response = (await http(
      "/api/v1/inventory/update",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    )) as InventoryResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const updateInventoryStock = async (payload: UpdateInventoryStockPayload, typeUser: string): Promise<Inventory> => {
  try {
    const response = (await http(
      "/api/v1/inventory/stock",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    )) as InventoryResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const summaryShift = async (payload: SummaryShiftPayload, typeUser: string): Promise<Inventory> => {
  try {
    const response = (await http(
      "/api/v1/inventory/summaryShift",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    )) as InventoryResponse;

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
