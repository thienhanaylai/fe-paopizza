"use client";

import {
  ArrowRight,
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
  Navigation,
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

const updateSelectedStore = (storeId: string) => {
  localStorage.setItem("selected_store", storeId);
  window.dispatchEvent(new CustomEvent("selected-store-changed", { detail: { storeId } }));
};

export default function Header() {
  const { isAuthenticated, user, logout, setAuthMode } = useCustomerAuth();
  const { setShowCart, cartCount } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [listStore, setListStore] = useState<StoreData[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  const fectData = async () => {
    const liststr = await getAllStore();
    setListStore(liststr);

    const selectedStoreId = localStorage.getItem("selected_store");
    const matchedStore = liststr.find((store: StoreData) => store._id === selectedStoreId) || null;
    const defaultStore = matchedStore || liststr[0] || null;

    setSelectedStore(defaultStore);
    setShowInitialStoreModal(!matchedStore);
  };
  const [showInitialStoreModal, setShowInitialStoreModal] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("selected_store");
    }
    return false;
  });

  useEffect(() => {
    setIsMounted(true);
    fectData();
  }, []);
  const handleCart = () => {
    setShowCart(true);
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
                    {selectedStore?.name || "Chọn cửa hàng"}
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
                                updateSelectedStore(s._id);
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
                                <p className="text-xs text-muted-foreground truncate">
                                  {s.address.streetNumber}, {s.address.district}, {s.address.city}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock size={10} /> {s.time_open} - {s.time_close}
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
      {showInitialStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div
            className="relative bg-card w-full max-w-lg rounded-[28px] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-bounce"
                  style={{ animationDuration: "3s" }}
                >
                  <MapPin size={20} className="fill-primary/20" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-1.5">
                    Chào mừng bạn đến với PaoPizza!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vui lòng chọn chi nhánh gần nhất để bắt đầu xem menu và đặt hàng nhé
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {`Danh sách chi nhánh`}
                  </label>
                </div>

                <div className="space-y-2 max-h-85 overflow-y-auto pr-1">
                  {listStore.map(s => {
                    const isSelected = s._id === selectedStore?._id;

                    return (
                      <button
                        key={s._id}
                        onClick={() => setSelectedStore(s)}
                        className={`w-full flex items-start gap-3.5 px-4 py-3.5 text-left border rounded-2xl transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-muted/30 border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                            isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isSelected ? <Check size={16} /> : <StoreIcon size={16} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-black text-foreground">{s.name}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {s.address.streetNumber}, {s.address.district}, {s.address.city}
                          </p>

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[10px]">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {s.time_open} - {s.time_close}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] text-muted-foreground uppercase block font-bold tracking-wider">
                  Đang chọn chi nhánh
                </span>
                <span className="text-xs font-bold text-foreground truncate block max-w-[180px] sm:max-w-[240px]">
                  {selectedStore?.name || "Chưa chọn"}
                </span>
              </div>
              <button
                onClick={() => {
                  if (!selectedStore) return;
                  updateSelectedStore(selectedStore._id);
                  setShowInitialStoreModal(false);
                }}
                disabled={!selectedStore}
                className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-extrabold shadow-md shadow-primary/25 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1"
              >
                Vào xem thực đơn <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
