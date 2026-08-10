import AdminLayoutContent from "./AdminLayoutContent";
import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Hệ thống quản trị",
  description: "Khu vực quản trị nội bộ của PaoPizza.",
  path: "/is/dashboard",
});

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
