"use client";

import { Sidebar } from "@/src/components/layouts/SideBarAdmin";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = useEmployeeAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/is") {
      router.push("/is");
    }
  }, [isAuthenticated, pathname, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
