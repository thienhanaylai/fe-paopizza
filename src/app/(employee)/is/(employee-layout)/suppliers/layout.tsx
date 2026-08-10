import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý nhà cung cấp",
  description: "Quản lý nhà cung cấp nguyên liệu cho hệ thống PaoPizza.",
  path: "/is/suppliers",
});

export default function SuppliersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
