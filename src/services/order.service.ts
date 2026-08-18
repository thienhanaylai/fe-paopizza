import { http } from "../utils/config.api";

export type OrderMethod = "carry_out" | "delivery" | "dine_in";
export type PaymentMethod = "cash" | "qrCode" | "card" | "ewallet";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "completed" | "cancelled" | "delivering";
export type paymentStatus = "pending" | "success" | "failed";

export const DELIVERY_FEE = 25_000;
export const FREE_DELIVERY_MIN_SUBTOTAL = 200_000;

export const calculateDeliveryFee = (orderType: OrderMethod, subTotal: number) =>
  orderType === "delivery" && subTotal < FREE_DELIVERY_MIN_SUBTOTAL ? DELIVERY_FEE : 0;

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
  crust?: string;
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
  crust?: string;
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
  combo?: {
    _id: string;
    name: string;
    image?: string;
    price: number;
  };
  combo_selections?: ComboSelectionPopulated[];
}

export interface Order {
  orderType: OrderMethod;
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
  subTotal?: number;
  discount_amount?: number;
  promotion_code?: string;
  total?: number;
  note?: string;
}

export type PosOrder = Order;

export interface OrderHistory {
  _id: string;
  orderType: OrderMethod;
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
  subTotal: number;
  deliveryFee?: number;
  discount_amount: number;
  total: number;
  status: OrderStatus;
  customer_id?: string | null;
  employee_id?: string | null;
  note?: string;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetAllOrderResponse {
  data: OrderHistory[];
  pagination: PaginationInfo;
}

export const getAllOrder = async (
  query: string | null,
  typeUser: string,
  page: number = 1,
  limit: number = 10,
): Promise<GetAllOrderResponse> => {
  try {
    const params = new URLSearchParams();
    if (query) {
      // query có thể là dạng "key=value" hoặc "key=value&key2=value2"
      const searchParams = new URLSearchParams(query);
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
    }
    params.append("page", String(page));
    params.append("limit", String(limit));

    const response = await http(
      `/api/v1/orders?${params.toString()}`,
      {
        method: "GET",
      },
      typeUser,
    );

    return response as GetAllOrderResponse;
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

export const trackOrder = async (orderId?: string): Promise<OrderHistory[]> => {
  try {
    const params = new URLSearchParams();
    if (orderId) params.append("orderId", orderId);

    const response = await http(`/api/v1/orders/track?${params.toString()}`, { method: "GET" }, "customer", {
      skipUnauthorized: true,
    });

    return (response as { data: OrderHistory[] }).data;
  } catch (error) {
    console.error("Lỗi fetch trackOrder:", error);
    throw error;
  }
};
