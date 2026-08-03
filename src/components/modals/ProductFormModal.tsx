"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { ImageInput } from "@/src/components/ui/input";
import CurrencyInput from "@/src/components/ui/currencyInput";
import type { RecipeItemPayload, VariantPayload } from "@/src/services/product.service";

export type { RecipeItemPayload, VariantPayload };

export interface VariantSubmitPayload {
  sku: string;
  size: string;
  price: number;
  discountType?: "percent" | "amount";
  discount?: number;
  crust: string[];
  recipe: RecipeItemPayload[];
  imageFile: File | null;
  image?: { url: string; public_id: string; _id: string };
}

export interface ProductFormSubmitPayload {
  name: string;
  category: string;
  description: string;
  launchDate?: string;
  variants: VariantSubmitPayload[];
}

interface Category {
  _id: string;
  slug: string;
  name: string;
}

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
}

interface ProductImage {
  _id: string;
  url: string;
  public_id: string;
}

interface ProductVariant {
  sku: string;
  price: number;
  size: string;
  discountType?: "percent" | "amount";
  discount?: number;
  crust: string[];
  image: ProductImage;
  recipe: Array<{ ingredient: { _id: string; name: string }; quantity: number; unit: string }>;
}

interface Product {
  _id: string;
  category: { _id: string; name: string; slug: string };
  name: string;
  description: string;
  launchDate?: string;
  variants: ProductVariant[];
}

const UNIT_CONVERSIONS: Record<string, { display: string; factor: number }> = {
  kg: { display: "g", factor: 1000 },
  lit: { display: "ml", factor: 1000 },
};

const getDisplayUnit = (nativeUnit: string): string => UNIT_CONVERSIONS[nativeUnit]?.display ?? nativeUnit;

const toDisplayQuantity = (nativeUnit: string, recipeUnit: string, quantity: number): { quantity: number; unit: string } => {
  const conv = UNIT_CONVERSIONS[nativeUnit];
  if (conv && recipeUnit === nativeUnit) {
    return { quantity: quantity * conv.factor, unit: conv.display };
  }
  return { quantity, unit: recipeUnit };
};

const toStorageQuantity = (nativeUnit: string, recipeUnit: string, quantity: number): { quantity: number; unit: string } => {
  const conv = UNIT_CONVERSIONS[nativeUnit];
  if (conv && recipeUnit === conv.display) {
    return { quantity: quantity / conv.factor, unit: nativeUnit };
  }
  return { quantity, unit: recipeUnit };
};

const SIZE_OPTIONS = ["S", "M", "L", "3XL", "1L", "1.5L", "330ml"] as const;

const CRUST_OPTIONS = [
  { value: "thin", label: "Mỏng" },
  { value: "medium", label: "Vừa" },
  { value: "thick", label: "Dày" },
] as const;

const createEmptyVariant = (): VariantPayload => ({
  sku: "",
  size: "S",
  price: 0,
  discountType: undefined,
  discount: 0,
  crust: [],
  imageFile: undefined as any,
  recipe: [],
});

const normalizeCrust = (crust: string[] | string | undefined | null): string[] => {
  if (!crust) return [];
  if (Array.isArray(crust)) return crust.filter(Boolean);
  const parts = crust.match(/thin|medium|thick/g);
  return parts || [];
};

const mapProductToVariants = (product: Product): VariantPayload[] => {
  if (!product?.variants?.length) {
    return [createEmptyVariant()];
  }
  return product.variants.map(variant => ({
    sku: variant.sku,
    size: variant.size,
    price: variant.price,
    discountType: variant.discountType,
    discount: variant.discount,
    crust: normalizeCrust(variant.crust),
    imageFile: undefined as any,
    recipe: (variant.recipe || []).map(item => ({
      ingredient_id: item.ingredient?._id || "",
      quantity: item.quantity,
      unit: item.unit,
    })),
  }));
};

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  editItem: Product | null;
  categories: Category[];
  ingredients: Ingredient[] | undefined;
  isLoading: boolean;
  onSubmit: (payload: ProductFormSubmitPayload) => Promise<void>;
}

