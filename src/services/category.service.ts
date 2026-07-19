import { http } from "../utils/config.api";

export type CategoryData = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const getAllCategories = async () => {
  try {
    const data = await http("/api/v1/categories", {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    throw error;
  }
};

export const createCategory = async (payload: { name: string; slug: string; icon?: string }) => {
  const response = await http("/api/v1/categories/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const updateCategory = async (payload: { category_id: string; name?: string; slug?: string; icon?: string }) => {
  const response = await http("/api/v1/categories/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const updateCategoryActive = async (payload: { category_id: string; isActive: boolean }) => {
  const response = await http("/api/v1/categories/active", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const deleteCategory = async (payload: { category_id: string }) => {
  const response = await http("/api/v1/categories/deleted", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const createCategoryFormData = async (formData: FormData) => {
  const response = await http("/api/v1/categories/create", {
    method: "POST",
    body: formData,
  });
  return response.data;
};

export const updateCategoryFormData = async (formData: FormData) => {
  const response = await http("/api/v1/categories/update", {
    method: "POST",
    body: formData,
  });
  return response.data;
};
