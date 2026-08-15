"use client";

import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionReady } = useEmployeeAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isSessionReady && !isAuthenticated && pathname !== "/is") {
      router.replace("/is");
    }
  }, [isAuthenticated, isSessionReady, pathname, router]);

  return (
    <>
      <main className="flex-1">{children}</main>
    </>
  );
}
