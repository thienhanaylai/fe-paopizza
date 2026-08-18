import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý thanh toán",
  description: "Theo dõi các đơn chuyển khoản đang chờ thanh toán tại cửa hàng.",
  path: "/is/payments",
});

export default function PaymentsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
