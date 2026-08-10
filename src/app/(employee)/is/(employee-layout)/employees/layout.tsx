import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý nhân viên",
  description: "Quản lý hồ sơ và phân công nhân viên PaoPizza.",
  path: "/is/employees",
});

export default function EmployeesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
