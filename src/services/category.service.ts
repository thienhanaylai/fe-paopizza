const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const getAllCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error("Lỗi khi lấy danh mục");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch categories:", error);
    return [];
  }
};
