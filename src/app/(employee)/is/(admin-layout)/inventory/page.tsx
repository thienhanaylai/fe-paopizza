"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Filter,
  ClipboardCheck,
  X,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import {
  createOrUpdateInventory,
  getInventory,
  Inventory,
  InventoryIngredientItem,
  summaryShift,
  SummaryShiftPayload,
} from "@/src/services/inventory.service";
import { toast, Toaster } from "sonner";
import { formatVND } from "@/src/utils/formatVND";

export default function IndexPage() {
  const { user } = useEmployeeAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryIngredientItem | null>(null);
  const [inventory, setInventory] = useState<Inventory>();
  const [showStocktake, setShowStocktake] = useState(false);
  const [stocktakeStep, setStocktakeStep] = useState<"entry" | "summary">("entry");
  const [stocktakeIndex, setStocktakeIndex] = useState(0);
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  const [currentInput, setCurrentInput] = useState("");
  const stocktakeInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [addStockInput, setAddStockInput] = useState("");
  const [addMinStockInput, setAddMinStockInput] = useState("");
  const [editStockInput, setEditStockInput] = useState("");
  const [editMinStockInput, setEditMinStockInput] = useState("");

  const startStocktake = () => {
    setStocktakeStep("entry");
    setStocktakeIndex(0);
    setRemaining({});
    setCurrentInput("");
    setShowStocktake(true);
  };

  const closeStocktake = () => {
    setShowStocktake(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setSelectedIngredientId("");
    setAddStockInput("");
    setAddMinStockInput("");
    setEditStockInput("");
    setEditMinStockInput("");
  };

  const revCurrent = () => {
    if (!inventory?.ingredients.length || stocktakeIndex <= 0) return;
    const prevIndex = stocktakeIndex - 1;
    const prevItem = inventory.ingredients[prevIndex];
    const prevValue = prevItem ? remaining[prevItem._id] : undefined;
    setStocktakeIndex(prevIndex);
    setCurrentInput(prevValue !== undefined ? String(prevValue) : "");
    setTimeout(() => stocktakeInputRef.current?.focus(), 0);
  };

  const submitCurrent = () => {
    const item = inventory?.ingredients[stocktakeIndex];
    if (!item) return;
    const val = parseFloat(currentInput);
    if (isNaN(val) || val < 0) return;
    const next = { ...remaining, [item._id]: val };
    setRemaining(next);
    setCurrentInput("");
    if (stocktakeIndex < inventory.ingredients.length - 1) {
      setStocktakeIndex(stocktakeIndex + 1);
    } else {
      setStocktakeStep("summary");
    }
  };

  const skipCurrent = () => {
    if (stocktakeIndex < (inventory?.ingredients.length || 0) - 1) {
      setCurrentInput("");
      setStocktakeIndex(stocktakeIndex + 1);
    } else {
      setStocktakeStep("summary");
    }
  };

  const fetchData = async () => {
    try {
      const res = await getInventory(user?.store_id || "", "");
      setInventory(res);
    } catch (error) {
      console.log(error);
      return;
    }
  };

  const handleSummary = async () => {
    try {
      const payload: SummaryShiftPayload = {
        store_id: user?.store_id || "",
        employee_id: user?.employee_id || "",
        payload: remaining,
      };
      const res = await summaryShift(payload, "");
      if (res) {
        closeStocktake();
        toast.success("Tổng kết ca thành công!");
      }
    } catch (error) {
      console.log(error);
      return;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = ["all", ...Array.from(new Set(inventory?.ingredients.map(i => i.ingredient_id.category)))];
  const filtered = inventory?.ingredients.filter(
    i =>
      (categoryFilter === "all" || i.ingredient_id.category === categoryFilter) &&
      i.ingredient_id.name.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockCount = inventory?.ingredients.filter(i => i.current_stock <= i.min_stock_level).length;
  const selectedIngredient = inventory?.ingredients.find(ing => ing.ingredient_id._id === selectedIngredientId);

  const syncSelectedIngredient = (ingredientId: string) => {
    setSelectedIngredientId(ingredientId);
    const ingredient = inventory?.ingredients.find(ing => ing.ingredient_id._id === ingredientId);
    setAddStockInput(ingredient ? String(ingredient.current_stock) : "");
    setAddMinStockInput(ingredient ? String(ingredient.min_stock_level) : "");
  };

  const handleCreateInventory = async () => {
    if (!selectedIngredientId) {
      toast.warning("Vui lòng chọn nguyên liệu");
      return;
    }

    const nextStock = Number.parseFloat(addStockInput);
    const nextMin = Number.parseFloat(addMinStockInput);

    if (Number.isNaN(nextStock) || nextStock < 0) {
      toast.warning("Số lượng tồn kho không hợp lệ");
      return;
    }

    if (!Number.isNaN(nextMin) && nextMin < 0) {
      toast.warning("Mức tối thiểu không hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createOrUpdateInventory(
        {
          store_id: user?.store_id || "",
          ingredient_id: selectedIngredientId,
          current_stock: nextStock,
          min_stock_level: Number.isNaN(nextMin) ? undefined : nextMin,
        },
        "",
      );
      if (res) {
        fetchData();
        closeModal();
        toast.success("Thêm nguyên liệu thành công!");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInventory = async () => {
    if (!editItem) return;

    const nextStock = Number.parseFloat(editStockInput);
    const nextMin = Number.parseFloat(editMinStockInput);

    if (Number.isNaN(nextStock) || nextStock < 0) {
      toast.warning("Số lượng tồn kho không hợp lệ");
      return;
    }

    if (!Number.isNaN(nextMin) && nextMin < 0) {
      toast.warning("Mức tối thiểu không hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      const res = await createOrUpdateInventory(
        {
          store_id: user?.store_id || "",
          ingredient_id: editItem.ingredient_id._id,
          current_stock: nextStock,
          min_stock_level: Number.isNaN(nextMin) ? undefined : nextMin,
        },
        "",
      );
      if (res) {
        fetchData();
        closeModal();
        toast.success("Cập nhật nguyên liệu thành công!");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Kho nguyên liệu</h1>
          <p className="text-muted-foreground mt-1">Theo dõi tồn kho nguyên liệu</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startStocktake}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
          >
            <ClipboardCheck size={18} /> Tổng kết cuối ca
          </button>
          <button
            onClick={() => {
              setEditItem(null);
              syncSelectedIngredient(inventory?.ingredients[0]?.ingredient_id._id ?? "");
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            <Plus size={18} /> Nhập nguyên liệu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tổng nguyên liệu</p>
            <p className="text-foreground text-xl">{inventory?.ingredients.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Sắp hết hàng</p>
            <p className="text-foreground text-xl">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Đủ hàng</p>
            <p className="text-foreground text-xl">{inventory?.ingredients?.length - lowStockCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm nguyên liệu..."
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
            {categories.map((c, i) => (
              <option key={i} value={c}>
                {c === "all" ? "Tất cả loại" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên nguyên liệu</th>
                <th className="px-4 py-3 hidden md:table-cell">Loại</th>
                <th className="px-4 py-3">Tồn kho</th>
                <th className="px-4 py-3 hidden lg:table-cell">Đơn giá</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(item => {
                const isLow = item.current_stock <= item.min_stock_level;
                return (
                  <tr key={item._id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">...{item._id.slice(-8)}</td>
                    <td className="px-4 py-3 text-foreground">{item.ingredient_id.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.ingredient_id.category}</td>
                    <td className="px-4 py-3">
                      <span className={isLow ? "text-red-600" : "text-foreground"}>
                        {item.current_stock} {item.ingredient_id.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground hidden lg:table-cell">
                      {formatVND(item.ingredient_id.cost_per_unit)}/{item.ingredient_id.unit}
                    </td>

                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                          <AlertTriangle size={12} /> Sắp hết
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Đủ hàng</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditStockInput(String(item.current_stock));
                            setEditMinStockInput(String(item.min_stock_level));
                            setShowModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center m-0 justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa nguyên liệu" : "Nhập nguyên liệu mới"}</h3>
            <div className="space-y-4">
              {editItem ? (
                <div className="bg-muted/40 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground">Nguyên liệu</p>
                  <p className="text-foreground text-lg mt-1">{editItem?.ingredient_id.name ?? "—"}</p>
                  <div className="text-sm text-muted-foreground mt-2">
                    <span>{editItem?.ingredient_id.category ?? "—"}</span>
                    <span className="mx-2">•</span>
                    <span>{editItem?.ingredient_id.unit ?? "—"}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm mb-1">Nguyên liệu</label>
                  <select
                    value={selectedIngredientId}
                    onChange={e => syncSelectedIngredient(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    {(inventory?.ingredients ?? []).map(ing => (
                      <option key={ing.ingredient_id._id} value={ing.ingredient_id._id}>
                        {ing.ingredient_id.name}
                      </option>
                    ))}
                  </select>
                  {selectedIngredient && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <span>{selectedIngredient.ingredient_id.category ?? "—"}</span>
                      <span className="mx-2">•</span>
                      <span>{selectedIngredient.ingredient_id.unit ?? "—"}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Số lượng tồn kho</label>
                  {editItem ? (
                    <input
                      type="number"
                      step="1"
                      value={editStockInput}
                      onChange={e => setEditStockInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    />
                  ) : (
                    <input
                      type="number"
                      step="1"
                      value={addStockInput}
                      onChange={e => setAddStockInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Mức tối thiểu</label>
                  {editItem ? (
                    <input
                      type="number"
                      step="1"
                      value={editMinStockInput}
                      onChange={e => setEditMinStockInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    />
                  ) : (
                    <input
                      type="number"
                      step="1"
                      value={addMinStockInput}
                      onChange={e => setAddMinStockInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (editItem) {
                      handleUpdateInventory();
                    } else {
                      handleCreateInventory();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStocktake && (
        <div className="fixed inset-0 z-50 flex items-center m-0 justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 className="text-foreground">Tổng kết ca</h3>
                  <p className="text-sm text-muted-foreground">
                    {stocktakeStep === "entry"
                      ? `Nhập số lượng tồn kho thực tế (${stocktakeIndex + 1}/${inventory?.ingredients.length})`
                      : "Bảng tổng kết hao hụt nguyên liệu"}
                  </p>
                </div>
              </div>
              <button onClick={closeStocktake} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            {stocktakeStep === "entry" ? (
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(stocktakeIndex / (inventory?.ingredients?.length || 0)) * 100}%` }}
                  />
                </div>

                {(() => {
                  const item = inventory?.ingredients[stocktakeIndex];
                  return (
                    <div className="space-y-5">
                      <div className="bg-muted/40 rounded-2xl p-5 border border-border">
                        <p className="text-sm text-muted-foreground">Nguyên liệu</p>
                        <p className="text-foreground text-2xl mt-1">{item?.ingredient_id.name}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Mã: {item?._id}</span>
                          <span>•</span>
                          <span>
                            Tồn đầu ca: {item?.current_stock} {item?.ingredient_id.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm mb-2 text-foreground">
                          Số lượng còn lại <span className="text-muted-foreground">({item?.ingredient_id.unit})</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={revCurrent}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                          >
                            <ArrowLeft size={16} /> Quay lại
                          </button>
                          <input
                            ref={stocktakeInputRef}
                            type="number"
                            step="0.01"
                            value={currentInput}
                            onChange={e => setCurrentInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                submitCurrent();
                              }
                            }}
                            placeholder="Nhập số lượng và nhấn Enter"
                            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                          <button
                            onClick={submitCurrent}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                          >
                            Tiếp <ArrowRight size={16} />
                          </button>
                        </div>
                        <button onClick={skipCurrent} className="text-sm text-muted-foreground hover:text-foreground mt-2">
                          Bỏ qua nguyên liệu này
                        </button>
                      </div>

                      {Object.keys(remaining).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Đã nhập ({Object.keys(remaining).length})</p>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {inventory?.ingredients.slice(0, stocktakeIndex).map(ing => (
                              <span
                                key={ing._id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs"
                              >
                                <CheckCircle2 size={12} />
                                {ing.ingredient_id.name}: {remaining[ing._id] ?? "—"} {ing.ingredient_id.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-left">
                        <th className="px-4 py-3">Nguyên liệu</th>
                        <th className="px-4 py-3 text-right">Tồn đầu ca</th>
                        <th className="px-4 py-3 text-right">Còn lại</th>
                        <th className="px-4 py-3 text-right">Đã sử dụng</th>
                        <th className="px-4 py-3 text-right">Dự kiến (hệ thống)</th>
                        <th className="px-4 py-3 text-right">Hao hụt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory?.ingredients.map(ing => {
                        const rem = remaining[ing._id];
                        if (rem === undefined) {
                          return (
                            <tr key={ing._id} className="border-t border-border/50">
                              <td className="px-4 py-3 text-foreground">{ing.ingredient_id.name}</td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {ing.current_stock} {ing.ingredient_id.unit}
                              </td>
                              <td colSpan={4} className="px-4 py-3 text-center text-muted-foreground italic">
                                Chưa kiểm
                              </td>
                            </tr>
                          );
                        }
                        const used = ing.current_stock - rem;
                        const expected = 0;
                        const loss = used - expected;
                        return (
                          <tr key={ing._id} className="border-t border-border/50">
                            <td className="px-4 py-3 text-foreground">{ing.ingredient_id.name}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {ing.current_stock} {ing.ingredient_id.unit}
                            </td>
                            <td className="px-4 py-3 text-right text-foreground">
                              {rem} {ing.ingredient_id.unit}
                            </td>
                            <td className="px-4 py-3 text-right text-foreground">
                              {used.toFixed(2)} {ing.ingredient_id.unit}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {expected} {ing.ingredient_id.unit}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {loss > 0.001 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs">
                                  <AlertTriangle size={11} /> +{loss.toFixed(2)} {ing.ingredient_id.unit}
                                </span>
                              ) : loss < -0.001 ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs">
                                  {loss.toFixed(2)} {ing.ingredient_id.unit}
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {(() => {
                  const checked = inventory?.ingredients.filter(i => remaining[i._id] !== undefined);
                  const totalLoss = checked?.reduce((sum, i) => {
                    const used = i.current_stock - (remaining[i._id] ?? i.current_stock);
                    const exp = 0;
                    return sum + Math.max(0, used - exp) * i.ingredient_id.cost_per_unit;
                  }, 0);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                      <div className="bg-muted/40 rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground">Đã kiểm</p>
                        <p className="text-foreground text-lg mt-1">
                          {checked?.length}/{inventory?.ingredients.length}
                        </p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-4 border border-border">
                        <p className="text-xs text-muted-foreground">SL có hao hụt</p>
                        <p className="text-foreground text-lg mt-1">
                          {checked?.filter(i => i.current_stock - (remaining[i._id] ?? i.current_stock) - 0 > 0.001).length}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-xs text-red-600">Giá trị hao hụt</p>
                        <p className="text-red-700 text-lg mt-1">{formatVND(Math.round(totalLoss))}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
              {stocktakeStep === "entry" ? (
                <>
                  <button
                    onClick={closeStocktake}
                    className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => setStocktakeStep("summary")}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Xem tổng kết
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setStocktakeStep("entry");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => {
                      handleSummary();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90"
                  >
                    Xác nhận
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
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
