"use client";

import { ReactNode } from "react";
import { EmployeeAuthProvider } from "@/src/context/authEmployeeContext";
export function Providers({ children }: { children: ReactNode }) {
  return <EmployeeAuthProvider>{children}</EmployeeAuthProvider>;
}
