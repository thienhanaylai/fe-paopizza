"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart, areComboSelectionsEqual, resolveComboId } from "@/src/context/cartContext";
import type { CartItem, ToppingRef, ProductPopulated } from "@/src/context/cartContext";
import type { ComboSelectionPayload } from "@/src/services/cart.service";
import { removeFromCartApi } from "@/src/services/cart.service";
import { formatVND } from "@/src/utils/formatVND";
import { parseCrustOptions } from "@/src/app/(customer)/utils";
import type { ComboSlotSelection } from "@/src/app/(customer)/types";
import type { Product, Combo } from "@/src/services/menu.service";
import SlotCard from "@/src/components/ui/SlotCard";
import { useModalScrollLock } from "@/src/hooks/useModalScrollLock";

interface ComboBuilderModalProps {
  combo: Combo;
  allProducts: Product[];
  /** Initial selections for editing flow (restore from cart item) */
  initialSelections?: Record<number, ComboSlotSelection[]>;
  /** Exact cart item being edited; combo ID and legacy guest SKU may not be unique. */
  editCartItem?: CartItem | null;
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

export default function ComboBuilderModal(props: ComboBuilderModalProps) {
  const editSelectionKey = props.editCartItem?.combo_selections
    ?.map(selection => `${selection.sku}:${selection.size}:${selection.crust || ""}`)
    .join("|");
  return (
    <ComboBuilderContent key={`${props.combo._id}:${props.editCartItem?.sku || "new"}:${editSelectionKey || ""}`} {...props} />
  );
}

function ComboBuilderContent({ combo, allProducts, initialSelections, editCartItem, onClose }: ComboBuilderModalProps) {
  const { user } = useCustomerAuth();
  const { addToCart, fetchCart, updateQuantity, cart, cartCount, setShowCart } = useCart();
  useModalScrollLock();

  const hasMobileCheckoutBar = cartCount > 0;
  const mobileModalHeightClass = hasMobileCheckoutBar
    ? "max-md:h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] max-md:max-h-[calc(100dvh-3.75rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]"
    : "max-md:h-[calc(100dvh-3rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] max-md:max-h-[calc(100dvh-3rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]";

  const [comboSelections, setComboSelections] = useState<Record<number, ComboSlotSelection[]>>(initialSelections || {});
  const [activeRuleIndex, setActiveRuleIndex] = useState(0);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<"products" | "summary">("products");
  const [replacingSlot, setReplacingSlot] = useState<{ ruleIdx: number; slotIdx: number } | null>(null);
  const [isCartSubmitting, setIsCartSubmitting] = useState(false);
  const editingComboItemRef = useRef<CartItem | null>(editCartItem || null);
  const cartSubmitLockRef = useRef(false);

  // Half-half: khi mở modal (kể cả edit), ép toàn bộ slot về CÙNG 1 đế + CÙNG 1 size
  // — lấy đế/size của slot đầu tiên đã chọn làm chuẩn
  useEffect(() => {
    if (!combo.isHalfHalf) return;
    const allSelections = combo.rules.flatMap((_, idx) => comboSelections[idx] || []);
    const firstCrust = allSelections.find(sel => sel.crust)?.crust;
    const firstSize = allSelections.find(sel => sel.size)?.size;
    if (!firstCrust && !firstSize) return;
    let changed = false;
    const next: Record<number, ComboSlotSelection[]> = {};
    for (const [ruleIdx, selections] of Object.entries(comboSelections)) {
      next[Number(ruleIdx)] = (selections || []).map(sel => {
        let updated = sel;
        if (firstCrust && sel.crust && sel.crust !== firstCrust) {
          updated = { ...updated, crust: firstCrust };
          changed = true;
        }
        if (firstSize && sel.size && sel.size !== firstSize) {
          // Đổi size lệch → tìm variant cùng product có size chuẩn
          const product = allProducts.find(p => p._id === sel.productId);
          const sameSizeVariant = product?.variants.find(v => v.size === firstSize);
          if (sameSizeVariant) {
            updated = { ...updated, sku: sameSizeVariant.sku, size: firstSize };
            changed = true;
          }
        }
        return updated;
      });
    }
    if (changed) setComboSelections(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo.isHalfHalf]);

  // --- Computed ---

  const savings = computeComboSavings(combo);
  const originalPrice = computeComboOriginalPrice(combo);
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

  // Half-half: toàn bộ các slot (nửa) phải dùng CHUNG 1 loại đế.
  // Lấy đế của slot đầu tiên đã chọn làm đế chung, các slot sau bị khoá theo đế này.
  const halfHalfLockedCrust = useMemo(() => {
    if (!combo.isHalfHalf) return undefined;
    for (const selections of Object.values(comboSelections)) {
      const withCrust = (selections || []).find(sel => sel.crust);
      if (withCrust?.crust) return withCrust.crust;
    }
    return undefined;
  }, [combo.isHalfHalf, comboSelections]);

  // Half-half: toàn bộ các slot (nửa) phải dùng CHUNG 1 size (vd M hoặc L).
  const halfHalfLockedSize = useMemo(() => {
    if (!combo.isHalfHalf) return undefined;
    for (const selections of Object.values(comboSelections)) {
      const withSize = (selections || []).find(sel => sel.size);
      if (withSize?.size) return withSize.size;
    }
    return undefined;
  }, [combo.isHalfHalf, comboSelections]);

  const currentSelectionKeys = useMemo(
    () => combo.rules.flatMap((_, idx) => comboSelections[idx] || []).map(selection => ({ sku: selection.sku })),
    [combo.rules, comboSelections],
  );
  const existingComboItem = useMemo(() => {
    if (!cart) return undefined;
    if (editCartItem) return editCartItem;
    return cart.items.find(
      item =>
        item.item_type === "combo" &&
        resolveComboId(item.combo) === combo._id &&
        areComboSelectionsEqual(item.combo_selections, currentSelectionKeys),
    );
  }, [cart, combo._id, currentSelectionKeys, editCartItem]);
  const hasExistingCombo = Boolean(existingComboItem);

  const totalRemainingSelections = useMemo(() => {
    return combo.rules.reduce((total, rule, idx) => {
      const selectedCount = comboSelections[idx]?.length || 0;
      return total + Math.max(0, rule.requiredQuantity - selectedCount);
    }, 0);
  }, [combo, comboSelections]);
  const allComboSelectionsFilled = totalRemainingSelections === 0;
  const selectionSteps = useMemo(
    () =>
      combo.rules.flatMap((rule, ruleIdx) =>
        Array.from({ length: rule.requiredQuantity }, (_, slotIdx) => ({ ruleIdx, slotIdx })),
      ),
    [combo.rules],
  );
  const totalRequiredSelections = selectionSteps.length;
  const totalSelectedSelections = totalRequiredSelections - totalRemainingSelections;
  const activeRule = combo.rules[activeRuleIndex];
  const activeRuleProducts = activeRule ? getProductsForRule(activeRule) : [];
  const activeRuleSelections = comboSelections[activeRuleIndex] || [];
  const activeSlotSelection = activeRuleSelections[activeSlotIndex];
  const activeStepIndex = Math.max(
    0,
    selectionSteps.findIndex(step => step.ruleIdx === activeRuleIndex && step.slotIdx === activeSlotIndex),
  );

  const goToSelectionStep = (stepIndex: number) => {
    const step = selectionSteps[stepIndex];
    if (!step) return;
    setActiveRuleIndex(step.ruleIdx);
    setActiveSlotIndex(step.slotIdx);
    setReplacingSlot(null);
  };

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
    // Half-half: nếu đã có size chung, ưu tiên variant theo size chung
    if (combo.isHalfHalf && halfHalfLockedSize) {
      const sameSizeVariant = product?.variants.find(v => v.size === halfHalfLockedSize);
      if (sameSizeVariant) {
        variant = sameSizeVariant;
      }
    }
    if (!variant || !product) return;
    const selectedSku = variant.sku;
    // Half-half: nếu đã có đế chung, ép đế của selection mới theo đế chung (nếu variant hỗ trợ)
    let effectiveCrust =
      variant ? parseCrustOptions(variant.crust)[0] || undefined : undefined;
    if (combo.isHalfHalf && halfHalfLockedCrust) {
      const supportedCrusts = parseCrustOptions(variant?.crust);
      if (supportedCrusts.includes(halfHalfLockedCrust)) {
        effectiveCrust = halfHalfLockedCrust;
      }
    }
    // Half-half: nếu đã có size chung nhưng sản phẩm không có variant size đó → chặn
    if (combo.isHalfHalf && halfHalfLockedSize && variant.size !== halfHalfLockedSize) {
      toast.error(`Combo half-half phải cùng size ${halfHalfLockedSize}. Vui lòng chọn sản phẩm có size ${halfHalfLockedSize}.`);
      return;
    }
    const selection: ComboSlotSelection = {
      productId: product?._id || "",
      sku: selectedSku,
      size: variant?.size || "",
      crust: effectiveCrust,
    };

    const currentSelections = comboSelections[ruleIndex] || [];
    const replacementTarget = replacingSlot?.ruleIdx === ruleIndex ? replacingSlot : null;
    const targetSlotIndex = replacementTarget?.slotIdx ?? Math.min(activeSlotIndex, currentSelections.length);
    const isReplacingSelection = replacementTarget !== null;
    const isFillingNewSlot = targetSlotIndex >= currentSelections.length;

    setComboSelections(prev => {
      const current = [...(prev[ruleIndex] || [])];
      if (targetSlotIndex < current.length) {
        current[targetSlotIndex] = selection;
      } else {
        current.push(selection);
      }
      return { ...prev, [ruleIndex]: current };
    });
    setReplacingSlot(null);

    if (isReplacingSelection) {
      setMobilePanel("summary");
      return;
    }

    if (isFillingNewSlot) {
      const currentStepIndex = selectionSteps.findIndex(step => step.ruleIdx === ruleIndex && step.slotIdx === targetSlotIndex);
      const orderedRemainingSteps = [...selectionSteps.slice(currentStepIndex + 1), ...selectionSteps.slice(0, currentStepIndex)];
      const nextIncompleteStep = orderedRemainingSteps.find(step => !comboSelections[step.ruleIdx]?.[step.slotIdx]);

      if (nextIncompleteStep) {
        setActiveRuleIndex(nextIncompleteStep.ruleIdx);
        setActiveSlotIndex(nextIncompleteStep.slotIdx);
      } else {
        setMobilePanel("summary");
      }
    }
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
      if (idx < 0) return prev;

      current[idx] = { productId, sku: newSku, size: newSize, crust: newCrust };

      // Luôn ghi slot đã sửa vào rule hiện tại
      const next: Record<number, ComboSlotSelection[]> = {};
      for (const [rIdx, selections] of Object.entries(prev)) {
        const r = Number(rIdx);
        if (r === ruleIndex) {
          next[r] = current;
        } else {
          next[r] = selections || [];
        }
      }
      if (!(ruleIndex in next)) next[ruleIndex] = current;

      // Half-half: đồng bộ size + đế sang MỌI slot khác (đổi ở slot nào, slot kia đổi theo)
      if (combo.isHalfHalf) {
        for (const [rIdx, selections] of Object.entries(next)) {
          const r = Number(rIdx);
          if (r === ruleIndex) continue;
          const synced = (selections || []).map(sel => {
            let updated = sel;
            // Đồng bộ đế
            if (newCrust && sel.crust !== newCrust) {
              updated = { ...updated, crust: newCrust };
            }
            // Đồng bộ size (cùng product: đổi sku theo size mới)
            if (newSize && sel.size !== newSize) {
              const product = allProducts.find(p => p._id === sel.productId);
              const sameSizeVariant = product?.variants.find(v => v.size === newSize);
              if (sameSizeVariant) {
                // Đế mới phải được size mới hỗ trợ
                const supportedCrusts = parseCrustOptions(sameSizeVariant.crust);
                const crust =
                  newCrust && supportedCrusts.includes(newCrust)
                    ? newCrust
                    : sel.crust;
                updated = { ...updated, sku: sameSizeVariant.sku, size: newSize, crust };
              }
            }
            return updated;
          });
          next[r] = synced;
        }
      }

      return next;
    });
  };

  const handleAddOneComboToCart = async () => {
    if (!existingComboItem || cartSubmitLockRef.current) return;

    cartSubmitLockRef.current = true;
    setIsCartSubmitting(true);
    try {

    await updateQuantity({
      userId: user?.id,
      item_type: "combo",
      combo: combo._id,
      sku: existingComboItem.sku,
      size: existingComboItem.size,
      currentQty: existingComboItem.quantity,
      change: 1,
      combo_selections: existingComboItem.combo_selections,
    });

    toast.success("Đã thêm 1 combo vào giỏ hàng", { duration: 2000, position: "top-right" });
    } finally {
      cartSubmitLockRef.current = false;
      setIsCartSubmitting(false);
    }
  };

  const handleAddComboToCart = async () => {
    if (cartSubmitLockRef.current) return;

    cartSubmitLockRef.current = true;
    setIsCartSubmitting(true);
    try {
    const oldCartItem = editingComboItemRef.current;
    const oldSku = oldCartItem?.sku;
    if (oldCartItem && oldSku) {
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
      editingComboItemRef.current = null;
    }

    const uniqueSuffix =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newSku = `combo-${combo._id}-${uniqueSuffix}`;

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
        discountType: combo.discountType === "fixed" ? "amount" : combo.discountType,
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
    if (oldSku) {
      onClose();
      setShowCart(true);
    }
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
    } finally {
      cartSubmitLockRef.current = false;
      setIsCartSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 m-0 flex h-[100dvh] justify-center overflow-hidden overscroll-none bg-black/50 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] sm:inset-0 sm:h-auto sm:items-center sm:p-4 ${
        hasMobileCheckoutBar
          ? "items-end pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"
          : "items-center pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
      onClick={() => {
        onClose();
      }}
    >
      <div
        className={`flex h-[95vh] max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-card shadow-2xl md:flex-row ${mobileModalHeightClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-card p-2 md:hidden">
          <div className="grid min-w-0 flex-1 grid-cols-2 rounded-xl bg-muted p-1">
            <button
              onClick={() => setMobilePanel("products")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                mobilePanel === "products" ? "bg-card text-orange-600 shadow-sm" : "text-muted-foreground"
              }`}
            >
              Chọn món
            </button>
            <button
              onClick={() => setMobilePanel("summary")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                mobilePanel === "summary" ? "bg-card text-orange-600 shadow-sm" : "text-muted-foreground"
              }`}
            >
              Đã chọn {totalSelectedSelections}/{totalRequiredSelections}
            </button>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        {/* Product selection */}
        <section
          className={`${
            mobilePanel === "products" ? "flex" : "hidden"
          } min-h-0 flex-1 flex-col border-border/60 bg-muted/20 md:flex md:w-3/5 md:flex-none md:border-r`}
        >
          <div className="shrink-0 border-b border-border/60 bg-card/80 p-3 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                  Bước {Math.min(activeStepIndex + 1, totalRequiredSelections)}/{totalRequiredSelections}
                </p>
                <h4 className="mt-0.5 truncate text-base font-bold text-foreground">
                  {activeRule?.groupName || "Chọn sản phẩm"}
                  {activeRule && activeRule.requiredQuantity > 1
                    ? ` · Lựa chọn ${activeSlotIndex + 1}/${activeRule.requiredQuantity}`
                    : ""}
                </h4>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => goToSelectionStep(activeStepIndex - 1)}
                  disabled={activeStepIndex === 0}
                  className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Lựa chọn trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => goToSelectionStep(activeStepIndex + 1)}
                  disabled={activeStepIndex >= totalRequiredSelections - 1 || !activeSlotSelection}
                  className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Lựa chọn tiếp theo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-300"
                style={{
                  width: `${totalRequiredSelections > 0 ? (totalSelectedSelections / totalRequiredSelections) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div data-modal-scroll className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-4 sm:p-5">
            {activeRule ? (
              <>
                <p className={`mb-3 text-xs ${activeSlotSelection ? "text-green-700" : "text-muted-foreground"}`}>
                  {activeSlotSelection ? "Đã chọn món này. Bấm món khác để thay thế." : "Chọn một sản phẩm để tiếp tục."}
                </p>

                {activeRuleProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                    {activeRuleProducts.map(product => {
                      const variant =
                        activeRule.applicableSizes && activeRule.applicableSizes.length > 0
                          ? product.variants.find(item => activeRule.applicableSizes.includes(item.size))
                          : product.variants[0];
                      if (!variant) return null;

                      const isSelected = activeSlotSelection?.productId === product._id;

                      return (
                        <button
                          key={product._id}
                          onClick={() => handleSelectComboProduct(activeRuleIndex, variant.sku)}
                          className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                            isSelected
                              ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200 dark:bg-orange-950/20"
                              : "border-border bg-card hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                          } cursor-pointer`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          )}
                          <div className="relative mx-auto aspect-square w-full max-w-40">
                            <Image
                              src={variant.image.url}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 180px"
                              className="object-contain transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                          <p className="mt-2 line-clamp-2 text-center text-sm font-semibold text-foreground">{product.name}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Không có sản phẩm khả dụng cho nhóm này.
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Combo chưa có quy tắc chọn sản phẩm.
              </div>
            )}
          </div>
        </section>

        {/* Selected products */}
        <section className={`${mobilePanel === "summary" ? "flex" : "hidden"} min-h-0 flex-1 flex-col md:flex md:w-2/5`}>
          <div className="flex shrink-0 items-start justify-between border-b border-border/60 p-4 sm:p-5">
            <div className="min-w-0 pr-3">
              <h3 className="text-lg font-bold text-foreground sm:text-xl">{combo.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{combo.description}</p>
              {savings > 0 && (
                <span className="mt-2 inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Tiết kiệm {formatVND(savings)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="hidden shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted md:block">
              <X size={18} />
            </button>
          </div>

          <div data-modal-scroll className="min-h-0 flex-1 space-y-3 touch-pan-y overflow-y-auto overscroll-contain p-4 sm:p-5">
            {combo.rules.map((rule, ruleIdx) => {
              const selectedSelections = comboSelections[ruleIdx] || [];
              const isSlotReplacing = replacingSlot?.ruleIdx === ruleIdx;
              const isRuleFilled = selectedSelections.length >= rule.requiredQuantity;
              const remainingQuantity = Math.max(0, rule.requiredQuantity - selectedSelections.length);
              const slots = Array.from({ length: rule.requiredQuantity }, (_, slotIdx) => {
                const selection = selectedSelections[slotIdx] || null;
                const product = selection?.productId ? allProducts.find(item => item._id === selection.productId) : null;
                const variant = selection?.sku
                  ? product?.variants.find(item => item.sku === selection.sku) ||
                    (rule.applicableSizes && rule.applicableSizes.length > 0
                      ? product?.variants.find(item => rule.applicableSizes.includes(item.size))
                      : product?.variants[0])
                  : null;
                return { selection, product, variant };
              });

              return (
                <div
                  key={ruleIdx}
                  className={`rounded-2xl border p-3 transition-colors ${
                    isRuleFilled
                      ? "border-green-200 bg-green-50/30 dark:border-green-800/50 dark:bg-green-950/10"
                      : "border-orange-200 bg-orange-50/30 dark:border-orange-800/50 dark:bg-orange-950/10"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{rule.groupName}</p>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isRuleFilled
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                      }`}
                    >
                      {isRuleFilled && <Check size={12} strokeWidth={2.5} />}
                      {selectedSelections.length}/{rule.requiredQuantity}
                    </span>
                  </div>

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
                            onReplace={(selectedRuleIdx, selectedSlotIdx) => {
                              setActiveRuleIndex(selectedRuleIdx);
                              setActiveSlotIndex(selectedSlotIdx);
                              setReplacingSlot({ ruleIdx: selectedRuleIdx, slotIdx: selectedSlotIdx });
                              setMobilePanel("products");
                            }}
                            showReplace={!isSlotReplacing}
                          />
                        ) : null,
                      )}
                    </div>
                  )}

                  {!isSlotReplacing && !isRuleFilled ? (
                    <button
                      onClick={() => {
                        setActiveRuleIndex(ruleIdx);
                        setActiveSlotIndex(selectedSelections.length);
                        setReplacingSlot(null);
                        setMobilePanel("products");
                      }}
                      className="mt-2 w-full rounded-xl border border-dashed border-orange-300 px-3 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                    >
                      Chọn thêm {remainingQuantity} sản phẩm
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="hidden shrink-0 space-y-2 border-t border-border p-3 sm:p-5 md:block">
            {!isDynamic && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground line-through">{formatVND(originalPrice)}</span>
                <span className="text-xs font-medium text-green-600">Tiết kiệm {formatVND(savings)}</span>
              </div>
            )}
            {hasExistingCombo && allComboSelectionsFilled && (
              <button
                onClick={handleAddOneComboToCart}
                disabled={isCartSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500 bg-card px-4 py-3 text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={18} /> Thêm 1 combo vào giỏ
              </button>
            )}
            <button
              onClick={handleAddComboToCart}
              disabled={!allComboSelectionsFilled || isCartSubmitting}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 shadow-lg transition-colors ${
                allComboSelectionsFilled
                  ? "bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              {allComboSelectionsFilled ? (
                <>
                  <Plus size={18} /> {hasExistingCombo ? "Cập nhật combo" : "Thêm combo vào giỏ"} - {formatVND(displayPrice)}
                </>
              ) : (
                <>
                  Cần chọn thêm {totalRemainingSelections} sản phẩm - {formatVND(displayPrice)}
                </>
              )}
            </button>
          </div>
        </section>

        <div className="shrink-0 border-t border-border bg-card p-3 md:hidden">
          {hasExistingCombo && allComboSelectionsFilled && (
            <button
              onClick={handleAddOneComboToCart}
              disabled={isCartSubmitting}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500 bg-card px-4 py-3 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} /> Thêm 1 combo vào giỏ
            </button>
          )}
          <button
            onClick={handleAddComboToCart}
            disabled={!allComboSelectionsFilled || isCartSubmitting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-colors ${
              allComboSelectionsFilled
                ? "bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600"
                : "cursor-not-allowed bg-muted text-muted-foreground shadow-none"
            }`}
          >
            {allComboSelectionsFilled ? (
              <>
                <Plus size={18} /> {hasExistingCombo ? "Cập nhật combo" : "Thêm combo vào giỏ"} - {formatVND(displayPrice)}
              </>
            ) : (
              <>
                Cần chọn thêm {totalRemainingSelections} sản phẩm - {formatVND(displayPrice)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
