"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, Phone, Mail, Package, Truck, Square, SquareCheckBig, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  createSupplier,
  deleteSupplier,
  getAllSupplier,
  Supplier as SupplierApi,
  SupplierCategory,
  updateSupplier,
} from "@/src/services/suppliers.service";

const supplierCategoryLabels: Record<SupplierCategory, string> = {
  main_ingredient: "Nguyên liệu chính",
  drink: "Đồ uống",
  seafood: "Hải sản",
  vegetable: "Rau củ",
};

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SupplierApi | null>(null);
  const [listSuppliers, setListSuppliers] = useState<SupplierApi[]>([]);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCategory, setFormCategory] = useState<SupplierCategory>("main_ingredient");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierApi | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSuppliers = async () => {
    const res = await getAllSupplier();
    setListSuppliers(res || []);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormCategory("main_ingredient");
    setFormIsActive(true);
  };

  const openCreateModal = () => {
    setEditItem(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (supplier: SupplierApi) => {
    setEditItem(supplier);
    setFormName(supplier.name || "");
    setFormEmail(supplier.email || "");
    setFormPhone(supplier.phone || "");
    setFormCategory(supplier.supplier_category || "main_ingredient");
    setFormIsActive(Boolean(supplier.isActive));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formName || !formCategory) return;

    setIsSubmitting(true);
    try {
      if (editItem) {
        const supplierId = editItem._id || editItem.id;
        if (!supplierId) return;
        await updateSupplier({
          supplier_id: supplierId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          supplier_category: formCategory,
          isActive: formIsActive,
        });
        toast.success("Cập nhật nhà cung cấp thành công!");
      } else {
        await createSupplier({
          name: formName,
          email: formEmail,
          phone: formPhone,
          supplier_category: formCategory,
          isActive: formIsActive,
        });
        toast.success("Thêm nhà cung cấp thành công!");
      }

      await fetchSuppliers();
      closeModal();
    } catch (error) {
      console.error("Lỗi xử lý nhà cung cấp:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (supplier: SupplierApi) => {
    setDeleteTarget(supplier);
    setConfirmModal(true);
  };

  const confirmDelete = async () => {
    const supplierId = deleteTarget?._id || deleteTarget?.id;
    if (!supplierId) return;

    setIsDeleting(true);
    try {
      await deleteSupplier(supplierId);
      await fetchSuppliers();
      toast.success("Xoá nhà cung cấp thành công!");
    } catch (error) {
      console.error("Lỗi xoá nhà cung cấp:", error);
      toast.error("Không thể xoá nhà cung cấp!");
    } finally {
      setIsDeleting(false);
      setConfirmModal(false);
      setDeleteTarget(null);
    }
  };

  const filtered = listSuppliers
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(
      s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        supplierCategoryLabels[s.supplier_category].toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.toLowerCase().includes(search.toLowerCase()),
    );

  const isAllSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s._id || s.id || ""));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s._id || s.id || "")));
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

  const totalSuppliers = listSuppliers.length;
  const activeSuppliers = listSuppliers.filter(s => s.isActive).length;
  const inactiveSuppliers = listSuppliers.filter(s => !s.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý nhà cung cấp</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin và đánh giá nhà cung cấp</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Thêm nhà cung cấp
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tổng nhà cung cấp</p>
            <p className="text-foreground text-xl">{totalSuppliers}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Đang hợp tác</p>
            <p className="text-foreground text-xl">{activeSuppliers}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Trash2 size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Ngừng hợp tác</p>
            <p className="text-foreground text-xl">{inactiveSuppliers}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm nhà cung cấp, danh mục..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
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
              Đã chọn <span className="text-primary font-semibold">{selectedIds.size}</span> nhà cung cấp
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
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Nhà cung cấp</th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden md:table-cell">Danh mục</th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell">SĐT</th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell">Email</th>
                <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Trạng thái</th>
                <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                    <Truck size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm">Không tìm thấy nhà cung cấp nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map(sup => {
                  const supplierId = sup._id || sup.id || "";
                  const isSelected = selectedIds.has(supplierId);
                  return (
                    <tr
                      key={supplierId}
                      className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""} ${!sup.isActive ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleSelectOne(supplierId)}
                          className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Truck size={18} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{sup.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden mt-0.5">
                              {supplierCategoryLabels[sup.supplier_category] || sup.supplier_category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-foreground/80">
                          {supplierCategoryLabels[sup.supplier_category] || sup.supplier_category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone size={13} />
                          <span>{sup.phone || "-"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail size={13} />
                          <span className="truncate max-w-[180px]">{sup.email || "-"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${sup.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                        >
                          {sup.isActive ? "Đang hợp tác" : "Ngừng"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(sup)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(sup)}
                            className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Xoá"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Tên công ty</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Nhập tên công ty"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Danh mục cung cấp</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as SupplierCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                >
                  {(Object.entries(supplierCategoryLabels) as [SupplierCategory, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Số điện thoại</label>
                  <input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="028xxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="email@company.vn"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Trạng thái</label>
                <select
                  value={formIsActive ? "active" : "inactive"}
                  onChange={e => setFormIsActive(e.target.value === "active")}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                >
                  <option value="active">Đang hợp tác</option>
                  <option value="inactive">Ngừng hợp tác</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmModal && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
            onClick={() => {
              setConfirmModal(false);
              setDeleteTarget(null);
            }}
          >
            <div
              className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex gap-1 m-1">
                Xác nhận xoá nhà cung cấp <span className="font-mono">{deleteTarget?.name}</span> ?
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => {
                    setConfirmModal(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-black hover:bg-red-50 transition-colors"
                >
                  Thoát
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5  rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors disabled:opacity-60"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Đang xoá..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
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
