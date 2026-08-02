"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Banknote,
  QrCode,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Pizza,
  Receipt,
  Printer,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { getRoleLabel, getRoleColor, useEmployeeAuth } from "@/src/context/authEmployeeContext";
import Link from "next/link";
import Image from "next/image";
import { getAllCategories } from "@/src/services/category.service";
import { getAllProducts } from "@/src/services/product.service";
import { toast, Toaster } from "sonner";
import { cancelOrder, createPosOrder, PosOrder, PaymentMethod, type OrderItem } from "@/src/services/order.service";
import { checkPaymentStatus } from "@/src/services/payment.service";
import { formatVND } from "@/src/utils/formatVND";
import { generateInvoicePDF, type InvoiceData, type InvoiceItem } from "@/src/utils/generateInvoicePDF";
import { getAllStore, type StoreData } from "@/src/services/store.service";
import { http } from "@/src/utils/config.api";
import type {
  ComboRule,
  ProductCategory,
  ProductImage,
  Ingredient,
  RecipeIngredient,
  ProductVariant,
  Product,
} from "@/src/services/menu.service";

type OrderType = "dine_in" | "carry_out" | "delivery";

type MenuCategoryUI = {
  slug: string;
  name: string;
  icon: string;
};

type MenuTab = "all" | "products" | "combos";

export type { ProductCategory, ProductImage, Ingredient, RecipeIngredient, ProductVariant };
export type { Product };

interface CartItem {
  item_type: "product" | "combo";
  product_id?: string;
  combo_id?: string;
  name: string;
  price: number;
  size?: string;
  crust?: string;
  sku: string;
  quantity: number;
  note: string;
  image: string;
  combo_selections?: ComboSlotSelection[];
}

type ComboSlotSelection = {
  productId: string;
  sku: string;
  size: string;
  crust?: string;
};

/** Combo from store menu */
interface ComboDisplay {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  rules: ComboRule[];
}

const parseCrustOptions = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return Array.from(new Set(value.flatMap(item => parseCrustOptions(item))));
  const raw = value.trim();
  if (!raw) return [];
  const splitByDelimiter = raw
    .split(/[\s,|/;]+/)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
  if (splitByDelimiter.length > 1) return Array.from(new Set(splitByDelimiter));
  return [raw];
};

const tables = ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "T11", "T12"];

