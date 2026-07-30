"use client";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SortConfig } from "@/src/hooks/useSort";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({ label, sortKey, sortConfig, onSort, className = "" }: SortableHeaderProps) {
  const isActive = sortConfig.key === sortKey;
  const Icon = !isActive ? ArrowUpDown : sortConfig.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none hover:bg-muted/30 transition-colors group ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <Icon
          size={14}
          className={`transition-colors ${isActive ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"}`}
        />
      </div>
    </th>
  );
}
