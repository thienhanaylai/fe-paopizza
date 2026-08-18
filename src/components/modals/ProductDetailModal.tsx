"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Plus, SquarePen, X } from "lucide-react";
import { toast } from "sonner";

import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart } from "@/src/context/cartContext";
import type { CartItem } from "@/src/context/cartContext";
import { Textarea } from "@/src/components/ui/textarea";
import { formatVND } from "@/src/utils/formatVND";
import { formatCrustLabel } from "@/src/utils/formatCrustLabel";
import { getDiscountedVariantPrice } from "@/src/utils/variantPricing";
import type { Product } from "@/src/services/menu.service";
import { parseCrustOptions } from "@/src/app/(customer)/utils";
import type { ExtraTopping } from "@/src/app/(customer)/types";
import { useModalScrollLock } from "@/src/hooks/useModalScrollLock";

interface ProductDetailModalProps {
  products: Product[];
  initialProduct: Product | null;
  extraToppings: ExtraTopping[];
  /** Initial selection state (used when editing a cart item) */
  initialState?: {
    size?: string;
    crust?: string;
    toppingIds?: string[];
    note?: string;
  };
  /** Exact cart line being edited. This is required to distinguish variants with the same size. */
  editCartItem?: CartItem | null;
  onClose: () => void;
}

