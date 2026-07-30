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

      // Xử lý null/undefined: đẩy về cuối
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Xử lý nested object (vd: ref_id.name) — hiện chưa hỗ trợ dot notation, cần mở rộng
      let aCompare = aVal;
      let bCompare = bVal;

      // Xử lý number
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Xử lý date
      if (aVal instanceof Date || !isNaN(Date.parse(aVal))) {
        aCompare = new Date(aVal).getTime();
        bCompare = new Date(bVal).getTime();
        return sortConfig.direction === "asc" ? aCompare - bCompare : bCompare - aCompare;
      }

      // Xử lý string (mặc định)
      aCompare = String(aVal).toLowerCase();
      bCompare = String(bVal).toLowerCase();

      if (aCompare < bCompare) return sortConfig.direction === "asc" ? -1 : 1;
      if (aCompare > bCompare) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  return { sortedData, sortConfig, toggleSort };
}
