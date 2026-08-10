import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Lịch sử đơn hàng",
  description: "Xem và quản lý lịch sử đặt món của tài khoản PaoPizza.",
  path: "/orders",
});

export default function OrdersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
