"use client";

import { Minus, PenLine, Plus, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/src/context/cartContext";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import Image from "next/image";
import { formatVND } from "@/src/utils/formatVND";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMenuByStoreId } from "@/src/services/menu.service";

export const CartModal = () => {
  const { cart, showCart, setShowCart, updateQuantity, removeItem, cartCount, cartTotal, setCheckout } = useCart();
  const { user } = useCustomerAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeMenuSkus, setStoreMenuSkus] = useState<string[] | null>(null);

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
        return;
      }

      try {
        const menu = await getMenuByStoreId(selectedStoreId);
        const skuList =
          menu?.products?.flatMap((product: { variants: Array<{ sku: string }> }) =>
            product.variants.map(variant => variant.sku),
          ) || [];
        setStoreMenuSkus(skuList);
      } catch {
        setStoreMenuSkus(null);
      }
    };

    loadStoreMenuSkus();
  }, [selectedStoreId, showCart]);

  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);

  const unavailableSkuSet = useMemo(() => {
    if (!storeMenuSkus || !cartItems.length) return new Set<string>();
    const availableSet = new Set(storeMenuSkus);
    return new Set(cartItems.filter(item => !availableSet.has(item.sku)).map(item => item.sku));
  }, [cartItems, storeMenuSkus]);

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
                const product = item.product_id;
                const size = item.size;
                const itemKey = `${product._id}-${item.size}-${index}`;
                const productSize = item.product_id.variants.find(item => item.size === size);
                const isUnavailable = unavailableSkuSet.has(item.sku);
                const noteParts = (item.note || "")
                  .split("|")
                  .map(part => part.trim())
                  .filter(Boolean);
                const extraToppingPart = noteParts.find(part => part.toLowerCase().startsWith("extra topping:"));
                const extraToppingText = extraToppingPart?.replace(/extra topping:/i, "").trim();
                const customNote = noteParts.filter(part => !part.toLowerCase().startsWith("extra topping:")).join(" | ");

                return (
                  <div
                    key={itemKey}
                    className={`flex gap-4 border rounded-xl p-4 transition-all ${
                      isUnavailable ? "bg-muted/20 border-amber-300/70 opacity-60" : "bg-muted/30 border-border"
                    }`}
                  >
                    <Image
                      src={productSize?.image.url || ""}
                      alt="Pizza"
                      width={80}
                      height={80}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-lg font-semibold text-foreground line-clamp-2">{product.name}</p>
                          <button
                            onClick={() => removeItem(user?.id || "", product._id, item.size)}
                            className={`shrink-0 ${
                              isUnavailable
                                ? "text-destructive hover:text-destructive/80"
                                : "text-muted-foreground hover:text-destructive"
                            }`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.size}</p>
                        {extraToppingText && <p className="text-xs text-muted-foreground mt-0.5">+ {extraToppingText}</p>}
                        {!isUnavailable && (
                          <Link
                            href="/#menu"
                            onClick={() => setShowCart(false)}
                            className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                          >
                            <PenLine size={13} /> Chỉnh sửa
                          </Link>
                        )}
                        {customNote && <p className="text-[11px] text-muted-foreground italic mt-0.5">Note: {customNote}</p>}
                        {isUnavailable && (
                          <p className="text-xs text-amber-700 mt-1 font-medium">Không có trong menu cửa hàng hiện tại</p>
                        )}
                      </div>

                      <div className="flex items-end justify-between mt-3 gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(user?.id || "", product._id, item.size, item.quantity, -1)}
                            disabled={isUnavailable}
                            className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-base font-medium w-8 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(user?.id || "", product._id, item.size, item.quantity, 1)}
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
                            onClick={() => removeItem(user?.id || "", product._id, item.size)}
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
              onClick={() => setCheckout(true)}
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
