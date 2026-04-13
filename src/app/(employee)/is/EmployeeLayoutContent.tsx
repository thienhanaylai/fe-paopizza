"use client";

export default function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1">{children}</main>
    </>
  );
}
