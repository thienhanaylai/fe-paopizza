import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Hồ sơ khách hàng",
  description: "Quản lý thông tin và địa chỉ giao hàng của tài khoản PaoPizza.",
  path: "/profile",
});

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
