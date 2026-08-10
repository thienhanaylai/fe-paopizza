import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Bán hàng tại quầy",
  description: "Màn hình bán hàng tại quầy dành cho nhân viên PaoPizza.",
  path: "/is/pos",
});

export default function PosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
