"use client";
import { ArrowRight, Award, ChefHat, Clock, MapPin, Phone, Plus, Star, Truck, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAllCategories } from "@/src/services/category.service";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart } from "@/src/context/cartContext";
import { Textarea } from "@/src/components/ui/textarea";
import { Toaster } from "sonner";
import { formatVND } from "@/src/utils/formatVND";
import { getMenuByStoreId, MenuData, Product } from "@/src/services/menu.service";
import { getAllIngredients } from "@/src/services/ingredient.service";

type MenuCategoryUI = {
  slug: string;
  name: string;
  icon: string;
};

type ExtraTopping = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  cost_per_unit: number;
  is_active: boolean;
  isDeleted: boolean;
};

const parseCrustOptions = (value: string | string[] | undefined): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap(item => parseCrustOptions(item))));
  }

  const raw = value.trim();
  if (!raw) return [];

  const splitByDelimiter = raw
    .split(/[\s,|/;]+/)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  if (splitByDelimiter.length > 1) {
    return Array.from(new Set(splitByDelimiter));
  }

  const compact = raw.replace(/\s+/g, "").toLowerCase();
  const mergedMatches = compact.match(/traditional|thin|medium|thick|stuffed|cheese/g);

  if (mergedMatches && mergedMatches.length > 1 && mergedMatches.join("") === compact) {
    return Array.from(new Set(mergedMatches));
  }

  return [raw.toLowerCase()];
};

const formatCrustLabel = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, character => character.toUpperCase());

