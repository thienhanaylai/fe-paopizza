"use client";
import Header from "@/src/components/layouts/Header";
import Footer from "@/src/components/layouts/Footer";
import { AuthModal } from "@/src/components/modals/LoginModal";
import { useAuth } from "@/src/context/authContext";
import { useCart } from "@/src/context/cartContext";
import { CartModal } from "@/src/components/modals/CartModal";
import { useEffect } from "react";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { authMode, user } = useAuth();
  const { showCart, fetchCart } = useCart();
  useEffect(() => {
    fetchCart(user?.id);
  }, []);
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
