"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import { getCart, addToCartApi, updateCartItemApi, removeFromCartApi } from "@/src/services/cart.service";

export type ProductPopulated = {
  _id: string;
  name: string;
  variants: { image: { url: string }; size: string; price: number }[];
  image?: string;
};

export type CartItem = {
  product_id: ProductPopulated;
  price: number;
  size: string;
  sku: string;
  quantity: number;
  note: string;
};

export type Cart = {
  _id: string;
  user_id: string;
  items: CartItem[];
};

interface CartContextType {
  cart: Cart | null;
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  checkout: boolean;
  setCheckout: (show: boolean) => void;
  fetchCart: (userId: string) => Promise<void>;
  updateQuantity: (userId: string, productId: string, size: string, currentQty: number, change: number) => Promise<void>;
  removeItem: (userId: string, productId: string, size: string) => Promise<void>;
  addToCart: (userId: string, product_id: string, size: string, quantity?: number, note?: string) => Promise<void>;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkout, setCheckout] = useState(false);

  const fetchCart = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const data = await getCart(userId);

      setCart(data);
      return data;
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    }
  }, []);

  const addToCart = async (userId: string, product_id: string, size: string, quantity?: number, note?: string) => {
    try {
      await addToCartApi({ userId, product_id, size, quantity, note });
    } catch (error) {
      console.error("Lỗi cập nhật giỏ hàng:", error);
    }
  };

  const updateQuantity = async (userId: string, productId: string, size: string, currentQty: number, change: number) => {
    const newQuantity = currentQty + change;

    try {
      if (newQuantity < 1) {
        const updatedCart = await removeFromCartApi({ userId, product_id: productId, size });
        setCart(updatedCart);
      } else {
        const updatedCart = await updateCartItemApi({ userId, product_id: productId, size, quantity: newQuantity });
        setCart(updatedCart);
      }
    } catch (error) {
      console.error("Lỗi cập nhật giỏ hàng:", error);
    }
  };

  const removeItem = async (userId: string, productId: string, size: string) => {
    try {
      const updatedCart = await removeFromCartApi({ userId, product_id: productId, size });
      setCart(updatedCart);
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  const { cartCount, cartTotal } = useMemo(() => {
    if (!cart || !cart.items) return { cartCount: 0, cartTotal: 0 };
    return cart.items.reduce(
      (acc, item) => ({
        cartCount: acc.cartCount + item.quantity,
        cartTotal: acc.cartTotal + item.price * item.quantity,
      }),
      { cartCount: 0, cartTotal: 0 },
    );
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      showCart,
      setShowCart,
      fetchCart,
      updateQuantity,
      removeItem,
      addToCart,
      cartCount,
      cartTotal,
      checkout,
      setCheckout,
    }),
    [cart, showCart, checkout, fetchCart, cartCount, cartTotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng bên trong CartProvider");
  }
  return context;
}
