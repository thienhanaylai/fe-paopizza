"use client";

import { X, Store, User, ShoppingBag, Receipt, MapPin, Phone, Mail } from "lucide-react";
import { OrderHistory, OrderItemHistory, ComboSelectionPopulated } from "@/src/services/order.service";
import { formatVND } from "@/src/utils/formatVND";
import { formatDateTime } from "@/src/utils/formatDateTime";

interface OrderDetailModalProps {
  order: OrderHistory;
  onClose: () => void;
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

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const st = orderStatusConfig[order.status];
  const pt = paymentStatusConfig[order.paymentStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0" onClick={onClose}>
      <div
        className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Trạng thái */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pt.color}`}>{pt.label}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-muted text-foreground">{orderTypeLabels[order.orderType]}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-muted text-foreground">
              {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>

          {/* Thời gian */}
          <div className="text-xs text-muted-foreground">Đặt lúc: {formatDateTime(order.createdAt)}</div>

          {/* Cửa hàng */}
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

          {/* Thông tin liên hệ */}
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

          {/* Danh sách món */}
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

          {/* Ghi chú đơn hàng */}
          {order.note && (
            <div className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs text-muted-foreground font-medium">Ghi chú:</span>
              <p className="text-sm text-foreground mt-0.5">{order.note}</p>
            </div>
          )}

          {/* Tổng tiền */}
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

        {/* Footer */}
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
