"use client";
import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  ChefHat,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  CircleCheckBig,
  RefreshCcw,
  Banknote,
  Ban,
  LoaderCircle,
} from "lucide-react";
import {
  cancelOrder,
  getAllOrder,
  OrderHistory,
  OrderMethod,
  OrderStatus,
  paymentStatus,
  PaymentMethod,
  updatePaymentStatusOrder,
  updateStatusOrder,
} from "@/src/services/order.service";
import { toast, Toaster } from "sonner";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatVND } from "@/src/utils/formatVND";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={14} /> },
  confirmed: { label: "Đã xác nhận", color: "bg-teal-100 text-teal-700", icon: <CircleCheckBig size={14} /> },
  preparing: { label: "Đang làm", color: "bg-blue-100 text-blue-700", icon: <ChefHat size={14} /> },
  delivering: { label: "Đang giao", color: "bg-purple-100 text-purple-700", icon: <Truck size={14} /> },
  completed: { label: "Hoàn thành", color: "bg-green-200 text-green-700", icon: <CheckCircle2 size={14} /> },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
};

const typeConfig: Record<OrderMethod, { label: string; icon: React.ReactNode; color: string }> = {
  dine_in: { label: "Dine-in", icon: <UtensilsCrossed size={14} />, color: "bg-orange-100 text-orange-700" },
  carry_out: { label: "Carry out", icon: <ShoppingBag size={14} />, color: "bg-cyan-100 text-cyan-700" },
  delivery: { label: "Delivery", icon: <Truck size={14} />, color: "bg-green-100 text-green-700" },
};

const paymentStatusConfig: Record<paymentStatus, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
  failed: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
  success: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
};

const flowConfig: Record<OrderMethod, OrderStatus[]> = {
  dine_in: ["pending", "confirmed", "preparing", "completed"],
  carry_out: ["pending", "confirmed", "preparing", "completed"],
  delivery: ["pending", "confirmed", "preparing", "delivering", "completed"],
};

const paymentMethodMap: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  qrCode: "Chuyển khoản",
  ewallet: "Ví điện tử",
  card: "Thẻ",
};

