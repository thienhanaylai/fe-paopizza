"use client";

import {
  X,
  Store,
  User,
  ShoppingBag,
  Receipt,
  MapPin,
  Phone,
  Mail,
  Check,
  AlertCircle,
  Truck,
  ClipboardCheck,
  Clock,
  ChefHat,
} from "lucide-react";
import { OrderHistory, OrderItemHistory, ComboSelectionPopulated } from "@/src/services/order.service";
import { formatVND } from "@/src/utils/formatVND";
import { formatDateTime } from "@/src/utils/formatDateTime";

interface OrderDetailModalProps {
  order: OrderHistory;
  onClose: () => void;
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
  success: { label: "Đã thanh toán", color: "bg-green-200 text-green-700" },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-700" },
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  qrCode: "QR Code",
  ewallet: "Ví điện tử",
  card: "Thẻ",
};

const orderTypeLabels: Record<string, string> = {
  carry_out: "Đến lấy",
  delivery: "Giao hàng",
  dine_in: "Dùng tại chỗ",
};

function fmtAddress(addr: string | { streetNumber: string; district: string; city: string }): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  return [addr.streetNumber, addr.district, addr.city].filter(Boolean).join(", ");
}

function ComboSelectionItem({ sel }: { sel: ComboSelectionPopulated }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4 mt-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
      <span>{sel.product_id?.name || sel.sku}</span>
      <span className="text-[11px] opacity-70">({sel.size})</span>
      {sel.added_topping && sel.added_topping.length > 0 && (
        <span className="text-[11px] opacity-60">
          +{" "}
          {sel.added_topping
            .map(t => t.ingredient?.name || "")
            .filter(Boolean)
            .join(", ")}
        </span>
      )}
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderItemHistory }) {
  const isCombo = item.item_type === "combo";
  const name = isCombo ? item.combo_id?.name : item.product_id?.name;
  const displayName = name || item.sku;

  return (
    <div className="py-2.5 border-b border-border last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground">x{item.quantity}</span>
            {isCombo && <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 shrink-0">Combo</span>}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {item.size && item.size !== "combo" && <span className="text-xs text-muted-foreground">Size: {item.size}</span>}
            {item.added_topping && item.added_topping.length > 0 && (
              <span className="text-xs text-muted-foreground">
                + Thêm:{" "}
                {item.added_topping
                  .map(t => t.ingredient?.name || "")
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </div>

          {item.note && <p className="text-xs text-muted-foreground italic mt-0.5">Ghi chú: {item.note}</p>}

          {item.combo_selections && item.combo_selections.length > 0 && (
            <div className="mt-1">
              <span className="text-[11px] text-muted-foreground font-medium">Đã chọn:</span>
              {item.combo_selections.map((sel, i) => (
                <ComboSelectionItem key={i} sel={sel} />
              ))}
            </div>
          )}
        </div>

        <span className="text-sm text-foreground shrink-0">{formatVND(item.price * item.quantity)}</span>
      </div>
    </div>
  );
}

const stepColorMap: Record<string, { bg: string; light: string; text: string; ring: string; line: string }> = {
  pending: {
    bg: "bg-yellow-500",
    light: "bg-yellow-100",
    text: "text-yellow-700",
    ring: "ring-yellow-500",
    line: "bg-primary",
  },
  confirmed: {
    bg: "bg-teal-500",
    light: "bg-teal-100",
    text: "text-teal-700",
    ring: "ring-teal-500",
    line: "bg-primary",
  },
  preparing: {
    bg: "bg-blue-500",
    light: "bg-blue-100",
    text: "text-blue-700",
    ring: "ring-blue-500",
    line: "bg-primary",
  },
  delivering: {
    bg: "bg-purple-500",
    light: "bg-purple-100",
    text: "text-purple-700",
    ring: "ring-purple-500",
    line: "bg-primary",
  },
  completed: {
    bg: "bg-green-500",
    light: "bg-green-100",
    text: "text-green-700",
    ring: "ring-green-500",
    line: "bg-primary",
  },
};

function OrderProgressBar({ status, orderType }: { status: string; orderType: string }) {
  const allSteps = [
    { key: "pending", label: "Chờ xử lý", Icon: Clock },
    { key: "confirmed", label: "Đã xác nhận", Icon: ClipboardCheck },
    { key: "preparing", label: "Đang làm", Icon: ChefHat },
    { key: "delivering", label: "Đang giao", Icon: Truck },
    { key: "completed", label: "Hoàn thành", Icon: Check },
  ];

  // Delivery orders have delivering step; carry_out / dine_in skip it
  const steps = orderType === "delivery" ? allSteps : allSteps.filter(s => s.key !== "delivering");

  const isCancelled = status === "cancelled";
  const currentIdx = steps.findIndex(s => s.key === status);

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-red-50 rounded-xl border border-red-200">
        <AlertCircle size={20} className="text-red-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Đơn hàng đã bị hủy</p>
          <p className="text-xs text-red-500 mt-0.5">Đơn hàng này không còn hiệu lực</p>
        </div>
      </div>
    );
  }

  if (currentIdx === -1) return null;

  return (
    <div className="py-2">
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const StepIcon = step.Icon;
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const colors = stepColorMap[step.key];

          return (
            <div key={step.key} className="flex items-start flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? `${colors.bg} text-white`
                      : isCurrent
                        ? `${colors.light} ${colors.text} ring-2 ${colors.ring} ring-offset-2`
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <StepIcon size={14} />}
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
                    isCompleted ? colors.text : isCurrent ? colors.text : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line after (except last) */}
              {idx < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center px-1" style={{ paddingTop: "1rem" }}>
                  <div
                    className={`h-0.5 w-full rounded-full transition-colors duration-500 ${isCompleted ? colors.line : "bg-gray-200"}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const pt = paymentStatusConfig[order.paymentStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0" onClick={onClose}>
      <div
        className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-sm">Chi tiết đơn hàng</h3>
              <p className="text-xs text-muted-foreground">...{order._id.slice(-9)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <OrderProgressBar status={order.status} orderType={order.orderType} />

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pt.color}`}>{pt.label}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-muted text-foreground">{orderTypeLabels[order.orderType]}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-muted text-foreground">
              {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">Đặt lúc: {formatDateTime(order.createdAt)}</div>

          <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Store size={14} className="text-primary shrink-0" />
              <span className="font-medium text-foreground">{order.store_id.name}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <MapPin size={12} className="shrink-0 mt-0.5" />
              {fmtAddress(order.store_id.address)}
            </p>
          </div>

          <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-primary shrink-0" />
              <span className="font-medium text-foreground">Thông tin nhận hàng</span>
            </div>
            <p className="text-sm text-foreground">{order.contact_info.full_name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone size={12} className="shrink-0" />
              {order.contact_info.phone}
            </p>
            {order.contact_info.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail size={12} className="shrink-0" />
                {order.contact_info.email}
              </p>
            )}
            {order.orderType === "delivery" && order.contact_info.address && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <MapPin size={12} className="shrink-0 mt-0.5" />
                {order.contact_info.address}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <ShoppingBag size={14} className="text-primary" />
              Món đã đặt ({order.items.length})
            </h4>
            <div className="bg-muted/20 rounded-xl px-3">
              {order.items.map((item, i) => (
                <OrderItemRow key={i} item={item} />
              ))}
            </div>
          </div>

          {order.note && (
            <div className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs text-muted-foreground font-medium">Ghi chú:</span>
              <p className="text-sm text-foreground mt-0.5">{order.note}</p>
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="text-foreground">{formatVND(order.subTotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giảm giá</span>
                <span className="text-green-600">-{formatVND(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base pt-1.5 border-t border-border">
              <span className="font-semibold text-foreground">Tổng cộng</span>
              <span className="font-semibold text-primary">{formatVND(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
