"use client";
import { useMemo, useState } from "react";
export type SortDirection = "asc" | "desc";
export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useSort<T>(data: T[], defaultKey: string = "name", defaultDir: SortDirection = "asc") {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultKey,
    direction: defaultDir,
  });

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return data;

    const sorted = [...data].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Xử lý null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Xử lý Number
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      //Xử lý Date
      const isADate =
        aVal instanceof Date || (typeof aVal === "string" && !isNaN(Date.parse(aVal)) && /^\d{4}-\d{2}-\d{2}/.test(aVal));
      const isBDate =
        bVal instanceof Date || (typeof bVal === "string" && !isNaN(Date.parse(bVal)) && /^\d{4}-\d{2}-\d{2}/.test(bVal));

      if (isADate && isBDate) {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
      }

      // Xử lý String
      const aStr = String(aVal);
      const bStr = String(bVal);

      const cmp = aStr.localeCompare(bStr, undefined, {
        numeric: true,
        sensitivity: "base", // Bỏ qua phân biệt hoa/thường
      });

      return sortConfig.direction === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [data, sortConfig]);

  return { sortedData, sortConfig, toggleSort };
}
