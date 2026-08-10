import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Điểm thưởng và ưu đãi",
  description: "Theo dõi điểm thưởng và ưu đãi dành riêng cho thành viên PaoPizza.",
  path: "/loyalty",
});

export default function LoyaltyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
