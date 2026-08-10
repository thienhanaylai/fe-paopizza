import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Tổng quan quản trị",
  description: "Bảng tổng quan vận hành nội bộ của PaoPizza.",
  path: "/is/dashboard",
});

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
