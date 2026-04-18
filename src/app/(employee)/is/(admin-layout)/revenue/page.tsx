"use client";
import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Store,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { getRevenueDashboard } from "@/src/services/revenue.service";
import { getAllStore } from "@/src/services/store.service";

type Period = "day" | "month" | "quarter" | "year";

// Data for store comparison (admin "all" view)

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatShort(n: number) {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  return new Intl.NumberFormat("vi-VN").format(n);
}
const formatDateTime = (isoString: string) => {
  if (!isoString) return "";

  const date = new Date(isoString);
  const pad = (num: number) => String(num).padStart(2, "0");

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}-${month}-${year}`;
};
const getDateNow = () => {
  const now = new Date();
  const date = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear().toString();
  return `${year}-${month}-${date}`;
};

const getCurrenYearRange = () => {
  const now = new Date();
  const date = now.getDate().toString().padStart(2, "0");
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const yearEnd = now.getFullYear().toString();
  const yearStart = (now.getFullYear() - 1).toString();

  return {
    start: `${yearStart}-${month}-${date}`,
    end: `${yearEnd}-${month}-${date}`,
  };
};

const getCurrentQuarterRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const startMonthIndex = Math.floor(currentMonth / 3) * 3;

  const startDate = new Date(year, startMonthIndex, 1);
  const endDate = new Date(year, startMonthIndex + 3, 0);
  const formatDate = dateObj => {
    const y = dateObj.getFullYear();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const d = dateObj.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
};

const periodLabels: Record<Period, string> = { day: "Ngày", month: "Tháng", quarter: "Quý", year: "Năm" };
const periodDisplay: Record<Period, string> = {
  day: "Hôm nay - 17/03/2026",
  month: "Tháng 03/2026",
  quarter: "Q1/2026",
  year: "Năm 2025-2026",
};

export default function Revenue() {
  const { user, getInfo } = useEmployeeAuth();
  const [period, setPeriod] = useState<Period>("day");
  const [storeData, setStoreData] = useState([]);
  const [revenue, setRevenue] = useState({});
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [dateRanger, setDateRanger] = useState(getDateNow());
  const [empoylee, setmployee] = useState({});
  const [stores, setStores] = useState([]);
  const isAdmin = user?.role === "admin";
  // const [storeComparisonColors, setStoreComparisonColors] = useState([]);
  // const [storeComparisonMonthly, setStoreComparisonMonthly] = useState([]);
  // const [storeRevenueBar, setStoreRevenueBar] = useState([]);
  useEffect(() => {
    const fecthData = async () => {
      const empInfo = await getInfo();
      const today = getDateNow();
      const stores = await getAllStore();
      setStores(stores);
      setmployee(empInfo);
      const res = await getRevenueDashboard(`${today}`, "", `${isAdmin ? "" : `${empInfo?.ref_id?.store_id}`}`, "", "", ""); //doanh thu trong ngày
      setRevenue(res);
    };
    fecthData();
  }, []);

  // For store_manager, lock to their store
  const effectiveStore = isAdmin ? selectedStore : empoylee?.ref_id?.store_id || "store-1";
  const isAllStores = isAdmin && effectiveStore === "all";

  const currentStoreData = storeData.find(s => s.id === effectiveStore);
  const curentStore = stores.find(item => item._id === empoylee?.ref_id?.store_id);

  const currentStoreName = isAllStores ? "Tất cả cửa hàng" : curentStore?.name || "";

  const handleDate = async (date: Period, type: string) => {
    setPeriod(date);
    if (date === "day") {
      const today = getDateNow();
      const res = await getRevenueDashboard(`${today}`, "", `${isAdmin ? "" : `${empoylee?.ref_id?.store_id}`}`, "", "", "");
      setDateRanger(today);
      setRevenue(res);
    } else if (date === "quarter") {
      const quarterRange = getCurrentQuarterRange();
      const res = await getRevenueDashboard(
        `${quarterRange.start}`,
        `${quarterRange.end}`,
        `${isAdmin ? "" : `${empoylee?.ref_id?.store_id}`}`,
        "",
        "",
        "",
      );
      setRevenue(res);
      setDateRanger(`${formatDateTime(res.range?.start_date)} - ${formatDateTime(res.range?.end_date)}`);
    } else if (date === "year") {
      const yearRange = getCurrenYearRange();
      const res = await getRevenueDashboard(
        `${yearRange.start}`,
        `${yearRange.end}`,
        `${isAdmin ? "" : `${empoylee?.ref_id?.store_id}`}`,
        "",
        "",
        "",
      );
      setRevenue(res);
      setDateRanger(`${formatDateTime(res.range?.start_date)} - ${formatDateTime(res.range?.end_date)}`);
    } else {
      const res = await getRevenueDashboard(``, "", `${isAdmin ? "" : `${empoylee?.ref_id?.store_id}`}`, "", "", "");
      setRevenue(res);
      setDateRanger(`${formatDateTime(res.range?.start_date)} - ${formatDateTime(res.range?.end_date)}`);
    }
  };
  // Aggregate stats for "all"
  const getStats = () => {
    if (isAllStores) {
      const totals = storeData.reduce(
        (acc, s) => {
          const p = s[period];
          acc.totalRevenue += p.totalRevenue;
          acc.totalOrders += p.totalOrders;
          acc.customers += p.customers;
          return acc;
        },
        { totalRevenue: 0, totalOrders: 0, customers: 0 },
      );
      return { ...totals, change: "+13.2%" };
    }
    return currentStoreData?.[period] || { totalRevenue: 0, totalOrders: 0, customers: 0, change: "0%" };
  };

  const stats = getStats();

  const avgOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
  const changeUp = stats.change.startsWith("+");

  // const getChartData = () => {
  //   if (!currentStoreData) return { data: [], dataKey: "revenue", xKey: "hour", label: "" };
  //   switch (period) {
  //     case "day":
  //       return { data: currentStoreData.hourly, dataKey: "revenue", xKey: "hour", label: "Doanh thu theo giờ" };
  //     case "month":
  //       return { data: currentStoreData.daily, dataKey: "revenue", xKey: "name", label: "Doanh thu theo ngày" };
  //     case "quarter":
  //       return { data: currentStoreData.quarterly, dataKey: "revenue", xKey: "name", label: "Doanh thu theo tháng" };
  //     case "year":
  //       return { data: currentStoreData.yearly, dataKey: "revenue", xKey: "name", label: "Doanh thu theo quý" };
  //   }
  // };

  // const chart = getChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Doanh thu</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Thống kê doanh thu toàn hệ thống và từng cửa hàng" : `Thống kê doanh thu - ${currentStoreName || ""}`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {(["day", "month", "quarter", "year"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => {
                handleDate(p);
              }}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${period === p ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Store selector (admin only) + period */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm hover:border-primary transition-colors min-w-[220px]"
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
                    onClick={() => {
                      setSelectedStore("all");
                      setShowStoreDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${selectedStore === "all" ? "bg-primary/5 text-primary" : "text-foreground"}`}
                  >
                    <Store size={14} /> Tất cả cửa hàng
                  </button>
                  {storeData.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStore(s.id);
                        setShowStoreDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${selectedStore === s.id ? "bg-primary/5 text-primary" : "text-foreground"}`}
                    >
                      <Store size={14} /> {s.name}
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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          {
            label: "Tổng doanh thu",
            value: formatVND(revenue.metrics?.total_revenue || 0),
            change: stats.change,
            up: changeUp,
            icon: <DollarSign size={20} />,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Tổng đơn hàng",
            value: revenue.metrics?.total_orders.toLocaleString(),
            change: "+12.3%",
            up: true,
            icon: <ShoppingCart size={20} />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Giá trị TB/đơn",
            value: formatVND(revenue.metrics?.average_order_value),
            change: "+5.7%",
            up: true,
            icon: <TrendingUp size={20} />,
            color: "bg-green-50 text-green-600",
          },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${stat.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
              >
                {/* {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {stat.change} */}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-foreground text-xl mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {isAllStores ? (
        <>
          {/* Store comparison chart */}
          {/* <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-foreground mb-4">So sánh doanh thu giữa các cửa hàng</h3>
            {period === "month" || period === "day" ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={storeComparisonMonthly}>
                  <defs>
                    {storeData.map((s, i) => (
                      <linearGradient key={s.id} id={`color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={storeComparisonColors[i]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={storeComparisonColors[i]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip formatter={(v: number) => [formatVND(v), ""]} />
                  <Legend />
                  {storeData.map((s, i) => (
                    <Area
                      key={s.id}
                      type="monotone"
                      dataKey={s.name}
                      stroke={storeComparisonColors[i]}
                      strokeWidth={2}
                      fill={`url(#color-${s.id})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={storeRevenueBar}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip formatter={(v: number) => [formatVND(v), "Doanh thu"]} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {storeRevenueBar.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div> */}

          {/* Store ranking table */}
          {/* <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-foreground">Bảng xếp hạng cửa hàng - {periodDisplay[period]}</h3>
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
                  {storeData
                    .map(s => ({ ...s, stats: s[period] }))
                    .sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)
                    .map((s, i) => {
                      const up = s.stats.change.startsWith("+");
                      return (
                        <tr key={s.id} className="border-t border-border/50 hover:bg-muted/30">
                          <td className="px-5 py-3">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-[11px] ${i === 0 ? "bg-primary text-white" : i === 1 ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Store size={14} className="text-primary" />
                              <span className="text-foreground">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-foreground">{formatVND(s.stats.totalRevenue)}</td>
                          <td className="px-5 py-3 text-muted-foreground">{s.stats.totalOrders.toLocaleString()}</td>
                          <td className="px-5 py-3 text-muted-foreground">{s.stats.customers.toLocaleString()}</td>
                          <td className="px-5 py-3 text-foreground">
                            {formatVND(Math.round(s.stats.totalRevenue / s.stats.totalOrders))}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                            >
                              {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {s.stats.change}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div> */}

          {/* Revenue share pie */}
          {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground mb-4">Tỷ trọng doanh thu theo cửa hàng</h3>
              <div className="flex justify-center">
                <PieChart width={240} height={240}>
                  <Pie
                    data={storeData.map((s, i) => ({
                      name: s.name,
                      value: s[period].totalRevenue,
                      color: storeComparisonColors[i],
                    }))}
                    cx={120}
                    cy={120}
                    innerRadius={60}
                    outerRadius={95}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {storeData.map((_, i) => (
                      <Cell key={i} fill={storeComparisonColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatVND(v), ""]} />
                </PieChart>
              </div>
              <div className="space-y-2 mt-2">
                {storeData.map((s, i) => {
                  const total = storeData.reduce((acc, st) => acc + st[period].totalRevenue, 0);
                  const pct = total > 0 ? ((s[period].totalRevenue / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={s.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: storeComparisonColors[i] }} />
                        <span className="text-sm text-muted-foreground">{s.name}</span>
                      </div>
                      <span className="text-sm text-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground mb-4">Tổng quan đơn hàng theo cửa hàng</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={storeData.map((s, i) => ({
                    name: s.name.replace("Chi nhánh ", ""),
                    orders: s[period].totalOrders,
                    color: storeComparisonColors[i],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Đơn hàng" radius={[8, 8, 0, 0]}>
                    {storeData.map((_, i) => (
                      <Cell key={i} fill={storeComparisonColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div> */}
        </>
      ) : (
        <>
          {/* Single store view - area chart */}
          {/* <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground">
                {chart.label} - {currentStoreName}
              </h3>
              <div className="flex items-center gap-1 text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full">
                <TrendingUp size={14} /> {stats.change}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chart.data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e85d04" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e85d04" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={chart.xKey} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                <Tooltip formatter={(v: number) => [formatVND(v), "Doanh thu"]} />
                <Area type="monotone" dataKey={chart.dataKey} stroke="#e85d04" strokeWidth={2.5} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div> */}

          {/* Bottom row */}
          {/* <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground mb-4">Doanh thu theo danh mục</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={currentStoreData?.categories || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatShort}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip formatter={(v: number) => [formatVND(v), "Doanh thu"]} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {(currentStoreData?.categories || []).map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground mb-4">Phương thức thanh toán</h3>
              <div className="flex justify-center">
                <PieChart width={200} height={200}>
                  <Pie
                    data={currentStoreData?.payments || []}
                    cx={100}
                    cy={100}
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {(currentStoreData?.payments || []).map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
                </PieChart>
              </div>
              <div className="space-y-2 mt-4">
                {(currentStoreData?.payments || []).map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground mb-4">Sản phẩm bán chạy</h3>
              <div className="space-y-3">
                {(currentStoreData?.topProducts || []).map((product, i) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center text-[11px] ${i < 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{product.name}</p>
                      <p className="text-[11px] text-muted-foreground">{product.qty} sản phẩm</p>
                    </div>
                    <span className="text-sm text-primary shrink-0">{formatVND(product.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div> */}
        </>
      )}
    </div>
  );
}