const paymentOptions: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: "cash", label: "Tiền mặt", icon: <Banknote size={18} /> },
  { key: "qrCode", label: "Chuyển khoản", icon: <QrCode size={18} /> },
  // { key: "card", label: "Thẻ", icon: <CreditCard size={18} /> },
  // { key: "ewallet", label: "Ví điện tử", icon: <Wallet size={18} /> },
];

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [editNoteIndex, setEditNoteIndex] = useState<number | null>(null);
  const [posCollapsed, setPosCollapsed] = useState(true);

  // Combo selection modal state
  const [selectedCombo, setSelectedCombo] = useState<ComboDisplay | null>(null);
  const [comboSelections, setComboSelections] = useState<Record<number, ComboSlotSelection[]>>({});
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<MenuTab>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<ComboDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactModal, setContactModal] = useState(false);
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Track selected crust per product-size key: "productId-size"
  const [selectedCrustMap, setSelectedCrustMap] = useState<Record<string, string>>({});
  const [hideTable, setHideTable] = useState(true);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [order, setOder] = useState();
  const [testtime, setTestime] = useState<Date>();
  const [storeInfo, setStoreInfo] = useState<StoreData | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const pollingRef = useRef(null);
  const comboCounterRef = useRef(0);
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
        setIsLoading(true);
        const { data: categories } = await getAllCategories();
        const { data: products } = await getAllProducts();

        const mappedCategories: MenuCategoryUI[] = categories
          .filter(cat => cat.isActive && !cat.isDeleted)
          .map(cat => ({
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
        setProducts(products);

        // Also fetch store-specific menu for combos & store-filtered products
        const storeId = user?.store_id;
        if (storeId) {
          try {
            const menuData = await http(`/api/v1/menus/store/${storeId}`, { next: { revalidate: 3600 } });
            const menu = menuData?.data ?? menuData;
            if (menu?.products) setProducts(menu.products);
            // Store products separately for combo selection
            if (menu?.products) setMenuProducts(menu.products);
            if (menu?.combos) {
              const mapped: ComboDisplay[] = menu.combos.map((entry: any) => {
                const c = entry.combo ?? entry;
                return {
                  _id: c._id ?? entry._id,
                  name: c.name ?? "",
                  description: c.description,
                  image: c.image,
                  price: c.price ?? 0,
                  rules: Array.isArray(c.rules) ? c.rules : [],
                };
              });
              setCombos(mapped);
            }
          } catch {
            /* keep fallback products if menu fails */
          }
        }
      } catch (error) {
        return;
      } finally {
        setIsLoading(false);
      }
    };
    fectData();
  }, [user?.store_id]);

  const filteredMenu = useMemo(() => {
    if (activeTab === "combos" || activeCategory === "combo") return [];
    let items = activeCategory === "all" ? products : products.filter(m => m?.category.slug === activeCategory);
    if (search) items = items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    // Sort by category order in sidebar
    const catOrderMap = new Map(categories.map((cat, idx) => [cat.slug, idx]));
    items = [...items].sort((a, b) => {
      const orderA = catOrderMap.get(a.category?.slug) ?? Infinity;
      const orderB = catOrderMap.get(b.category?.slug) ?? Infinity;
      return orderA - orderB;
    });
    return items;
  }, [products, activeCategory, search, activeTab, categories]);

  const filteredCombos = useMemo(() => {
    if (activeTab === "products") return [];
    let items = activeCategory === "combo" || activeCategory === "all" ? combos : [];
    if (activeCategory !== "all" && activeCategory !== "combo") items = [];
    if (search) items = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [combos, search, activeCategory, activeTab]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // For combos, match by combo_id AND combo_selections
      if (item.item_type === "combo" && item.combo_selections) {
        const idx = prev.findIndex(
          c =>
            c.item_type === "combo" &&
            c.combo_id === item.combo_id &&
            areComboSelectionsEqualPos(c.combo_selections, item.combo_selections),
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        return [...prev, { ...item, quantity: 1, note: "" }];
      }
      const idx = prev.findIndex(c => c.sku === item.sku);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1, note: "" }];
    });
  };

  // Helper chọn combo
  const areComboSelectionsEqualPos = (a?: ComboSlotSelection[], b?: ComboSlotSelection[]): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const aSkus = [...a.map(s => s.sku)].sort();
    const bSkus = [...b.map(s => s.sku)].sort();
    return aSkus.every((sku, i) => sku === bSkus[i]);
  };

  const getProductsForRule = (rule: ComboRule): Product[] => {
    if (!menuProducts.length) return [];
    let filtered: Product[];

    if (rule.applicableProducts && rule.applicableProducts.length > 0) {
      filtered = menuProducts.filter(p => rule.applicableProducts.includes(p._id));
    } else {
      const categoryIds = rule.applicableCategories.map(cat => (typeof cat === "string" ? cat : cat._id || cat.slug));
      filtered = menuProducts.filter(p => categoryIds.includes(p.category?._id) || categoryIds.includes(p.category?.slug));
    }
    // Filter to only products that have at least one variant matching applicableSizes
    if (rule.applicableSizes && rule.applicableSizes.length > 0) {
      filtered = filtered.filter(p => p.variants.some(v => rule.applicableSizes.includes(v.size)));
    }

    return filtered;
  };

  const handleOpenCombo = (combo: ComboDisplay) => {
    setSelectedCombo(combo);
    setComboSelections({});
  };

  const handleSelectComboProduct = (ruleIndex: number, sku: string) => {
    const product = menuProducts.find(p => p.variants.some(v => v.sku === sku));
    const rule = selectedCombo?.rules[ruleIndex];
    const variant = product?.variants.find(v => v.sku === sku) || product?.variants[0];
    if (!variant || !product) return;

    const selection: ComboSlotSelection = {
      productId: product._id,
      sku: variant.sku,
      size: variant.size,
      crust: parseCrustOptions(variant.crust)[0] || undefined,
    };

    setComboSelections(prev => {
      const current = prev[ruleIndex] || [];
      const requiredQty = rule?.requiredQuantity || 1;
      // Còn slot trống → thêm slot mới (cho phép chọn cùng sản phẩm nhiều lần)
      if (current.length < requiredQty) {
        return { ...prev, [ruleIndex]: [...current, selection] };
      }
      // Đã đủ số lượng → thay thế phần tử đầu tiên
      const next = [...current];
      next.shift();
      return { ...prev, [ruleIndex]: [...next, selection] };
    });
  };

  const handleChangeComboVariant = (
    ruleIndex: number,
    slotIdx: number,
    productId: string,
    newSku: string,
    newSize: string,
    newCrust?: string,
  ) => {
    setComboSelections(prev => {
      const current = [...(prev[ruleIndex] || [])];
      if (slotIdx >= 0 && slotIdx < current.length && current[slotIdx]?.productId === productId) {
        current[slotIdx] = { productId, sku: newSku, size: newSize, crust: newCrust };
      } else {
        // Fallback: tìm theo productId
        const idx = current.findIndex(s => s.productId === productId);
        if (idx >= 0) {
          current[idx] = { productId, sku: newSku, size: newSize, crust: newCrust };
        }
      }
      return { ...prev, [ruleIndex]: current };
    });
  };

  /** Get variants for a product that match the rule's applicableSizes */
  const getVariantsForRule = (product: Product, rule: ComboRule): ProductVariant[] => {
    if (!rule.applicableSizes || rule.applicableSizes.length === 0) return product.variants;
    return product.variants.filter(v => rule.applicableSizes.includes(v.size));
  };

  const allComboSelectionsFilled = useMemo(() => {
    if (!selectedCombo) return false;
    return selectedCombo.rules.every((rule, idx) => {
      const selected = comboSelections[idx] || [];
      return selected.length >= rule.requiredQuantity;
    });
  }, [selectedCombo, comboSelections]);

  const handleAddComboToCart = () => {
    if (!selectedCombo || !allComboSelectionsFilled) return;
    comboCounterRef.current += 1;
    const allSelections: ComboSlotSelection[] = [];
    selectedCombo.rules.forEach((_rule, idx) => {
      (comboSelections[idx] || []).forEach(sel => allSelections.push(sel));
    });
    addToCart({
      item_type: "combo",
      combo_id: selectedCombo._id,
      name: selectedCombo.name,
      price: selectedCombo.price,
      sku: `combo-${selectedCombo._id}-${comboCounterRef.current}`,
      quantity: 1,
      note: "",
      image: selectedCombo.image ?? "",
      combo_selections: allSelections,
    });
    setSelectedCombo(null);
    setComboSelections({});
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
    if (paymentMethod === "cash" && cashReceivedNum < total) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    try {
      const emp = await getInfo();
      if (!emp?.ref_id?.store_id || !emp?._id) {
        toast.error("Không thể xác thực nhân viên, vui lòng đăng nhập lại");
        return;
      }
      const listItem: OrderItem[] = cart.map(item => {
        if (item.item_type === "combo") {
          return {
            item_type: "combo",
            combo_id: item.combo_id,
            sku: item.sku,
            price: item.price,
            size: "",
            quantity: item.quantity,
            note: item.note,
            combo_selections: item.combo_selections?.map(sel => ({
              product_id: sel.productId,
              sku: sel.sku,
              size: sel.size,
              crust: sel.crust,
            })),
          };
        }
        return {
          item_type: "product",
          product_id: item.product_id,
          sku: item.sku,
          price: item.price,
          size: item.size ?? "",
          crust: item.crust,
          quantity: item.quantity,
          note: item.note,
        };
      });

      const order: PosOrder = {
        orderType: orderType,
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
        contact_info: {
          full_name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        store_id: emp.ref_id.store_id,
        note: `${tableNumber} ${orderNote != "" ? `- ${orderNote}` : ``}`,
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
        setLastOrderId(result.data._id);
      }
      if (res.paymentMethod === "cash") {
        setLastOrderId(result.data._id);
        setShowSuccess(true);
      }
    } catch (error) {
      toast.error("Có lỗi!");
    }
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
    setContactModal(false);
  };

  // Fetch store info for invoice
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const storeId = user?.store_id;
        if (storeId) {
          const { data: stores } = await getAllStore();
          const matched = (stores as StoreData[]).find((s: StoreData) => s._id === storeId);
          if (matched) setStoreInfo(matched);
        }
      } catch {
        // store info is optional for invoice
      }
    };
    fetchStoreInfo();
  }, [user?.store_id]);

  const handlePrintInvoice = async () => {
    setIsPrinting(true);
    try {
      const invoiceItems: InvoiceItem[] = cart.map(item => ({
        name: item.name,
        size: item.size,
        crust: item.crust,
        quantity: item.quantity,
        price: item.price,
        note: item.note || undefined,
        isCombo: item.item_type === "combo",
        comboSelections: item.combo_selections?.map(sel => {
          const selProduct = menuProducts.find(p => p._id === sel.productId);
          return {
            name: selProduct?.name || sel.productId,
            size: sel.size,
            crust: sel.crust,
          };
        }),
      }));

      const paymentLabel = paymentOptions.find(p => p.key === paymentMethod)?.label || paymentMethod;
      const storeAddress = storeInfo
        ? `${storeInfo.address.streetNumber}, ${storeInfo.address.district}, ${storeInfo.address.city}`
        : undefined;

      const invoiceData: InvoiceData = {
        orderId: lastOrderId,
        orderType,
        tableNumber: orderType === "dine_in" ? tableNumber : undefined,
        paymentMethod: paymentLabel,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerAddress: orderType === "delivery" ? customerAddress : undefined,
        items: invoiceItems,
        subtotal,
        deliveryFee: orderType === "delivery" && subtotal < 200000 ? 25000 : 0,
        total,
        cashReceived: paymentMethod === "cash" ? cashReceivedNum : undefined,
        change: paymentMethod === "cash" && change > 0 ? change : undefined,
        storeName: storeInfo?.name,
        storeAddress,
        storePhone: storeInfo?.phone,
        employeeName: user?.name,
        note: orderNote || undefined,
      };

      await generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Không thể tạo hóa đơn PDF");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCancelOrder = async (order_id: string) => {
    try {
      const res = await cancelOrder(order_id, "");
      if (res) {
        toast.success(`Đã huỷ đơn hàng`);
        setOder(undefined);
        resetOrder();
      }
    } catch (error) {
      toast.error(`Lỗi: ${error}`);
    }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const orderPanel = (
    <div className="flex flex-col h-[95vh] max-h-screen">
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
      <div className={`space-y-2 border-b border-border ${orderType === "dine_in" ? "p-2" : "hidden"}`}>
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
      </div>

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
                        <div className="min-w-0">
                          <p className="text-xs text-foreground truncate flex items-center gap-1">
                            {item.name}{" "}
                            {item.item_type === "product" ? `- ${item.size}${item.crust ? ` (${item.crust})` : ""}` : ""}
                            {item.item_type === "combo" && (
                              <span className="px-1 py-0.5 bg-orange-500 text-white text-[9px] font-semibold rounded-full shrink-0">
                                COMBO
                              </span>
                            )}
                          </p>
                          {item.item_type === "combo" && item.combo_selections && item.combo_selections.length > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {item.combo_selections.map((sel, si) => {
                                const selProduct = menuProducts.find(p => p._id === sel.productId);
                                return (
                                  <p key={si} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                    {selProduct?.name || sel.productId} - {sel.size}
                                    {sel.crust ? ` - ${sel.crust}` : ""}
                                  </p>
                                );
                              })}
                            </div>
                          )}
                        </div>
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
                            {item.note ? `${item.note}` : "+ Ghi chú"}
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

      {cart.length > 0 && (
        <div className="shrink-0 bg-white bottom-0 border-t border-border p-3 space-y-3">
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
            <button
              onClick={handlePrintInvoice}
              disabled={isPrinting}
              className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              {isPrinting ? "Đang in..." : "In hóa đơn"}
            </button>
            <button
              onClick={() => resetOrder()}
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
      <div
        className={`hidden md:flex bg-white flex-col shrink-0 shadow-xl border-sidebar-border transition-all duration-300 ${posCollapsed ? "w-[72px]" : "w-64"}`}
      >
        <div className="flex items-center gap-3 px-4 py-2 h-[62px] border-b border-gray-300">
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

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => {
                setActiveCategory(cat.slug);
                if (cat.slug === "combo") {
                  setActiveTab("combos");
                } else {
                  setActiveTab("all");
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeCategory === cat.slug ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
            >
              <Image src={cat.icon || ""} width={18} height={18} alt={cat.name} />
              {!posCollapsed && <span className="text-sm truncate text-gray-800">{cat.name}</span>}
            </button>
          ))}
        </nav>

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

        <button
          onClick={() => setPosCollapsed(!posCollapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-gray-300 text-black hover:text-primary transition-colors"
        >
          {posCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 ">
        <div className="flex items-center h-[62px] justify-between gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
          <div className="hidden md:flex items-center gap-2">
            <h3 className="text-foreground text-sm">POS PaoPizza</h3>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
              <Clock size={9} /> {timeStr}
            </span>
          </div>

          {/* Tab: All | Món ăn | Combo */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {[
              { key: "all" as MenuTab, label: "Tất cả" },
              { key: "products" as MenuTab, label: "Món ăn" },
              { key: "combos" as MenuTab, label: "Combo" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key);
                  setActiveCategory("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === t.key ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading Skeleton */}
          {isLoading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border overflow-hidden">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Sản phẩm */}
              {activeTab !== "combos" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mb-4">
                  {filteredMenu.map(item => {
                    // Is this a pizza product?
                    const isPizza = item.category?.slug?.toLowerCase().includes("pizza");
                    // Group variants by size – for each size, pick the first variant as display representative
                    const sizeGroups = new Map<string, ProductVariant[]>();
                    item.variants.forEach(v => {
                      const list = sizeGroups.get(v.size) || [];
                      list.push(v);
                      sizeGroups.set(v.size, list);
                    });

                    return Array.from(sizeGroups.entries()).map(([size, variants]) => {
                      const displayVariant = variants[0];
                      const sizeKey = `${item._id}-${size}`;
                      // Collect all unique crust options for this size (for pizza products)
                      const allCrusts = isPizza
                        ? Array.from(new Set(variants.flatMap(v => parseCrustOptions(v.crust)).filter(Boolean)))
                        : [];
                      const selectedCrust = selectedCrustMap[sizeKey] || allCrusts[0] || "";

                      // Find the variant matching selected crust
                      const matchedVariant =
                        isPizza && selectedCrust
                          ? variants.find(v => parseCrustOptions(v.crust).includes(selectedCrust)) || displayVariant
                          : displayVariant;

                      // Format crust label helper
                      const formatCrustLabelPos = (value: string) =>
                        value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

                      return (
                        <div
                          key={`${item._id}-${size}`}
                          className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all text-left group relative"
                        >
                          {/* Image */}
                          <div className="aspect-[4/3] bg-white relative overflow-hidden">
                            {displayVariant.image.url ? (
                              <Image
                                fill
                                loading="eager"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                src={displayVariant.image.url}
                                alt={item.name}
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Pizza size={28} className="text-muted-foreground/20" />
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-2.5">
                            <p className="text-xs text-foreground truncate">
                              {item.name} - {size}
                              {isPizza && selectedCrust ? ` (${formatCrustLabelPos(selectedCrust)})` : ""}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs text-primary">{formatVND(matchedVariant.price)}</span>
                            </div>

                            {/* Crust selector for pizza */}
                            {isPizza && allCrusts.length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-2" onClick={e => e.stopPropagation()}>
                                {allCrusts.map(crust => {
                                  const isActive = crust === selectedCrust;
                                  return (
                                    <button
                                      key={crust}
                                      type="button"
                                      onClick={() => setSelectedCrustMap(prev => ({ ...prev, [sizeKey]: crust }))}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                        isActive
                                          ? "bg-gray-800 text-white shadow-sm"
                                          : "bg-muted text-muted-foreground hover:bg-gray-200"
                                      }`}
                                    >
                                      {formatCrustLabelPos(crust)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Add to cart button */}
                          <button
                            type="button"
                            onClick={() => {
                              const itemCart: CartItem = {
                                item_type: "product",
                                product_id: item._id,
                                name: item.name,
                                note: "",
                                price: matchedVariant.price,
                                quantity: 1,
                                size: size,
                                crust: isPizza ? selectedCrust : undefined,
                                sku: matchedVariant.sku,
                                image: displayVariant.image.url,
                              };
                              addToCart(itemCart);
                            }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      );
                    });
                  })}
                </div>
              )}

              {/* Combos */}
              {activeTab !== "products" && filteredCombos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mb-4">
                  {filteredCombos.map(combo => (
                    <button
                      key={combo._id}
                      onClick={() => handleOpenCombo(combo)}
                      className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all text-left group relative"
                    >
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {combo.image ? (
                          <Image
                            fill
                            loading="eager"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            src={combo.image}
                            alt={combo.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Pizza size={28} className="text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs text-foreground truncate">{combo.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-primary">{formatVND(combo.price)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredMenu.length === 0 && filteredCombos.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                  <Search size={40} className="mb-2" />
                  <p className="text-sm">Không tìm thấy sản phẩm</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:flex w-[380px] border-l border-border bg-card flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 h-[62px] border-b border-border">
          <h3 className="text-foreground text-sm flex items-center gap-2">
            <Receipt size={16} className="text-primary" /> Đơn hàng mới
          </h3>
          <span className="text-[11px] text-muted-foreground">{cartCount} món</span>
        </div>
        {orderPanel}
      </div>

      {contactModal && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
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
                        handleCancelOrder(order.data?._id);
                      }}
                    />
                    <button
                      onClick={() => {
                        stopPolling();
                        handleCancelOrder(order.data?._id);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors px-3 text-red-500"
                    >
                      Huỷ đơn hàng
                    </button>
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
                    <label className="block text-sm mb-1.5 font-medium">Địa chỉ *</label>
                    <input
                      placeholder="42 pham nhu tang"
                      value={customerAddress}
                      required
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
      {/* Modal chọn combo */}
      {selectedCombo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
          onClick={() => {
            setSelectedCombo(null);
            setComboSelections({});
          }}
        >
          <div
            className="bg-card rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
                {selectedCombo.image && (
                  <Image
                    src={selectedCombo.image}
                    alt={selectedCombo.name}
                    width={32}
                    height={32}
                    className="rounded-lg object-cover"
                  />
                )}
                {selectedCombo.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedCombo(null);
                  setComboSelections({});
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {selectedCombo.description && <p className="text-xs text-muted-foreground mb-4">{selectedCombo.description}</p>}

            {/* Rules */}
            <div className="space-y-4 mb-4">
              {selectedCombo.rules.map((rule, ruleIdx) => {
                const products = getProductsForRule(rule);
                const selectedSlots = comboSelections[ruleIdx] || [];

                return (
                  <div key={ruleIdx} className="border border-border rounded-xl p-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">
                        {rule.groupName}
                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                          ({selectedSlots.length}/{rule.requiredQuantity})
                        </span>
                      </p>
                    </div>

                    {/* Selected slots with size/crust selectors */}
                    {selectedSlots.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {Array.from({ length: rule.requiredQuantity }, (_, slotIdx) => {
                          const sel = selectedSlots[slotIdx];
                          if (!sel) return null;
                          const selProduct = menuProducts.find(p => p._id === sel.productId);
                          if (!selProduct) return null;
                          const ruleVariants = getVariantsForRule(selProduct, rule);
                          const currentVariant = ruleVariants.find(v => v.sku === sel.sku) || ruleVariants[0];
                          const sizes = Array.from(new Set(ruleVariants.map(v => v.size)));
                          const crustsForSize = currentVariant
                            ? Array.from(
                                new Set(
                                  ruleVariants
                                    .filter(v => v.size === currentVariant.size)
                                    .flatMap(v => parseCrustOptions(v.crust))
                                    .filter(Boolean),
                                ),
                              )
                            : [];

                          return (
                            <div key={slotIdx} className="bg-orange-50/60 border border-orange-200 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-foreground truncate flex-1">{selProduct.name}</span>
                                <button
                                  onClick={() => {
                                    setComboSelections(prev => {
                                      const cur = [...(prev[ruleIdx] || [])];
                                      cur.splice(slotIdx, 1);
                                      return { ...prev, [ruleIdx]: cur };
                                    });
                                  }}
                                  className="text-muted-foreground hover:text-red-500 p-0.5 shrink-0 ml-1"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              {/* Size & Crust selectors */}
                              <div>
                                {/* Size buttons */}
                                {sizes.length > 1 && (
                                  <div className="flex items-center gap-1.5">
                                    {sizes.map(size => {
                                      const isActive = size === (currentVariant?.size || "");
                                      return (
                                        <button
                                          key={size}
                                          onClick={() => {
                                            const matching = ruleVariants.find(v => v.size === size);
                                            if (matching) {
                                              handleChangeComboVariant(
                                                ruleIdx,
                                                slotIdx,
                                                sel.productId,
                                                matching.sku,
                                                matching.size,
                                                parseCrustOptions(matching.crust)[0] || undefined,
                                              );
                                            }
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                            isActive
                                              ? "bg-orange-500 text-white shadow-sm"
                                              : "bg-white border border-border text-muted-foreground hover:border-orange-300"
                                          }`}
                                        >
                                          {size}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {sizes.length === 1 && (
                                  <span className="text-xs text-muted-foreground">{currentVariant?.size}</span>
                                )}
                                {/* Crust buttons */}
                                {crustsForSize.length > 1 && (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {crustsForSize.map(crust => {
                                      const activeCrust = sel.crust || parseCrustOptions(currentVariant?.crust || [])[0];
                                      const isActive = crust === activeCrust;
                                      return (
                                        <button
                                          key={crust}
                                          onClick={() => {
                                            const matchingVariant = ruleVariants.find(
                                              v => v.size === currentVariant?.size && parseCrustOptions(v.crust).includes(crust),
                                            );
                                            if (matchingVariant) {
                                              handleChangeComboVariant(
                                                ruleIdx,
                                                slotIdx,
                                                sel.productId,
                                                matchingVariant.sku,
                                                matchingVariant.size,
                                                crust,
                                              );
                                            }
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                            isActive
                                              ? "bg-gray-800 text-white shadow-sm"
                                              : "bg-white border border-border text-muted-foreground hover:border-gray-300"
                                          }`}
                                        >
                                          {crust.charAt(0).toUpperCase() + crust.slice(1)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Product grid - luôn hiển thị để có thể chọn lại/thay thế */}
                    {products.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {products.map(product => {
                          const ruleVariants = getVariantsForRule(product, rule);
                          const variant = ruleVariants[0];
                          if (!variant) return null;
                          const isSelected = selectedSlots.some(s => s.productId === product._id && s.sku === variant.sku);
                          return (
                            <button
                              key={product._id}
                              onClick={() => handleSelectComboProduct(ruleIdx, variant.sku)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-200"
                                  : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/30"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                                  {variant.image?.url ? (
                                    <Image src={variant.image.url} alt={product.name} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Pizza size={14} className="text-muted-foreground/30" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {products.length === 0 && <p className="text-xs text-muted-foreground italic">Không có sản phẩm khả dụng</p>}
                  </div>
                );
              })}
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-primary font-bold text-lg">{formatVND(selectedCombo.price)}</span>
              <button
                onClick={handleAddComboToCart}
                disabled={!allComboSelectionsFilled}
                className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                  allComboSelectionsFilled
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Plus size={16} /> Thêm vào giỏ ({formatVND(selectedCombo.price)})
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
