import { http } from "../utils/config.api";

export type IngredientData = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  costPerUnit: number;
  price: number;
  image?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getAllIngredients = async (page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    params.append("limit", String(limit || 1000));

    const data = await http(`/api/v1/ingredient?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    return data as { data: IngredientData[]; pagination: PaginationInfo };
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    throw error;
  }
};

export const getCategoryIngredient = async () => {
  try {
    const data = await http("/api/v1/ingredient/category", {
      next: { revalidate: 3600 },
    });
    return data.result;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    throw error;
  }
};

export const getUnitIngredient = async () => {
  try {
    const data = await http("/api/v1/ingredient/unit", {
      next: { revalidate: 3600 },
    });
    return data.result;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    throw error;
  }
};

export const addIngredient = async (payload: {
  name: string;
  costPerUnit: number;
  price?: number;
  unit: string;
  category: string;
}) => {
  const response = await http("/api/v1/ingredient/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};

export const deleteIngredient = async (payload: { ingredient_id: string }) => {
  const response = await http("/api/v1/ingredient/deleted", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const updateIngredient = async (payload: {
  ingredient_id: string;
  name: string;
  unit: string;
  category: string;
  costPerUnit: number;
  price?: number;
  isActive: boolean;
}) => {
  const response = await http("/api/v1/ingredient/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};
