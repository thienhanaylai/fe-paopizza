"use client";
import { ArrowRight, Award, ChefHat, Clock, MapPin, Phone, Plus, Star, Truck, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAllCategories } from "@/src/services/category.service";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { useCart } from "@/src/context/cartContext";
import type { ToppingRef, ProductPopulated } from "@/src/context/cartContext";
import type { ComboSelectionPayload } from "@/src/services/cart.service";
import { removeFromCartApi } from "@/src/services/cart.service";
import { Textarea } from "@/src/components/ui/textarea";
import { toast, Toaster } from "sonner";
import { formatVND } from "@/src/utils/formatVND";
import { getMenuByStoreId, MenuData, Product, Combo } from "@/src/services/menu.service";
import { IngredientData, getAllIngredients } from "@/src/services/ingredient.service";

type MenuCategoryUI = {
  slug: string;
  name: string;
  icon: string;
};

type ExtraTopping = IngredientData;

type ComboSlotSelection = {
  productId: string;
  sku: string;
  size: string;
  crust?: string;
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

const SlotCard = ({
  product,
  variant,
  selectedCrust,
  ruleIdx,
  onChangeVariant,
}: {
  product: Product;
  variant: Product["variants"][number];
  selectedCrust?: string;
  ruleIdx: number;
  onChangeVariant: (ruleIdx: number, productId: string, newSku: string, newSize: string, newCrust?: string) => void;
}) => {
  const allVariants = product.variants;
  const sizes = Array.from(new Set(allVariants.map(v => v.size)));
  const currentSize = variant.size;
  const crustsForSize = Array.from(
    new Set(
      allVariants
        .filter(v => v.size === currentSize)
        .flatMap(v => parseCrustOptions(v.crust))
        .filter(Boolean),
    ),
  );
  const isPizza = product.category?.slug?.toLowerCase().includes("pizza");
  // Dùng crust từ selection (người dùng đã chọn), fallback về variant.crust[0]
  const activeCrust = selectedCrust || parseCrustOptions(variant.crust)[0];

  const findVariantBySizeCrust = (size: string, crust?: string) => {
    return allVariants.find(v => {
      if (v.size !== size) return false;
      if (!crust) return true;
      return parseCrustOptions(v.crust).includes(crust);
    });
  };

  const handleSizeChange = (size: string) => {
    const matching = findVariantBySizeCrust(size, undefined);
    if (matching && matching.size !== variant.size) {
      const newCrust = parseCrustOptions(matching.crust)[0] || undefined;
      onChangeVariant(ruleIdx, product._id, matching.sku, matching.size, newCrust);
    }
  };

  const handleCrustChange = (crust: string) => {
    if (crust === activeCrust) return; // đã active → không làm gì
    // Tìm variant khớp size + crust
    const matching = findVariantBySizeCrust(currentSize, crust);
    if (matching) {
      // Nếu tìm thấy variant KHÁC → đổi hoàn toàn
      if (matching.sku !== variant.sku) {
        const newCrust = parseCrustOptions(matching.crust)[0] || undefined;
        onChangeVariant(ruleIdx, product._id, matching.sku, matching.size, newCrust);
      } else {
        // Cùng variant nhưng crust khác → chỉ cập nhật crust
        onChangeVariant(ruleIdx, product._id, variant.sku, variant.size, crust);
      }
    } else {
      // Không tìm thấy variant riêng → cùng 1 variant, chỉ đổi crust
      onChangeVariant(ruleIdx, product._id, variant.sku, variant.size, crust);
    }
  };

  return (
    <div className="border border-orange-200 rounded-xl p-3 bg-orange-50/40">
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
          <Image src={variant.image.url} alt={product.name} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {variant.size}
            {isPizza && activeCrust ? ` - ${formatCrustLabel(activeCrust)}` : ""}
          </p>
        </div>
      </div>

      {sizes.length > 1 && (
        <div className="flex items-center gap-1.5 mt-2">
          {sizes.map(size => {
            const isActive = size === currentSize;
            return (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
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

      {isPizza && crustsForSize.length > 1 && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {crustsForSize.map(crust => {
            const isActive = crust === activeCrust;
            return (
              <button
                key={crust}
                onClick={() => handleCrustChange(crust)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gray-800 text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:border-gray-300"
                }`}
              >
                {formatCrustLabel(crust)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function IndexPage() {
  const { user } = useCustomerAuth();
  const { addToCart, fetchCart, cart, editingSku, setEditingSku, editingComboId, setEditingComboId, setShowCart } = useCart();

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

  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [comboSelections, setComboSelections] = useState<Record<number, ComboSlotSelection[]>>({});
  const [replacingRule, setReplacingRule] = useState<number | null>(null);
  const editingComboOldSkuRef = useRef<string | null>(null);

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

  const showExtraTopping = useMemo(() => {
    if (!product) return false;
    const categorySlug = product.category?.slug?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    return (
      categorySlug.includes("pizza") ||
      categorySlug.includes("dessert") ||
      categorySlug.includes("desert") ||
      productName.includes("pizza") ||
      productName.includes("dessert") ||
      productName.includes("desert")
    );
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
    return selectedExtraToppings.reduce((total, item) => total + Number(item.price || 0), 0);
  }, [selectedExtraToppings]);

  const unitPrice = useMemo(() => {
    if (!selectedVariant) return 0;
    return Number(selectedVariant.price || 0) + extraToppingTotal;
  }, [extraToppingTotal, selectedVariant]);

  const isEditMode = useMemo(() => {
    if (!selectedVariant || !cart) return false;
    return cart.items.some(item => item.sku === selectedVariant.sku);
  }, [cart, selectedVariant]);

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

    queueMicrotask(() => {
      setProduct(targetProduct);
      setSelectedSize(cartItem.size || matchingVariant?.size || "");
      setSelectedCrust(crustValue);
      setSelectedExtraToppingIds(toppingIds);
      setNote(customNote);
    });

    setEditingSku(null);
  }, [editingSku, menu, cart?.items, setEditingSku]);

  // Mở modal chỉnh sửa combo từ cart
  useEffect(() => {
    if (!editingComboId || !menu) return;

    const cartItem = cart?.items.find(item => item.combo_id === editingComboId || item.sku === editingComboId);
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

    queueMicrotask(() => {
      setSelectedCombo(combo);
      setComboSelections(restoredSelections);
      setReplacingRule(null);
      editingComboOldSkuRef.current = cartItem.sku;
    });

    setEditingComboId(null);
  }, [editingComboId, menu, cart?.items, setEditingComboId]);

  // (() => {
  //   filteredMenu1?.map(item => {
  //     console.log(item);
  //   });
  // })();
  const hanldeProduct = (selectedProduct: Product) => {
    setProduct(selectedProduct);

    const firstVariant = selectedProduct.variants[0];
    console.log(selectedProduct);
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

  const computeComboOriginalPrice = (combo: Combo): number => {
    if (combo.disscountType === "percent") {
      return Math.round(combo.price / (1 - combo.disscount / 100));
    }
    return combo.price + combo.disscount;
  };

  const computeComboSavings = (combo: Combo): number => {
    return computeComboOriginalPrice(combo) - combo.price;
  };

  const getComboRuleItems = (combo: Combo): string[] => {
    return combo.rules.map(rule => `${rule.groupName} x${rule.requiredQuantity}`);
  };

  const handleOpenCombo = (combo: Combo) => {
    setSelectedCombo(combo);
    setComboSelections({});
    setReplacingRule(null);
  };

  const getProductsForRule = (rule: Combo["rules"][number]): Product[] => {
    if (!menu?.products) return [];

    if (rule.applicableProducts && rule.applicableProducts.length > 0) {
      return menu.products.filter(p => rule.applicableProducts.includes(p._id));
    }

    const categorySlugs = rule.applicableCategories.map(cat => cat.slug);
    return menu.products.filter(p => categorySlugs.includes(p.category?.slug));
  };

  const handleSelectComboProduct = (ruleIndex: number, sku: string) => {
    // Tìm variant để lấy size + crust
    const product = menu?.products.find(p => p.variants.some(v => v.sku === sku));
    const variant = product?.variants.find(v => v.sku === sku) || product?.variants[0];
    const selection: ComboSlotSelection = {
      productId: product?._id || "",
      sku: sku,
      size: variant?.size || "",
      crust: variant ? parseCrustOptions(variant.crust)[0] || undefined : undefined,
    };

    setComboSelections(prev => {
      const current = prev[ruleIndex] || [];
      const requiredQty = selectedCombo?.rules[ruleIndex]?.requiredQuantity || 1;
      // Toggle: nếu đã có selection cùng productId → bỏ chọn
      const idx = current.findIndex(s => s.productId === selection.productId);
      if (idx >= 0) {
        return { ...prev, [ruleIndex]: current.filter((_, i) => i !== idx) };
      }
      // Đã đủ số lượng → thay thế phần tử đầu
      if (current.length >= requiredQty) {
        const next = [...current];
        next.shift();
        return { ...prev, [ruleIndex]: [...next, selection] };
      }
      return { ...prev, [ruleIndex]: [...current, selection] };
    });
  };

  /** Thay đổi variant (size/crust) của 1 sản phẩm đã chọn trong combo */
  const handleChangeComboVariant = (ruleIndex: number, productId: string, newSku: string, newSize: string, newCrust?: string) => {
    setComboSelections(prev => {
      const current = [...(prev[ruleIndex] || [])];
      const idx = current.findIndex(s => s.productId === productId);
      if (idx >= 0) {
        current[idx] = {
          productId,
          sku: newSku,
          size: newSize,
          crust: newCrust,
        };
      }
      return { ...prev, [ruleIndex]: current };
    });
  };

  const allComboSelectionsFilled = useMemo(() => {
    if (!selectedCombo) return false;
    return selectedCombo.rules.every((rule, idx) => {
      const selected = comboSelections[idx] || [];
      return selected.length >= rule.requiredQuantity;
    });
  }, [selectedCombo, comboSelections]);

  const handleAddComboToCart = async () => {
    if (!selectedCombo) return;

    const oldSku = editingComboOldSkuRef.current;
    if (oldSku) {
      const oldCartItem = cart?.items.find(item => item.sku === oldSku);
      if (oldCartItem) {
        if (user?.id) {
          try {
            await removeFromCartApi({
              userId: user.id,
              item_type: "combo",
              combo_id: selectedCombo._id,
              size: oldCartItem.size,
              sku: oldSku,
            });
          } catch {}
        } else {
          const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "{}");
          if (guestCart.items) {
            guestCart.items = guestCart.items.filter((item: { sku: string }) => item.sku !== oldSku);
            localStorage.setItem("guest_cart", JSON.stringify(guestCart));
          }
        }
      }
      editingComboOldSkuRef.current = null;
    }

    const comboSelectionsPayload: ComboSelectionPayload[] = [];
    const populatedSelections: Array<{
      product_id: string | ProductPopulated;
      sku: string;
      size: string;
      crust?: string;
      added_topping: ToppingRef[];
    }> = [];

    selectedCombo.rules.forEach((rule, idx) => {
      (comboSelections[idx] || []).forEach(sel => {
        const product = menu?.products.find(p => p._id === sel.productId);
        comboSelectionsPayload.push({
          product_id: sel.productId,
          sku: sel.sku,
          size: sel.size,
          crust: sel.crust,
          added_topping: [],
        });
        populatedSelections.push({
          product_id: product
            ? {
                _id: product._id,
                name: product.name,
                variants: product.variants.map(v => ({
                  image: { url: v.image.url },
                  size: v.size,
                  price: v.price,
                })),
              }
            : sel.productId,
          sku: sel.sku,
          size: sel.size,
          crust: sel.crust,
          added_topping: [],
        });
      });
    });

    await addToCart({
      userId: user?.id,
      item_type: "combo",
      combo_id: selectedCombo._id,
      combo: {
        _id: selectedCombo._id,
        name: selectedCombo.name,
        image: selectedCombo.image,
      },
      combo_selections: (user?.id ? comboSelectionsPayload : populatedSelections) as ComboSelectionPayload[],
      sku: selectedCombo._id,
      crust: "",
      size: "",
      quantity: 1,
      note: "",
      price: selectedCombo.price,
    });

    await fetchCart(user?.id);
    setSelectedCombo(null);
    toast.success(
      <span>
        {oldSku ? (
          "Đã cập nhật combo!"
        ) : (
          <>
            Đã thêm combo vào{" "}
            <button
              className="underline font-medium hover:opacity-80"
              onClick={() => {
                setShowCart(true);
                toast.dismiss();
              }}
            >
              giỏ hàng
            </button>
            !
          </>
        )}
      </span>,
      { duration: 2000, position: "bottom-right" },
    );
  };

  const handleCart = async (product_id: string, size: string, quantity: number = 1, sku: string, note: string = "") => {
    const wasInCart = cart?.items.some(item => item.sku === sku);

    await addToCart({
      userId: user?.id,
      item_type: "product",
      product_id,
      product: product
        ? {
            _id: product._id,
            name: product.name,
            variants: product.variants.map(variant => ({
              image: {
                url: variant.image.url,
              },
              size: variant.size,
              price: variant.price,
            })),
          }
        : undefined,
      sku,
      size,
      crust: selectedCrust || undefined,
      quantity,
      note,
      price: unitPrice,
      added_topping: selectedExtraToppingIds,
    });

    const fetchedCart = (await fetchCart(user?.id)) as
      | {
          items?: Array<{ sku: string; note?: string }>;
        }
      | undefined
      | null;
    const productInCart = fetchedCart?.items?.find(item => item.sku === sku);
    setNote(productInCart?.note || "");

    toast.success(
      <span>
        {wasInCart ? (
          <>
            Đã cập nhật{" "}
            <button
              className="underline font-medium hover:opacity-80"
              onClick={() => {
                setShowCart(true);
                toast.dismiss();
              }}
            >
              giỏ hàng
            </button>
            !
          </>
        ) : (
          <>
            Đã thêm vào{" "}
            <button
              className="underline font-medium hover:opacity-80"
              onClick={() => {
                setShowCart(true);
                toast.dismiss();
              }}
            >
              giỏ hàng
            </button>
            !
          </>
        )}
      </span>,
      { duration: 2000, position: "bottom-right" },
    );
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl text-foreground mb-3">Thực đơn của chúng tôi</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Khám phá bộ sưu tập món ăn thủ công với nguyên liệu tươi ngon nhất
            </p>
          </div>
          <div className="sticky top-[72px] w-full z-20 bg-white/90 backdrop-blur-md py-2 px-3 sm:px-2 border border-border/80 shadow-sm rounded-2xl sm:rounded-[24px]  sm:mx-auto max-w-7xl transition-all duration-300">
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

          {/* ---- Combo Section ---- */}
          {activeCategory === "all" && menu?.combos && menu.combos.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="border-l-4 border-orange-500 pl-4 py-1">
                <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">🎁 Combo Ưu Đãi</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Tiết kiệm hơn khi mua combo</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {menu.combos.map(entry => {
                  const combo = entry.combo;
                  const savings = computeComboSavings(combo);
                  const originalPrice = computeComboOriginalPrice(combo);
                  const ruleItems = getComboRuleItems(combo);
                  return (
                    <div
                      key={combo._id}
                      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                      onClick={() => handleOpenCombo(combo)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={combo.image || "/placeholder-combo.png"}
                          alt={combo.name}
                          fill
                          loading="eager"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Savings badge */}
                        {savings > 0 && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-[11px] font-semibold rounded-full">
                            Tiết kiệm {formatVND(savings)}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-foreground font-semibold mb-1.5">{combo.name}</h4>
                        <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                          {ruleItems.map((item, idx) => (
                            <span key={idx} className="block">
                              {item}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-muted-foreground line-through">{formatVND(originalPrice)}</span>
                            <span className="text-lg font-bold text-primary">{formatVND(combo.price)}</span>
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenCombo(combo);
                            }}
                            className="px-3.5 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors cursor-pointer"
                          >
                            + Chọn
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {categories
            .filter(item => item.slug !== "all")
            .map(cat => {
              const categoryItems = filteredMenu1?.filter(item => item.category.slug === cat.slug);

              if (categoryItems?.length === 0) return null;
              return (
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

                {showExtraTopping && extraToppingOptions.length > 0 && (
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
                            <p className="text-xs">+ {formatVND(item.price)}</p>
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
                    <Plus size={18} /> {isEditMode ? "Cập nhật giỏ hàng" : "Thêm vào giỏ"}
                  </span>
                  <span>{formatVND(unitPrice)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCombo &&
        (() => {
          const savings = computeComboSavings(selectedCombo);
          const originalPrice = computeComboOriginalPrice(selectedCombo);
          const comboImg = selectedCombo.image || "/placeholder-combo.png";

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => {
                setSelectedCombo(null);
                setReplacingRule(null);
              }}
            >
              <div
                className="bg-card rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:flex-row"
                onClick={e => e.stopPropagation()}
              >
                <div className="md:w-2/5 bg-white border-b md:border-b-0 md:border-r border-border/60 flex items-center justify-center p-5 sm:p-6 shrink-0 relative">
                  <div className="relative w-full max-w-[320px] aspect-square">
                    <Image
                      src={comboImg}
                      alt={selectedCombo.name}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1024px) 60vw, 35vw"
                      className="object-contain"
                    />
                  </div>
                  {savings > 0 && (
                    <span className="absolute top-5 left-5 px-3 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-full">
                      Tiết kiệm {formatVND(savings)}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-start justify-between p-5 pb-2">
                    <div className="pr-3">
                      <h3 className="text-xl text-foreground font-bold">{selectedCombo.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{selectedCombo.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCombo(null);
                        setReplacingRule(null);
                      }}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-2">
                    {selectedCombo.rules.map((rule, ruleIdx) => {
                      const products = getProductsForRule(rule);
                      const selectedSelections = comboSelections[ruleIdx] || [];
                      const isReplacing = replacingRule === ruleIdx;

                      const slots = Array.from({ length: rule.requiredQuantity }, (_, slotIdx) => {
                        const sel = selectedSelections[slotIdx] || null;
                        const product = sel?.productId ? menu?.products.find(p => p._id === sel.productId) : null;
                        const variant = sel?.sku ? product?.variants.find(v => v.sku === sel.sku) || product?.variants[0] : null;
                        return { selection: sel, product, variant };
                      });

                      const isRuleFilled = selectedSelections.length >= rule.requiredQuantity;

                      return (
                        <div key={ruleIdx} className="border border-border rounded-2xl p-4 bg-muted/10">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-foreground">
                              {rule.groupName}
                              <span className="text-xs text-muted-foreground ml-1 font-normal">
                                ({selectedSelections.length}/{rule.requiredQuantity})
                              </span>
                            </p>
                            {isRuleFilled && !isReplacing && (
                              <button
                                onClick={() => setReplacingRule(ruleIdx)}
                                className="text-xs text-orange-600 hover:text-orange-700 font-medium underline cursor-pointer"
                              >
                                Thay đổi
                              </button>
                            )}
                            {isReplacing && (
                              <button
                                onClick={() => setReplacingRule(null)}
                                className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                              >
                                Đóng
                              </button>
                            )}
                          </div>

                          {!isReplacing && selectedSelections.length > 0 && (
                            <div className="space-y-2">
                              {slots.map((slot, slotIdx) =>
                                slot.product && slot.variant ? (
                                  <SlotCard
                                    key={slotIdx}
                                    product={slot.product}
                                    variant={slot.variant}
                                    selectedCrust={slot.selection?.crust}
                                    ruleIdx={ruleIdx}
                                    onChangeVariant={handleChangeComboVariant}
                                  />
                                ) : null,
                              )}
                            </div>
                          )}

                          {(isReplacing || selectedSelections.length === 0) && products.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {products.map(product => {
                                const repVariant = product.variants[0];
                                if (!repVariant) return null;
                                const isSelected = selectedSelections.some(s => s.productId === product._id);
                                return (
                                  <button
                                    key={product._id}
                                    onClick={() => handleSelectComboProduct(ruleIdx, repVariant.sku)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                      isSelected
                                        ? "border-orange-500 bg-orange-50 ring-1 ring-orange-200"
                                        : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/30"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                                        <Image
                                          src={repVariant.image.url}
                                          alt={product.name}
                                          fill
                                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{repVariant.size}</p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {products.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Không có sản phẩm khả dụng</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-5 border-t border-border space-y-2 shrink-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground line-through">{formatVND(originalPrice)}</span>
                      <span className="text-green-600 text-xs font-medium">Tiết kiệm {formatVND(savings)}</span>
                    </div>
                    <button
                      onClick={handleAddComboToCart}
                      disabled={!allComboSelectionsFilled}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors shadow-lg ${
                        allComboSelectionsFilled
                          ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/25"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      <Plus size={18} /> Thêm combo vào giỏ - {formatVND(selectedCombo.price)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
