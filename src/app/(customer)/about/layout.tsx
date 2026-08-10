import { createSeoMetadata } from "@/src/config/seo";

export const metadata = createSeoMetadata({
  title: "Câu chuyện thương hiệu",
  description: "Khám phá câu chuyện, giá trị và hành trình tạo nên những chiếc pizza thủ công của PaoPizza.",
  path: "/about",
});

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
