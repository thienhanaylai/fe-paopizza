"use client";

import { getAllOrder, OrderHistory } from "@/src/services/order.service";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  pending: { label: "Đợi xác nhận", color: "bg-gray-100 text-green-700" },
  delivering: { label: "Đang giao", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
};
const orderTypeLabels: Record<string, string> = {
  carry_out: "Đến lấy",
  delivery: "Giao hàng",
};

export default function Orders() {
  const [ordersHistory, setOrderHistory] = useState<OrderHistory[]>();
  useEffect(() => {
    const fecthData = async () => {
      const res = await getAllOrder("customer");
      setOrderHistory(res);
    };
    fecthData();
  }, []);
  console.log(ordersHistory);
  return (
    <>
      {" "}
      <section className="py-8">
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
            {ordersHistory?.map(order => {
              const st = orderStatusConfig[order.status];
              return (
                <div key={order._id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-primary">{order._id}</span>
                      <span className="text-sm text-muted-foreground">{order.createAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-foreground">
                        {orderTypeLabels[order.order_type]}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${st.color}`}>{st.label}</span>
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
      </section>
    </>
  );
}
