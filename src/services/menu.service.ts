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
  applicableSizes: string[];
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
  discountType: "percent" | "amount" | "fixed";
  discount: number;
  price: number;
  is_active: boolean;
  isDeleted: boolean;
};

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

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch menu:", error);
    return null;
  }
};

// === Admin operations ===

export const getAllMenus = async () => {
  try {
    const response = await http("/api/v1/menus", {
      next: { revalidate: 3600 },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch all menus:", error);
    throw error;
  }
};

export const createMenu = async (payload: { store: string; products?: string[]; combos?: string[] }) => {
  try {
    const response = await http("/api/v1/menus/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo menu:", error);
    throw error;
  }
};

export const updateMenu = async (payload: { menu_id: string; products?: string[]; combos?: string[]; status?: boolean }) => {
  try {
    const response = await http("/api/v1/menus/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật menu:", error);
    throw error;
  }
};

export const toggleMenuStatus = async (menu_id: string) => {
  try {
    const response = await http(`/api/v1/menus/updateStatus/${menu_id}`, {
      method: "PATCH",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi toggle menu status:", error);
    throw error;
  }
};

/**
 * Áp dụng danh sách sản phẩm/combo cho nhiều cửa hàng cùng lúc.
 * Với mỗi store: nếu menu đã tồn tại thì update, chưa có thì create.
 * Trả về mảng kết quả { storeId, success, error? }.
 */
export const applyMenuToStores = async (payload: { storeIds: string[]; products?: string[]; combos?: string[] }) => {
  const results: { storeId: string; success: boolean; error?: string }[] = [];

  for (const storeId of payload.storeIds) {
    try {
      // Lấy menu hiện tại của store
      const existingMenu = await getMenuByStoreId(storeId);

      if (existingMenu?._id) {
        // Menu đã tồn tại → update
        await updateMenu({
          menu_id: existingMenu._id,
          products: payload.products,
          combos: payload.combos,
        });
      } else {
        // Menu chưa có → tạo mới
        await createMenu({
          store: storeId,
          products: payload.products,
          combos: payload.combos,
        });
      }
      results.push({ storeId, success: true });
    } catch (error: any) {
      results.push({ storeId, success: false, error: error?.message || String(error) });
    }
  }

  return results;
};

export const getAllCombos = async () => {
  try {
    const response = await http("/api/v1/combos", {
      next: { revalidate: 3600 },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch combos:", error);
    throw error;
  }
};
