import { http } from "../utils/config.api";

type OrderMethod = "carry_out" | "delivery" | "dining";
type PaymentMethod = "cash" | "bank_transfer" | "card" | "momo";
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
  status: string;
  employee_id: string | null;
  createAt: string;
}

export const getAllOrder = async (typeUser: string) => {
  try {
    const response = await http(
      "/api/v1/orders/history",
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

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
