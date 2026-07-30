"use client";

import Header from "@/src/components/layouts/Header";
import Footer from "@/src/components/layouts/Footer";
import { AuthModal } from "@/src/components/modals/LoginModal";
import { useCart } from "@/src/context/cartContext";
import { CartModal } from "@/src/components/modals/CartModal";
import { useEffect } from "react";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { CheckoutModal } from "@/src/components/modals/CheckoutModal";
import { Toaster } from "sonner";

export default function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  const { authMode, user, setAuthMode } = useCustomerAuth();
  const { showCart, fetchCart, checkout } = useCart();

  useEffect(() => {
    fetchCart(user?.id);
  }, [user?.id, fetchCart]);
  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthMode("login");
    };
    window.addEventListener("customer_unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("customer_unauthorized", handleUnauthorized);
    };
  }, [setAuthMode]);
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {authMode && <AuthModal />}
      {showCart && <CartModal />}
      {checkout && <CheckoutModal />}
      <Toaster position="top-right" richColors />
    </>
  );
}
