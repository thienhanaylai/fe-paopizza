"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  Pizza,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  ShieldCheck,
  BarChart3,
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
} from "recharts";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { getAllStore, type StoreData1 } from "@/src/services/store.service";
import { getRevenueDashboard } from "@/src/services/revenue.service";
import { getAllOrder, type OrderHistory, type OrderStatus } from "@/src/services/order.service";
import { getAllEmployee } from "@/src/services/employee.service";

type EmployeeRole = "admin" | "manager" | "staff";

type EmployeeInfo = {
  ref_id?: {
    store_id?: string;
    store_name?: string;
  };
};

type RevenueOverview = {
  metrics?: {
    total_revenue?: number;
    total_orders?: number;
    average_order_value?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type AdminStoreRow = {
  id: string;
  name: string;
  manager: string;
  revenue: number;
  orders: number;
  status: StoreData1["status"];
};

type AdminDataState = {
  monthRevenue: number;
  monthOrders: number;
  totalStores: number;
  totalStaff: number;
  chart: { name: string; value: number }[];
  stores: AdminStoreRow[];
};

type ManagerDataState = {
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  weeklyRevenue: { name: string; value: number }[];
  orderTypePie: { name: string; value: number; color: string }[];
  ordersByHour: { hour: string; orders: number }[];
  recentOrders: OrderHistory[];
};

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={14} /> },
  confirmed: { label: "Đã xác nhận", color: "bg-teal-100 text-teal-700", icon: <CheckCircle2 size={14} /> },
  preparing: { label: "Đang làm", color: "bg-blue-100 text-blue-700", icon: <Clock size={14} /> },
  delivering: { label: "Đang giao", color: "bg-purple-100 text-purple-700", icon: <Clock size={14} /> },
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
};

const pieColors = {
  dine_in: "#e85d04",
  carry_out: "#f97316",
  delivery: "#fdba74",
};

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function dateToYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

  return {
    start: dateToYmd(start),
    end: dateToYmd(end),
    label: `T${start.getMonth() + 1}`,
  };
}

function isToday(isoDate: string) {
  const created = new Date(isoDate);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth() && created.getDate() === now.getDate()
  );
}

function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getHourBucketsFromOrders(orders: OrderHistory[]) {
  const map = new Map<number, number>();

  for (let hour = 10; hour <= 21; hour += 1) {
    map.set(hour, 0);
  }

  for (const order of orders) {
    if (!isToday(order.createdAt)) continue;
    const hour = new Date(order.createdAt).getHours();
    if (hour >= 10 && hour <= 21) {
      map.set(hour, (map.get(hour) || 0) + 1);
    }
  }

  return Array.from(map.entries()).map(([hour, count]) => ({
    hour: `${hour}h`,
    orders: count,
  }));
}

function getStoreName(store: StoreData1) {
  return store.name || "Cửa hàng";
}

function getRevenueMetricsValue(response: RevenueOverview, key: string) {
  return toNumber(response.metrics?.[key]);
}

function StaffDashboard({ userName }: { userName: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-foreground">Xin chào, {userName}!</h1>
      <p className="text-muted-foreground">
        Dashboard nhân viên sẽ được cập nhật sau. Hiện tại đã ưu tiên hoàn thiện phần admin và manager.
      </p>
    </div>
  );
}

