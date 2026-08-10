import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý menu",
  description: "Quản lý menu phục vụ tại các cửa hàng PaoPizza.",
  path: "/is/menu",
});

export default function MenuLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
