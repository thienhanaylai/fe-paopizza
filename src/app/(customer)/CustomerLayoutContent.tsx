"use client";

import Header from "@/src/components/layouts/Header";
import Footer from "@/src/components/layouts/Footer";
import { AuthModal } from "@/src/components/modals/LoginModal";
import { useCart } from "@/src/context/cartContext";
import { CartModal } from "@/src/components/modals/CartModal";
import { useEffect } from "react";
import { useCustomerAuth } from "@/src/context/authCustomerContext";

export default function CustomerLayoutContent({ children }: { children: React.ReactNode }) {
  const { authMode, user } = useCustomerAuth();
  const { showCart, fetchCart } = useCart();

  useEffect(() => {
    if (user?.id) {
      fetchCart(user.id);
    }
  }, [user?.id, fetchCart]);

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {authMode && <AuthModal />}
      {showCart && <CartModal />}
    </>
  );
}
