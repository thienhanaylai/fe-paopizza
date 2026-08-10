import { createSeoMetadata } from "@/src/config/seo";

export const metadata = createSeoMetadata({
  title: "Điều khoản sử dụng",
  description: "Các điều khoản áp dụng khi sử dụng website và dịch vụ đặt món của PaoPizza.",
  path: "/terms",
});

export default function TermsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
