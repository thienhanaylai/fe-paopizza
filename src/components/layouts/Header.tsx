"use client";

import {
  ChevronDown,
  Gift,
  History,
  Home,
  Info,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
  Phone,
  Pizza,
  ShoppingCart,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart } from "@/src/context/cartContext";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getAllStore, StoreData } from "@/src/services/store.service";
import SelectStoreModal from "@/src/components/modals/SelectStoreModal";

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
    name: "Tra cứu",
    link: "/tracking",
  },
  {
    name: "Về PaoPizza",
    link: "/about",
  },
  {
    name: "Cửa hàng PaoPizza",
    link: "/contact",
  },
];

const subscribeToHashChange = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

const getHashSnapshot = () => window.location.hash;
const getServerHashSnapshot = () => "";

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
  const pathname = usePathname();
  const { isAuthenticated, user, logout, setAuthMode } = useCustomerAuth();
  const { setShowCart, cartCount } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const currentHash = useSyncExternalStore(subscribeToHashChange, getHashSnapshot, getServerHashSnapshot);

  const fectData = async () => {
    const { data: liststr } = await getAllStore();

    const selectedStoreId = localStorage.getItem("selected_store");
    const matchedStore = liststr.find((store: StoreData) => store._id === selectedStoreId) || null;
    const defaultStore = matchedStore || liststr[0] || null;

    setSelectedStore(defaultStore);
  };

  const handleStoreSelected = (store: StoreData) => {
    localStorage.setItem("selected_store", store._id);
    setSelectedStore(store);
    setShowInitialStoreModal(false);
    window.dispatchEvent(new CustomEvent("selected-store-changed", { detail: { storeId: store._id } }));
  };

  const handleStorePickerSelected = (store: StoreData) => {
    localStorage.setItem("selected_store", store._id);
    setSelectedStore(store);
    setShowStorePicker(false);
    window.dispatchEvent(new CustomEvent("selected-store-changed", { detail: { storeId: store._id } }));
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

  useEffect(() => {
    const syncStoreFromSelection = () => {
      fectData();
    };

    window.addEventListener("selected-store-changed", syncStoreFromSelection);
    return () => window.removeEventListener("selected-store-changed", syncStoreFromSelection);
  }, []);

  const isNavItemActive = (link: string) => {
    if (link === "/") return pathname === "/" && currentHash !== "#menu";
    if (link === "/#menu") return pathname === "/" && currentHash === "#menu";
    return pathname === link || pathname.startsWith(`${link}/`);
  };

  const handleNavItemClick = (event: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    setShowMobileMenu(false);

    if (link === "/" && pathname === "/") {
      event.preventDefault();
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      window.dispatchEvent(new Event("hashchange"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCart = () => {
    setShowCart(true);
  };
  const handleLogout = async () => {
    await logout();
  };
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                href={"/"}
                className="flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Pizza size={20} className="text-white" />
                </div>
                <span className="text-xl font-medium text-foreground">PaoPizza</span>
              </Link>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowStorePicker(true)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-muted/40 hover:bg-muted/80 border border-transparent hover:border-border rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 transition-all text-left cursor-pointer"
                >
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[70px] sm:max-w-[120px]">
                    {selectedStore?.name || "Chọn cửa hàng"}
                  </span>
                  <ChevronDown size={10} className="text-muted-foreground transition-transform shrink-0" />
                </button>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              {NavMenu?.map(item => {
                const isActive = isNavItemActive(item.link);
                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    onClick={event => handleNavItemClick(event, item.link)}
                    aria-current={isActive ? "page" : undefined}
                    className={`font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={() => handleCart()} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <ShoppingCart size={20} className="text-foreground" />
                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="flex md:hidden relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Menu"
                >
                  <Menu size={20} className="text-foreground" />
                </button>
                {showMobileMenu && (
                  <>
                    <div className="fixed inset-0 z-35" onClick={() => setShowMobileMenu(false)} />
                    <div className="absolute z-40 top-full right-0 mt-2 w-56 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      {NavMenu.map(item => {
                        const isActive = isNavItemActive(item.link);
                        const iconClassName = isActive ? "text-primary" : "text-muted-foreground";

                        return (
                          <Link
                            key={item.link}
                            href={item.link}
                            onClick={event => handleNavItemClick(event, item.link)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                              isActive ? "bg-primary/5 font-medium text-primary" : "text-foreground"
                            }`}
                          >
                            {item.link === "/" ? (
                              <Home size={16} className={iconClassName} />
                            ) : item.link.includes("#menu") ? (
                              <Pizza size={16} className={iconClassName} />
                            ) : item.link.includes("tracking") ? (
                              <PackageSearch size={16} className={iconClassName} />
                            ) : item.link.includes("about") ? (
                              <Info size={16} className={iconClassName} />
                            ) : item.link.includes("contact") ? (
                              <Phone size={16} className={iconClassName} />
                            ) : (
                              <ChevronDown size={16} className={iconClassName} />
                            )}
                            {item.name}
                          </Link>
                        );
                      })}

                      <div className="border-t border-border" />

                      {isMounted && isAuthenticated ? (
                        <>
                          <Link
                            href={"/profile"}
                            onClick={() => setShowMobileMenu(false)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                          >
                            <UserIcon size={16} className="text-muted-foreground" /> Hồ sơ của tôi
                          </Link>
                          <Link
                            href={"/orders"}
                            onClick={() => setShowMobileMenu(false)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                          >
                            <History size={16} className="text-muted-foreground" /> Lịch sử đơn hàng
                          </Link>
                          <Link
                            href={"/loyalty"}
                            onClick={() => setShowMobileMenu(false)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                          >
                            <span className="flex items-center gap-2.5 whitespace-nowrap">
                              <Gift size={16} className="text-primary animate-pulse" /> Đổi thưởng
                            </span>
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {user?.currentPoint || 0} Pts
                            </span>
                          </Link>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left cursor-pointer"
                          >
                            <LogOut size={16} /> Đăng xuất
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              setAuthMode("login");
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left cursor-pointer"
                          >
                            <UserIcon size={16} className="text-muted-foreground" />
                            Đăng nhập
                          </button>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              setAuthMode("register");
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left cursor-pointer"
                          >
                            <UserIcon size={16} className="text-muted-foreground" />
                            Đăng ký
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {isMounted && isAuthenticated ? (
                <div className="hidden md:block relative shrink-0">
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
                            href={"/loyalty"}
                            onClick={() => setShowNavMenu(false)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left"
                          >
                            <span className="flex items-center gap-2.5 whitespace-nowrap">
                              <Gift size={16} className="text-primary animate-pulse" /> Đổi thưởng
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
                <div className="hidden md:flex items-center gap-2">
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
      {(showInitialStoreModal || showStorePicker) && (
        <SelectStoreModal
          isOpen
          onClose={showInitialStoreModal ? handleStoreSelected : handleStorePickerSelected}
          onDismiss={showInitialStoreModal ? undefined : () => setShowStorePicker(false)}
        />
      )}
    </>
  );
}
