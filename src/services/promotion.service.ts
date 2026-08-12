import { http } from "@/src/utils/config.api";

// Types
export type PromotionType = "percentage" | "fixed_amount";
export type PromotionStatus = "draft" | "active" | "inactive" | "expired";

export interface Promotion {
  _id: string;
  code: string;
  point: number;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  applicableStore: string[] | { _id: string; name: string }[];
  usageLimit: number;
  usedCount: number;
  maxUsagePerUser: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionPayload {
  code: string;
  point?: number;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
  status?: PromotionStatus;
  applicableStore?: string[];
  usageLimit?: number;
  maxUsagePerUser?: number;
}

export interface UpdatePromotionPayload {
  promotion_id: string;
  code?: string;
  point?: number;
  type?: PromotionType;
  value?: number;
  startDate?: string;
  endDate?: string;
  status?: PromotionStatus;
  applicableStore?: string[];
  usageLimit?: number;
  maxUsagePerUser?: number;
}

export interface PromoCodeResult {
  valid: boolean;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  message?: string;
}

export interface RedeemResult {
  code: string;
  type: PromotionType;
  value: number;
  pointCost: number;
  remainingPoint: number;
  message: string;
}

export interface RedeemedPromotion {
  _id: string;
  promotion: Promotion | null;
  isUsed: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getAllPromotions = async (
  typeUser: string | null = null,
  page?: number,
  limit?: number,
): Promise<{ data: Promotion[]; pagination: PaginationInfo }> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    params.append("limit", String(limit || 1000));

    const response = await http(
      `/api/v1/promotions?${params.toString()}`,
      {
        method: "GET",
      },
      typeUser,
    );
    return response as { data: Promotion[]; pagination: PaginationInfo };
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

// Áp dụng mã khuyến mãi (phía khách hàng)
export const applyPromoCode = async (
  code: string,
  orderTotal: number,
  storeId: string,
  typeUser: string | null = "customer",
): Promise<PromoCodeResult> => {
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
      typeUser,
    );

    if (response?.data) {
      return {
        valid: response.data.valid ?? true,
        code: response.data.code || code,
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

// Lấy danh sách khuyến mãi có thể đổi bằng điểm (point >= 0, active)
export const getRedeemablePromotions = async (): Promise<Promotion[]> => {
  try {
    const { data: allPromotions } = await getAllPromotions("customer");
    const now = new Date();
    return allPromotions.filter(
      p =>
        p.point !== undefined &&
        p.point !== null &&
        p.point >= 0 &&
        p.status === "active" &&
        new Date(p.startDate) <= now &&
        new Date(p.endDate) >= now,
    );
  } catch (error) {
    console.error("Lỗi fetch redeemable promotions:", error);
    throw error;
  }
};

// Đổi điểm lấy mã khuyến mãi
export const redeemPromotion = async (promotion_id: string): Promise<RedeemResult> => {
  try {
    const response = await http(
      "/api/v1/promotions/redeem",
      {
        method: "POST",
        body: JSON.stringify({ promotion_id }),
      },
      "customer",
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi đổi điểm:", error);
    throw error;
  }
};

// Lấy danh sách khuyến mãi đã đổi của customer hiện tại
export const getMyRedeemedPromotions = async (): Promise<RedeemedPromotion[]> => {
  try {
    const response = await http(
      "/api/v1/customers/redeemed-promotions",
      {
        method: "GET",
      },
      "customer",
    );
    return response.data || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách mã đã đổi:", error);
    throw error;
  }
};
