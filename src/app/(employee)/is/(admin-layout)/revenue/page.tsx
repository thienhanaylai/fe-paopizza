"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, ShoppingCart, Calendar, Store, ChevronDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { getRevenueDashboard } from "@/src/services/revenue.service";
import { getAllStore, type StoreData1 } from "@/src/services/store.service";

type Period = "day" | "month" | "quarter" | "year";

type EmployeeInfo = {
  ref_id?: {
    store_id?: string;
  };
};

type RevenueMetrics = {
  total_revenue?: number;
  total_orders?: number;
  average_order_value?: number;
};

type RevenueRange = {
  start_date?: string;
  end_date?: string;
};

type RevenueData = {
  metrics?: RevenueMetrics;
  range?: RevenueRange;
  [key: string]: unknown;
};

type RevenueSeriesPoint = Record<string, unknown>;

type ChartPoint = {
  label: string;
  revenue: number;
};

type StoreRankingRow = {
  id: string;
  name: string;
  totalRevenue: number;
  totalOrders: number;
  customers: number;
  averageOrderValue: number;
  changeValue: number | null;
};

const periodLabels: Record<Period, string> = {
  day: "Ngày",
  month: "Tháng",
  quarter: "Quý",
  year: "Năm",
};

const chartMeta: Record<Period, { title: string; size: number; makeLabel: (index: number) => string }> = {
  day: {
    title: "Doanh thu theo giờ (10h - 22h)",
    size: 12,
    makeLabel: index => `${10 + index}h`,
  },
  month: {
    title: "Doanh thu theo tuần (4 tuần)",
    size: 4,
    makeLabel: index => `Tuần ${index + 1}`,
  },
  quarter: {
    title: "Doanh thu theo tuần trong quý (12 tuần)",
    size: 12,
    makeLabel: index => `Tuần ${index + 1}`,
  },
  year: {
    title: "Doanh thu theo tháng (12 tháng)",
    size: 12,
    makeLabel: index => `Th${index + 1}`,
  },
};

const periodSeriesKeys: Record<Period, string[]> = {
  day: ["hourly_revenue", "revenue_by_hour", "hourly", "by_hour", "hours", "timeline", "data"],
  month: ["weekly_revenue", "revenue_by_week", "weekly", "by_week", "weeks", "timeline", "data"],
  quarter: ["weekly_revenue", "revenue_by_week", "weekly", "by_week", "weeks", "timeline", "data"],
  year: ["monthly_revenue", "revenue_by_month", "monthly", "by_month", "months", "timeline", "data"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatShort(n: number) {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  return new Intl.NumberFormat("vi-VN").format(n);
}

function formatDateOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function getDateNow() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear().toString();
  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const formatDate = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const d = dateObj.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
}

function getCurrentYearRange() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const yearEnd = now.getFullYear().toString();
  const yearStart = (now.getFullYear() - 1).toString();

  return {
    start: `${yearStart}-${month}-${day}`,
    end: `${yearEnd}-${month}-${day}`,
  };
}

function getCurrentQuarterRange() {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const startMonthIndex = Math.floor(currentMonth / 3) * 3;

  const startDate = new Date(year, startMonthIndex, 1);
  const endDate = new Date(year, startMonthIndex + 3, 0);

  const formatDate = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const d = dateObj.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
}

function toFiniteNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPointRevenue(point: RevenueSeriesPoint) {
  const candidates = [point.revenue, point.total_revenue, point.amount, point.value, point.total, point.sales];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function getPointDate(point: RevenueSeriesPoint) {
  const dateKeys = ["date", "datetime", "timestamp", "start_date", "period_start", "created_at"];
  for (const key of dateKeys) {
    const parsed = parseDate(point[key]);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function getPointText(point: RevenueSeriesPoint) {
  const textCandidates = [point.label, point.name, point.time, point.period, point.hour, point.week, point.month];
  for (const candidate of textCandidates) {
    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate).toLowerCase();
    }
  }
  return "";
}

function readSeries(source: unknown, key: string) {
  if (!isRecord(source)) return null;
  const value = source[key];
  if (!Array.isArray(value)) return null;

  const points = value.filter(item => isRecord(item)) as RevenueSeriesPoint[];
  return points.length > 0 ? points : null;
}

function getRevenueSeriesByPeriod(revenue: RevenueData, period: Period) {
  const keys = periodSeriesKeys[period];
  const sources: unknown[] = [revenue];

  for (const containerKey of ["chart", "charts", "timeline", "series", "breakdown", "data"]) {
    const container = revenue[containerKey];
    if (container) {
      sources.push(container);
    }
  }

  for (const source of sources) {
    for (const key of keys) {
      const series = readSeries(source, key);
      if (series) {
        return series;
      }
    }
  }

  for (const source of sources) {
    if (!isRecord(source)) continue;

    for (const value of Object.values(source)) {
      if (!Array.isArray(value)) continue;
      const points = value.filter(item => isRecord(item)) as RevenueSeriesPoint[];
      if (points.length > 0) {
        return points;
      }
    }
  }

  return [] as RevenueSeriesPoint[];
}

function extractFirstNumber(text: string) {
  const match = text.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getBucketIndex(point: RevenueSeriesPoint, period: Period, rangeStart: Date) {
  const labelText = getPointText(point);
  const dateValue = getPointDate(point);

  if (period === "day") {
    let hour = toFiniteNumber(point.hour || point.hour_of_day);
    if (!hour) {
      const fromText = extractFirstNumber(labelText);
      hour = fromText ?? 0;
    }
    if (!hour && dateValue) {
      hour = dateValue.getHours();
    }

    if (hour === 22) return 11;
    if (hour >= 10 && hour <= 21) {
      return hour - 10;
    }
    return -1;
  }

  if (period === "month") {
    let week = toFiniteNumber(point.week || point.week_of_month);
    if (!week) {
      const fromText = extractFirstNumber(labelText);
      week = fromText ?? 0;
    }
    if (!week && dateValue) {
      week = Math.ceil(dateValue.getDate() / 7);
    }

    if (week >= 1 && week <= 4) {
      return week - 1;
    }
    return -1;
  }

  if (period === "quarter") {
    let week = toFiniteNumber(point.week || point.week_of_quarter);
    if (!week) {
      const fromText = extractFirstNumber(labelText);
      week = fromText ?? 0;
    }

    if (!week && dateValue) {
      const diffMs = dateValue.getTime() - rangeStart.getTime();
      week = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;
    }

    if (week >= 1 && week <= 12) {
      return week - 1;
    }
    return -1;
  }

  let month = toFiniteNumber(point.month || point.month_of_year);
  if (!month) {
    const fromText = extractFirstNumber(labelText);
    month = fromText ?? 0;
  }

  if (!month && dateValue) {
    month = dateValue.getMonth() + 1;
  }

  if (month >= 0 && month <= 11) {
    month += 1;
  }

  if (month >= 1 && month <= 12) {
    return month - 1;
  }

  return -1;
}

function getDefaultRangeStart(period: Period) {
  const now = new Date();

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === "quarter") {
    const startMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), startMonth, 1);
  }

  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0);
}

function getRangeByPeriod(targetPeriod: Period) {
  if (targetPeriod === "day") {
    return { startDate: getDateNow(), endDate: "" };
  }

  if (targetPeriod === "month") {
    const monthRange = getCurrentMonthRange();
    return { startDate: monthRange.start, endDate: monthRange.end };
  }

  if (targetPeriod === "quarter") {
    const quarterRange = getCurrentQuarterRange();
    return { startDate: quarterRange.start, endDate: quarterRange.end };
  }

  const yearRange = getCurrentYearRange();
  return { startDate: yearRange.start, endDate: yearRange.end };
}

