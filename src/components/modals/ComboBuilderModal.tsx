"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart, areComboSelectionsEqual } from "@/src/context/cartContext";
import type { ToppingRef, ProductPopulated } from "@/src/context/cartContext";
import type { ComboSelectionPayload } from "@/src/services/cart.service";
import { removeFromCartApi } from "@/src/services/cart.service";
import { formatVND } from "@/src/utils/formatVND";
import { parseCrustOptions } from "@/src/app/(customer)/utils";
import type { ComboSlotSelection } from "@/src/app/(customer)/types";
import type { Product, Combo } from "@/src/services/menu.service";
import SlotCard from "@/src/app/(customer)/components/SlotCard";

interface ComboBuilderModalProps {
  combo: Combo;
  allProducts: Product[];
  /** Initial selections for editing flow (restore from cart item) */
  initialSelections?: Record<number, ComboSlotSelection[]>;
  /** Old SKU when editing an existing combo cart item */
  editOldSku?: string | null;
  onClose: () => void;
}

/** Tính giá gốc của combo (trước discount) */
function computeComboOriginalPrice(combo: Combo): number {
  if (combo.pricingType === "dynamic") return 0;
  if (combo.discountType === "percent") {
    return Math.round(combo.price / (1 - combo.discount / 100));
  }
  return combo.price + combo.discount;
}

/** Tính số tiền tiết kiệm */
function computeComboSavings(combo: Combo): number {
  if (combo.pricingType === "dynamic") return 0;
  return computeComboOriginalPrice(combo) - combo.price;
}

