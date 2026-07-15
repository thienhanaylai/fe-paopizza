"use client";

import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useEmployeeAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/is") {
      router.push("/is");
    }
  }, [isAuthenticated, pathname, router]);

  return (
    <>
      <main className="flex-1">{children}</main>
    </>
  );
}
