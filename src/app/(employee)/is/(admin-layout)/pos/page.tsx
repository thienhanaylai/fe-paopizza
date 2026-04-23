"use client";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Hash,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Pizza,
  Soup,
  CakeSlice,
  Wine,
  Receipt,
  Printer,
  ArrowLeft,
  Clock,
  Star,
  Percent,
  Bike,
  Building2,
} from "lucide-react";
import { getRoleLabel, getRoleColor, useEmployeeAuth } from "@/src/context/authEmployeeContext";
import Link from "next/link";
import Image from "next/image";

type MenuCategory = "all" | "pizza" | "pasta" | "dessert" | "drink";
type OrderType = "dine_in" | "carry_out" | "delivery";
type DeliveryMethod = "store_delivery" | "third_party";
type PaymentMethod = "cash" | "bank_transfer" | "card" | "momo";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: MenuCategory;
  bestseller: boolean;
  discount: number;
}

interface CartItem {
  menuItem: MenuItem;
  qty: number;
  note: string;
}

const categories: { key: MenuCategory; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Tất cả", icon: <UtensilsCrossed size={16} /> },
  { key: "pizza", label: "Pizza", icon: <Pizza size={16} /> },
  { key: "pasta", label: "Pasta", icon: <Soup size={16} /> },
  { key: "dessert", label: "Tráng miệng", icon: <CakeSlice size={16} /> },
  { key: "drink", label: "Đồ uống", icon: <Wine size={16} /> },
];

const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "Pizza Pepperoni",
    price: 170000,
    image:
      "https://images.unsplash.com/photo-1708649360970-1739eb95204b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXBwZXJvbmklMjBwaXp6YSUyMGNsb3NldXB8ZW58MXx8fHwxNzczNjEyOTkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pizza",
    bestseller: true,
    discount: 0,
  },
  {
    id: 2,
    name: "Pizza Hải Sản",
    price: 195000,
    image:
      "https://images.unsplash.com/photo-1530632789071-8543f47edb34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwcGl6emElMjBmcmVzaCUyMGJhc2lsfGVufDF8fHx8MTc3MzcxMDI2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pizza",
    bestseller: true,
    discount: 10,
  },
  {
    id: 3,
    name: "Pizza BBQ Chicken",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYnElMjBjaGlja2VuJTIwcGl6emF8ZW58MXx8fHwxNzczNjIyOTkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pizza",
    bestseller: false,
    discount: 0,
  },
  {
    id: 4,
    name: "Pizza Margherita",
    price: 120000,
    image:
      "https://images.unsplash.com/photo-1772351103036-d107ffab0bbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVlc2UlMjBwaXp6YSUyMHNsaWNlJTIwbWVsdGVkfGVufDF8fHx8MTc3MzcxMDI2Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pizza",
    bestseller: false,
    discount: 0,
  },
  {
    id: 5,
    name: "Pizza Hawaiian",
    price: 155000,
    image:
      "https://images.unsplash.com/photo-1671572579366-89bec1184f5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXdhaWlhbiUyMHBpenphJTIwcGluZWFwcGxlfGVufDF8fHx8MTc3MzY5MjgzNXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pizza",
    bestseller: false,
    discount: 15,
  },
  {
    id: 6,
    name: "Combo Family",
    price: 450000,
    image:
      "https://images.unsplash.com/photo-1572195577046-2f25894c06fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGRlbGl2ZXJ5JTIwZm9vZCUyMG9yZGVyfGVufDF8fHx8MTc3MzcxMTA1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pizza",
    bestseller: true,
    discount: 0,
  },
  {
    id: 7,
    name: "Spaghetti Bolognese",
    price: 135000,
    image:
      "https://images.unsplash.com/photo-1632739148811-2b53d07be26f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFnaGV0dGklMjBib2xvZ25lc2UlMjBwbGF0ZXxlbnwxfHx8fDE3NzM2Mzg5OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pasta",
    bestseller: true,
    discount: 0,
  },
  {
    id: 8,
    name: "Pasta Carbonara",
    price: 145000,
    image:
      "https://images.unsplash.com/photo-1655662844229-d2c2a81f09ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGNhcmJvbmFyYSUyMGl0YWxpYW58ZW58MXx8fHwxNzczNjU1MjkxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pasta",
    bestseller: false,
    discount: 0,
  },
  {
    id: 9,
    name: "Penne Arrabbiata",
    price: 125000,
    image:
      "https://images.unsplash.com/photo-1662478839788-7d2898ca66cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5uZSUyMHBhc3RhJTIwdG9tYXRvJTIwYmFzaWx8ZW58MXx8fHwxNzczNzEyNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "pasta",
    bestseller: false,
    discount: 0,
  },
  {
    id: 10,
    name: "Tiramisu",
    price: 75000,
    image:
      "https://images.unsplash.com/photo-1710106519622-8c49d0bcff2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJhbWlzdSUyMGl0YWxpYW4lMjBkZXNzZXJ0fGVufDF8fHx8MTc3MzY3MzIxMXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "dessert",
    bestseller: true,
    discount: 0,
  },
  {
    id: 11,
    name: "Chocolate Lava",
    price: 85000,
    image:
      "https://images.unsplash.com/photo-1673551490243-f29547426841?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBsYXZhJTIwY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzczNjIyOTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "dessert",
    bestseller: false,
    discount: 0,
  },
  {
    id: 12,
    name: "Garlic Bread",
    price: 55000,
    image:
      "https://images.unsplash.com/photo-1558679582-dac5f374f01c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJsaWMlMjBicmVhZCUyMGFwcGV0aXplcnxlbnwxfHx8fDE3NzM3MTI1NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "dessert",
    bestseller: false,
    discount: 0,
  },
  {
    id: 13,
    name: "Coca Cola",
    price: 25000,
    image:
      "https://images.unsplash.com/photo-1763297059500-5810c9142d2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xhJTIwc29mdCUyMGRyaW5rJTIwZ2xhc3MlMjBpY2V8ZW58MXx8fHwxNzczNzEyNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "drink",
    bestseller: false,
    discount: 0,
  },
  {
    id: 14,
    name: "Lemonade Đá",
    price: 35000,
    image:
      "https://images.unsplash.com/photo-1679934576534-72d79d027fdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2VkJTIwbGVtb25hZGUlMjBkcmluayUyMGZyZXNofGVufDF8fHx8MTc3MzcxMjU2MHww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "drink",
    bestseller: false,
    discount: 0,
  },
  { id: 15, name: "Nước cam tươi", price: 35000, image: "", category: "drink", bestseller: false, discount: 0 },
  { id: 16, name: "Khoai tây chiên", price: 45000, image: "", category: "dessert", bestseller: false, discount: 0 },
];