export default function ComboBuilderModal({
  combo,
  allProducts,
  initialSelections,
  editOldSku,
  onClose,
}: ComboBuilderModalProps) {
  const { user } = useCustomerAuth();
  const { addToCart, fetchCart, cart, setShowCart } = useCart();

  const [comboSelections, setComboSelections] = useState<Record<number, ComboSlotSelection[]>>(initialSelections || {});
  const [replacingRule, setReplacingRule] = useState<number | null>(null);
  const [replacingSlot, setReplacingSlot] = useState<{ ruleIdx: number; slotIdx: number } | null>(null);
  const editingComboOldSkuRef = useRef<string | null>(editOldSku || null);
  const comboCounterRef = useRef(0);
  const ruleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initializedRef = useRef(false);

  // Sync editOldSku when prop changes
  useEffect(() => {
    if (editOldSku && !initializedRef.current) {
      editingComboOldSkuRef.current = editOldSku;
    }
  }, [editOldSku]);

  // Reset state when combo changes (new combo opened)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    // Reset for new combo (not initial render)
    setComboSelections(initialSelections || {});
    setReplacingRule(null);
    setReplacingSlot(null);
    editingComboOldSkuRef.current = editOldSku || null;
  }, [combo._id]);

  // --- Computed ---

  const savings = computeComboSavings(combo);
  const originalPrice = computeComboOriginalPrice(combo);
  const comboImg = combo.image || "";
  const isDynamic = combo.pricingType === "dynamic";

  /** Lấy danh sách sản phẩm khả dụng cho 1 rule, đã lọc theo applicableSizes */
  const getProductsForRule = (rule: Combo["rules"][number]): Product[] => {
    let products: Product[];
    if (rule.applicableProducts && rule.applicableProducts.length > 0) {
      products = allProducts.filter(p => rule.applicableProducts.includes(p._id));
    } else {
      const categorySlugs = rule.applicableCategories.map(cat => cat.slug);
      products = allProducts.filter(p => categorySlugs.includes(p.category?.slug));
    }
    // Nếu rule có applicableSizes, chỉ giữ sản phẩm có ít nhất 1 variant khớp size
    if (rule.applicableSizes && rule.applicableSizes.length > 0) {
      products = products.filter(p => p.variants.some(v => rule.applicableSizes.includes(v.size)));
    }
    return products;
  };

  /** Tính giá động cho combo */
  const computeDynamicComboPrice = (): number => {
    if (combo.pricingType !== "dynamic") return combo.price ?? 0;
    let total = 0;
    combo.rules.forEach((rule, idx) => {
      const selections = comboSelections[idx] || [];
      selections.forEach(sel => {
        const product = allProducts.find(p => p._id === sel.productId);
        const variant = product?.variants.find(v => v.sku === sel.sku);
        if (variant) total += variant.price;
      });
    });
    if (combo.discountType === "percent" && combo.discount > 0) {
      total = Math.round(total * (1 - combo.discount / 100));
    } else if (combo.discountType === "amount" && combo.discount > 0) {
      total = Math.max(0, total - combo.discount);
    }
    return total;
  };

  const displayPrice = isDynamic ? computeDynamicComboPrice() : combo.price;

  const allComboSelectionsFilled = useMemo(() => {
    return combo.rules.every((rule, idx) => {
      const selected = comboSelections[idx] || [];
      return selected.length >= rule.requiredQuantity;
    });
  }, [combo, comboSelections]);

  // --- Handlers ---

  const handleSelectComboProduct = (ruleIndex: number, sku: string) => {
    const product = allProducts.find(p => p.variants.some(v => v.sku === sku));
    const rule = combo.rules[ruleIndex];
    // Ưu tiên chọn variant khớp với applicableSizes của rule
    let variant = product?.variants.find(v => v.sku === sku);
    if (!variant && product) {
      // Nếu không tìm thấy variant theo sku, chọn variant đầu tiên khớp applicableSizes
      if (rule.applicableSizes && rule.applicableSizes.length > 0) {
        variant = product.variants.find(v => rule.applicableSizes.includes(v.size));
      }
      if (!variant) variant = product.variants[0];
    }
    if (!variant || !product) return;
    const selection: ComboSlotSelection = {
      productId: product?._id || "",
      sku: sku,
      size: variant?.size || "",
      crust: variant ? parseCrustOptions(variant.crust)[0] || undefined : undefined,
    };

    // Slot-level replacement
    if (replacingSlot && replacingSlot.ruleIdx === ruleIndex) {
      setComboSelections(prev => {
        const current = [...(prev[ruleIndex] || [])];
        current[replacingSlot.slotIdx] = selection;
        return { ...prev, [ruleIndex]: current };
      });
      setReplacingSlot(null);
      return;
    }

    setComboSelections(prev => {
      const current = prev[ruleIndex] || [];
      const requiredQty = combo.rules[ruleIndex]?.requiredQuantity || 1;
      if (current.length < requiredQty) {
        return { ...prev, [ruleIndex]: [...current, selection] };
      }
      const next = [...current];
      next.shift();
      return { ...prev, [ruleIndex]: [...next, selection] };
    });
  };

  const handleChangeComboVariant = (
    ruleIndex: number,
    slotIdx: number,
    productId: string,
    newSku: string,
    newSize: string,
    newCrust?: string,
  ) => {
    setComboSelections(prev => {
      const current = [...(prev[ruleIndex] || [])];
      let idx = slotIdx;
      if (idx >= current.length || current[idx]?.productId !== productId) {
        idx = current.findIndex(s => s.productId === productId);
      }
      if (idx >= 0) {
        current[idx] = { productId, sku: newSku, size: newSize, crust: newCrust };
      }
      return { ...prev, [ruleIndex]: current };
    });
  };

  const handleAddComboToCart = async () => {
    const oldSku = editingComboOldSkuRef.current;
    if (oldSku) {
      const oldCartItem = cart?.items.find(item => item.sku === oldSku);
      if (oldCartItem) {
        if (user?.id) {
          try {
            await removeFromCartApi({
              userId: user.id,
              item_type: "combo",
              combo: combo._id,
              sku: oldSku,
              size: oldCartItem.size,
              combo_selections: oldCartItem.combo_selections?.map(sel => ({
                product_id: typeof sel.product_id === "string" ? sel.product_id : sel.product_id?._id || "",
                sku: sel.sku,
                size: sel.size,
                crust: sel.crust,
              })),
            });
          } catch {
            /* ignore */
          }
        } else {
          const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "{}");
          if (guestCart.items) {
            guestCart.items = guestCart.items.filter(
              (item: { sku: string; combo_selections?: Array<{ sku: string }> }) =>
                !(item.sku === oldSku && areComboSelectionsEqual(item.combo_selections, oldCartItem.combo_selections)),
            );
            localStorage.setItem("guest_cart", JSON.stringify(guestCart));
          }
        }
      }
      editingComboOldSkuRef.current = null;
    }

    comboCounterRef.current += 1;
    const newSku = `combo-${combo._id}-${comboCounterRef.current}`;

    const comboSelectionsPayload: ComboSelectionPayload[] = [];
    const populatedSelections: Array<{
      product_id: string | ProductPopulated;
      sku: string;
      size: string;
      crust?: string;
      added_topping: ToppingRef[];
    }> = [];

    combo.rules.forEach((rule, idx) => {
      (comboSelections[idx] || []).forEach(sel => {
        const product = allProducts.find(p => p._id === sel.productId);
        comboSelectionsPayload.push({
          product_id: sel.productId,
          sku: sel.sku,
          size: sel.size,
          crust: sel.crust,
          added_topping: [],
        });
        populatedSelections.push({
          product_id: product
            ? {
                _id: product._id,
                name: product.name,
                variants: product.variants.map(v => ({
                  image: { url: v.image.url },
                  size: v.size,
                  price: v.price,
                })),
              }
            : sel.productId,
          sku: sel.sku,
          size: sel.size,
          crust: sel.crust,
          added_topping: [],
        });
      });
    });

    await addToCart({
      userId: user?.id,
      item_type: "combo",
      combo: combo._id,
      comboInfo: {
        _id: combo._id,
        name: combo.name,
        image: combo.image,
        pricingType: combo.pricingType,
        discountType: combo.discountType,
        discount: combo.discount,
      },
      combo_selections: (user?.id ? comboSelectionsPayload : populatedSelections) as ComboSelectionPayload[],
      sku: newSku,
      crust: "",
      size: "",
      quantity: 1,
      note: "",
      price: displayPrice,
    });

    await fetchCart(user?.id);
    onClose();
    toast.success(
      <span>
        {oldSku ? (
          "Đã cập nhật combo!"
        ) : (
          <>
            Đã thêm combo vào{" "}
            <button
              className="underline font-medium hover:opacity-80"
              onClick={() => {
                setShowCart(true);
                toast.dismiss();
              }}
            >
              giỏ hàng
            </button>
            !
          </>
        )}
      </span>,
      { duration: 2000, position: "top-right" },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
      onClick={() => {
        onClose();
      }}
    >
      <div
        className="bg-card rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* Combo image */}
        <div className="md:w-2/5 bg-white border-b md:border-b-0 md:border-r border-border/60 flex items-center justify-center p-4 sm:p-6 shrink-0 relative">
          <div className="relative w-full max-w-[320px] aspect-square max-md:aspect-[3/2] max-md:max-h-[200px] max-md:max-w-[200px]">
            <Image
              src={comboImg}
              alt={combo.name}
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1024px) 60vw, 35vw"
              className="object-contain"
            />
          </div>
          {savings > 0 && (
            <span className="absolute top-3 sm:top-5 left-3 sm:left-5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-orange-500 text-white text-xs sm:text-sm font-semibold rounded-full">
              Tiết kiệm {formatVND(savings)}
            </span>
          )}
        </div>

        {/* Combo builder */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-5 pb-2 shrink-0">
            <div className="pr-3">
              <h3 className="text-lg sm:text-xl text-foreground font-bold">{combo.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                {combo.description}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Rules */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 space-y-3 sm:space-y-4 pb-2">
            {combo.rules.map((rule, ruleIdx) => {
              const products = getProductsForRule(rule);
              const selectedSelections = comboSelections[ruleIdx] || [];
              const isReplacing = replacingRule === ruleIdx;
              const isSlotReplacing = replacingSlot?.ruleIdx === ruleIdx;

              const slots = Array.from({ length: rule.requiredQuantity }, (_, slotIdx) => {
                const sel = selectedSelections[slotIdx] || null;
                const product = sel?.productId ? allProducts.find(p => p._id === sel.productId) : null;
                const variant = sel?.sku
                  ? product?.variants.find(v => v.sku === sel.sku) ||
                    (rule.applicableSizes && rule.applicableSizes.length > 0
                      ? product?.variants.find(v => rule.applicableSizes.includes(v.size))
                      : product?.variants[0])
                  : null;
                return { selection: sel, product, variant };
              });

              const isRuleFilled = selectedSelections.length >= rule.requiredQuantity;

              return (
                <div
                  key={ruleIdx}
                  ref={el => {
                    ruleRefs.current[ruleIdx] = el;
                  }}
                  className="border border-border rounded-2xl p-4 bg-muted/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      {rule.groupName}
                      <span className="text-xs text-muted-foreground ml-1 font-normal">
                        ({selectedSelections.length}/{rule.requiredQuantity})
                      </span>
                    </p>
                    {isSlotReplacing && (
                      <button
                        onClick={() => setReplacingSlot(null)}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                      >
                        Đóng
                      </button>
                    )}
                  </div>

                  {/* Selected slots */}
                  {selectedSelections.length > 0 && (
                    <div className="space-y-2">
                      {slots.map((slot, slotIdx) =>
                        slot.product && slot.variant ? (
                          <SlotCard
                            key={slotIdx}
                            product={slot.product}
                            variant={slot.variant}
                            selectedCrust={slot.selection?.crust}
                            ruleIdx={ruleIdx}
                            slotIdx={slotIdx}
                            applicableSizes={
                              rule.applicableSizes && rule.applicableSizes.length > 0 ? rule.applicableSizes : undefined
                            }
                            onChangeVariant={handleChangeComboVariant}
                            onReplace={(ri, si) => setReplacingSlot({ ruleIdx: ri, slotIdx: si })}
                            showReplace={isRuleFilled && !isReplacing && !isSlotReplacing}
                          />
                        ) : null,
                      )}
                    </div>
                  )}

                  {/* Product picker */}
                  {(isReplacing || !isRuleFilled || isSlotReplacing) && products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {products.map(product => {
                        // Chọn variant đầu tiên khớp với applicableSizes của rule
                        const repVariant =
                          rule.applicableSizes && rule.applicableSizes.length > 0
                            ? product.variants.find(v => rule.applicableSizes.includes(v.size))
                            : product.variants[0];
                        if (!repVariant) return null;
                        const isSelected = selectedSelections.some(s => s.productId === product._id);
                        return (
                          <button
                            key={product._id}
                            onClick={() => handleSelectComboProduct(ruleIdx, repVariant.sku)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 ring-1 ring-orange-200"
                                : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                                <Image
                                  src={repVariant.image.url}
                                  alt={product.name}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{product.name}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {products.length === 0 && <p className="text-xs text-muted-foreground italic">Không có sản phẩm khả dụng</p>}
                </div>
              );
            })}
          </div>

          {/* Footer with price and add button */}
          <div className="p-4 sm:p-5 border-t border-border space-y-2 shrink-0">
            {isDynamic ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Giá tự động tính theo sản phẩm đã chọn</span>
                {allComboSelectionsFilled && <span className="text-lg font-bold text-primary">{formatVND(displayPrice)}</span>}
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground line-through">{formatVND(originalPrice)}</span>
                <span className="text-green-600 text-xs font-medium">Tiết kiệm {formatVND(savings)}</span>
              </div>
            )}
            <button
              onClick={handleAddComboToCart}
              disabled={!allComboSelectionsFilled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors shadow-lg ${
                allComboSelectionsFilled
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/25"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Plus size={18} /> Thêm combo vào giỏ - {formatVND(displayPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
