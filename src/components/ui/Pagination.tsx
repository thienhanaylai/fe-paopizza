"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }: PaginationProps) {
  if (total === 0) return null;

  const getVisiblePages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 2;

    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (rangeStart > 2) pages.push("...");

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const handleLimitChange = (newLimit: number) => {
    onLimitChange(newLimit);
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Hiển thị{" "}
          <span className="text-foreground font-medium">
            {startItem}-{endItem}
          </span>{" "}
          trên tổng <span className="text-foreground font-medium">{total}</span> kết quả
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Số dòng:</span>
          <select
            value={limit}
            onChange={e => handleLimitChange(Number(e.target.value))}
            className="bg-card border border-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            Trước
          </button>
          {getVisiblePages().map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 py-1 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 rounded-lg text-sm transition-all ${
                  page === p ? "bg-primary text-white shadow-sm" : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sau
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
