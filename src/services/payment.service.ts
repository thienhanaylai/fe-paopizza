import { http } from "../utils/config.api";

export const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000;

export interface PaymentRequestData {
  orderId: string;
  qrUrl: string;
  content: string;
  amount: number;
}

export interface PaymentStatusData {
  orderId: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentState: "pending" | "paid" | "failed" | "cancelled" | "not_required";
  paymentInfo: {
    qrUrl: string;
    content: string;
    amount: number;
  } | null;
}

export const createPaymentRequest = async (orderId: string, typeUser: string = "customer") => {
  try {
    const response = await http(
      "/api/v1/payments/create",
      {
        method: "POST",
        body: JSON.stringify({ orderId }),
      },
      typeUser,
    );
    return response.data as PaymentRequestData;
  } catch (error) {
    console.error("Lỗi tạo payment request:", error);
    throw error;
  }
};

export const checkPaymentStatus = async (orderId: string, typeUser: string = "customer") => {
  try {
    const response = await http(
      `/api/v1/payments/status/${orderId}`,
      {
        method: "GET",
      },
      typeUser,
    );
    return response.data as PaymentStatusData;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
