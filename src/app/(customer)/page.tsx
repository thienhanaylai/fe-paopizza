"use client";
import {
  ArrowRight,
  Award,
  CakeSlice,
  ChefHat,
  Clock,
  Clock1,
  Minus,
  Phone,
  Pizza,
  Plus,
  Soup,
  Star,
  Truck,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type MenuCategory = "all" | "pizza" | "pasta" | "dessert" | "drink";

interface MenuItem {
  id: number;
  name: string;
  desc: string;
  price: number;
  image: string;
  rating: number;
  bestseller: boolean;
  category: MenuCategory;
}

const categories: { key: MenuCategory; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Tất cả", icon: <UtensilsCrossed size={18} /> },
  { key: "pizza", label: "Pizza", icon: <Pizza size={18} /> },
  { key: "pasta", label: "Pasta", icon: <Soup size={18} /> },
  { key: "dessert", label: "Tráng miệng", icon: <CakeSlice size={18} /> },
  { key: "drink", label: "Đồ uống", icon: <Wine size={18} /> },
];
function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "Pizza Pepperoni",
    desc: "Pepperoni Ý, phô mai Mozzarella, sốt cà chua đặc biệt",
    price: 170000,
    image:
      "https://images.unsplash.com/photo-1708649360970-1739eb95204b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXBwZXJvbmklMjBwaXp6YSUyMGNsb3NldXB8ZW58MXx8fHwxNzczNjEyOTkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    bestseller: true,
    category: "pizza",
  },
  {
    id: 2,
    name: "Pizza Hải Sản",
    desc: "Tôm, mực, cua cùng rau củ tươi ngon trên nền sốt kem",
    price: 195000,
    image:
      "https://images.unsplash.com/photo-1530632789071-8543f47edb34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwcGl6emElMjBmcmVzaCUyMGJhc2lsfGVufDF8fHx8MTc3MzcxMDI2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.8,
    bestseller: true,
    category: "pizza",
  },
  {
    id: 3,
    name: "Pizza BBQ Chicken",
    desc: "Gà nướng BBQ, hành tây, ớt chuông và sốt BBQ đặc biệt",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYnElMjBjaGlja2VuJTIwcGl6emF8ZW58MXx8fHwxNzczNjIyOTkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.7,
    bestseller: false,
    category: "pizza",
  },
  {
    id: 4,
    name: "Pizza Margherita",
    desc: "Pizza Ý cổ điển với cà chua, mozzarella tươi và basil",
    price: 120000,
    image:
      "https://images.unsplash.com/photo-1772351103036-d107ffab0bbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVlc2UlMjBwaXp6YSUyMHNsaWNlJTIwbWVsdGVkfGVufDF8fHx8MTc3MzcxMDI2Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.6,
    bestseller: false,
    category: "pizza",
  },
  {
    id: 5,
    name: "Pizza Hawaiian",
    desc: "Dứa tươi, jambon cao cấp và phô mai mozzarella",
    price: 155000,
    image:
      "https://images.unsplash.com/photo-1671572579366-89bec1184f5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXdhaWlhbiUyMHBpenphJTIwcGluZWFwcGxlfGVufDF8fHx8MTc3MzY5MjgzNXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.5,
    bestseller: false,
    category: "pizza",
  },
  {
    id: 6,
    name: "Spaghetti Bolognese",
    desc: "Mì Ý sốt thịt bò bằm cà chua truyền thống",
    price: 135000,
    image:
      "https://images.unsplash.com/photo-1632739148811-2b53d07be26f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFnaGV0dGklMjBib2xvZ25lc2UlMjBwbGF0ZXxlbnwxfHx8fDE3NzM2Mzg5OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.7,
    bestseller: true,
    category: "pasta",
  },
  {
    id: 7,
    name: "Pasta Carbonara",
    desc: "Mì Ý sốt kem trứng, thịt xông khói giòn, phô mai Parmesan",
    price: 145000,
    image:
      "https://images.unsplash.com/photo-1655662844229-d2c2a81f09ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGNhcmJvbmFyYSUyMGl0YWxpYW58ZW58MXx8fHwxNzczNjU1MjkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.8,
    bestseller: false,
    category: "pasta",
  },
  {
    id: 8,
    name: "Penne Arrabbiata",
    desc: "Nui ống sốt cà chua cay, tỏi, ớt và húng quế",
    price: 125000,
    image:
      "https://images.unsplash.com/photo-1662478839788-7d2898ca66cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5uZSUyMHBhc3RhJTIwdG9tYXRvJTIwYmFzaWx8ZW58MXx8fHwxNzczNzEyNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.5,
    bestseller: false,
    category: "pasta",
  },
  {
    id: 9,
    name: "Tiramisu",
    desc: "Bánh Tiramisu Ý cổ điển với cà phê espresso và mascarpone",
    price: 75000,
    image:
      "https://images.unsplash.com/photo-1710106519622-8c49d0bcff2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJhbWlzdSUyMGl0YWxpYW4lMjBkZXNzZXJ0fGVufDF8fHx8MTc3MzY3MzIxMXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    bestseller: true,
    category: "dessert",
  },
  {
    id: 10,
    name: "Chocolate Lava Cake",
    desc: "Bánh chocolate nhân chảy nóng hổi, kèm kem vani",
    price: 85000,
    image:
      "https://images.unsplash.com/photo-1673551490243-f29547426841?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBsYXZhJTIwY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzczNjIyOTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.7,
    bestseller: false,
    category: "dessert",
  },
  {
    id: 11,
    name: "Garlic Bread",
    desc: "Bánh mì bơ tỏi nướng giòn, phủ phô mai Parmesan",
    price: 55000,
    image:
      "https://images.unsplash.com/photo-1558679582-dac5f374f01c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJsaWMlMjBicmVhZCUyMGFwcGV0aXplcnxlbnwxfHx8fDE3NzM3MTI1NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.6,
    bestseller: false,
    category: "dessert",
  },
  {
    id: 12,
    name: "Lemonade Đá",
    desc: "Nước chanh tươi mát, thêm bạc hà và đá viên",
    price: 35000,
    image:
      "https://images.unsplash.com/photo-1679934576534-72d79d027fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2VkJTIwbGVtb25hZGUlMjBkcmluayUyMGZyZXNofGVufDF8fHx8MTc3MzcxMjU2MHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.4,
    bestseller: false,
    category: "drink",
  },
  {
    id: 13,
    name: "Coca Cola",
    desc: "Coca Cola đá lạnh, lon 330ml",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1763297059500-5810c9142d2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xhJTIwc29mdCUyMGRyaW5rJTIwZ2xhc3MlMjBpY2V8ZW58MXx8fHwxNzczNzEyNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.3,
    bestseller: false,
    category: "drink",
  },
  {
    id: 14,
    name: "Combo Family",
    desc: "2 Pizza lớn + 4 nước ngọt + Khoai tây chiên lớn",
    price: 450000,
    image:
      "https://images.unsplash.com/photo-1572195577046-2f25894c06fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGRlbGl2ZXJ5JTIwZm9vZCUyMG9yZGVyfGVufDF8fHx8MTc3MzcxMTA1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    bestseller: true,
    category: "pizza",
  },
];
export default function IndexPage() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("all");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [showCart, setShowCart] = useState(false);
  const filteredMenu = activeCategory === "all" ? menuItems : menuItems.filter(m => m.category === activeCategory);
  const addToCart = (id: number) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: number) =>
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
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
                  Xem thực đơn <ArrowRight size={18} />
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
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${activeCategory === cat.key ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map(item => (
              <div
                key={item.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.bestseller && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-[11px] rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-white" /> Bán chạy
                    </span>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs flex items-center gap-1">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" /> {item.rating}
                  </div>
                  <span className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-[10px] rounded-full capitalize">
                    {categories.find(c => c.key === item.category)?.label}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="text-foreground mb-1">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-lg">{formatVND(item.price)}</span>
                    {cart[item.id] ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm text-foreground">{cart[item.id]}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                      >
                        <Plus size={14} /> Thêm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
