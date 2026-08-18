"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useRef } from "react";
import {
  AddToCartPayload,
  ComboSelectionPayload,
  addToCartApi,
  clearCartApi,
  getCart,
  removeFromCartApi,
  updateCartItemApi,
} from "@/src/services/cart.service";
import { getDiscountedVariantPrice } from "@/src/utils/variantPricing";

const GUEST_CART_STORAGE_KEY = "guest_cart";

export type ProductPopulated = {
  _id: string;
  name: string;
  variants: {
    image: { url: string };
    sku?: string;
    size: string;
    price: number;
    discountType?: "percent" | "amount";
    discount?: number;
  }[];
  image?: string;
};

export type IngredientTopping = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  costPerUnit: number;
  price: number;
  image?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ToppingRef = string | IngredientTopping;

export type ComboSelection = {
  product_id: string | ProductPopulated;
  sku: string;
  size: string;
  crust?: string;
  added_topping?: ToppingRef[];
};

export type CartItemType = "product" | "combo";

export type ComboPricingMeta = {
  pricingType?: "static" | "dynamic";
  discountType?: "percent" | "amount";
  discount?: number;
};

export type CartItem = {
  item_type: CartItemType;
  product_id?: string | ProductPopulated;
  combo?:
    | string
    | {
        _id: string;
        name: string;
        price?: number;
        image?: string;
        pricingType?: "static" | "dynamic";
        discountType?: "percent" | "amount";
        discount?: number;
      };
  combo_selections?: ComboSelection[];
  added_topping: ToppingRef[];
  price: number;
  size: string;
  sku: string;
  crust?: string;
  quantity: number;
  note: string;
};

export type Cart = {
  _id?: string;
  user_id?: string;
  items: CartItem[];
};

export type CartMergePrompt = {
  userId: string;
  guestItemCount: number;
  serverItemCount: number;
};

type AddToCartInput = Omit<AddToCartPayload, "userId"> & {
  userId?: string;
  product?: ProductPopulated;
  comboInfo?: {
    _id: string;
    name: string;
    image?: string;
    pricingType?: "static" | "dynamic";
    discountType?: "percent" | "amount";
    discount?: number;
  };
  price?: number;
  sku: string;
  crust?: string;
};

type UpdateQuantityInput = {
  userId?: string;
  item_type?: CartItemType;
  product_id?: string;
  combo?: string;
  sku: string;
  size: string;
  crust?: string;
  currentQty: number;
  change: number;
  combo_selections?: ComboSelection[];
};

type RemoveItemInput = {
  userId?: string;
  item_type?: CartItemType;
  product_id?: string;
  combo?: string;
  sku: string;
  size: string;
  crust?: string;
  combo_selections?: ComboSelection[];
};