function getMetricNumber(metrics: unknown, keys: string[]) {
  if (!isRecord(metrics)) return 0;

  for (const key of keys) {
    const value = metrics[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function getOptionalMetricNumber(metrics: unknown, keys: string[]) {
  if (!isRecord(metrics)) return null;

  for (const key of keys) {
    const value = metrics[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export default function Revenue() {
  const { user, getInfo } = useEmployeeAuth();

  const [period, setPeriod] = useState<Period>("day");
  const [revenue, setRevenue] = useState<RevenueData>({});
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [dateRanger, setDateRanger] = useState(getDateNow());
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [stores, setStores] = useState<StoreData1[]>([]);
  const [storeRanking, setStoreRanking] = useState<StoreRankingRow[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const loadRevenueByPeriod = useCallback(
    async (targetPeriod: Period, options: { storeValue: string; employeeInfo?: EmployeeInfo | null }) => {
      const employeeInfo = options.employeeInfo ?? null;
      const storeId = isAdmin ? (options.storeValue === "all" ? "" : options.storeValue) : employeeInfo?.ref_id?.store_id || "";
      const { startDate, endDate } = getRangeByPeriod(targetPeriod);

      const response = (await getRevenueDashboard(startDate, endDate, storeId, "", "", "")) as RevenueData;
      setRevenue(response ?? {});

      if (targetPeriod === "day") {
        setDateRanger(startDate);
        return;
      }

      const startLabel = response?.range?.start_date ? formatDateOnly(response.range.start_date) : formatDateOnly(startDate);
      const endLabel = response?.range?.end_date ? formatDateOnly(response.range.end_date) : formatDateOnly(endDate);
      setDateRanger(`${startLabel} - ${endLabel}`);
    },
    [isAdmin],
  );

  useEffect(() => {
    if (!isAdmin || stores.length === 0) {
      setStoreRanking([]);
      return;
    }

    let cancelled = false;

    const fetchStoreRanking = async () => {
      try {
        setRankingLoading(true);
        const { startDate, endDate } = getRangeByPeriod(period);

        const rows = await Promise.all(
          stores.map(async store => {
            try {
              const response = (await getRevenueDashboard(startDate, endDate, store._id, "", "", "")) as RevenueData;
              const totalRevenue = getMetricNumber(response.metrics, ["total_revenue", "totalRevenue", "revenue"]);
              const totalOrders = getMetricNumber(response.metrics, ["total_orders", "totalOrders", "orders"]);
              const customers = getMetricNumber(response.metrics, ["customers", "total_customers", "totalCustomers"]);
              const averageOrderValueFromApi = getMetricNumber(response.metrics, ["average_order_value", "averageOrderValue"]);
              const averageOrderValue =
                averageOrderValueFromApi > 0
                  ? averageOrderValueFromApi
                  : totalOrders > 0
                    ? Math.round(totalRevenue / totalOrders)
                    : 0;
              const changeValue = getOptionalMetricNumber(response.metrics, [
                "growth_rate",
                "revenue_growth",
                "change_percent",
                "change",
              ]);

              return {
                id: store._id,
                name: store.name,
                totalRevenue,
                totalOrders,
                customers,
                averageOrderValue,
                changeValue,
              } as StoreRankingRow;
            } catch (error) {
              console.error("Loi lay du lieu xep hang cua hang:", error);
              return {
                id: store._id,
                name: store.name,
                totalRevenue: 0,
                totalOrders: 0,
                customers: 0,
                averageOrderValue: 0,
                changeValue: null,
              } as StoreRankingRow;
            }
          }),
        );

        if (cancelled) return;
        setStoreRanking(rows.sort((a, b) => b.totalRevenue - a.totalRevenue));
      } finally {
        if (!cancelled) {
          setRankingLoading(false);
        }
      }
    };

    fetchStoreRanking();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, period, stores]);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const employeeInfo = (await getInfo()) as unknown as EmployeeInfo | null;
        if (cancelled) return;

        setEmployee(employeeInfo);

        const storeList = (await getAllStore()) as StoreData1[];
        if (cancelled) return;

        setStores(storeList || []);

        const initialStore = isAdmin ? "all" : employeeInfo?.ref_id?.store_id || "all";
        if (!isAdmin) {
          setSelectedStore(initialStore);
        }

        await loadRevenueByPeriod("day", { storeValue: initialStore, employeeInfo });
      } catch (error) {
        console.error("Loi khoi tao du lieu doanh thu:", error);
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, [getInfo, isAdmin, loadRevenueByPeriod]);

  const handleDate = async (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    await loadRevenueByPeriod(nextPeriod, {
      storeValue: isAdmin ? selectedStore : employee?.ref_id?.store_id || "all",
      employeeInfo: employee,
    });
  };

  const adminSelectedStore = stores.find(item => item._id === selectedStore);
  const employeeStore = stores.find(item => item._id === employee?.ref_id?.store_id);

  const currentStoreName = isAdmin
    ? selectedStore === "all"
      ? "Tất cả cửa hàng"
      : adminSelectedStore?.name || "Cửa hàng"
    : employeeStore?.name || "Cửa hàng";

  const totalRevenue = revenue.metrics?.total_revenue ?? 0;
  const totalOrders = revenue.metrics?.total_orders ?? 0;
  const averageOrderValue =
    revenue.metrics?.average_order_value ?? (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0);

  const chartData = useMemo(() => {
    const meta = chartMeta[period];
    const buckets: ChartPoint[] = Array.from({ length: meta.size }, (_, index) => ({
      label: meta.makeLabel(index),
      revenue: 0,
    }));

    const series = getRevenueSeriesByPeriod(revenue, period);
    const rangeStart = parseDate(revenue.range?.start_date) ?? getDefaultRangeStart(period);

    for (const point of series) {
      const index = getBucketIndex(point, period, rangeStart);
      if (index < 0 || index >= buckets.length) continue;
      buckets[index].revenue += getPointRevenue(point);
    }

    if (series.length === 0 && totalRevenue > 0) {
      buckets[buckets.length - 1].revenue = totalRevenue;
    }

    return buckets;
  }, [period, revenue, totalRevenue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Doanh thu</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Thống kê doanh thu toàn hệ thống và từng cửa hàng" : `Thống kê doanh thu - ${currentStoreName}`}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {(["day", "month", "quarter", "year"] as Period[]).map(itemPeriod => (
            <button
              key={itemPeriod}
              onClick={() => {
                handleDate(itemPeriod);
              }}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                period === itemPeriod ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {periodLabels[itemPeriod]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm hover:border-primary transition-colors min-w-55"
            >
              <Store size={16} className="text-primary" />
              <span className="flex-1 text-left text-foreground">{currentStoreName}</span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform ${showStoreDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showStoreDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowStoreDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-xl shadow-lg z-40 overflow-hidden">
                  <button
                    onClick={async () => {
                      setSelectedStore("all");
                      setShowStoreDropdown(false);
                      await loadRevenueByPeriod(period, { storeValue: "all", employeeInfo: employee });
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                      selectedStore === "all" ? "bg-primary/5 text-primary" : "text-foreground"
                    }`}
                  >
                    <Store size={14} /> Tất cả cửa hàng
                  </button>

                  {stores.map(item => (
                    <button
                      key={item._id}
                      onClick={async () => {
                        setSelectedStore(item._id);
                        setShowStoreDropdown(false);
                        await loadRevenueByPeriod(period, { storeValue: item._id, employeeInfo: employee });
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                        selectedStore === item._id ? "bg-primary/5 text-primary" : "text-foreground"
                      }`}
                    >
                      <Store size={14} /> {item.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2.5 rounded-xl border border-border">
            <Store size={16} className="text-primary" /> {currentStoreName}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2.5 rounded-xl border border-border">
          <Calendar size={16} /> {dateRanger}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            label: "Tổng doanh thu",
            value: formatVND(totalRevenue),
            icon: <DollarSign size={20} />,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Tổng đơn hàng",
            value: totalOrders.toLocaleString("vi-VN"),
            icon: <ShoppingCart size={20} />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Giá trị TB/đơn",
            value: formatVND(averageOrderValue),
            icon: <TrendingUp size={20} />,
            color: "bg-green-50 text-green-600",
          },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-foreground text-xl mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-foreground mb-4">
          {chartMeta[period].title} - {currentStoreName}
        </h3>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e85d04" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#e85d04" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
            <Tooltip formatter={value => [formatVND(toFiniteNumber(value)), "Doanh thu"]} labelFormatter={label => `${label}`} />
            <Area type="monotone" dataKey="revenue" stroke="#e85d04" strokeWidth={2.5} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {isAdmin && selectedStore === "all" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-foreground">Bảng xếp hạng cửa hàng - {dateRanger}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Cửa hàng</th>
                  <th className="px-5 py-3">Doanh thu</th>
                  <th className="px-5 py-3">Đơn hàng</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">TB/đơn</th>
                  <th className="px-5 py-3">Tăng trưởng</th>
                </tr>
              </thead>

              <tbody>
                {rankingLoading && (
                  <tr className="border-t border-border/50">
                    <td className="px-5 py-5 text-muted-foreground" colSpan={7}>
                      Đang tải bảng xếp hạng...
                    </td>
                  </tr>
                )}

                {!rankingLoading && storeRanking.length === 0 && (
                  <tr className="border-t border-border/50">
                    <td className="px-5 py-5 text-muted-foreground" colSpan={7}>
                      Chưa có dữ liệu xếp hạng.
                    </td>
                  </tr>
                )}

                {!rankingLoading &&
                  storeRanking.map((item, index) => {
                    const up = (item.changeValue ?? 0) >= 0;
                    const changeLabel =
                      item.changeValue === null ? "0%" : `${item.changeValue > 0 ? "+" : ""}${item.changeValue.toFixed(1)}%`;

                    return (
                      <tr key={item.id} className="border-t border-border/50 hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-[11px] ${index === 0 ? "bg-primary text-white" : index === 1 ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}
                          >
                            {index + 1}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Store size={14} className="text-primary" />
                            <span className="text-foreground">{item.name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3 text-foreground">{formatVND(item.totalRevenue)}</td>
                        <td className="px-5 py-3 text-muted-foreground">{item.totalOrders.toLocaleString("vi-VN")}</td>
                        <td className="px-5 py-3 text-muted-foreground">{item.customers.toLocaleString("vi-VN")}</td>
                        <td className="px-5 py-3 text-foreground">{formatVND(item.averageOrderValue)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                          >
                            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {changeLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
