"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Gift, TicketPercent, Coins, Sparkles, Copy, Check, Clock, ArrowRight, Gem } from "lucide-react";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { getRedeemablePromotions, redeemPromotion, type Promotion, type RedeemResult } from "@/src/services/promotion.service";
import { formatVND } from "@/src/utils/formatVND";
import { formatDateTime } from "@/src/utils/formatDateTime";
import { toast, Toaster } from "sonner";

// ─── Local storage for redeemed codes (since BE doesn't track per-customer history yet) ───
const REDEEMED_CODES_KEY = "paopizza_redeemed_codes";

interface RedeemedCode {
  code: string;
  promotionName: string;
  type: string;
  value: number;
  pointCost: number;
  redeemedAt: string;
  endDate: string;
}

function loadRedeemedCodes(): RedeemedCode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REDEEMED_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRedeemedCodes(codes: RedeemedCode[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REDEEMED_CODES_KEY, JSON.stringify(codes));
}

// ─── Tier helpers ───
const tierBadges: Record<string, React.ReactNode> = {
  diamond: (
    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-white border border-cyan-300/30 select-none shrink-0">
      DIAMOND
    </span>
  ),
  gold: (
    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border border-amber-500/30 select-none shrink-0">
      GOLD
    </span>
  ),
  silver: (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider bg-gradient-to-r from-slate-200 to-zinc-300 text-slate-800 border border-slate-300/80 select-none shrink-0">
      SILVER
    </span>
  ),
  member: (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800 select-none shrink-0">
      MEMBER
    </span>
  ),
};

const tierColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  diamond: {
    bg: "from-cyan-500/10 via-sky-500/10 to-indigo-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-300/30",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
  },
  gold: {
    bg: "from-amber-500/10 to-yellow-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-300/30",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
  },
  silver: {
    bg: "from-slate-300/10 to-zinc-300/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-300/20",
    glow: "shadow-[0_0_30px_rgba(148,163,184,0.1)]",
  },
  member: {
    bg: "from-slate-200/5 to-slate-100/5",
    text: "text-slate-500 dark:text-slate-400",
    border: "border-slate-200/20",
    glow: "",
  },
};

function getDiscountLabel(type: string, value: number): string {
  if (type === "percentage") return `Giảm ${value}%`;
  return `Giảm ${formatVND(value)}`;
}

