"use client";

import { Check, ChevronDown, ChevronUp, Minus, PenLine, Plus, ShoppingCart, X } from "lucide-react";
import { getCartItemKey, useCart, resolveComboId } from "@/src/context/cartContext";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import Image from "next/image";
import { formatVND } from "@/src/utils/formatVND";
import { formatCrustLabel } from "@/src/utils/formatCrustLabel";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { getMenuByStoreId, MenuData } from "@/src/services/menu.service";
import { useModalScrollLock } from "@/src/hooks/useModalScrollLock";

export const CartModal = () => {
  useModalScrollLock();

  const {
    cart,
    showCart,
    setShowCart,
    updateQuantity,
    updateCartItemNote,
    removeItem,
    cartCount,
    selectedCartItems,
    selectedCartCount,
    selectedCartTotal,
    isCartItemSelected,
    setCartItemSelected,
    selectAllCartItems,
    clearCartSelection,
    setCheckout,
    setEditingCartItem,
    setEditingComboItem,
  } = useCart();
  const { user } = useCustomerAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeMenuSkus, setStoreMenuSkus] = useState<string[] | null>(null);
  const [storeMenuData, setStoreMenuData] = useState<MenuData | null>(null);
  const [expandedToppingKeys, setExpandedToppingKeys] = useState<Set<string>>(new Set());
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNoteKey, setSavingNoteKey] = useState<string | null>(null);

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
  const isItemUnavailable = useCallback(
    (item: (typeof cartItems)[number]): boolean => {
      if (!storeMenuSkus) return false;

      if (item.item_type === "combo") {
        if (storeMenuData) {
          const comboId = resolveComboId(item.combo);
          const comboExists = storeMenuData.combos?.some(entry => entry.combo._id === comboId || entry._id === comboId);
          if (!comboExists) return true;
        }

        const availableSet = new Set(storeMenuSkus);
        if (item.combo_selections && item.combo_selections.length > 0) {
          return item.combo_selections.some(sel => !availableSet.has(sel.sku));
        }
        return false;
      }

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
  const selectedUnavailableCount = selectedCartItems.filter(item => unavailableSkuSet.has(item.sku)).length;
  //const allItemsSelected = cartItems.length > 0 && selectedCartItems.length === cartItems.length;

  if (!showCart) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] backdrop-blur-sm transition-all animate-fade-left animate-duration-300"
      onClick={() => setShowCart(false)}
    >
      <div className="w-full  md:max-w-md h-full bg-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-foreground flex items-center gap-2 font-semibold">
            <ShoppingCart size={20} /> Giỏ hàng ({cartCount})
          </h3>
          <button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div data-modal-scroll className="flex-1 touch-pan-y overflow-y-auto overscroll-contain p-5">
          {cartCount === 0 || !cart?.items.length ? (
            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
              <ShoppingCart size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Giỏ hàng của bạn đang trống</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    onChange={event => {
                      if (event.target.checked) selectAllCartItems();
                      else clearCartSelection();
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  Chọn tất cả
                </label>
                <span className="text-xs text-muted-foreground">
                  {selectedCartItems.length}/{cartItems.length} sản phẩm
                </span>
              </div>

              {unavailableCount > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Có {unavailableCount} món không khả dụng ở cửa hàng hiện tại. Bạn có thể bỏ chọn, xóa món hoặc chọn món thay
                  thế.
                </div>
              )}

              {cart.items.map((item, index) => {
                const product = typeof item.product_id === "string" ? null : item.product_id;
                const productId = typeof item.product_id === "string" ? item.product_id : item.product_id?._id;
                const isCombo = item.item_type === "combo";
                const itemType = isCombo ? "combo" : "product";
                const comboId = resolveComboId(item.combo);
                const combo = typeof item.combo === "object" ? item.combo : undefined;
                const size = item.size;
                const cartItemKey = getCartItemKey(item);
                const itemKey = `${cartItemKey}-${index}`;
                const productSize = product?.variants.find(variant => variant.size === size);
                const isUnavailable = unavailableSkuSet.has(item.sku);
                const isSelected = isCartItemSelected(item);
                const noteParts = (item.note || "")
                  .split("|")
                  .map(part => part.trim())
                  .filter(Boolean);
                const extraToppingPart = noteParts.find(part => part.toLowerCase().startsWith("extra topping:"));
                const extraToppingText = extraToppingPart?.replace(/extra topping:/i, "").trim();
                const customNote = noteParts.filter(part => !part.toLowerCase().startsWith("extra topping:")).join(" | ");
                const toppingNamesFromItem = item.added_topping
                  .map(topping => (typeof topping === "string" ? "" : topping.name.trim()))
                  .filter(Boolean);
                const toppingNames =
                  toppingNamesFromItem.length > 0
                    ? toppingNamesFromItem
                    : extraToppingText?.split(",").map(name => name.trim()).filter(Boolean) || [];
                const isToppingExpanded = expandedToppingKeys.has(cartItemKey);
                const visibleToppingNames = isToppingExpanded ? toppingNames : toppingNames.slice(0, 3);

                const comboSelection =
                  isCombo && item.combo_selections
                    ? item.combo_selections.map(sel => {
                        return sel;
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

                return (
                  <div
                    key={itemKey}
                    className={`flex gap-3 rounded-xl border p-3 transition-all ${
                      isUnavailable
                        ? "bg-muted/20 border-amber-300/70 opacity-60"
                        : isCombo
                          ? "bg-orange-50/50 border-orange-200"
                          : "bg-muted/30 border-border"
                    }`}
                  >
                    <label className="flex shrink-0 cursor-pointer items-center pt-0.5" title="Chọn món để thanh toán">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={event => setCartItemSelected(item, event.target.checked)}
                        className="h-4 w-4 accent-primary"
                        aria-label={`Chọn ${isCombo ? combo?.name || "combo" : product?.name || "sản phẩm"}`}
                      />
                    </label>
                    <Image
                      src={isCombo ? combo?.image || "" : productSize?.image.url || ""}
                      alt={isCombo ? combo?.name || "Combo" : "Pizza"}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between min-h-14">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-foreground line-clamp-2">
                                {isCombo ? combo?.name || "Combo" : product?.name || "Sản phẩm"}
                              </p>
                              {isCombo && (
                                <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-semibold rounded-full shrink-0">
                                  COMBO
                                </span>
                              )}
                            </div>

                            {!isCombo && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.size}
                                {item.crust ? ` - ${formatCrustLabel(item.crust)}` : ""}
                              </p>
                            )}
                            {isCombo && comboSelection.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {comboSelection.map((itemCombo, i) => (
                                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                    {typeof itemCombo.product_id === "string" ? itemCombo.sku : itemCombo.product_id?.name} -{" "}
                                    {itemCombo.size} {itemCombo.crust ? `- ${formatCrustLabel(itemCombo.crust)}` : ``}
                                  </p>
                                ))}
                              </div>
                            )}
                            {toppingNames.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                <div className="flex flex-wrap gap-1">
                                  {visibleToppingNames.map((toppingName, toppingIndex) => (
                                    <span key={`${cartItemKey}-topping-${toppingIndex}`} className="rounded-full bg-primary/10 px-2 py-0.5">
                                      + {toppingName}
                                    </span>
                                  ))}
                                </div>
                                {toppingNames.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedToppingKeys(previous => {
                                        const next = new Set(previous);
                                        if (next.has(cartItemKey)) next.delete(cartItemKey);
                                        else next.add(cartItemKey);
                                        return next;
                                      })
                                    }
                                    className="mt-1 inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                                  >
                                    {isToppingExpanded ? (
                                      <>
                                        Thu gọn <ChevronUp size={13} />
                                      </>
                                    ) : (
                                      <>
                                        Xem thêm ({toppingNames.length - 3}) <ChevronDown size={13} />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {!isUnavailable && (
                              <button
                                onClick={() => {
                                  if (isCombo) {
                                    // Truyền chính xác cart item được bấm vì combo ID và SKU cũ của guest cart đều có thể trùng.
                                    setEditingComboItem(item);
                                  } else {
                                    setEditingCartItem(item);
                                  }
                                  setShowCart(false);
                                }}
                                aria-label="Chỉnh sửa món"
                                className="p-1.5 -m-1.5 text-muted-foreground hover:text-primary transition-colors"
                              >
                                <PenLine size={15} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                removeItem({
                                  userId: user?.id,
                                  item_type: itemType,
                                  product_id: productId,
                                  combo: comboId,
                                  sku: item.sku,
                                  size: item.size,
                                  crust: item.crust,
                                  combo_selections: item.combo_selections,
                                })
                              }
                              aria-label="Xóa món"
                              className={`p-1.5 -m-1.5 shrink-0 ${
                                isUnavailable
                                  ? "text-destructive hover:text-destructive/80"
                                  : "text-muted-foreground hover:text-destructive"
                              }`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        {editingNoteKey === cartItemKey ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <input
                              value={noteDraft}
                              onChange={event => setNoteDraft(event.target.value)}
                              placeholder="Nhập ghi chú cho bánh"
                              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={savingNoteKey === cartItemKey}
                              onClick={async () => {
                                setSavingNoteKey(cartItemKey);
                                try {
                                  const nextNote = [noteDraft.trim(), extraToppingPart].filter(Boolean).join(" | ");
                                  await updateCartItemNote({ userId: user?.id, item, note: nextNote });
                                  setEditingNoteKey(null);
                                } finally {
                                  setSavingNoteKey(null);
                                }
                              }}
                              className="rounded-md bg-primary p-1.5 text-primary-foreground disabled:opacity-50"
                              aria-label="Lưu ghi chú"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteKey(null)}
                              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
                              aria-label="Hủy sửa ghi chú"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteKey(cartItemKey);
                              setNoteDraft(customNote);
                            }}
                            className="mt-1 text-left text-[11px] italic text-muted-foreground hover:text-primary"
                          >
                            {customNote ? `Ghi chú: ${customNote}` : "+ Thêm ghi chú"}
                          </button>
                        )}
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

                      <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              updateQuantity({
                                userId: user?.id,
                                item_type: itemType,
                                product_id: productId,
                                combo: comboId,
                                sku: item.sku,
                                size: item.size,
                                crust: item.crust,
                                currentQty: item.quantity,
                                change: -1,
                                combo_selections: item.combo_selections,
                              })
                            }
                            disabled={isUnavailable}
                            className="w-8 h-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium w-7 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity({
                                userId: user?.id,
                                item_type: itemType,
                                product_id: productId,
                                combo: comboId,
                                sku: item.sku,
                                size: item.size,
                                crust: item.crust,
                                currentQty: item.quantity,
                                change: 1,
                                combo_selections: item.combo_selections,
                              })
                            }
                            disabled={isUnavailable}
                            className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-bold text-foreground text-lg">
                          {formatVND(item.price * item.quantity, {
                            style: "currency",
                          })}
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
                                combo: comboId,
                                sku: item.sku,
                                size: item.size,
                                crust: item.crust,
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
            <div className="text-xs text-muted-foreground">Đã chọn {selectedCartCount} sản phẩm</div>
            <div className="flex justify-between items-center text-foreground font-medium">
              <span className="text-muted-foreground">Tổng thanh toán:</span>
              <span className="text-primary text-xl font-bold">{formatVND(selectedCartTotal, { style: "currency" })}</span>
            </div>
            <button
              onClick={() => {
                setCheckout(true);
              }}
              disabled={selectedCartCount === 0 || selectedUnavailableCount > 0}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedCartCount === 0
                ? "Vui lòng chọn món muốn mua"
                : selectedUnavailableCount > 0
                  ? "Bỏ chọn món không khả dụng để tiếp tục"
                  : `Tiến hành đặt ${selectedCartCount} sản phẩm`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
