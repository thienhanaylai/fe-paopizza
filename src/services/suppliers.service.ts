import { http } from "../utils/config.api";

export type SupplierCategory = "main_ingredient" | "drink" | "seafood" | "vegetable";

export interface Supplier {
  id?: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  supplier_category: SupplierCategory;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  data: Supplier[];
}

export interface SupplierResponse {
  data: Supplier;
}

export interface SupplierCategoryResponse {
  supplier_category: SupplierCategory[];
}

export interface CreateSupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  supplier_category: SupplierCategory;
  isActive?: boolean;
}

export interface UpdateSupplierPayload {
  supplier_id: string;
  name?: string;
  email?: string;
  phone?: string;
  supplier_category?: SupplierCategory;
  isActive?: boolean;
}

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

export const getSupplierCategories = async () => {
  try {
    const response = await http("/api/v1/supplier/categories", {
      method: "GET",
    });
    return response.supplier_category;
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
