"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  Store,
  Pizza,
  Gift,
  Save,
  RefreshCw,
  Square,
  SquareCheckBig,
  Building2,
  Check,
  ArrowLeftRight,
} from "lucide-react";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import Image from "next/image";
import { toast, Toaster } from "sonner";
import { getMenuByStoreId, updateMenu, createMenu, getAllCombos, applyMenuToStores } from "@/src/services/menu.service";
import { getAllProductsActive } from "@/src/services/product.service";
import { getAllStore } from "@/src/services/store.service";

// ─── Helpers ───────────────────────────────────────────
const normalizeMenuProducts = menu => {
  if (!menu?.products?.length) return [];
  return menu.products.map(p => (typeof p === "string" ? p : p._id));
};

const normalizeMenuCombos = menu => {
  if (!menu?.combos?.length) return [];
  return menu.combos.map(entry => (typeof entry === "string" ? entry : entry.combo?._id || entry._id));
};

// ─── Page ──────────────────────────────────────────────
export default function MenuManagement() {
  const { user } = useEmployeeAuth();
  const isAdmin = user?.role === "admin";

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [menu, setMenu] = useState(null);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);

  // IDs được chọn (các product/combo sẽ có trong menu)
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [selectedComboIds, setSelectedComboIds] = useState(new Set());

  const [productSearch, setProductSearch] = useState("");
  const [comboSearch, setComboSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("products"); // "products" | "combos"

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Multi-store mode ──────────────────────────────────
  const [multiStoreMode, setMultiStoreMode] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState(new Set());
  const [storeSearch, setStoreSearch] = useState("");

  // ─── Fetch initial data ──────────────────────────────
  const fetchStores = useCallback(async () => {
    try {
      const data = await getAllStore();
      const activeStores = (data || []).filter(s => !s.isDeleted);
      setStores(activeStores);
      if (activeStores.length > 0 && !selectedStoreId) {
        setSelectedStoreId(activeStores[0]._id);
      }
    } catch {
      toast.error("Không thể tải danh sách cửa hàng");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getAllProductsActive();
      setProducts(data || []);
    } catch {
      toast.error("Không thể tải danh sách sản phẩm");
    }
  }, []);

  const fetchCombos = useCallback(async () => {
    try {
      const data = await getAllCombos();
      setCombos(data || []);
    } catch {
      // Combos endpoint might not exist yet
      setCombos([]);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchCombos();
  }, [fetchStores, fetchProducts, fetchCombos]);

  // ─── Load menu khi chọn store ────────────────────────
  const loadMenu = useCallback(async storeId => {
    if (!storeId) {
      setMenu(null);
      setSelectedProductIds(new Set());
      setSelectedComboIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const data = await getMenuByStoreId(storeId);
      setMenu(data);
      setSelectedProductIds(new Set(normalizeMenuProducts(data)));
      setSelectedComboIds(new Set(normalizeMenuCombos(data)));
    } catch {
      toast.error("Không thể tải menu của cửa hàng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu(selectedStoreId);
  }, [selectedStoreId, loadMenu]);

  // ─── Multi-store helpers ─────────────────────────────
  const toggleStoreSelection = storeId => {
    setSelectedStoreIds(prev => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      return next;
    });
  };

  const toggleAllStores = () => {
    const filtered = stores.filter(s => s.name?.toLowerCase().includes(storeSearch.toLowerCase()));
    const allSelected = filtered.every(s => selectedStoreIds.has(s._id));
    setSelectedStoreIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach(s => next.delete(s._id));
      } else {
        filtered.forEach(s => next.add(s._id));
      }
      return next;
    });
  };

  const switchMode = () => {
    setMultiStoreMode(prev => !prev);
    // Reset selections when switching mode
    setSelectedStoreIds(new Set());
    if (!multiStoreMode) {
      // Switching TO multi-store: clear single store selection
      setSelectedStoreId("");
      setMenu(null);
      setSelectedProductIds(new Set());
      setSelectedComboIds(new Set());
    }
  };

  // ─── Toggle item ─────────────────────────────────────
  const toggleProduct = productId => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleCombo = comboId => {
    setSelectedComboIds(prev => {
      const next = new Set(prev);
      if (next.has(comboId)) {
        next.delete(comboId);
      } else {
        next.add(comboId);
      }
      return next;
    });
  };

  const toggleAllProducts = () => {
    const filteredIds = new Set(filteredProducts.map(p => p._id));
    const allSelected = filteredProducts.every(p => selectedProductIds.has(p._id));
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filteredIds.forEach(id => next.delete(id));
      } else {
        filteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleAllCombos = () => {
    const filteredIds = new Set(filteredCombos.map(c => c._id));
    const allSelected = filteredCombos.every(c => selectedComboIds.has(c._id));
    setSelectedComboIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        filteredIds.forEach(id => next.delete(id));
      } else {
        filteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // ─── Save menu ───────────────────────────────────────
  const handleSave = async () => {
    if (multiStoreMode) {
      // Multi-store mode
      if (selectedStoreIds.size === 0) {
        toast.warning("Vui lòng chọn ít nhất một cửa hàng!");
        return;
      }
      if (selectedProductIds.size === 0 && selectedComboIds.size === 0) {
        toast.warning("Vui lòng chọn ít nhất một sản phẩm hoặc combo!");
        return;
      }
      setIsSaving(true);
      try {
        const results = await applyMenuToStores({
          storeIds: Array.from(selectedStoreIds),
          products: Array.from(selectedProductIds),
          combos: Array.from(selectedComboIds),
        });
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        if (failCount === 0) {
          toast.success(`Đã áp dụng menu cho ${successCount} cửa hàng thành công!`);
        } else {
          toast.warning(`Đã áp dụng cho ${successCount} cửa hàng, ${failCount} cửa hàng thất bại.`);
          results
            .filter(r => !r.success)
            .forEach(r => {
              console.error(`Store ${r.storeId} failed:`, r.error);
            });
        }
      } catch (e) {
        toast.error(`Lỗi khi áp dụng menu: ${e.message || e}`);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Single-store mode (existing logic)
    if (!selectedStoreId) {
      toast.warning("Vui lòng chọn cửa hàng trước!");
      return;
    }
    setIsSaving(true);
    try {
      if (menu?._id) {
        await updateMenu({
          menu_id: menu._id,
          products: Array.from(selectedProductIds),
          combos: Array.from(selectedComboIds),
        });
      } else {
        await createMenu({
          store: selectedStoreId,
          products: Array.from(selectedProductIds),
          combos: Array.from(selectedComboIds),
        });
      }
      toast.success("Lưu menu thành công!");
      loadMenu(selectedStoreId);
    } catch (e) {
      toast.error(`Lỗi khi lưu menu: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Filters ─────────────────────────────────────────
  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCategory = productCategoryFilter === "all" || p.category?.slug === productCategoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => (a.category?.name || "").localeCompare(b.category?.name || ""));

  const filteredCombos = combos.filter(c => c.name?.toLowerCase().includes(comboSearch.toLowerCase()));

  // Unique categories from products
  const productCategories = [
    { _id: "all", slug: "all", name: "Tất cả" },
    ...Array.from(new Map(products.filter(p => p.category).map(p => [p.category.slug, p.category])).values()),
  ];

  // Selection stats
  const isAllProductsSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p._id));
  const isAllCombosSelected = filteredCombos.length > 0 && filteredCombos.every(c => selectedComboIds.has(c._id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý Menu</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? multiStoreMode
                ? "Chọn sản phẩm/combo và áp dụng đồng thời cho nhiều cửa hàng"
                : "Quản lý sản phẩm và combo hiển thị trên menu từng cửa hàng"
              : "Xem menu của từng cửa hàng"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <button
              onClick={switchMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                multiStoreMode
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              <ArrowLeftRight size={16} />
              {multiStoreMode ? "Nhiều cửa hàng" : "Từng cửa hàng"}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (!multiStoreMode && !selectedStoreId) || (multiStoreMode && selectedStoreIds.size === 0)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? "Đang lưu..." : multiStoreMode ? `Lưu cho ${selectedStoreIds.size} cửa hàng` : "Lưu menu"}
            </button>
          </div>
        )}
      </div>

      {/* Store selector */}
      <div className="bg-card rounded-2xl border border-border p-5">
        {/* === Multi-store mode === */}
        {multiStoreMode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-xl shrink-0">
                <Building2 size={18} />
                <span className="text-sm font-semibold">Cửa hàng</span>
              </div>
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  placeholder="Tìm kiếm cửa hàng..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
            </div>

            {/* Store list with checkboxes */}
            <div className="max-h-[30vh] overflow-y-auto border border-border rounded-xl">
              {/* Header: select all */}
              <div className="sticky top-0 bg-muted z-10 flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <button
                  onClick={toggleAllStores}
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {stores.filter(s => s.name?.toLowerCase().includes(storeSearch.toLowerCase())).length > 0 &&
                  stores
                    .filter(s => s.name?.toLowerCase().includes(storeSearch.toLowerCase()))
                    .every(s => selectedStoreIds.has(s._id)) ? (
                    <SquareCheckBig size={18} className="text-primary" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
                <span className="text-sm font-semibold text-foreground/70">
                  Chọn tất cả ({selectedStoreIds.size}/{stores.length})
                </span>
              </div>

              {stores.filter(s => s.name?.toLowerCase().includes(storeSearch.toLowerCase())).length === 0 ? (
                <div className="px-5 py-12 text-center text-muted-foreground">
                  <Store size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-sm">Không tìm thấy cửa hàng nào</p>
                </div>
              ) : (
                stores
                  .filter(s => s.name?.toLowerCase().includes(storeSearch.toLowerCase()))
                  .map(store => {
                    const isSelected = selectedStoreIds.has(store._id);
                    return (
                      <div
                        key={store._id}
                        onClick={() => toggleStoreSelection(store._id)}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/20 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleStoreSelection(store._id);
                          }}
                          className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{store.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {store.address?.district}, {store.address?.city} · {store.phone}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="shrink-0">
                            <Check size={16} className="text-primary" />
                          </span>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Selected stores count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store size={14} />
              <span>
                Đã chọn <strong className="text-foreground">{selectedStoreIds.size}</strong>/{stores.length} cửa hàng
              </span>
            </div>
          </div>
        ) : (
          /* === Single-store mode (original) === */
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-xl">
                <Store size={18} />
                <span className="text-sm font-semibold">Cửa hàng</span>
              </div>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background outline-none focus:border-primary text-sm"
              >
                <option value="">-- Chọn cửa hàng --</option>
                {stores
                  .filter(s => !s.isDeleted)
                  .map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.address?.district}, {s.address?.city}
                    </option>
                  ))}
              </select>
              {isLoading && <RefreshCw size={18} className="animate-spin text-muted-foreground" />}
            </div>

            {/* Menu status badge */}
            {menu && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Trạng thái menu:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    menu.status ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${menu.status ? "bg-emerald-500" : "bg-red-500"}`} />
                  {menu.status ? "Đang hoạt động" : "Đã tắt"}
                </span>
                <span className="text-sm text-muted-foreground">
                  · {menu.products?.length || 0} sản phẩm · {menu.combos?.length || 0} combo
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabs */}
      {(selectedStoreId || multiStoreMode) && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Tab headers */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Pizza size={16} />
              Sản phẩm
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{selectedProductIds.size}</span>
            </button>
            <button
              onClick={() => setActiveTab("combos")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "combos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gift size={16} />
              Combo
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{selectedComboIds.size}</span>
            </button>
          </div>

          {/* Tab content: Products */}
          {activeTab === "products" && (
            <div>
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3">
                  <Filter size={16} className="text-muted-foreground" />
                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="bg-transparent py-2.5 text-sm outline-none text-foreground"
                  >
                    {productCategories.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product list */}
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="border-b border-border">
                      <th className="w-12 px-4 py-3">
                        <button
                          onClick={toggleAllProducts}
                          className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isAllProductsSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Sản phẩm</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Danh mục</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-16 text-center text-muted-foreground">
                          <Pizza size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                          <p className="text-sm">Không tìm thấy sản phẩm nào</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => {
                        const isSelected = selectedProductIds.has(product._id);
                        return (
                          <tr
                            key={product._id}
                            onClick={() => isAdmin && toggleProduct(product._id)}
                            className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${
                              isAdmin ? "cursor-pointer" : ""
                            } ${isSelected ? "bg-primary/5" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleProduct(product._id);
                                }}
                                className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                                disabled={!isAdmin}
                              >
                                {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 relative border border-border/50">
                                  {product.variants?.[0]?.image?.url ? (
                                    <Image
                                      src={product.variants[0].image.url}
                                      alt={product.name}
                                      fill
                                      className="object-cover"
                                      sizes="40px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Pizza size={16} className="text-muted-foreground/25" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {product.description || product.category?.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-foreground/80">{product.category?.name}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-foreground">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.variants?.[0]?.price ?? 0)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab content: Combos */}
          {activeTab === "combos" && (
            <div>
              {/* Search */}
              <div className="flex gap-3 p-4 border-b border-border">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={comboSearch}
                    onChange={e => setComboSearch(e.target.value)}
                    placeholder="Tìm kiếm combo..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Combo list */}
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="border-b border-border">
                      <th className="w-12 px-4 py-3">
                        <button
                          onClick={toggleAllCombos}
                          className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isAllCombosSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Combo</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Giá</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Thời gian</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-foreground/70">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCombos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                          <Gift size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                          <p className="text-sm">Không tìm thấy combo nào</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCombos.map(combo => {
                        const isSelected = selectedComboIds.has(combo._id);
                        return (
                          <tr
                            key={combo._id}
                            onClick={() => isAdmin && toggleCombo(combo._id)}
                            className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${
                              isAdmin ? "cursor-pointer" : ""
                            } ${isSelected ? "bg-primary/5" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleCombo(combo._id);
                                }}
                                className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                                disabled={!isAdmin}
                              >
                                {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 relative border border-border/50">
                                  {combo.image ? (
                                    <Image src={combo.image} alt={combo.name} fill className="object-cover" sizes="40px" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Gift size={16} className="text-muted-foreground/25" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{combo.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{combo.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-foreground">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(combo.price ?? 0)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-muted-foreground">
                                {combo.dateStart ? new Date(combo.dateStart).toLocaleDateString("vi-VN") : "—"} —{" "}
                                {combo.dateEnd ? new Date(combo.dateEnd).toLocaleDateString("vi-VN") : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                  combo.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                                }`}
                              >
                                {combo.is_active ? "Hoạt động" : "Đã ẩn"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state khi chưa chọn store */}
      {!selectedStoreId && !multiStoreMode && (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <Store size={48} className="mx-auto mb-4 text-muted-foreground/25" />
          <p className="text-muted-foreground font-medium">Chọn một cửa hàng để quản lý menu</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Mỗi cửa hàng có một menu riêng với danh sách sản phẩm và combo.{" "}
            <button onClick={switchMode} className="text-primary underline hover:text-primary/80">
              Chuyển sang chế độ nhiều cửa hàng
            </button>{" "}
            để áp dụng sản phẩm cho nhiều cửa hàng cùng lúc.
          </p>
        </div>
      )}

      <Toaster position="top-right" richColors />
    </div>
  );
}
