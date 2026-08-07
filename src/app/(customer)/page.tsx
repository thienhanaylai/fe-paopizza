"use client";
import { ArrowRight, Award, ChefHat, ChevronLeft, ChevronRight, Clock, Phone, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { getAllCategories } from "@/src/services/category.service";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart, resolveComboId } from "@/src/context/cartContext";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatVND } from "@/src/utils/formatVND";
import { getMenuByStoreId, MenuData, Product, Combo } from "@/src/services/menu.service";
import { getAllIngredients } from "@/src/services/ingredient.service";
import { getAllStore } from "@/src/services/store.service";
import { parseCrustOptions } from "./utils";
import type { MenuCategoryUI, ExtraTopping, ComboSlotSelection } from "./types";
import ProductDetailModal from "@/src/components/modals/ProductDetailModal";
import ComboBuilderModal from "@/src/components/modals/ComboBuilderModal";

export default function IndexPage() {
  const { user } = useCustomerAuth();
  const { cart, clearCart, editingSku, setEditingSku, editingComboId, setEditingComboId } = useCart();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [product, setProduct] = useState<Product | null>(null);
  const [menu, setMenu] = useState<MenuData>();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const prevStoreIdRef = useRef<string>("");
  const [storeCount, setStoreCount] = useState<number>(0);
  const [extraToppings, setExtraToppings] = useState<ExtraTopping[]>([]);

  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  // Initial state for product editing flow (passed to ProductDetailModal)
  const [editProductState, setEditProductState] = useState<{
    size?: string;
    crust?: string;
    toppingIds?: string[];
    note?: string;
  } | null>(null);

  // Initial state for combo editing flow (passed to ComboBuilderModal)
  const [editComboSelections, setEditComboSelections] = useState<Record<number, ComboSlotSelection[]> | undefined>(undefined);
  const [editComboOldSku, setEditComboOldSku] = useState<string | null>(null);

  // scroll category right/left
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [categoryCanScrollLeft, setCategoryCanScrollLeft] = useState(false);
  const [categoryCanScrollRight, setCategoryCanScrollRight] = useState(false);

  //  các URL hình ảnh đã tải xong
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const handleImageLoaded = (url: string) => {
    if (!url || loadedImages.has(url)) return;
    setLoadedImages(prev => new Set(prev).add(url));
  };

  // Embla carousel cho combo section
  const [comboEmblaRef, comboEmblaApi] = useEmblaCarousel({ align: "start", skipSnaps: true, duration: 30 });
  const scrollPrevCombo = useCallback(() => comboEmblaApi?.scrollPrev(), [comboEmblaApi]);
  const scrollNextCombo = useCallback(() => comboEmblaApi?.scrollNext(), [comboEmblaApi]);
  const [comboCanScrollPrev, setComboCanScrollPrev] = useState(false);
  const [comboCanScrollNext, setComboCanScrollNext] = useState(false);

  // Category scroll check & handlers
  const checkCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCategoryCanScrollLeft(el.scrollLeft > 2);
    setCategoryCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  const scrollCategoriesLeft = () => {
    categoryScrollRef.current?.scrollBy({ left: -250, behavior: "smooth" });
  };

  const scrollCategoriesRight = () => {
    categoryScrollRef.current?.scrollBy({ left: 250, behavior: "smooth" });
  };

  useEffect(() => {
    if (!comboEmblaApi) return;
    const onSelect = () => {
      setComboCanScrollPrev(comboEmblaApi.canScrollPrev());
      setComboCanScrollNext(comboEmblaApi.canScrollNext());
    };
    comboEmblaApi.on("select", onSelect);
    comboEmblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      comboEmblaApi.off("select", onSelect);
      comboEmblaApi.off("reInit", onSelect);
    };
  }, [comboEmblaApi]);

  // Category scroll detection
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    checkCategoryScroll();
    el.addEventListener("scroll", checkCategoryScroll, { passive: true });
    window.addEventListener("resize", checkCategoryScroll);
    return () => {
      el.removeEventListener("scroll", checkCategoryScroll);
      window.removeEventListener("resize", checkCategoryScroll);
    };
  }, [checkCategoryScroll, categories]);

  // Map ref riêng cho từng category slug — tránh bug ref bị ghi đè khi .map()
  const categoryRefsMap = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCategoryClick = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    // Không scroll ở đây — scroll sẽ được xử lý trong useEffect sau khi React re-render
    if (categorySlug) {
      // Scroll lên đầu menu section khi chọn "Tất cả" hoặc "Combo"
      const menuSection = document.getElementById("menu");
      menuSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // // Scroll đến category section sau khi re-render xong
  // useEffect(() => {
  //   if (activeCategory === "all" || activeCategory === "combo") return;
  //   // Đợi 1 tick để DOM đã cập nhật sau re-render
  //   const timer = setTimeout(() => {
  //     categoryRefsMap.current[activeCategory]?.scrollIntoView({
  //       behavior: "smooth",
  //       block: "start",
  //     });
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [activeCategory]);

  const filteredMenu1 =
    activeCategory === "combo"
      ? []
      : activeCategory === "all"
        ? menu?.products
        : menu?.products.filter(m => m?.category.slug === activeCategory);

  useEffect(() => {
    const syncSelectedStore = () => {
      const currentStoreId = localStorage.getItem("selected_store") || "";
      setSelectedStoreId(prev => (prev === currentStoreId ? prev : currentStoreId));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "selected_store") {
        syncSelectedStore();
      }
    };

    const handleStoreChanged = () => {
      syncSelectedStore();
    };

    syncSelectedStore();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("selected-store-changed", handleStoreChanged);
    window.addEventListener("focus", syncSelectedStore);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("selected-store-changed", handleStoreChanged);
      window.removeEventListener("focus", syncSelectedStore);
    };
  }, []);

  useEffect(() => {
    const fectData = async () => {
      try {
        setIsLoading(true);
        const { data: categories } = await getAllCategories();
        const menu = selectedStoreId ? await getMenuByStoreId(selectedStoreId) : null;

        const mappedCategories: MenuCategoryUI[] = categories
          .filter((cat: { isActive: boolean; isDeleted: boolean }) => cat.isActive && !cat.isDeleted)
          .map((cat: MenuCategoryUI) => ({
            slug: cat.slug,
            name: cat.name,
            icon: cat.icon,
          }));

        const comboIconSvg =
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdpZnQiPjxyZWN0IHg9IjMiIHk9IjgiIHdpZHRoPSIxOCIgaGVpZ2h0PSI0IiByeD0iMSIvPjxwYXRoIGQ9Ik0xMiA4djEzIi8+PHBhdGggZD0iTTE5IDEydjdhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJ2LTciLz48cGF0aCBkPSJNNy41IDhhMi41IDIuNSAwIDAgMSAwLTVBMyAzIDAgMCAxIDEyIDhhMyAzIDAgMCAxIDQuNS0yLjVBMi41IDIuNSAwIDAgMSAxNi41IDgiLz48L3N2Zz4=";

        const finalCategories: MenuCategoryUI[] = [
          {
            slug: "all",
            name: "Tất cả",
            icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXV0ZW5zaWxzLWNyb3NzZWQtaWNvbiBsdWNpZGUtdXRlbnNpbHMtY3Jvc3NlZCI+PHBhdGggZD0ibTE2IDItMi4zIDIuM2EzIDMgMCAwIDAgMCA0LjJsMS44IDEuOGEzIDMgMCAwIDAgNC4yIDBMMjIgOCIvPjxwYXRoIGQ9Ik0xNSAxNSAzLjMgMy4zYTQuMiA0LjIgMCAwIDAgMCA2bDcuMyA3LjNjLjcuNyAyIC43IDIuOCAwTDE1IDE1Wm0wIDAgNyA3Ii8+PHBhdGggZD0ibTIuMSAyMS44IDYuNC02LjMiLz48cGF0aCBkPSJtMTkgNS03IDciLz48L3N2Zz4=",
          },
          {
            slug: "combo",
            name: "Combo",
            icon: comboIconSvg,
          },
          ...mappedCategories,
        ];
        setCategories(finalCategories);
        setMenu(menu || undefined);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    fectData();

    prevStoreIdRef.current = selectedStoreId;
  }, [selectedStoreId, clearCart, user?.id]);

  useEffect(() => {
    const fetchExtraToppings = async () => {
      try {
        const { data: ingredientList } = await getAllIngredients();
        setExtraToppings(ingredientList || []);
      } catch {
        setExtraToppings([]);
      }
    };

    fetchExtraToppings();
  }, []);

  // Lấy số lượng cửa hàng thực tế
  useEffect(() => {
    const fetchStoreCount = async () => {
      try {
        const res = await getAllStore(1, 1);
        setStoreCount(res.pagination?.total ?? 0);
      } catch {
        setStoreCount(0);
      }
    };
    fetchStoreCount();
  }, []);

  useEffect(() => {
    if (!editingSku || !menu) return;

    const cartItem = cart?.items.find(item => item.sku === editingSku);
    if (!cartItem) {
      setEditingSku(null);
      return;
    }

    const productId = typeof cartItem.product_id === "string" ? cartItem.product_id : cartItem.product_id?._id;
    const targetProduct = menu.products.find(p => p._id === productId);
    if (!targetProduct) {
      setEditingSku(null);
      return;
    }

    const matchingVariant = targetProduct.variants.find(v => v.sku === editingSku) || targetProduct.variants[0];

    const isPizza =
      targetProduct.category?.slug?.toLowerCase().includes("pizza") || targetProduct.name?.toLowerCase().includes("pizza");

    const noteParts = (cartItem.note || "")
      .split("|")
      .map(part => part.trim())
      .filter(Boolean);
    const customNote = noteParts.filter(part => !part.toLowerCase().startsWith("extra topping:")).join(" | ");

    const toppingIds = Array.isArray(cartItem.added_topping)
      ? cartItem.added_topping.map(t => (typeof t === "string" ? t : t._id)).filter((id): id is string => typeof id === "string")
      : [];

    const crustValue = isPizza
      ? cartItem.crust || (matchingVariant ? parseCrustOptions(matchingVariant.crust)[0] || "" : "")
      : "";

    setEditProductState({
      size: cartItem.size || matchingVariant?.size || "",
      crust: crustValue,
      toppingIds,
      note: customNote,
    });
    setProduct(targetProduct);
    setEditingSku(null);
  }, [editingSku, menu, cart?.items, setEditingSku]);

  // Mở modal chỉnh sửa combo từ cart
  useEffect(() => {
    if (!editingComboId || !menu) return;

    const cartItem = cart?.items.find(item => resolveComboId(item.combo) === editingComboId || item.sku === editingComboId);
    if (!cartItem) {
      setEditingComboId(null);
      return;
    }

    // Tìm combo trong menu
    const menuEntry = menu.combos?.find(entry => entry.combo._id === editingComboId || entry._id === editingComboId);
    const combo = menuEntry?.combo;
    if (!combo) {
      setEditingComboId(null);
      return;
    }

    // Map selections vào đúng rule dựa trên requiredQuantity
    const restoredSelections: Record<number, ComboSlotSelection[]> = {};
    let selIdx = 0;
    combo.rules.forEach((rule, ruleIdx) => {
      restoredSelections[ruleIdx] = [];
      for (let i = 0; i < rule.requiredQuantity && selIdx < (cartItem.combo_selections?.length || 0); i++) {
        const sel = cartItem.combo_selections![selIdx];
        restoredSelections[ruleIdx].push({
          productId: typeof sel.product_id === "string" ? sel.product_id : sel.product_id?._id || "",
          sku: sel.sku,
          size: sel.size,
          crust: sel.crust,
        });
        selIdx++;
      }
    });

    setEditComboSelections(restoredSelections);
    setEditComboOldSku(cartItem.sku);
    setSelectedCombo(combo);
    setEditingComboId(null);
  }, [editingComboId, menu, cart?.items, setEditingComboId]);

  const hanldeProduct = (selectedProduct: Product) => {
    setEditProductState(null);
    setProduct(selectedProduct);
  };

  const computeComboOriginalPrice = (combo: Combo): number => {
    // Dynamic pricing: không có giá gốc cố định để so sánh
    if (combo.pricingType === "dynamic") return 0;
    if (combo.discountType === "percent") {
      return Math.round(combo.price / (1 - combo.discount / 100));
    }
    return combo.price + combo.discount;
  };

  const computeComboSavings = (combo: Combo): number => {
    // Dynamic pricing: không hiển thị tiết kiệm vì giá tự động tính
    if (combo.pricingType === "dynamic") return 0;
    return computeComboOriginalPrice(combo) - combo.price;
  };

  const getComboRuleItems = (combo: Combo): string[] => {
    return combo.rules.map(rule => `${rule.groupName} x${rule.requiredQuantity}`);
  };

  const handleOpenCombo = (combo: Combo) => {
    setEditComboSelections(undefined);
    setEditComboOldSku(null);
    setSelectedCombo(combo);
  };

  return (
    <>
      <section className="section1 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm mb-6">
                <Award size={16} /> #1 Pizza tại Việt Nam
              </div>
              <h1 className="text-4xl lg:text-5xl text-foreground leading-tight mb-6">
                Pizza tươi ngon,
                <br />
                <span className="text-primary">giao tận tay bạn</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                Thưởng thức pizza thủ công với nguyên liệu tươi nhất, nướng trong lò gạch truyền thống. Giao hàng nhanh trong 30
                phút.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#menu"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Xem menu <ArrowRight size={18} />
                </a>
                <a
                  href={`tel:${menu?.store.phone}`}
                  className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Phone size={18} /> {menu?.store.phone}
                </a>
              </div>
              <div className="flex items-center gap-8 mt-10">
                <div className="text-center">
                  <p className="text-2xl text-foreground">50K+</p>
                  <p className="text-xs text-muted-foreground">Khách hàng</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl text-foreground">4.9</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" /> Đánh giá
                  </p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl text-foreground">30</p>
                  <p className="text-xs text-muted-foreground">Giao hàng</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                <Image
                  src="https://res.cloudinary.com/dxrrdqgss/image/upload/v1785916423/ifw0bknrorstttxbslq5.jpg"
                  alt="PaoPizza"
                  fill
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className=" object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-card border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <ChefHat size={24} />, title: "Đầu bếp chuyên nghiệp", desc: "Đội ngũ đầu bếp Ý hàng đầu" },
              { icon: <Clock size={24} />, title: "Giao hàng nhanh", desc: "30 phút hoặc miễn phí" },
              { icon: <Award size={24} />, title: "Nguyên liệu tươi", desc: "100% nguyên liệu nhập khẩu" },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-foreground">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="menu" className="py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl text-foreground mb-3">Thực đơn của chúng tôi</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Khám phá bộ sưu tập món ăn thủ công với nguyên liệu tươi ngon nhất
            </p>
          </div>
          <div className="sticky top-[72px] w-full z-20 bg-white/90 backdrop-blur-md py-2 px-3 sm:px-2 border border-border/80 shadow-sm rounded-2xl sm:rounded-[24px]  sm:mx-auto max-w-7xl transition-all duration-300">
            {isLoading && categories.length === 0 ? (
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full justify-start sm:justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-24 rounded-xl bg-muted animate-pulse shrink-0" />
                ))}
              </div>
            ) : (
              <div className="relative flex items-center">
                {categoryCanScrollLeft && (
                  <button
                    onClick={scrollCategoriesLeft}
                    className="absolute left-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border shadow-md hover:bg-muted transition-colors shrink-0 -ml-1"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={16} className="text-foreground" />
                  </button>
                )}

                <div
                  ref={categoryScrollRef}
                  className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full justify-start sm:justify-center scroll-smooth"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        activeCategory === cat.slug
                          ? "border-primary/30 bg-primary/5 text-primary shadow-lg shadow-primary/10 border "
                          : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <Image src={cat.icon || ""} width={18} height={18} alt={cat.name} /> {cat.name}
                    </button>
                  ))}
                </div>

                {categoryCanScrollRight && (
                  <button
                    onClick={scrollCategoriesRight}
                    className="absolute right-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-border shadow-md hover:bg-muted transition-colors shrink-0 -mr-1"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={16} className="text-foreground" />
                  </button>
                )}
              </div>
            )}
          </div>
          {/* sekeleton loading */}
          {isLoading && (!menu || !menu.products) && (
            <div className="mt-8 space-y-6">
              <div className="h-7 w-48 bg-muted animate-pulse rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeCategory === "all" || activeCategory === "combo") &&
            menu?.combos &&
            menu.combos.length > 0 &&
            (() => {
              const comboCount = menu.combos.length;
              const useCarousel = comboCount > 1;

              const comboCard = (combo: Combo) => {
                const savings = computeComboSavings(combo);
                const originalPrice = computeComboOriginalPrice(combo);
                const ruleItems = getComboRuleItems(combo);
                return (
                  <div
                    key={combo._id}
                    className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                    onClick={() => handleOpenCombo(combo)}
                  >
                    <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden">
                      {!loadedImages.has(combo.image || "") && <Skeleton className="absolute inset-0 z-10 rounded-none" />}
                      <Image
                        src={combo.image || ""}
                        alt={combo.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onLoad={() => handleImageLoaded(combo.image || "")}
                      />
                      {savings > 0 && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-[11px] font-semibold rounded-full">
                          Tiết kiệm {formatVND(savings)}
                        </span>
                      )}
                      {combo.pricingType === "dynamic" && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-[11px] font-semibold rounded-full">
                          Giảm {combo.discountType === "percent" ? `${combo.discount} %` : `${formatVND(combo.discount)}`}
                        </span>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <h4 className="text-foreground font-semibold mb-1 sm:mb-1.5 text-sm">{combo.name}</h4>
                      <div className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 space-y-0.5">
                        {ruleItems.map((item, idx) => (
                          <span key={idx} className="block">
                            {item}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3">
                        <div className="flex items-baseline gap-1.5 sm:gap-2">
                          {combo.pricingType === "dynamic" ? (
                            <>
                              {combo.discountType === "percent" ? (
                                <>
                                  <span className="text-xs sm:text-sm text-muted-foreground">Giảm </span>
                                  <span className="text-base sm:text-lg font-bold text-primary">{combo.discount} %</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs sm:text-sm text-muted-foreground">Giảm </span>
                                  <span className="text-base sm:text-lg font-bold text-primary">{formatVND(combo.discount)}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                {formatVND(originalPrice)}
                              </span>
                              <span className="text-base sm:text-lg font-bold text-primary">{formatVND(combo.price)}</span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenCombo(combo);
                          }}
                          className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-orange-500 text-white rounded-lg text-xs sm:text-sm hover:bg-orange-600 transition-colors cursor-pointer"
                        >
                          + Chọn
                        </button>
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <div className="mt-8 space-y-6">
                  <div className="border-l-4 border-orange-500 pl-4 py-1">
                    <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">Combo Ưu Đãi</h3>
                  </div>

                  {useCarousel ? (
                    <div className="relative group/combo-carousel">
                      <button
                        onClick={scrollPrevCombo}
                        disabled={!comboCanScrollPrev}
                        className={`absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 sm:w-11 sm:h-15 rounded-full bg-white shadow-lg border border-border flex items-center justify-center transition-all ${
                          comboCanScrollPrev ? "hover:bg-muted hover:scale-110 cursor-pointer " : "opacity-30 cursor-not-allowed"
                        }`}
                        aria-label="Combo trước"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="overflow-hidden -mx-3" ref={comboEmblaRef}>
                        <div className="flex">
                          {menu.combos.map(entry => (
                            <div
                              key={entry.combo._id}
                              className="flex-[0_0_75%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] px-2 sm:px-3"
                            >
                              {comboCard(entry.combo)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={scrollNextCombo}
                        disabled={!comboCanScrollNext}
                        className={`absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 sm:w-11 sm:h-15 rounded-full bg-white shadow-lg border border-border flex items-center justify-center transition-all ${
                          comboCanScrollNext ? "hover:bg-muted hover:scale-110 cursor-pointer " : "opacity-30 cursor-not-allowed"
                        }`}
                        aria-label="Combo tiếp theo"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {menu.combos.map(entry => comboCard(entry.combo))}
                    </div>
                  )}
                </div>
              );
            })()}

          {categories
            .filter(item => item.slug !== "all")
            .map(cat => {
              const categoryItems = filteredMenu1?.filter(item => item.category.slug === cat.slug);
              const showSkeleton = isLoading || !filteredMenu1 || (!categoryItems?.length && !menu);
              if (!showSkeleton && categoryItems?.length === 0) return null;
              return (
                <div
                  ref={el => {
                    categoryRefsMap.current[cat.slug] = el;
                  }}
                  key={cat.slug}
                  className="space-y-6 mt-5 scroll-mt-42"
                >
                  <div className="border-l-4 border-primary pl-4 py-1">
                    <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                      <Image src={cat.icon || ""} width={18} height={18} alt={cat.name} /> {cat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{""}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    {showSkeleton
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={`skel-${cat.slug}-${i}`}
                            className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse"
                          >
                            <div className="aspect-square bg-muted" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 w-3/4 bg-muted rounded" />
                              <div className="h-3 w-1/2 bg-muted rounded" />
                            </div>
                          </div>
                        ))
                      : categoryItems?.map(item => {
                          if (item.isActive)
                            return (
                              <div
                                onClick={() => {
                                  hanldeProduct(item);
                                }}
                                key={item._id}
                                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col"
                              >
                                <div className="relative aspect-square overflow-hidden">
                                  {!loadedImages.has(item.variants[0].image.url) && (
                                    <Skeleton className="absolute inset-0 z-10 rounded-none" />
                                  )}
                                  <Image
                                    src={item.variants[0].image.url}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    onLoad={() => handleImageLoaded(item.variants[0].image.url)}
                                  />
                                  {/* Discount badge: hiển thị % giảm cao nhất trong các variant */}
                                  {(() => {
                                    const maxDiscount = item.variants.reduce((max, v) => {
                                      if (v.disscountType === "percent" && v.discount && v.discount > max) return v.discount;
                                      return max;
                                    }, 0);
                                    return maxDiscount > 0 ? (
                                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                        -{maxDiscount}%
                                      </span>
                                    ) : null;
                                  })()}
                                  <span className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-[10px] rounded-full capitalize">
                                    {categories.find(c => c.slug === item.category.slug)?.name}
                                  </span>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                  <h4 className="text-foreground mb-1 line-clamp-2">{item.name}</h4>

                                  <div className="flex items-center justify-center mt-auto pt-3">
                                    <button
                                      onClick={() => {
                                        hanldeProduct(item);
                                      }}
                                      className="flex items-center gap-1.5 px-4 py-2 text-black  rounded-lg font-bold text-sm hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                    >
                                      {item.variants.length > 1
                                        ? `Chỉ từ ${formatVND(item.variants[0].price)}`
                                        : `${formatVND(item.variants[0].price)}`}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                        })}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
      <section id="about" className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1594394206170-4ed1c3564417?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGNoZWYlMjBjb29raW5nJTIwb3ZlbnxlbnwxfHx8fDE3NzM2NDcwNDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Kitchen"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="eager"
                className="relative!"
              />
            </div>
            <div>
              <h2 className="text-3xl text-foreground mb-4">Câu chuyện PaoPizza</h2>
              <p className="text-muted-foreground mb-4">
                Được thành lập vào năm 2020, PaoPizza mang đến hương vị pizza Ý đích thực giữa lòng Việt Nam.
              </p>
              <p className="text-muted-foreground mb-6">
                Với đội ngũ đầu bếp được đào tạo tại Naples, mỗi chiếc pizza đều là một tác phẩm nghệ thuật ẩm thực.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-background rounded-xl">
                  <p className="text-2xl text-primary">3+</p>
                  <p className="text-xs text-muted-foreground mt-1">Năm kinh nghiệm</p>
                </div>
                <div className="text-center p-4 bg-background rounded-xl">
                  <p className="text-2xl text-primary">{storeCount || "..."}</p>
                  <p className="text-xs text-muted-foreground mt-1">Chi nhánh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {product && (
        <ProductDetailModal
          products={filteredMenu1 ?? []}
          initialProduct={product}
          extraToppings={extraToppings}
          initialState={editProductState ?? undefined}
          onClose={() => setProduct(null)}
        />
      )}

      {selectedCombo && (
        <ComboBuilderModal
          combo={selectedCombo}
          allProducts={menu?.products ?? []}
          initialSelections={editComboSelections}
          editOldSku={editComboOldSku}
          onClose={() => setSelectedCombo(null)}
        />
      )}
    </>
  );
}
