import { http } from "../utils/config.api";

export const checkPaymentStatus = async (orderId: string) => {
  try {
    const response = await http(
      `/api/v1/payments/status/${orderId}`,
      {
        method: "GET",
      },
      "customer",
    );
    return response;
  } catch (error) {
    console.error("Lỗi fetch :", error);
    throw error;
  }
};
