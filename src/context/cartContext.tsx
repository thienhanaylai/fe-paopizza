"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type CartState = Record<number, number>;

interface CartContextType {
  cart: CartState;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({});

  const addToCart = (id: number) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const removeFromCart = (id: number) =>
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });

  const cartCount = Object.values(cart).reduce((total, qty) => total + qty, 0);

  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartCount }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được bọc bên trong CartProvider");
  }
  return context;
}
