"use client";

import { useEffect, useState } from "react";
import { X, Plus, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createPromotion,
  updatePromotion,
  Promotion,
  PromotionStatus,
  PromotionType,
  CreatePromotionPayload,
  UpdatePromotionPayload,
} from "@/src/services/promotion.service";

interface PromotionFormModalProps {
  open: boolean;
  onClose: () => void;
  editingPromo: Promotion | null;
  storesList: { _id: string; name: string }[];
  onSuccess: () => void;
}

export default function PromotionFormModal({ open, onClose, editingPromo, storesList, onSuccess }: PromotionFormModalProps) {
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<PromotionType>("percentage");
  const [formValue, setFormValue] = useState("");
  const [formPoint, setFormPoint] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState<PromotionStatus>("draft");
  const [formStoreIds, setFormStoreIds] = useState<string[]>([]);
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formMaxUsagePerUser, setFormMaxUsagePerUser] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = editingPromo !== null;

  // Đồng bộ form khi editingPromo / open thay đổi
  useEffect(() => {
    if (!open) return;
    if (editingPromo) {
      setFormCode(editingPromo.code);
      setFormType(editingPromo.type);
      setFormValue(String(editingPromo.value));
      setFormPoint(String(editingPromo.point ?? -1));
      setFormStartDate(new Date(editingPromo.startDate).toISOString().slice(0, 16));
      setFormEndDate(new Date(editingPromo.endDate).toISOString().slice(0, 16));
      setFormStatus(editingPromo.status);
      setFormStoreIds(editingPromo.applicableStore?.map(s => (typeof s === "string" ? s : s._id)) || []);
      setFormUsageLimit(String(editingPromo.usageLimit ?? ""));
      setFormMaxUsagePerUser(String(editingPromo.maxUsagePerUser ?? 1));
    } else {
      setFormCode("");
      setFormType("percentage");
      setFormValue("");
      setFormPoint("-1");
      setFormStartDate("");
      setFormEndDate("");
      setFormStatus("draft");
      setFormStoreIds([]);
      setFormUsageLimit("");
      setFormMaxUsagePerUser("1");
    }
    setIsSubmitting(false);
  }, [open, editingPromo]);

  // Toggle chọn cửa hàng
  const toggleStoreCheckbox = (storeId: string) => {
    setFormStoreIds(prev => (prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]));
  };

  // Select all / deselect all
  const allStoresSelected = storesList.length > 0 && formStoreIds.length === storesList.length;
  const isIndeterminate = formStoreIds.length > 0 && formStoreIds.length < storesList.length;

  const toggleSelectAllStores = () => {
    if (allStoresSelected) {
      setFormStoreIds([]);
    } else {
      setFormStoreIds(storesList.map(s => s._id));
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!formCode.trim() || !formValue || !formStartDate || !formEndDate) {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const numericValue = Number(formValue);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      toast.warning("Giá trị khuyến mãi phải lớn hơn 0!");
      return;
    }

    if (formType === "percentage" && numericValue > 100) {
      toast.warning("Phần trăm giảm giá không được vượt quá 100%!");
      return;
    }

    const now = new Date();
    const startDate = new Date(formStartDate);
    const endDate = new Date(formEndDate);

    if (endDate < now) {
      toast.warning("Ngày kết thúc phải lớn hơn hoặc bằng thời gian hiện tại!");
      return;
    }

    if (endDate <= startDate) {
      toast.warning("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const payload: UpdatePromotionPayload = {
          promotion_id: editingPromo!._id,
          code: formCode.trim(),
          type: formType,
          value: numericValue,
          point: Number(formPoint),
          startDate: new Date(formStartDate).toISOString(),
          endDate: new Date(formEndDate).toISOString(),
          status: formStatus,
          applicableStore: formStoreIds,
          usageLimit: formUsageLimit !== "" ? Number(formUsageLimit) : undefined,
          maxUsagePerUser: formMaxUsagePerUser !== "" ? Number(formMaxUsagePerUser) : undefined,
        };
        await updatePromotion(payload);
        toast.success("Cập nhật khuyến mãi thành công!");
      } else {
        const payload: CreatePromotionPayload = {
          code: formCode.trim(),
          type: formType,
          value: numericValue,
          point: Number(formPoint),
          startDate: new Date(formStartDate).toISOString(),
          endDate: new Date(formEndDate).toISOString(),
          status: formStatus,
          applicableStore: formStoreIds.length > 0 ? formStoreIds : [],
          usageLimit: formUsageLimit !== "" ? Number(formUsageLimit) : undefined,
          maxUsagePerUser: formMaxUsagePerUser !== "" ? Number(formMaxUsagePerUser) : 1,
        };
        await createPromotion(payload);
        toast.success("Tạo khuyến mãi thành công!");
      }

      await onSuccess();
      onClose();
    } catch (error: unknown) {
      const rawMsg = error instanceof Error ? error.message : "";
      const errorMap: Record<string, string> = {
        MISSING_PROMOTION_INFO: "Vui lòng nhập đầy đủ thông tin khuyến mãi.",
        PROMOTION_CODE_EXISTS: "Mã khuyến mãi này đã tồn tại.",
        PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi.",
        MISSING_PROMOTION_ID: "Thiếu mã khuyến mãi.",
        MISSING_PROMOTION_ID_OR_STATUS: "Thiếu mã khuyến mãi hoặc trạng thái.",
      };
      toast.error(errorMap[rawMsg] || rawMsg || "Có lỗi xảy ra!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 m-0">
      <div className="bg-card rounded-2xl p-6 max-w-2xl w-full mx-auto shadow-xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">{isEditing ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Mã khuyến mãi <span className="text-red-500">*</span>
            </label>
            <input
              value={formCode}
              onChange={e => setFormCode(e.target.value.toUpperCase())}
              placeholder="VD: SUMMER2026"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Loại khuyến mãi <span className="text-red-500">*</span>
              </label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as PromotionType)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed_amount">Số tiền cố định</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Giá trị <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  placeholder={formType === "percentage" ? "VD: 10" : "VD: 50000"}
                  min="0"
                  max={formType === "percentage" ? 100 : undefined}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {formType === "percentage" ? "%" : "đ"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Điểm quy đổi
              <span className="text-muted-foreground font-normal ml-1">
                (-1 = không đổi được, 0 = miễn phí, {`>`}0 = số điểm cần)
              </span>
            </label>
            <input
              type="number"
              value={formPoint}
              onChange={e => setFormPoint(e.target.value)}
              placeholder="VD: 500"
              min="-1"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Giới hạn lượt dùng
                <span className="text-muted-foreground font-normal ml-1">(-1 = không giới hạn, để trống = mặc định null)</span>
              </label>
              <input
                type="number"
                value={formUsageLimit}
                onChange={e => setFormUsageLimit(e.target.value)}
                placeholder="VD: 100 (hoặc -1)"
                min="-1"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Số lần dùng tối đa / user
                <span className="text-muted-foreground font-normal ml-1">(mặc định: 1)</span>
              </label>
              <input
                type="number"
                value={formMaxUsagePerUser}
                onChange={e => setFormMaxUsagePerUser(e.target.value)}
                placeholder="VD: 1"
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formEndDate}
                onChange={e => setFormEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Trạng thái</label>
            <select
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as PromotionStatus)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="draft">Bản nháp</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng kích hoạt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Áp dụng cho cửa hàng
              <span className="text-muted-foreground font-normal ml-1">(để trống = không áp dụng cho cửa hàng nào)</span>
            </label>
            {storesList.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Đang tải danh sách cửa hàng...</p>
            ) : (
              <>
                {/* Nút chọn tất cả */}
                <label
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors mb-2 ${
                    allStoresSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <input type="checkbox" checked={allStoresSelected} onChange={toggleSelectAllStores} className="sr-only" />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      allStoresSelected || isIndeterminate ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                    }`}
                  >
                    {(allStoresSelected || isIndeterminate) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6L5 9L10 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {allStoresSelected ? "Bỏ chọn tất cả" : "Chọn tất cả cửa hàng"}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {storesList.map(store => (
                    <label
                      key={store._id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${formStoreIds.includes(store._id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    >
                      <input
                        type="checkbox"
                        checked={formStoreIds.includes(store._id)}
                        onChange={() => toggleStoreCheckbox(store._id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${formStoreIds.includes(store._id) ? "bg-primary border-primary text-white" : "border-muted-foreground/30"}`}
                      >
                        {formStoreIds.includes(store._id) && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-foreground truncate">{store.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
              {isEditing ? "Cập nhật" : "Tạo khuyến mãi"}
            </button>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-60"
            >
              Huỷ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
