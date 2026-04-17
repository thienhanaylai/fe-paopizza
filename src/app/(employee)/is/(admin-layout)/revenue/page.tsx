"use client";
import { useState } from "react";
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

type Period = "day" | "month" | "quarter" | "year";

interface StoreRevenue {
  id: string;
  name: string;
  day: { totalRevenue: number; totalOrders: number; customers: number; change: string };
  month: { totalRevenue: number; totalOrders: number; customers: number; change: string };
  quarter: { totalRevenue: number; totalOrders: number; customers: number; change: string };
  year: { totalRevenue: number; totalOrders: number; customers: number; change: string };
  hourly: { hour: string; revenue: number; orders: number }[];
  daily: { name: string; revenue: number }[];
  quarterly: { name: string; revenue: number }[];
  yearly: { name: string; revenue: number }[];
  categories: { name: string; value: number; color: string }[];
  payments: { name: string; value: number; color: string }[];
  topProducts: { name: string; qty: number; revenue: number }[];
}

const storeData: StoreRevenue[] = [
  {
    id: "store-1",
    name: "Chi nhánh Quận 1",
    day: { totalRevenue: 24450000, totalOrders: 134, customers: 98, change: "+18.5%" },
    month: { totalRevenue: 175000000, totalOrders: 2340, customers: 1580, change: "+12.5%" },
    quarter: { totalRevenue: 520000000, totalOrders: 7200, customers: 4800, change: "+10.2%" },
    year: { totalRevenue: 2100000000, totalOrders: 28800, customers: 19200, change: "+22.1%" },
    hourly: [
      { hour: "10h", revenue: 450000, orders: 3 },
      { hour: "11h", revenue: 1200000, orders: 8 },
      { hour: "12h", revenue: 2800000, orders: 18 },
      { hour: "13h", revenue: 1900000, orders: 12 },
      { hour: "14h", revenue: 800000, orders: 5 },
      { hour: "15h", revenue: 650000, orders: 4 },
      { hour: "16h", revenue: 950000, orders: 6 },
      { hour: "17h", revenue: 1500000, orders: 10 },
      { hour: "18h", revenue: 3200000, orders: 20 },
      { hour: "19h", revenue: 3800000, orders: 24 },
      { hour: "20h", revenue: 2500000, orders: 16 },
      { hour: "21h", revenue: 1200000, orders: 8 },
    ],
    daily: [
      { name: "01/03", revenue: 18500000 },
      { name: "05/03", revenue: 25600000 },
      { name: "10/03", revenue: 23400000 },
      { name: "15/03", revenue: 28700000 },
      { name: "17/03", revenue: 24450000 },
      { name: "20/03", revenue: 26800000 },
      { name: "25/03", revenue: 31200000 },
      { name: "30/03", revenue: 29500000 },
    ],
    quarterly: [
      { name: "Tháng 1", revenue: 180000000 },
      { name: "Tháng 2", revenue: 195000000 },
      { name: "Tháng 3", revenue: 145000000 },
    ],
    yearly: [
      { name: "Q1/25", revenue: 480000000 },
      { name: "Q2/25", revenue: 550000000 },
      { name: "Q3/25", revenue: 520000000 },
      { name: "Q4/25", revenue: 550000000 },
      { name: "Q1/26", revenue: 520000000 },
    ],
    categories: [
      { name: "Pizza", value: 15200000, color: "#e85d04" },
      { name: "Pasta", value: 4800000, color: "#f97316" },
      { name: "Tráng miệng", value: 2800000, color: "#fb923c" },
      { name: "Đồ uống", value: 1950000, color: "#fdba74" },
    ],
    payments: [
      { name: "Tiền mặt", value: 40, color: "#e85d04" },
      { name: "Chuyển khoản", value: 30, color: "#3b82f6" },
      { name: "Thẻ tín dụng", value: 15, color: "#8b5cf6" },
      { name: "Ví MoMo", value: 15, color: "#ec4899" },
    ],
    topProducts: [
      { name: "Pizza Pepperoni", qty: 32, revenue: 5440000 },
      { name: "Pizza Hải Sản", qty: 28, revenue: 5460000 },
      { name: "Pizza BBQ Chicken", qty: 22, revenue: 4070000 },
      { name: "Combo Family", qty: 15, revenue: 4500000 },
      { name: "Pasta Carbonara", qty: 20, revenue: 2900000 },
      { name: "Tiramisu", qty: 25, revenue: 1875000 },
    ],
  },
  {
    id: "store-2",
    name: "Chi nhánh Quận 7",
    day: { totalRevenue: 18200000, totalOrders: 98, customers: 72, change: "+8.3%" },
    month: { totalRevenue: 130000000, totalOrders: 1780, customers: 1200, change: "+8.3%" },
    quarter: { totalRevenue: 380000000, totalOrders: 5300, customers: 3500, change: "+7.1%" },
    year: { totalRevenue: 1550000000, totalOrders: 21200, customers: 14000, change: "+15.8%" },
    hourly: [
      { hour: "10h", revenue: 320000, orders: 2 },
      { hour: "11h", revenue: 900000, orders: 6 },
      { hour: "12h", revenue: 2100000, orders: 14 },
      { hour: "13h", revenue: 1400000, orders: 9 },
      { hour: "14h", revenue: 600000, orders: 4 },
      { hour: "15h", revenue: 500000, orders: 3 },
      { hour: "16h", revenue: 750000, orders: 5 },
      { hour: "17h", revenue: 1200000, orders: 8 },
      { hour: "18h", revenue: 2600000, orders: 16 },
      { hour: "19h", revenue: 3100000, orders: 18 },
      { hour: "20h", revenue: 2000000, orders: 12 },
      { hour: "21h", revenue: 900000, orders: 5 },
    ],
    daily: [
      { name: "01/03", revenue: 14200000 },
      { name: "05/03", revenue: 18900000 },
      { name: "10/03", revenue: 17800000 },
      { name: "15/03", revenue: 21200000 },
      { name: "17/03", revenue: 18200000 },
      { name: "20/03", revenue: 20500000 },
      { name: "25/03", revenue: 23800000 },
      { name: "30/03", revenue: 22100000 },
    ],
    quarterly: [
      { name: "Tháng 1", revenue: 135000000 },
      { name: "Tháng 2", revenue: 142000000 },
      { name: "Tháng 3", revenue: 103000000 },
    ],
    yearly: [
      { name: "Q1/25", revenue: 350000000 },
      { name: "Q2/25", revenue: 400000000 },
      { name: "Q3/25", revenue: 380000000 },
      { name: "Q4/25", revenue: 420000000 },
      { name: "Q1/26", revenue: 380000000 },
    ],
    categories: [
      { name: "Pizza", value: 11500000, color: "#e85d04" },
      { name: "Pasta", value: 3200000, color: "#f97316" },
      { name: "Tráng miệng", value: 1800000, color: "#fb923c" },
      { name: "Đồ uống", value: 1700000, color: "#fdba74" },
    ],
    payments: [
      { name: "Tiền mặt", value: 35, color: "#e85d04" },
      { name: "Chuyển khoản", value: 35, color: "#3b82f6" },
      { name: "Thẻ tín dụng", value: 18, color: "#8b5cf6" },
      { name: "Ví MoMo", value: 12, color: "#ec4899" },
    ],
    topProducts: [
      { name: "Pizza Hải Sản", qty: 25, revenue: 4875000 },
      { name: "Pizza Pepperoni", qty: 22, revenue: 3740000 },
      { name: "Combo Family", qty: 18, revenue: 5400000 },
      { name: "Pizza Hawaiian", qty: 16, revenue: 2720000 },
      { name: "Pasta Bolognese", qty: 14, revenue: 1960000 },
      { name: "Cheesecake", qty: 20, revenue: 1400000 },
    ],
  },
  {
    id: "store-3",
    name: "Chi nhánh Thủ Đức",
    day: { totalRevenue: 15800000, totalOrders: 82, customers: 60, change: "-2.1%" },
    month: { totalRevenue: 110000000, totalOrders: 1520, customers: 1020, change: "-2.1%" },
    quarter: { totalRevenue: 330000000, totalOrders: 4500, customers: 3000, change: "+3.5%" },
    year: { totalRevenue: 1320000000, totalOrders: 18000, customers: 12000, change: "+10.2%" },
    hourly: [
      { hour: "10h", revenue: 280000, orders: 2 },
      { hour: "11h", revenue: 750000, orders: 5 },
      { hour: "12h", revenue: 1800000, orders: 12 },
      { hour: "13h", revenue: 1200000, orders: 8 },
      { hour: "14h", revenue: 500000, orders: 3 },
      { hour: "15h", revenue: 400000, orders: 3 },
      { hour: "16h", revenue: 650000, orders: 4 },
      { hour: "17h", revenue: 1100000, orders: 7 },
      { hour: "18h", revenue: 2300000, orders: 14 },
      { hour: "19h", revenue: 2800000, orders: 16 },
      { hour: "20h", revenue: 1800000, orders: 10 },
      { hour: "21h", revenue: 800000, orders: 4 },
    ],
    daily: [
      { name: "01/03", revenue: 12100000 },
      { name: "05/03", revenue: 15800000 },
      { name: "10/03", revenue: 14500000 },
      { name: "15/03", revenue: 18300000 },
      { name: "17/03", revenue: 15800000 },
      { name: "20/03", revenue: 17200000 },
      { name: "25/03", revenue: 19500000 },
      { name: "30/03", revenue: 18100000 },
    ],
    quarterly: [
      { name: "Tháng 1", revenue: 115000000 },
      { name: "Tháng 2", revenue: 118000000 },
      { name: "Tháng 3", revenue: 97000000 },
    ],
    yearly: [
      { name: "Q1/25", revenue: 300000000 },
      { name: "Q2/25", revenue: 340000000 },
      { name: "Q3/25", revenue: 320000000 },
      { name: "Q4/25", revenue: 360000000 },
      { name: "Q1/26", revenue: 330000000 },
    ],
    categories: [
      { name: "Pizza", value: 9800000, color: "#e85d04" },
      { name: "Pasta", value: 2800000, color: "#f97316" },
      { name: "Tráng miệng", value: 1600000, color: "#fb923c" },
      { name: "Đồ uống", value: 1600000, color: "#fdba74" },
    ],
    payments: [
      { name: "Tiền mặt", value: 45, color: "#e85d04" },
      { name: "Chuyển khoản", value: 28, color: "#3b82f6" },
      { name: "Thẻ tín dụng", value: 12, color: "#8b5cf6" },
      { name: "Ví MoMo", value: 15, color: "#ec4899" },
    ],
    topProducts: [
      { name: "Pizza Pepperoni", qty: 20, revenue: 3400000 },
      { name: "Pizza Margherita", qty: 18, revenue: 2700000 },
      { name: "Pizza BBQ Chicken", qty: 15, revenue: 2775000 },
      { name: "Combo Couple", qty: 12, revenue: 2880000 },
      { name: "Pasta Carbonara", qty: 10, revenue: 1450000 },
      { name: "Tiramisu", qty: 15, revenue: 1125000 },
    ],
  },
];