export default function IndexPage() {
  const { isAuthenticated, setAuthMode, user } = useCustomerAuth();
  const { addToCart, fetchCart, cart } = useCart();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);

  const [product, setProduct] = useState<Product | null>(null);
  const [note, setNote] = useState<string>("");
  const [menu, setMenu] = useState<MenuData>();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedCrust, setSelectedCrust] = useState<string>("");
  const [extraToppings, setExtraToppings] = useState<ExtraTopping[]>([]);
  const [selectedExtraToppingIds, setSelectedExtraToppingIds] = useState<string[]>([]);

  const productListRef = useRef<HTMLDivElement | null>(null);
  const handleCategoryClick = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    if (productListRef.current) {
      productListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const filteredMenu1 =
    activeCategory === "all" ? menu?.products : menu?.products.filter(m => m?.category.slug === activeCategory);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map(variant => variant.size)));
  }, [product]);

  const availableCrusts = useMemo(() => {
    if (!product || !selectedSize) return [];
    return Array.from(
      new Set(
        product.variants
          .filter(variant => variant.size === selectedSize)
          .flatMap(variant => parseCrustOptions(variant.crust))
          .filter(Boolean),
      ),
    );
  }, [product, selectedSize]);

  const isPizzaProduct = useMemo(() => {
    if (!product) return false;
    const categorySlug = product.category?.slug?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    return categorySlug.includes("pizza") || productName.includes("pizza");
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;

    const exactVariant = product.variants.find(
      variant =>
        variant.size === selectedSize &&
        (!isPizzaProduct || !selectedCrust || parseCrustOptions(variant.crust).includes(selectedCrust)),
    );

    if (exactVariant) return exactVariant;

    const fallbackBySize = product.variants.find(variant => variant.size === selectedSize);
    return fallbackBySize || product.variants[0] || null;
  }, [isPizzaProduct, product, selectedCrust, selectedSize]);

  const ingredientSummary = useMemo(() => {
    if (!selectedVariant) return "";
    return selectedVariant.recipe.map(item => item.ingredient.name).join(" ");
  }, [selectedVariant]);

  const baseIngredientIdSet = useMemo(() => {
    if (!selectedVariant) return new Set<string>();
    return new Set(selectedVariant.recipe.map(item => item.ingredient._id));
  }, [selectedVariant]);

  const extraToppingOptions = useMemo(() => {
    return extraToppings.filter(item => item.is_active && !item.isDeleted && !baseIngredientIdSet.has(item._id));
  }, [baseIngredientIdSet, extraToppings]);

  const selectedExtraToppings = useMemo(() => {
    return extraToppingOptions.filter(item => selectedExtraToppingIds.includes(item._id));
  }, [extraToppingOptions, selectedExtraToppingIds]);

  const extraToppingTotal = useMemo(() => {
    return selectedExtraToppings.reduce((total, item) => total + Number(item.cost_per_unit || 0), 0);
  }, [selectedExtraToppings]);

  const unitPrice = useMemo(() => {
    if (!selectedVariant) return 0;
    return Number(selectedVariant.price || 0) + extraToppingTotal;
  }, [extraToppingTotal, selectedVariant]);

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

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("selected-store-changed", handleStoreChanged);
    };
  }, []);

  useEffect(() => {
    const fectData = async () => {
      try {
        const categories = await getAllCategories();
        const menu = selectedStoreId ? await getMenuByStoreId(selectedStoreId) : null;

        const mappedCategories: MenuCategoryUI[] = categories
          .filter((cat: { is_active: boolean; isDeleted: boolean }) => cat.is_active && !cat.isDeleted)
          .map((cat: MenuCategoryUI) => ({
            slug: cat.slug,
            name: cat.name,
            icon: cat.icon,
          }));

        const finalCategories: MenuCategoryUI[] = [
          {
            slug: "all",
            name: "Tất cả",
            icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXV0ZW5zaWxzLWNyb3NzZWQtaWNvbiBsdWNpZGUtdXRlbnNpbHMtY3Jvc3NlZCI+PHBhdGggZD0ibTE2IDItMi4zIDIuM2EzIDMgMCAwIDAgMCA0LjJsMS44IDEuOGEzIDMgMCAwIDAgNC4yIDBMMjIgOCIvPjxwYXRoIGQ9Ik0xNSAxNSAzLjMgMy4zYTQuMiA0LjIgMCAwIDAgMCA2bDcuMyA3LjNjLjcuNyAyIC43IDIuOCAwTDE1IDE1Wm0wIDAgNyA3Ii8+PHBhdGggZD0ibTIuMSAyMS44IDYuNC02LjMiLz48cGF0aCBkPSJtMTkgNS03IDciLz48L3N2Zz4=",
          },
          ...mappedCategories,
        ];
        setCategories(finalCategories);
        setMenu(menu || undefined);
      } catch {}
    };
    fectData();
  }, [selectedStoreId]);

  useEffect(() => {
    const fetchExtraToppings = async () => {
      try {
        const ingredientList = await getAllIngredients();
        setExtraToppings(ingredientList || []);
      } catch {
        setExtraToppings([]);
      }
    };

    fetchExtraToppings();
  }, []);

  // (() => {
  //   filteredMenu1?.map(item => {
  //     console.log(item);
  //   });
  // })();
  const hanldeProduct = (selectedProduct: Product) => {
    setProduct(selectedProduct);

    const firstVariant = selectedProduct.variants[0];
    const isPizza =
      selectedProduct.category?.slug?.toLowerCase().includes("pizza") || selectedProduct.name?.toLowerCase().includes("pizza");
    const firstCrust = parseCrustOptions(firstVariant?.crust)[0] || "";

    setSelectedSize(firstVariant?.size || "");
    setSelectedCrust(isPizza ? firstCrust : "");
    setSelectedExtraToppingIds([]);

    const productInCart = cart?.items.find(i => i.sku === firstVariant?.sku);
    setNote(productInCart ? productInCart?.note : "");
  };

  const syncNoteBySku = (sku: string) => {
    const productInCart = cart?.items.find(item => item.sku === sku);
    setNote(productInCart ? productInCart.note : "");
  };

  const handleSelectSize = (size: string) => {
    if (!product) return;

    const nextVariant = isPizzaProduct
      ? product.variants.find(
          variant => variant.size === size && (!selectedCrust || parseCrustOptions(variant.crust).includes(selectedCrust)),
        ) ||
        product.variants.find(variant => variant.size === size) ||
        null
      : product.variants.find(variant => variant.size === size) || null;

    setSelectedSize(size);
    setSelectedCrust(isPizzaProduct ? parseCrustOptions(nextVariant?.crust)[0] || "" : "");

    if (nextVariant) {
      syncNoteBySku(nextVariant.sku);
    }
  };

  const handleSelectCrust = (crust: string) => {
    if (!product || !isPizzaProduct) return;

    setSelectedCrust(crust);
    const nextVariant = product.variants.find(
      variant => variant.size === selectedSize && parseCrustOptions(variant.crust).includes(crust),
    );
    if (nextVariant) {
      syncNoteBySku(nextVariant.sku);
    }
  };

  const handleToggleExtraTopping = (toppingId: string) => {
    setSelectedExtraToppingIds(prev => (prev.includes(toppingId) ? prev.filter(id => id !== toppingId) : [...prev, toppingId]));
  };

  const handleCart = async (product_id: string, size: string, quantity: number = 1, sku: string, note: string = "") => {
    if (!isAuthenticated) setAuthMode("login");
    else {
      await addToCart(user?.id || "", product_id, size, quantity, note);
      const fetchedCart = (await fetchCart(user?.id || "")) as
        | {
            items?: Array<{ sku: string; note?: string }>;
          }
        | undefined;
      const productInCart = fetchedCart?.items?.find(item => item.sku === sku);
      setNote(productInCart?.note || "");
    }
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
                  href="tel:19001234"
                  className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Phone size={18} /> 1900 1234
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
                  src="https://images.unsplash.com/photo-1697376354276-18942b15de7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHJlc3RhdXJhbnQlMjBraXRjaGVufGVufDF8fHx8MTc3MzYwMDU0N3ww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="PaoPizza"
                  fill
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className=" object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Truck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Miễn phí giao hàng</p>
                    <p className="text-xs text-muted-foreground">Đơn từ 200.000đ</p>
                  </div>
                </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl text-foreground mb-3">Thực đơn của chúng tôi</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Khám phá bộ sưu tập món ăn thủ công với nguyên liệu tươi ngon nhất
            </p>
          </div>
          <div className="sticky top-[72px] w-full z-20 bg-white/90 backdrop-blur-md py-2 px-3 sm:px-5 border border-border/80 shadow-sm rounded-2xl sm:rounded-[24px] mx-3 sm:mx-auto max-w-7xl transition-all duration-300">
            <div
              className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full justify-start sm:justify-center"
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
          </div>

          {categories
            .filter(item => item.slug !== "all")
            .map(cat => {
              const categoryItems = filteredMenu1?.filter(item => item.category.slug === cat.slug);

              if (categoryItems?.length === 0) return null;
              return (
                <>
                  <div ref={productListRef} key={cat.slug} className="space-y-6 mt-5 scroll-mt-42">
                    <div className="border-l-4 border-primary pl-4 py-1">
                      <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                        <Image src={cat.icon || ""} width={18} height={18} alt={cat.name} /> {cat.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{""}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {" "}
                      {categoryItems?.map(item => (
                        <div
                          onClick={() => {
                            hanldeProduct(item);
                          }}
                          key={item._id}
                          className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group"
                        >
                          <div className="relative aspect-square overflow-hidden">
                            <Image
                              src={item.variants[0].image.url}
                              alt={item.name}
                              fill
                              loading="eager"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-[10px] rounded-full capitalize">
                              {categories.find(c => c.slug === item.category.slug)?.name}
                            </span>
                          </div>
                          <div className="p-5">
                            <h4 className="text-foreground mb-1">{item.name}</h4>
                            <span className="text-[14px]">{item.description}</span>
                            <div className="flex items-center justify-end mt-2">
                              <button
                                onClick={() => {
                                  hanldeProduct(item);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors cursor-pointer"
                              >
                                {item.variants.length > 1
                                  ? `Chỉ từ ${formatVND(item.variants[0].price)}`
                                  : `${formatVND(item.variants[0].price)}`}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
            {filteredMenu.map(item => (
              <div
                onClick={() => {
                  hanldeProduct(item);
                }}
                key={item._id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.variants[0].image.url}
                    alt={item.name}
                    fill
                    loading="eager"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-[10px] rounded-full capitalize">
                    {categories.find(c => c.slug === item.category.slug)?.name}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="text-foreground mb-1">{item.name}</h4>
                  <span className="text-[14px]">{item.description}</span>
                  <div className="flex items-center justify-end mt-2">
                    <button
                      onClick={() => {
                        hanldeProduct(item);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      {item.variants.length > 1
                        ? `Chỉ từ ${formatVND(item.variants[0].price)}`
                        : `${formatVND(item.variants[0].price)}`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div> */}
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
                  <p className="text-2xl text-primary">10</p>
                  <p className="text-xs text-muted-foreground mt-1">Chi nhánh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-foreground mb-3">Liên hệ với chúng tôi</h2>
            <p className="text-muted-foreground">Đặt hàng hoặc cần hỗ trợ? Liên hệ ngay!</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: <Phone size={22} />, label: "Hotline", value: "0917580860" },
              { icon: <MapPin size={22} />, label: "Địa chỉ", value: "180 Cao lỗ, Q.8, TP.HCM" },
              { icon: <Clock size={22} />, label: "Giờ mở cửa", value: "10:00 - 23:00 hàng ngày" },
            ].map(c => (
              <div key={c.label} className="bg-card rounded-2xl border border-border p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  {c.icon}
                </div>
                <p className="text-foreground mb-1">{c.label}</p>
                <p className="text-sm text-muted-foreground">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {product && selectedVariant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setProduct(null);
          }}
        >
          <div
            className="bg-card rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            {/* Image side */}
            <div className="md:w-2/5 bg-white border-b md:border-b-0 md:border-r border-border/60 flex items-center justify-center p-5 sm:p-6 shrink-0">
              <div className="relative w-full max-w-[320px] aspect-square">
                <Image
                  src={selectedVariant.image.url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 60vw, 35vw"
                  className="object-contain "
                />
              </div>
            </div>

            {/* Config side */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-start justify-between p-5 pb-3">
                <div className="pr-3">
                  <h3 className="text-xl text-foreground">{product.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedVariant.size}
                    {isPizzaProduct && selectedCrust ? ` - ${formatCrustLabel(selectedCrust)}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nguyên liệu: {selectedVariant.recipe.map(item => item.ingredient.name).join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setProduct(null);
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 space-y-5">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Chọn kích thước</p>
                    <div
                      className="grid gap-2 bg-muted rounded-xl p-1"
                      style={{ gridTemplateColumns: `repeat(${Math.max(availableSizes.length, 1)}, minmax(0, 1fr))` }}
                    >
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => handleSelectSize(size)}
                          className={`py-2 rounded-lg text-center transition-all ${
                            selectedSize === size
                              ? "bg-card shadow text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <p className="text-sm truncate">{size}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isPizzaProduct && availableCrusts.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Chọn loại đế</p>
                      <div
                        className="grid gap-2 bg-muted rounded-xl p-1"
                        style={{ gridTemplateColumns: `repeat(${Math.max(availableCrusts.length, 1)}, minmax(0, 1fr))` }}
                      >
                        {availableCrusts.map(crust => (
                          <button
                            key={crust}
                            onClick={() => handleSelectCrust(crust)}
                            className={`py-2 rounded-lg text-center transition-all ${
                              selectedCrust === crust
                                ? "bg-card shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <p className="text-sm truncate">{formatCrustLabel(crust)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {extraToppingOptions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Chọn extra topping</p>
                    <div className="grid grid-cols-2 gap-2">
                      {extraToppingOptions.map(item => {
                        const isActive = selectedExtraToppingIds.includes(item._id);
                        return (
                          <button
                            key={item._id}
                            onClick={() => handleToggleExtraTopping(item._id)}
                            className={`px-3 py-2 rounded-lg border text-left transition-all ${
                              isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            <p className="text-sm truncate">{item.name}</p>
                            <p className="text-xs">+ {formatVND(item.cost_per_unit)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Ghi chú</p>
                  <Textarea
                    placeholder="Thêm ghi chú cho món này"
                    className="min-h-[88px]"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-border">
                <button
                  onClick={() => {
                    const extraToppingNote = selectedExtraToppings.map(item => item.name).join(", ");
                    const finalNote = [note.trim(), extraToppingNote ? `Extra topping: ${extraToppingNote}` : ""]
                      .filter(Boolean)
                      .join(" | ");

                    handleCart(product._id, selectedVariant.size, 1, selectedVariant.sku, finalNote);
                  }}
                  className="w-full flex items-center justify-between gap-2 bg-primary text-white pl-5 pr-4 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  <span className="flex items-center gap-2">
                    <Plus size={18} /> {"Thêm vào giỏ"}
                  </span>
                  <span>{formatVND(unitPrice)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster
        toastOptions={{
          classNames: {
            success: "bg-green-500! text-white! border-green-600!",
            error: "bg-red-500! text-white! border-red-600!",
            warning: "bg-yellow-500! text-white! border-yellow-600!",
            toast: "bg-gray-800! text-white!",
          },
        }}
      />
    </>
  );
}
