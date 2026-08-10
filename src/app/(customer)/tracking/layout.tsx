import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Tra cứu đơn hàng",
  description: "Tra cứu trạng thái đơn hàng PaoPizza bằng mã đơn và thông tin liên hệ.",
  path: "/tracking",
});

export default function TrackingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
