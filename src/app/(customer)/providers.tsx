"use client";

import { CustomerAuthProvider } from "@/src/context/authCustomerContext";
import { CartProvider } from "@/src/context/cartContext";
import { MenuProvider } from "@/src/context/menuContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <MenuProvider>{children}</MenuProvider>
      </CartProvider>
    </CustomerAuthProvider>
  );
}
