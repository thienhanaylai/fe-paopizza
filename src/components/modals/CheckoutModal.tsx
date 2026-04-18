"use client";

import { ArrowLeft, Banknote, CheckCircle2, CreditCard, LoaderCircle, QrCode, ShoppingBag, Truck, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/src/context/cartContext";
import { getAllStore, StoreData1 } from "@/src/services/store.service";
import { Order, createOrder } from "@/src/services/order.service";
import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { toast } from "sonner";
import { clearCartApi } from "@/src/services/cart.service";
type CheckoutStep = "info" | "payment" | "success";
type OrderMethod = "carry_out" | "delivery" | "dining";
type PaymentMethod = "cash" | "bank_transfer" | "card" | "momo";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export const CheckoutModal = () => {
  const { cart, cartTotal, setCheckout, fetchCart } = useCart();
  const { user } = useCustomerAuth();
  const { getInfo } = useCustomerAuth();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("info");
  const [listStore, setListStore] = useState<StoreData1[]>();
  const [idOrder, setIdOrder] = useState("");
  const [orderMethod, setOrderMethod] = useState<OrderMethod>("carry_out");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [storeId, setStoreId] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNote, setCustNote] = useState("");

  useEffect(() => {
    const fecthData = async () => {
      try {
        const stores = await getAllStore();
        const finalList = stores.filter(item => item.status != "maintenance");
        setListStore(finalList);
        setStoreId(stores[0]._id);
      } catch (error) {
        console.log(error);
        setListStore([]);
      }
    };
    fecthData();
  }, []);

  const clearData = async () => {
    setIdOrder("");
    setCustName("");
    setCustPhone("");
    setStoreId("");
    setCustAddress("");
    setCustNote("");
    setOrderMethod("carry_out");
    setPaymentMethod("cash");
    await clearCartApi(user?.id);
    await fetchCart(user?.id);
  };

  const hanldeSubmit = async () => {
    const customer = await getInfo();

    const order: Order = {
      order_type: orderMethod,
      paymentMethod: paymentMethod,
      contact_info: {
        full_name: custName,
        phone: custPhone,
        address: custAddress,
      },
      store_id: storeId,
      items: cart
        ? cart?.items?.map(cartItem => ({
            ...cartItem,
            product_id: cartItem.product_id?._id,
          }))
        : [],
      note: custNote,
      customer_id: customer.ref_id._id,
    };

    if (custName === "" || custPhone === "" || storeId === "") {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (orderMethod === "delivery" && custAddress === "") {
      toast.warning("Vui lòng nhập địa chỉ giao hàng!");
      return;
    }
    const res = await createOrder(order, "customer");
    if (res) {
      setCheckoutStep("success");
      setIdOrder(res._id);
    }
  };

  const deliveryFee = orderMethod === "delivery" && cartTotal < 200000 ? 25000 : 0;
  const grandTotal = cartTotal + deliveryFee;

  const paymentOptions: { key: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "cash", label: "Tiền mặt", icon: <Banknote size={20} />, desc: "Thanh toán khi nhận hàng" },
    { key: "bank_transfer", label: "Chuyển khoản", icon: <QrCode size={20} />, desc: "Quét mã QR ngân hàng" },
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
        {checkoutStep === "success" ? (
          /* Success */
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
        ) : (
          <>
            <div className="flex items-center gap-3 p-5 border-b border-border">
              {checkoutStep === "payment" && (
                <button onClick={() => setCheckoutStep("info")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
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
              {checkoutStep === "info" ? (
                <>
                  <div>
                    <label className="block text-sm mb-2">Hình thức nhận hàng</label>
                    <div className="grid grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm mb-1">Chọn cửa hàng *</label>
                    <select
                      defaultValue={listStore?.[0]?._id || ""}
                      onChange={e => setStoreId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border top-full bg-background outline-none"
                    >
                      {listStore?.map(store => (
                        <option key={store._id} value={store._id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-foreground">Tổng cộng</span>
                      <span className="text-primary text-lg">{formatVND(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCheckoutStep("payment")}
                    disabled={!custName || !custPhone || (orderMethod === "delivery" && !custAddress)}
                    className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục thanh toán
                  </button>
                </>
              ) : (
                /* Payment step */
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

                  {paymentMethod === "bank_transfer" && (
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-3 flex items-center justify-center border border-border">
                        <QrCode size={80} className="text-gray-700" />
                      </div>
                      <p className="text-sm text-blue-700">Quét mã QR để chuyển khoản</p>
                      <p className="text-xs text-blue-500 mt-1">STK: 1234567890 - Ngân hàng VCB</p>
                    </div>
                  )}

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
                      hanldeSubmit();
                    }}
                    className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                  >
                    Xác nhận đặt hàng
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
