import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Khách hàng thân thiết",
  description: "Quản lý chương trình khách hàng thân thiết của PaoPizza.",
  path: "/is/loyalty-customers",
});

export default function LoyaltyCustomersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
