"use client";
import { ArrowRight, Award, ChefHat, Clock, MapPin, Minus, Phone, Plus, Star, Truck, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAllProducts } from "@/src/services/product.service";
import { getAllCategories } from "@/src/services/category.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useAuth } from "@/src/context/authContext";
import { CartItem, useCart } from "@/src/context/cartContext";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

type MenuCategoryUI = {
  slug: string;
  name: string;
  icon: string;
};
export type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  _id: string;
  url: string;
  public_id: string;
};

export type Ingredient = {
  _id: string;
  name: string;
};

export type RecipeIngredient = {
  ingredient: Ingredient;
  quantity: number;
  unit: string;
};

export type ProductVariant = {
  sku: string;
  price: number;
  size: string;
  image: ProductImage;
  recipe: RecipeIngredient[];
};

type Product = {
  _id: string;
  category: ProductCategory;
  name: string;
  description: string;
  is_active: boolean;
  variants: ProductVariant[];
  isDeleted: boolean;
};

export default function IndexPage() {
  const { isAuthenticated, setAuthMode, user } = useAuth();
  const { addToCart, fetchCart, cart } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [note, setNote] = useState<string>("");

  const filteredMenu = activeCategory === "all" ? products : products.filter(m => m?.category.slug === activeCategory);

  useEffect(() => {
    const fectData = async () => {
      try {
        const categories = await getAllCategories();
        const products = await getAllProducts();

        const mappedCategories: MenuCategoryUI[] = categories
          .filter(cat => cat.is_active && !cat.isDeleted)
          .map(cat => ({
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
        setProducts(products);
      } catch (error) {}
    };
    fectData();
  }, []);

  const hanldeProduct = (selectedProduct: Product) => {
    setProduct(selectedProduct);
    const productInCart = cart?.items.find(i => i.sku === selectedProduct.variants[0].sku);
    setNote(productInCart ? productInCart?.note : "");
  };

  const handleCart = async (product_id: string, size: string, quantity: number = 1, sku: string, note: string = "") => {
    if (!isAuthenticated) setAuthMode("login");
    else {
      await addToCart(user?.id, product_id, size, quantity, note);
      const fectCart = await fetchCart(user?.id);
      const productInCart = fectCart?.items.find(i => i.sku === sku);
      setNote(productInCart?.note);
    }
  };

  const handleChangeSize = async (item: ProductVariant) => {
    const productInCart = cart?.items.find(i => i.sku === item.sku);
    setNote(productInCart ? productInCart?.note : "");
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
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${activeCategory === cat.slug ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
              >
                <Image src={cat.icon} width={18} height={18} alt={cat.name} /> {cat.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </section>
      <section id="about" className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1594394206170-4ed1c3564417?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGNoZWYlMjBjb29raW5nJTIwb3ZlbnxlbnwxfHx8fDE3NzM2NDcwNDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Kitchen"
                fill
                sizes=""
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

      {/* Contact */}
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

      {product && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setProduct(null);
          }}
        >
          <div
            className="bg-card relative rounded-2xl p-3 w-full max-w-[968px] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setProduct(null);
              }}
              className="absolute p-2 m-2 rounded-lg hover:bg-muted text-muted-foreground top-0 right-0"
            >
              <X size={22} />
            </button>
            <Tabs defaultValue={product.variants[0].sku} className="p-2 grid grid-cols-2">
              {product.variants.map(item => (
                <>
                  <TabsContent value={item.sku}>
                    <Image src={item.image.url} alt="Pizza" fill className="relative! rounded-2xl aspect-square" />
                  </TabsContent>
                </>
              ))}
              <div className="m-3">
                <h4 className="text-foreground mb-1">{product.name}</h4>
                <span className="text-[14px]">{product.description}</span>

                <TabsList className={` grid w-full grid-cols-${product.variants.length} grid-rows-1 my-2`}>
                  {product.variants.map(item => (
                    <>
                      <TabsTrigger onClick={() => handleChangeSize(item)} value={item.sku}>
                        {item.size}
                      </TabsTrigger>
                    </>
                  ))}
                </TabsList>
                {product.variants.map(item => {
                  const recipeProduct = item.recipe.map(item => ({
                    name: item.ingredient.name,
                    quantity: item.quantity,
                    unit: item.unit,
                  }));

                  return (
                    <>
                      <TabsContent value={item.sku} className="flex flex-col h-full max-h-[350px]">
                        <div className="flex-1 overflow-y-auto pr-2 pb-4">
                          <div className="text-sm text-gray-700 leading-relaxed white-space">
                            Nguyên liệu: {recipeProduct.map(item => `${item.name} ${item.quantity}${item.unit}`).join(", ")}
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-200 bg-white">
                          <Textarea
                            placeholder="Ghi chú"
                            className="placeholder:text-[16px] text-[16px]"
                            onChange={e => setNote(e.target.value)}
                            value={note}
                          />
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                handleCart(product._id, item.size, 1, item.sku, note);
                              }}
                              className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                              Thêm vào giỏ hàng
                            </button>
                          </div>
                        </div>
                      </TabsContent>
                    </>
                  );
                })}
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
}
