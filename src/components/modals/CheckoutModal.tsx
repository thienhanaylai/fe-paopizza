"use client";

import { ArrowLeft, Banknote, CheckCircle2, LoaderCircle, QrCode, ShoppingBag, TicketPercent, Truck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/src/context/cartContext";
import { getAllStore, StoreData } from "@/src/services/store.service";
import { Order, createOrder, PaymentMethod } from "@/src/services/order.service";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { toast } from "sonner";
import Image from "next/image";
import { checkPaymentStatus } from "@/src/services/payment.service";
import { applyPromoCode, PromoCodeResult } from "@/src/services/promotion.service";
import { formatVND } from "@/src/utils/formatVND";

type CheckoutStep = "info" | "payment" | "success" | "failed";
type OrderMethod = "carry_out" | "delivery" | "dine_in";

export function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft === null) return null;

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div>
      <p>Thời gian thanh toán còn lại: </p>
      <p className="text-red-500 text-center">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </p>
    </div>
  );
}

export const CheckoutModal = () => {
  const { cart, cartTotal, setCheckout, fetchCart, clearCart } = useCart();
  const { user, getInfo } = useCustomerAuth();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("info");
  const [listStore, setListStore] = useState<StoreData[]>();
  const [idOrder, setIdOrder] = useState("");
  const [orderMethod, setOrderMethod] = useState<OrderMethod>("carry_out");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [isPayment, setIsPayment] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [storeId, setStoreId] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNote, setCustNote] = useState("");
  const [imgQr, setImgQr] = useState("");

  // Promotion/Discount
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeResult | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const discountAmount = appliedPromo?.valid ? appliedPromo.discountAmount : 0;

  const [testtime, setTestime] = useState<Date>();

  const pollingRef = useRef(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };
  const startPolling = (orderId: string) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(orderId);

        if (res.data.paymentStatus === "success") {
          stopPolling();
          setCheckoutStep("success");
        }
      } catch (err) {
        console.error("Lỗi khi check status:", err);
      }
    }, 3000);
  };
  useEffect(() => {
    const fecthData = async () => {
      try {
        const stores = await getAllStore();
        const finalList = stores.filter(item => item.status == "active");
        setListStore(finalList);

        const selectedStoreId = localStorage.getItem("selected_store");
        const matchedStore = finalList.find(s => s._id === selectedStoreId);
        setStoreId(matchedStore?._id || "");
      } catch (error) {
        console.log(error);
        setListStore([]);
      }
    };
    fecthData();
    stopPolling();
  }, []);

  const clearData = async () => {
    setIdOrder("");
    setCustName("");
    setCustPhone("");
    setStoreId("");
    setCustAddress("");
    setCustNote("");
    setPromoCode("");
    setPromoError("");
    setAppliedPromo(null);
    setOrderMethod("carry_out");
    setPaymentMethod("cash");
    await clearCart(user?.id);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Vui lòng nhập mã khuyến mãi");
      return;
    }
    setIsApplyingPromo(true);
    setPromoError("");
    try {
      const result = await applyPromoCode(promoCode, cartTotal, storeId);
      if (result.valid) {
        setAppliedPromo(result);
        setPromoError("");
      } else {
        setAppliedPromo(null);
        setPromoError(result.message || "Mã khuyến mãi không hợp lệ");
      }
    } catch {
      setAppliedPromo(null);
      setPromoError("Không thể kiểm tra mã khuyến mãi");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const hanldeSubmit = async () => {
    let customer;
    if (user) {
      customer = user?.id ? await getInfo() : null;
    } else {
      customer = null;
    }

    // Always read latest store from localStorage to avoid stale storeId
    const currentStoreId = localStorage.getItem("selected_store") || storeId;

    const order: Order = {
      order_type: orderMethod,
      paymentMethod: paymentMethod,
      contact_info: {
        full_name: custName,
        phone: custPhone,
        address: custAddress,
      },
      store_id: currentStoreId,
      items: cart
        ? cart?.items?.map(cartItem => ({
            ...cartItem,
            product_id: typeof cartItem.product_id === "string" ? cartItem.product_id : cartItem.product_id?._id,
            added_topping: Array.isArray(cartItem.added_topping)
              ? cartItem.added_topping.map(topping => ({
                  ingredient: typeof topping === "string" ? topping : topping._id,
                  quantity: 1,
                }))
              : [],
            combo_selections: Array.isArray(cartItem.combo_selections)
              ? cartItem.combo_selections.map(selection => ({
                  ...selection,
                  product_id: typeof selection.product_id === "string" ? selection.product_id : selection.product_id?._id,
                  crust: selection.crust,
                  added_topping: Array.isArray(selection.added_topping)
                    ? selection.added_topping.map(topping => ({
                        ingredient: typeof topping === "string" ? topping : topping._id,
                        quantity: 1,
                      }))
                    : [],
                }))
              : [],
          }))
        : [],
      note: custNote,
      promotion_code: appliedPromo?.valid ? appliedPromo.code : undefined,
      discount_amount: appliedPromo?.valid ? discountAmount : 0,
      customer_id: customer?.ref_id?._id || null,
    };
    if (custName === "" || custPhone === "" || !currentStoreId) {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (orderMethod === "delivery" && custAddress === "") {
      toast.warning("Vui lòng nhập địa chỉ giao hàng!");
      return;
    }

    const result = await createOrder(order, "customer");
    const res = result.data;
    const payment = result.payment;

    if (res.paymentMethod != "cash" && res.paymentStatus != "success") {
      setIsPayment(true);
      setTestime(new Date(Date.now() + 3 * 60 * 1000));
      startPolling(payment.orderId);
      setImgQr(payment.qrUrl);
      setIdOrder(res._id);
    }
    if (res.paymentMethod === "cash") {
      setCheckoutStep("success");
      setIdOrder(res._id);
    }
  };

  const handleCheckConfirm = async () => {
    try {
      const res = await checkPaymentStatus(idOrder);

      if (res.data.paymentStatus === "success") {
        stopPolling();
        setCheckoutStep("success");
        clearData();
      }
    } catch (err) {
      console.error("Lỗi khi check status:", err);
    }
  };

  const deliveryFee = orderMethod === "delivery" && cartTotal < 200000 ? 25000 : 0;
  const grandTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  const paymentOptions: { key: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "cash", label: "Tiền mặt", icon: <Banknote size={20} />, desc: "Thanh toán khi nhận hàng" },
    { key: "qrCode", label: "Chuyển khoản", icon: <QrCode size={20} />, desc: "Quét mã QR ngân hàng" },
  ];
  if (!listStore || listStore.length === 0) {
    return (
      <div>
        <LoaderCircle className="animate-spin" size={18} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 "
      onClick={() => {
        if (checkoutStep !== "success") setCheckout(false);
      }}
    >
      <div
        className="bg-card rounded-2xl w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-hide animate-fade-up animate-duration-300"
        onClick={e => e.stopPropagation()}
      >
        {checkoutStep === "success" && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl text-foreground mb-2">Đặt hàng thành công!</h3>
            <p className="text-muted-foreground mb-1">
              Mã đơn hàng: <span className="text-primary"> {idOrder}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {orderMethod === "carry_out"
                ? "Vui lòng đến cửa hàng để nhận đơn trong 20-30 phút."
                : "Đơn hàng sẽ được giao trong 30-45 phút."}
            </p>
            <div className="bg-muted/50 rounded-xl p-4 text-left mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phương thức:</span>
                <span className="text-foreground">{orderMethod === "carry_out" ? "Đến lấy" : "Giao hàng"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Thanh toán:</span>
                <span className="text-foreground">{paymentOptions.find(p => p.key === paymentMethod)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tổng tiền:</span>
                <span className="text-primary">{formatVND(grandTotal)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setCheckout(false);
                clearData();
              }}
              className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}{" "}
        {checkoutStep != "success" && checkoutStep != "failed" && (
          <>
            <div className="flex items-center gap-3 p-5 border-b border-border">
              {checkoutStep === "payment" && isPayment === false ? (
                <button onClick={() => setCheckoutStep("info")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCheckoutStep("payment");
                    setIsPayment(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="flex-1">
                <h3 className="text-foreground">{checkoutStep === "info" ? "Thông tin đặt hàng" : "Phương thức thanh toán"}</h3>
                <p className="text-xs text-muted-foreground">Bước {checkoutStep === "info" ? "1" : "2"} / 2</p>
              </div>
              <button onClick={() => setCheckout(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-primary" />
                <div className={`flex-1 h-1.5 rounded-full ${checkoutStep === "payment" ? "bg-primary" : "bg-muted"}`} />
              </div>
            </div>

            <div className="p-5 space-y-5">
              {checkoutStep === "info" && (
                <>
                  <div>
                    <label className="block text-sm mb-2">Hình thức nhận hàng</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setOrderMethod("carry_out")}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${orderMethod === "carry_out" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${orderMethod === "carry_out" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                        >
                          <ShoppingBag size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-foreground">Đến lấy</p>
                          <p className="text-[11px] text-muted-foreground">20-30 phút</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setOrderMethod("delivery")}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${orderMethod === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${orderMethod === "delivery" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                        >
                          <Truck size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-foreground">Giao hàng</p>
                          <p className="text-[11px] text-muted-foreground">30-45 phút</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Họ tên *</label>
                      <input
                        value={custName}
                        onChange={e => setCustName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Số điện thoại *</label>
                      <input
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        placeholder="0901234567"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  {orderMethod === "delivery" && (
                    <div>
                      <label className="block text-sm mb-1">Địa chỉ giao hàng *</label>
                      <input
                        value={custAddress}
                        onChange={e => setCustAddress(e.target.value)}
                        placeholder="Nhập địa chỉ chi tiết"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm mb-1">Ghi chú</label>
                    <textarea
                      value={custNote}
                      onChange={e => setCustNote(e.target.value)}
                      rows={2}
                      placeholder="Ghi chú thêm cho đơn hàng..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none resize-none"
                    />
                  </div>

                  {/* Promotion Code */}
                  <div>
                    <label className="block text-sm mb-1">Mã khuyến mãi</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={promoCode}
                        onChange={e => {
                          setPromoCode(e.target.value);
                          if (promoError) setPromoError("");
                        }}
                        placeholder="Nhập mã khuyến mãi"
                        disabled={!!appliedPromo?.valid}
                        className="w-full sm:flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none disabled:bg-muted disabled:text-muted-foreground uppercase"
                      />
                      {appliedPromo?.valid ? (
                        <button
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoCode("");
                            setPromoError("");
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm hover:bg-red-100 transition-colors shrink-0"
                        >
                          Hủy
                        </button>
                      ) : (
                        <button
                          onClick={handleApplyPromo}
                          disabled={!promoCode.trim() || isApplyingPromo}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5"
                        >
                          {isApplyingPromo ? <LoaderCircle size={16} className="animate-spin" /> : <TicketPercent size={16} />}
                          Áp dụng
                        </button>
                      )}
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <X size={12} /> {promoError}
                      </p>
                    )}
                    {appliedPromo?.valid && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {appliedPromo.message || `Giảm ${formatVND(discountAmount)} với mã "${appliedPromo.code}"`}
                      </p>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <p className="text-sm text-foreground mb-2">Tóm tắt đơn hàng</p>
                    {/* {Object.entries(cart).map(([id, qty]) => {
                      const item = menuItems.find(m => m.id === Number(id));
                      if (!item) return null;
                      return (
                        <div key={id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} x{qty}
                          </span>
                          <span className="text-foreground">{formatVND(item.price * qty)}</span>
                        </div>
                      );
                    })} */}
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm pt-1 border-t border-border">
                        <span className="text-muted-foreground">Phí giao hàng</span>
                        <span className="text-foreground">{formatVND(deliveryFee)}</span>
                      </div>
                    )}
                    {deliveryFee === 0 && orderMethod === "delivery" && (
                      <div className="flex justify-between text-sm pt-1 border-t border-border">
                        <span className="text-muted-foreground">Phí giao hàng</span>
                        <span className="text-green-600">Miễn phí</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm pt-1 border-t border-border">
                        <span className="text-green-600 flex items-center gap-1">
                          <TicketPercent size={14} /> Giảm giá
                        </span>
                        <span className="text-green-600">-{formatVND(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-foreground">Tổng cộng</span>
                      <span className="text-primary text-lg">{formatVND(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const phoneRegex = /^(0|84|\+84)[35789]\d{8}$/;
                      if (!phoneRegex.test(custPhone)) {
                        toast.warning("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại!");
                        return;
                      }
                      setCheckoutStep("payment");
                    }}
                    disabled={!custName || !custPhone || (orderMethod === "delivery" && !custAddress)}
                    className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục thanh toán
                  </button>
                </>
              )}
              {checkoutStep === "payment" && isPayment === false && (
                <>
                  <div>
                    <label className="block text-sm mb-3">Chọn phương thức thanh toán</label>
                    <div className="space-y-3">
                      {paymentOptions.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setPaymentMethod(opt.key);
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === opt.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === opt.key ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                          >
                            {opt.icon}
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                          <div className="ml-auto">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.key ? "border-primary" : "border-border"}`}
                            >
                              {paymentMethod === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span className="text-foreground">{formatVND(cartTotal)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí giao hàng:</span>
                        <span className="text-foreground">{formatVND(deliveryFee)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm pt-1 border-t border-border">
                        <span className="text-green-600 flex items-center gap-1">
                          <TicketPercent size={14} /> Giảm giá
                        </span>
                        <span className="text-green-600">-{formatVND(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-foreground">Tổng thanh toán:</span>
                      <span className="text-primary text-lg">{formatVND(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      hanldeSubmit();
                    }}
                    className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                  >
                    {paymentMethod != "cash" ? "Thanh toán" : "Xác nhận đặt hàng"}
                  </button>
                </>
              )}
              {checkoutStep === "payment" && isPayment === true && imgQr && (
                <>
                  <div>
                    <label className="block text-sm mb-3">Quét mã qr bên dưới để thanh toán</label>
                    <div className="space-y-3 flex flex-col items-center">
                      <Image src={imgQr || ""} fill alt="qr" className="relative! w-[50%]!" />
                      <p>Mã đơn hàng: {idOrder}</p>
                      <CountdownTimer
                        expiresAt={testtime}
                        onExpire={() => {
                          stopPolling();
                          setIdOrder("");
                          setCustName("");
                          setCustPhone("");
                          setStoreId("");
                          setCustAddress("");
                          setCustNote("");
                          setOrderMethod("carry_out");
                          setPaymentMethod("cash");
                          setCheckoutStep("failed");
                          fetchCart(user?.id || "");
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span className="text-foreground">{formatVND(cartTotal)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phí giao hàng:</span>
                        <span className="text-foreground">{formatVND(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-foreground">Tổng thanh toán:</span>
                      <span className="text-primary text-lg">{formatVND(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleCheckConfirm();
                    }}
                    className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                  >
                    Đã thanh toán
                  </button>
                </>
              )}
            </div>
          </>
        )}
        {checkoutStep === "failed" && isPayment === true && (
          <div className="p-5 space-y-5">
            <div>
              <h3 className="block  mb-3">Hết thời gian thanh toán</h3>
              <div className="space-y-3 flex flex-col items-center">
                <p>Đã hết thời gian thanh toán vui lòng đặt hàng lại!</p>
              </div>
            </div>

            <button
              onClick={() => {
                stopPolling();
                setIdOrder("");
                setCustName("");
                setCustPhone("");
                setStoreId("");
                setCustAddress("");
                setCustNote("");
                setOrderMethod("carry_out");
                setPaymentMethod("cash");
                setCheckout(false);
                fetchCart(user?.id || "");
              }}
              className="w-full bg-white text-primary border-primary border-2 py-3 rounded-xl hover:text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
