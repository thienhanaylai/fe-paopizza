import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Header from "@/src/components/layouts/Header";
import "../styles/index.css";
import Footer from "@/src/components/layouts/Footer";
import { CartProvider } from "@/src/context/cartContext";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro", // Tạo biến CSS để truyền vào Tailwind
});

export const metadata: Metadata = {
  title: "PaoPizza",
  description: "PaoPizza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CartProvider>
        <Header />
        <html suppressHydrationWarning lang="en" className={`${beVietnamPro.variable} h-full antialiased`}>
          <body suppressHydrationWarning className="min-h-full flex flex-col">
            {children}
          </body>
        </html>
        <Footer />
      </CartProvider>
    </>
  );
}
