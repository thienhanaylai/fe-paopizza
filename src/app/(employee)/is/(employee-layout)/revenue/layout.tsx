import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Báo cáo doanh thu",
  description: "Theo dõi báo cáo doanh thu nội bộ của PaoPizza.",
  path: "/is/revenue",
});

export default function RevenueLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
