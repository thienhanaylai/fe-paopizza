import { http } from "../utils/config.api";

export interface RecipeItemPayload {
  ingredient_id: string;
  quantity: number;
  unit: string;
}

export interface VariantPayload {
  sku: string;
  size: string;
  price: number;
  disscountType?: "percent" | "amount";
  discount?: number;
  crust: string[];
  recipe: RecipeItemPayload[];
  imageFile?: File | null;
}

export interface UpdateVariantPayload {
  sku: string;
  size: string;
  price: number;
  disscountType?: "percent" | "amount";
  discount?: number;
  crust?: string[];
  recipe: RecipeItemPayload[];
  image?: {
    url?: string;
    public_id?: string;
  };
  imageFile?: File;
}

export interface AddProductPayload {
  name: string;
  category: string;
  description: string;
  launchDate?: string;
  variants: VariantPayload[];
}

export interface UpdateProductPayload {
  product_id: string;
  name?: string;
  category?: string;
  description?: string;
  launchDate?: string;
  variants?: UpdateVariantPayload[];
}

export const getAllProducts = async () => {
  try {
    const data = await http("/api/v1/products", {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    throw error;
  }
};

export const getAllProductsActive = async () => {
  try {
    const data = await http("/api/v1/products/active", {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    throw error;
  }
};

export const addProduct = async (payload: AddProductPayload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("category", payload.category);
  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.launchDate) {
    formData.append("launchDate", payload.launchDate);
  }

  const variantsTextData = payload.variants.map(v => ({
    sku: v.sku,
    size: v.size,
    price: Number(v.price),
    disscountType: v.disscountType,
    discount: v.discount,
    crust: v.crust,
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
  console.log(response.data);
  return response.data;
};

export const updateProduct = async (payload: UpdateProductPayload) => {
  if (!payload.product_id) {
    throw new Error("Thiếu product_id!");
  }

  const formData = new FormData();

  formData.append("product_id", payload.product_id);
  if (payload.name !== undefined) {
    formData.append("name", payload.name);
  }
  if (payload.category !== undefined) {
    formData.append("category", payload.category);
  }
  if (payload.description !== undefined) {
    formData.append("description", payload.description);
  }
  if (payload.launchDate !== undefined) {
    formData.append("launchDate", payload.launchDate);
  }

  if (payload.variants && payload.variants.length > 0) {
    const variantsTextData = payload.variants.map(v => ({
      sku: v.sku,
      size: v.size,
      price: Number(v.price),
      disscountType: v.disscountType,
      discount: v.discount,
      crust: v.crust,
      recipe: v.recipe,
      image: v.image,
    }));

    formData.append("variants", JSON.stringify(variantsTextData));

    payload.variants.forEach(v => {
      if (v.imageFile) {
        formData.append("images", v.imageFile);
      }
    });
  }

  const response = await http("/api/v1/products/update", {
    method: "POST",
    body: formData,
  });

  return response.data;
};

export const updateStatusProduct = async (product_id: string) => {
  const response = await http(
    `/api/v1/products/updateStatus/${product_id}`,
    {
      method: "PATCH",
    },
    "",
  );
  return response.data;
};

export const deletedProduct = async (product_id: string) => {
  const response = await http(
    `/api/v1/products/deleted/${product_id}`,
    {
      method: "PATCH",
    },
    "",
  );
  return response.data;
};

export const getProductById = async (product_id: string) => {
  try {
    const data = await http(`/api/v1/products/${product_id}`, {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch product by id:", error);
    throw error;
  }
};

export const getProductsByCategory = async (category_id: string) => {
  try {
    const data = await http(`/api/v1/products/category/${category_id}`, {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch products by category:", error);
    throw error;
  }
};
