import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý đơn hàng",
  description: "Theo dõi và xử lý đơn hàng trong hệ thống PaoPizza.",
  path: "/is/orders",
});

export default function AdminOrdersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
