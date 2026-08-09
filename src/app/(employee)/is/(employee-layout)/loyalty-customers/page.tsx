"use client";

import Pagination from "@/src/components/ui/Pagination";
import {
  getLoyaltyCustomers,
  type LoyaltyCustomer,
  type LoyaltyCustomersQuery,
  type LoyaltySummary,
  type LoyaltyTier,
} from "@/src/services/customer.service";
import { formatVND } from "@/src/utils/formatVND";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Crown,
  Filter,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

type SortField = NonNullable<LoyaltyCustomersQuery["sortBy"]>;
type SortOrder = NonNullable<LoyaltyCustomersQuery["sortOrder"]>;

const emptySummary: LoyaltySummary = {
  totalCustomers: 0,
  totalCompletedOrders: 0,
  totalItemsPurchased: 0,
  totalSpent: 0,
  tierCounts: { member: 0, silver: 0, gold: 0, diamond: 0 },
};

const tierConfig: Record<
  LoyaltyTier,
  { label: string; badge: string; icon: typeof Award }
> = {
  member: {
    label: "Thành viên",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Users,
  },
  silver: {
    label: "Bạc",
    badge: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Award,
  },
  gold: {
    label: "Vàng",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Crown,
  },
  diamond: {
    label: "Kim cương",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: Sparkles,
  },
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

function SortButton({
  field,
  label,
  activeField,
  order,
  onSort,
  align = "left",
}: {
  field: SortField;
  label: string;
  activeField: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}) {
  const Icon = order === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex w-full items-center gap-1 text-sm font-semibold text-foreground/70 transition-colors hover:text-primary ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      {label}
      {activeField === field && <Icon size={13} />}
    </button>
  );
}

export default function LoyaltyCustomersPage() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [summary, setSummary] = useState<LoyaltySummary>(emptySummary);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tier, setTier] = useState<LoyaltyTier | "all">("all");
  const [sortBy, setSortBy] = useState<SortField>("totalSpent");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tier]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getLoyaltyCustomers({
        page,
        limit,
        search: debouncedSearch,
        tier,
        sortBy,
        sortOrder,
      });
      setCustomers(response.data);
      setSummary(response.summary);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách khách hàng";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, limit, page, sortBy, sortOrder, tier]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleSort = (field: SortField) => {
    if (field === sortBy) {
      setSortOrder(current => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  const statCards = [
    {
      label: "Khách hàng",
      value: numberFormatter.format(summary.totalCustomers),
      detail: `${summary.tierCounts.gold + summary.tierCounts.diamond} khách hạng cao`,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Đơn hoàn tất",
      value: numberFormatter.format(summary.totalCompletedOrders),
      detail: `${numberFormatter.format(summary.totalItemsPurchased)} sản phẩm đã mua`,
      icon: PackageCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Tổng chi tiêu",
      value: formatVND(summary.totalSpent),
      detail: "Từ các đơn đã hoàn tất",
      icon: WalletCards,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Hạng Kim cương",
      value: numberFormatter.format(summary.tierCounts.diamond),
      detail: `${numberFormatter.format(summary.tierCounts.gold)} khách hạng Vàng`,
      icon: Sparkles,
      color: "bg-cyan-50 text-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground">Khách hàng thân thiết</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi điểm, hạng thành viên và toàn bộ giá trị mua hàng của khách hàng.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
              <p className="mt-3 truncate text-xl text-foreground" title={card.value}>
                {card.value}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại hoặc email..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary">
          <Filter size={16} className="shrink-0 text-muted-foreground" />
          <select
            value={tier}
            onChange={event => setTier(event.target.value as LoyaltyTier | "all")}
            className="bg-transparent py-2.5 text-sm text-foreground outline-none"
          >
            <option value="all">Tất cả hạng</option>
            <option value="member">Thành viên</option>
            <option value="silver">Bạc</option>
            <option value="gold">Vàng</option>
            <option value="diamond">Kim cương</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3.5 text-left">
                  <SortButton field="name" label="Khách hàng" activeField={sortBy} order={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-foreground/70">Hạng</th>
                <th className="px-4 py-3.5 text-right">
                  <SortButton field="currentPoint" label="Điểm hiện có" activeField={sortBy} order={sortOrder} onSort={handleSort} align="right" />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortButton field="totalPoint" label="Tổng điểm" activeField={sortBy} order={sortOrder} onSort={handleSort} align="right" />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortButton field="completedOrderCount" label="Đơn đã mua" activeField={sortBy} order={sortOrder} onSort={handleSort} align="right" />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortButton field="totalItemsPurchased" label="Sản phẩm đã mua" activeField={sortBy} order={sortOrder} onSort={handleSort} align="right" />
                </th>
                <th className="px-5 py-3.5 text-right">
                  <SortButton field="totalSpent" label="Tổng mua" activeField={sortBy} order={sortOrder} onSort={handleSort} align="right" />
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: Math.min(limit, 6) }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b border-border last:border-b-0">
                    {Array.from({ length: 7 }).map((__, columnIndex) => (
                      <td key={columnIndex} className="px-5 py-3.5">
                        <div className={`h-4 rounded bg-muted ${columnIndex === 0 ? "w-40" : "ml-auto w-16"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                    <ShoppingBag size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-foreground">Không tìm thấy khách hàng</p>
                    <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc bộ lọc hạng.</p>
                  </td>
                </tr>
              ) : (
                customers.map(customer => {
                  const config = tierConfig[customer.tier];
                  const TierIcon = config.icon;
                  return (
                    <tr key={customer._id} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/20">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {customer.name.trim().charAt(0).toUpperCase() || "K"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{customer.name}</p>
                            <p className="mt-0.5 max-w-[240px] truncate text-xs text-muted-foreground">
                              {[customer.phone, customer.email].filter(Boolean).join(" • ") || "Chưa có thông tin liên hệ"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badge}`}>
                          <TierIcon size={13} /> {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-primary">
                        {numberFormatter.format(customer.currentPoint)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-foreground/80">
                        {numberFormatter.format(customer.totalPoint)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-foreground/80">
                        {numberFormatter.format(customer.completedOrderCount)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-foreground/80">
                        {numberFormatter.format(customer.totalItemsPurchased)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-foreground">
                        {formatVND(customer.totalSpent)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={newLimit => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
