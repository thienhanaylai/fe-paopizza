"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Gift,
  Clock,
  Calendar,
  Store,
  Square,
  SquareCheckBig,
  X,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  LoaderCircle,
  EyeOff,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  getAllPromotions,
  updatePromotionStatus,
  deletePromotion,
  Promotion,
  PromotionStatus,
  PromotionType,
} from "@/src/services/promotion.service";
import { getAllStore } from "@/src/services/store.service";
import { formatVND } from "@/src/utils/formatVND";
import { useSort } from "@/src/hooks/useSort";
import { SortableHeader } from "@/src/components/ui/SortableHeader";
import PromotionFormModal from "@/src/components/modals/PromotionFormModal";
import Pagination from "@/src/components/ui/Pagination";

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "%",
  fixed_amount: "VND",
};

const PROMOTION_STATUS_CONFIG: Record<PromotionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-600", icon: <FileText size={14} /> },
  active: { label: "Đang hoạt động", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
  inactive: { label: "Ngừng kích hoạt", color: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
  expired: { label: "Hết hạn", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={14} /> },
};

//  tính trạng thái hiệu lực dựa trên ngày
function getEffectiveStatus(promo: Promotion): PromotionStatus {
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);

  if (promo.status === "draft" || promo.status === "inactive") return promo.status;
  if (now > end) return "expired";
  if (now < start) return "inactive";
  return "active";
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };
  return `${fmt(start)} → ${fmt(end)}`;
}

