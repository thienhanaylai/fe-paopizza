"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  X,
  CheckCircle2,
  Square,
  SquareCheckBig,
  AlertCircle,
  LoaderCircle,
  Tag,
  Eye,
  EyeOff,
  GripVertical,
  Save,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  getAllCategories,
  createCategoryFormData,
  updateCategoryFormData,
  updateCategoryActive,
  deleteCategory,
  reorderCategories,
  type CategoryData,
} from "@/src/services/category.service";

export default function CategoriesManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CategoryData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formIconFile, setFormIconFile] = useState<File | null>(null);
  const [formIconPreview, setFormIconPreview] = useState("");
  const iconFileRef = useRef<HTMLInputElement>(null);
  const [formIsActive, setFormIsActive] = useState("true");

  // Drag & drop reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Confirm delete modal
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCategories();
      // Sắp xếp theo order tăng dần
      const sorted = (data || []).sort((a: CategoryData, b: CategoryData) => (a.order ?? 0) - (b.order ?? 0));
      setCategories(sorted);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (value: string) => {
    setFormName(value);
    if (!editItem) {
      setFormSlug(generateSlug(value));
    }
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Vui lòng chọn file ảnh!");
      return;
    }
    setFormIconFile(file);
    setFormIcon("");
    const previewUrl = URL.createObjectURL(file);
    setFormIconPreview(previewUrl);
  };

  const clearIcon = () => {
    setFormIconFile(null);
    setFormIcon("");
    setFormIconPreview("");
    if (iconFileRef.current) {
      iconFileRef.current.value = "";
    }
  };

  // Xử lý kéo thả sắp xếp
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...categories];
    const [movedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, movedItem);

    // Cập nhật lại order cho từng item
    const updated = reordered.map((item, i) => ({ ...item, order: i }));
    setCategories(updated);
    setHasOrderChanged(true);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const orders = categories.map((c, i) => ({
        category_id: c._id,
        order: i,
      }));
      await reorderCategories(orders);
      setHasOrderChanged(false);
      toast.success("Đã lưu thứ tự danh mục!");
    } catch {
      toast.error("Lỗi khi lưu thứ tự");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Filtering
  const filtered = categories?.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" && c.isActive) || (statusFilter === "inactive" && !c.isActive);
    return matchesSearch && matchesStatus;
  });

  // Selection
  const isAllSelected = (filtered?.length ?? 0) > 0 && filtered!.every(i => selectedIds.has(i._id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered?.map(i => i._id) ?? []));
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

  // Submit (create or update)
  const handleSubmit = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      toast.warning("Vui lòng nhập đầy đủ tên và slug!");
      return;
    }

    try {
      setIsLoading(true);
      if (editItem) {
        const formData = new FormData();
        formData.append("category_id", editItem._id);
        formData.append("name", formName);
        formData.append("slug", formSlug);
        if (formIconFile) {
          formData.append("icon", formIconFile);
        } else if (formIcon) {
          formData.append("icon_url", formIcon);
        }
        await updateCategoryFormData(formData);
        // Also update active status if changed
        const newActive = formIsActive === "true";
        if (newActive !== editItem.isActive) {
          await updateCategoryActive({
            category_id: editItem._id,
            isActive: newActive,
          });
        }
        toast.success("Cập nhật danh mục thành công!");
      } else {
        const formData = new FormData();
        formData.append("name", formName);
        formData.append("slug", formSlug);
        if (formIconFile) {
          formData.append("icon", formIconFile);
        } else if (formIcon) {
          formData.append("icon_url", formIcon);
        }
        await createCategoryFormData(formData);
        toast.success("Thêm danh mục thành công!");
      }
      setShowForm(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (item: CategoryData) => {
    try {
      await updateCategoryActive({
        category_id: item._id,
        isActive: !item.isActive,
      });
      toast.success(item.isActive ? "Đã ngừng kích hoạt danh mục" : "Đã kích hoạt danh mục");
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await deleteCategory({ category_id: id });
      toast.success("Xoá danh mục thành công!");
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // Stats
  const activeCount = categories.filter(c => c.isActive).length;
  const inactiveCount = categories.filter(c => !c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-2">Quản lý danh mục menu</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách danh mục sản phẩm hiển thị trên menu</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setFormName("");
            setFormSlug("");
            setFormIcon("");
            setFormIconFile(null);
            setFormIconPreview("");
            setFormIsActive("true");
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Thêm danh mục
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            label: "Tổng danh mục",
            value: categories.length.toString(),
            icon: <Tag size={20} />,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Đang hoạt động",
            value: activeCount.toString(),
            icon: <CheckCircle2 size={20} />,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Ngừng hoạt động",
            value: inactiveCount.toString(),
            icon: <EyeOff size={20} />,
            color: "bg-red-50 text-red-500",
          },
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc slug danh mục..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent py-2.5 text-sm outline-none text-foreground"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Save order banner */}
      {hasOrderChanged && (
        <div className="flex items-center justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0" />
            <span className="text-sm font-medium text-yellow-700">Thứ tự danh mục đã thay đổi. Nhấn Lưu để áp dụng.</span>
          </div>
          <button
            onClick={handleSaveOrder}
            disabled={isSavingOrder}
            className="flex items-center gap-1.5 bg-yellow-600 text-white px-4 py-2 rounded-xl hover:bg-yellow-700 transition-colors text-sm font-semibold shrink-0"
          >
            {isSavingOrder ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu thứ tự
          </button>
        </div>
      )}

      {/* Selection banner */}
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
              Đã chọn <span className="text-primary font-semibold">{selectedIds.size}</span> danh mục
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading && categories.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i} className="px-5 py-3.5">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-muted animate-pulse rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
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
                  <th className="w-10 px-2 py-3.5 text-sm font-semibold text-foreground/70">#</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Mã</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Tên danh mục</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Slug</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden md:table-cell">Icon</th>
                  <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Trạng thái</th>
                  <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {!filtered || filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                      <Tag size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-sm">Không tìm thấy danh mục nào</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const isSelected = selectedIds.has(item._id);
                    const isDragging = dragIndex === idx;
                    const isDragOver = dragOverIndex === idx;
                    return (
                      <tr
                        key={item._id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={handleDragEnd}
                        className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors cursor-grab active:cursor-grabbing ${
                          isSelected ? "bg-primary/5" : ""
                        } ${!item.isActive ? "opacity-50" : ""} ${
                          isDragging ? "opacity-30 bg-muted/50" : ""
                        } ${isDragOver ? "border-t-2 border-primary" : ""}`}
                      >
                        <td className="px-2 py-3.5">
                          <div className="flex items-center justify-center">
                            <GripVertical size={16} className="text-muted-foreground/50" />
                          </div>
                        </td>
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
                          <p className="text-sm font-semibold text-foreground truncate max-w-50">{item.name}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground font-mono">{item.slug}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {item.icon ? (
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={item.icon}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="36px"
                                unoptimized={item.icon.startsWith("data:")}
                              />
                            </div>
                          ) : (
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                              <Tag size={15} className="text-muted-foreground" />
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              item.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                            }`}
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
                              onClick={() => handleToggleActive(item)}
                              className="p-2 rounded-lg hover:bg-yellow-50 text-muted-foreground hover:text-yellow-500 transition-colors"
                              title={item.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}
                            >
                              {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => {
                                setEditItem(item);
                                setFormName(item.name);
                                setFormSlug(item.slug);
                                setFormIcon(item.icon || "");
                                setFormIconFile(null);
                                setFormIconPreview("");
                                if (iconFileRef.current) iconFileRef.current.value = "";
                                setFormIsActive(item.isActive.toString());
                                setShowForm(true);
                              }}
                              className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal(true);
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
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
          onClick={() => {
            setEditItem(null);
            setShowForm(false);
            setFormIconFile(null);
            setFormIconPreview("");
          }}
        >
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-foreground">{editItem ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h2>
              <button
                onClick={() => {
                  setEditItem(null);
                  setShowForm(false);
                  setFormIconFile(null);
                  setFormIconPreview("");
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-1.5">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  value={formName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="VD: Pizza, Mì Ý, Đồ uống..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  placeholder="VD: pizza, mi-y, do-uong..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Slug được tự động tạo từ tên, có thể chỉnh sửa thủ công.</p>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1.5">Icon</label>
                <div className="flex items-start gap-3">
                  {/* Preview */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                    {formIconPreview || formIcon ? (
                      <Image
                        src={formIconPreview || formIcon}
                        alt="Icon preview"
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized={!!(formIconPreview || formIcon.startsWith("data:"))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag size={22} className="text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={iconFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconFileChange}
                      className="w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">hoặc nhập URL:</span>
                      <input
                        value={formIcon}
                        onChange={e => {
                          setFormIcon(e.target.value);
                          setFormIconFile(null);
                          setFormIconPreview("");
                          if (iconFileRef.current) iconFileRef.current.value = "";
                        }}
                        placeholder="https://..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background focus:border-primary outline-none text-xs"
                      />
                    </div>
                    {(formIconFile || formIcon) && (
                      <button
                        type="button"
                        onClick={clearIcon}
                        className="text-xs text-red-500 hover:text-red-600 transition-colors"
                      >
                        Xoá icon
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {editItem && (
                <div>
                  <label className="block text-sm text-foreground mb-1.5">Trạng thái</label>
                  <select
                    value={formIsActive}
                    onChange={e => setFormIsActive(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Ngừng sử dụng</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-6 border-t border-border">
              <button
                onClick={() => {
                  setEditItem(null);
                  setShowForm(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isLoading && <LoaderCircle size={16} className="animate-spin" />}
                {editItem ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Xác nhận xoá</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có chắc muốn xoá danh mục <span className="font-mono font-semibold text-foreground">{editItem?.name}</span>?
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Hành động này không thể hoàn tác. Danh mục sẽ bị đánh dấu đã xoá và ngừng kích hoạt.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmModal(false);
                  setEditItem(null);
                }}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  handleDelete(editItem?._id || "");
                  setEditItem(null);
                  setConfirmModal(false);
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
