"use client";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Gift,
  Award,
  Lock,
  Ticket,
  Coins,
  Clock,
  Utensils,
  Info,
  Copy,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  X,
  Pizza,
  User as UserIcon,
  LogOut,
  History,
  ShoppingBag,
  Facebook,
  Instagram,
  Mail,
} from "lucide-react";
import { mockCustomers, rankConfig, CustomerLoyalty } from "./customers";
import { rewardCatalog, rankWeight } from "./rewards";
import { useAuth } from "./auth-context";
import { addActivityLog } from "../utils/logger";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function LoyaltyRewards() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Loyalty states
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty | null>(null);
  const [rewardCategoryTab, setRewardCategoryTab] = useState<"all" | "coupon" | "item">("all");
  const [confirmRedeemItem, setConfirmRedeemItem] = useState<any>(null);
  const [successRedeemItem, setSuccessRedeemItem] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [redemptionsTrigger, setRedemptionsTrigger] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Sync customer loyalty from localStorage
  useEffect(() => {
    if (isAuthenticated && user && user.role === "customer") {
      const saved = localStorage.getItem("paopizza_customers");
      const list = saved ? JSON.parse(saved) : mockCustomers;
      let record = list.find((c: any) => c.name.toLowerCase() === user.name.toLowerCase() || c.phone === "0901234567");
      if (!record) {
        record = {
          id: `KH${String(list.length + 1).padStart(3, "0")}`,
          name: user.name,
          phone: "0901234567",
          rank: "Gold",
          points: 650,
          totalOrders: 15,
          totalSpent: 4500000,
          lastOrderDate: "20/05/2026",
          status: "active",
          joinedDate: "15/02/2025",
        };
        const newList = [...list, record];
        localStorage.setItem("paopizza_customers", JSON.stringify(newList));
      }
      setCustomerLoyalty(record);
    } else {
      setCustomerLoyalty(null);
    }
  }, [isAuthenticated, user]);

  const checkCustomerEligibility = (item: any) => {
    if (!customerLoyalty) return { eligible: false, reason: "select_customer", diffPoints: 0 };
    const cWeight = rankWeight[customerLoyalty.rank as keyof typeof rankWeight] || 1;
    const rWeight = rankWeight[item.minRank as keyof typeof rankWeight] || 1;
    if (cWeight < rWeight) {
      return { eligible: false, reason: "rank_too_low", diffPoints: 0 };
    }
    if (customerLoyalty.points < item.pointsRequired) {
      return { eligible: false, reason: "insufficient_points", diffPoints: item.pointsRequired - customerLoyalty.points };
    }
    return { eligible: true, reason: "ready", diffPoints: 0 };
  };

  const handleExecuteRedeem = () => {
    if (!customerLoyalty || !confirmRedeemItem) return;
    const item = confirmRedeemItem;
    const updatedPoints = customerLoyalty.points - item.pointsRequired;
    const updatedLoyalty = { ...customerLoyalty, points: updatedPoints };
    setCustomerLoyalty(updatedLoyalty);

    const saved = localStorage.getItem("paopizza_customers");
    const list = saved ? JSON.parse(saved) : mockCustomers;
    const updatedList = list.map((c: any) => (c.id === customerLoyalty.id ? { ...c, points: updatedPoints } : c));
    localStorage.setItem("paopizza_customers", JSON.stringify(updatedList));

    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `PAO-${item.minRank.toUpperCase()}-${item.pointsRequired}P-${randStr}`;

    const savedRedemptions = localStorage.getItem("paopizza_redemptions");
    const redemptions = savedRedemptions ? JSON.parse(savedRedemptions) : [];
    const newLog = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      customerName: customerLoyalty.name,
      customerPhone: customerLoyalty.phone,
      rewardName: item.name,
      pointsSpent: item.pointsRequired,
      couponCode: couponCode,
      date: new Date().toLocaleString("vi-VN"),
      type: item.type,
      status: "unused",
    };
    localStorage.setItem("paopizza_redemptions", JSON.stringify([newLog, ...redemptions]));

    addActivityLog(
      { id: customerLoyalty.id, name: customerLoyalty.name, email: customerLoyalty.phone + "@paopizza.com", role: "customer" },
      "Đổi quà điểm tích lũy",
      "Hệ thống quà tặng",
      `Khách hàng ${customerLoyalty.name} đã quy đổi điểm tích lũy để nhận phần quà "${item.name}" (Tiêu tốn ${item.pointsRequired} Pts, Mã Coupon: ${couponCode})`,
    );

    setRedemptionsTrigger(prev => prev + 1);
    setConfirmRedeemItem(null);
    setSuccessRedeemItem({ item, code: couponCode });
  };

  const handleToggleRedemptionStatus = (logId: string) => {
    const saved = localStorage.getItem("paopizza_redemptions");
    if (!saved) return;
    const list = JSON.parse(saved);
    const updated = list.map((item: any) => {
      if (item.id === logId) {
        const newStatus = item.status === "used" ? "unused" : "used";

        addActivityLog(
          { id: "customer-action", name: item.customerName, email: item.customerPhone + "@paopizza.com", role: "customer" },
          "Thay đổi trạng thái coupon",
          "Hệ thống quà tặng",
          `Khách hàng ${item.customerName} đã thay đổi trạng thái Coupon ${item.couponCode} thành "${newStatus === "used" ? "Đã sử dụng" : "Chưa sử dụng"}"`,
        );

        return { ...item, status: newStatus };
      }
      return item;
    });
    localStorage.setItem("paopizza_redemptions", JSON.stringify(updated));
    setRedemptionsTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25">
                <Pizza size={18} className="text-white" />
              </div>
              <span className="text-lg text-foreground font-black tracking-tight">PaoPizza</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">
                Trang chủ
              </button>
              <button onClick={() => navigate("/menu")} className="hover:text-primary transition-colors">
                Thực đơn
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user?.role === "customer" ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline text-sm text-foreground font-semibold">{user.name}</span>
                  <ChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl py-1.5 z-50">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left font-medium"
                    >
                      <UserIcon size={16} className="text-muted-foreground" /> Hồ sơ của tôi
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted text-left font-medium"
                    >
                      <History size={16} className="text-muted-foreground" /> Lịch sử đơn hàng
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 text-left font-medium"
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back navigation & Page intro */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Gift size={16} className="animate-pulse" /> Đổi thưởng thành viên
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Đổi Thưởng Tích Lũy</h1>
            <p className="text-sm text-muted-foreground">
              Tích lũy điểm thưởng từ các đơn hàng để quy đổi các phần quà độc quyền và Voucher hấp dẫn.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-bold rounded-xl transition-all w-fit"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>

        {!isAuthenticated || user?.role !== "customer" || !customerLoyalty ? (
          /* Guest fallback state */
          <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Lock size={28} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Yêu cầu đăng nhập</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Chức năng đổi quà điểm thưởng chỉ khả dụng cho thành viên PaoPizza. Vui lòng đăng nhập tài khoản khách hàng để
                tiếp tục.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/20"
              >
                Đăng nhập ngay
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all text-sm"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        ) : (
          /* Logged-in Customer View */
          <div className="space-y-8 animate-fade-in">
            {/* VIP Card Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Visual Glassmorphic Card */}
              <div
                className={`md:col-span-2 rounded-3xl border p-6 flex flex-col justify-between min-h-[190px] relative overflow-hidden group transition-all duration-500 text-white ${
                  customerLoyalty.rank === "Diamond"
                    ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950 border-purple-500/40 shadow-xl shadow-purple-500/10"
                    : customerLoyalty.rank === "Gold"
                      ? "bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-800 border-yellow-400/40 shadow-xl shadow-yellow-500/10"
                      : customerLoyalty.rank === "Silver"
                        ? "bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 border-slate-400/30 shadow-lg"
                        : "bg-gradient-to-br from-amber-800 via-orange-800 to-stone-900 border-orange-700/30 shadow-md"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full text-white/90 backdrop-blur-md">
                      Thẻ Thành Viên VIP
                    </span>
                    <h2 className="text-xl font-black tracking-wide mt-2 text-white drop-shadow-md">{customerLoyalty.name}</h2>
                    <p className="text-xs text-white/80 font-mono tracking-wider">SĐT: {customerLoyalty.phone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-white/60 block font-bold uppercase tracking-wider">Hạng Thẻ</span>
                    <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                      <Award size={18} className="text-yellow-400 animate-pulse" />
                      <span className="text-lg font-black tracking-widest text-white uppercase drop-shadow">
                        {customerLoyalty.rank}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-4 z-10 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                      <span>Quỹ điểm tích lũy của bạn</span>
                      <span className="flex items-center gap-1 text-yellow-300 font-extrabold">
                        <Coins size={14} /> {customerLoyalty.points.toLocaleString()} Điểm
                      </span>
                    </div>
                    <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-300 rounded-full shadow-inner transition-all duration-500"
                        style={{ width: `${Math.min(100, (customerLoyalty.points / 1500) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <p className="text-[9px] text-white/60 font-semibold uppercase">Đặc quyền chiết khấu</p>
                    <p className="text-sm font-black text-white mt-0.5">
                      Giảm {rankConfig[customerLoyalty.rank as keyof typeof rankConfig]?.discount || 0}% mọi đơn hàng
                    </p>
                  </div>
                </div>
              </div>

              {/* Loyalty Rules Card */}
              <div className="bg-card rounded-3xl border border-border p-6 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <Info size={14} className="text-primary" /> Cơ chế tích điểm
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Với mỗi <strong className="text-foreground">10.000đ</strong> thanh toán từ đơn hàng, bạn sẽ nhận được{" "}
                    <strong className="text-foreground">1 Điểm tích lũy</strong>. Điểm có thể dùng để đổi trực tiếp sang mã ưu đãi
                    giảm giá hoặc các phần quà ẩm thực miễn phí.
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border/80 pt-3 mt-4">
                  Hạn mức tối đa: 1,500 điểm.
                </div>
              </div>
            </div>

            {/* Tabs control */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div className="flex gap-1 bg-card border border-border p-1 rounded-xl w-fit">
                <button
                  onClick={() => setRewardCategoryTab("all")}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    rewardCategoryTab === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Tất cả quà
                </button>
                <button
                  onClick={() => setRewardCategoryTab("coupon")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    rewardCategoryTab === "coupon"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Ticket size={14} /> Voucher
                </button>
                <button
                  onClick={() => setRewardCategoryTab("item")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    rewardCategoryTab === "item"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Utensils size={14} /> Món ăn
                </button>
              </div>
              <div className="text-xs text-muted-foreground">Chỉ áp dụng với hạng thành viên tương ứng trở lên</div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardCatalog
                .filter(item => rewardCategoryTab === "all" || item.type === rewardCategoryTab)
                .map(item => {
                  const { eligible, reason, diffPoints } = checkCustomerEligibility(item);
                  const isLock = reason === "rank_too_low";
                  const isInsufficient = reason === "insufficient_points";

                  return (
                    <div
                      key={item.id}
                      className={`bg-card rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md ${
                        isLock
                          ? "border-border/40 opacity-60 bg-muted/10 grayscale"
                          : isInsufficient
                            ? "border-amber-500/20 hover:border-amber-500/30"
                            : "border-primary/10 hover:border-primary/30"
                      }`}
                    >
                      {isLock && (
                        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow">
                          <Lock size={9} /> Khóa Hạng {item.minRank}
                        </div>
                      )}
                      {!isLock && (
                        <div className="absolute top-3 right-3 z-10 flex gap-1">
                          <span className="bg-primary text-white font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            {item.pointsRequired} Pts
                          </span>
                          <span className="bg-card border border-border text-foreground font-bold px-2 py-0.5 rounded-full text-[9px]">
                            {item.minRank}
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex gap-4">
                        <div className="w-18 h-18 rounded-xl overflow-hidden shrink-0 border bg-muted flex items-center justify-center">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mb-1.5 ${
                              item.type === "coupon" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                            }`}
                          >
                            {item.type === "coupon" ? "Mã giảm giá" : "Sản phẩm free"}
                          </span>
                          <h4 className="text-sm font-black text-foreground line-clamp-1 leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/40 border-t border-border/60 px-5 py-3 flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-[8px] text-muted-foreground uppercase font-bold">Giá trị quà</p>
                          <p className="text-xs font-bold text-foreground truncate">{item.valueLabel}</p>
                        </div>

                        {isLock ? (
                          <button
                            disabled
                            className="px-3 py-2 bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold cursor-not-allowed flex items-center gap-1"
                          >
                            <Lock size={10} /> Hạng {item.minRank}
                          </button>
                        ) : isInsufficient ? (
                          <button
                            disabled
                            className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-[10px] font-bold cursor-not-allowed whitespace-nowrap"
                          >
                            Thiếu {diffPoints} điểm
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmRedeemItem(item)}
                            className="px-4 py-2 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white rounded-xl text-[10px] font-bold shadow-sm hover:scale-[1.03] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Đổi Quà
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Redemption History */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Clock size={18} className="text-primary" />
                <h4 className="text-lg font-bold text-foreground">Lịch sử quà bạn đã đổi</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground font-black uppercase tracking-wider border-b border-border/80 text-[10px]">
                      <th className="px-4 py-3">Mã GD</th>
                      <th className="px-4 py-3">Quà tặng</th>
                      <th className="px-4 py-3">Điểm trừ</th>
                      <th className="px-4 py-3">Mã Coupon giảm giá</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3 text-center">Sao chép</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const savedRedemptions = localStorage.getItem("paopizza_redemptions");
                      const list = savedRedemptions ? JSON.parse(savedRedemptions) : [];
                      const customerLogs = list.filter((log: any) => log.customerPhone === customerLoyalty.phone);

                      if (customerLogs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground italic text-xs">
                              Bạn chưa thực hiện đổi điểm lấy phần quà nào.
                            </td>
                          </tr>
                        );
                      }

                      return customerLogs.map((log: any) => {
                        const isUsed = log.status === "used";
                        return (
                          <tr
                            key={log.id}
                            className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-b-0"
                          >
                            <td className="px-4 py-3.5 text-primary font-bold">{log.id}</td>
                            <td className="px-4 py-3.5 font-bold text-foreground">
                              <span className="flex items-center gap-1.5">
                                {log.type === "coupon" ? (
                                  <Ticket size={13} className="text-blue-500 shrink-0" />
                                ) : (
                                  <Utensils size={13} className="text-green-500 shrink-0" />
                                )}
                                {log.rewardName}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-red-500 font-extrabold">-{log.pointsSpent} Pts</td>
                            <td className="px-4 py-3.5 font-mono">
                              <code className="bg-muted px-2 py-0.5 rounded border text-[10px] text-foreground font-semibold">
                                {log.couponCode}
                              </code>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleToggleRedemptionStatus(log.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border select-none cursor-pointer transition-all hover:brightness-95 ${
                                  !isUsed
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                                title="Click để thay đổi trạng thái"
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${!isUsed ? "bg-green-600 animate-pulse" : "bg-red-600"}`}
                                />
                                {!isUsed ? "Chưa sử dụng" : "Đã sử dụng"}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-muted-foreground">{log.date}</td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(log.couponCode);
                                  alert("Đã sao chép mã coupon!");
                                }}
                                className="p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                                title="Sao chép mã"
                              >
                                <Copy size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation modal */}
      {confirmRedeemItem && customerLoyalty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-card rounded-3xl w-full max-w-sm border border-border/80 shadow-2xl p-6 relative text-left">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Gift size={24} className="animate-bounce" />
              </div>
              <h3 className="text-foreground font-black text-sm tracking-tight">Xác nhận đổi điểm tích lũy?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                Hệ thống sẽ khấu trừ{" "}
                <strong className="text-foreground font-bold">{confirmRedeemItem.pointsRequired} Điểm</strong> của bạn để quy đổi
                phần quà này.
              </p>
            </div>

            <div className="mt-4 bg-muted/40 rounded-2xl p-4 border border-border/80 space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phần quà:</span>
                <span className="text-foreground text-right truncate max-w-[200px]">{confirmRedeemItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chi phí điểm đổi:</span>
                <span className="text-red-500 font-bold">-{confirmRedeemItem.pointsRequired} Pts</span>
              </div>
              <div className="border-t border-border/60 my-1.5 pt-2 flex justify-between font-bold">
                <span className="text-muted-foreground">Số dư điểm hiện tại:</span>
                <span className="text-foreground">{customerLoyalty.points} Pts</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-muted-foreground">Số dư điểm sau đổi:</span>
                <span className="text-primary">{customerLoyalty.points - confirmRedeemItem.pointsRequired} Pts</span>
              </div>
            </div>

            <div className="flex gap-3 mt-5 text-xs font-bold">
              <button
                onClick={() => setConfirmRedeemItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleExecuteRedeem}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 shadow-sm transition-all cursor-pointer"
              >
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {successRedeemItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl p-6 relative space-y-5 text-left">
            <div className="w-14 h-14 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-foreground font-black text-base tracking-tight">Đổi quà thành công! 🎉</h3>
              <p className="text-xs text-muted-foreground px-2">
                Mã coupon của bạn đã được tạo thành công và lưu vào lịch sử giao dịch.
              </p>
            </div>

            <div className="bg-primary/5 border border-dashed border-primary/30 rounded-2xl p-4 space-y-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Mã ưu đãi của bạn</p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-card px-3 py-1.5 rounded-lg border border-border font-mono text-xs font-black text-primary select-all">
                  {successRedeemItem.code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successRedeemItem.code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  title="Sao chép mã"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-green-600 font-bold">* Vui lòng áp dụng mã này tại trang thanh toán khi mua hàng!</p>
            </div>

            <button
              onClick={() => setSuccessRedeemItem(null)}
              className="w-full bg-muted border border-border text-foreground py-2.5 rounded-xl hover:bg-muted/80 text-xs font-bold transition-all cursor-pointer"
            >
              Đóng và tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <Pizza size={18} className="text-white" />
                </div>
                <span className="text-lg text-white font-bold">PaoPizza</span>
              </div>
              <p className="text-sidebar-foreground/60 text-sm max-w-sm">
                Pizza Ý đích thực nướng lò gạch nướng củi, giao nhanh nóng hổi.
              </p>
              <div className="flex items-center gap-3 mt-4">
                {[Facebook, Instagram, Mail].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-white transition-colors"
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white mb-3 text-sm font-bold">Liên kết</h4>
              <div className="space-y-2 text-sm text-sidebar-foreground/60">
                <p onClick={() => navigate("/")} className="hover:text-white cursor-pointer transition-colors">
                  Trang chủ
                </p>
                <p onClick={() => navigate("/menu")} className="hover:text-white cursor-pointer transition-colors">
                  Thực đơn
                </p>
                <p onClick={() => navigate("/")} className="hover:text-white cursor-pointer transition-colors">
                  Về chúng tôi
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-white mb-3 text-sm font-bold">Chính sách</h4>
              <div className="space-y-2 text-sm text-sidebar-foreground/60">
                <p className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</p>
                <p className="hover:text-white cursor-pointer transition-colors">Điều khoản sử dụng</p>
              </div>
            </div>
          </div>
          <div className="border-t border-sidebar-border mt-8 pt-6 text-center text-sm text-sidebar-foreground/40">
            &copy; {new Date().getFullYear()} PaoPizza. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
