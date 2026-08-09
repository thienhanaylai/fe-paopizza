import { http } from "../utils/config.api";
import { IngredientData } from "./ingredient.service";

export type SupplierCategory = "dough" | "drink" | "seafood" | "vegetable" | "meat" | "sauce" | "other";

export interface Supplier {
  id?: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  supplierCategory: SupplierCategory;
  supplierIngredients: IngredientData[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOption {
  _id: string;
  name: string;
  supplierIngredients: Array<Pick<IngredientData, "_id" | "name" | "unit" | "category"> | string>;
}

export interface SupplierListResponse {
  data: Supplier[];
}

export interface SupplierResponse {
  data: Supplier;
}

export interface SupplierCategoryResponse {
  supplierCategory: SupplierCategory[];
}

export interface CreateSupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  supplierCategory: SupplierCategory;
  isActive?: boolean;
  supplierIngredients?: string[];
}

export interface UpdateSupplierPayload {
  supplier_id: string;
  name?: string;
  email?: string;
  phone?: string;
  supplierCategory?: SupplierCategory;
  isActive?: boolean;
  supplierIngredients?: string[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getAllSupplier = async (page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    params.append("limit", String(limit || 1000));

    const response = await http(`/api/v1/supplier?${params.toString()}`, {
      method: "GET",
    });
    return response as { data: Supplier[]; pagination: PaginationInfo };
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const getSupplierOptions = async () => {
  try {
    const response = await http("/api/v1/supplier/options", {
      method: "GET",
    });
    return response as { data: SupplierOption[] };
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const getSupplierCategories = async () => {
  try {
    const response = await http("/api/v1/supplier/categories", {
      method: "GET",
    });
    return response.supplierCategory;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const getSupplierById = async (supplierId: string) => {
  try {
    const response = await http(`/api/v1/supplier/${supplierId}`, {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const createSupplier = async (payload: CreateSupplierPayload) => {
  try {
    const response = await http("/api/v1/supplier/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const updateSupplier = async (payload: UpdateSupplierPayload) => {
  try {
    const response = await http("/api/v1/supplier/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const deleteSupplier = async (supplierId: string) => {
  try {
    const response = await http(`/api/v1/supplier/deleted/${supplierId}`, {
      method: "PATCH",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
