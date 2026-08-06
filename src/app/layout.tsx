import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "@/src/app/styles/index.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pizza.pao.io.vn"),
  title: "PaoPizza",
  description: "PaoPizza - Pizza ngon, giao nhanh",

  openGraph: {
    title: "PaoPizza",
    description: "PaoPizza - Pizza ngon, giao nhanh",
    url: "https://pizza.pao.io.vn",
    siteName: "PaoPizza",
    images: [
      {
        url: "/logopao.svg",
        width: 1200,
        height: 630,
        alt: "PaoPizza Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PaoPizza",
  },

  icons: {
    icon: "/logopao.svg",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      lang="vi"
      className={`${beVietnamPro.variable} light antialiased`}
    >
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-background font-sans">
        {children}
      </body>
    </html>
  );
}