export default function ProductFormModal({
  open,
  onClose,
  editItem,
  categories,
  ingredients,
  isLoading,
  onSubmit,
}: ProductFormModalProps) {
  const [basicInfo, setBasicInfo] = useState({ name: "", category: "", description: "", launchDate: "" });
  const [variantsFrom, setVariantsFrom] = useState<VariantPayload[]>([createEmptyVariant()]);
  const [isMount, setIsMount] = useState(false);
  // Initialize form when modal opens or editItem changes
  useEffect(() => {
    if (!open) {
      setIsMount(false);
      return;
    }
    if (editItem) {
      setBasicInfo({
        name: editItem.name || "",
        category: editItem.category?._id || "",
        description: editItem.description || "",
        launchDate: editItem.launchDate ? editItem.launchDate.split("T")[0] : "",
      });
      const rawVariants = mapProductToVariants(editItem);
      const displayVariants = rawVariants.map(v => ({
        ...v,
        recipe: v.recipe.map(r => {
          const ing = ingredients?.find(i => i._id === r.ingredient_id);
          if (!ing) return r;
          const converted = toDisplayQuantity(ing.unit, r.unit, r.quantity);
          return { ...r, ...converted };
        }),
      }));
      setVariantsFrom(displayVariants);
    } else {
      const firstCategoryId = categories.find(item => item.slug !== "all")?._id || "";
      setBasicInfo({ name: "", category: firstCategoryId, description: "", launchDate: "" });
      setVariantsFrom([createEmptyVariant()]);
    }
    setIsMount(true);
  }, [open, editItem, categories]);

  // Xử lý variant
  const addSize = useCallback(() => {
    setVariantsFrom(prev => [...prev, createEmptyVariant()]);
  }, []);

  const removeSize = useCallback((indexToRemove: number) => {
    setVariantsFrom(prev => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const handleVariantChange = useCallback(
    (index: number, field: keyof VariantPayload, value: string | number | File | null | any[]) => {
      setVariantsFrom(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
    },
    [],
  );

  const addIngredientToSize = useCallback(
    (variantIndex: number) => {
      setVariantsFrom(prev =>
        prev.map((v, i) =>
          i === variantIndex
            ? {
                ...v,
                recipe: [
                  ...v.recipe,
                  {
                    ingredient_id: ingredients?.[0]?._id || "",
                    quantity: 0,
                    unit: getDisplayUnit(ingredients?.[0]?.unit || ""),
                  },
                ],
              }
            : v,
        ),
      );
    },
    [ingredients],
  );

  const removeIngredientFromSize = useCallback((variantIndex: number, ingredientIndex: number) => {
    setVariantsFrom(prev =>
      prev.map((v, i) => (i === variantIndex ? { ...v, recipe: v.recipe.filter((_, idx) => idx !== ingredientIndex) } : v)),
    );
  }, []);

  const handleRecipeChange = useCallback(
    (variantIndex: number, ingredientIndex: number, field: keyof RecipeItemPayload, value: string | number) => {
      setVariantsFrom(prev =>
        prev.map((v, vi) =>
          vi === variantIndex
            ? {
                ...v,
                recipe: v.recipe.map((ing, ii) => (ii === ingredientIndex ? { ...ing, [field]: value } : ing)),
              }
            : v,
        ),
      );
    },
    [],
  );

  // Submit
  const handleInternalSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const formatForSku = (str: string) =>
        str
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/Đ/g, "D")
          .trim()
          .replace(/\s+/g, "-");
      const categoryPrefix = formatForSku(categories.find(item => item._id === basicInfo.category)?.name.charAt(0) || "");

      const normalizedVariants: VariantSubmitPayload[] = variantsFrom.map((variant, index) => ({
        sku: variant.sku || `${categoryPrefix}-${formatForSku(basicInfo.name)}-${formatForSku(variant.size)}`,
        size: variant.size,
        price: variant.price,
        discountType: variant.discountType,
        discount: variant.discount,
        crust: variant.crust || [],
        recipe: variant.recipe.map(item => {
          const ing = ingredients?.find(i => i._id === item.ingredient_id);
          if (!ing) return item;
          const converted = toStorageQuantity(ing.unit, item.unit, item.quantity);
          return { ...item, ...converted };
        }),
        imageFile: variant.imageFile as File,
        image: editItem?.variants?.[index]?.image,
      }));

      await onSubmit({
        name: basicInfo.name,
        category: basicInfo.category,
        description: basicInfo.description,
        launchDate: basicInfo.launchDate ? new Date(basicInfo.launchDate).toISOString() : undefined,
        variants: normalizedVariants,
      });
    },
    [basicInfo, variantsFrom, categories, editItem, onSubmit, ingredients],
  );

  if (!open) return null;
  if (!isMount) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0!" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Tên sản phẩm *</label>
              <input
                value={basicInfo.name}
                onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                placeholder="VD: Pizza Pepperoni"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Danh mục *</label>
              <select
                onChange={e => setBasicInfo({ ...basicInfo, category: e.target.value })}
                value={basicInfo.category}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
              >
                {categories.map(
                  item =>
                    item.slug !== "all" && (
                      <option key={item.slug} value={item._id}>
                        {item.name}
                      </option>
                    ),
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Mô tả</label>
            <textarea
              value={basicInfo.description}
              onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
              rows={2}
              placeholder="Mô tả sản phẩm..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Ngày ra mắt</label>
            <input
              type="date"
              value={basicInfo.launchDate}
              onChange={e => setBasicInfo({ ...basicInfo, launchDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm">Size</label>
              <button
                type="button"
                onClick={addSize}
                className="flex items-center gap-1 text-primary text-sm hover:underline cursor-pointer"
              >
                <Plus size={14} /> Thêm size
              </button>
            </div>

            {variantsFrom.length === 0 ? (
              <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
                Chưa có size nào cho sản phẩm này.
              </div>
            ) : (
              <div className="space-y-2">
                {variantsFrom.map((variant, i) => (
                  <div key={i} className="flex flex-col gap-2 bg-muted/30 rounded-xl p-3">
                    <div className="flex justify-between gap-2">
                      <div className="flex gap-2 items-center">
                        {editItem && editItem.variants?.[i]?.image?.url && !variant.imageFile && (
                          <Image
                            src={editItem.variants[i].image.url}
                            alt={`Ảnh hiện tại ${variant.size || ""}`.trim()}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover border border-border"
                          />
                        )}
                        <ImageInput
                          accept="image/*"
                          className="h-20 w-20"
                          required={!editItem || !editItem.variants?.[i]?.image?.url}
                          onChange={e => {
                            const file = e.target.files?.[0] || null;
                            handleVariantChange(i, "imageFile", file);
                          }}
                        />
                        <div>
                          <label className="block col-span-2 text-xs mb-1">Size *</label>
                          <select
                            value={variant.size}
                            onChange={e => handleVariantChange(i, "size", e.target.value)}
                            className="w-30 px-3 py-2 rounded-lg border border-border bg-background outline-none text-sm text-center"
                          >
                            {SIZE_OPTIONS.map(s => {
                              const takenByOther = variantsFrom.some((v, idx) => idx !== i && v.size === s);
                              return (
                                <option key={s} value={s} disabled={takenByOther}>
                                  {s}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block col-span-2 text-xs mb-1">Giá bán (đ) *</label>
                          <CurrencyInput
                            value={variant.price}
                            onChange={(val: number) => handleVariantChange(i, "price", val)}
                            placeholder="170000"
                            className="w-30 px-3 py-2 rounded-xl border border-border bg-background focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-primary text-sm hover:underline cursor-pointer"
                          onClick={() => addIngredientToSize(i)}
                        >
                          Thêm nguyên liệu
                        </button>
                        <button
                          onClick={() => removeSize(i)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {categories
                      .find(c => c._id === basicInfo.category)
                      ?.slug?.toLowerCase()
                      .includes("pizza") && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground">Đế bánh:</span>
                        {CRUST_OPTIONS.map(opt => {
                          const checked = variant.crust?.includes(opt.value) ?? false;
                          const toggleCrust = () => {
                            const next = checked
                              ? variant.crust.filter(c => c !== opt.value)
                              : [...(variant.crust || []), opt.value];
                            handleVariantChange(i, "crust", next);
                          };
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                                checked ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={toggleCrust}
                                className="accent-primary w-3.5 h-3.5"
                              />
                              {opt.label}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-col">
                      {variant.recipe.map((ingredient, ingredientIndex) => (
                        <div key={ingredientIndex} className="flex items-center py-1 text-sm">
                          Nguyên liệu {ingredientIndex + 1}:
                          <select
                            value={ingredient.ingredient_id}
                            defaultValue={ingredients?.[0]?._id || ""}
                            onChange={e => {
                              const newIngredientId = e.target.value;
                              const selectedIngredient = ingredients?.find(item => item._id === newIngredientId);
                              handleRecipeChange(i, ingredientIndex, "ingredient_id", selectedIngredient?._id || "");
                              handleRecipeChange(i, ingredientIndex, "unit", getDisplayUnit(selectedIngredient?.unit || ""));
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background outline-none text-sm mx-1"
                          >
                            {ingredients?.map(ing => (
                              <option key={ing._id} value={ing._id || ""}>
                                {ing.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={ingredient.quantity}
                            onChange={e => handleRecipeChange(i, ingredientIndex, "quantity", e.target.value)}
                            placeholder="Trọng lượng"
                            required
                            min={1}
                            className="w-30 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:border-primary outline-none mr-1"
                          />
                          <input
                            type="text"
                            value={ingredient.unit}
                            placeholder="Đơn vị tính"
                            readOnly
                            className="w-20 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:border-primary outline-none"
                          />
                          <button
                            onClick={() => removeIngredientFromSize(i, ingredientIndex)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            {isLoading ? (
              <button className="flex-1 py-2.5 rounded-xl bg-primary/50 text-white transition-colors" disabled>
                Đang thêm vào cơ sở dữ liệu...
              </button>
            ) : (
              <button
                onClick={handleInternalSubmit}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {editItem ? "Cập nhật" : "Thêm mới"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
