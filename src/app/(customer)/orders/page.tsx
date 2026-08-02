"use client";

import { customerCancelOrder, getAllOrder, OrderHistory, type PaginationInfo } from "@/src/services/order.service";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { formatVND } from "@/src/utils/formatVND";
import { formatDateTime } from "@/src/utils/formatDateTime";
import OrderDetailModal from "@/src/components/modals/OrderDetailModal";
import PaymentQRModal from "@/src/components/modals/PaymentQRModal";

// Thời gian timeout thanh toán (phút) - đồng bộ với backend cron job
const PAYMENT_TIMEOUT_MINUTES = 15;

function fmtAddress(addr: string | { streetNumber: string; district: string; city: string }): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  return [addr.streetNumber, addr.district, addr.city].filter(Boolean).join(", ");
}

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
  failed: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

const orderTypeLabels: Record<string, string> = {
  carry_out: "Đến lấy",
  delivery: "Giao hàng",
};

export default function Orders() {
  const { getInfo } = useCustomerAuth();
  const [modalConfirm, setModalConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState("");
  const [ordersHistory, setOrderHistory] = useState<OrderHistory[]>();
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderHistory | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<OrderHistory | null>(null);

  const fecthData = async (page: number = 1) => {
    setLoading(true);
    const customer = await getInfo();

    const res = await getAllOrder(`customer_id=${customer.ref_id?._id}`, "customer", page, 10);
    setOrderHistory(res.data);
    setPagination(res.pagination);
    setLoading(false);
  };
  useEffect(() => {
    fecthData(1);
  }, []);

  const handleCancelOrder = async (oder_id: string) => {
    try {
      const res = await customerCancelOrder(oder_id, "customer");
      if (res) {
        toast.success("Huỷ đơn hàng thành công!");
        fecthData(pagination.page);
        setModalConfirm(false);
      }
    } catch (error) {}
  };

  // Kiểm tra đơn hàng đã hết hạn thanh toán chưa
  const isPaymentExpired = (order: OrderHistory) => {
    const expiredAt = new Date(new Date(order.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
    return Date.now() > expiredAt.getTime();
  };

  // Chỉ hiển thị nút thanh toán cho các phương thức hỗ trợ QR
  const canPayOnline = (order: OrderHistory) => {
    return ["qrCode", "ewallet", "card"].includes(order.paymentMethod);
  };

  const handlePaymentSuccess = () => {
    setPaymentOrder(null);
    fecthData(pagination.page);
  };

  return (
    <>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl text-foreground">Lịch sử đơn hàng</h2>
              <p className="text-sm text-muted-foreground">Theo dõi các đơn hàng đã đặt</p>
            </div>
          </div>
          <div className="space-y-4">
            {ordersHistory?.length === 0 && (
              <p className="text-xl p-5 text-center text-muted-foreground">Chưa có đơn hàng nào!</p>
            )}
            {ordersHistory?.map(order => {
              const st = orderStatusConfig[order.status];
              const pt = paymentStatusConfig[order.paymentStatus];
              return (
                <div key={order._id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex  sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 ">
                    <div className="flex gap-2">
                      <div className=" flex flex-col gap-2">
                        <span
                          title="Nhấn để copy toàn bộ ID"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(order._id);
                              toast.success("Đã sao chép ID!");
                            } catch (err) {
                              toast.error("Không thể sao chép ID");
                            }
                          }}
                          className="hover:underline text-primary cursor-pointer "
                        >
                          ...{order._id.slice(-9)}
                        </span>
                        <span className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm w-fit px-2 py-1 rounded-full bg-primary/10 text-primary ">
                          {order.store_id.name}
                        </span>
                        <span className="text-sm text-muted-foreground underline">{fmtAddress(order.store_id.address)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-muted text-foreground">
                          {orderTypeLabels[order.orderType]}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${pt.color}`}>{pt.label}</span>
                      </div>
                      {order.status !== "cancelled" && (
                        <span className={`px-2 py-1 rounded-full text-xs ${st.color}`}>{st.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product_id?.name || item.sku} x{item.quantity}
                        </span>

                        <span className="text-foreground">{formatVND(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">Tổng cộng</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetailOrder(order)} className="text-xs text-primary hover:underline font-medium">
                        Chi tiết
                      </button>
                      <span className="text-primary text-lg">{formatVND(order.total)}</span>
                    </div>
                  </div>
                  {order.paymentStatus === "pending" && order.status === "pending" && (
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => {
                          setModalConfirm(true);
                          setConfirmId(order._id);
                        }}
                        className="bg-white text-primary py-2 px-3 rounded-xl border-primary border hover:text-white hover:bg-primary/90 transition-all active:scale-[0.98] text-sm"
                      >
                        Huỷ đơn hàng
                      </button>
                      {!isPaymentExpired(order) && canPayOnline(order) && (
                        <button
                          onClick={() => setPaymentOrder(order)}
                          className="bg-primary text-primary-foreground py-2 px-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] text-sm"
                        >
                          Thanh toán
                        </button>
                      )}
                    </div>
                  )}

                  {/* {order.status === "completed" && (
                    <button className="mt-3 w-full py-2.5 rounded-xl border border-primary text-primary text-sm hover:bg-primary/5 transition-colors">
                      Đặt lại đơn này
                    </button>
                  )} */}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={() => fecthData(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => fecthData(pageNum)}
                  disabled={loading}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === pagination.page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => fecthData(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center mt-4">
              <span className="text-sm text-muted-foreground">Đang tải...</span>
            </div>
          )}
        </div>
        {modalConfirm && (
          <>
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
              onClick={() => {
                setModalConfirm(false);
                setConfirmId("");
              }}
            >
              <div
                className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => {
                  e.stopPropagation();
                  setConfirmId("");
                }}
              >
                <h3>Xác nhận huỷ đơn hàng</h3>
                <div className="flex gap-1 m-2">Bạn có chắc chắn muốn huỷ đơn hàng này!</div>
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => {
                      setModalConfirm(false);
                      setConfirmId("");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-black hover:bg-red-50 transition-colors"
                  >
                    Thoát
                  </button>
                  <button
                    onClick={() => {
                      handleCancelOrder(confirmId);
                      setConfirmId("");
                    }}
                    className="flex-1 py-2.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors"
                  >
                    Huỷ đơn hàng
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        <Toaster position="top-right" richColors />
        {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
        {paymentOrder && (
          <PaymentQRModal order={paymentOrder} onClose={() => setPaymentOrder(null)} onPaymentSuccess={handlePaymentSuccess} />
        )}
      </div>
    </>
  );
}
