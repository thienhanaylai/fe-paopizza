import { http } from "@/src/utils/config.api";

export type ComboSelectionPayload = {
  product_id: string;
  sku: string;
  size: string;
  crust?: string;
  added_topping?: string[];
};

export type AddToCartPayload = {
  userId: string;
  item_type?: "product" | "combo";
  product_id?: string;
  combo?: string;
  combo_selections?: ComboSelectionPayload[];
  size: string;
  quantity?: number;
  note?: string;
  added_topping?: string[];
};

export type RemoveFromCartPayload = {
  userId: string;
  item_type?: "product" | "combo";
  product_id?: string;
  combo?: string;
  sku?: string;
  size: string;
  combo_selections?: ComboSelectionPayload[];
};

export type UpdateCartItemPayload = {
  userId: string;
  item_type?: "product" | "combo";
  product_id?: string;
  combo?: string;
  sku?: string;
  size: string;
  quantity?: number;
  note?: string;
  added_topping?: string[];
  combo_selections?: ComboSelectionPayload[];
};

// Lấy giỏ hàng
export const getCart = async (user_id: string) => {
  try {
    const response = await http(
      `/api/v1/cart/${user_id}`,
      {
        next: { revalidate: 3600 },
      },
      "customer",
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch cart:", error);
    return null;
  }
};

// Thêm vào giỏ hàng
export const addToCartApi = async (payload: AddToCartPayload) => {
  const response = await http(
    "/api/v1/cart",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
  return response.data;
};

// Xóa sản phẩm khỏi giỏ
export const removeFromCartApi = async (payload: RemoveFromCartPayload) => {
  const response = await http(
    "/api/v1/cart/remove",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
  return response.data;
};

// Cập nhật số lượng / ghi chú
export const updateCartItemApi = async (payload: UpdateCartItemPayload) => {
  console.log(payload);
  const response = await http(
    "/api/v1/cart/update",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "customer",
  );
  return response.data;
};

// Xóa toàn bộ giỏ hàng
export const clearCartApi = async (userId: string) => {
  const response = await http(
    "/api/v1/cart/clear",
    {
      method: "POST",
      body: JSON.stringify({ userId }),
    },
    "customer",
  );
  return response.data;
};
