import { http } from "../utils/config.api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const getAllIngredients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ingredient`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách nguyên liệu`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    return [];
  }
};

export const getCategoryIngredient = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ingredient/category`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách nguyên liệu`);
    }

    const data = await response.json();

    return data.result;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    return [];
  }
};

export const getUnitIngredient = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ingredient/unit`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách đơn vị`);
    }

    const data = await response.json();

    return data.result;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    return [];
  }
};

export const addIngredient = async (payload: { name: string; unit: string; category: string }) => {
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
