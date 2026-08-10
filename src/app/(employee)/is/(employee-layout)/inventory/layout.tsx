import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Kho nguyên liệu",
  description: "Theo dõi và quản lý kho nguyên liệu nội bộ PaoPizza.",
  path: "/is/inventory",
});

export default function InventoryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