export default function ProductDetailModal({
  products,
  initialProduct,
  extraToppings,
  initialState,
  editCartItem,
  onClose,
}: ProductDetailModalProps) {
  const { user } = useCustomerAuth();
  const { addToCart, fetchCart, updateQuantity, updateCartProduct, cart, cartCount, setShowCart } = useCart();

  const [isUpdating, setUpdating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedCrust, setSelectedCrust] = useState<string>("");
  const [selectedExtraToppingIds, setSelectedExtraToppingIds] = useState<string[]>([]);
  const [showAllExtraToppings, setShowAllExtraToppings] = useState(false);
  const [note, setNote] = useState<string>("");
  const hasMobileCheckoutBar = cartCount > 0;
  const mobileModalHeightClass = hasMobileCheckoutBar
    ? "max-md:h-[min(90dvh,calc(100dvh-3rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))] max-md:max-h-[min(89dvh,calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))]"
    : "max-md:h-[calc(100dvh-3rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] max-md:max-h-[calc(100dvh-3rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]";

  useModalScrollLock();

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ skipSnaps: true, duration: 30 });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Skeleton loading khi đổi sản phẩm
  const [modalLoading, setModalLoading] = useState(false);
  const prevProductIdRef = useRef<string | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentProductIndex = useMemo(() => {
    if (!selectedProduct) return -1;
    return products.findIndex(p => p._id === selectedProduct._id);
  }, [products, selectedProduct]);

  const handleProductChange = useCallback(
    (product: Product, skipLoading = false) => {
      // Clear timeout cũ nếu có
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }

      setSelectedProduct(product);
      const firstVariant = product.variants[0];
      const isPizza = product.category?.slug?.toLowerCase().includes("pizza") || product.name?.toLowerCase().includes("pizza");
      const firstCrust = parseCrustOptions(firstVariant?.crust)[0] || "";

      setSelectedSize(firstVariant?.size || "");
      setSelectedCrust(isPizza ? firstCrust : "");
      setSelectedExtraToppingIds([]);
      setShowAllExtraToppings(false);

      const productInCart = cart?.items.find(i => i.sku === firstVariant?.sku);
      setNote(productInCart ? productInCart.note : "");

      if (!skipLoading) {
        setModalLoading(true);
        loadingTimerRef.current = setTimeout(() => {
          setModalLoading(false);
          loadingTimerRef.current = null;
        }, 400);
      }
      prevProductIdRef.current = product._id;
    },
    [cart?.items],
  );

  // Dùng ref để tránh embla useEffect phụ thuộc vào handleProductChange
  const handleProductChangeRef = useRef(handleProductChange);
  useEffect(() => {
    handleProductChangeRef.current = handleProductChange;
  }, [handleProductChange]);

  // Đồng bộ Embla -> selectedProduct khi vuốt
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      if (products[idx] && products[idx]._id !== selectedProduct?._id) {
        handleProductChangeRef.current(products[idx]);
      }
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, products, selectedProduct]);

  // Nhảy đến sản phẩm khi mở modal hoặc đổi sản phẩm
  useLayoutEffect(() => {
    if (emblaApi && currentProductIndex >= 0) {
      emblaApi.scrollTo(currentProductIndex, true);
    }
  }, [emblaApi, currentProductIndex]);

  // Khởi tạo selectedProduct từ initialProduct — dùng chung handleProductChange
  const initialProductAppliedRef = useRef(false);
  useEffect(() => {
    if (initialProduct && initialProduct._id !== prevProductIdRef.current) {
      initialProductAppliedRef.current = true;
      handleProductChange(initialProduct);
    }
    if (!initialProduct) {
      prevProductIdRef.current = null;
      initialProductAppliedRef.current = false;
      setModalLoading(false);
    }
  }, [initialProduct, handleProductChange]);

  // Áp dụng initial state từ editing flow (chỉ chạy 1 lần khi mở modal)
  const initialStateAppliedRef = useRef(false);
  useEffect(() => {
    if (initialProduct && initialState && !initialStateAppliedRef.current) {
      initialStateAppliedRef.current = true;
      if (initialState.size) setSelectedSize(initialState.size);
      if (initialState.crust) setSelectedCrust(initialState.crust);
      if (initialState.toppingIds) setSelectedExtraToppingIds(initialState.toppingIds);
      if (initialState.note !== undefined) setNote(initialState.note);
    }
    if (!initialProduct) {
      initialStateAppliedRef.current = false;
    }
  }, [initialProduct, initialState]);

  // --- Computed values ---

  const isPizzaProduct = useMemo(() => {
    if (!selectedProduct) return false;
    const catSlug = selectedProduct.category?.slug?.toLowerCase() || "";
    const name = selectedProduct.name?.toLowerCase() || "";
    return catSlug.includes("pizza") || name.includes("pizza");
  }, [selectedProduct]);

  const showExtraTopping = useMemo(() => {
    if (!selectedProduct) return false;
    const catSlug = selectedProduct.category?.slug?.toLowerCase() || "";
    const name = selectedProduct.name?.toLowerCase() || "";
    return (
      catSlug.includes("pizza") ||
      catSlug.includes("dessert") ||
      catSlug.includes("desert") ||
      name.includes("pizza") ||
      name.includes("dessert") ||
      name.includes("desert")
    );
  }, [selectedProduct]);

  const availableSizes = useMemo(() => {
    if (!selectedProduct) return [];
    return Array.from(new Set(selectedProduct.variants.map(v => v.size)));
  }, [selectedProduct]);

  const availableCrusts = useMemo(() => {
    if (!selectedProduct || !selectedSize) return [];
    return Array.from(
      new Set(
        selectedProduct.variants
          .filter(v => v.size === selectedSize)
          .flatMap(v => parseCrustOptions(v.crust))
          .filter(Boolean),
      ),
    );
  }, [selectedProduct, selectedSize]);

  const selectedVariant = useMemo(() => {
    if (!selectedProduct) return null;
    const exact = selectedProduct.variants.find(
      v => v.size === selectedSize && (!isPizzaProduct || !selectedCrust || parseCrustOptions(v.crust).includes(selectedCrust)),
    );
    if (exact) return exact;
    const fallback = selectedProduct.variants.find(v => v.size === selectedSize);
    return fallback || selectedProduct.variants[0] || null;
  }, [selectedProduct, selectedSize, selectedCrust, isPizzaProduct]);

  const baseIngredientIdSet = useMemo(() => {
    if (!selectedVariant) return new Set<string>();
    return new Set(selectedVariant.recipe.map(item => item.ingredient._id));
  }, [selectedVariant]);

  const extraToppingOptions = useMemo(() => {
    return extraToppings.filter(
      item =>
        item.isActive &&
        !item.isDeleted &&
        !baseIngredientIdSet.has(item._id) &&
        !["drink", "dough", "other"].includes(item.category),
    );
  }, [baseIngredientIdSet, extraToppings]);

  const visibleExtraToppingOptions = showAllExtraToppings ? extraToppingOptions : extraToppingOptions.slice(0, 3);

  const selectedExtraToppings = useMemo(() => {
    return extraToppingOptions.filter(item => selectedExtraToppingIds.includes(item._id));
  }, [extraToppingOptions, selectedExtraToppingIds]);

  const extraToppingTotal = useMemo(() => {
    return selectedExtraToppings.reduce((total, item) => total + Number(item.price || 0), 0);
  }, [selectedExtraToppings]);

  const unitPrice = useMemo(() => {
    if (!selectedVariant) return 0;
    return Number(selectedVariant.price || 0) + extraToppingTotal;
  }, [extraToppingTotal, selectedVariant]);

  const discountedPrice = useMemo(() => {
    if (!selectedVariant) return unitPrice;
    return getDiscountedVariantPrice(selectedVariant) + extraToppingTotal;
  }, [extraToppingTotal, selectedVariant, unitPrice]);

  const hasDiscount =
    selectedVariant &&
    Number(selectedVariant.discount) > 0 &&
    (selectedVariant.discountType === "percent" || selectedVariant.discountType === "amount");

  // Item đang được chọn trong modal. Khi modal được mở từ CartModal,
  // editCartItem luôn là đúng dòng cũ; nếu mở từ menu thì tìm theo variant hiện tại.
  const selectedCartItem = useMemo(() => {
    if (!selectedVariant || !cart) return undefined;
    return cart.items.find(
      item =>
        item.item_type === "product" &&
        item.sku === selectedVariant.sku &&
        (isPizzaProduct ? (item.crust || "") === (selectedCrust || "") : !item.crust),
    );
  }, [cart, isPizzaProduct, selectedCrust, selectedVariant]);

  const existingCartItem = editCartItem || selectedCartItem;

  const isEditMode = Boolean(existingCartItem);

  const syncNoteBySku = (sku: string) => {
    const productInCart = cart?.items.find(item => item.sku === sku);
    setNote(productInCart ? productInCart.note : "");
  };

  const handleSelectSize = (size: string) => {
    if (!selectedProduct) return;
    const nextVariant = isPizzaProduct
      ? selectedProduct.variants.find(
          v => v.size === size && (!selectedCrust || parseCrustOptions(v.crust).includes(selectedCrust)),
        ) ||
        selectedProduct.variants.find(v => v.size === size) ||
        null
      : selectedProduct.variants.find(v => v.size === size) || null;

    setSelectedSize(size);
    setSelectedCrust(isPizzaProduct ? parseCrustOptions(nextVariant?.crust)[0] || "" : "");
    if (nextVariant) syncNoteBySku(nextVariant.sku);
  };

  const handleSelectCrust = (crust: string) => {
    if (!selectedProduct || !isPizzaProduct) return;
    setSelectedCrust(crust);
    const nextVariant = selectedProduct.variants.find(v => v.size === selectedSize && parseCrustOptions(v.crust).includes(crust));
    if (nextVariant) syncNoteBySku(nextVariant.sku);
  };

  const handleToggleExtraTopping = (toppingId: string) => {
    setSelectedExtraToppingIds(prev => (prev.includes(toppingId) ? prev.filter(id => id !== toppingId) : [...prev, toppingId]));
  };

  const handleAddOneToCart = async () => {
    if (!selectedProduct || !selectedVariant || !selectedCartItem) return;

    await updateQuantity({
      userId: user?.id,
      item_type: "product",
      product_id: selectedProduct._id,
      sku: selectedCartItem.sku,
      size: selectedCartItem.size,
      crust: selectedCartItem.crust,
      currentQty: selectedCartItem.quantity,
      change: 1,
    });

    toast.success("Đã thêm 1 sản phẩm vào giỏ hàng", { duration: 2000, position: "top-right" });
  };

  const handleUpdateCart = async () => {
    if (!selectedProduct || !selectedVariant) return;
    setUpdating(true);
    const wasInCart = Boolean(editCartItem) || cart?.items.some(
      item =>
        item.item_type === "product" &&
        item.sku === selectedVariant.sku &&
        (isPizzaProduct ? (item.crust || "") === (selectedCrust || "") : !item.crust),
    );

    const toppingNote = selectedExtraToppings.map(item => item.name).join(", ");
    const finalNote = [note.trim(), toppingNote ? `Extra topping: ${toppingNote}` : ""].filter(Boolean).join(" | ");

    if (editCartItem) {
      await updateCartProduct({
        userId: user?.id,
        item: editCartItem,
        productId: selectedProduct._id,
        sku: selectedVariant.sku,
        size: selectedVariant.size,
        crust: selectedCrust || undefined,
        note: finalNote,
        addedTopping: selectedExtraToppingIds,
        price: discountedPrice,
      });
    } else {
      await addToCart({
        userId: user?.id,
        item_type: "product",
        product_id: selectedProduct._id,
        product: {
          _id: selectedProduct._id,
          name: selectedProduct.name,
          variants: selectedProduct.variants.map(v => ({
            image: { url: v.image.url },
            sku: v.sku,
            size: v.size,
            price: v.price,
            discountType: v.discountType,
            discount: v.discount,
          })),
        },
        sku: selectedVariant.sku,
        size: selectedVariant.size,
        crust: selectedCrust || undefined,
        quantity: 1,
        note: finalNote,
        price: discountedPrice,
        added_topping: selectedExtraToppingIds,
      });
    }

    const fetchedCart = (await fetchCart(user?.id)) as
      | { items?: Array<{ sku: string; crust?: string; note?: string }> }
      | undefined
      | null;
    const productInCart = fetchedCart?.items?.find(
      item =>
        item.sku === selectedVariant.sku &&
        (isPizzaProduct ? (item.crust || "") === (selectedCrust || "") : !item.crust),
    );
    setNote(productInCart?.note || "");
    if (wasInCart) {
      onClose();
      setShowCart(true);
    }
    setUpdating(false);
    toast.success(
      <span>
        {wasInCart ? (
          <>
            Đã cập nhật{" "}
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
        ) : (
          <>
            Đã thêm vào{" "}
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

  if (!selectedProduct || !selectedVariant) return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 m-0 flex h-[100dvh] items-start sm:items-center justify-center overflow-hidden overscroll-none bg-black/50 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] sm:inset-0 sm:h-auto sm:p-4 ${
        hasMobileCheckoutBar
          ? "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
          : "pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
      onClick={onClose}
    >
      <div className="relative flex items-center gap-2 sm:gap-4 w-full max-w-[calc(100vw-0.5rem)] sm:max-w-[calc(100vw-7rem)] justify-center">
        {/* Prev button - desktop */}
        <div className="hidden sm:block w-10 h-10 shrink-0">
          {products.length > 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                scrollPrev();
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-border text-foreground hover:bg-white hover:scale-110 transition-all cursor-pointer"
              aria-label="Sản phẩm trước"
            >
              <ChevronLeft size={22} />
            </button>
          )}
        </div>

        {/* Carousel */}
        <div
          className={`relative h-auto w-full max-w-[calc(100vw-1rem)] shrink-0 overflow-hidden rounded-3xl shadow-2xl sm:max-w-[calc(100vw-7rem)] md:h-[min(660px,90vh)] md:w-[800px] lg:w-[896px] ${mobileModalHeightClass}`}
          onClick={e => e.stopPropagation()}
        >
          <div ref={emblaRef} className="h-full overflow-hidden">
            <div className="flex h-full">
              {products.map(p => (
                <div key={p._id} className="flex-[0_0_100%] min-w-0 h-full">
                  <div className={`h-full bg-card flex flex-col md:flex-row ${mobileModalHeightClass}`}>
                    {/* Product image */}
                    <div className="md:w-2/5 bg-white border-b md:border-b-0 md:border-r border-border/60 flex items-center justify-center p-2 sm:p-5 shrink-0">
                      <div className="relative w-full max-w-[340px] aspect-square max-md:aspect-[3/2] max-md:max-w-[340px]">
                        {p._id === selectedProduct._id ? (
                          <Image
                            src={selectedVariant.image.url}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 60vw, 35vw"
                            className="object-contain"
                          />
                        ) : (
                          <Image
                            src={p.variants[0]?.image?.url || ""}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 60vw, 35vw"
                            className="object-contain opacity-40"
                          />
                        )}
                      </div>
                    </div>

                    {/* Product details */}
                    <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-hidden">
                      {p._id === selectedProduct._id ? (
                        modalLoading ? (
                          <>
                            <div
                              data-modal-scroll
                              className="flex-1 min-h-0 overflow-y-auto overscroll-contain animate-pulse md:flex md:flex-col md:overflow-hidden"
                            >
                              {/* Header skeleton */}
                              <div className="flex items-start justify-between p-4 sm:p-5 pb-2 sm:pb-3 shrink-0">
                                <div className="space-y-2 flex-1 pr-3">
                                  <div className="h-6 w-48 bg-muted rounded-lg" />
                                  <div className="h-4 w-24 bg-muted rounded-lg" />
                                  <div className="h-4 w-full bg-muted rounded-lg" />
                                  <div className="h-4 w-3/4 bg-muted rounded-lg" />
                                </div>
                                <div className="hidden w-8 h-8 bg-muted rounded-lg shrink-0 md:block" />
                              </div>

                              {/* Scrollable body skeleton */}
                              <div className="px-4 sm:px-5 space-y-4 sm:space-y-5 md:flex-1 md:min-h-0 md:overflow-y-auto md:overscroll-contain">
                                {/* Size picker */}
                                <div className="space-y-2">
                                  <div className="h-4 w-28 bg-muted rounded-lg" />
                                  <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                      <div key={i} className="h-10 flex-1 bg-muted rounded-xl" />
                                    ))}
                                  </div>
                                </div>
                                {/* Crust picker */}
                                <div className="space-y-2">
                                  <div className="h-4 w-28 bg-muted rounded-lg" />
                                  <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                      <div key={i} className="h-10 flex-1 bg-muted rounded-xl" />
                                    ))}
                                  </div>
                                </div>
                                {/* Extra topping */}
                                <div className="space-y-2">
                                  <div className="h-4 w-36 bg-muted rounded-lg" />
                                  <div className="grid grid-cols-2 gap-2">
                                    {[1, 2, 3, 4].map(i => (
                                      <div key={i} className="h-14 bg-muted rounded-lg" />
                                    ))}
                                  </div>
                                </div>
                                {/* Note */}
                                <div className="space-y-2 pb-2">
                                  <div className="h-4 w-20 bg-muted rounded-lg" />
                                  <div className="h-14 bg-muted rounded-lg" />
                                </div>
                              </div>
                            </div>

                            {/* Footer button skeleton */}
                            <div className="p-4 sm:p-5 border-t border-border shrink-0 animate-pulse">
                              <div className="h-12 bg-muted rounded-xl w-full" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              data-modal-scroll
                              className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:flex md:flex-col md:overflow-hidden"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between p-4 sm:p-5 pb-2 sm:pb-3 shrink-0">
                                <div className="pr-3">
                                  <h3 className="text-lg sm:text-xl text-foreground">{selectedProduct.name}</h3>
                                  <p className="hidden md:block text-[11px] text-muted-foreground mt-0.5">
                                    {selectedVariant.size}
                                    {isPizzaProduct && selectedCrust ? ` - ${formatCrustLabel(selectedCrust)}` : ""}
                                  </p>
                                  <p className="hidden md:block text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 leading-relaxed line-clamp-2 sm:line-clamp-none">
                                    {selectedProduct.description}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-none">
                                    Nguyên liệu: {selectedVariant.recipe.map(item => item.ingredient.name).join(", ")}
                                  </p>
                                </div>
                                <button
                                  onClick={onClose}
                                  className="hidden p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0 md:inline-flex"
                                  aria-label="Đóng chi tiết sản phẩm"
                                >
                                  <X size={18} />
                                </button>
                              </div>

                              {/* Scrollable content */}
                              <div className="px-4 sm:px-5 space-y-4 sm:space-y-5 max-md:pb-5 md:flex-1 md:min-h-0 md:overflow-y-auto md:overscroll-contain">
                                {/* Size selection */}
                                <div className="space-y-3 mb-0 md:mb-2">
                                  <div className="mb-0 md:mb-2">
                                    <p className="text-sm font-semibold text-foreground mb-1">Chọn kích thước</p>
                                    <div
                                      className="grid gap-2 bg-muted rounded-xl p-1"
                                      style={{
                                        gridTemplateColumns: `repeat(${Math.max(availableSizes.length, 1)}, minmax(0, 1fr))`,
                                      }}
                                    >
                                      {availableSizes.map(size => (
                                        <button
                                          key={size}
                                          onClick={() => handleSelectSize(size)}
                                          className={`py-1 md:py-2 rounded-lg text-center transition-all ${selectedSize === size ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                          <p className="text-sm truncate">{size}</p>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Crust selection */}
                                  {isPizzaProduct && availableCrusts.length > 0 && (
                                    <div className="mb-0 md:mb-2">
                                      <p className="text-sm font-semibold text-foreground mb-1">Chọn loại đế</p>
                                      <div
                                        className="grid gap-2 bg-muted rounded-xl p-1"
                                        style={{
                                          gridTemplateColumns: `repeat(${Math.max(availableCrusts.length, 1)}, minmax(0, 1fr))`,
                                        }}
                                      >
                                        {availableCrusts.map(crust => (
                                          <button
                                            key={crust}
                                            onClick={() => handleSelectCrust(crust)}
                                            className={`py-1 md:py-2 rounded-lg text-center transition-all ${selectedCrust === crust ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                          >
                                            <p className="text-sm truncate">{formatCrustLabel(crust)}</p>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Extra toppings */}
                                {showExtraTopping && extraToppingOptions.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-foreground mb-2">Chọn extra topping</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {visibleExtraToppingOptions.map(item => {
                                        const active = selectedExtraToppingIds.includes(item._id);
                                        return (
                                          <button
                                            key={item._id}
                                            onClick={() => handleToggleExtraTopping(item._id)}
                                            className={`px-3 py-2 rounded-lg border text-left transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40"}`}
                                          >
                                            <p className="text-sm truncate">{item.name}</p>
                                            <p className="text-xs">+ {formatVND(item.price)}</p>
                                          </button>
                                        );
                                      })}
                                      {extraToppingOptions.length > 3 && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllExtraToppings(previous => !previous)}
                                          className="min-h-[66px] rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                        >
                                          {showAllExtraToppings ? "Thu gọn" : `Xem thêm (${extraToppingOptions.length - 3})`}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Note */}
                                <div className="pb-2">
                                  <p className="text-sm font-semibold text-foreground mb-2">Ghi chú</p>
                                  <Textarea
                                    placeholder="Thêm ghi chú cho món này"
                                    className="min-h-[52px]"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Add to cart button */}
                            <div className="p-3 sm:p-5 border-t border-border shrink-0">
                              {isEditMode && (
                                <button
                                  onClick={handleAddOneToCart}
                                  className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card px-4 py-3 text-primary transition-colors hover:bg-primary/5"
                                >
                                  <Plus size={18} /> Thêm 1 vào giỏ hàng
                                </button>
                              )}
                              <button
                                onClick={handleUpdateCart}
                                disabled={isUpdating}
                                className={` w-full flex items-center justify-between gap-2 bg-primary text-white pl-5 pr-4 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                <span className="flex items-center gap-2">
                                  {isEditMode ? (
                                    <>
                                      <SquarePen size={18} /> Cập nhật giỏ hàng
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={18} /> Thêm vào giỏ
                                    </>
                                  )}
                                </span>
                                <span className="flex items-center gap-2">
                                  {hasDiscount && (
                                    <>
                                      <span className="text-white/70 line-through text-sm">{formatVND(unitPrice)}</span>
                                      <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                        {selectedVariant.discountType === "percent"
                                          ? `-${selectedVariant.discount}%`
                                          : `-${formatVND(selectedVariant.discount || 0)}`}
                                      </span>
                                    </>
                                  )}
                                  <span>{formatVND(discountedPrice)}</span>
                                </span>
                              </button>
                            </div>
                          </>
                        )
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6">
                          <p className="text-muted-foreground text-sm">{p.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white text-white shadow-lg backdrop-blur-xl transition-colors hover:bg-black/70 md:hidden"
            aria-label="Đóng chi tiết sản phẩm"
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Next button - desktop */}
        <div className="hidden sm:block w-10 h-10 shrink-0">
          {products.length > 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                scrollNext();
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-border text-foreground hover:bg-white hover:scale-110 transition-all cursor-pointer"
              aria-label="Sản phẩm tiếp theo"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* Mobile swipe hint — anchored to the modal instead of the viewport */}
        <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.3rem)] z-[60] -translate-x-1/2 sm:hidden">
          {products.length > 1 && (
            <p className="w-max max-w-[calc(100vw-1rem)] rounded-full bg-black/40 px-4 py-1 text-center text-[10px] font-medium text-white shadow-lg backdrop-blur-sm">
              Vuốt sang trái hoặc phải để xem sản phẩm khác
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
