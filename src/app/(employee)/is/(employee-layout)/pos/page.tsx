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
  LoaderCircle,
  TicketPercent,
} from "lucide-react";
import { getRoleLabel, getRoleColor, useEmployeeAuth } from "@/src/context/authEmployeeContext";
import Link from "next/link";
import Image from "next/image";
import { getAllCategories } from "@/src/services/category.service";
import { getAllProducts } from "@/src/services/product.service";
import { getAllIngredients, IngredientData } from "@/src/services/ingredient.service";
import { toast, Toaster } from "sonner";
import {
  calculateDeliveryFee,
  cancelOrder,
  createPosOrder,
  PosOrder,
  PaymentMethod,
  type OrderItem,
} from "@/src/services/order.service";
import { checkPaymentStatus, PAYMENT_TIMEOUT_MS } from "@/src/services/payment.service";
import { formatVND } from "@/src/utils/formatVND";
import { generateInvoicePDF, type InvoiceData, type InvoiceItem } from "@/src/utils/generateInvoicePDF";
import { getAllStore, type StoreData } from "@/src/services/store.service";
import { applyPromoCode, type PromoCodeResult } from "@/src/services/promotion.service";
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

type MenuTab = "all" | "products" | "combos" | "toppings";
type PosStep = "order" | "pricing" | "payment";

export type { ProductCategory, ProductImage, Ingredient, RecipeIngredient, ProductVariant };
export type { Product };

interface CartItem {
  cart_line_id: string;
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
  base_price?: number;
  is_pizza?: boolean;
  added_topping?: string[];
  combo_selections?: ComboSlotSelection[];
}

type ComboSlotSelection = {
  productId: string;
  sku: string;
  size: string;
  crust?: string;
};

