"use client";

import { EmployeeAuthProvider } from "@/src/context/authEmployeeContext";
import { Providers } from "./providers";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Providers>
        <EmployeeAuthProvider>{children}</EmployeeAuthProvider>
      </Providers>
    </>
  );
}
