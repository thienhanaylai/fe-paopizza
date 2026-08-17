"use client";

import { customerCancelOrder, getAllOrder, OrderHistory, type PaginationInfo } from "@/src/services/order.service";
import { History } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { formatVND } from "@/src/utils/formatVND";
import { formatDateTime } from "@/src/utils/formatDateTime";
import OrderDetailModal from "@/src/components/modals/OrderDetailModal";
import PaymentQRModal from "@/src/components/modals/PaymentQRModal";
import { PAYMENT_TIMEOUT_MS } from "@/src/services/payment.service";

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-teal-100 text-teal-700" },
  preparing: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
  delivering: { label: "Đang giao", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Hoàn thành", color: "bg-green-200 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
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
  const [currentTime, setCurrentTime] = useState<number | null>(null);

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
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

  const isPaymentExpired = (order: OrderHistory) => {
    const expiredAt = new Date(new Date(order.createdAt).getTime() + PAYMENT_TIMEOUT_MS);
    return currentTime === null || currentTime > expiredAt.getTime();
  };

  const canPayOnline = (order: OrderHistory) => {
    return ["qrCode", "ewallet"].includes(order.paymentMethod);
  };

  const handlePaymentSuccess = () => {
    fecthData(pagination.page);
  };

  const handleClosePayment = useCallback(() => setPaymentOrder(null), []);

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
              return (
                <div
                  key={order._id}
                  onClick={() => setDetailOrder(order)}
                  className="border cursor-pointer border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm gap-3">
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
                      <span className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {order.items.map(i => `${i.product_id?.name || i.sku} x${i.quantity}`).join(", ")}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                      {orderTypeLabels[order.orderType]}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.paymentStatus === "pending" &&
                        order.status === "pending" &&
                        !isPaymentExpired(order) &&
                        canPayOnline(order) && (
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              setPaymentOrder(order);
                            }}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Thanh toán
                          </button>
                        )}
                      <button onClick={() => setDetailOrder(order)} className="text-xs text-primary hover:underline font-medium">
                        Chi tiết
                      </button>
                      <span className="text-primary text-sm">{formatVND(order.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {loading && (
            <div className="flex justify-center mt-4">
              <span className="text-sm text-muted-foreground">Đang tải...</span>
            </div>
          )}
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
          <PaymentQRModal order={paymentOrder} onClose={handleClosePayment} onPaymentSuccess={handlePaymentSuccess} />
        )}
      </div>
    </>
  );
}
