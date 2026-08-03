"use client";
import {
  addIngredient,
  deleteIngredient,
  getAllIngredients,
  getCategoryIngredient,
  getUnitIngredient,
  updateIngredient,
} from "@/src/services/ingredient.service";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Warehouse,
  Filter,
  X,
  CheckCircle2,
  Package,
  Square,
  SquareCheckBig,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import { useSort } from "@/src/hooks/useSort";
import { SortableHeader } from "@/src/components/ui/SortableHeader";
import { toast, Toaster } from "sonner";
import { formatVND } from "@/src/utils/formatVND";
import Pagination from "@/src/components/ui/Pagination";

export interface Unit {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  slug: string;
}

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  category: string;
  costPerUnit: number;
  price: number;
  isActive: boolean;
  isDeleted: boolean;
}

export default function IngredientCatalog() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Ingredient | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>();
  const [categories, setCategories] = useState<Category[]>();
  const [units, SetUnits] = useState<Unit[]>();
  const [fromName, setFromName] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [fromCostPerUnit, setCostPerUnit] = useState(0);
  const [fromPrice, setFromPrice] = useState(0);
  const [fromCategory, setFromCategory] = useState("");
  const [fromIsActive, setFromIsActive] = useState("");
  const [confirmModal, setCongirmModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const fectData = async () => {
      try {
        const { data } = await getAllIngredients();
        const data1 = await getCategoryIngredient();
        const data3 = await getUnitIngredient();
        const finalCategories: Category[] = [
          {
            name: "Tất cả",
            slug: "all",
          },
          ...data1,
        ];

        setCategories(finalCategories);
        setIngredients(data);
        SetUnits(data3);
      } catch (error) {
        console.log(error);
      }
    };
    fectData();
  }, []);

  // Reset page khi filter/search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const rawFiltered = (ingredients || []).filter(
    i =>
      (categoryFilter === "all" || i.category === categoryFilter) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())),
  );
  const {
    sortedData: sortedIngredients,
    sortConfig: ingSortConfig,
    toggleSort: toggleIngSort,
  } = useSort(rawFiltered, "name", "asc");

  // Phân trang
  const totalFiltered = sortedIngredients.length;
  const totalPages = Math.ceil(totalFiltered / limit);
  const paginatedIngredients = sortedIngredients.slice((page - 1) * limit, page * limit);

  const isAllSelected = paginatedIngredients.length > 0 && paginatedIngredients.every(i => selectedIds.has(i._id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedIngredients.map(i => i._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const hanldeSumbit = async () => {
    try {
      if (editItem) {
        await updateIngredient({
          ingredient_id: editItem._id,
          name: fromName,
          unit: fromUnit,
          category: fromCategory,
          costPerUnit: fromCostPerUnit,
          price: fromPrice,
          isActive: fromIsActive === "true",
        });
        toast.success("Cập nhật thành công !");
      } else {
        if (fromName === "") {
          toast.warning("Vui lòng nhập đầy đủ thông tin!");
          return;
        }

        await addIngredient({
          name: fromName,
          costPerUnit: fromCostPerUnit,
          price: fromPrice,
          unit: fromUnit,
          category: fromCategory,
        });
        toast.success("Thêm thành công !");
      }

      const { data } = await getAllIngredients();
      setIngredients(data);
      setShowForm(false);
    } catch (error) {
      toast.error("error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIngredient({ ingredient_id: id });
      toast.success("Xoá thành công !");
      const { data } = await getAllIngredients();
      setIngredients(data);
    } catch (error) {
      toast.error("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-2">Danh mục nguyên liệu</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách nguyên liệu nhập từ nhà cung cấp toàn hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
            setFromCategory(categories[1]?.slug || "");
            setFromUnit(units[0]?.slug || "");
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Thêm nguyên liệu
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng nguyên liệu",
            value: ingredients?.length.toString(),
            icon: <Package size={20} />,
            color: "bg-primary/10 text-primary",
          },
          // {
          //   label: "Nhà cung cấp",
          //   value: totalSuppliers.toString(),
          //   icon: <Truck size={20} />,
          //   color: "bg-blue-50 text-blue-600",
          // },
          // {
          //   label: "Danh mục",
          //   value: (categories?.length - 1).toString(),
          //   icon: <Filter size={20} />,
          //   color: "bg-green-50 text-green-600",
          // },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <p className="text-foreground text-xl">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã nguyên liệu..."
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
            {categories?.map(c => (
              <option key={c.slug} value={c.slug}>
                {c.slug === "all" ? "Tất cả danh mục" : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
              title="Bỏ chọn"
            >
              <X size={16} />
            </button>
            <span className="text-sm font-medium text-foreground">
              Đã chọn <span className="text-primary font-semibold">{selectedIds.size}</span> nguyên liệu
            </span>
          </div>
        </div>
      )}

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
                <SortableHeader
                  label="Mã"
                  sortKey="_id"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                />
                <SortableHeader
                  label="Tên nguyên liệu"
                  sortKey="name"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                />
                <SortableHeader
                  label="Danh mục"
                  sortKey="category"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden md:table-cell"
                />
                <SortableHeader
                  label="Đơn vị tính"
                  sortKey="unit"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                />
                <SortableHeader
                  label="Giá nhập"
                  sortKey="costPerUnit"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                />
                <SortableHeader
                  label="Giá bán"
                  sortKey="price"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                />
                <SortableHeader
                  label="Trạng thái"
                  sortKey="isActive"
                  sortConfig={ingSortConfig}
                  onSort={toggleIngSort}
                  className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70"
                />
                <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIngredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                    <Package size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm">Không tìm thấy nguyên liệu nào</p>
                  </td>
                </tr>
              ) : (
                paginatedIngredients.map(item => {
                  const isSelected = selectedIds.has(item._id);
                  return (
                    <tr
                      key={item._id}
                      className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""} ${!item.isActive ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleSelectOne(item._id)}
                          className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td
                        className="px-5 py-3.5 text-xs text-primary cursor-pointer hover:underline font-mono"
                        title="Nhấn để copy toàn bộ ID"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(item._id);
                            toast.success("Đã sao chép ID!");
                          } catch {
                            toast.error("Không thể sao chép ID");
                          }
                        }}
                      >
                        ...{item._id.slice(-8)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{item.name}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs bg-muted text-muted-foreground">
                          {categories?.find(i => i.slug === item.category)?.name || item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-foreground/80">
                          {units?.find(i => i.slug === item.unit)?.name || item.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-foreground">
                          {formatVND(item.costPerUnit)}
                          <span className="text-xs text-muted-foreground font-normal">
                            /{units?.find(i => i.slug === item.unit)?.name || item.unit}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-semibold ${item.price > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                          {item.price > 0 ? formatVND(item.price) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${item.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                        >
                          {item.isActive ? (
                            <>
                              <CheckCircle2 size={12} /> Hoạt động
                            </>
                          ) : (
                            "Ngừng dùng"
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditItem(item);
                              setShowForm(true);
                              setFromName(item.name);
                              setFromCategory(item.category);
                              setFromUnit(item.unit);
                              setCostPerUnit(item.costPerUnit);
                              setFromPrice(item.price || 0);
                              setFromIsActive(item.isActive.toString());
                            }}
                            className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setCongirmModal(true);
                              setEditItem(item);
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
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

      {/* Phân trang */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={totalFiltered}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={newLimit => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0 mb-0"
          onClick={() => {
            setEditItem(null);
            setShowForm(false);
          }}
        >
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-foreground">{editItem ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}</h2>
              <button
                onClick={() => {
                  setEditItem(null);
                  setShowForm(false);
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-1.5">Tên nguyên liệu</label>
                <input
                  defaultValue={editItem?.name}
                  onChange={e => setFromName(e.target.value)}
                  placeholder="VD: Phô mai Mozzarella"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">Danh mục</label>
                  <select
                    defaultValue={editItem?.category}
                    onChange={e => setFromCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                  >
                    {categories
                      ?.filter(item => item.slug !== "all")
                      .map(item => (
                        <option key={item.slug} value={item.slug}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">Đơn vị</label>
                  <select
                    defaultValue={editItem?.unit}
                    onChange={e => setFromUnit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                  >
                    {units?.map(item => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5">Giá nhập (VNĐ)</label>
                <input
                  defaultValue={editItem?.costPerUnit}
                  type="number"
                  onChange={e => {
                    const value = e.target.valueAsNumber;
                    setCostPerUnit(isNaN(value) ? 0 : value);
                  }}
                  placeholder="VD: 2500000"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5">Giá bán extra topping (VNĐ)</label>
                <input
                  defaultValue={editItem?.price || 0}
                  type="number"
                  onChange={e => {
                    const value = e.target.valueAsNumber;
                    setFromPrice(isNaN(value) ? 0 : value);
                  }}
                  placeholder="VD: 15000"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Để 0 nếu không bán làm extra topping</p>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5">Trạng thái</label>
                <select
                  defaultValue={editItem?.isActive.toString() || "true"}
                  onChange={e => setFromIsActive(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                >
                  <option value="true">Hoạt động</option>
                  <option value="false">Ngừng sử dụng</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={() => hanldeSumbit()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm"
              >
                {editItem ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 m-0 ">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Xác nhận xoá</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có chắc muốn xoá nguyên liệu{" "}
                  <span className="font-mono font-semibold text-foreground">{editItem?.name}</span>?
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Hành động này không thể hoàn tác. Nguyên liệu sẽ bị đánh dấu đã xoá.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCongirmModal(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  handleDelete(editItem?._id || "");
                  setEditItem(null);
                  setCongirmModal(false);
                }}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
