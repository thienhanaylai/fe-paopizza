import { http } from "@/src/utils/config.api";

// ─── Types ─────────────────────────────────────────────
export interface ComboRulePayload {
  groupName: string;
  applicableCategories: string[];
  applicableProducts: string[];
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
  price: number;
  is_active?: boolean;
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
  price?: number;
  is_active?: boolean;
}

// ─── API calls ─────────────────────────────────────────
export const getAllCombos = async () => {
  try {
    const data = await http("/api/v1/combos", {
      next: { revalidate: 3600 },
    });
    return data.data;
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
    const { body, headers } = buildComboBody(payload as unknown as Record<string, unknown>, imageFile);
    const response = await http("/api/v1/combos/create", {
      method: "POST",
      body,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo combo:", error);
    throw error;
  }
};

export const updateCombo = async (payload: UpdateComboPayload, imageFile?: File | null) => {
  try {
    const { body, headers } = buildComboBody(payload as unknown as Record<string, unknown>, imageFile);
    const response = await http("/api/v1/combos/update", {
      method: "POST",
      body,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi cập nhật combo:", error);
    throw error;
  }
};

/** Build request body: FormData if there's an image, otherwise JSON */
const buildComboBody = (
  data: Record<string, unknown>,
  imageFile?: File | null,
): { body: FormData | string; headers?: Record<string, string> } => {
  if (!imageFile) {
    return { body: JSON.stringify(data) };
  }
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  formData.append("file", imageFile);
  return { body: formData };
};

export const updateComboStatus = async (combo_id: string) => {
  try {
    const response = await http(`/api/v1/combos/updateStatus/${combo_id}`, {
      method: "PATCH",
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
