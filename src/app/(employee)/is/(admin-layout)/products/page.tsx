"use client";
import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Filter, Pizza, Eye, EyeOff, X, Trash2, Square, SquareCheckBig, Gift } from "lucide-react";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import Image from "next/image";
import { addProduct, deletedProduct, getAllProducts, updateProduct, updateStatusProduct } from "@/src/services/product.service";
import { getAllCategories } from "@/src/services/category.service";
import { getAllIngredients } from "@/src/services/ingredient.service";
import { addCombo, deletedCombo, getAllCombos, updateCombo, updateComboStatus } from "@/src/services/combo.service";
import { toast, Toaster } from "sonner";
import ProductFormModal, { ProductFormSubmitPayload } from "@/src/components/modals/ProductFormModal";
import ComboFormModal, { ComboFormSubmitPayload } from "@/src/components/modals/ComboFormModal";

interface IngredientList {
  _id: string;
  name: string;
  unit: string;
  category: string;
  is_active: boolean;
  isDeleted: boolean;
}
export interface RecipeItemPayload {
  ingredient_id: string;
  quantity: number;
  unit: string;
}

export interface VariantPayload {
  sku: string;
  size: string;
  price: number;
  disscountType?: "percent" | "amount";
  discount?: number;
  crust: string[];
  recipe: RecipeItemPayload[];
  imageFile?: File | null;
}

export interface AddProductPayload {
  name: string;
  category: string;
  description: string;
  variants: VariantPayload[];
}

