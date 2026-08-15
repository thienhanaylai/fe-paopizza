"use client";

import { Sidebar } from "@/src/components/layouts/SideBarAdmin";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isSessionReady } = useEmployeeAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isSessionReady && !isAuthenticated && pathname !== "/is") {
      router.replace("/is");
    }
  }, [isAuthenticated, isSessionReady, pathname, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
