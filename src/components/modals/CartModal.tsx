"use client";

import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/src/context/cartContext";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import Image from "next/image";

const formatVND = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export const CartModal = () => {
  const { cart, showCart, setShowCart, updateQuantity, removeItem, cartCount, cartTotal } = useCart();
  const { user } = useCustomerAuth();

  if (!showCart) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-all"
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
              {cart.items.map((item, index) => {
                const product = item.product_id;
                const size = item.size;
                const itemKey = `${product._id}-${item.size}-${index}`;
                const productSize = item.product_id.variants.find(item => item.size === size);

                return (
                  <div
                    key={itemKey}
                    className="flex gap-4 bg-muted/30 border border-border rounded-xl p-4 transition-all hover:bg-muted/50"
                  >
                    <Image
                      src={productSize.image.url}
                      alt="Pizza"
                      width={100}
                      height={100}
                      className="relative! rounded-2xl aspect-square"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium text-foreground line-clamp-2">{product.name}</p>
                          <button
                            onClick={() => removeItem(user?.id, product._id, item.size)}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">Size: {item.size}</p>
                        {item.note && <p className="text-xs text-muted-foreground italic mt-0.5">Note: {item.note}</p>}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(user?.id, product._id, item.size, item.quantity, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(user?.id, product._id, item.size, item.quantity, 1)}
                            className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="font-semibold text-primary">{formatVND(item.price * item.quantity)}</p>
                      </div>
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
              <span className="text-primary text-xl font-bold">{formatVND(cartTotal)}</span>
            </div>
            <button
              onClick={() => console.log("Tiến hành checkout...")}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