type MenuCategoryUI = {
  _id: string;
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
  disscountType?: "percent" | "amount";
  discount?: number;
  crust: string[];
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

export default function Products() {
  const { user } = useEmployeeAuth();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<"products" | "combo">("products");

  // ─────────── Product States ───────────
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<MenuCategoryUI[]>([]);
  const [ingredients, setIngredients] = useState<IngredientList[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setCongirmModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─────────── Combo States ───────────
  const [comboSearch, setComboSearch] = useState("");
  const [combos, setCombos] = useState<any[]>([]);
  const [comboCategories, setComboCategories] = useState<any[]>([]);
  const [comboProducts, setComboProducts] = useState<any[]>([]);
  const [comboIsLoading, setComboIsLoading] = useState(false);

  const [comboShowModal, setComboShowModal] = useState(false);
  const [comboEditItem, setComboEditItem] = useState<any>(null);
  const [comboConfirmModal, setComboConfirmModal] = useState(false);
  const [comboSelectedIds, setComboSelectedIds] = useState<Set<string>>(new Set());

  const handleSubmit = async (payload: ProductFormSubmitPayload) => {
    setIsLoading(true);

    // Validate missing images
    const missingImage = editItem
      ? payload.variants.some((variant, index) => {
          const existingImage = editItem.variants?.[index]?.image;
          const hasExistingImage = Boolean(existingImage?.url || existingImage?.public_id);
          return !variant.imageFile && !hasExistingImage;
        })
      : payload.variants.some(v => !v.imageFile);
    if (missingImage) {
      toast.warning("Vui lòng chọn đầy đủ ảnh cho từng size!");
      setIsLoading(false);
      return;
    }

    // Validate size & price & recipe
    for (const variant of payload.variants) {
      if (!variant.size || variant.price === 0) {
        toast.warning("Vui lòng nhập đầy đủ size và giá!");
        setIsLoading(false);
        return;
      }
      if (variant.recipe.length === 0) {
        toast.warning("Vui lòng thêm công thức cho sản phẩm!");
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = editItem
        ? await updateProduct({
            product_id: editItem._id,
            name: payload.name,
            category: payload.category,
            description: payload.description,
            variants: payload.variants.map(v => ({
              sku: v.sku,
              size: v.size,
              price: v.price,
              disscountType: v.disscountType,
              discount: v.discount,
              crust: v.crust,
              recipe: v.recipe,
              image: v.image,
              imageFile: v.imageFile ?? undefined,
            })),
          })
        : await addProduct({
            name: payload.name,
            category: payload.category,
            description: payload.description,
            variants: payload.variants,
          });

      if (result) {
        toast.success(editItem ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
        setShowModal(false);
        setEditItem(null);
        setIsLoading(false);
      }
    } catch (error: any) {
      const actionLabel = editItem ? "Cập nhật" : "Tạo";
      console.error(editItem ? "Lỗi khi cập nhật sản phẩm:" : "Lỗi khi thêm sản phẩm:", error);
      toast.error(`${actionLabel} thất bại: ${error.message || "Có lỗi xảy ra"}`);
      setIsLoading(false);
    }
  };

  const fetchProductData = async () => {
    try {
      const ListProduct = await getAllProducts();
      const ListCategory = await getAllCategories();
      const ListIngredients = await getAllIngredients();
      const mappedCategories: MenuCategoryUI[] = ListCategory.filter((cat: any) => cat.is_active && !cat.isDeleted).map(
        (cat: any) => ({
          _id: cat._id,
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
        }),
      );

      const finalCategories: MenuCategoryUI[] = [
        {
          _id: "all",
          slug: "all",
          name: "Tất cả",
          icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXV0ZW5zaWxzLWNyb3NzZWQtaWNvbiBsdWNpZGUtdXRlbnNpbHMtY3Jvc3NlZCI+PHBhdGggZD0ibTE2IDItMi4zIDIuM2EzIDMgMCAwIDAgMCA0LjJsMS44IDEuOGEzIDMgMCAwIDAgNC4yIDBMMjIgOCIvPjxwYXRoIGQ9Ik0xNSAxNSAzLjMgMy4zYTQuMiA0LjIgMCAwIDAgMCA2bDcuMyA3LjNjLjcuNyAyIC43IDIuOCAwTDE1IDE1Wm0wIDAgNyA3Ii8+PHBhdGggZD0ibTIuMSAyMS44IDYuNC02LjMiLz48cGF0aCBkPSJtMTkgNS03IDciLz48L3N2Zz4=",
        },
        ...mappedCategories,
      ];
      setProducts(ListProduct);
      setCategories(finalCategories);
      setIngredients(ListIngredients);
    } catch (error) {
      return error;
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [isLoading]);

  const filtered = products.filter(
    p => (categoryFilter === "all" || p.category.slug === categoryFilter) && p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isAllSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p._id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleStatus = async (id: string) => {
    setIsLoading(true);
    try {
      await updateStatusProduct(id);
      toast.success("Cập nhật trạng thái thành công!");
      setIsLoading(false);
    } catch (e) {
      toast.error(`Lỗi: ${e}`);
      setIsLoading(false);
      return;
    }
  };
  const openCreate = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditItem(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (product_id: string) => {
    setIsLoading(true);
    try {
      await deletedProduct(product_id);
      toast.success("Xoá sản phẩm thành công!");
      setCongirmModal(false);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(product_id);
        return next;
      });
      setIsLoading(false);
    } catch (e) {
      toast.error(`Lỗi: ${e}`);
      setIsLoading(false);
      return;
    }
  };

  const handleBatchToggleStatus = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await updateStatusProduct(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (failCount === 0) {
      toast.success(`Đã cập nhật trạng thái ${successCount} sản phẩm!`);
    } else {
      toast.warning(`Đã cập nhật ${successCount} sản phẩm, ${failCount} thất bại`);
    }
    clearSelection();
    setIsLoading(false);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await deletedProduct(id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (failCount === 0) {
      toast.success(`Đã xoá ${successCount} sản phẩm!`);
    } else {
      toast.warning(`Đã xoá ${successCount} sản phẩm, ${failCount} thất bại`);
    }
    setCongirmModal(false);
    clearSelection();
    setIsLoading(false);
  };

  const fetchComboData = async () => {
    try {
      const [comboData, catData, prodData] = await Promise.all([getAllCombos(), getAllCategories(), getAllProducts()]);
      setCombos(comboData || []);
      setComboCategories((catData || []).filter((c: any) => c.is_active && !c.isDeleted));
      setComboProducts(prodData || []);
    } catch {
      toast.error("Không thể tải dữ liệu combo");
    }
  };

  useEffect(() => {
    fetchComboData();
  }, [comboIsLoading]);

  const comboFiltered = combos.filter((c: any) => c.name.toLowerCase().includes(comboSearch.toLowerCase()));

  const comboIsAllSelected = comboFiltered.length > 0 && comboFiltered.every((c: any) => comboSelectedIds.has(c._id));
  const comboClearSelection = () => setComboSelectedIds(new Set());

  const comboOpenCreate = () => {
    setComboEditItem(null);
    setComboShowModal(true);
  };

  const comboOpenEdit = (combo: any) => {
    setComboEditItem(combo);
    setComboShowModal(true);
  };

  const comboToggleSelectAll = () => {
    if (comboIsAllSelected) {
      setComboSelectedIds(new Set());
    } else {
      setComboSelectedIds(new Set(comboFiltered.map((c: any) => c._id)));
    }
  };

  const comboToggleSelectOne = (id: string) => {
    setComboSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const comboHandleSubmit = async (payload: ComboFormSubmitPayload) => {
    // Validate
    if (!payload.name) {
      toast.warning("Vui lòng nhập tên combo!");
      return;
    }
    if (!payload.dateStart || !payload.dateEnd) {
      toast.warning("Vui lòng chọn ngày bắt đầu và kết thúc!");
      return;
    }
    if (new Date(payload.dateStart) > new Date(payload.dateEnd)) {
      toast.warning("Ngày bắt đầu phải trước ngày kết thúc!");
      return;
    }
    if (payload.rules.length === 0) {
      toast.warning("Combo phải có ít nhất 1 rule!");
      return;
    }
    for (let i = 0; i < payload.rules.length; i++) {
      const r = payload.rules[i];
      if (!r.groupName.trim()) {
        toast.warning(`Rule #${i + 1}: thiếu tên nhóm!`);
        return;
      }
      if (r.applicableCategories.length === 0 && r.applicableProducts.length === 0) {
        toast.warning(`Rule #${i + 1}: phải chọn ít nhất 1 danh mục hoặc sản phẩm!`);
        return;
      }
      if (!r.requiredQuantity || r.requiredQuantity < 1) {
        toast.warning(`Rule #${i + 1}: số lượng phải >= 1!`);
        return;
      }
    }

    setComboIsLoading(true);
    try {
      // Strip imageFile for JSON, pass separately for FormData upload
      const { imageFile, ...cleanPayload } = payload;
      if (comboEditItem) {
        await updateCombo({ combo_id: comboEditItem._id, ...cleanPayload }, imageFile);
        toast.success("Cập nhật combo thành công!");
      } else {
        await addCombo(cleanPayload, imageFile);
        toast.success("Thêm combo thành công!");
      }
      setComboShowModal(false);
      setComboEditItem(null);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message || error}`);
    } finally {
      setComboIsLoading(false);
    }
  };

  const comboToggleStatus = async (id: string) => {
    setComboIsLoading(true);
    try {
      await updateComboStatus(id);
      toast.success("Cập nhật trạng thái combo thành công!");
    } catch (e) {
      toast.error(`Lỗi: ${e}`);
    } finally {
      setComboIsLoading(false);
    }
  };

  const comboHandleDelete = async (id: string) => {
    setComboIsLoading(true);
    try {
      await deletedCombo(id);
      toast.success("Xoá combo thành công!");
      setComboConfirmModal(false);
      setComboSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e: any) {
      toast.error(`Lỗi: ${e}`);
    } finally {
      setComboIsLoading(false);
    }
  };

  const comboHandleBatchToggleStatus = async () => {
    if (comboSelectedIds.size === 0) return;
    setComboIsLoading(true);
    let ok = 0;
    let fail = 0;
    for (const id of comboSelectedIds) {
      try {
        await updateComboStatus(id);
        ok++;
      } catch {
        fail++;
      }
    }
    if (fail === 0) {
      toast.success(`Đã cập nhật ${ok} combo!`);
    } else {
      toast.warning(`Đã cập nhật ${ok} combo, ${fail} thất bại`);
    }
    comboClearSelection();
    setComboIsLoading(false);
  };

  const comboHandleBatchDelete = async () => {
    if (comboSelectedIds.size === 0) return;
    setComboIsLoading(true);
    let ok = 0;
    let fail = 0;
    for (const id of comboSelectedIds) {
      try {
        await deletedCombo(id);
        ok++;
      } catch {
        fail++;
      }
    }
    if (fail === 0) {
      toast.success(`Đã xoá ${ok} combo!`);
    } else {
      toast.warning(`Đã xoá ${ok} combo, ${fail} thất bại`);
    }
    setComboConfirmModal(false);
    comboClearSelection();
    setComboIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Tạo và quản lý danh sách sản phẩm & combo" : "Ẩn/hiện sản phẩm trên menu cửa hàng"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "products" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Pizza size={16} /> Sản phẩm
          </span>
        </button>
        <button
          onClick={() => setActiveTab("combo")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "combo" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2">
            <Gift size={16} /> Combo
          </span>
        </button>
      </div>

      {activeTab === "products" && (
        <>
          <div className="flex items-center justify-end gap-3">
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-2 flex-1 transition-colors ${
                selectedIds.size > 0 ? "bg-primary/10 border border-primary/20" : "bg-transparent border border-transparent"
              }`}
            >
              {selectedIds.size > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={clearSelection}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                      title="Bỏ chọn"
                    >
                      <X size={16} />
                    </button>
                    <span className="text-sm font-medium text-foreground">
                      Đã chọn <span className="text-primary font-semibold">{selectedIds.size}</span> sản phẩm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBatchToggleStatus}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Eye size={15} />
                      <span className="hidden sm:inline">Ẩn/Hiện</span>
                    </button>
                    <button
                      onClick={() => setCongirmModal(true)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      <span className="hidden sm:inline">Xoá</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-primary text-white px-4 py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 shrink-0"
              >
                <Plus size={18} /> Thêm sản phẩm
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
              <Filter size={16} className="text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent py-2.5 text-sm outline-none text-foreground"
              >
                {categories.map(c => (
                  <option key={c.slug} value={c.slug}>
                    {c.slug === "all" ? "Tất cả danh mục" : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="w-12 px-4 py-3.5">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isAllSelected ? (
                          <SquareCheckBig size={18} className="text-primary" />
                        ) : isIndeterminate ? (
                          <SquareCheckBig size={18} className="text-primary/60" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Sản phẩm</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Danh mục</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Giá</th>
                    <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Trạng thái</th>
                    <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                        <Pizza size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                        <p className="text-sm">Không tìm thấy sản phẩm nào</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(product => {
                      const isSelected = selectedIds.has(product._id);
                      return (
                        <tr
                          key={product._id}
                          className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${!product.is_active ? "opacity-50" : ""} ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => toggleSelectOne(product._id)}
                              className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                            </button>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3.5">
                              <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden shrink-0 relative border border-border/50">
                                {product.variants[0]?.image?.url ? (
                                  <Image
                                    src={product.variants[0].image.url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Pizza size={22} className="text-muted-foreground/25" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {product.description || product.category.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-foreground/80">{product.category.name}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-semibold text-foreground">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                                product.variants[0]?.price ?? 0,
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${product.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                            >
                              {product.is_active ? "Đang bán" : "Đã ẩn"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleStatus(product._id)}
                                className={`p-2 rounded-lg transition-colors ${product.is_active ? "hover:bg-red-50 text-muted-foreground hover:text-red-500" : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-500"}`}
                                title={product.is_active ? "Ẩn sản phẩm" : "Hiện sản phẩm"}
                              >
                                {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => openEdit(product)}
                                  className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setCongirmModal(true);
                                  setEditItem(product);
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Xoá sản phẩm"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Add/Edit Modal */}
          {isAdmin && (
            <ProductFormModal
              open={showModal}
              onClose={() => setShowModal(false)}
              editItem={editItem}
              categories={categories}
              ingredients={ingredients}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
          )}

          {/* Product Confirm Delete Modal */}
          {confirmModal && (
            <>
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
                onClick={() => setCongirmModal(false)}
              >
                <div
                  className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  {selectedIds.size > 1 ? (
                    <>
                      <div className="flex flex-col gap-1">
                        <p className="text-foreground font-semibold">Xác nhận xoá nhiều sản phẩm</p>
                        <p className="text-sm text-muted-foreground">
                          Bạn có chắc chắn muốn xoá <span className="font-semibold text-red-500">{selectedIds.size}</span> sản
                          phẩm đã chọn? Hành động này không thể hoàn tác.
                        </p>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setCongirmModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                        >
                          Thoát
                        </button>
                        <button
                          onClick={handleBatchDelete}
                          disabled={isLoading}
                          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? "Đang xoá..." : `Xoá ${selectedIds.size} sản phẩm`}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-1 m-1">
                        Xác nhận xoá sản phẩm <p className="font-mono">`{editItem?.name}`</p> ?
                      </div>
                      <div className="flex gap-3 pt-3">
                        <button
                          onClick={() => setCongirmModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-red-200 text-black hover:bg-red-50 transition-colors"
                        >
                          Thoát
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteProduct(editItem?._id!);
                          }}
                          disabled={isLoading}
                          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? "Đang xoá..." : "Xác nhận"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "combo" && (
        <>
          <div className="flex items-center justify-end gap-3">
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-3 flex-1 transition-colors ${
                comboSelectedIds.size > 0 ? "bg-primary/10 border border-primary/20" : "bg-transparent border border-transparent"
              }`}
            >
              {comboSelectedIds.size > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={comboClearSelection}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                      title="Bỏ chọn"
                    >
                      <X size={16} />
                    </button>
                    <span className="text-sm font-medium text-foreground">
                      Đã chọn <span className="text-primary font-semibold">{comboSelectedIds.size}</span> combo
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={comboHandleBatchToggleStatus}
                      disabled={comboIsLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Eye size={15} />
                      <span className="hidden sm:inline">Ẩn/Hiện</span>
                    </button>
                    <button
                      onClick={() => setComboConfirmModal(true)}
                      disabled={comboIsLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      <span className="hidden sm:inline">Xoá</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={comboOpenCreate}
                className="flex items-center gap-2 bg-primary text-white px-4 py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 shrink-0"
              >
                <Plus size={18} /> Thêm combo
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={comboSearch}
              onChange={e => setComboSearch(e.target.value)}
              placeholder="Tìm kiếm combo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* Combo Table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="w-12 px-4 py-3.5">
                      <button
                        onClick={comboToggleSelectAll}
                        className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {comboIsAllSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                      </button>
                    </th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Combo</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Giá</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Giảm giá</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Thời gian</th>
                    <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Trạng thái</th>
                    <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {comboFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                        <Gift size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                        <p className="text-sm">Không tìm thấy combo nào</p>
                      </td>
                    </tr>
                  ) : (
                    comboFiltered.map((combo: any) => {
                      const isSelected = comboSelectedIds.has(combo._id);
                      return (
                        <tr
                          key={combo._id}
                          className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${!combo.is_active ? "opacity-50" : ""} ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => comboToggleSelectOne(combo._id)}
                              className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                            </button>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3.5">
                              <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden shrink-0 relative border border-border/50">
                                {combo.image ? (
                                  <Image src={combo.image} alt={combo.name} fill className="object-cover" sizes="56px" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Gift size={22} className="text-muted-foreground/25" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{combo.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {combo.description || `${combo.rules?.length || 0} rule`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-semibold text-foreground">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(combo.price ?? 0)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-foreground/80">
                              {combo.discountType === "percent"
                                ? `${combo.discount}%`
                                : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                                    combo.discount ?? 0,
                                  )}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-muted-foreground">
                              {combo.dateStart ? new Date(combo.dateStart).toLocaleDateString("vi-VN") : "—"} —{" "}
                              {combo.dateEnd ? new Date(combo.dateEnd).toLocaleDateString("vi-VN") : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${combo.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                            >
                              {combo.is_active ? "Đang bán" : "Đã ẩn"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => comboToggleStatus(combo._id)}
                                className={`p-2 rounded-lg transition-colors ${combo.is_active ? "hover:bg-red-50 text-muted-foreground hover:text-red-500" : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-500"}`}
                                title={combo.is_active ? "Ẩn combo" : "Hiện combo"}
                              >
                                {combo.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => comboOpenEdit(combo)}
                                  className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setComboConfirmModal(true);
                                  setComboEditItem(combo);
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Xoá combo"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Combo Add/Edit Modal */}
          {isAdmin && (
            <ComboFormModal
              open={comboShowModal}
              onClose={() => setComboShowModal(false)}
              editItem={comboEditItem}
              categories={comboCategories}
              products={comboProducts}
              isLoading={comboIsLoading}
              onSubmit={comboHandleSubmit}
            />
          )}

          {/* Combo Confirm Delete Modal */}
          {comboConfirmModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setComboConfirmModal(false)}
            >
              <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                {comboSelectedIds.size > 1 ? (
                  <>
                    <p className="text-foreground font-semibold">Xác nhận xoá nhiều combo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bạn có chắc chắn muốn xoá <span className="font-semibold text-red-500">{comboSelectedIds.size}</span> combo
                      đã chọn? Hành động này không thể hoàn tác.
                    </p>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setComboConfirmModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        Thoát
                      </button>
                      <button
                        onClick={comboHandleBatchDelete}
                        disabled={comboIsLoading}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors disabled:opacity-50"
                      >
                        {comboIsLoading ? "Đang xoá..." : `Xoá ${comboSelectedIds.size} combo`}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-foreground font-semibold">
                      Xác nhận xoá combo <span className="font-mono">&quot;{comboEditItem?.name}&quot;</span>?
                    </p>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setComboConfirmModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        Thoát
                      </button>
                      <button
                        onClick={() => comboEditItem && comboHandleDelete(comboEditItem._id)}
                        disabled={comboIsLoading}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors disabled:opacity-50"
                      >
                        {comboIsLoading ? "Đang xoá..." : "Xác nhận"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
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
    </div>
  );
}
