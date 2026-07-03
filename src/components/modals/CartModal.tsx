"use client";

import { Minus, PenLine, Plus, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/src/context/cartContext";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import Image from "next/image";
import { formatVND } from "@/src/utils/formatVND";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { getMenuByStoreId, MenuData } from "@/src/services/menu.service";

export const CartModal = () => {
  const {
    cart,
    showCart,
    setShowCart,
    updateQuantity,
    removeItem,
    cartCount,
    cartTotal,
    setCheckout,
    setEditingSku,
    setEditingComboId,
  } = useCart();
  const { user } = useCustomerAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeMenuSkus, setStoreMenuSkus] = useState<string[] | null>(null);
  const [storeMenuData, setStoreMenuData] = useState<MenuData | null>(null);

  useEffect(() => {
    const syncSelectedStore = () => {
      const currentStoreId = localStorage.getItem("selected_store") || "";
      setSelectedStoreId(prev => (prev === currentStoreId ? prev : currentStoreId));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "selected_store") {
        syncSelectedStore();
      }
    };

    const handleStoreChanged = () => {
      syncSelectedStore();
    };

    syncSelectedStore();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("selected-store-changed", handleStoreChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("selected-store-changed", handleStoreChanged);
    };
  }, []);

  useEffect(() => {
    const loadStoreMenuSkus = async () => {
      if (!showCart || !selectedStoreId) {
        setStoreMenuSkus(null);
        setStoreMenuData(null);
        return;
      }

      try {
        const menu = await getMenuByStoreId(selectedStoreId);
        setStoreMenuData(menu || null);
        const skuList =
          menu?.products?.flatMap((product: { variants: Array<{ sku: string }> }) =>
            product.variants.map(variant => variant.sku),
          ) || [];
        setStoreMenuSkus(skuList);
      } catch {
        setStoreMenuSkus(null);
        setStoreMenuData(null);
      }
    };

    loadStoreMenuSkus();
  }, [selectedStoreId, showCart]);

  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);

  /** Check if a cart item is available in current store */
  const isItemUnavailable = useCallback(
    (item: (typeof cartItems)[number]): boolean => {
      if (!storeMenuSkus) return false; // still loading → don't mark unavailable

      // Combo: check each selection's product SKU against menu
      if (item.item_type === "combo") {
        // Check if combo itself is still in menu
        if (storeMenuData) {
          const comboExists = storeMenuData.combos?.some(
            entry => entry.combo._id === item.combo_id || entry._id === item.combo_id,
          );
          if (!comboExists) return true;
        }
        // Check each selected product SKU
        const availableSet = new Set(storeMenuSkus);
        if (item.combo_selections && item.combo_selections.length > 0) {
          return item.combo_selections.some(sel => !availableSet.has(sel.sku));
        }
        return false; // combo with no selections → assume available
      }

      // Product: check sku directly
      const availableSet = new Set(storeMenuSkus);
      return !availableSet.has(item.sku);
    },
    [storeMenuSkus, storeMenuData],
  );

  const unavailableSkuSet = useMemo(() => {
    if (!storeMenuSkus || !cartItems.length) return new Set<string>();
    return new Set(cartItems.filter(item => isItemUnavailable(item)).map(item => item.sku));
  }, [cartItems, storeMenuSkus, isItemUnavailable]);

  const unavailableCount = unavailableSkuSet.size;

  if (!showCart) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-all animate-fade-left animate-duration-300"
      onClick={() => setShowCart(false)}
    >
      <div className="w-full max-w-md h-full bg-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-foreground flex items-center gap-2 font-semibold">
            <ShoppingCart size={20} /> Giỏ hàng ({cartCount})
          </h3>
          <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cartCount === 0 || !cart?.items.length ? (
            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
              <ShoppingCart size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Giỏ hàng của bạn đang trống</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unavailableCount > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Có {unavailableCount} món không khả dụng ở cửa hàng hiện tại. Vui lòng xóa món hoặc chọn món thay thế để tiếp
                  tục đặt hàng.
                </div>
              )}

              {cart.items.map((item, index) => {
                const product = typeof item.product_id === "string" ? null : item.product_id;
                const productId = typeof item.product_id === "string" ? item.product_id : item.product_id?._id;
                const isCombo = item.item_type === "combo";
                const itemType = isCombo ? "combo" : "product";
                const comboId = item.combo_id;
                const combo = item.combo;
                const size = item.size;
                const itemKey = `${item.sku}-${item.size}-${index}`;
                const productSize = product?.variants.find(variant => variant.size === size);
                const isUnavailable = unavailableSkuSet.has(item.sku);
                const noteParts = (item.note || "")
                  .split("|")
                  .map(part => part.trim())
                  .filter(Boolean);
                const extraToppingPart = noteParts.find(part => part.toLowerCase().startsWith("extra topping:"));
                const extraToppingText = extraToppingPart?.replace(/extra topping:/i, "").trim();
                const customNote = noteParts.filter(part => !part.toLowerCase().startsWith("extra topping:")).join(" | ");

                // Combo display: get selection names and check individual availability
                const comboSelectionNames =
                  isCombo && item.combo_selections
                    ? item.combo_selections.map(sel => {
                        const selProduct = typeof sel.product_id === "string" ? null : sel.product_id;
                        return selProduct?.name || sel.sku;
                      })
                    : [];
                const comboUnavailableSkus: string[] =
                  isCombo && isUnavailable && storeMenuSkus && item.combo_selections
                    ? item.combo_selections
                        .filter(sel => !storeMenuSkus.includes(sel.sku))
                        .map(sel => {
                          const selProduct = typeof sel.product_id === "string" ? null : sel.product_id;
                          return selProduct?.name || sel.sku;
                        })
                    : [];
                console.log(item);
                return (
                  <div
                    key={itemKey}
                    className={`flex gap-4 border rounded-xl p-4 transition-all ${
                      isUnavailable
                        ? "bg-muted/20 border-amber-300/70 opacity-60"
                        : isCombo
                          ? "bg-orange-50/50 border-orange-200"
                          : "bg-muted/30 border-border"
                    }`}
                  >
                    <Image
                      src={isCombo ? combo?.image || "/placeholder-combo.png" : productSize?.image.url || ""}
                      alt={isCombo ? combo?.name || "Combo" : "Pizza"}
                      width={80}
                      height={80}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold text-foreground line-clamp-2">
                                {isCombo ? combo?.name || "Combo" : product?.name || "Sản phẩm"}
                              </p>
                              {isCombo && (
                                <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-semibold rounded-full shrink-0">
                                  COMBO
                                </span>
                              )}
                            </div>
                            {/* Combo selections detail */}
                            {isCombo && comboSelectionNames.length > 0 && (
                              <div className="mt-1.5 space-y-0.5">
                                {comboSelectionNames.map((name, i) => (
                                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                    {name}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              removeItem({
                                userId: user?.id,
                                item_type: itemType,
                                product_id: productId,
                                combo_id: comboId,
                                sku: item.sku,
                                size: item.size,
                                combo_selections: item.combo_selections,
                              })
                            }
                            className={`shrink-0 ${
                              isUnavailable
                                ? "text-destructive hover:text-destructive/80"
                                : "text-muted-foreground hover:text-destructive"
                            }`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {!isCombo && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {item.size}
                            {item.crust
                              ? ` - ${item.crust.replace(/[_-]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}`
                              : ""}
                          </p>
                        )}
                        {extraToppingText && <p className="text-xs text-muted-foreground mt-0.5">+ {extraToppingText}</p>}
                        {!isUnavailable && !isCombo && (
                          <button
                            onClick={() => {
                              setEditingSku(item.sku);
                              setShowCart(false);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <PenLine size={13} /> Chỉnh sửa
                          </button>
                        )}
                        {!isUnavailable && isCombo && (
                          <button
                            onClick={() => {
                              setEditingComboId(item.combo_id || item.sku);
                              setShowCart(false);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-orange-600 mt-1 hover:underline"
                          >
                            <PenLine size={13} /> Chỉnh sửa combo
                          </button>
                        )}
                        {customNote && <p className="text-[11px] text-muted-foreground italic mt-0.5">Note: {customNote}</p>}
                        {isUnavailable && !isCombo && (
                          <p className="text-xs text-amber-700 mt-1 font-medium">Không có trong menu cửa hàng hiện tại</p>
                        )}
                        {isUnavailable && isCombo && (
                          <div className="mt-1">
                            <p className="text-xs text-amber-700 font-medium">
                              {comboUnavailableSkus.length > 0
                                ? "Một số sản phẩm trong combo không còn trong menu"
                                : "Combo không còn khả dụng tại cửa hàng này"}
                            </p>
                            {comboUnavailableSkus.length > 0 && (
                              <div className="mt-0.5 space-y-0.5">
                                {comboUnavailableSkus.map((name, i) => (
                                  <p key={i} className="text-[11px] text-amber-600 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                                    {name} (không khả dụng)
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-end justify-between mt-3 gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity({
                                userId: user?.id,
                                item_type: itemType,
                                product_id: productId,
                                combo_id: comboId,
                                sku: item.sku,
                                size: item.size,
                                currentQty: item.quantity,
                                change: -1,
                                combo_selections: item.combo_selections,
                              })
                            }
                            disabled={isUnavailable}
                            className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-base font-medium w-8 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity({
                                userId: user?.id,
                                item_type: itemType,
                                product_id: productId,
                                combo_id: comboId,
                                sku: item.sku,
                                size: item.size,
                                currentQty: item.quantity,
                                change: 1,
                                combo_selections: item.combo_selections,
                              })
                            }
                            disabled={isUnavailable}
                            className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-semibold text-foreground text-xl">
                          {formatVND(item.price * item.quantity, { style: "currency" })}
                        </p>
                      </div>

                      {isUnavailable && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() =>
                              removeItem({
                                userId: user?.id,
                                item_type: itemType,
                                product_id: productId,
                                combo_id: comboId,
                                sku: item.sku,
                                size: item.size,
                                combo_selections: item.combo_selections,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
                          >
                            Xóa món này
                          </button>
                          <Link
                            href="/#menu"
                            onClick={() => setShowCart(false)}
                            className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                          >
                            Chọn bánh thay thế
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartCount > 0 && (
          <div className="border-t border-border p-5 bg-card space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center text-foreground font-medium">
              <span className="text-muted-foreground">Tổng thanh toán:</span>
              <span className="text-primary text-xl font-bold">{formatVND(cartTotal, { style: "currency" })}</span>
            </div>
            <button
              onClick={() => {
                setCheckout(true);
              }}
              disabled={unavailableCount > 0}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unavailableCount > 0 ? "Xử lý món không khả dụng để tiếp tục" : "Tiến hành đặt hàng"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