/** Combo từ menu cửa hàng */
interface ComboDisplay {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  rules: ComboRule[];
  pricingType?: "static" | "dynamic";
  discountType?: "percent" | "amount";
  discount?: number;
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
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeResult | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoSubtotal, setPromoSubtotal] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [editNoteIndex, setEditNoteIndex] = useState<number | null>(null);
  const [posCollapsed, setPosCollapsed] = useState(true);

  // Trạng thái modal chọn combo
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
  // Theo dõi loại đế (crust) đã chọn theo key "productId-size"
  const [selectedCrustMap, setSelectedCrustMap] = useState<Record<string, string>>({});
  const [hideTable, setHideTable] = useState(false);
  const [posStep, setPosStep] = useState<PosStep>("order");
  const [createValidationAttempted, setCreateValidationAttempted] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [order, setOder] = useState();
  const [testtime, setTestime] = useState<Date>();
  const [storeInfo, setStoreInfo] = useState<StoreData | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Extra topping is edited for the currently selected pizza cart line.
  const [toppingList, setToppingList] = useState<IngredientData[]>([]);
  const [selectedCartLineId, setSelectedCartLineId] = useState<string | null>(null);

  const pollingRef = useRef(null);
  const comboCounterRef = useRef(0);
  const cartLineCounterRef = useRef(0);
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

        if (res.paymentStatus === "success") {
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

        // Cũng tải menu riêng của cửa hàng để lấy combo & sản phẩm đã lọc theo cửa hàng
        const storeId = user?.store_id;
        if (storeId) {
          try {
            const menuData = await http(`/api/v1/menus/store/${storeId}`, { next: { revalidate: 3600 } });
            const menu = menuData?.data ?? menuData;
            if (menu?.products) setProducts(menu.products);
            // Lưu sản phẩm riêng để dùng cho việc chọn combo
            if (menu?.products) setMenuProducts(menu.products);
            if (menu?.combos) {
              const comboEntries = menu.combos as Array<Partial<ComboDisplay> & { combo?: Partial<ComboDisplay> }>;
              const mapped: ComboDisplay[] = comboEntries.map(entry => {
                const c = entry.combo ?? entry;
                return {
                  _id: c._id ?? entry._id ?? "",
                  name: c.name ?? "",
                  description: c.description,
                  image: c.image,
                  price: c.price ?? 0,
                  rules: Array.isArray(c.rules) ? c.rules : [],
                  pricingType: c.pricingType,
                  discountType: c.discountType,
                  discount: c.discount,
                };
              });
              setCombos(mapped);
            }
          } catch {
            /* giữ lại sản phẩm dự phòng nếu tải menu thất bại */
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

  // Fetch extra toppings (ingredients)
  useEffect(() => {
    const fetchToppings = async () => {
      try {
        const { data } = await getAllIngredients();
        setToppingList(
          (data || []).filter(
            ing => ing.isActive && !ing.isDeleted && ing.price > 0 && !["drink", "dough", "other"].includes(ing.category),
          ),
        );
      } catch {
        toast.error("Không tải được danh sách extra topping");
      }
    };
    fetchToppings();
  }, []);

  const filteredMenu = useMemo(() => {
    if (activeTab === "combos" || activeTab === "toppings" || activeCategory === "combo") return [];
    let items = activeCategory === "all" ? products : products.filter(m => m?.category.slug === activeCategory);
    if (search) items = items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    // Sắp xếp theo thứ tự danh mục ở sidebar
    const catOrderMap = new Map(categories.map((cat, idx) => [cat.slug, idx]));
    items = [...items].sort((a, b) => {
      const orderA = catOrderMap.get(a.category?.slug) ?? Infinity;
      const orderB = catOrderMap.get(b.category?.slug) ?? Infinity;
      return orderA - orderB;
    });
    return items;
  }, [products, activeCategory, search, activeTab, categories]);

  const filteredCombos = useMemo(() => {
    if (activeTab === "products" || activeTab === "toppings") return [];
    let items = activeCategory === "combo" || activeCategory === "all" ? combos : [];
    if (activeCategory !== "all" && activeCategory !== "combo") items = [];
    if (search) items = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [combos, search, activeCategory, activeTab]);

  const filteredToppings = useMemo(() => {
    if (!search) return toppingList;
    const normalizedSearch = search.trim().toLowerCase();
    return toppingList.filter(topping => topping.name.toLowerCase().includes(normalizedSearch));
  }, [search, toppingList]);

  const createCartLineId = (prefix: string) => {
    cartLineCounterRef.current += 1;
    return `${prefix}-${cartLineCounterRef.current}`;
  };

  const haveSameToppings = (a: string[] = [], b: string[] = []) => {
    if (a.length !== b.length) return false;
    const aIds = [...a].sort();
    const bIds = [...b].sort();
    return aIds.every((id, index) => id === bIds[index]);
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // Với combo, so khớp theo combo_id VÀ combo_selections
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
        return [...prev, { ...item, cart_line_id: item.cart_line_id || createCartLineId("combo"), quantity: 1, note: "" }];
      }
      // Keep each pizza as its own line so toppings can target one specific pizza.
      const idx = item.is_pizza
        ? -1
        : prev.findIndex(
            c => c.item_type === "product" && c.sku === item.sku && haveSameToppings(c.added_topping, item.added_topping),
          );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, cart_line_id: item.cart_line_id || createCartLineId("product"), quantity: 1, note: "" }];
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
    // Chỉ giữ lại các sản phẩm có ít nhất một phiên bản khớp với applicableSizes
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
    if (!rule || !product) return;
    // Lọc variant theo applicableSizes của rule
    const ruleVariants = getVariantsForRule(product, rule);
    const variant = ruleVariants.find(v => v.sku === sku) || ruleVariants[0];
    if (!variant) return;

    const selection: ComboSlotSelection = {
      productId: product._id,
      sku: variant.sku,
      size: variant.size,
      crust: parseCrustOptions(variant.crust)[0] || undefined,
    };

    setComboSelections(prev => {
      const current = prev[ruleIndex] || [];
      const requiredQty = rule?.requiredQuantity || 1;
      // còn slot trống thì thêm slot mới (cho phép chọn cùng sản phẩm nhiều lần)
      if (current.length < requiredQty) {
        return { ...prev, [ruleIndex]: [...current, selection] };
      }
      // Đã đủ số lượng thì thay thế phần tử đầu tiên
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
        // tìm theo productId
        const idx = current.findIndex(s => s.productId === productId);
        if (idx >= 0) {
          current[idx] = { productId, sku: newSku, size: newSize, crust: newCrust };
        }
      }
      return { ...prev, [ruleIndex]: current };
    });
  };

  /** Lấy các phiên bản (variants) của sản phẩm khớp với applicableSizes của rule */
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

  /** Tính giá động cho combo dựa trên các sản phẩm đã chọn (giống trang chủ) */
  const computeDynamicComboPrice = (): number => {
    if (!selectedCombo || selectedCombo.pricingType !== "dynamic") return selectedCombo?.price ?? 0;

    let total = 0;
    selectedCombo.rules.forEach((_rule, idx) => {
      const selections = comboSelections[idx] || [];
      selections.forEach(sel => {
        const product = menuProducts.find(p => p._id === sel.productId);
        const variant = product?.variants.find(v => v.sku === sel.sku);
        if (variant) {
          total += variant.price;
        }
      });
    });

    // Áp dụng discount nếu có
    if (selectedCombo.discountType === "percent" && selectedCombo.discount && selectedCombo.discount > 0) {
      total = Math.round(total * (1 - selectedCombo.discount / 100));
    } else if (selectedCombo.discountType === "amount" && selectedCombo.discount && selectedCombo.discount > 0) {
      total = Math.max(0, total - selectedCombo.discount);
    }

    return total;
  };

  /** Giá hiển thị của combo: static thì dùng giá fix, dynamic thì tính từ selections */
  const getDisplayComboPrice = (): number => {
    if (!selectedCombo) return 0;
    if (selectedCombo.pricingType === "dynamic") {
      return computeDynamicComboPrice();
    }
    return selectedCombo.price;
  };

  const handleAddComboToCart = () => {
    if (!selectedCombo || !allComboSelectionsFilled) return;
    comboCounterRef.current += 1;
    const allSelections: ComboSlotSelection[] = [];
    selectedCombo.rules.forEach((_rule, idx) => {
      (comboSelections[idx] || []).forEach(sel => allSelections.push(sel));
    });
    const finalPrice = getDisplayComboPrice();
    addToCart({
      cart_line_id: createCartLineId("combo"),
      item_type: "combo",
      combo_id: selectedCombo._id,
      name: selectedCombo.name,
      price: finalPrice,
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
    const itemToUpdate = cart[index];
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: next[index].quantity + delta };
      if (next[index].quantity <= 0) next.splice(index, 1);
      return next;
    });
    if (itemToUpdate && itemToUpdate.quantity + delta <= 0 && itemToUpdate.cart_line_id === selectedCartLineId) {
      setSelectedCartLineId(null);
    }
  };

  const removeItem = (index: number) => {
    const itemToRemove = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    if (itemToRemove?.cart_line_id === selectedCartLineId) {
      setSelectedCartLineId(null);
    }
  };

  const clearCartQuickly = () => {
    setCart([]);
    setSelectedCartLineId(null);
    setEditNoteIndex(null);
    setOrderNote("");
    setPromoCode("");
    setPromoError("");
    setAppliedPromo(null);
    setPromoSubtotal(null);
    setCashReceived("");
    setCreateValidationAttempted(false);
    setPosStep("order");
    toast.success("Đã hủy và xóa toàn bộ giỏ hàng");
  };

  const updateNote = (index: number, note: string) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], note };
      return next;
    });
  };

  const selectedPizzaCartItem = selectedCartLineId
    ? cart.find(item => item.cart_line_id === selectedCartLineId && item.is_pizza)
    : undefined;

  const getToppingNames = (ids: string[] = []) =>
    toppingList.filter(topping => ids.includes(topping._id)).map(topping => topping.name);

  const toggleToppingForSelectedPizza = (toppingId: string) => {
    if (!selectedCartLineId || !selectedPizzaCartItem) {
      toast.info("Vui lòng chọn một pizza trong giỏ trước");
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.cart_line_id !== selectedCartLineId) return item;

        const currentToppingIds = item.added_topping ?? [];
        const nextToppingIds = currentToppingIds.includes(toppingId)
          ? currentToppingIds.filter(id => id !== toppingId)
          : [...currentToppingIds, toppingId];
        const currentToppingTotal = toppingList
          .filter(topping => currentToppingIds.includes(topping._id))
          .reduce((sum, topping) => sum + Number(topping.price || 0), 0);
        const nextToppingTotal = toppingList
          .filter(topping => nextToppingIds.includes(topping._id))
          .reduce((sum, topping) => sum + Number(topping.price || 0), 0);
        const basePrice = item.base_price ?? Math.max(0, item.price - currentToppingTotal);

        return {
          ...item,
          base_price: basePrice,
          price: basePrice + nextToppingTotal,
          added_topping: nextToppingIds,
        };
      }),
    );
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const deliveryFee = calculateDeliveryFee(orderType, subtotal);
  const discountAmount = appliedPromo?.valid ? Math.min(appliedPromo.discountAmount, subtotal) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);
  const cashReceivedNum = parseInt(cashReceived) || 0;
  const change = paymentMethod === "cash" ? cashReceivedNum - total : 0;

  useEffect(() => {
    if (appliedPromo?.valid && promoSubtotal !== null && subtotal !== promoSubtotal) {
      setAppliedPromo(null);
      setPromoSubtotal(null);
      setPromoError("Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã.");
    }
  }, [appliedPromo, promoSubtotal, subtotal]);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError("Vui lòng nhập mã khuyến mãi");
      return;
    }
    if (!user?.store_id) {
      setPromoError("Không xác định được cửa hàng");
      return;
    }

    setIsApplyingPromo(true);
    setPromoError("");
    try {
      const result = await applyPromoCode(code, subtotal, user.store_id, null);
      if (result.valid) {
        setAppliedPromo(result);
        setPromoCode(result.code);
        setPromoSubtotal(subtotal);
        toast.success(`Đã áp dụng mã ${result.code}`);
      } else {
        const errorMessages: Record<string, string> = {
          PROMOTION_NOT_FOUND: "Mã khuyến mãi không tồn tại.",
          PROMOTION_INACTIVE: "Mã khuyến mãi hiện không hoạt động.",
          PROMOTION_NOT_STARTED: "Mã khuyến mãi chưa đến thời gian áp dụng.",
          PROMOTION_EXPIRED: "Mã khuyến mãi đã hết hạn.",
          PROMOTION_NOT_APPLICABLE: "Mã không áp dụng cho cửa hàng này.",
          PROMOTION_USAGE_LIMIT_REACHED: "Mã khuyến mãi đã hết lượt sử dụng.",
          PROMOTION_REQUIRES_POINTS: "Mã này chỉ dành cho khách hàng đã đổi điểm.",
        };
        setAppliedPromo(null);
        setPromoSubtotal(null);
        setPromoError(errorMessages[result.message || ""] || result.message || "Mã khuyến mãi không hợp lệ");
      }
    } catch {
      setPromoError("Không thể kiểm tra mã khuyến mãi");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removeAppliedPromo = () => {
    setPromoCode("");
    setPromoError("");
    setAppliedPromo(null);
    setPromoSubtotal(null);
  };

  const canSubmit = () => {
    if (cart.length === 0) return false;
    if (orderType === "dine_in" && !tableNumber) return false;
    if (paymentMethod === "cash" && cashReceivedNum < total) return false;
    return true;
  };

  const handleContinueToPricing = () => {
    setCreateValidationAttempted(true);
    const isMissingTable = orderType === "dine_in" && !tableNumber;

    if (isMissingTable) {
      setHideTable(false);
      toast.warning("Vui lòng chọn số bàn");
      return;
    }

    setCreateValidationAttempted(false);
    setPosStep("pricing");
  };

  const handleCreateOrderClick = () => {
    setCreateValidationAttempted(true);
    if (paymentMethod === "cash" && cashReceivedNum < total) {
      toast.warning("Vui lòng nhập đủ tiền khách đưa");
      return;
    }

    setCreateValidationAttempted(false);
    setContactModal(true);
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
          added_topping: (item.added_topping ?? []).map(id => ({ ingredient: id, quantity: 1 })),
        };
      });

      const order: PosOrder = {
        orderType: orderType,
        paymentMethod: paymentMethod,
        paymentStatus: orderType === "dine_in" && paymentMethod === "cash" ? "success" : "pending",
        contact_info: {
          full_name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        store_id: emp.ref_id.store_id,
        note: `${tableNumber} ${orderNote != "" ? `- ${orderNote}` : ``}`,
        items: listItem,
        promotion_code: appliedPromo?.valid ? appliedPromo.code : undefined,
        discount_amount: discountAmount,
      };
      const result = await createPosOrder(order, "");
      const res = result.data;
      const payment = result.payment;
      if (res.paymentMethod != "cash" && res.paymentStatus != "success") {
        setTestime(new Date(new Date(res.createdAt).getTime() + PAYMENT_TIMEOUT_MS));
        startPolling(payment.orderId);
        setOder(result);
        setLastOrderId(result.data._id);
      }
      if (res.paymentMethod === "cash") {
        setLastOrderId(result.data._id);
        setShowSuccess(true);
      }
    } catch (error: unknown) {
      const orderError = error as { data?: { message?: string }; message?: string };
      const rawMessage = orderError.data?.message || orderError.message || "";
      const errorMessages: Record<string, string> = {
        PROMOTION_NOT_FOUND_OR_EXPIRED: "Mã khuyến mãi không tồn tại hoặc đã hết hạn.",
        PROMOTION_USAGE_LIMIT_REACHED: "Mã khuyến mãi đã hết lượt sử dụng.",
        PROMOTION_REQUIRES_POINTS: "Mã này chỉ dành cho khách hàng đã đổi điểm.",
      };
      toast.error(errorMessages[rawMessage] || "Không thể tạo đơn hàng");
    }
  };

  const resetOrder = () => {
    setCart([]);
    setSelectedCartLineId(null);
    setOrderType("dine_in");
    setTableNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPaymentMethod("cash");
    setCashReceived("");
    setOrderNote("");
    setPromoCode("");
    setPromoError("");
    setAppliedPromo(null);
    setPromoSubtotal(null);
    setPosStep("order");
    setCreateValidationAttempted(false);
    setHideTable(true);
    setShowSuccess(false);
    setContactModal(false);
  };

  // Lấy thông tin cửa hàng để in hóa đơn
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
        // thông tin cửa hàng là tùy chọn cho hóa đơn
      }
    };
    fetchStoreInfo();
  }, [user?.store_id]);

  const handlePrintInvoice = async () => {
    setIsPrinting(true);
    try {
      const invoiceItems: InvoiceItem[] = cart.map(item => {
        const toppingNames = getToppingNames(item.added_topping);
        const toppingNote = toppingNames.length ? `Extra topping: ${toppingNames.join(", ")}` : "";
        return {
          name: item.name,
          size: item.size,
          crust: item.crust,
          quantity: item.quantity,
          price: item.price,
          note: [item.note, toppingNote].filter(Boolean).join(" | ") || undefined,
          isCombo: item.item_type === "combo",
          comboSelections: item.combo_selections?.map(sel => {
            const selProduct = menuProducts.find(p => p._id === sel.productId);
            return {
              name: selProduct?.name || sel.productId,
              size: sel.size,
              crust: sel.crust,
            };
          }),
        };
      });

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
        deliveryFee,
        discountAmount,
        promotionCode: appliedPromo?.valid ? appliedPromo.code : undefined,
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-3 border-b border-border bg-white px-2 py-1">
        {[
          { key: "order" as PosStep, number: 1, label: "Chọn món" },
          { key: "pricing" as PosStep, number: 2, label: "Tính tiền" },
          { key: "payment" as PosStep, number: 3, label: "Thanh toán" },
        ].map((step, index) => {
          const currentIndex = ["order", "pricing", "payment"].indexOf(posStep);
          const isActive = posStep === step.key;
          const isCompleted = index < currentIndex;
          return (
            <div key={step.key} className="relative flex items-center justify-center">
              {index > 0 && (
                <span
                  className={`absolute right-1/2 top-1/2 h-px w-full ${isCompleted || isActive ? "bg-primary" : "bg-border"}`}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (isCompleted) setPosStep(step.key);
                }}
                className={`relative z-10 flex min-h-10 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-white px-2 text-[10px] font-medium ${
                  isActive ? "text-primary" : isCompleted ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    isActive
                      ? "border-primary bg-primary text-white"
                      : isCompleted
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-white"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={12} /> : step.number}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {posStep === "order" && (
        <>
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
          <div
            className={`border-b px-2 py-1 transition-colors ${
              orderType !== "dine_in"
                ? "hidden"
                : createValidationAttempted && !tableNumber
                  ? "border-red-300 bg-red-50/40"
                  : "border-border"
            }`}
          >
            {orderType === "dine_in" && (
              <div>
                <div
                  onClick={() => setHideTable(!hideTable)}
                  className="flex min-h-9 items-center justify-between cursor-pointer px-1"
                >
                  <div className=" flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Số bàn *</span>
                    {tableNumber && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {tableNumber}
                      </span>
                    )}
                    {createValidationAttempted && !tableNumber && (
                      <span className="text-[10px] font-medium text-red-500">Vui lòng chọn</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideTable(!hideTable)}
                    className="flex size-9 touch-manipulation items-center justify-center rounded-lg hover:bg-muted"
                  >
                    <ChevronDown size={18} className={`transition-transform ${hideTable ? "" : "rotate-180"}`} />
                  </button>
                </div>
                {!hideTable && (
                  <div className="grid grid-cols-6 gap-1 pb-1">
                    {tables.map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setTableNumber(t);
                          setHideTable(true);
                        }}
                        className={`min-h-9 rounded-lg px-1 text-[11px] font-medium transition-all active:scale-95 ${tableNumber === t ? "bg-primary text-white" : "bg-muted text-foreground hover:bg-primary/10"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 py-8">
                <ShoppingCart size={40} className="mb-2" />
                <p className="text-sm">Chưa có sản phẩm</p>
                <p className="text-xs">Chọn món từ menu bên trái</p>
              </div>
            ) : (
              <div className="space-y-1">
                {cart.map((item, i) => {
                  const isSelectedPizza = item.is_pizza && item.cart_line_id === selectedCartLineId;
                  const toppingNames = getToppingNames(item.added_topping);
                  return (
                    <div
                      key={item.cart_line_id}
                      onClick={event => {
                        if ((event.target as HTMLElement).closest("button, input")) return;
                        if (item.is_pizza) setSelectedCartLineId(item.cart_line_id);
                      }}
                      className={`group rounded-xl border p-2 transition-all ${
                        isSelectedPizza
                          ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                          : item.is_pizza
                            ? "bg-muted/40 border-transparent cursor-pointer hover:border-primary/40"
                            : "bg-muted/40 border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.image ? (
                            <Image fill src={item.image} alt={item.sku} className="relative! w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Pizza size={20} className="text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1 truncate text-[13px] font-medium leading-5 text-foreground">
                                {item.name}{" "}
                                {item.item_type === "product" ? `- ${item.size}${item.crust ? ` (${item.crust})` : ""}` : ""}
                                {item.item_type === "combo" && (
                                  <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-semibold rounded-full shrink-0">
                                    COMBO
                                  </span>
                                )}
                              </p>
                              {item.item_type === "combo" && item.combo_selections && item.combo_selections.length > 0 && (
                                <div className="mt-0.5 space-y-0.5">
                                  {item.combo_selections.map((sel, si) => {
                                    const selProduct = menuProducts.find(p => p._id === sel.productId);
                                    return (
                                      <p key={si} className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                        {selProduct?.name || sel.productId} - {sel.size}
                                        {sel.crust ? ` - ${sel.crust}` : ""}
                                      </p>
                                    );
                                  })}
                                </div>
                              )}
                              {toppingNames.length > 0 && (
                                <p className="truncate text-[10px] leading-4 text-primary">+ {toppingNames.join(", ")}</p>
                              )}
                              {item.is_pizza && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCartLineId(item.cart_line_id);
                                    setActiveTab("toppings");
                                    setActiveCategory("all");
                                    setSearch("");
                                  }}
                                  className="text-[10px] font-medium leading-4 text-primary underline underline-offset-2 hover:text-primary/80"
                                >
                                  Extra topping
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(i)}
                              className="-mr-1 flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQty(i, -1)}
                                className="flex size-9 touch-manipulation items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-primary/10 active:scale-95"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-5 text-center text-xs font-medium text-foreground">{item.quantity}</span>
                              <button
                                onClick={() => updateQty(i, 1)}
                                className="flex size-9 touch-manipulation items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 active:scale-95"
                              >
                                <Plus size={14} />
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
                                  className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-background outline-none focus:border-primary"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditNoteIndex(i)}
                                className="min-h-9 touch-manipulation whitespace-nowrap rounded-md px-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                              >
                                {item.note ? `${item.note}` : "+ Ghi chú"}
                              </button>
                            )}
                            <span className="shrink-0 text-[13px] font-semibold text-primary">
                              {formatVND(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {cart.length > 0 && (
        <>
          {posStep === "order" && (
            <div className="shrink-0 border-t border-border bg-white p-2">
              <button
                type="button"
                onClick={handleContinueToPricing}
                className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-md shadow-primary/20 hover:bg-primary/90"
              >
                Tính tiền <ChevronRight size={16} />
              </button>
            </div>
          )}

          {posStep === "pricing" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Tính tiền</h4>
                  <p className="text-xs text-muted-foreground">Kiểm tra đơn, thêm ghi chú và mã khuyến mãi.</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{cartCount} món đã chọn</span>
                    <button type="button" onClick={() => setPosStep("order")} className="text-xs text-primary underline">
                      Sửa món
                    </button>
                  </div>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.cart_line_id} className="flex justify-between gap-3 text-xs">
                        <span className="truncate text-muted-foreground">
                          {item.quantity} × {item.name} {item.size ? `- ${item.size}` : ""}
                        </span>
                        <span className="shrink-0 text-foreground">{formatVND(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Ghi chú đơn hàng</label>
                  <textarea
                    value={orderNote}
                    onChange={event => setOrderNote(event.target.value)}
                    rows={3}
                    placeholder="Nhập ghi chú chung..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Mã khuyến mãi</label>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <TicketPercent size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={promoCode}
                        onChange={event => {
                          setPromoCode(event.target.value.toUpperCase());
                          if (promoError) setPromoError("");
                        }}
                        onKeyDown={event => {
                          if (event.key === "Enter" && !appliedPromo?.valid) void handleApplyPromo();
                        }}
                        placeholder="Nhập mã"
                        disabled={!!appliedPromo?.valid || isApplyingPromo}
                        className="min-h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs uppercase outline-none focus:border-primary disabled:bg-green-50 disabled:text-green-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={appliedPromo?.valid ? removeAppliedPromo : () => void handleApplyPromo()}
                      disabled={!appliedPromo?.valid && (!promoCode.trim() || isApplyingPromo)}
                      className={`min-h-11 touch-manipulation rounded-xl px-4 text-xs font-medium disabled:opacity-50 ${
                        appliedPromo?.valid ? "border border-red-200 bg-red-50 text-red-600" : "bg-primary text-white"
                      }`}
                    >
                      {isApplyingPromo ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : appliedPromo?.valid ? (
                        "Hủy"
                      ) : (
                        "Áp dụng"
                      )}
                    </button>
                  </div>
                  {(promoError || appliedPromo?.valid) && (
                    <p className={`mt-1.5 text-xs ${appliedPromo?.valid ? "text-green-600" : "text-red-500"}`}>
                      {appliedPromo?.valid ? `Đã giảm ${formatVND(discountAmount)} với mã ${appliedPromo.code}` : promoError}
                    </p>
                  )}
                </div>

                <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính</span>
                    <span>{formatVND(subtotal)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí giao hàng</span>
                      <span>{formatVND(deliveryFee)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span>Tổng cộng</span>
                    <span className="text-lg text-primary">{formatVND(total)}</span>
                  </div>
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-white p-2">
                <button
                  type="button"
                  onClick={() => setPosStep("order")}
                  className="min-h-11 rounded-xl border border-border text-sm font-medium"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setPosStep("payment")}
                  className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-primary text-sm font-medium text-white"
                >
                  Thanh toán <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {posStep === "payment" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Thanh toán</h4>
                  <p className="text-xs text-muted-foreground">Chọn phương thức và hoàn tất đơn hàng.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {paymentOptions.map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPaymentMethod(option.key)}
                      className={`flex min-h-14 touch-manipulation items-center justify-center gap-2 rounded-xl border text-xs font-medium ${
                        paymentMethod === option.key
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
                {paymentMethod === "cash" && (
                  <div className="space-y-2">
                    <label className="block text-xs text-muted-foreground">Tiền khách đưa</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={event => setCashReceived(event.target.value)}
                      placeholder={formatVND(total)}
                      className={`min-h-12 w-full rounded-xl border bg-background px-4 text-right text-base outline-none ${
                        createValidationAttempted && cashReceivedNum < total
                          ? "border-red-400"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    {createValidationAttempted && cashReceivedNum < total && (
                      <p className="text-xs font-medium text-red-500">Số tiền khách đưa phải từ {formatVND(total)}</p>
                    )}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000, 500000]
                        .filter((value, index, values) => values.indexOf(value) === index && value >= total)
                        .slice(0, 4)
                        .map(value => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setCashReceived(value.toString())}
                            className={`min-h-11 rounded-lg text-[10px] font-medium ${cashReceived === value.toString() ? "bg-primary text-white" : "bg-muted"}`}
                          >
                            {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}K`}
                          </button>
                        ))}
                    </div>
                    {cashReceivedNum >= total && (
                      <div className="flex justify-between rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <span>Tiền thừa</span>
                        <strong>{formatVND(change)}</strong>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                  <span className="text-sm font-medium">Tổng thanh toán</span>
                  <strong className="text-xl text-primary">{formatVND(total)}</strong>
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-white p-2">
                <button
                  type="button"
                  onClick={() => setPosStep("pricing")}
                  className="min-h-11 rounded-xl border border-border text-sm font-medium"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleCreateOrderClick}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white"
                >
                  <Receipt size={15} /> Xác nhận
                </button>
              </div>
            </div>
          )}
        </>
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
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${activeCategory === cat.slug ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}
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

          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {[
              { key: "all" as MenuTab, label: "Tất cả" },
              { key: "products" as MenuTab, label: "Món ăn" },
              { key: "combos" as MenuTab, label: "Combo" },
              { key: "toppings" as MenuTab, label: "Extra topping" },
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
              placeholder={activeTab === "toppings" ? "Tìm topping..." : "Tìm món..."}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
              {activeTab === "toppings" && (
                <div className="space-y-4">
                  {selectedPizzaCartItem ? (
                    <>
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Đang thêm topping cho</p>
                          <p className="font-semibold text-foreground truncate">
                            {selectedPizzaCartItem.name} - {selectedPizzaCartItem.size}
                            {selectedPizzaCartItem.crust ? ` (${selectedPizzaCartItem.crust})` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {(selectedPizzaCartItem.added_topping ?? []).length} topping
                          </p>
                          <p className="font-semibold text-primary">{formatVND(selectedPizzaCartItem.price)}</p>
                        </div>
                      </div>

                      {filteredToppings.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                          {filteredToppings.map(topping => {
                            const isSelected = (selectedPizzaCartItem.added_topping ?? []).includes(topping._id);
                            return (
                              <button
                                key={topping._id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => toggleToppingForSelectedPizza(topping._id)}
                                className={`rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
                                  isSelected
                                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                    : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                                }`}
                              >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  {isSelected ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                                </div>
                                <p className="text-sm font-medium text-foreground truncate">{topping.name}</p>
                                <p className="mt-1 text-sm font-semibold text-primary">+ {formatVND(topping.price)}</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                          Không tìm thấy extra topping phù hợp
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <ShoppingCart size={44} className="mb-3 text-muted-foreground/30" />
                      <p className="font-medium text-foreground">Chưa chọn pizza trong giỏ</p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Chọn một pizza ở giỏ hàng bên phải, sau đó quay lại tab này để thêm extra topping cho đúng bánh.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab !== "combos" && activeTab !== "toppings" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mb-4">
                  {filteredMenu.map(item => {
                    // Đây có phải sản phẩm pizza không?
                    const isPizza = item.category?.slug?.toLowerCase().includes("pizza");
                    // Nhóm các phiên bản theo size – với mỗi size, chọn phiên bản đầu tiên làm đại diện hiển thị
                    const sizeGroups = new Map<string, ProductVariant[]>();
                    item.variants.forEach(v => {
                      const list = sizeGroups.get(v.size) || [];
                      list.push(v);
                      sizeGroups.set(v.size, list);
                    });

                    return Array.from(sizeGroups.entries()).map(([size, variants]) => {
                      const displayVariant = variants[0];
                      const sizeKey = `${item._id}-${size}`;
                      // Thu thập tất cả tùy chọn đế (crust) duy nhất cho size này (với sản phẩm pizza)
                      const allCrusts = isPizza
                        ? Array.from(new Set(variants.flatMap(v => parseCrustOptions(v.crust)).filter(Boolean)))
                        : [];
                      const selectedCrust = selectedCrustMap[sizeKey] || allCrusts[0] || "";

                      // Tìm phiên bản khớp với đế đã chọn
                      const matchedVariant =
                        isPizza && selectedCrust
                          ? variants.find(v => parseCrustOptions(v.crust).includes(selectedCrust)) || displayVariant
                          : displayVariant;

                      // Hàm hỗ trợ định dạng nhãn đế (crust)
                      const formatCrustLabelPos = (value: string) =>
                        value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

                      return (
                        <button
                          key={`${item._id}-${size}`}
                          onClick={() => {
                            addToCart({
                              cart_line_id: createCartLineId("product"),
                              item_type: "product",
                              product_id: item._id,
                              name: item.name,
                              note: "",
                              price: matchedVariant.price,
                              base_price: matchedVariant.price,
                              quantity: 1,
                              size,
                              crust: isPizza ? selectedCrust : undefined,
                              sku: matchedVariant.sku,
                              image: displayVariant.image.url,
                              is_pizza: isPizza,
                              added_topping: [],
                            });
                          }}
                          className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all text-left w-full active:scale-[0.98] cursor-pointer"
                        >
                          <div className="aspect-[4/3] bg-white relative overflow-hidden">
                            {displayVariant.image.url ? (
                              <Image
                                fill
                                loading="eager"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                src={displayVariant.image.url}
                                alt={item.name}
                                className="object-contain pointer-events-none"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Pizza size={32} className="text-muted-foreground/20" />
                              </div>
                            )}
                          </div>

                          <div className="p-3">
                            <p className="text-sm text-foreground font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {size}
                              {isPizza && selectedCrust ? ` - ${formatCrustLabelPos(selectedCrust)}` : ""}
                            </p>
                            <p className="text-sm text-primary font-semibold mt-1">{formatVND(matchedVariant.price)}</p>

                            {isPizza && allCrusts.length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-2" onClick={e => e.stopPropagation()}>
                                {allCrusts.map(crust => {
                                  const isActive = crust === selectedCrust;
                                  return (
                                    <span
                                      key={crust}
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSelectedCrustMap(prev => ({ ...prev, [sizeKey]: crust }));
                                      }}
                                      className={`px-3 py-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                                        isActive
                                          ? "bg-gray-800 text-white shadow-sm"
                                          : "bg-muted text-muted-foreground hover:bg-gray-200 active:bg-gray-300"
                                      }`}
                                    >
                                      {formatCrustLabelPos(crust)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    });
                  })}
                </div>
              )}

              {activeTab !== "products" && filteredCombos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mb-4">
                  {filteredCombos.map(combo => (
                    <button
                      key={combo._id}
                      onClick={() => handleOpenCombo(combo)}
                      className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all text-left w-full active:scale-[0.98] cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {combo.image ? (
                          <Image
                            fill
                            loading="eager"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            src={combo.image}
                            alt={combo.name}
                            className="pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Pizza size={32} className="text-muted-foreground/20" />
                          </div>
                        )}
                        {/* Badge COMBO */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-[11px] font-semibold rounded-full shadow pointer-events-none">
                          COMBO
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-foreground font-medium truncate">{combo.name}</p>
                        <p className="text-sm text-primary font-semibold mt-1">
                          {combo.pricingType === "dynamic" ? (
                            <span className="text-orange-500 font-medium">Giá động</span>
                          ) : (
                            formatVND(combo.price)
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab !== "toppings" && filteredMenu.length === 0 && filteredCombos.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                  <Search size={40} className="mb-2" />
                  <p className="text-sm">Không tìm thấy sản phẩm</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden lg:flex w-[24vw] border-l border-border bg-card flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 h-[62px] border-b border-border">
          <h3 className="text-foreground text-sm flex items-center gap-2">
            <Receipt size={16} className="text-primary" /> Đơn hàng mới
          </h3>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCartQuickly}
                className="flex min-h-10 touch-manipulation items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} /> Hủy giỏ
              </button>
            )}
            <span className="text-[11px] text-muted-foreground">{cartCount} món</span>
          </div>
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

                              <div>
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

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-primary font-bold text-lg">{formatVND(getDisplayComboPrice())}</span>
              <button
                onClick={handleAddComboToCart}
                disabled={!allComboSelectionsFilled}
                className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                  allComboSelectionsFilled
                    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Plus size={16} /> Thêm vào giỏ ({formatVND(getDisplayComboPrice())})
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" richColors />
    </div>
  );
}
