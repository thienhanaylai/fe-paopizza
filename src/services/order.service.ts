import { http } from "../utils/config.api";

export type OrderMethod = "carry_out" | "delivery" | "dine_in";
export type PaymentMethod = "cash" | "qrCode" | "card" | "ewallet";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "completed" | "cancelled" | "delivering";
export type paymentStatus = "pending" | "success" | "failed";

export interface OrderItemTopping {
  ingredient: string;
  quantity: number;
}

export interface ComboSelection {
  product_id: string;
  sku: string;
  size: string;
  crust?: string;
  added_topping?: OrderItemTopping[];
}

export interface OrderItem {
  item_type: "product" | "combo";
  product_id?: string;
  sku: string;
  price: number;
  crust?: string;
  size: string;
  quantity: number;
  note?: string;
  added_topping?: OrderItemTopping[];
  combo_id?: string;
  combo_selections?: ComboSelection[];
}

export interface OrderItemToppingPopulated {
  ingredient: {
    _id: string;
    name: string;
    unit: string;
    price: number;
  };
  quantity: number;
}

export interface ComboSelectionPopulated {
  product_id: {
    _id: string;
    name: string;
  };
  sku: string;
  size: string;
  added_topping?: OrderItemToppingPopulated[];
}

export interface OrderItemHistory {
  item_type: "product" | "combo";
  product_id?: {
    _id: string;
    name: string;
  };
  sku: string;
  price: number;
  size: string;
  quantity: number;
  note?: string;
  added_topping?: OrderItemToppingPopulated[];
  combo_id?: {
    _id: string;
    name: string;
    image?: string;
    price: number;
  };
  combo_selections?: ComboSelectionPopulated[];
}

export interface Order {
  order_type: OrderMethod;
  paymentMethod: PaymentMethod;
  paymentStatus?: paymentStatus;
  contact_info: {
    full_name: string;
    phone: string;
    address?: string;
    email?: string;
  };
  store_id: string;
  items: OrderItem[];
  sub_total?: number;
  discount_amount?: number;
  promotion_code?: string;
  total?: number;
  note?: string;
  customer_id?: string | null;
}

export interface PosOrder extends Order {
  employee_id: string;
}

export interface OrderHistory {
  _id: string;
  order_type: OrderMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: paymentStatus;
  contact_info: {
    full_name: string;
    phone: string;
    address?: string;
    email?: string;
  };
  store_id: {
    _id: string;
    name: string;
    address: string | { streetNumber: string; district: string; city: string };
    phone: string;
    email: string;
  };
  items: OrderItemHistory[];
  sub_total: number;
  discount_amount: number;
  total: number;
  status: OrderStatus;
  customer_id?: string | null;
  employee_id?: string | null;
  note?: string;
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
    console.log(payload);
    return response;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const createPosOrder = async (payload: PosOrder, typeUser: string) => {
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

export const cancelOrder = async (order_id: string, typeUser: string) => {
  try {
    const response = await http(
      `/api/v1/orders/cancel/${order_id}`,
      {
        method: "PATCH",
      },
      typeUser,
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const customerCancelOrder = async (order_id: string, typeUser: string) => {
  try {
    const response = await http(
      `/api/v1/orders/customer/cancel/${order_id}`,
      {
        method: "PATCH",
      },
      typeUser,
    );

    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};

export const updatePaymentStatusOrder = async (order_id: string, typeUser: string) => {
  try {
    const response = await http(
      `/api/v1/orders/updatePaymentStatus/${order_id}`,
      {
        method: "PATCH",
      },
      typeUser,
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