// Data for store comparison (admin "all" view)
const storeComparisonColors = ["#e85d04", "#3b82f6", "#10b981"];

const storeComparisonMonthly = [
  { name: "01/03", "Chi nhánh Quận 1": 18500000, "Chi nhánh Quận 7": 14200000, "Chi nhánh Thủ Đức": 12100000 },
  { name: "05/03", "Chi nhánh Quận 1": 25600000, "Chi nhánh Quận 7": 18900000, "Chi nhánh Thủ Đức": 15800000 },
  { name: "10/03", "Chi nhánh Quận 1": 23400000, "Chi nhánh Quận 7": 17800000, "Chi nhánh Thủ Đức": 14500000 },
  { name: "15/03", "Chi nhánh Quận 1": 28700000, "Chi nhánh Quận 7": 21200000, "Chi nhánh Thủ Đức": 18300000 },
  { name: "17/03", "Chi nhánh Quận 1": 24450000, "Chi nhánh Quận 7": 18200000, "Chi nhánh Thủ Đức": 15800000 },
  { name: "20/03", "Chi nhánh Quận 1": 26800000, "Chi nhánh Quận 7": 20500000, "Chi nhánh Thủ Đức": 17200000 },
  { name: "25/03", "Chi nhánh Quận 1": 31200000, "Chi nhánh Quận 7": 23800000, "Chi nhánh Thủ Đức": 19500000 },
  { name: "30/03", "Chi nhánh Quận 1": 29500000, "Chi nhánh Quận 7": 22100000, "Chi nhánh Thủ Đức": 18100000 },
];

