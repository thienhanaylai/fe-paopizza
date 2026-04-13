import { Providers } from "./providers";
import CustomerLayoutContent from "./CustomerLayoutContent";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <CustomerLayoutContent>{children}</CustomerLayoutContent>
    </Providers>
  );
}
