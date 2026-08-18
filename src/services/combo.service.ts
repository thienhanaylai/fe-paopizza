import { http } from "@/src/utils/config.api";

// Types
export interface ComboRulePayload {
  groupName: string;
  applicableCategories: string[];
  applicableProducts?: string[];
  applicableSizes: string[];
  requiredQuantity: number;
}

export interface ComboPayload {
  name: string;
  description?: string;
  dateStart: string;
  dateEnd: string;
  image?: string;
  rules: ComboRulePayload[];
  discountType: "percent" | "amount";
  discount: number;
  pricingType: "static" | "dynamic";
  price: number;
  isActive?: boolean;
  isHalfHalf?: boolean;
}

export interface UpdateComboPayload {
  combo_id: string;
  name?: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  image?: string;
  rules?: ComboRulePayload[];
  discountType?: "percent" | "amount";
  discount?: number;
  pricingType?: "static" | "dynamic";
  price?: number;
  isActive?: boolean;
  isHalfHalf?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API calls
export const getAllCombos = async (page?: number, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    params.append("limit", String(limit || 1000));

    const data = await http(`/api/v1/combos?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    return data as { data: any[]; pagination: PaginationInfo };
  } catch (error) {
    console.error("Lỗi fetch combos:", error);
    throw error;
  }
};

export const getAllCombosActive = async () => {
  try {
    const data = await http("/api/v1/combos/active", {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch active combos:", error);
    throw error;
  }
};

export const getComboById = async (combo_id: string) => {
  try {
    const data = await http(`/api/v1/combos/${combo_id}`, {
      next: { revalidate: 3600 },
    });
    return data.data;
  } catch (error) {
    console.error("Lỗi fetch combo by id:", error);
    throw error;
  }
};

export const addCombo = async (payload: ComboPayload, imageFile?: File | null) => {
  try {
    const sanitized = sanitizeComboPayload(payload);
    const body = await buildComboJson(sanitized as unknown as Record<string, unknown>, imageFile);
    const response = await http("/api/v1/combos/create", {
      method: "POST",
      body,
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo combo:", error);
    throw error;
  }
};

export const updateCombo = async (payload: UpdateComboPayload, imageFile?: File | null) => {
  try {
    const sanitized = sanitizeComboPayload(payload);
    const body = await buildComboJson(sanitized as unknown as Record<string, unknown>, imageFile);
    const response = await http("/api/v1/combos/update", {
      method: "POST",
      body,
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật combo:", error);
    throw error;
  }
};

/** Sanitize payload: strip empty applicableProducts from rules to match API contract */
const sanitizeComboPayload = <T extends { rules?: ComboRulePayload[] }>(payload: T): T => {
  if (!payload.rules) return payload;
  return {
    ...payload,
    rules: payload.rules.map(rule => {
      const { applicableProducts, ...rest } = rule;
      // Only include applicableProducts if it has values
      return applicableProducts && applicableProducts.length > 0 ? { ...rest, applicableProducts } : rest;
    }),
  };
};

/** Convert a File to base64 data URL */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/** Build JSON body: if imageFile is provided, convert to base64 and include as "image" field */
const buildComboJson = async (data: Record<string, unknown>, imageFile?: File | null): Promise<string> => {
  if (!imageFile) {
    return JSON.stringify(data);
  }
  const base64 = await fileToBase64(imageFile);
  return JSON.stringify({ ...data, image: base64 });
};

export const updateComboStatus = async (combo_id: string, isActive: boolean) => {
  try {
    const response = await http(`/api/v1/combos/updateStatus/${combo_id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi update combo status:", error);
    throw error;
  }
};

export const deletedCombo = async (combo_id: string) => {
  try {
    const response = await http(`/api/v1/combos/deleted/${combo_id}`, {
      method: "PATCH",
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi xoá combo:", error);
    throw error;
  }
};
