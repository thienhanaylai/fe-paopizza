"use client";

import { Search, PackageSearch } from "lucide-react";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { trackOrder, OrderHistory } from "@/src/services/order.service";
import { formatVND } from "@/src/utils/formatVND";
import { formatDateTime } from "@/src/utils/formatDateTime";
import OrderDetailModal from "@/src/components/modals/OrderDetailModal";

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-teal-100 text-teal-700" },
  preparing: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
  delivering: { label: "Đang giao", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Hoàn thành", color: "bg-green-200 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
  success: { label: "Đã thanh toán", color: "bg-green-200 text-green-700" },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-700" },
};

const orderTypeLabels: Record<string, string> = {
  carry_out: "Đến lấy",
  delivery: "Giao hàng",
  dine_in: "Dùng tại chỗ",
};

/** Kiểm tra chuỗi nhập vào có phải ObjectId (24 ký tự hex) không */
const isObjectId = (value: string): boolean => /^[a-fA-F0-9]{24}$/.test(value);

export default function TrackingPage() {
  const [searchValue, setSearchValue] = useState("");
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderHistory | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = searchValue.trim();
    if (!trimmed) {
      toast.warning("Vui lòng nhập số điện thoại hoặc mã đơn hàng");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Tự động nhận diện: 24 ký tự hex → mã đơn, còn lại → số điện thoại
      const isId = isObjectId(trimmed);
      const phone = isId ? undefined : trimmed;
      const orderId = isId ? trimmed : undefined;
      const result = await trackOrder(phone, orderId);
      setOrders(result);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tra cứu. Vui lòng thử lại sau.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackageSearch size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl text-foreground">Tra cứu đơn hàng</h2>
              <p className="text-sm text-muted-foreground">Theo dõi trạng thái đơn hàng của bạn</p>
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    placeholder="Nhập số điện thoại hoặc mã đơn hàng..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                >
                  <Search size={16} />
                  {loading ? "Đang tìm..." : "Tra cứu"}
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Nhập mã đơn hàng hoặc số điện thoại đặt hàng — chỉ tra cứu được đơn trong vòng 24h gần nhất
              </p>
            </form>
          </div>

          {/* Results */}
          {hasSearched && !loading && (
            <div className="space-y-3">
              {orders.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Tìm thấy <span className="font-medium text-foreground">{orders.length}</span> đơn hàng
                </p>
              )}

              {orders.map(order => {
                const st = orderStatusConfig[order.status];
                const pt = paymentStatusConfig[order.paymentStatus];

                return (
                  <div
                    key={order._id}
                    onClick={() => setDetailOrder(order)}
                    className="border cursor-pointer border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm gap-3">
                        <span
                          title="Nhấn để copy toàn bộ ID"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(order._id);
                              toast.success("Đã sao chép ID!");
                            } catch {
                              toast.error("Không thể sao chép ID");
                            }
                          }}
                          className="hover:underline text-primary cursor-pointer"
                        >
                          ...{order._id.slice(-9)}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${st.color}`}>{st.label}</span>
                    </div>

                    {/* Items summary */}
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {order.items
                        .map(i => `${i.product_id?.name || i.combo?.name || i.combo_id?.name || i.sku} x${i.quantity}`)
                        .join(", ")}
                    </p>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                          {orderTypeLabels[order.orderType]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pt.color}`}>{pt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Chi tiết
                        </button>
                        <span className="text-primary text-sm font-medium">{formatVND(order.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <PackageSearch size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Không tìm thấy đơn hàng nào trong vòng 24h gần nhất</p>
                  <p className="text-sm text-muted-foreground mt-1">Vui lòng kiểm tra lại số điện thoại hoặc mã đơn hàng</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

      <Toaster position="top-right" richColors />
    </>
  );
}
