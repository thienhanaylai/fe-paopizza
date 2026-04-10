"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/src/context/cartContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
