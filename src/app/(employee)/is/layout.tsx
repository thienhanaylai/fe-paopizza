import EmployeeProviders from "./EmployeeProviders";
import { createSeoMetadata } from "@/src/config/seo";

export const metadata = createSeoMetadata({
  title: "Đăng nhập nhân viên",
  description: "Đăng nhập hệ thống quản lý nội bộ PaoPizza dành cho nhân viên.",
  path: "/is",
});

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <EmployeeProviders>{children}</EmployeeProviders>
  );
}
