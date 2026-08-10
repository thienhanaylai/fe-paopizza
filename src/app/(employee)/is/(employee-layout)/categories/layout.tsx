import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý danh mục",
  description: "Quản lý danh mục menu trong hệ thống nội bộ PaoPizza.",
  path: "/is/categories",
});

export default function CategoriesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
