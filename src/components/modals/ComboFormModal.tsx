"use client";

import { useLayoutEffect, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import CurrencyInput from "@/src/components/ui/currencyInput";

// ─────────── Types ───────────
interface ComboRule {
  groupName: string;
  applicableCategories: string[];
  applicableProducts: string[];
  applicableSizes: string[];
  requiredQuantity: number;
}

export interface ComboFormSubmitPayload {
  name: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  discountType: "percent" | "amount";
  discount: number;
  price: number;
  rules: ComboRule[];
  imageFile?: File | null;
}

interface ComboCategory {
  _id: string;
  name: string;
}

interface ComboProduct {
  _id: string;
  name: string;
}

interface Combo {
  _id: string;
  name: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  discountType?: "percent" | "amount" | "fixed";
  discount?: number;
  price?: number;
  image?: string;
  rules?: ComboRule[];
  is_active?: boolean;
}

// ─────────── Constants ───────────
const DISCOUNT_TYPE_OPTIONS = [
  { value: "percent", label: "Phần trăm (%)" },
  { value: "amount", label: "Tiền mặt (VNĐ)" },
];

// ─────────── Helpers ───────────
const createEmptyRule = (): ComboRule => ({
  groupName: "",
  applicableCategories: [],
  applicableProducts: [],
  applicableSizes: [],
  requiredQuantity: 1,
});

const toISODate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

const normalizeRuleForForm = (rule: any): ComboRule => ({
  groupName: rule.groupName || "",
  applicableCategories: Array.isArray(rule.applicableCategories)
    ? rule.applicableCategories.map((c: any) => (typeof c === "string" ? c : c._id))
    : [],
  applicableProducts: Array.isArray(rule.applicableProducts)
    ? rule.applicableProducts.map((p: any) => (typeof p === "string" ? p : p._id))
    : [],
  applicableSizes: Array.isArray(rule.applicableSizes) ? rule.applicableSizes : [],
  requiredQuantity: rule.requiredQuantity || 1,
});

// ─────────── Props ───────────
interface ComboFormModalProps {
  open: boolean;
  onClose: () => void;
  editItem: Combo | null;
  categories: ComboCategory[];
  products: ComboProduct[];
  isLoading: boolean;
  onSubmit: (payload: ComboFormSubmitPayload) => Promise<void>;
}

// ─────────── Component ───────────
export default function ComboFormModal({
  open,
  onClose,
  editItem,
  categories,
  products,
  isLoading,
  onSubmit,
}: ComboFormModalProps) {
  const [formData, setFormData] = useState({ name: "", description: "", dateStart: "", dateEnd: "" });
  const [formPricing, setFormPricing] = useState<{
    discountType: "percent" | "amount";
    discount: number;
    price: number;
  }>({ discountType: "percent", discount: 0, price: 0 });
  const [formImage, setFormImage] = useState<{ file: File | null; preview: string | null }>({
    file: null,
    preview: null,
  });
  const [comboFormRules, setComboFormRules] = useState<ComboRule[]>([createEmptyRule()]);
  const [priceInputKey, setPriceInputKey] = useState(0);

  // Initialize form when modal opens or editItem changes
  useLayoutEffect(() => {
    if (!open) return;
    if (editItem) {
      setFormData({
        name: editItem.name || "",
        description: editItem.description || "",
        dateStart: toISODate(editItem.dateStart || ""),
        dateEnd: toISODate(editItem.dateEnd || ""),
      });
      setFormPricing({
        discountType: editItem.discountType === "fixed" ? "amount" : (editItem.discountType as "percent" | "amount") || "percent",
        discount: editItem.discount || 0,
        price: editItem.price ?? 0,
      });
      setFormImage({ file: null, preview: null });
      setComboFormRules(editItem.rules?.length ? editItem.rules.map(normalizeRuleForForm) : [createEmptyRule()]);
      setPriceInputKey(prev => prev + 1);
    } else {
      setFormData({ name: "", description: "", dateStart: "", dateEnd: "" });
      setFormPricing({ discountType: "percent", discount: 0, price: 0 });
      setFormImage({ file: null, preview: null });
      setComboFormRules([createEmptyRule()]);
      setPriceInputKey(prev => prev + 1);
    }
  }, [open, editItem]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (formImage.preview) {
        URL.revokeObjectURL(formImage.preview);
      }
    };
  }, [formImage.preview]);

  // ─── Rule handlers ───
  const comboAddRule = useCallback(() => {
    setComboFormRules(prev => [...prev, createEmptyRule()]);
  }, []);

  const comboRemoveRule = useCallback((idx: number) => {
    setComboFormRules(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const comboHandleRuleChange = useCallback((ruleIdx: number, field: string, value: any) => {
    setComboFormRules(prev => prev.map((r, i) => (i === ruleIdx ? { ...r, [field]: value } : r)));
  }, []);

  // ─── Submit ───
  const handleInternalSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        dateStart: formData.dateStart ? new Date(formData.dateStart).toISOString() : "",
        dateEnd: formData.dateEnd ? new Date(formData.dateEnd).toISOString() : "",
        discountType: formPricing.discountType,
        discount: formPricing.discount,
        price: formPricing.price,
        rules: comboFormRules,
        imageFile: formImage.file,
      });
    },
    [formData, formPricing, comboFormRules, formImage.file, onSubmit],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0!" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa combo" : "Thêm combo mới"}</h3>

        <form onSubmit={handleInternalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Tên combo *</label>
              <input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Combo gia đình"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Giá bán (đ) *</label>
              <CurrencyInput
                key={`price-${priceInputKey}`}
                value={formPricing.price}
                onChange={(val: number) => setFormPricing(prev => ({ ...prev, price: val }))}
                placeholder="500000"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Mô tả combo..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Ngày bắt đầu *</label>
              <input
                type="date"
                value={formData.dateStart}
                onChange={e => setFormData(prev => ({ ...prev, dateStart: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ngày kết thúc *</label>
              <input
                type="date"
                value={formData.dateEnd}
                onChange={e => setFormData(prev => ({ ...prev, dateEnd: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Loại giảm giá *</label>
              <select
                value={formPricing.discountType}
                onChange={e => setFormPricing(prev => ({ ...prev, discountType: e.target.value as "percent" | "amount" }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
              >
                {DISCOUNT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">
                {formPricing.discountType === "percent" ? "Giảm giá (%)" : "Giảm giá (VNĐ)"} *
              </label>
              {formPricing.discountType === "percent" ? (
                <input
                  type="number"
                  value={formPricing.discount}
                  onChange={e => setFormPricing(prev => ({ ...prev, discount: Number(e.target.value) }))}
                  min={0}
                  max={100}
                  placeholder="10"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              ) : (
                <CurrencyInput
                  key={`discount-${priceInputKey}`}
                  value={formPricing.discount}
                  onChange={(val: number) => setFormPricing(prev => ({ ...prev, discount: val }))}
                  placeholder="50000"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Ảnh combo</label>
            <div className="flex items-center gap-3">
              {formImage.preview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border">
                  <Image src={formImage.preview} alt="Ảnh xem trước" fill className="object-cover" />
                </div>
              ) : editItem?.image && !formImage.file ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border">
                  <Image src={editItem.image} alt="Ảnh hiện tại" fill className="object-cover" />
                </div>
              ) : null}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    const preview = file ? URL.createObjectURL(file) : null;
                    setFormImage({ file, preview });
                  }}
                  className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {formImage.file && (
                  <button
                    type="button"
                    onClick={() => setFormImage({ file: null, preview: null })}
                    className="text-xs text-red-500 hover:text-red-600 mt-1 cursor-pointer"
                  >
                    Xoá ảnh đã chọn
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Rules *</label>
              <button
                type="button"
                onClick={comboAddRule}
                className="flex items-center gap-1 text-primary text-sm hover:underline cursor-pointer"
              >
                <Plus size={14} /> Thêm rule
              </button>
            </div>
            {comboFormRules.map((rule, ri) => (
              <div key={ri} className="bg-muted/30 rounded-xl p-4 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Rule #{ri + 1}</span>
                  {comboFormRules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => comboRemoveRule(ri)}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Tên nhóm *</label>
                    <input
                      value={rule.groupName}
                      onChange={e => comboHandleRuleChange(ri, "groupName", e.target.value)}
                      placeholder="VD: Pizza"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Số lượng yêu cầu *</label>
                    <input
                      type="number"
                      value={rule.requiredQuantity}
                      onChange={e => comboHandleRuleChange(ri, "requiredQuantity", Number(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1.5">Danh mục áp dụng</label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(cat => {
                      const checked = rule.applicableCategories.includes(cat._id);
                      return (
                        <label
                          key={cat._id}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${
                            checked
                              ? "bg-primary/10 border-primary text-primary font-medium"
                              : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setComboFormRules(prev =>
                                prev.map((r, i) => {
                                  if (i !== ri) return r;
                                  const cats = r.applicableCategories.includes(cat._id)
                                    ? r.applicableCategories.filter(id => id !== cat._id)
                                    : [...r.applicableCategories, cat._id];
                                  return { ...r, applicableCategories: cats };
                                }),
                              );
                            }}
                            className="sr-only"
                          />
                          {cat.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1.5">Sản phẩm áp dụng</label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {products.map(prod => {
                      const checked = rule.applicableProducts.includes(prod._id);
                      return (
                        <label
                          key={prod._id}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${
                            checked
                              ? "bg-primary/10 border-primary text-primary font-medium"
                              : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setComboFormRules(prev =>
                                prev.map((r, i) => {
                                  if (i !== ri) return r;
                                  const prods = r.applicableProducts.includes(prod._id)
                                    ? r.applicableProducts.filter(id => id !== prod._id)
                                    : [...r.applicableProducts, prod._id];
                                  return { ...r, applicableProducts: prods };
                                }),
                              );
                            }}
                            className="sr-only"
                          />
                          {prod.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1.5">Size áp dụng</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["S", "M", "L", "XL", "XXL"].map(size => {
                      const checked = rule.applicableSizes.includes(size);
                      return (
                        <label
                          key={size}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${
                            checked
                              ? "bg-primary/10 border-primary text-primary font-medium"
                              : "bg-background border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setComboFormRules(prev =>
                                prev.map((r, i) => {
                                  if (i !== ri) return r;
                                  const sizes = r.applicableSizes.includes(size)
                                    ? r.applicableSizes.filter(s => s !== size)
                                    : [...r.applicableSizes, size];
                                  return { ...r, applicableSizes: sizes };
                                }),
                              );
                            }}
                            className="sr-only"
                          />
                          {size}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : editItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