const actionTextMapDelivery = {
  pending: "Xác nhận",
  confirmed: "Bắt đầu làm",
  preparing: "Giao hàng",
  delivering: "Hoàn thành",
};
const actionTextMap = {
  pending: "Xác nhận",
  confirmed: "Bắt đầu làm",
  preparing: "Hoàn thành",
};
const formatDateTime = (isoString: string) => {
  if (!isoString) return "";

  const date = new Date(isoString);
  const pad = (num: number) => String(num).padStart(2, "0");

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
};
export default function Orders() {
  const { getInfo } = useEmployeeAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | OrderMethod>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderHistory | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [allOrders, setAllOrders] = useState<OrderHistory[]>();

  const [sortBy, setSortBy] = useState("status");
  const [sortOrder, setSortOrder] = useState("asc");

  const [modalConfirm, setModalConfirm] = useState(false);
  const [idConfirm, setIdConfirm] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [modalPayment, setModalPayment] = useState(false);
  const statusWeight = {
    pending: 1,
    confirmed: 2,
    preparing: 3,
    delivering: 4,
    completed: 5,
    cancelled: 6,
  };
  const fecthData = async () => {
    setIsLoading(true);
    const info = await getInfo();
    if (info?.ref_id?.store_id) {
      const res = await getAllOrder(`store_id=${info.ref_id.store_id}`, "");
      setAllOrders(res);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fecthData();
  }, []);
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };
  const filtered = allOrders
    ?.filter(
      o =>
        (statusFilter === "all" || o.status === statusFilter) &&
        (typeFilter === "all" || o.orderType === typeFilter) &&
        (o._id.toLowerCase().includes(search.toLowerCase()) ||
          o.contact_info.full_name.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "createdAt") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (sortBy === "status") {
        const weightA = statusWeight[a.status] || 0;
        const weightB = statusWeight[b.status] || 0;
        return sortOrder === "asc" ? weightA - weightB : weightB - weightA;
      }

      return 0;
    });

  const statusCounts = {
    pending: allOrders?.filter(o => o.status === "pending").length,
    cancelled: allOrders?.filter(o => o.status === "cancelled").length,
    confirmed: allOrders?.filter(o => o.status === "confirmed").length,
    preparing: allOrders?.filter(o => o.status === "preparing").length,
    delivering: allOrders?.filter(o => o.status === "delivering").length,
    completed: allOrders?.filter(o => o.status === "completed").length,
  };

  const typeCounts = {
    dine_in: allOrders?.filter(o => o.orderType === "dine_in").length,
    carry_out: allOrders?.filter(o => o.orderType === "carry_out").length,
    delivery: allOrders?.filter(o => o.orderType === "delivery").length,
  };

  const handleCancelOrder = async () => {
    setIsLoading(true);
    try {
      if (!selectedOrder || !selectedOrder.orderType) {
        console.error("Không tìm thấy đơn hàng hoặc loại đơn hàng!");
        return;
      }
      await cancelOrder(selectedOrder._id, "");
      toast.success(`Huỷ đơn hàng thành công`);
      setSelectedOrder(null);
      setModalConfirm(false);
      fecthData();
      setIsLoading(false);
    } catch (error) {
      toast.error(`Cập nhật trạng thái thất bại: ${error}`);
    }
  };

  const handleUpdatePaymentStatusOrder = async () => {
    setIsLoading(true);
    try {
      if (!selectedOrder || !selectedOrder.orderType) {
        console.error("Không tìm thấy đơn hàng hoặc loại đơn hàng!");
        return;
      }
      await updatePaymentStatusOrder(selectedOrder._id, "");
      toast.success(`Thanh toán đơn hàng thành công`);
      setSelectedOrder(null);
      setModalPayment(false);
      fecthData();
      setIsLoading(false);
    } catch (error) {
      toast.error(`Cập nhật trạng thái thất bại: ${error}`);
    }
  };

  const quickUpdateStatus = async (order: OrderHistory) => {
    if (!order?.orderType) return;
    setActioningId(order._id);
    try {
      const flow = flowConfig[order.orderType];
      if (!flow || !Array.isArray(flow)) return;
      const currentIndex = flow.indexOf(order.status);
      if (currentIndex !== -1 && currentIndex < flow.length - 1) {
        const nextStatus = flow[currentIndex + 1];
        await updateStatusOrder(nextStatus, order._id, "");
        toast.success("Cập nhật trạng thái thành công!");
        fecthData();
      }
    } catch (error) {
      toast.error(`Cập nhật thất bại: ${error}`);
    } finally {
      setActioningId(null);
    }
  };

  const quickPayment = async (order: OrderHistory) => {
    setActioningId(order._id);
    try {
      await updatePaymentStatusOrder(order._id, "");
      toast.success("Thanh toán thành công!");
      fecthData();
    } catch (error) {
      toast.error(`Thanh toán thất bại: ${error}`);
    } finally {
      setActioningId(null);
    }
  };

  const quickCancel = async (order: OrderHistory) => {
    setActioningId(order._id);
    try {
      await cancelOrder(order._id, "");
      toast.success("Huỷ đơn hàng thành công!");
      fecthData();
    } catch (error) {
      toast.error(`Huỷ đơn thất bại: ${error}`);
    } finally {
      setActioningId(null);
    }
  };

  const getNextActionLabel = (order: OrderHistory): string | null => {
    if (order.orderType === "delivery") {
      return (actionTextMapDelivery as Record<string, string>)[order.status] || null;
    }
    return (actionTextMap as Record<string, string>)[order.status] || null;
  };

  const getNextActionIcon = (order: OrderHistory): React.ReactNode => {
    if (order.orderType === "delivery") {
      const map: Record<string, React.ReactNode> = {
        pending: <CircleCheckBig size={15} />,
        confirmed: <ChefHat size={15} />,
        preparing: <Truck size={15} />,
        delivering: <CheckCircle2 size={15} />,
      };
      return map[order.status] || <CircleCheckBig size={15} />;
    }
    const map: Record<string, React.ReactNode> = {
      pending: <CircleCheckBig size={15} />,
      confirmed: <ChefHat size={15} />,
      preparing: <CheckCircle2 size={15} />,
    };
    return map[order.status] || <CircleCheckBig size={15} />;
  };

  const handleUpdateOrder = async () => {
    setIsLoading(true);
    try {
      if (!selectedOrder || !selectedOrder.orderType) {
        console.error("Không tìm thấy đơn hàng hoặc loại đơn hàng!");
        return;
      }
      const flow = flowConfig[selectedOrder?.orderType];
      if (!flow || !Array.isArray(flow)) return;
      const currentIndex = flow.indexOf(selectedOrder.status);
      if (currentIndex !== -1 && currentIndex < flow.length - 1) {
        const nextStatus = flow[currentIndex + 1];
        await updateStatusOrder(nextStatus, selectedOrder._id, "");
        toast.success("Cập nhật trạng thái thành công!");
        setIsLoading(false);
        setSelectedOrder(null);
        fecthData();
      } else {
        toast.error("Cập nhật trạng thái thất bại!");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(`Cập nhật trạng thái thất bại: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và xử lý đơn hàng</p>
        </div>
        <button
          onClick={() => {
            fecthData();
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <RefreshCcw size={18} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { key: "pending", label: "Chờ xử lý", count: statusCounts.pending, color: "text-yellow-600", bg: "bg-yellow-50" },
            { key: "preparing", label: "Đang làm", count: statusCounts.preparing, color: "text-blue-600", bg: "bg-blue-50" },
            {
              key: "delivering",
              label: "Đang giao",
              count: statusCounts.delivering,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            { key: "completed", label: "Hoàn thành", count: statusCounts.completed, color: "text-green-600", bg: "bg-green-50" },
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(statusFilter === tab.key ? "all" : tab.key)}
            className={`p-4 rounded-2xl border transition-all text-left ${statusFilter === tab.key ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:shadow-sm"}`}
          >
            <div className={`w-8 h-8 rounded-lg ${tab.bg} flex items-center justify-center mb-2`}>
              <span className={`text-lg ${tab.color}`}>{tab.count}</span>
            </div>
            <p className="text-sm text-muted-foreground">{tab.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${typeFilter === "all" ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
        >
          Tất cả ({allOrders?.length})
        </button>
        {(["dine_in", "carry_out", "delivery"] as OrderMethod[]).map(t => {
          const cfg = typeConfig[t];
          return (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(typeFilter === t ? "all" : t);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all  cursor-pointer ${typeFilter === t ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {cfg.icon} {cfg.label} ({typeCounts[t]})
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${statusFilter === "all" ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
        >
          Tất cả ({allOrders?.length})
        </button>
        {(["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"] as OrderStatus[]).map(t => {
          const cfg = statusConfig[t];
          return (
            <button
              key={t}
              onClick={() => setStatusFilter(statusFilter === t ? "all" : t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${statusFilter === t ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {cfg.icon} {cfg.label} ({statusCounts[t]})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã đơn hoặc tên khách..."
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
            <option value="pending">Chờ xử lý</option>
            <option value="preparing">Đang làm</option>
            <option value="delivering">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-100 w-full" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 ">Phương thức</th>
                  <th className="px-4 py-3 ">Trạng thái thanh toán</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                    onClick={() => handleSort("status")}
                  >
                    Trạng thái {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>

                  <th
                    className="px-4 py-3 hidden lg:table-cell cursor-pointer hover:bg-muted/70 transition-colors select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    Giờ đặt {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-3 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map(order => {
                  const st = statusConfig[order.status];
                  const tc = typeConfig[order.orderType];
                  const pmst = paymentStatusConfig[order.paymentStatus];
                  return (
                    <tr key={order._id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 text-primary">..{order._id.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <p className="text-foreground flex items-center gap-1 min-w-0">
                          <span className="truncate max-w-[150px]" title={order.contact_info.full_name}>
                            {order.contact_info.full_name}
                          </span>
                          <span className="shrink-0">- {order.contact_info.phone}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[240px]" title={order.contact_info.address}>
                          {order.contact_info.address}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tc.color}`}>
                          {tc.icon} {tc.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-foreground `}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${pmst.color}`}>
                          {paymentMethodMap[order.paymentMethod]} - {pmst.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{formatVND(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {["pending", "confirmed", "preparing", "delivering"].includes(order.status) && (
                            <>
                              <button
                                onClick={() => quickUpdateStatus(order)}
                                disabled={actioningId === order._id}
                                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                                title={getNextActionLabel(order) || "Cập nhật trạng thái"}
                              >
                                {actioningId === order._id ? (
                                  <LoaderCircle size={15} className="animate-spin" />
                                ) : (
                                  getNextActionIcon(order)
                                )}
                              </button>
                              {order.paymentStatus !== "success" && (
                                <button
                                  onClick={() => quickPayment(order)}
                                  disabled={actioningId === order._id}
                                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                                  title="Thanh toán"
                                >
                                  {actioningId === order._id ? (
                                    <LoaderCircle size={15} className="animate-spin" />
                                  ) : (
                                    <Banknote size={15} />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => quickCancel(order)}
                                disabled={actioningId === order._id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                                title="Huỷ đơn"
                              >
                                {actioningId === order._id ? (
                                  <LoaderCircle size={15} className="animate-spin" />
                                ) : (
                                  <Ban size={15} />
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground flex gap-1">
                Chi tiết đơn hàng <p className="text-primary hover:underline cursor-pointer"> ...{selectedOrder._id.slice(-8)}</p>
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig[selectedOrder.status].color}`}
              >
                {statusConfig[selectedOrder.status].icon} {statusConfig[selectedOrder.status].label}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Khách hàng:</span>
                  <span className="text-foreground">{selectedOrder.contact_info.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SĐT:</span>
                  <span className="text-foreground">{selectedOrder.contact_info.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loại đơn:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${typeConfig[selectedOrder.orderType].color}`}
                  >
                    {typeConfig[selectedOrder.orderType].icon} {typeConfig[selectedOrder.orderType].label}
                  </span>
                </div>
                {selectedOrder.orderType === "dine_in" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Số bàn:</span>
                    <span className="text-foreground">-</span>
                  </div>
                )}
                {selectedOrder.orderType === "delivery" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Địa chỉ:</span>
                      <span className="text-foreground text-right">{selectedOrder.contact_info.address}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phương thức giao:</span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
                        <Bike size={12} /> Nhân viên cửa hàng
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Sản phẩm:</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
                      {/* Item header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.item_type === "combo" ? (
                              <span className="text-foreground font-medium">
                                {item.combo_id?.name || "Combo"}
                                <span className="text-xs text-muted-foreground ml-1">(Combo)</span>
                              </span>
                            ) : (
                              <span className="text-foreground font-medium">{item.product_id?.name || item.sku}</span>
                            )}
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.size}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        </div>
                        <span className="text-foreground text-sm">{formatVND(item.price * item.quantity)}</span>
                      </div>

                      {/* Note */}
                      {item.note && <p className="text-xs text-muted-foreground italic">{item.note}</p>}

                      {/* Extra toppings for product items */}
                      {item.item_type === "product" && item.added_topping && item.added_topping.length > 0 && (
                        <div className="pl-2 border-l-2 border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">Topping thêm:</p>
                          {item.added_topping.map((t, j) => (
                            <div key={j} className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                + {t.ingredient.name} x{t.quantity}
                              </span>
                              <span>{formatVND(t.ingredient.price * t.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Combo selections */}
                      {item.item_type === "combo" && item.combo_selections && item.combo_selections.length > 0 && (
                        <div className="pl-2 border-l-2 border-primary/20 space-y-2">
                          <p className="text-xs text-muted-foreground">Chi tiết combo:</p>
                          {item.combo_selections.map((sel, j) => (
                            <div key={j} className="bg-muted/50 rounded p-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-foreground font-medium">{sel.product_id.name}</span>
                                <span className="text-muted-foreground">{sel.size}</span>
                              </div>
                              {sel.added_topping && sel.added_topping.length > 0 && (
                                <div className="pl-2">
                                  {sel.added_topping.map((t, k) => (
                                    <div key={k} className="flex justify-between text-xs text-muted-foreground">
                                      <span>
                                        + {t.ingredient.name} x{t.quantity}
                                      </span>
                                      <span>{formatVND(t.ingredient.price * t.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-3 border-t border-border">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tạm tính:</span>
                  <span>{formatVND(selectedOrder.subTotal)}</span>
                </div>
                {(selectedOrder.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Giảm giá:</span>
                    <span>-{formatVND(selectedOrder.discount_amount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-3 border-t border-border">
                <span className="text-foreground">Tổng cộng:</span>
                <span className="text-primary text-lg">{formatVND(selectedOrder.total)}</span>
              </div>

              {["pending", "confirmed", "preparing", "delivering"].includes(selectedOrder.status) && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setModalConfirm(true)}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Hủy đơn
                  </button>
                  {selectedOrder.paymentStatus != "success" && (
                    <button
                      onClick={() => setModalPayment(true)}
                      className="flex-1 py-2.5 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                    >
                      Thanh toán
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateOrder()}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    {selectedOrder.orderType === "carry_out" || selectedOrder.orderType === "dine_in" ? (
                      <>{(actionTextMap as Record<string, string>)[selectedOrder.status] || "Cập nhật"}</>
                    ) : (
                      <>{(actionTextMapDelivery as Record<string, string>)[selectedOrder.status] || "Cập nhật"}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {modalConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
            onClick={() => setModalConfirm(false)}
          >
            <div
              className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex gap-1 m-1">
                Nhập <p className="font-mono">`{selectedOrder?._id.slice(-8)}`</p> để xác nhận huỷ?
              </div>
              <input
                className="w-full pl-4 pr-1 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                type="text"
                onChange={e => setIdConfirm(e.target.value)}
                placeholder={`Nhập '${selectedOrder?._id.slice(-8)}' để xác nhận`}
              />
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setModalConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-black hover:bg-red-50 transition-colors"
                >
                  Thoát
                </button>
                <button
                  onClick={() => {
                    if (idConfirm === selectedOrder?._id.slice(-8)) handleCancelOrder();
                  }}
                  disabled={idConfirm !== selectedOrder?._id.slice(-8)}
                  className="flex-1 py-2.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors"
                >
                  Huỷ đơn hàng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {modalPayment && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
            onClick={() => setModalPayment(false)}
          >
            <div
              className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex gap-1 m-1">
                Xác nhận thanh toán <p className="font-mono">`{formatVND(selectedOrder?.total || 0)}`</p> ?
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setModalConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-black hover:bg-red-50 transition-colors"
                >
                  Thoát
                </button>
                <button
                  onClick={() => {
                    handleUpdatePaymentStatusOrder();
                  }}
                  className="flex-1 py-2.5  rounded-xl bg-green-600 text-white hover:bg-green-700/90 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
