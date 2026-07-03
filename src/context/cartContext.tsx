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

const GUEST_CART_STORAGE_KEY = "guest_cart";

export type ProductPopulated = {
  _id: string;
  name: string;
  variants: { image: { url: string }; size: string; price: number }[];
  image?: string;
};

export type IngredientTopping = {
  _id: string;
  name: string;
  unit: string;
  category: string;
  cost_per_unit: number;
  price: number;
  image?: string;
  is_active: boolean;
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

export type CartItem = {
  item_type: CartItemType;
  product_id?: string | ProductPopulated;
  combo_id?: string;
  combo?: { _id: string; name: string; image?: string };
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

type AddToCartInput = Omit<AddToCartPayload, "userId"> & {
  userId?: string;
  product?: ProductPopulated;
  combo?: { _id: string; name: string; image?: string };
};

type UpdateQuantityInput = {
  userId?: string;
  item_type?: CartItemType;
  product_id?: string;
  combo_id?: string;
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
  combo_id?: string;
  sku: string;
  size: string;
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
  removeItem: (payload: RemoveItemInput) => Promise<void>;
  addToCart: (payload: AddToCartInput) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;
  cartCount: number;
  cartTotal: number;
  editingSku: string | null;
  setEditingSku: (sku: string | null) => void;
  editingComboId: string | null;
  setEditingComboId: (id: string | null) => void;
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

          return {
            size: normalizedVariant.size,
            price: normalizedVariant.price,
            image: {
              url: typeof normalizedVariant.image?.url === "string" ? normalizedVariant.image.url : "",
            },
          };
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

  const source = topping as Partial<IngredientTopping>;
  if (typeof source._id !== "string") {
    return null;
  }

  return {
    _id: source._id,
    name: typeof source.name === "string" ? source.name : "",
    unit: typeof source.unit === "string" ? source.unit : "",
    category: typeof source.category === "string" ? source.category : "",
    cost_per_unit: typeof source.cost_per_unit === "number" ? source.cost_per_unit : 0,
    price: typeof source.price === "number" ? source.price : 0,
    image: typeof source.image === "string" ? source.image : undefined,
    is_active: typeof source.is_active === "boolean" ? source.is_active : true,
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
      ? source.added_topping
          .map(topping => normalizeTopping(topping))
          .filter((topping): topping is ToppingRef => topping !== null)
      : [],
  };
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

  const variantBasePrice =
    normalizedProduct && typeof normalizedProduct !== "string"
      ? normalizedProduct.variants.find(variant => variant.size.toLowerCase() === source.size!.toLowerCase())?.price
      : undefined;

  const toppingTotal = sumToppingPrice(normalizedToppings);
  const finalPrice =
    source.item_type === "combo" || typeof variantBasePrice !== "number"
      ? sourcePrice
      : Math.max(sourcePrice, variantBasePrice + toppingTotal);

  return {
    item_type: source.item_type === "combo" ? "combo" : "product",
    product_id: normalizedProduct,
    combo_id: typeof source.combo_id === "string" ? source.combo_id : undefined,
    combo:
      source.combo && typeof source.combo === "object" && typeof (source.combo as Record<string, unknown>).name === "string"
        ? {
            _id: String((source.combo as Record<string, unknown>)._id || ""),
            name: String((source.combo as Record<string, unknown>).name),
            image:
              typeof (source.combo as Record<string, unknown>).image === "string"
                ? String((source.combo as Record<string, unknown>).image)
                : undefined,
          }
        : undefined,
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
const areComboSelectionsEqual = (a?: ComboSelection[], b?: ComboSelection[]): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const aSkus = [...a.map(s => s.sku)].sort();
  const bSkus = [...b.map(s => s.sku)].sort();
  return aSkus.every((sku, i) => sku === bSkus[i]);
};

const findLocalItemIndex = (
  items: CartItem[],
  params: { sku: string; size: string; productId?: string; itemType?: CartItemType; comboSelections?: ComboSelection[] },
) => {
  return items.findIndex(item => {
    if (item.sku !== params.sku || item.size !== params.size) {
      return false;
    }

    // Combo: so sánh thêm combo_selections để tách biệt các combo cùng loại nhưng chọn sản phẩm khác nhau
    if (params.itemType === "combo" || item.item_type === "combo") {
      if (!areComboSelectionsEqual(item.combo_selections, params.comboSelections)) {
        return false;
      }
      return true;
    }

    if (!params.productId) {
      return true;
    }

    return resolveProductId(item.product_id) === params.productId;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const syncGuestCartPromiseRef = useRef<Promise<boolean> | null>(null);

  const syncGuestCartToServer = useCallback(async (userId: string) => {
    if (syncGuestCartPromiseRef.current) {
      await syncGuestCartPromiseRef.current;
      return;
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

        if (itemType === "combo" && !item.combo_id) {
          hasFailure = true;
          continue;
        }

        try {
          await addToCartApi({
            userId,
            item_type: itemType,
            product_id: normalizedProductId,
            combo_id: item.combo_id,
            combo_selections: mapComboSelectionsToPayload(item.combo_selections),
            sku: item.sku,
            price: item.price,
            size: item.size,
            quantity: item.quantity,
            note: item.note,
            added_topping: extractToppingIds(item.added_topping),
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
      await syncGuestCartPromiseRef.current;
    } finally {
      syncGuestCartPromiseRef.current = null;
    }
  }, []);

  const fetchCart = useCallback(
    async (userId?: string) => {
      if (!userId) {
        const guestCart = readGuestCart();
        setCart(guestCart);
        return guestCart;
      }

      try {
        await syncGuestCartToServer(userId);
        const data = await getCart(userId);
        const normalized = data
          ? normalizeCart(data)
          : {
              _id: undefined,
              user_id: userId,
              items: [],
            };

        setCart(normalized);
        return normalized;
      } catch (error) {
        console.error("Lỗi khi tải giỏ hàng:", error);
        return null;
      }
    },
    [syncGuestCartToServer],
  );

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
      combo_id,
      combo_selections,
      combo,
    } = payload;

    try {
      if (userId) {
        const itemType: CartItemType = item_type === "combo" ? "combo" : "product";
        const updatedCart = await addToCartApi({
          userId,
          item_type: itemType,
          product_id,
          sku,
          size,
          crust,
          quantity,
          note,
          price,
          added_topping,
          combo_id,
          combo_selections,
        });

        if (updatedCart) {
          setCart(normalizeCart(updatedCart));
        }
        return;
      }

      const quantityToAdd = Math.max(1, Math.trunc(quantity ?? 1));
      const currentGuestCart = readGuestCart();
      const nextItems = [...currentGuestCart.items];
      const existingItemIndex = findLocalItemIndex(nextItems, {
        sku,
        size,
        productId: product_id,
        itemType: item_type,
        comboSelections: combo_selections,
      });

      if (existingItemIndex >= 0) {
        const existingItem = nextItems[existingItemIndex];
        nextItems[existingItemIndex] = {
          ...existingItem,
          crust: crust ?? existingItem.crust,
          quantity: existingItem.quantity + quantityToAdd,
          note: note ?? existingItem.note,
          added_topping: added_topping ?? existingItem.added_topping,
        };
      } else {
        const fallbackPrice = product?.variants.find(variant => variant.size === size)?.price ?? 0;
        nextItems.push({
          item_type: item_type ?? "product",
          product_id: item_type === "combo" ? undefined : (product ?? product_id),
          combo_id,
          combo: item_type === "combo" ? combo : undefined,
          combo_selections: item_type === "combo" ? combo_selections : undefined,
          added_topping: added_topping ?? [],
          price: typeof price === "number" ? price : fallbackPrice,
          size,
          sku,
          crust: crust || "",
          quantity: quantityToAdd,
          note: note ?? "",
        });
      }

      const nextGuestCart: Cart = {
        _id: "guest-cart",
        user_id: "guest",
        items: nextItems,
      };

      persistGuestCart(nextGuestCart);
      setCart(nextGuestCart);
    } catch (error) {
      console.error("Lỗi cập nhật giỏ hàng:", error);
    }
  }, []);

  const updateQuantity = useCallback(
    async ({ userId, item_type, product_id, combo_id, sku, size, currentQty, change, combo_selections }: UpdateQuantityInput) => {
      const newQuantity = currentQty + change;
      const itemType: CartItemType = item_type === "combo" ? "combo" : "product";
      const canUseServerMutation = !!userId && ((itemType === "combo" && !!combo_id) || (itemType === "product" && !!product_id));

      try {
        if (canUseServerMutation) {
          if (newQuantity < 1) {
            const updatedCart = await removeFromCartApi({
              userId,
              item_type: itemType,
              product_id,
              combo_id,
              size,
              sku,
            });
            setCart(normalizeCart(updatedCart));
          } else {
            const updatedCart = await updateCartItemApi({
              userId,
              item_type: itemType,
              product_id,
              combo_id,
              size,
              sku,
              quantity: newQuantity,
            });
            setCart(normalizeCart(updatedCart));
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
          return resolveProductId(item.product_id) === product_id;
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
        console.error("Lỗi cập nhật giỏ hàng:", error);
      }
    },
    [],
  );

  const removeItem = useCallback(
    async ({ userId, item_type, product_id, combo_id, sku, size, combo_selections }: RemoveItemInput) => {
      const itemType: CartItemType = item_type === "combo" ? "combo" : "product";
      const canUseServerMutation = !!userId && ((itemType === "combo" && !!combo_id) || (itemType === "product" && !!product_id));

      try {
        if (canUseServerMutation) {
          const updatedCart = await removeFromCartApi({
            userId,
            item_type: itemType,
            product_id,
            combo_id,
            size,
            sku,
          });
          setCart(normalizeCart(updatedCart));
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

          return resolveProductId(item.product_id) !== product_id;
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
    },
    [],
  );

  const clearCart = useCallback(async (userId?: string) => {
    try {
      if (userId) {
        const updatedCart = await clearCartApi(userId);
        setCart(
          updatedCart
            ? normalizeCart(updatedCart)
            : {
                _id: undefined,
                user_id: userId,
                items: [],
              },
        );
        return;
      }

      const emptyGuestCart = createEmptyGuestCart();
      persistGuestCart(emptyGuestCart);
      setCart(emptyGuestCart);
    } catch (error) {
      console.error("Lỗi xóa giỏ hàng:", error);
    }
  }, []);

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

  const value = useMemo(
    () => ({
      cart,
      showCart,
      setShowCart,
      fetchCart,
      updateQuantity,
      removeItem,
      addToCart,
      clearCart,
      cartCount,
      cartTotal,
      editingSku,
      setEditingSku,
      editingComboId,
      setEditingComboId,
      checkout,
      setCheckout,
    }),
    [
      cart,
      showCart,
      checkout,
      fetchCart,
      updateQuantity,
      removeItem,
      addToCart,
      clearCart,
      cartCount,
      cartTotal,
      editingSku,
      editingComboId,
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
