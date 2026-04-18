"use client";

import { getAllOrder, OrderHistory } from "@/src/services/order.service";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
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
const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-teal-100 text-teal-700" },
  preparing: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
  delivering: { label: "Đang giao", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Hoàn thành", color: "bg-green-200 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

// const orderStatusConfig: Record<string, { label: string; color: string }> = {
//   completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
//   pending: { label: "Đợi xác nhận", color: "bg-gray-100 text-green-700" },
//   delivering: { label: "Đang giao", color: "bg-blue-100 text-blue-700" },
//   cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
// };
const orderTypeLabels: Record<string, string> = {
  carry_out: "Đến lấy",
  delivery: "Giao hàng",
};

export default function Orders() {
  const { getInfo } = useCustomerAuth();
  const [ordersHistory, setOrderHistory] = useState<OrderHistory[]>();
  useEffect(() => {
    const fecthData = async () => {
      const customer = await getInfo();
      const res = await getAllOrder(`customer_id=${customer.ref_id._id}`, "customer");
      setOrderHistory(res);
    };
    fecthData();
  }, []);

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
                        <span className="text-sm text-muted-foreground underline">{order.store_id.address}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${st.color}`}>{st.label}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-foreground">
                        {orderTypeLabels[order.order_type]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product_id.name} x{item.quantity}
                        </span>
                        <span className="text-foreground">{formatVND(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">Tổng cộng</span>
                    <span className="text-primary text-lg">{formatVND(order.total)}</span>
                  </div>
                  {order.status === "completed" && (
                    <button className="mt-3 w-full py-2.5 rounded-xl border border-primary text-primary text-sm hover:bg-primary/5 transition-colors">
                      Đặt lại đơn này
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
    </>
  );
}
