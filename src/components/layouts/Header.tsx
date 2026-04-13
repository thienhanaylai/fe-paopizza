"use client";

import { Eye, EyeOff, History, Minus, Pizza, Plus, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart } from "@/src/context/cartContext";

const NavMenu = [
  {
    name: "Trang chủ",
    link: "/",
  },
  {
    name: "Menu",
    link: "#menu",
  },
  {
    name: "Về chúng tôi",
    link: "#about",
  },
  {
    name: "Liên hệ",
    link: "#contact",
  },
];

export default function Header() {
  const { isAuthenticated, user, logout, setAuthMode } = useCustomerAuth();
  const { setShowCart, cartCount } = useCart();
  const pathname = usePathname();

  const handleCart = () => {
    if (!isAuthenticated) setAuthMode("login");
    else setShowCart(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => {}} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Pizza size={20} className="text-white" />
              </div>
              <span className="text-xl text-foreground">PaoPizza</span>
            </button>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              {NavMenu?.map(item => {
                const isActive = pathname === item.link; //xử lý sau
                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    className={`hover:text-primary font-medium transition-colors ${isActive ? "text-primary" : ""}`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <button onClick={() => {}} className="transition-colors text-[14px] flex items-center gap-1">
                  <History size={15} /> Đơn hàng
                </button>
              ) : null}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={() => handleCart()} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <ShoppingCart size={20} className="text-foreground" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs"></div>
                    <span className="text-sm text-foreground">{user?.name}</span>
                  </div>
                  <button
                    onClick={() => {}}
                    className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
                    title="Đơn hàng"
                  ></button>
                  <button
                    onClick={logout}
                    className="text-sm px-3 py-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                    }}
                    className="text-sm px-4 py-2 text-foreground hover:text-primary transition-colors"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                    }}
                    className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Đăng ký
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
