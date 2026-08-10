import { createSeoMetadata } from "@/src/config/seo";

export const metadata = createSeoMetadata({
  title: "Chính sách bảo mật",
  description: "Chính sách thu thập, sử dụng và bảo vệ thông tin khách hàng tại PaoPizza.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
