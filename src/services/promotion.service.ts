import { http } from "@/src/utils/config.api";

// ─── Types ─────────────────────────────────────────────
export type PromotionType = "percentage" | "fixed_amount";
export type PromotionStatus = "draft" | "active" | "inactive" | "expired";

export interface Promotion {
  _id: string;
  code: string;
  type: PromotionType;
  value: number;
  start_date: string;
  end_date: string;
  status: PromotionStatus;
  applicable_store: string[] | { _id: string; name: string }[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionPayload {
  code: string;
  type: PromotionType;
  value: number;
  start_date: string;
  end_date: string;
  status?: PromotionStatus;
  applicable_store?: string[];
}

export interface UpdatePromotionPayload {
  promotion_id: string;
  code?: string;
  type?: PromotionType;
  value?: number;
  start_date?: string;
  end_date?: string;
  status?: PromotionStatus;
  applicable_store?: string[];
}

export interface PromoCodeResult {
  valid: boolean;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  message?: string;
}

// ─── CRUD API calls ────────────────────────────────────
export const getAllPromotions = async (): Promise<Promotion[]> => {
  try {
    const response = await http("/api/v1/promotions", {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch promotions:", error);
    throw error;
  }
};

export const getPromotionById = async (promotion_id: string): Promise<Promotion> => {
  try {
    const response = await http(`/api/v1/promotions/${promotion_id}`, {
      method: "GET",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi fetch promotion by id:", error);
    throw error;
  }
};

export const createPromotion = async (payload: CreatePromotionPayload): Promise<Promotion> => {
  try {
    const response = await http("/api/v1/promotions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo promotion:", error);
    throw error;
  }
};

export const updatePromotion = async (payload: UpdatePromotionPayload): Promise<Promotion> => {
  try {
    const { promotion_id, ...rest } = payload;
    const response = await http(`/api/v1/promotions/${promotion_id}`, {
      method: "PUT",
      body: JSON.stringify(rest),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật promotion:", error);
    throw error;
  }
};

export const updatePromotionStatus = async (promotion_id: string, status: PromotionStatus): Promise<Promotion> => {
  try {
    const response = await http(`/api/v1/promotions/${promotion_id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái promotion:", error);
    throw error;
  }
};

export const deletePromotion = async (promotion_id: string): Promise<Promotion> => {
  try {
    const response = await http(`/api/v1/promotions/deleted/${promotion_id}`, {
      method: "PATCH",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi xoá promotion:", error);
    throw error;
  }
};

// ─── Apply promo code (customer-facing) ────────────────
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
