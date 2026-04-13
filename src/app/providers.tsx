"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
