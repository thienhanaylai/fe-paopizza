import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Danh mục nguyên liệu",
  description: "Quản lý danh mục nguyên liệu trong hệ thống PaoPizza.",
  path: "/is/ingredient-catalog",
});

export default function IngredientCatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
