import { http } from "@/src/utils/config.api";

// Lấy giỏ hàng
export const getCart = async (user_id: string) => {
  try {
    const response = await http(`/api/v1/cart/${user_id}`, {
      next: { revalidate: 3600 },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch cart:", error);
    return null;
  }
};

// Thêm vào giỏ hàng
export const addToCartApi = async (payload: {
  userId: string;
  product_id: string;
  size: string;
  quantity?: number;
  note?: string;
}) => {
  const response = await http("/api/v1/cart", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

// Xóa sản phẩm khỏi giỏ
export const removeFromCartApi = async (payload: { userId: string; product_id: string; size: string }) => {
  const response = await http("/api/v1/cart/remove", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

// Cập nhật số lượng / ghi chú
export const updateCartItemApi = async (payload: {
  userId: string;
  product_id: string;
  size: string;
  quantity: number;
  note?: string;
}) => {
  const response = await http("/api/v1/cart/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

// Xóa toàn bộ giỏ hàng
export const clearCartApi = async (userId: string) => {
  const response = await http("/api/v1/cart/clear", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return response.data;
};
