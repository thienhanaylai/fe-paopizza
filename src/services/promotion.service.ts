import { http } from "@/src/utils/config.api";

export interface PromoCodeResult {
  valid: boolean;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  message?: string;
}

/**
 * Kiểm tra và áp dụng mã khuyến mãi
 * @param code - Mã khuyến mãi
 * @param orderTotal - Tổng giá trị đơn hàng
 * @param storeId - ID cửa hàng
 */
export const applyPromoCode = async (code: string, orderTotal: number, storeId: string): Promise<PromoCodeResult> => {
  try {
    const response = await http(
      "/api/v1/promotions/apply",
      {
        method: "POST",
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          orderTotal,
          storeId,
        }),
      },
      "customer",
    );

    if (response?.data) {
      return {
        valid: true,
        code: response.data.code,
        discountType: response.data.discountType || "fixed",
        discountValue: response.data.discountValue || 0,
        discountAmount: response.data.discountAmount || 0,
        message: response.data.message,
      };
    }

    return {
      valid: false,
      code,
      discountType: "fixed",
      discountValue: 0,
      discountAmount: 0,
      message: "Mã khuyến mãi không hợp lệ",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể kiểm tra mã khuyến mãi";
    return {
      valid: false,
      code,
      discountType: "fixed",
      discountValue: 0,
      discountAmount: 0,
      message,
    };
  }
};
