"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Clock, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OrderHistory } from "@/src/services/order.service";
import { createPaymentRequest, checkPaymentStatus, PaymentRequestData } from "@/src/services/payment.service";
import { formatVND } from "@/src/utils/formatVND";

interface PaymentQRModalProps {
  order: OrderHistory;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

// Thời gian timeout thanh toán (phút)
const PAYMENT_TIMEOUT_MINUTES = 10;

export default function PaymentQRModal({ order, onClose, onPaymentSuccess }: PaymentQRModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tính thời gian hết hạn dựa trên createdAt + timeout
  const expiredAt = new Date(new Date(order.createdAt).getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

  // Format thời gian còn lại
  const formatTimeLeft = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyContent = async () => {
    if (!paymentData?.content) return;
    try {
      await navigator.clipboard.writeText(paymentData.content);
      toast.success("Đã sao chép nội dung chuyển khoản!");
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  // Fetch payment info
  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await createPaymentRequest(order._id, "customer");
      setPaymentData(data);
      setLoading(false);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Không thể tạo mã thanh toán");
      setLoading(false);
    }
  }, [order._id]);

  // Poll payment status
  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(order._id, "customer");
        if (status.paymentState === "paid") {
          setIsPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          toast.success("Thanh toán thành công!");
          onPaymentSuccess?.();
          setTimeout(() => onClose(), 2000);
        }
      } catch {
        // bỏ qua lỗi poll
      }
    }, 3000);
  }, [order._id, onClose, onPaymentSuccess]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiredAt.getTime() - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [expiredAt]);

  // Fetch payment data on mount
  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // Start polling after payment data is loaded
  useEffect(() => {
    if (paymentData && !isPaid && timeLeft > 0) {
      startPolling();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentData, isPaid, timeLeft, startPolling]);

  const isExpired = timeLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0" onClick={onClose}>
      <div
        className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-sm">Thanh toán đơn hàng</h3>
              <p className="text-xs text-muted-foreground">...{order._id.slice(-9)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center space-y-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tạo mã thanh toán...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchPaymentData}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {isPaid && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>
              <p className="text-foreground font-semibold">Thanh toán thành công!</p>
              <p className="text-sm text-muted-foreground">Đơn hàng của bạn đã được thanh toán.</p>
            </div>
          )}

          {isExpired && !isPaid && !loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-500 font-medium">Đã hết thời gian thanh toán</p>
              <p className="text-xs text-muted-foreground">Đơn hàng sẽ bị huỷ tự động. Vui lòng đặt lại đơn hàng mới.</p>
            </div>
          )}

          {paymentData && !isPaid && !isExpired && (
            <>
              <div className="flex items-center gap-2">
                <Clock size={16} className={timeLeft <= 60 ? "text-red-500 animate-pulse" : "text-primary"} />
                <span className={`text-sm font-mono font-semibold ${timeLeft <= 60 ? "text-red-500" : "text-foreground"}`}>
                  {formatTimeLeft(timeLeft)}
                </span>
                <span className="text-xs text-muted-foreground">còn lại</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-border">
                <img
                  src={paymentData.qrUrl}
                  alt="QR Code thanh toán"
                  className="w-56 h-56 object-contain"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              <p className="text-foreground text-lg font-semibold">{formatVND(paymentData.amount)}</p>

              <div className="w-full bg-muted/30 rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-muted-foreground">Nội dung chuyển khoản:</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm text-foreground font-mono bg-muted/50 px-2 py-1 rounded select-all">
                    {paymentData.content}
                  </code>
                  <button
                    onClick={handleCopyContent}
                    className="shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                    title="Sao chép"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Quét mã QR hoặc chuyển khoản với nội dung bên trên để thanh toán
              </p>
            </>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
          >
            {isPaid ? "Đóng" : "Đóng (sẽ kiểm tra lại sau)"}
          </button>
        </div>
      </div>
    </div>
  );
}
