import { http } from "../utils/config.api";

export type IngredientData = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  cost_per_unit: number;
  price: number;
  image?: string;
  is_active: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const getAllIngredients = async () => {
  try {
    const data = await http("/api/v1/ingredient", {
      next: { revalidate: 3600 },
    });
    return data.result;
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

export const addIngredient = async (payload: { name: string; cost_per_unit: number; unit: string; category: string }) => {
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
  cost_per_unit: number;
  is_active: boolean;
}) => {
  const response = await http("/api/v1/ingredient/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
};