const storeRevenueBar = [
  { name: "Quận 1", revenue: 175000000, orders: 2340, color: "#e85d04" },
  { name: "Quận 7", revenue: 130000000, orders: 1780, color: "#3b82f6" },
  { name: "Thủ Đức", revenue: 110000000, orders: 1520, color: "#10b981" },
];

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatShort(n: number) {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  return new Intl.NumberFormat("vi-VN").format(n);
}

const periodLabels: Record<Period, string> = { day: "Ngày", month: "Tháng", quarter: "Quý", year: "Năm" };
const periodDisplay: Record<Period, string> = {
  day: "Hôm nay - 17/03/2026",
  month: "Tháng 03/2026",
  quarter: "Q1/2026",
  year: "Năm 2025-2026",
};

export default function Revenue() {
  const { user } = useEmployeeAuth();
  const isAdmin = user?.role === "admin";
  const [period, setPeriod] = useState<Period>("day");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // For store_manager, lock to their store
  const effectiveStore = isAdmin ? selectedStore : user?.storeId || "store-1";
  const isAllStores = isAdmin && effectiveStore === "all";

  const currentStoreData = storeData.find(s => s.id === effectiveStore);
  const currentStoreName = isAllStores ? "Tất cả cửa hàng" : currentStoreData?.name || user?.storeName || "";

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

  const getChartData = () => {
    if (!currentStoreData) return { data: [], dataKey: "revenue", xKey: "hour", label: "" };
    switch (period) {
      case "day":
        return { data: currentStoreData.hourly, dataKey: "revenue", xKey: "hour", label: "Doanh thu theo giờ" };
      case "month":
        return { data: currentStoreData.daily, dataKey: "revenue", xKey: "name", label: "Doanh thu theo ngày" };
      case "quarter":
        return { data: currentStoreData.quarterly, dataKey: "revenue", xKey: "name", label: "Doanh thu theo tháng" };
      case "year":
        return { data: currentStoreData.yearly, dataKey: "revenue", xKey: "name", label: "Doanh thu theo quý" };
    }
  };

  const chart = getChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Doanh thu</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Thống kê doanh thu toàn hệ thống và từng cửa hàng" : `Thống kê doanh thu - ${user?.storeName || ""}`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {(["day", "month", "quarter", "year"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
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
            <Store size={16} className="text-primary" /> {user?.storeName}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2.5 rounded-xl border border-border">
          <Calendar size={16} /> {periodDisplay[period]}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng doanh thu",
            value: formatVND(stats.totalRevenue),
            change: stats.change,
            up: changeUp,
            icon: <DollarSign size={20} />,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Tổng đơn hàng",
            value: stats.totalOrders.toLocaleString(),
            change: "+12.3%",
            up: true,
            icon: <ShoppingCart size={20} />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Giá trị TB/đơn",
            value: formatVND(avgOrderValue),
            change: "+5.7%",
            up: true,
            icon: <TrendingUp size={20} />,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Khách hàng",
            value: stats.customers.toLocaleString(),
            change: changeUp ? "+8.2%" : "-2.1%",
            up: changeUp,
            icon: <Users size={20} />,
            color: "bg-purple-50 text-purple-600",
          },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${stat.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
              >
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {stat.change}
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
          <div className="bg-card rounded-2xl p-5 border border-border">
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
          </div>

          {/* Store ranking table */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
          </div>

          {/* Revenue share pie */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
          </div>
        </>
      ) : (
        <>
          {/* Single store view - area chart */}
          <div className="bg-card rounded-2xl p-5 border border-border">
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
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
          </div>
        </>
      )}
    </div>
  );
}
