import { http } from "../utils/config.api";

export type OrderMethod = "carry_out" | "delivery" | "dine_in";
export type PaymentMethod = "cash" | "qrCode" | "card" | "momo";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "completed" | "cancelled" | "delivering";
export type paymentStatus = "pending" | "success" | "failed";
export interface CartItem {
  product_id: string;
  size: string;
  quantity: number;
  note: string;
}

export interface CartItemHistory extends CartItem {
  product_id: {
    name: string;
  };
  price: number;
}
export interface Order {
  order_type: OrderMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: paymentStatus;
  contact_info: {
    full_name: string;
    phone: string;
    address: string | null;
  };
  store_id: string;
  items: CartItem[] | [];
  note: string;
  customer_id: string;
}

export interface OrderHistory extends Order {
  _id: string;
  sub_total: number;
  items: CartItemHistory[] | [];
  discount_amount: number;
  total: number;
  status: OrderStatus;
  store_id: {
    _id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  employee_id: string | null;
  createdAt: string;
}

export const getAllOrder = async (query: string | null, typeUser: string) => {
  try {
    const response = await http(
      `/api/v1/orders?${query}`,
      {
        method: "GET",
      },
      typeUser,
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const createOrder = async (payload: Order, typeUser: string) => {
  try {
    const response = await http(
      "/api/v1/orders",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      typeUser,
    );

    return response;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const updateStatusOrder = async (status: OrderStatus, orderID: string, typeUser: string) => {
  try {
    const response = await http(
      `/api/v1/orders/${orderID}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: status }),
      },
      typeUser,
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
