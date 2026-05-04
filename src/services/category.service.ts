import { http } from "../utils/config.api";

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