export default function LoyaltyPage() {
  const { user, getInfo } = useCustomerAuth();

  // ─── State ───
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [redeemedCodes, setRedeemedCodes] = useState<RedeemedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<Promotion | null>(null);
  const [resultModal, setResultModal] = useState<RedeemResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ─── Fetch data ───
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [promos] = await Promise.all([getRedeemablePromotions()]);
      setPromotions(promos);
      setRedeemedCodes(loadRedeemedCodes());
    } catch (err) {
      console.error("Lỗi tải dữ liệu loyalty:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Refresh user info (points) after redeem ───
  const refreshUser = async () => {
    await getInfo();
  };

  // ─── Handle redeem ───
  const handleRedeem = async (promotion: Promotion) => {
    setRedeemingId(promotion._id);
    try {
      const result = await redeemPromotion(promotion._id);

      // Save to local redeemed codes
      const newCode: RedeemedCode = {
        code: result.code,
        promotionName: `${getDiscountLabel(result.type, result.value)} - ${result.code}`,
        type: result.type,
        value: result.value,
        pointCost: result.pointCost,
        redeemedAt: new Date().toISOString(),
        endDate: promotion.endDate,
      };
      const updated = [newCode, ...redeemedCodes];
      setRedeemedCodes(updated);
      saveRedeemedCodes(updated);

      // Update user points
      await refreshUser();

      // Show result modal
      setConfirmModal(null);
      setResultModal(result);
      toast.success("Đổi điểm thành công! Hãy dùng mã để được giảm giá.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể đổi điểm. Vui lòng thử lại.";
      // Map error messages to Vietnamese
      const errorMap: Record<string, string> = {
        INSUFFICIENT_POINTS: "Bạn không đủ điểm để đổi mã này.",
        PROMOTION_NOT_ACTIVE: "Mã khuyến mãi này hiện không khả dụng.",
        PROMOTION_EXPIRED: "Mã khuyến mãi này đã hết hạn.",
        PROMOTION_NOT_REDEEMABLE: "Mã này không hỗ trợ đổi bằng điểm.",
      };
      const friendlyMsg = errorMap[msg] || msg;
      toast.error(friendlyMsg);
    } finally {
      setRedeemingId(null);
    }
  };

  // ─── Copy code ───
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Đã sao chép mã!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Không thể sao chép mã");
    }
  };

  // ─── Guard ───
  if (!user) return null;

  const tier = user.tier || "member";
  const tierStyle = tierColors[tier] || tierColors.member;
  const currentPoint = user.currentPoint ?? 0;
  const totalPoint = user.totalPoint ?? 0;

  return (
    <>
      <div className="py-8 min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Award size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Điểm thưởng & Ưu đãi</h2>
              <p className="text-sm text-muted-foreground">Đổi điểm tích lũy để nhận mã khuyến mãi</p>
            </div>
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tierStyle.bg} border ${tierStyle.border} ${tierStyle.glow} p-6`}
          >
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
              <Sparkles className="w-full h-full text-primary" />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins size={16} />
                  <span>Điểm hiện có</span>
                </div>
                <p className={`text-3xl font-extrabold ${tierStyle.text}`}>{currentPoint.toLocaleString("vi-VN")}</p>
                <p className="text-xs text-muted-foreground">Tổng đã tích: {totalPoint.toLocaleString("vi-VN")} điểm</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gem size={16} />
                  <span>Hạng thành viên</span>
                </div>
                <div className="flex items-center gap-2">{tierBadges[tier]}</div>
                <p className="text-xs text-muted-foreground">
                  {tier === "diamond" && "Ưu đãi cao nhất dành cho bạn"}
                  {tier === "gold" && "Bạn đang ở hạng Vàng"}
                  {tier === "silver" && "Tích thêm điểm để lên Gold"}
                  {tier === "member" && "Mua nhiều hơn để lên hạng nhé!"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gift size={16} />
                  <span>Mã đã đổi</span>
                </div>
                <p className={`text-2xl font-bold ${tierStyle.text}`}>{redeemedCodes.length}</p>
                <p className="text-xs text-muted-foreground">mã khuyến mãi</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TicketPercent size={18} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Ưu đãi có thể đổi</h3>
              {!loading && <span className="text-sm text-muted-foreground">({promotions.length} mã)</span>}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
                ))}
              </div>
            ) : promotions.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Gift size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Chưa có ưu đãi nào để đổi điểm</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Hãy quay lại sau nhé!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {promotions.map(promo => {
                  const canRedeem = currentPoint >= promo.point;
                  const isRedeeming = redeemingId === promo._id;

                  return (
                    <div
                      key={promo._id}
                      className={`relative group rounded-2xl border bg-card p-5 transition-all duration-200 hover:shadow-lg ${
                        canRedeem ? "border-border hover:border-primary/30" : "border-border opacity-60"
                      }`}
                    >
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            promo.type === "percentage"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {getDiscountLabel(promo.type, promo.value)}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-lg font-bold text-foreground font-mono tracking-wider">{promo.code}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Clock size={12} />
                            <span>HSD: {formatDateTime(promo.endDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Coins size={16} className="text-amber-500" />
                            <span
                              className={`text-lg font-bold ${
                                canRedeem ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                              }`}
                            >
                              {promo.point.toLocaleString("vi-VN")}
                            </span>
                            <span className="text-sm text-muted-foreground">điểm</span>
                          </div>

                          <button
                            disabled={!canRedeem || isRedeeming}
                            onClick={() => setConfirmModal(promo)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              canRedeem && !isRedeeming
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 cursor-pointer"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                          >
                            {isRedeeming ? (
                              <>
                                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Đang đổi...
                              </>
                            ) : canRedeem ? (
                              <>
                                Đổi ngay
                                <ArrowRight size={14} />
                              </>
                            ) : (
                              "Không đủ điểm"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {redeemedCodes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gift size={18} className="text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Mã của bạn</h3>
                <span className="text-sm text-muted-foreground">({redeemedCodes.length} mã)</span>
              </div>

              <div className="space-y-3">
                {redeemedCodes.map((item, idx) => {
                  const isExpired = new Date(item.endDate) < new Date();
                  return (
                    <div
                      key={`${item.code}-${idx}`}
                      className={`flex items-center justify-between gap-4 p-4 rounded-xl border bg-card transition-all ${
                        isExpired ? "opacity-50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-foreground text-sm sm:text-base truncate">{item.code}</p>
                          {isExpired && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                              HẾT HẠN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getDiscountLabel(item.type, item.value)} • Đã đổi {formatDateTime(item.redeemedAt)} • HSD{" "}
                          {formatDateTime(item.endDate)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopyCode(item.code)}
                        disabled={isExpired}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          isExpired
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : copiedCode === item.code
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 cursor-pointer"
                        }`}
                      >
                        {copiedCode === item.code ? (
                          <>
                            <Check size={14} />
                            Đã sao
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Sao chép
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />

          <div className="relative bg-card rounded-2xl border border-border shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Coins size={28} className="text-amber-600 dark:text-amber-400" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-foreground">Xác nhận đổi điểm</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Bạn sẽ dùng <span className="font-bold text-amber-600">{confirmModal.point.toLocaleString("vi-VN")} điểm</span>{" "}
                  để đổi mã
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                <p className="font-mono text-lg font-bold text-foreground">{confirmModal.code}</p>
                <p className="text-sm text-muted-foreground">{getDiscountLabel(confirmModal.type, confirmModal.value)}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Sau khi đổi, bạn còn{" "}
                <span className="font-semibold text-foreground">
                  {Math.max(0, currentPoint - confirmModal.point).toLocaleString("vi-VN")} điểm
                </span>
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => handleRedeem(confirmModal)}
                  disabled={redeemingId === confirmModal._id}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {redeemingId === confirmModal._id ? "Đang đổi..." : "Xác nhận đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setResultModal(null)} />

          <div className="relative bg-card rounded-2xl border border-border shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check size={28} className="text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-foreground">Đổi điểm thành công!</h4>
                <p className="text-sm text-muted-foreground mt-1">Dùng mã này khi thanh toán để được giảm giá</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Mã khuyến mãi của bạn</p>
                <p className="font-mono text-2xl font-extrabold text-primary tracking-widest">{resultModal.code}</p>
                <p className="text-sm text-muted-foreground mt-1">{getDiscountLabel(resultModal.type, resultModal.value)}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Điểm còn lại:{" "}
                <span className="font-semibold text-foreground">{resultModal.remainingPoint.toLocaleString("vi-VN")} điểm</span>
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleCopyCode(resultModal.code)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                    copiedCode === resultModal.code
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {copiedCode === resultModal.code ? (
                    <>
                      <Check size={14} className="inline mr-1" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="inline mr-1" />
                      Sao chép mã
                    </>
                  )}
                </button>
                <button
                  onClick={() => setResultModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" richColors />
    </>
  );
}
