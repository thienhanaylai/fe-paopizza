"use client";
import { useState, useMemo, useEffect, use, useRef } from "react";
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
import { getAllCategories } from "@/src/services/category.service";
import { getAllProducts } from "@/src/services/product.service";
import { toast } from "sonner";
import { createOrder, createPosOrder, PosOrder } from "@/src/services/order.service";
import { checkPaymentStatus } from "@/src/services/payment.service";

type MenuCategory = "all" | "pizza" | "pasta" | "dessert" | "drink";
type OrderType = "dine_in" | "carry_out" | "delivery";
type DeliveryMethod = "store_delivery" | "third_party";
type PaymentMethod = "cash" | "qrCode" | "card" | "momo";

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

interface Product {
  _id: string;
  category: ProductCategory;
  name: string;
  description: string;
  is_active: boolean;
  variants: ProductVariant[];
  isDeleted: boolean;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  size: string;
  sku: string;
  quantity: number;
  note: string;
  image: string;
}

const tables = ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "T11", "T12"];

const deliveryStaff = ["Đỗ Quốc Bảo", "Hoàng Đức Em", "Nguyễn Văn Phát"];

const paymentOptions: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: "cash", label: "Tiền mặt", icon: <Banknote size={18} /> },
  { key: "qrCode", label: "Chuyển khoản", icon: <QrCode size={18} /> },
  // { key: "card", label: "Thẻ", icon: <CreditCard size={18} /> },
  // { key: "momo", label: "MoMo", icon: <Wallet size={18} /> },
];

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft === null) return null;

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div>
      <p>Thời gian thanh toán còn lại: </p>
      <p className="text-red-500 text-center">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </p>
    </div>
  );
}

