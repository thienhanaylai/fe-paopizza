import { http } from "../utils/config.api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface RecipeItemPayload {
  ingredient_id: string;
  quantity: number;
  unit: string;
}

export interface VariantPayload {
  sku: string;
  size: string;
  price: number;
  recipe: RecipeItemPayload[];
  imageFile: File;
}

export interface AddProductPayload {
  name: string;
  category: string;
  description: string;
  variants: VariantPayload[];
}

export const getAllProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error("Lỗi khi lấy danh sách sản phẩm");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    return [];
  }
};
export const addProduct = async (payload: AddProductPayload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("category", payload.category);
  if (payload.description) {
    formData.append("description", payload.description);
  }

  const variantsTextData = payload.variants.map(v => ({
    sku: v.sku,
    size: v.size,
    price: Number(v.price),
    recipe: v.recipe,
  }));

  formData.append("variants", JSON.stringify(variantsTextData));

  payload.variants.forEach(v => {
    if (v.imageFile) {
      formData.append("images", v.imageFile);
    }
  });

  const response = await http("/api/v1/products/create", {
    method: "POST",
    body: formData,
  });
  console.log(response);
  return response.data;
};
