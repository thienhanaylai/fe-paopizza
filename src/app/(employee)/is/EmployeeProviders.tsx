"use client";

import { EmployeeAuthProvider } from "@/src/context/authEmployeeContext";
import { CartProvider } from "@/src/context/cartContext";
import { Providers } from "./providers";

export default function EmployeeProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <CartProvider>
        <EmployeeAuthProvider>{children}</EmployeeAuthProvider>
      </CartProvider>
    </Providers>
  );
}
