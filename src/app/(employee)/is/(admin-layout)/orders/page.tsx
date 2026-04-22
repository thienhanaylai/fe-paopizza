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
  Building2,
  CircleCheckBig,
  RefreshCcw,
} from "lucide-react";
import { getAllOrder, OrderHistory, OrderMethod, OrderStatus, updateStatusOrder } from "@/src/services/order.service";
import { toast, Toaster } from "sonner";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { Skeleton } from "@/src/components/ui/skeleton";

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

const flowConfig: Record<OrderMethod, OrderStatus[]> = {
  dine_in: ["pending", "confirmed", "preparing", "completed"],
  carry_out: ["pending", "confirmed", "preparing", "completed"],
  delivery: ["pending", "confirmed", "preparing", "delivering", "completed"],
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
function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
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
    if (info.ref_id.store_id != "") {
      const res = await getAllOrder(`store_id=${info.ref_id.store_id}`, "");
      console.log(res);
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
        (typeFilter === "all" || o.order_type === typeFilter) &&
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
    dine_in: allOrders?.filter(o => o.order_type === "dine_in").length,
    carry_out: allOrders?.filter(o => o.order_type === "carry_out").length,
    delivery: allOrders?.filter(o => o.order_type === "delivery").length,
  };

  const handleUpdateOrder = async () => {
    setIsLoading(true);
    try {
      if (!selectedOrder || !selectedOrder.order_type) {
        console.error("Không tìm thấy đơn hàng hoặc loại đơn hàng!");
        return;
      }
      const flow = flowConfig[selectedOrder?.order_type];
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

      {/* Status tabs */}
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

      {/* Type filter tabs */}
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${typeFilter === t ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${statusFilter === t ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {cfg.icon} {cfg.label} ({statusCounts[t]})
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
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

      {/* Orders table */}

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
                  <th className="px-4 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map(order => {
                  const st = statusConfig[order.status];
                  const tc = typeConfig[order.order_type];
                  return (
                    <tr key={order._id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 text-primary">..{order._id.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">
                          {order.contact_info.full_name} - {order.contact_info.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.contact_info.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tc.color}`}>
                          {tc.icon} {tc.label}
                          {order.order_type === "delivery" ? (
                            <>{/* <Bike size={12} /> NV: {order.deliveryStaff} */}</>
                          ) : order.order_type === "dine_in" ? (
                            ` Bàn `
                          ) : (
                            ` - `
                          )}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-foreground `}>
                        <p
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${order.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                        >
                          {order.paymentMethod} - {order.paymentStatus === "pending" ? "Chờ thanh toán" : "Đã thanh toán"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{formatVND(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order detail modal */}
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
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${typeConfig[selectedOrder.order_type].color}`}
                  >
                    {typeConfig[selectedOrder.order_type].icon} {typeConfig[selectedOrder.order_type].label}
                  </span>
                </div>
                {selectedOrder.order_type === "dine_in" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Số bàn:</span>
                    <span className="text-foreground">-</span>
                  </div>
                )}
                {selectedOrder.order_type === "delivery" && (
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
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-muted/30 rounded-lg p-3">
                      <span className="text-foreground">
                        {item.product_id.name} x{item.quantity}
                      </span>
                      <span className="text-foreground">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-border">
                <span className="text-foreground">Tổng cộng:</span>
                <span className="text-primary text-lg">{formatVND(selectedOrder.total)}</span>
              </div>

              {["pending", "confirmed", "preparing", "delivering"].includes(selectedOrder.status) && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Hủy đơn
                  </button>
                  <button
                    onClick={() => handleUpdateOrder()}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    {selectedOrder.order_type === "carry_out" || selectedOrder.order_type === "dine_in" ? (
                      <>{actionTextMap[selectedOrder.status] || "Cập nhật"}</>
                    ) : (
                      <>{actionTextMapDelivery[selectedOrder.status] || "Cập nhật"}</>
                    )}
                  </button>
                </div>
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