const tables = ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "T11", "T12"];

const deliveryStaff = ["Đỗ Quốc Bảo", "Hoàng Đức Em", "Nguyễn Văn Phát"];

const paymentOptions: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: "cash", label: "Tiền mặt", icon: <Banknote size={18} /> },
  { key: "bank_transfer", label: "Chuyển khoản", icon: <QrCode size={18} /> },
  { key: "card", label: "Thẻ", icon: <CreditCard size={18} /> },
  { key: "momo", label: "MoMo", icon: <Wallet size={18} /> },
];

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function getItemPrice(item: MenuItem) {
  return item.discount > 0 ? Math.round(item.price * (1 - item.discount / 100)) : item.price;
}

export default function POS() {
  const { user } = useEmployeeAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("store_delivery");
  const [selectedDeliveryStaff, setSelectedDeliveryStaff] = useState(deliveryStaff[0]);
  const [thirdPartyName, setThirdPartyName] = useState("GrabFood");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [editNoteIndex, setEditNoteIndex] = useState<number | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [posCollapsed, setPosCollapsed] = useState(false);

  const filteredMenu = useMemo(() => {
    let items = activeCategory === "all" ? menuItems : menuItems.filter(m => m.category === activeCategory);
    if (search) items = items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [activeCategory, search]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.menuItem.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { menuItem: item, qty: 1, note: "" }];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], qty: next[index].qty + delta };
      if (next[index].qty <= 0) next.splice(index, 1);
      return next;
    });
  };

  const removeItem = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const updateNote = (index: number, note: string) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], note };
      return next;
    });
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const subtotal = cart.reduce((s, c) => s + getItemPrice(c.menuItem) * c.qty, 0);
  const deliveryFee = orderType === "delivery" && subtotal < 200000 ? 25000 : 0;
  const total = subtotal + deliveryFee;
  const cashReceivedNum = parseInt(cashReceived) || 0;
  const change = paymentMethod === "cash" ? cashReceivedNum - total : 0;

  const canSubmit = () => {
    if (cart.length === 0) return false;
    if (orderType === "dine_in" && !tableNumber) return false;
    if (orderType === "delivery" && !customerPhone) return false;
    if (paymentMethod === "cash" && cashReceivedNum < total) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const orderId = `ORD-${1300 + Math.floor(Math.random() * 200)}`;
    setLastOrderId(orderId);
    setShowSuccess(true);
  };

  const resetOrder = () => {
    setCart([]);
    setOrderType("dine_in");
    setTableNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPaymentMethod("cash");
    setCashReceived("");
    setOrderNote("");
    setShowSuccess(false);
    setShowMobileCart(false);
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // Order panel content (reused for desktop sidebar and mobile overlay)
  const orderPanel = (
    <div className="flex flex-col h-full">
      {/* Order type tabs */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {[
            { key: "dine_in" as OrderType, label: "Tại chỗ", icon: <UtensilsCrossed size={14} /> },
            { key: "carry_out" as OrderType, label: "Mang đi", icon: <ShoppingBag size={14} /> },
            { key: "delivery" as OrderType, label: "Giao hàng", icon: <Truck size={14} /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setOrderType(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${orderType === t.key ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order type specific fields */}
      <div className="p-3 space-y-2 border-b border-border">
        {orderType === "dine_in" && (
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Số bàn *</label>
            <div className="grid grid-cols-6 gap-1.5">
              {tables.map(t => (
                <button
                  key={t}
                  onClick={() => setTableNumber(t)}
                  className={`py-1.5 rounded-lg text-xs transition-all ${tableNumber === t ? "bg-primary text-white" : "bg-muted text-foreground hover:bg-primary/10"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {(orderType === "carry_out" || orderType === "delivery") && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <User size={10} /> Tên KH
              </label>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Tên khách"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <Phone size={10} /> SĐT {orderType === "delivery" && "*"}
              </label>
              <input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {orderType === "delivery" && (
          <>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin size={10} /> Địa chỉ giao *
              </label>
              <input
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1">Phương thức giao</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryMethod("store_delivery")}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs transition-all ${deliveryMethod === "store_delivery" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Bike size={14} /> NV cửa hàng
                </button>
                <button
                  onClick={() => setDeliveryMethod("third_party")}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs transition-all ${deliveryMethod === "third_party" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Building2 size={14} /> Bên thứ 3
                </button>
              </div>
            </div>
            {deliveryMethod === "store_delivery" && (
              <div>
                <label className="text-[11px] text-muted-foreground mb-1">NV giao hàng</label>
                <select
                  value={selectedDeliveryStaff}
                  onChange={e => setSelectedDeliveryStaff(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm outline-none"
                >
                  {deliveryStaff.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {deliveryMethod === "third_party" && (
              <div>
                <label className="text-[11px] text-muted-foreground mb-1">Đối tác</label>
                <select
                  value={thirdPartyName}
                  onChange={e => setThirdPartyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm outline-none"
                >
                  <option>GrabFood</option>
                  <option>ShopeeFood</option>
                  <option>Baemin</option>
                  <option>GoFood</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 py-8">
            <ShoppingCart size={40} className="mb-2" />
            <p className="text-sm">Chưa có sản phẩm</p>
            <p className="text-xs">Chọn món từ menu bên trái</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, i) => {
              const price = getItemPrice(item.menuItem);
              return (
                <div key={item.menuItem.id} className="bg-muted/40 rounded-xl p-2.5 group">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.menuItem.image ? (
                        <Image fill src={item.menuItem.image} alt="" className="relative! w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Pizza size={16} className="text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs text-foreground truncate">{item.menuItem.name}</p>
                        <button
                          onClick={() => removeItem(i)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all p-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(i, -1)}
                            className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs w-5 text-center text-foreground">{item.qty}</span>
                          <button
                            onClick={() => updateQty(i, 1)}
                            className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-xs text-primary">{formatVND(price * item.qty)}</span>
                      </div>
                      {/* Item note */}
                      {editNoteIndex === i ? (
                        <div className="mt-1.5 flex gap-1">
                          <input
                            autoFocus
                            value={item.note}
                            onChange={e => updateNote(i, e.target.value)}
                            onBlur={() => setEditNoteIndex(null)}
                            onKeyDown={e => e.key === "Enter" && setEditNoteIndex(null)}
                            placeholder="Ghi chú món..."
                            className="flex-1 text-[11px] px-2 py-1 rounded border border-border bg-background outline-none focus:border-primary"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditNoteIndex(i)}
                          className="text-[10px] text-muted-foreground mt-1 hover:text-primary transition-colors"
                        >
                          {item.note ? `📝 ${item.note}` : "+ Ghi chú"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order note */}
      {cart.length > 0 && (
        <div className="px-3 pb-2">
          <input
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            placeholder="Ghi chú đơn hàng chung..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
          />
        </div>
      )}

      {/* Payment section */}
      {cart.length > 0 && (
        <div className="border-t border-border p-3 space-y-3">
          {/* Payment method */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">Thanh toán</label>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setPaymentMethod(opt.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all ${paymentMethod === opt.key ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash received input */}
          {paymentMethod === "cash" && (
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Tiền khách đưa</label>
              <input
                type="number"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                placeholder={formatVND(total)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary text-right"
              />
              <div className="flex gap-1.5 mt-1.5">
                {[
                  total,
                  Math.ceil(total / 50000) * 50000,
                  Math.ceil(total / 100000) * 100000,
                  Math.ceil(total / 200000) * 200000,
                  500000,
                ]
                  .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                  .slice(0, 4)
                  .map(v => (
                    <button
                      key={v}
                      onClick={() => setCashReceived(v.toString())}
                      className={`flex-1 py-1 text-[10px] rounded-md transition-all ${cashReceived === v.toString() ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-primary/10"}`}
                    >
                      {v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {paymentMethod === "bank_transfer" && (
            <div className="bg-blue-50 rounded-lg p-2.5 text-center">
              <QrCode size={48} className="mx-auto text-gray-600 mb-1" />
              <p className="text-[10px] text-blue-700">STK: 1234567890 - VCB</p>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span className="text-xs">Tạm tính ({cartCount} sản phẩm)</span>
              <span className="text-xs">{formatVND(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="text-xs">Phí giao hàng</span>
                <span className="text-xs">{formatVND(deliveryFee)}</span>
              </div>
            )}
            {deliveryFee === 0 && orderType === "delivery" && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Phí giao hàng</span>
                <span className="text-xs text-green-600">Miễn phí</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-border">
              <span className="text-foreground">Tổng cộng</span>
              <span className="text-primary text-lg">{formatVND(total)}</span>
            </div>
            {paymentMethod === "cash" && cashReceivedNum > 0 && cashReceivedNum >= total && (
              <div className="flex justify-between text-green-600">
                <span className="text-xs">Tiền thừa</span>
                <span className="text-xs">{formatVND(change)}</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <Receipt size={16} /> Tạo đơn hàng
          </button>
        </div>
      )}
    </div>
  );

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={52} className="text-green-600" />
          </div>
          <h2 className="text-2xl text-foreground mb-2">Đơn hàng đã tạo!</h2>
          <p className="text-lg text-primary mb-1">{lastOrderId}</p>
          <div className="bg-card rounded-2xl border border-border p-5 mt-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Loại đơn:</span>
              <span className="text-foreground">
                {orderType === "dine_in" ? `Tại chỗ - ${tableNumber}` : orderType === "carry_out" ? "Mang đi" : "Giao hàng"}
              </span>
            </div>
            {customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Khách hàng:</span>
                <span className="text-foreground">{customerName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Thanh toán:</span>
              <span className="text-foreground">{paymentOptions.find(p => p.key === paymentMethod)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số món:</span>
              <span className="text-foreground">{cartCount}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-foreground">Tổng tiền:</span>
              <span className="text-primary text-lg">{formatVND(total)}</span>
            </div>
            {paymentMethod === "cash" && change > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiền thừa:</span>
                <span className="text-green-600">{formatVND(change)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm">
              <Printer size={16} /> In hóa đơn
            </button>
            <button
              onClick={resetOrder}
              className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Đơn mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background flex">
      {/* Left Sidebar - Navigation & Categories */}
      <div
        className={`hidden md:flex bg-sidebar flex-col shrink-0 border-r border-sidebar-border transition-all duration-300 ${posCollapsed ? "w-[72px]" : "w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Pizza size={22} className="text-white" />
          </div>
          {!posCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-white truncate">PaoPizza</h2>
              <p className="text-sidebar-foreground/60 text-xs truncate">POS Bán hàng</p>
            </div>
          )}
        </div>

        {/* Category nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeCategory === cat.key
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
              } ${posCollapsed ? "justify-center" : ""}`}
            >
              <span className="shrink-0">{cat.icon}</span>
              {!posCollapsed && <span className="text-sm truncate">{cat.label}</span>}
            </button>
          ))}
        </nav>

        {/* Back to dashboard button */}
        <div className="px-3 pb-2">
          <Link
            href="/is/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 bg-sidebar-accent/50 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white ${posCollapsed ? "justify-center" : ""}`}
          >
            <span className="shrink-0">
              <ArrowLeft size={20} />
            </span>
            {!posCollapsed && <span className="text-sm truncate">Quay lại Dashboard</span>}
          </Link>
        </div>

        {/* User info */}
        <div className="border-t border-sidebar-border p-4">
          <div className={`flex items-center ${posCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary text-sm">{user?.name?.charAt(0)}</span>
            </div>
            {!posCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{user?.name}</p>
                {user && (
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setPosCollapsed(!posCollapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-white transition-colors"
        >
          {posCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Center: Menu area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
          {/* Mobile menu button */}
          <button onClick={() => setActiveCategory(activeCategory)} className="md:hidden p-2 rounded-lg bg-sidebar text-white">
            <Pizza size={16} />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <h3 className="text-foreground text-sm">POS PaoPizza</h3>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
              <Clock size={9} /> {timeStr}
            </span>
          </div>
          {/* Mobile: category chips */}
          <div className="md:hidden flex gap-1.5 overflow-x-auto flex-1 mx-2">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] whitespace-nowrap transition-all ${activeCategory === cat.key ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm món..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
            />
          </div>
          {/* Mobile cart toggle */}
          <button onClick={() => setShowMobileCart(true)} className="lg:hidden relative p-2 rounded-lg bg-primary text-white">
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredMenu.map(item => {
              const inCart = cart.find(c => c.menuItem.id === item.id);
              const price = getItemPrice(item);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all text-left group relative ${inCart ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {item.image ? (
                      <Image fill src={item.image} alt={item.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Pizza size={28} className="text-muted-foreground/20" />
                      </div>
                    )}
                    {item.bestseller && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-primary text-white text-[9px] rounded-full flex items-center gap-0.5">
                        <Star size={8} className="fill-white" /> Hot
                      </span>
                    )}
                    {item.discount > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full">
                        -{item.discount}%
                      </span>
                    )}
                    {inCart && (
                      <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center shadow-lg">
                        {inCart.qty}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.discount > 0 && (
                        <span className="text-[10px] text-muted-foreground line-through">{formatVND(item.price)}</span>
                      )}
                      <span className="text-xs text-primary">{formatVND(price)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredMenu.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
              <Search size={40} className="mb-2" />
              <p className="text-sm">Không tìm thấy sản phẩm</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Order panel - Desktop */}
      <div className="hidden lg:flex w-[380px] border-l border-border bg-card flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-foreground text-sm flex items-center gap-2">
            <Receipt size={16} className="text-primary" /> Đơn hàng mới
          </h3>
          <span className="text-[11px] text-muted-foreground">{cartCount} món</span>
        </div>
        {orderPanel}
      </div>

      {/* Right: Order panel - Mobile overlay */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setShowMobileCart(false)}>
          <div className="w-full max-w-md h-full bg-card flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-foreground text-sm flex items-center gap-2">
                <Receipt size={16} className="text-primary" /> Đơn hàng mới
              </h3>
              <button onClick={() => setShowMobileCart(false)} className="p-2 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            {orderPanel}
          </div>
        </div>
      )}
    </div>
  );
}
