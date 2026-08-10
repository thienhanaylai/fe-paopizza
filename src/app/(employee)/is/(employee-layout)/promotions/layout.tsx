import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý khuyến mãi",
  description: "Quản lý chương trình khuyến mãi và mã ưu đãi PaoPizza.",
  path: "/is/promotions",
});

export default function PromotionsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
