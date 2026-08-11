import { Providers } from "./providers";
import CustomerLayoutContent from "./CustomerLayoutContent";
import StructuredData from "@/src/components/seo/StructuredData";
import { createSeoMetadata, SITE_NAME, SITE_URL } from "@/src/config/seo";

export const metadata = createSeoMetadata({
  title: "Pizza thủ công giao tận nơi",
  description:
    "PaoPizza (Pao Pizza) phục vụ pizza thủ công nóng hổi, nguyên liệu tươi ngon và giao tận nơi nhanh. Xem thực đơn và đặt pizza online.",
  path: "/",
});

const websiteStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["Pao Pizza", "Pizza Pao"],
    url: SITE_URL,
    logo: `${SITE_URL}/logopao.svg`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ["Pao Pizza", "Pizza Pao"],
    url: SITE_URL,
    inLanguage: "vi-VN",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  },
];

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <StructuredData data={websiteStructuredData} />
      <CustomerLayoutContent>{children}</CustomerLayoutContent>
    </Providers>
  );
}
