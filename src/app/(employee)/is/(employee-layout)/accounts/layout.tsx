import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý tài khoản",
  description: "Quản lý tài khoản nội bộ của hệ thống PaoPizza.",
  path: "/is/accounts",
});

export default function AccountsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
