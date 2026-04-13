"use client";

import { CustomerAuthProvider } from "@/src/context/authCustomerContext";
import { CartProvider } from "@/src/context/cartContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CartProvider>{children}</CartProvider>
    </CustomerAuthProvider>
  );
}