interface CartContextType {
  cart: Cart | null;
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  checkout: boolean;
  setCheckout: (show: boolean) => void;
  fetchCart: (userId?: string) => Promise<Cart | null>;
  updateQuantity: (payload: UpdateQuantityInput) => Promise<void>;
  updateCartItemNote: (payload: { userId?: string; item: CartItem; note: string }) => Promise<void>;
  removeItem: (payload: RemoveItemInput) => Promise<void>;
  addToCart: (payload: AddToCartInput) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;
  removeSelectedItems: (userId?: string) => Promise<void>;
  cartCount: number;
  cartTotal: number;
  selectedCartItems: CartItem[];
  selectedCartCount: number;
  selectedCartTotal: number;
  isCartItemSelected: (item: CartItem) => boolean;
  setCartItemSelected: (item: CartItem, selected: boolean) => void;
  selectAllCartItems: () => void;
  clearCartSelection: () => void;
  pendingCartMerge: CartMergePrompt | null;
  isMergingCart: boolean;
  cartMergeError: string;
  confirmCartMerge: () => Promise<void>;
  dismissCartMerge: () => void;
  updateCartProduct: (payload: {
    userId?: string;
    item: CartItem;
    productId: string;
    sku: string;
    size: string;
    crust?: string;
    note: string;
    addedTopping: string[];
    price: number;
  }) => Promise<void>;
  editingCartItem: CartItem | null;
  setEditingCartItem: (item: CartItem | null) => void;
  editingComboItem: CartItem | null;
  setEditingComboItem: (item: CartItem | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const createEmptyGuestCart = (): Cart => ({
  _id: "guest-cart",
  user_id: "guest",
  items: [],
});

const resolveProductId = (product: string | ProductPopulated | undefined): string | undefined => {
  if (!product) return undefined;
  return typeof product === "string" ? product : product._id;
};

export const resolveComboId = (combo: string | { _id: string } | undefined): string | undefined => {
  if (!combo) return undefined;
  return typeof combo === "string" ? combo : combo._id;
};

const resolveToppingId = (topping: ToppingRef): string => (typeof topping === "string" ? topping : topping._id);

export const getCartItemKey = (item: CartItem): string => {
  const itemId = item.item_type === "combo" ? resolveComboId(item.combo) || "combo" : resolveProductId(item.product_id) || "product";
  const selectionSignature = (item.combo_selections || [])
    .map(selection =>
      [
        resolveProductId(selection.product_id) || "",
        selection.sku,
        selection.size,
        selection.crust || "",
        (selection.added_topping || []).map(resolveToppingId).sort().join(","),
      ].join(":"),
    )
    .sort()
    .join(";");

  return [item.item_type, itemId, item.sku, item.size, item.crust || "", selectionSignature].join("|");
};

const normalizeProduct = (product: unknown): string | ProductPopulated | undefined => {
  if (typeof product === "string") {
    return product;
  }

  if (!product || typeof product !== "object") {
    return undefined;
  }

  const source = product as Partial<ProductPopulated>;
  if (typeof source._id !== "string" || typeof source.name !== "string") {
    return undefined;
  }

  const variants: ProductPopulated["variants"] = Array.isArray(source.variants)
    ? source.variants
        .map(variant => {
          if (!variant || typeof variant !== "object") {
            return null;
          }

          const normalizedVariant = variant as Partial<ProductPopulated["variants"][number]>;
          if (typeof normalizedVariant.size !== "string" || typeof normalizedVariant.price !== "number") {
            return null;
          }

          const normalized: ProductPopulated["variants"][number] = {
            size: normalizedVariant.size,
            price: normalizedVariant.price,
            image: {
              url: typeof normalizedVariant.image?.url === "string" ? normalizedVariant.image.url : "",
            },
          };

          if (normalizedVariant.sku) normalized.sku = normalizedVariant.sku;
          if (normalizedVariant.discountType) normalized.discountType = normalizedVariant.discountType;
          if (typeof normalizedVariant.discount === "number") normalized.discount = normalizedVariant.discount;

          return normalized;
        })
        .filter((variant): variant is ProductPopulated["variants"][number] => variant !== null)
    : [];

  return {
    _id: source._id,
    name: source.name,
    variants,
    image: typeof source.image === "string" ? source.image : undefined,
  };
};

const normalizeTopping = (topping: unknown): ToppingRef | null => {
  if (typeof topping === "string") {
    return topping;
  }

  if (!topping || typeof topping !== "object") {
    return null;
  }

  // Hỗ trợ format từ API: { ingredient: { _id, name, price, ... }, quantity }
  const raw = topping as Record<string, unknown>;
  const ingredientData =
    raw.ingredient && typeof raw.ingredient === "object" && raw.ingredient !== null ? (raw.ingredient as Record<string, unknown>) : raw;

  const source = ingredientData as Partial<IngredientTopping>;
  if (typeof source._id !== "string") {
    return null;
  }

  return {
    _id: source._id,
    name: typeof source.name === "string" ? source.name : "",
    unit: typeof source.unit === "string" ? source.unit : "",
    category: typeof source.category === "string" ? source.category : "",
    costPerUnit: typeof source.costPerUnit === "number" ? source.costPerUnit : 0,
    price: typeof source.price === "number" ? source.price : 0,
    image: typeof source.image === "string" ? source.image : undefined,
    isActive: typeof source.isActive === "boolean" ? source.isActive : true,
    isDeleted: typeof source.isDeleted === "boolean" ? source.isDeleted : false,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : undefined,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  };
};

const extractToppingId = (topping: ToppingRef): string | undefined => {
  if (typeof topping === "string") {
    return topping;
  }
  return topping._id;
};

const extractToppingIds = (toppings: ToppingRef[] | undefined): string[] | undefined => {
  if (!toppings || !toppings.length) {
    return undefined;
  }

  const ids = toppings.map(item => extractToppingId(item)).filter((id): id is string => typeof id === "string" && !!id);
  return ids.length ? ids : undefined;
};

const sumToppingPrice = (toppings: ToppingRef[]): number => {
  return toppings.reduce((total, topping) => {
    if (typeof topping === "string") {
      return total;
    }
    return total + Number(topping.price || 0);
  }, 0);
};

const normalizeComboSelection = (selection: unknown): ComboSelection | null => {
  if (!selection || typeof selection !== "object") {
    return null;
  }

  const source = selection as Partial<ComboSelection>;
  const normalizedProduct = normalizeProduct(source.product_id);

  if (!normalizedProduct || typeof source.sku !== "string" || typeof source.size !== "string") {
    return null;
  }

  return {
    product_id: normalizedProduct,
    sku: source.sku,
    size: source.size,
    crust: typeof source.crust === "string" ? source.crust : undefined,
    added_topping: Array.isArray(source.added_topping)
      ? source.added_topping.map(topping => normalizeTopping(topping)).filter((topping): topping is ToppingRef => topping !== null)
      : [],
  };
};

// tính giá của 1 combo item từ danh sách combo_selections

const computeComboPriceFromSelections = (
  selections: ComboSelection[],
  pricingMeta?: {
    pricingType?: "static" | "dynamic";
    discountType?: "percent" | "amount";
    discount?: number;
  },
): number | null => {
  if (!selections || selections.length === 0) return null;

  // Nếu pricingType là static thì không tính
  if (pricingMeta?.pricingType === "static") return null;

  let total = 0;
  let canCompute = false;

  for (const sel of selections) {
    if (typeof sel.product_id === "string") continue; // không đủ dữ liệu
    const product = sel.product_id as ProductPopulated;
    const variant = product.variants?.find(v => v.sku === sel.sku || v.size === sel.size);
    if (variant && typeof variant.price === "number") {
      total += variant.price;
      canCompute = true;
    }
  }

  if (!canCompute) return null;

  // Áp dụng discount nếu có
  if (pricingMeta?.discountType === "percent" && pricingMeta.discount && pricingMeta.discount > 0) {
    total = Math.round(total * (1 - pricingMeta.discount / 100));
  } else if (pricingMeta?.discountType === "amount" && pricingMeta.discount && pricingMeta.discount > 0) {
    total = Math.max(0, total - pricingMeta.discount);
  }

  return total;
};

const normalizeCartItem = (item: unknown): CartItem | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const source = item as Partial<CartItem>;
  if (typeof source.sku !== "string" || typeof source.size !== "string") {
    return null;
  }

  const quantity = typeof source.quantity === "number" && source.quantity > 0 ? source.quantity : 1;
  const sourcePrice = typeof source.price === "number" ? source.price : 0;
  const normalizedProduct = normalizeProduct(source.product_id);
  const normalizedToppings = Array.isArray(source.added_topping)
    ? source.added_topping.map(topping => normalizeTopping(topping)).filter((topping): topping is ToppingRef => topping !== null)
    : [];
  const comboSelections = Array.isArray(source.combo_selections)
    ? source.combo_selections
        .map(selection => normalizeComboSelection(selection))
        .filter((selection): selection is ComboSelection => selection !== null)
    : undefined;

  const selectedVariant =
    normalizedProduct && typeof normalizedProduct !== "string"
      ? normalizedProduct.variants.find(variant => variant.size.toLowerCase() === source.size!.toLowerCase())
      : undefined;
  const variantBasePrice = selectedVariant ? getDiscountedVariantPrice(selectedVariant) : undefined;

  const toppingTotal = sumToppingPrice(normalizedToppings);

  // Chuẩn hóa combo object với đầy đủ pricing metadata
  const comboObj =
    source.combo && typeof source.combo === "object" && typeof (source.combo as Record<string, unknown>).name === "string"
      ? (source.combo as Record<string, unknown>)
      : null;
  const normalizedCombo = comboObj
    ? {
        _id: String(comboObj._id || ""),
        name: String(comboObj.name),
        price: typeof comboObj.price === "number" ? Number(comboObj.price) : undefined,
        image: typeof comboObj.image === "string" ? String(comboObj.image) : undefined,
        pricingType:
          comboObj.pricingType === "static" || comboObj.pricingType === "dynamic"
            ? (comboObj.pricingType as "static" | "dynamic")
            : undefined,
        discountType:
          comboObj.discountType === "percent" || comboObj.discountType === "amount"
            ? (comboObj.discountType as "percent" | "amount")
            : undefined,
        discount: typeof comboObj.discount === "number" ? Number(comboObj.discount) : undefined,
      }
    : typeof source.combo === "string"
      ? source.combo
      : undefined;

  // Tính finalPrice cho combo item
  let finalPrice: number;
  if (source.item_type === "combo") {
    // Nếu giá từ source > 0 thì dùng luôn
    if (sourcePrice > 0) {
      finalPrice = sourcePrice;
    } else {
      // Fallback: tính từ combo_selections nếu có đủ dữ liệu
      const pricingMeta =
        typeof normalizedCombo === "object" && normalizedCombo !== null
          ? {
              pricingType: (normalizedCombo as { pricingType?: "static" | "dynamic" }).pricingType,
              discountType: (normalizedCombo as { discountType?: "percent" | "amount" }).discountType,
              discount: (normalizedCombo as { discount?: number }).discount,
            }
          : undefined;
      const computedPrice = comboSelections ? computeComboPriceFromSelections(comboSelections, pricingMeta) : null;
      finalPrice = computedPrice ?? sourcePrice;
    }
  } else {
    finalPrice = typeof variantBasePrice !== "number" ? sourcePrice : variantBasePrice + toppingTotal;
  }

  return {
    item_type: source.item_type === "combo" ? "combo" : "product",
    product_id: normalizedProduct,
    combo: normalizedCombo,
    combo_selections: comboSelections,
    added_topping: normalizedToppings,
    price: finalPrice,
    size: source.size,
    sku: source.sku,
    crust: typeof source.crust === "string" ? source.crust : undefined,
    quantity,
    note: typeof source.note === "string" ? source.note : "",
  };
};

const normalizeCart = (raw: unknown): Cart => {
  if (!raw || typeof raw !== "object") {
    return createEmptyGuestCart();
  }

  const source = raw as Partial<Cart>;
  const items = Array.isArray(source.items)
    ? source.items.map(item => normalizeCartItem(item)).filter((item): item is CartItem => item !== null)
    : [];

  return {
    _id: typeof source._id === "string" ? source._id : undefined,
    user_id: typeof source.user_id === "string" ? source.user_id : undefined,
    items,
  };
};

const readGuestCart = (): Cart => {
  if (typeof window === "undefined") {
    return createEmptyGuestCart();
  }

  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) {
      return createEmptyGuestCart();
    }

    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeCart(parsed);
    return {
      ...normalized,
      _id: "guest-cart",
      user_id: "guest",
    };
  } catch {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return createEmptyGuestCart();
  }
};

