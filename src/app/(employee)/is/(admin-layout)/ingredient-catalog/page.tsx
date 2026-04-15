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
  Truck,
  Eye,
  X,
  CheckCircle2,
  Clock,
  Package,
  FileText,
} from "lucide-react";
import { toast, Toaster } from "sonner";

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
  is_active: boolean;
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
  const [fromCategory, setFromCategory] = useState("");
  useEffect(() => {
    const fectData = async () => {
      try {
        const data = await getAllIngredients();
        const data1 = await getCategoryIngredient();
        const data3 = await getUnitIngredient();
        const finalCategories: Category[] = [
          {
            name: "Tất cả",
            slug: "all",
          },
          ...data1,
        ];
        console.log(data);
        setCategories(finalCategories);
        setIngredients(data);
        SetUnits(data3);
      } catch (error) {
        console.log(error);
      }
    };
    fectData();
  }, []);

  const filtered = ingredients?.filter(
    i =>
      (categoryFilter === "all" || i.category === categoryFilter) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())),
  );

  const hanldeSumbit = async () => {
    try {
      if (editItem) {
        await updateIngredient({
          ingredient_id: editItem._id,
          name: fromName,
          unit: fromUnit,
          category: fromCategory,
        });
        toast.success("Cập nhật thành công !");
      } else {
        await addIngredient({ name: fromName, unit: fromUnit, category: fromCategory });
        toast.success("Thêm thành công !");
      }

      const data = await getAllIngredients();
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
      const data = await getAllIngredients();
      setIngredients(data);
    } catch (error) {
      toast.error("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-2">
            <Warehouse size={24} className="text-primary" /> Danh mục nguyên liệu
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách nguyên liệu nhập từ nhà cung cấp toàn hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
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

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên nguyên liệu</th>
                <th className="px-4 py-3 hidden md:table-cell">Danh mục</th>
                <th className="px-4 py-3">Đơn vị tính</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(item => (
                <tr key={item._id} className="border-t border-border/50 hover:bg-muted/30">
                  <td
                    className="px-4 py-3 text-primary cursor-pointer hover:underline"
                    title="Nhấn để copy toàn bộ ID"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(item._id);
                        toast.success("Đã sao chép ID!");
                      } catch (err) {
                        toast.error("Không thể sao chép ID");
                      }
                    }}
                  >
                    ...{item._id.slice(-8)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{item.unit}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 rounded-lg text-xs bg-muted text-muted-foreground">
                      {categories?.find(i => i.slug === item.category)?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{units?.find(i => i.slug === item.unit)?.name}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.is_active ? (
                        <>
                          <CheckCircle2 size={12} /> Hoạt động
                        </>
                      ) : (
                        "Ngừng dùng"
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setShowForm(true);
                          setFromName(item.name);
                          setFromCategory(item.category);
                          setFromUnit(item.unit);
                        }}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p>Không tìm thấy nguyên liệu nào</p>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 mb-0"
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
                <label className="block text-sm text-foreground mb-1.5">Trạng thái</label>
                <select
                  defaultValue={editItem?.is_active.toString() || "true"}
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
      <Toaster />
    </div>
  );
}