function ManagerDashboard({
  userName,
  storeName,
  data,
  loading,
}: {
  userName: string;
  storeName: string;
  data: ManagerDataState;
  loading: boolean;
}) {
  const stats = [
    {
      label: "Doanh thu hôm nay",
      value: formatVND(data.todayRevenue),
      icon: <DollarSign size={20} />,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Đơn hàng hôm nay",
      value: data.todayOrders.toLocaleString("vi-VN"),
      icon: <ShoppingCart size={20} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Giá trị TB/đơn",
      value: formatVND(data.averageOrderValue),
      icon: <TrendingUp size={20} />,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Xin chào, {userName}!</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hoạt động cửa hàng hôm nay</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-xl border border-border">
          <Store size={16} className="text-primary" />
          <span>{storeName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-foreground text-xl mt-1">{loading ? "..." : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-foreground">Doanh thu 7 ngày gần nhất</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.weeklyRevenue}>
              <defs>
                <linearGradient id="colorManagerRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e85d04" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e85d04" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${(toNumber(v) / 1000000).toFixed(1)}M`}
              />
              <Tooltip formatter={v => [formatVND(toNumber(v)), "Doanh thu"]} />
              <Area type="monotone" dataKey="value" stroke="#e85d04" strokeWidth={2.5} fill="url(#colorManagerRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="text-foreground mb-4">Loại đơn hàng (tháng này)</h3>
          <div className="flex justify-center">
            <PieChart width={200} height={200}>
              <Pie data={data.orderTypePie} cx={100} cy={100} innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
                {data.orderTypePie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={v => [`${toNumber(v)} đơn`, ""]} />
            </PieChart>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {data.orderTypePie.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-foreground mb-4">Đơn hàng theo giờ (hôm nay)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.ordersByHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={v => [toNumber(v), "Đơn hàng"]} />
            <Bar dataKey="orders" fill="#e85d04" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground">Đơn hàng gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left border-b border-border">
                <th className="pb-3 pr-4">Mã đơn</th>
                <th className="pb-3 pr-4">Khách hàng</th>
                <th className="pb-3 pr-4">Tổng tiền</th>
                <th className="pb-3 pr-4">Trạng thái</th>
                <th className="pb-3 hidden md:table-cell">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map(order => {
                const st = statusConfig[order.status];
                return (
                  <tr key={order._id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-3 pr-4 text-primary">{order._id}</td>
                    <td className="py-3 pr-4 text-foreground">{order.contact_info?.full_name || "Khách hàng"}</td>
                    <td className="py-3 pr-4 text-foreground">{formatVND(order.total)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ userName, data, loading }: { userName: string; data: AdminDataState; loading: boolean }) {
  const stats = [
    {
      label: "Tổng doanh thu tháng",
      value: formatVND(data.monthRevenue),
      icon: <DollarSign size={20} />,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Tổng cửa hàng",
      value: data.totalStores.toLocaleString("vi-VN"),
      icon: <Store size={20} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Tổng nhân sự",
      value: data.totalStaff.toLocaleString("vi-VN"),
      icon: <Users size={20} />,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Tổng đơn tháng",
      value: data.monthOrders.toLocaleString("vi-VN"),
      icon: <ShoppingCart size={20} />,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  const trendUp = data.chart.length > 1 ? data.chart[data.chart.length - 1].value >= data.chart[0].value : true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Xin chào, {userName}!</h1>
          <p className="text-muted-foreground mt-1">Tổng quan toàn hệ thống PaoPizza</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-xl border border-border">
          <ShieldCheck size={16} className="text-primary" />
          <span>Quản trị viên hệ thống</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-foreground text-xl mt-1">{loading ? "..." : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" /> Tổng doanh thu hệ thống 6 tháng gần nhất
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Tất cả cửa hàng</p>
          </div>
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} Xu hướng
          </span>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.chart}>
            <defs>
              <linearGradient id="colorAdminRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e85d04" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#e85d04" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(toNumber(v) / 1000000).toFixed(1)}M`}
            />
            <Tooltip formatter={v => [formatVND(toNumber(v)), "Doanh thu"]} />
            <Area type="monotone" dataKey="value" stroke="#e85d04" strokeWidth={2.5} fill="url(#colorAdminRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-foreground flex items-center gap-2 mb-4">
          <Store size={18} className="text-primary" /> Tổng quan các cửa hàng (tháng này)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left border-b border-border">
                <th className="pb-3 pr-4">Cửa hàng</th>
                <th className="pb-3 pr-4">Quản lý</th>
                <th className="pb-3 pr-4">Doanh thu tháng</th>
                <th className="pb-3 pr-4">Đơn hàng</th>
                <th className="pb-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.stores.map(store => (
                <tr key={store.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="py-3 pr-4 text-foreground">{store.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{store.manager}</td>
                  <td className="py-3 pr-4 text-foreground">{formatVND(store.revenue)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{store.orders.toLocaleString("vi-VN")}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        store.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <CheckCircle2 size={12} /> {store.status === "active" ? "Hoạt động" : "Bảo trì"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, getInfo } = useEmployeeAuth();

  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [managerLoading, setManagerLoading] = useState(false);

  const [adminData, setAdminData] = useState<AdminDataState>({
    monthRevenue: 0,
    monthOrders: 0,
    totalStores: 0,
    totalStaff: 0,
    chart: [],
    stores: [],
  });

  const [managerData, setManagerData] = useState<ManagerDataState>({
    todayRevenue: 0,
    todayOrders: 0,
    averageOrderValue: 0,
    weeklyRevenue: [],
    orderTypePie: [
      { name: "Dine-in", value: 0, color: pieColors.dine_in },
      { name: "Carry out", value: 0, color: pieColors.carry_out },
      { name: "Delivery", value: 0, color: pieColors.delivery },
    ],
    ordersByHour: [],
    recentOrders: [],
  });

  const role = (user?.role || "staff") as EmployeeRole;

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const info = (await getInfo()) as EmployeeInfo | null;
        if (cancelled) return;
        setEmployeeInfo(info);

        if (role === "admin") {
          setAdminLoading(true);

          const [stores, employees] = (await Promise.all([getAllStore(), getAllEmployee()])) as [StoreData1[], unknown[]];
          const monthRange = getMonthRange(0);

          const systemMonthOverview = (await getRevenueDashboard(
            monthRange.start,
            monthRange.end,
            "",
            "",
            "",
            "",
          )) as RevenueOverview;

          const chartRanges = [
            getMonthRange(-5),
            getMonthRange(-4),
            getMonthRange(-3),
            getMonthRange(-2),
            getMonthRange(-1),
            getMonthRange(0),
          ];

          const chartValues = await Promise.all(
            chartRanges.map(async r => {
              const response = (await getRevenueDashboard(r.start, r.end, "", "", "", "")) as RevenueOverview;
              return {
                name: r.label,
                value: getRevenueMetricsValue(response, "total_revenue"),
              };
            }),
          );

          const storeRows = await Promise.all(
            stores.map(async st => {
              const response = (await getRevenueDashboard(
                monthRange.start,
                monthRange.end,
                st._id,
                "",
                "",
                "",
              )) as RevenueOverview;
              return {
                id: st._id,
                name: getStoreName(st),
                manager: st.manager_by?.name || "Chưa có",
                revenue: getRevenueMetricsValue(response, "total_revenue"),
                orders: getRevenueMetricsValue(response, "total_orders"),
                status: st.status,
              } as AdminStoreRow;
            }),
          );

          if (cancelled) return;

          setAdminData({
            monthRevenue: getRevenueMetricsValue(systemMonthOverview, "total_revenue"),
            monthOrders: getRevenueMetricsValue(systemMonthOverview, "total_orders"),
            totalStores: stores.length,
            totalStaff: Array.isArray(employees) ? employees.length : 0,
            chart: chartValues,
            stores: storeRows,
          });

          setAdminLoading(false);
          return;
        }

        if (role === "manager") {
          const managerStoreId = info?.ref_id?.store_id || "";
          if (!managerStoreId) return;

          setManagerLoading(true);

          const today = dateToYmd(new Date());
          const todayOverview = (await getRevenueDashboard(today, "", managerStoreId, "", "", "")) as RevenueOverview;

          const weekDates = Array.from({ length: 7 }, (_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - idx));
            return d;
          });

          const weeklyRevenue = await Promise.all(
            weekDates.map(async d => {
              const date = dateToYmd(d);
              const overview = (await getRevenueDashboard(date, "", managerStoreId, "", "", "")) as RevenueOverview;
              return {
                name: `T${d.getDate()}/${d.getMonth() + 1}`,
                value: getRevenueMetricsValue(overview, "total_revenue"),
              };
            }),
          );

          const allOrders = (await getAllOrder(`store_id=${managerStoreId}`, "")) as OrderHistory[];
          const safeOrders = Array.isArray(allOrders) ? allOrders : [];

          const monthStart = getStartOfMonth();
          const monthOrders = safeOrders.filter(o => new Date(o.createdAt).getTime() >= monthStart.getTime());
          const orderTypeCount = {
            dine_in: monthOrders.filter(o => o.order_type === "dine_in").length,
            carry_out: monthOrders.filter(o => o.order_type === "carry_out").length,
            delivery: monthOrders.filter(o => o.order_type === "delivery").length,
          };

          const todayOrders = safeOrders.filter(o => isToday(o.createdAt));
          const ordersByHour = getHourBucketsFromOrders(todayOrders);

          const recentOrders = [...safeOrders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6);

          if (cancelled) return;

          setManagerData({
            todayRevenue: getRevenueMetricsValue(todayOverview, "total_revenue"),
            todayOrders: getRevenueMetricsValue(todayOverview, "total_orders"),
            averageOrderValue:
              getRevenueMetricsValue(todayOverview, "average_order_value") ||
              Math.round(
                getRevenueMetricsValue(todayOverview, "total_revenue") /
                  Math.max(1, getRevenueMetricsValue(todayOverview, "total_orders")),
              ),
            weeklyRevenue,
            orderTypePie: [
              { name: "Dine-in", value: orderTypeCount.dine_in, color: pieColors.dine_in },
              { name: "Carry out", value: orderTypeCount.carry_out, color: pieColors.carry_out },
              { name: "Delivery", value: orderTypeCount.delivery, color: pieColors.delivery },
            ],
            ordersByHour,
            recentOrders,
          });

          setManagerLoading(false);
        }
      } catch (error) {
        console.error("Loi tai dashboard:", error);
        setAdminLoading(false);
        setManagerLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [getInfo, role]);

  const userName = user?.name || "User";
  const managerStoreName = employeeInfo?.ref_id?.store_name || "Cửa hàng";

  const content = useMemo(() => {
    if (role === "admin") {
      return <AdminDashboard userName={userName} data={adminData} loading={adminLoading} />;
    }

    if (role === "manager") {
      return <ManagerDashboard userName={userName} storeName={managerStoreName} data={managerData} loading={managerLoading} />;
    }

    return <StaffDashboard userName={userName} />;
  }, [role, userName, managerStoreName, adminData, adminLoading, managerData, managerLoading]);

  return <div>{content}</div>;
}