const persistGuestCart = (cart: Cart) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: Cart = {
    _id: "guest-cart",
    user_id: "guest",
    items: cart.items,
  };

  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(payload));
};

/** So sánh 2 danh sách combo_selections dựa trên sku đã chọn */
export const areComboSelectionsEqual = <T extends { sku: string }>(a?: T[], b?: T[]): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const aSkus = [...a.map(s => s.sku)].sort();
  const bSkus = [...b.map(s => s.sku)].sort();
  return aSkus.every((sku, i) => sku === bSkus[i]);
};

const findLocalItemIndex = (
  items: CartItem[],
  params: {
    sku: string;
    size: string;
    productId?: string;
    itemType?: CartItemType;
    crust?: string;
    comboSelections?: ComboSelection[];
  },
) => {
  return items.findIndex(item => {
    if (item.sku !== params.sku || item.size !== params.size) {
      return false;
    }

    // so sánh thêm combo_selections để tách biệt các combo cùng loại nhưng chọn sản phẩm khác nhau
    if (params.itemType === "combo" || item.item_type === "combo") {
      if (!areComboSelectionsEqual(item.combo_selections, params.comboSelections)) {
        return false;
      }
      return true;
    }

    if (!params.productId) {
      return true;
    }

    return resolveProductId(item.product_id) === params.productId && (item.crust || "") === (params.crust || "");
  });
};