export default function POS() {
  const { user, getInfo } = useEmployeeAuth();
  const [search, setSearch] = useState("");

  const [orderType, setOrderType] = useState<OrderType>("dine_in");

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
  const [posCollapsed, setPosCollapsed] = useState(true);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [contactModal, setContactModal] = useState(false);
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hideTable, setHideTable] = useState(true);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [order, setOder] = useState();
  const [testtime, setTestime] = useState<Date>();

  const pollingRef = useRef(null);
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = (orderId: string) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(orderId);

        if (res.data.paymentStatus === "success") {
          stopPolling();
          resetOrder();
          setShowSuccess(true);
        }
      } catch (err) {
        console.error("Lỗi khi check status:", err);
      }
    }, 3000);
  };

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

  const filteredMenu = useMemo(() => {
    let items = activeCategory === "all" ? products : products.filter(m => m?.category.slug === activeCategory);
    if (search) items = items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [products, activeCategory, search]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.sku === item.sku);

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1, note: "" }];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: next[index].quantity + delta };
      if (next[index].quantity <= 0) next.splice(index, 1);
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

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
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

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    try {
      const emp = await getInfo();
      const listItem: CartItem[] = cart;
      console.log(emp);
      const order: PosOrder = {
        order_type: orderType,
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
        contact_info: {
          full_name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        store_id: emp.ref_id.store_id,
        note: "",
        customer_id: null,
        employee_id: emp._id,
        items: listItem,
      };
      const result = await createPosOrder(order, "");
      const res = result.data;
      const payment = result.payment;
      if (res.paymentMethod != "cash" && res.paymentStatus != "success") {
        setTestime(new Date(Date.now() + 5 * 60 * 1000));
        startPolling(payment.orderId);
        setOder(result);
      }
      if (res.paymentMethod === "cash") {
        await createPosOrder(order, "");
        setShowSuccess(true);
      }
    } catch (error) {
      toast.error("Có lỗi!");
    }
  };
  console.log(order);
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
    setContactModal(false);
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  // Order panel content (reused for desktop sidebar and mobile overlay)
  const orderPanel = (
    <div className="flex flex-col h-[95vh] max-h-screen">
      {/* Order type tabs */}
      <div className="p-2 border-b border-border">
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
      <div className="p-2 space-y-2 border-b border-border">
        {orderType === "dine_in" && (
          <div>
            <div className="flex justify-between px-1">
              <label className="text-[11px] text-muted-foreground mb-1 block">Số bàn *</label>
              <button onClick={() => setHideTable(!hideTable)}>
                <ChevronDown />
              </button>
            </div>
            {!hideTable && (
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
            )}
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
              return (
                <div key={item.sku} className="bg-muted/40 rounded-xl p-2.5 group">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.image ? (
                        <Image fill src={item.image} alt={item.sku} className="relative! w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Pizza size={16} className="text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs text-foreground truncate">{item.name}</p>
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
                          <span className="text-xs w-5 text-center text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(i, 1)}
                            className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
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
                        <span className="text-xs text-primary">{formatVND(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order note
      {cart.length > 0 && (
        
      )} */}

      {/* Payment section */}
      {cart.length > 0 && (
        <div className="shrink-0 bg-white bottom-0 border-t border-border p-3 space-y-3">
          {/* Payment method */}
          <div>
            <div className="px-3 pb-2">
              <input
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                placeholder="Ghi chú đơn hàng chung..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
              />
            </div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">Thanh toán</label>
            <div className="grid grid-cols-2 gap-1.5">
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
            onClick={() => {
              setContactModal(true);
            }}
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
        <div className="text-center w-[80vh] mx-auto p-8">
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
        className={`hidden md:flex bg-white flex-col shrink-0 shadow-xl border-sidebar-border transition-all duration-300 ${posCollapsed ? "w-[72px]" : "w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-300">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Pizza size={22} className="text-white" />
          </div>
          {!posCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-black truncate">PaoPizza</h2>
              <p className="text-black text-xs truncate">POS Bán hàng</p>
            </div>
          )}
        </div>

        {/* Category nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeCategory === cat.slug ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
            >
              <Image src={cat.icon || ""} width={18} height={18} alt={cat.name} />
              {!posCollapsed && <span className="text-sm truncate text-gray-800">{cat.name}</span>}
            </button>
          ))}
        </nav>

        {/* Back to dashboard button */}
        <div className="px-3 pb-2">
          <Link
            href="/is/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-border hover:border-primary hover:text-white ${posCollapsed ? "justify-center" : ""}`}
          >
            <span className="shrink-0">
              <ArrowLeft size={20} className="text-black" />
            </span>
            {!posCollapsed && <span className="text-sm text-black truncate">Quay lại Dashboard</span>}
          </Link>
        </div>

        {/* User info */}
        <div className="border-t border-gray-300 p-4">
          <div className={`flex items-center ${posCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary text-sm">{user?.name?.charAt(0)}</span>
            </div>
            {!posCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-black text-sm truncate">{user?.name}</p>
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
          className="hidden lg:flex items-center justify-center py-3 border-t border-gray-300 text-black hover:text-primary transition-colors"
        >
          {posCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Center: Menu area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
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
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] whitespace-nowrap transition-all ${activeCategory === cat.slug ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              >
                <Image src={cat.icon || ""} width={18} height={18} alt={cat.name} /> {cat.name}
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
              return item.variants.map(prd => {
                return (
                  <button
                    key={prd.sku}
                    onClick={() => {
                      const itemCart: CartItem = {
                        product_id: item._id,
                        name: item.name,
                        note: "",
                        price: prd.price,
                        quantity: 1,
                        size: prd.size,
                        sku: prd.sku,
                        image: prd.image.url,
                      };
                      addToCart(itemCart);
                    }}
                    className={`bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all text-left group relative `}
                  >
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {prd.image.url ? (
                        <Image
                          fill
                          loading="eager"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          src={prd?.image.url}
                          alt={item.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Pizza size={28} className="text-muted-foreground/20" />
                        </div>
                      )}

                      {/* {inCart && (
                        <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center shadow-lg">
                          {inCart.qty}
                        </div>
                      )} */}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs text-foreground truncate">
                        {item.name} - {prd.size}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-primary">{formatVND(prd?.price)}</span>
                      </div>
                    </div>
                  </button>
                );
              });
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
      {contactModal && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setContactModal(false)}
          >
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-foreground text-xl font-semibold">
                    {order?.payment ? "Quét mã để thanht toán" : "Nhập thông tin khách hàng"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setContactModal(false);
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              {order?.payment ? (
                <>
                  <div className="space-y-4 flex flex-col items-center">
                    <Image
                      src={order?.payment.qrUrl || ""}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      alt="qr"
                      className="relative! w-[50%]!"
                    />
                    <p>Mã đơn hàng: {order.data?._id}</p>
                    <CountdownTimer
                      expiresAt={testtime}
                      onExpire={() => {
                        stopPolling();
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1.5 font-medium">Họ tên *</label>
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium">Số điện thoại *</label>
                    <input
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      required
                      placeholder="09xxxxxxx"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium">Địa chỉ</label>
                    <input
                      placeholder="42 pham nhu tang"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  {paymentMethod === "qrCode" ? (
                    <button
                      onClick={() => {
                        handleSubmit();
                      }}
                      className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <Receipt size={16} /> Tạo mã thanh toán
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubmit()}
                      className="w-full py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <Receipt size={16} /> Tạo đơn hàng
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