export default function PromotionsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PromotionStatus>("all");
  const [listPromotions, setListPromotions] = useState<Promotion[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [storeMap, setStoreMap] = useState<Map<string, string>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Batch actions
  const [batchConfirmDelete, setBatchConfirmDelete] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Data fetching
  const fetchData = async () => {
    try {
      const [promotionsRes, storesRes] = await Promise.all([getAllPromotions(), getAllStore()]);
      setListPromotions(promotionsRes.data || []);
      const map = new Map<string, string>();
      if (storesRes.data) {
        storesRes.data.forEach((s: { _id: string; name: string }) => map.set(s._id, s.name));
      }
      setStoreMap(map);
      setIsPageLoading(false);
    } catch {
      toast.error("Không thể tải dữ liệu khuyến mãi!");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page khi filter/search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  // Lọc & sắp xếp
  const rawFiltered = listPromotions.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && getEffectiveStatus(p) === filterStatus;
  });
  const {
    sortedData: sortedPromotions,
    sortConfig: promoSortConfig,
    toggleSort: togglePromoSort,
  } = useSort(rawFiltered, "code", "asc");

  // Phân trang
  const totalFiltered = sortedPromotions.length;
  const totalPages = Math.ceil(totalFiltered / limit);
  const paginatedPromotions = sortedPromotions.slice((page - 1) * limit, page * limit);

  // Thống kê
  const stats = {
    total: listPromotions.length,
    active: listPromotions.filter(p => getEffectiveStatus(p) === "active").length,
    draft: listPromotions.filter(p => getEffectiveStatus(p) === "draft").length,
    expired: listPromotions.filter(p => getEffectiveStatus(p) === "expired").length,
  };

  // Chọn nhiều
  const isAllSelected = sortedPromotions.length > 0 && sortedPromotions.every(p => selectedIds.has(p._id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPromotions.map(p => p._id)));
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

  // Xử lý modal
  const openCreateModal = () => {
    setEditingPromo(null);
    setShowModal(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPromo(null);
  };

  // Bật/tắt trạng thái
  const handleToggleStatus = async (promo: Promotion) => {
    const newStatus: PromotionStatus = promo.status === "active" ? "inactive" : "active";
    try {
      await updatePromotionStatus(promo._id, newStatus);
      toast.success(newStatus === "active" ? "Đã kích hoạt khuyến mãi!" : "Đã ngừng kích hoạt khuyến mãi!");
      await fetchData();
    } catch (error: unknown) {
      const rawMsg = error instanceof Error ? error.message : "";
      const errorMap: Record<string, string> = {
        PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi.",
      };
      toast.error(errorMap[rawMsg] || rawMsg || "Có lỗi xảy ra!");
    }
  };

  // Xóa
  const handleDeleteClick = (promo: Promotion) => {
    setDeleteTarget(promo);
    setConfirmDelete(true);
  };

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePromotion(deleteTarget._id);
      toast.success("Xoá khuyến mãi thành công!");
      await fetchData();
    } catch (error: unknown) {
      const rawMsg = error instanceof Error ? error.message : "";
      const errorMap: Record<string, string> = {
        PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi.",
      };
      toast.error(errorMap[rawMsg] || rawMsg || "Có lỗi xảy ra!");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
      setDeleteTarget(null);
    }
  };

  // Thao tác hàng loạt
  const handleBatchDeactivate = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map(id => updatePromotionStatus(id, "inactive")));
      toast.success(`Đã ẩn ${ids.length} khuyến mãi!`);
      clearSelection();
      await fetchData();
    } catch (error: unknown) {
      const rawMsg = error instanceof Error ? error.message : "";
      const errorMap: Record<string, string> = {
        PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi.",
      };
      toast.error(errorMap[rawMsg] || rawMsg || "Có lỗi xảy ra!");
    }
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setBatchConfirmDelete(true);
  };

  const confirmBatchDeleteAction = async () => {
    setIsBatchDeleting(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map(id => deletePromotion(id)));
      toast.success(`Đã xoá ${ids.length} khuyến mãi!`);
      clearSelection();
      await fetchData();
    } catch (error: unknown) {
      const rawMsg = error instanceof Error ? error.message : "";
      const errorMap: Record<string, string> = {
        PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi.",
      };
      toast.error(errorMap[rawMsg] || rawMsg || "Có lỗi xảy ra!");
    } finally {
      setIsBatchDeleting(false);
      setBatchConfirmDelete(false);
    }
  };

  const storesList = Array.from(storeMap.entries()).map(([id, name]) => ({ _id: id, name }));

  // Render
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý khuyến mãi</h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý các mã khuyến mãi, giảm giá cho đơn hàng</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Tạo khuyến mãi
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tổng</p>
            <p className="text-foreground text-xl">{stats.total}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Đang hoạt động</p>
            <p className="text-foreground text-xl">{stats.active}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Bản nháp</p>
            <p className="text-foreground text-xl">{stats.draft}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Hết hạn</p>
            <p className="text-foreground text-xl">{stats.expired}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã khuyến mãi..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as "all" | PromotionStatus)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="draft">Bản nháp</option>
          <option value="inactive">Ngừng kích hoạt</option>
          <option value="expired">Hết hạn</option>
        </select>
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
              Đã chọn <span className="text-primary font-semibold">{selectedIds.size}</span> khuyến mãi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDeactivate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors text-sm font-medium"
              title="Ẩn các khuyến mãi đã chọn"
            >
              <EyeOff size={15} />
              Ẩn
            </button>
            <button
              onClick={handleBatchDeleteClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 transition-colors text-sm font-medium"
              title="Xoá các khuyến mãi đã chọn"
            >
              <Trash2 size={15} />
              Xoá
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isPageLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <th key={i} className="px-5 py-3.5">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-muted animate-pulse rounded" style={{ width: `${50 + j * 10}%` }} />
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
                  <SortableHeader
                    label="Mã khuyến mãi"
                    sortKey="code"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                  />
                  {/* <SortableHeader
                    label="Loại"
                    sortKey="type"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden md:table-cell"
                  /> */}
                  <SortableHeader
                    label="Giá trị"
                    sortKey="value"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70"
                  />
                  <SortableHeader
                    label="Điểm"
                    sortKey="point"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70"
                  />
                  <SortableHeader
                    label="Lượt dùng"
                    sortKey="usedCount"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Tối đa/user"
                    sortKey="maxUsagePerUser"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Thời gian"
                    sortKey="startDate"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell"
                  />
                  {/* <SortableHeader
                    label="Áp dụng"
                    sortKey="minOrderValue"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden xl:table-cell"
                  /> */}
                  <SortableHeader
                    label="Trạng thái"
                    sortKey="status"
                    sortConfig={promoSortConfig}
                    onSort={togglePromoSort}
                    className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70"
                  />
                  <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedPromotions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-5 py-16 text-center text-muted-foreground">
                      <Gift size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-sm">Không tìm thấy khuyến mãi nào</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPromotions.map(promo => {
                    const isSelected = selectedIds.has(promo._id);
                    const effectiveStatus = getEffectiveStatus(promo);
                    const statusConfig = PROMOTION_STATUS_CONFIG[effectiveStatus];
                    return (
                      <tr
                        key={promo._id}
                        className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""} ${effectiveStatus === "expired" || effectiveStatus === "inactive" ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => toggleSelectOne(promo._id)}
                            className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {/* <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Tag size={18} className="text-primary" />
                            </div> */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground font-mono tracking-wider">{promo.code}</p>
                              <p className="text-xs text-muted-foreground md:hidden mt-0.5">
                                {PROMOTION_TYPE_LABELS[promo.type]}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-foreground/80">{PROMOTION_TYPE_LABELS[promo.type]}</span>
                        </td> */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-foreground">
                            {promo.type === "percentage" ? `${promo.value}%` : formatVND(promo.value)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-sm text-foreground">
                            {promo.point === -1 || promo.point == null
                              ? "Không quy đổi"
                              : promo.point === 0
                                ? "Miễn phí"
                                : `${promo.point.toLocaleString("vi-VN")} Pt`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                          <span className="text-sm text-foreground">
                            {promo.usedCount ?? 0}
                            <span className="text-muted-foreground"> / </span>
                            {promo.usageLimit === -1 || promo.usageLimit == null ? "∞" : promo.usageLimit}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                          <span className="text-sm text-foreground">{promo.maxUsagePerUser ?? 1}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span>{formatDateRange(promo.startDate, promo.endDate)}</span>
                          </div>
                        </td>
                        {/* <td className="px-5 py-3.5 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-50">
                            <Store size={13} className="shrink-0" />
                            <span className="truncate">{getStoreNames(promo, storeMap)}</span>
                          </div>
                        </td> */}
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig?.color || "bg-gray-100 text-gray-600"}`}
                          >
                            {statusConfig?.icon}
                            {statusConfig?.label || effectiveStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(promo)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(promo)}
                              className={`p-2 rounded-lg transition-colors ${promo.status === "active" ? "hover:bg-red-50 text-muted-foreground hover:text-red-500" : "hover:bg-green-50 text-muted-foreground hover:text-green-500"}`}
                              title={promo.status === "active" ? "Ngừng kích hoạt" : "Kích hoạt"}
                            >
                              {promo.status === "active" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(promo)}
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
        )}
      </div>

      {/* Phân trang */}
      {!isPageLoading && (
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
      )}

      <PromotionFormModal
        open={showModal}
        onClose={closeModal}
        editingPromo={editingPromo}
        storesList={storesList}
        onSuccess={fetchData}
      />

      {confirmDelete && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 m-0 ">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Xác nhận xoá</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có chắc muốn xoá mã <span className="font-mono font-semibold text-foreground">{deleteTarget?.code}</span>?
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Hành động này không thể hoàn tác. Mã khuyến mãi sẽ bị vô hiệu hoá và đánh dấu đã xoá.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
              >
                Huỷ
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm disabled:opacity-60"
              >
                {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {batchConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 m-0 ">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Xác nhận xoá hàng loạt</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có chắc muốn xoá <span className="font-semibold text-foreground">{selectedIds.size}</span> khuyến mãi đã
                  chọn?
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Hành động này không thể hoàn tác. Các mã khuyến mãi sẽ bị vô hiệu hoá và đánh dấu đã xoá.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBatchConfirmDelete(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
              >
                Huỷ
              </button>
              <button
                onClick={confirmBatchDeleteAction}
                disabled={isBatchDeleting}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm disabled:opacity-60"
              >
                {isBatchDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Xoá {selectedIds.size} mã
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
