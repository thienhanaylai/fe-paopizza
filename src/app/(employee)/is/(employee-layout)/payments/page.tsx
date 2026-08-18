"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, QrCode, RefreshCcw, LoaderCircle, Eye } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { getAllOrder, type OrderHistory } from "@/src/services/order.service";
import PaymentQRModal from "@/src/components/modals/PaymentQRModal";
import { formatVND } from "@/src/utils/formatVND";
import { PAYMENT_TIMEOUT_MS } from "@/src/services/payment.service";

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isQrPayment = (order: OrderHistory) => order.paymentMethod === "qrCode" || order.paymentMethod === "ewallet";

export default function Payments() {
  const { getInfo } = useEmployeeAuth();
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [paymentOrder, setPaymentOrder] = useState<OrderHistory | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPendingPayments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const info = (await getInfo()) as { ref_id?: { store_id?: string } };
      const storeId = info?.ref_id?.store_id;
      if (!storeId) return;

      const response = await getAllOrder(`store_id=${storeId}`, "", 1, 999);
      setOrders(response.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thanh toán:", error);
      toast.error("Không thể tải danh sách thanh toán");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [getInfo]);

  useEffect(() => {
    void fetchPendingPayments();
    const intervalId = window.setInterval(() => void fetchPendingPayments(false), 10_000);
    return () => window.clearInterval(intervalId);
  }, [fetchPendingPayments]);

  const pendingPayments = useMemo(
    () =>
      orders
        .filter(order => order.paymentStatus === "pending" && order.status !== "cancelled" && isQrPayment(order))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground">Quản lý thanh toán</h1>
          <p className="mt-1 text-muted-foreground">Mở lại mã QR cho các đơn chuyển khoản chưa thanh toán.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchPendingPayments()}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
        >
          <RefreshCcw size={18} /> Làm mới
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Đơn đang chờ chuyển khoản</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tự động cập nhật mỗi 10 giây.</p>
          </div>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            {pendingPayments.length} đơn
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <LoaderCircle size={18} className="animate-spin" /> Đang tải...
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <QrCode size={38} className="opacity-40" />
            <p className="text-sm">Không có đơn chuyển khoản nào đang chờ thanh toán.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-3">Mã đơn</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">Thời gian</th>
                  <th className="px-3 py-3">Tổng tiền</th>
                  <th className="px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(order => {
                  const expired = Date.now() - new Date(order.createdAt).getTime() >= PAYMENT_TIMEOUT_MS;
                  return (
                    <tr key={order._id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-4 font-mono text-primary">...{order._id.slice(-8)}</td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-foreground">{order.contact_info.full_name}</p>
                        <p className="text-xs text-muted-foreground">{order.contact_info.phone}</p>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} /> {formatDateTime(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-semibold text-foreground">{formatVND(order.total)}</td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          disabled={expired}
                          onClick={() => setPaymentOrder(order)}
                          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {expired ? <Clock size={14} /> : <Eye size={14} />}
                          {expired ? "Đã hết hạn" : "Hiển thị QR"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paymentOrder && (
        <PaymentQRModal
          order={paymentOrder}
          typeUser="employee"
          onClose={() => setPaymentOrder(null)}
          onPaymentSuccess={() => void fetchPendingPayments(false)}
        />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
