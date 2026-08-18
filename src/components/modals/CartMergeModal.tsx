"use client";

import { AlertCircle, LoaderCircle, ShoppingCart } from "lucide-react";
import { useCart } from "@/src/context/cartContext";
import { useModalScrollLock } from "@/src/hooks/useModalScrollLock";

export const CartMergeModal = () => {
  useModalScrollLock();

  const { pendingCartMerge, isMergingCart, cartMergeError, confirmCartMerge, dismissCartMerge } = useCart();

  if (!pendingCartMerge) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-merge-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h2 id="cart-merge-title" className="text-lg font-semibold text-foreground">
              Gộp giỏ hàng?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Thiết bị này đang có {pendingCartMerge.guestItemCount} món, tài khoản của bạn có {pendingCartMerge.serverItemCount} món.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
          Khi gộp, giá sản phẩm và combo sẽ được cập nhật lại theo dữ liệu hiện tại của hệ thống.
        </div>

        {cartMergeError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{cartMergeError}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={dismissCartMerge}
            disabled={isMergingCart}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => void confirmCartMerge()}
            disabled={isMergingCart}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMergingCart && <LoaderCircle size={16} className="animate-spin" />}
            {isMergingCart ? "Đang gộp..." : "Gộp giỏ hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};
