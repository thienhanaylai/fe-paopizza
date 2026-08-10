import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Quản lý cửa hàng",
  description: "Quản lý thông tin và trạng thái cửa hàng PaoPizza.",
  path: "/is/stores",
});

export default function StoresLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
