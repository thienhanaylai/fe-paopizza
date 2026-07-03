import { http } from "@/src/utils/config.api";

export type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  _id: string;
  url: string;
  public_id: string;
};

export type Ingredient = {
  _id: string;
  name: string;
};

export type RecipeIngredient = {
  ingredient: Ingredient;
  quantity: number;
  unit: string;
};

export type ProductVariant = {
  sku: string;
  price: number;
  crust: string[];
  size: string;
  image: ProductImage;
  recipe: RecipeIngredient[];
};

export type Product = {
  _id: string;
  category: ProductCategory;
  name: string;
  description: string;
  is_active: boolean;
  variants: ProductVariant[];
  isDeleted: boolean;
};

export type ComboCategory = {
  _id: string;
  name: string;
  slug: string;
  is_active: boolean;
  isDeleted: boolean;
  icon: string;
};

export type ComboRule = {
  groupName: string;
  applicableCategories: ComboCategory[];
  applicableProducts: string[]; // product IDs
  requiredQuantity: number;
};

export type Combo = {
  _id: string;
  name: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  image: string;
  rules: ComboRule[];
  disscountType: "percent" | "fixed";
  disscount: number;
  price: number;
  is_active: boolean;
  isDeleted: boolean;
};

/** Mỗi phần tử trong mảng combos của menu được bọc trong { combo, _id } */
export type MenuComboEntry = {
  combo: Combo;
  _id: string;
};

export type MenuData = {
  _id: string;
  store: string;
  products: Product[];
  combos: MenuComboEntry[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getMenuByStoreId = async (store_id: string) => {
  try {
    const response = await http(
      `/api/v1/menus/store/${store_id}`,
      {
        next: { revalidate: 3600 },
      },
      "customer",
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch menu:", error);
    return null;
  }
};
