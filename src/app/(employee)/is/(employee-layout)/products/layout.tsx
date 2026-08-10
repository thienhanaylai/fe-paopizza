import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý sản phẩm",
  description: "Quản lý sản phẩm và biến thể trong hệ thống PaoPizza.",
  path: "/is/products",
});

export default function ProductsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
