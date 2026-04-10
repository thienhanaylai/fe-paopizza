import Header from "@/src/components/layouts/Header";
import Footer from "@/src/components/layouts/Footer";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
