"use client";

import {
  Check,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Gift,
  History,
  LogOut,
  MapPin,
  Minus,
  Pizza,
  Plus,
  ShoppingCart,
  StoreIcon,
  UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart } from "@/src/context/cartContext";
import { useEffect, useState } from "react";
import { getAllStore, StoreData } from "@/src/services/store.service";

const NavMenu = [
  {
    name: "Trang chủ",
    link: "/",
  },
  {
    name: "Menu",
    link: "/#menu",
  },
  {
    name: "Về chúng tôi",
    link: "/#about",
  },
  {
    name: "Liên hệ",
    link: "/#contact",
  },
];
const tierBadges: Record<string, React.ReactNode> = {
  diamond: (
    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-white border border-cyan-300/30 select-none shrink-0">
      DIAMOND
    </span>
  ),
  gold: (
    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border border-amber-500/30 select-none shrink-0">
      GOLD
    </span>
  ),
  silver: (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider bg-gradient-to-r from-slate-200 to-zinc-300 text-slate-800 border border-slate-300/80 select-none shrink-0">
      SILVER
    </span>
  ),
  member: (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800 select-none shrink-0">
      MEMBER
    </span>
  ),
};

export default function Header() {
  const { isAuthenticated, user, logout, setAuthMode } = useCustomerAuth();
  const { setShowCart, cartCount } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [listStore, setListStore] = useState<StoreData[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreData>(listStore[0]);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  const fectData = async () => {
    const liststr = await getAllStore();
    setListStore(liststr);
    setSelectedStore(liststr[0]);
  };

  useEffect(() => {
    setIsMounted(true);
    fectData();
  }, []);
  const handleCart = () => {
    if (!isAuthenticated) setAuthMode("login");
    else setShowCart(true);
  };
  const handleLogout = async () => {
    await logout();
  };
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href={"/"} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Pizza size={20} className="text-white" />
                </div>
                <span className="text-xl font-medium text-foreground">PaoPizza</span>
              </Link>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowStorePicker(o => !o)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-muted/40 hover:bg-muted/80 border border-transparent hover:border-border rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 transition-all text-left cursor-pointer"
                >
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[70px] sm:max-w-[120px]">
                    {selectedStore?.name}
                  </span>
                  <ChevronDown
                    size={10}
                    className={`text-muted-foreground transition-transform shrink-0 ${showStorePicker ? "rotate-180" : ""}`}
                  />
                </button>

                {showStorePicker && (
                  <>
                    <div className="fixed inset-0 z-35 h-screen w-full" onClick={() => setShowStorePicker(false)} />
                    <div className="absolute z-40 top-full mt-2 left-0 w-72 sm:w-80 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground">Chọn chi nhánh PaoPizza gần bạn</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {listStore.map(s => {
                          const isSelected = s._id === selectedStore?._id;
                          return (
                            <button
                              key={s._id}
                              onClick={() => {
                                setSelectedStore(s);
                                setShowStorePicker(false);
                              }}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                              >
                                {isSelected ? <Check size={16} /> : <StoreIcon size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{s.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock size={10} /> {s.hours}
                                  {/* {s.unavailableItems.length > 0 && (
                                    <span className="ml-1.5 text-amber-600 font-medium">
                                      · {s.unavailableItems.length} món không phục vụ
                                    </span>
                                  )} */}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              {NavMenu?.map(item => {
                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    onClick={() => {
                      window.location.hash = item.link;
                    }}
                    className={`hover:text-primary font-medium transition-colors`}
                  >
                    {item.name}
                  </Link>
                );
              })}
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
              {isMounted && isAuthenticated ? (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowNavMenu(!showNavMenu)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors bg-primary/5 hover:bg-primary/10"
                    title="Menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                      {user?.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-sm text-foreground">{user?.name}</span>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${showNavMenu ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showNavMenu && (
                    <>
                      <div className="fixed inset-0 z-35 h-screen w-full" onClick={() => setShowNavMenu(false)} />
                      <div className="absolute z-40 top-full right-0 mt-2 w-58 sm:w-68 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
                          <div>
                            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email || user?.phone}</p>
                          </div>
                          <p className=" text-end">{tierBadges[user?.tier || 0]}</p>
                        </div>
                        <Link
                          href={"/profile"}
                          onClick={() => setShowNavMenu(false)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                        >
                          <UserIcon size={16} className="text-muted-foreground" /> Hồ sơ của tôi
                        </Link>
                        <Link
                          href={"/orders"}
                          onClick={() => setShowNavMenu(false)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                        >
                          <History size={16} className="text-muted-foreground" /> Lịch sử đơn hàng
                        </Link>
                        {true && (
                          <Link
                            href={"/"}
                            onClick={() => setShowNavMenu(false)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                          >
                            <span className="flex items-center gap-2.5 whitespace-nowrap">
                              <Gift size={16} className="text-primary animate-pulse" /> Đổi thưởng tích lũy
                            </span>
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {user?.currentPoint || 0} Pts
                            </span>
                          </Link>
                        )}
                        <div className="border-t border-border" />
                        <button
                          onClick={() => {
                            setShowNavMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left"
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : !isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                    }}
                    className="text-sm px-4 py-2 text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                    }}
                    className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
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