const mapComboSelectionsToPayload = (selections: ComboSelection[] | undefined): ComboSelectionPayload[] | undefined => {
  if (!selections || !selections.length) {
    return undefined;
  }

  const mappedSelections = selections
    .map(selection => {
      const productId = resolveProductId(selection.product_id);
      if (!productId) {
        return null;
      }

      const payload: ComboSelectionPayload = {
        product_id: productId,
        sku: selection.sku,
        size: selection.size,
        added_topping: extractToppingIds(selection.added_topping),
      };
      if (selection.crust !== undefined) {
        payload.crust = selection.crust;
      }
      return payload;
    })
    .filter((selection): selection is ComboSelectionPayload => selection !== null);

  return mappedSelections.length ? mappedSelections : undefined;
};

/**
 * Merge combo items from a freshly-normalized cart with data from the previous cart state.
 * Preserves combo metadata (pricingType, discountType, discount) and price for dynamic combos
 * when the API returns incomplete data (price=0).
 */
const mergeComboDataFromPrevCart = (normalized: Cart, prevCart: Cart | null): Cart => {
  if (!prevCart) return normalized;
  return {
    ...normalized,
    items: normalized.items.map(item => {
      if (item.item_type !== "combo") return item;
      const itemComboId = resolveComboId(item.combo);
      // Tìm item khớp trong prevCart theo combo ID + selections
      const prevItem = prevCart.items.find(
        p =>
          p.item_type === "combo" &&
          resolveComboId(p.combo) === itemComboId &&
          areComboSelectionsEqual(p.combo_selections, item.combo_selections),
      );
      if (!prevItem) return item;
      // Preserve combo info (including pricing metadata)
      const comboMerged = prevItem.combo && typeof prevItem.combo === "object" && prevItem.combo !== null ? prevItem.combo : item.combo;
      // Preserve price if API returned 0 but we previously had a valid price
      const priceMerged = item.price === 0 && prevItem.price > 0 ? prevItem.price : item.price;
      return { ...item, combo: comboMerged, price: priceMerged };
    }),
  };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editingComboItem, setEditingComboItem] = useState<CartItem | null>(null);
  const [excludedCartItemKeys, setExcludedCartItemKeys] = useState<Set<string>>(new Set());
  const [pendingCartMerge, setPendingCartMerge] = useState<CartMergePrompt | null>(null);
  const [isMergingCart, setIsMergingCart] = useState(false);
  const [cartMergeError, setCartMergeError] = useState("");
  const syncGuestCartPromiseRef = useRef<Promise<boolean> | null>(null);
  const cartRef = useRef<Cart | null>(null);
  const cartOwnerRef = useRef<string | null>(null);
  const mergePromptedUserRef = useRef<string | null>(null);

  cartRef.current = cart;

  const syncGuestCartToServer = useCallback(async (userId: string) => {
    if (syncGuestCartPromiseRef.current) {
      return await syncGuestCartPromiseRef.current;
    }

    syncGuestCartPromiseRef.current = (async () => {
      const guestCart = readGuestCart();
      if (!guestCart.items.length) {
        return true;
      }

      let hasFailure = false;

      for (const item of guestCart.items) {
        const itemType: CartItemType = item.item_type === "combo" ? "combo" : "product";
        const normalizedProductId = resolveProductId(item.product_id);

        // product item bắt buộc có product_id hợp lệ để backend map đúng product variant
        if (itemType === "product" && !normalizedProductId) {
          hasFailure = true;
          continue;
        }

        const resolvedCombo = resolveComboId(item.combo);
        if (itemType === "combo" && !resolvedCombo) {
          hasFailure = true;
          continue;
        }

        try {
          await addToCartApi({
            userId,
            item_type: itemType,
            product_id: normalizedProductId,
            combo: resolvedCombo,
            combo_selections: mapComboSelectionsToPayload(item.combo_selections),
            sku: itemType === "product" ? item.sku : undefined,
            size: item.size,
            crust: itemType === "product" ? item.crust || undefined : undefined,
            quantity: item.quantity,
            note: item.note,
            added_topping: extractToppingIds(item.added_topping),
            price: itemType === "combo" ? item.price : undefined,
            merge: true,
          });
        } catch {
          hasFailure = true;
        }
      }

      if (!hasFailure) {
        const emptyGuestCart = createEmptyGuestCart();
        persistGuestCart(emptyGuestCart);
      }

      return !hasFailure;
    })();

    try {
      return await syncGuestCartPromiseRef.current;
    } finally {
      syncGuestCartPromiseRef.current = null;
    }
  }, []);

  const fetchCart = useCallback(async (userId?: string) => {
    if (!userId) {
      if (cartOwnerRef.current !== "guest") {
        cartOwnerRef.current = "guest";
        setExcludedCartItemKeys(new Set());
      }
      mergePromptedUserRef.current = null;
      setPendingCartMerge(null);
      setCartMergeError("");
      const guestCart = readGuestCart();
      cartRef.current = guestCart;
      setCart(guestCart);
      return guestCart;
    }

    try {
      if (cartOwnerRef.current !== userId) {
        cartOwnerRef.current = userId;
        setExcludedCartItemKeys(new Set());
      }
      const prevCart = cartRef.current;
      const data = await getCart(userId);

      const normalized = data
        ? normalizeCart(data)
        : {
            _id: undefined,
            user_id: userId,
            items: [],
          };

      if (prevCart) {
        normalized.items = normalized.items.map(item => {
          if (item.item_type === "combo") {
            // Match by combo ID + selections for more reliable identification
            const itemComboId = resolveComboId(item.combo);
            const prevItem = prevCart.items.find(
              p =>
                p.item_type === "combo" &&
                resolveComboId(p.combo) === itemComboId &&
                areComboSelectionsEqual(p.combo_selections, item.combo_selections),
            );
            if (prevItem) {
              // Preserve combo info (including pricing metadata) from previous cart state
              const comboFromPrev =
                prevItem.combo && typeof prevItem.combo === "object" && prevItem.combo !== null
                  ? prevItem.combo
                  : resolveComboId(item.combo)
                    ? item.combo
                    : prevItem.combo;
              // Preserve price if API returned 0 but we previously had a valid price
              const priceToKeep = item.price === 0 && prevItem.price > 0 ? prevItem.price : item.price;
              return { ...item, combo: comboFromPrev, price: priceToKeep };
            }
          }
          return item;
        });
      }

      cartRef.current = normalized;
      setCart(normalized);

      const guestCart = readGuestCart();
      if (guestCart.items.length === 0) {
        mergePromptedUserRef.current = null;
        setPendingCartMerge(null);
        setCartMergeError("");
      } else if (mergePromptedUserRef.current !== userId) {
        mergePromptedUserRef.current = userId;
        setPendingCartMerge({
          userId,
          guestItemCount: guestCart.items.reduce((total, item) => total + item.quantity, 0),
          serverItemCount: normalized.items.reduce((total, item) => total + item.quantity, 0),
        });
        setCartMergeError("");
      }

      return normalized;
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
      return null;
    }
  }, []);

  const dismissCartMerge = useCallback(() => {
    setPendingCartMerge(null);
    setCartMergeError("");
  }, []);

  const confirmCartMerge = useCallback(async () => {
    if (!pendingCartMerge || isMergingCart) return;

    setIsMergingCart(true);
    setCartMergeError("");

    try {
      const merged = await syncGuestCartToServer(pendingCartMerge.userId);
      if (!merged) {
        setCartMergeError("Một số món không thể gộp. Giỏ trên thiết bị vẫn được giữ để bạn thử lại.");
        return;
      }

      const data = await getCart(pendingCartMerge.userId);
      if (!data) {
        throw new Error("Không thể tải lại giỏ hàng sau khi gộp.");
      }

      const normalized = normalizeCart(data);
      cartRef.current = normalized;
      setCart(normalized);
      setExcludedCartItemKeys(new Set());
      setPendingCartMerge(null);
    } catch (error) {
      setCartMergeError(error instanceof Error ? error.message : "Không thể gộp giỏ hàng. Vui lòng thử lại.");
    } finally {
      setIsMergingCart(false);
    }
  }, [isMergingCart, pendingCartMerge, syncGuestCartToServer]);

  const addToCart = useCallback(async (payload: AddToCartInput) => {
    const {
      userId,
      product,
      product_id,
      sku,
      size,
      crust,
      quantity,
      note,
      price,
      item_type,
      added_topping,
      combo: comboId,
      combo_selections,
      comboInfo,
    } = payload;

    try {
      if (userId) {
        const itemType: CartItemType = item_type === "combo" ? "combo" : "product";
        const updatedCart = await addToCartApi({
          userId,
          item_type: itemType,
          product_id,
          size,
          sku: itemType === "product" ? sku : undefined,
          crust: itemType === "product" ? crust : undefined,
          quantity,
          note,
          added_topping,
          combo: comboId,
          combo_selections,
          price: price,
        });

        if (updatedCart) {
          const normalized = normalizeCart(updatedCart);
          if (item_type === "combo" && comboId) {
            const builtCombo =
              comboInfo && typeof comboInfo === "object"
                ? {
                    _id: comboInfo._id,
                    name: comboInfo.name,
                    image: comboInfo.image,
                    pricingType: comboInfo.pricingType,
                    discountType: comboInfo.discountType,
                    discount: comboInfo.discount,
                  }
                : undefined;
            normalized.items = normalized.items.map(item => {
              if (item.item_type !== "combo") return item;
              const itemComboId = resolveComboId(item.combo);
              if (itemComboId !== comboId) return item;
              if (!areComboSelectionsEqual(item.combo_selections, combo_selections)) return item;
              // Preserve combo pricing metadata
              const preservedCombo = builtCombo ?? (typeof item.combo === "object" && item.combo !== null ? { ...item.combo } : comboId);
              // Preserve price if API returned 0 but we have a valid computed price
              const preservedPrice = typeof price === "number" && price > 0 && item.price === 0 ? price : item.price;
              return { ...item, combo: preservedCombo, price: preservedPrice };
            });
          }
          cartRef.current = normalized;
          setCart(normalized);
        }
        return;
      }

      const currentGuestCart = readGuestCart();
      const nextItems = [...currentGuestCart.items];
      const existingItemIndex = findLocalItemIndex(nextItems, {
        sku,
        size,
        productId: product_id,
        itemType: item_type,
        crust,
        comboSelections: combo_selections,
      });

      if (existingItemIndex >= 0) {
        const existingItem = nextItems[existingItemIndex];
        nextItems[existingItemIndex] = {
          ...existingItem,
          crust: crust ?? existingItem.crust,
          quantity: existingItem.quantity,
          note: note ?? existingItem.note,
          added_topping: added_topping ?? existingItem.added_topping,
        };
      } else {
        const fallbackVariant = product?.variants.find(variant => variant.size === size);
        const fallbackPrice = fallbackVariant ? getDiscountedVariantPrice(fallbackVariant) : 0;
        nextItems.push({
          item_type: item_type ?? "product",
          product_id: item_type === "combo" ? undefined : (product ?? product_id),
          combo: item_type === "combo" ? (comboInfo ?? comboId) : undefined,
          combo_selections: item_type === "combo" ? combo_selections : undefined,
          added_topping: added_topping ?? [],
          price: typeof price === "number" ? price : fallbackPrice,
          size,
          sku,
          crust: crust || "",
          quantity: 1,
          note: note ?? "",
        });
      }

      const nextGuestCart: Cart = {
        _id: "guest-cart",
        user_id: "guest",
        items: nextItems,
      };

      persistGuestCart(nextGuestCart);
      cartRef.current = nextGuestCart;
      setCart(nextGuestCart);
    } catch (error) {
      console.error("Lỗi cập nhật giỏ hàng:", error);
    }
  }, []);

  const updateCartProduct = useCallback(
    async ({
      userId,
      item,
      productId,
      sku,
      size,
      crust,
      note,
      addedTopping,
      price,
    }: {
      userId?: string;
      item: CartItem;
      productId: string;
      sku: string;
      size: string;
      crust?: string;
      note: string;
      addedTopping: string[];
      price: number;
    }) => {
      try {
        if (userId) {
          const updatedCart = await updateCartItemApi({
            userId,
            item_type: "product",
            product_id: productId,
            sku: item.sku,
            size: item.size,
            crust: item.crust,
            new_sku: sku,
            new_size: size,
            new_crust: crust || "",
            note,
            added_topping: addedTopping,
          });
          const normalized = normalizeCart(updatedCart);
          cartRef.current = normalized;
          setCart(normalized);
          return;
        }

        const currentGuestCart = readGuestCart();
        const targetIndex = currentGuestCart.items.findIndex(
          candidate =>
            candidate.item_type === "product" &&
            item.item_type === "product" &&
            resolveProductId(candidate.product_id) === productId &&
            candidate.sku === item.sku &&
            candidate.size === item.size &&
            (candidate.crust || "") === (item.crust || ""),
        );

        if (targetIndex === -1) return;

        const nextItems = [...currentGuestCart.items];
        nextItems[targetIndex] = {
          ...nextItems[targetIndex],
          sku,
          size,
          crust: crust || "",
          note,
          added_topping: addedTopping,
          price,
        };

        const nextGuestCart: Cart = {
          ...currentGuestCart,
          items: nextItems,
        };
        persistGuestCart(nextGuestCart);
        cartRef.current = nextGuestCart;
        setCart(nextGuestCart);
      } catch (error) {
        console.error("Lỗi cập nhật sản phẩm trong giỏ hàng:", error);
        throw error;
      }
    },
    [],
  );

  const updateCartItemNote = useCallback(
    async ({ userId, item, note }: { userId?: string; item: CartItem; note: string }) => {
      try {
        if (userId) {
          const updatedCart = await updateCartItemApi({
            userId,
            item_type: item.item_type,
            product_id: resolveProductId(item.product_id),
            combo: resolveComboId(item.combo),
            sku: item.sku,
            size: item.size,
            crust: item.item_type === "product" ? item.crust : undefined,
            note,
            combo_selections: item.item_type === "combo" ? (mapComboSelectionsToPayload(item.combo_selections) ?? []) : undefined,
          });
          const normalized = normalizeCart(updatedCart);
          cartRef.current = normalized;
          setCart(normalized);
          return;
        }

        const currentGuestCart = readGuestCart();
        const targetIndex = currentGuestCart.items.findIndex(candidate => getCartItemKey(candidate) === getCartItemKey(item));
        if (targetIndex === -1) return;

        const nextGuestCart: Cart = {
          ...currentGuestCart,
          items: currentGuestCart.items.map((candidate, index) => (index === targetIndex ? { ...candidate, note } : candidate)),
        };
        persistGuestCart(nextGuestCart);
        cartRef.current = nextGuestCart;
        setCart(nextGuestCart);
      } catch (error) {
        console.error("Lỗi cập nhật ghi chú giỏ hàng:", error);
        throw error;
      }
    },
    [],
  );

  const updateQuantity = useCallback(
    async ({ userId, item_type, product_id, combo, sku, size, crust, currentQty, change, combo_selections }: UpdateQuantityInput) => {
      const newQuantity = currentQty + change;
      const itemType: CartItemType = item_type === "combo" ? "combo" : "product";
      // Resolve combo id from current cart if not provided (API may strip it)
      let resolvedComboId = combo;
      if (itemType === "combo" && !resolvedComboId && userId) {
        const cartItem = cartRef.current?.items.find(i => i.sku === sku && i.item_type === "combo" && resolveComboId(i.combo));
        resolvedComboId = resolveComboId(cartItem?.combo);
      }
      const canUseServerMutation = !!userId && ((itemType === "combo" && !!resolvedComboId) || (itemType === "product" && !!product_id));

      try {
        if (canUseServerMutation) {
          // Luôn gửi combo_selections cho combo để backend phân biệt các instance khác nhau
          const comboSelectionsPayload = itemType === "combo" ? (mapComboSelectionsToPayload(combo_selections) ?? []) : undefined;
          if (newQuantity < 1) {
            const updatedCart = await removeFromCartApi({
              userId,
              item_type: itemType,
              product_id,
              combo: resolvedComboId,
              sku,
              size,
              crust: itemType === "product" ? crust : undefined,
              combo_selections: comboSelectionsPayload,
            });
            const normalized = normalizeCart(updatedCart);
            setCart(mergeComboDataFromPrevCart(normalized, cartRef.current));
          } else {
            const updatedCart = await updateCartItemApi({
              userId,
              item_type: itemType,
              product_id,
              combo: resolvedComboId,
              sku,
              size,
              crust: itemType === "product" ? crust : undefined,
              quantity: newQuantity,
              combo_selections: comboSelectionsPayload,
            });
            const normalized = normalizeCart(updatedCart);
            setCart(mergeComboDataFromPrevCart(normalized, cartRef.current));
          }
          return;
        }

        const currentGuestCart = readGuestCart();
        const nextItems = [...currentGuestCart.items];
        // Tìm item khớp: với combo cần so sánh cả combo_selections
        const targetIndex = nextItems.findIndex(item => {
          if (item.sku !== sku || item.size !== size) return false;
          if (item.item_type === "combo" || item_type === "combo") {
            return areComboSelectionsEqual(item.combo_selections, combo_selections);
          }
          if (!product_id) return true;
          return resolveProductId(item.product_id) === product_id && (item.crust || "") === (crust || "");
        });

        if (targetIndex === -1) {
          return;
        }

        if (newQuantity < 1) {
          nextItems.splice(targetIndex, 1);
        } else {
          nextItems[targetIndex] = {
            ...nextItems[targetIndex],
            quantity: newQuantity,
          };
        }

        const nextGuestCart: Cart = {
          _id: "guest-cart",
          user_id: "guest",
          items: nextItems,
        };

        persistGuestCart(nextGuestCart);
        setCart(nextGuestCart);
      } catch (error) {
        console.error("Lỗi cập nhật giỏ hàng: ", error);
      }
    },
    [],
  );

  const removeItem = useCallback(async ({ userId, item_type, product_id, combo, sku, size, crust, combo_selections }: RemoveItemInput) => {
    const itemType: CartItemType = item_type === "combo" ? "combo" : "product";
    // Resolve combo id from current cart if not provided (API may strip it)
    let resolvedComboId = combo;
    if (itemType === "combo" && !resolvedComboId && userId) {
      const cartItem = cartRef.current?.items.find(i => i.sku === sku && i.item_type === "combo" && resolveComboId(i.combo));
      resolvedComboId = resolveComboId(cartItem?.combo);
    }
    const canUseServerMutation = !!userId && ((itemType === "combo" && !!resolvedComboId) || (itemType === "product" && !!product_id));

    try {
      if (canUseServerMutation) {
        const updatedCart = await removeFromCartApi({
          userId,
          item_type: itemType,
          product_id,
          combo: resolvedComboId,
          sku,
          size,
          crust: itemType === "product" ? crust : undefined,
          combo_selections: itemType === "combo" ? (mapComboSelectionsToPayload(combo_selections) ?? []) : undefined,
        });
        const normalized = normalizeCart(updatedCart);
        cartRef.current = mergeComboDataFromPrevCart(normalized, cartRef.current);
        setCart(cartRef.current);
        return;
      }

      const currentGuestCart = readGuestCart();
      const nextItems = currentGuestCart.items.filter(item => {
        if (item.sku !== sku || item.size !== size) {
          return true; // keep items that don't match sku/size
        }

        // Combo: chỉ xoá item có combo_selections khớp
        if (item.item_type === "combo" || item_type === "combo") {
          return !areComboSelectionsEqual(item.combo_selections, combo_selections);
        }

        if (!product_id) {
          return false; // remove if no product_id to compare
        }

        return resolveProductId(item.product_id) !== product_id || (item.crust || "") !== (crust || "");
      });

      const nextGuestCart: Cart = {
        _id: "guest-cart",
        user_id: "guest",
        items: nextItems,
      };

      persistGuestCart(nextGuestCart);
      setCart(nextGuestCart);
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  }, []);

  const clearCart = useCallback(async (userId?: string) => {
    try {
      if (userId) {
        const updatedCart = await clearCartApi(userId);
        const normalized = updatedCart
          ? normalizeCart(updatedCart)
          : {
              _id: undefined,
              user_id: userId,
              items: [],
            };
        cartRef.current = normalized;
        setCart(normalized);
        setExcludedCartItemKeys(new Set());
        return;
      }

      const emptyGuestCart = createEmptyGuestCart();
      persistGuestCart(emptyGuestCart);
      cartRef.current = emptyGuestCart;
      setCart(emptyGuestCart);
      setExcludedCartItemKeys(new Set());
    } catch (error) {
      console.error("Lỗi xóa giỏ hàng:", error);
    }
  }, []);

  const selectedCartItems = useMemo(
    () => (cart?.items || []).filter(item => !excludedCartItemKeys.has(getCartItemKey(item))),
    [cart?.items, excludedCartItemKeys],
  );

  const isCartItemSelected = useCallback((item: CartItem) => !excludedCartItemKeys.has(getCartItemKey(item)), [excludedCartItemKeys]);

  const setCartItemSelected = useCallback((item: CartItem, selected: boolean) => {
    const key = getCartItemKey(item);
    setExcludedCartItemKeys(previous => {
      const next = new Set(previous);
      if (selected) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAllCartItems = useCallback(() => {
    setExcludedCartItemKeys(new Set());
  }, []);

  const clearCartSelection = useCallback(() => {
    setExcludedCartItemKeys(new Set((cartRef.current?.items || []).map(getCartItemKey)));
  }, []);

  const removeSelectedItems = useCallback(
    async (userId?: string) => {
      const itemsToRemove = selectedCartItems;
      if (!itemsToRemove.length) return;

      if (userId) {
        let latestCart: unknown = null;

        for (const item of itemsToRemove) {
          const itemType: CartItemType = item.item_type === "combo" ? "combo" : "product";
          latestCart = await removeFromCartApi({
            userId,
            item_type: itemType,
            product_id: resolveProductId(item.product_id),
            combo: resolveComboId(item.combo),
            sku: item.sku,
            size: item.size,
            combo_selections: itemType === "combo" ? (mapComboSelectionsToPayload(item.combo_selections) ?? []) : undefined,
          });
        }

        const normalized = normalizeCart(latestCart);
        cartRef.current = normalized;
        setCart(normalized);
      } else {
        const selectedKeys = new Set(itemsToRemove.map(getCartItemKey));
        const currentGuestCart = readGuestCart();
        const nextGuestCart: Cart = {
          ...currentGuestCart,
          items: currentGuestCart.items.filter(item => !selectedKeys.has(getCartItemKey(item))),
        };
        persistGuestCart(nextGuestCart);
        cartRef.current = nextGuestCart;
        setCart(nextGuestCart);
      }

      setExcludedCartItemKeys(new Set());
    },
    [selectedCartItems],
  );

  const { cartCount, cartTotal } = useMemo(() => {
    if (!cart || !cart.items) return { cartCount: 0, cartTotal: 0 };
    return cart.items.reduce(
      (acc, item) => ({
        cartCount: acc.cartCount + item.quantity,
        cartTotal: acc.cartTotal + item.price * item.quantity,
      }),
      { cartCount: 0, cartTotal: 0 },
    );
  }, [cart]);

  const { selectedCartCount, selectedCartTotal } = useMemo(
    () =>
      selectedCartItems.reduce(
        (totals, item) => ({
          selectedCartCount: totals.selectedCartCount + item.quantity,
          selectedCartTotal: totals.selectedCartTotal + item.price * item.quantity,
        }),
        { selectedCartCount: 0, selectedCartTotal: 0 },
      ),
    [selectedCartItems],
  );

  const value = useMemo(
    () => ({
      cart,
      showCart,
      setShowCart,
      fetchCart,
      updateQuantity,
      updateCartItemNote,
      removeItem,
      addToCart,
      updateCartProduct,
      clearCart,
      removeSelectedItems,
      cartCount,
      cartTotal,
      selectedCartItems,
      selectedCartCount,
      selectedCartTotal,
      isCartItemSelected,
      setCartItemSelected,
      selectAllCartItems,
      clearCartSelection,
      pendingCartMerge,
      isMergingCart,
      cartMergeError,
      confirmCartMerge,
      dismissCartMerge,
      editingCartItem,
      setEditingCartItem,
      editingComboItem,
      setEditingComboItem,
      checkout,
      setCheckout,
    }),
    [
      cart,
      showCart,
      checkout,
      fetchCart,
      updateQuantity,
      updateCartItemNote,
      removeItem,
      addToCart,
      updateCartProduct,
      clearCart,
      removeSelectedItems,
      cartCount,
      cartTotal,
      selectedCartItems,
      selectedCartCount,
      selectedCartTotal,
      isCartItemSelected,
      setCartItemSelected,
      selectAllCartItems,
      clearCartSelection,
      pendingCartMerge,
      isMergingCart,
      cartMergeError,
      confirmCartMerge,
      dismissCartMerge,
      editingCartItem,
      editingComboItem,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng bên trong CartProvider");
  }
  return context;
}
