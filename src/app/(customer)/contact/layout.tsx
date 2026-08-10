import { createSeoMetadata } from "@/src/config/seo";

export const metadata = createSeoMetadata({
  title: "Địa chỉ cửa hàng và hotline",
  description: "Tìm địa chỉ, hotline và giờ mở cửa của các chi nhánh PaoPizza gần bạn.",
  path: "/contact",
});

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
