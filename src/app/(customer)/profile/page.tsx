"use client";
import { useState, useEffect } from "react";
import {
  Pizza,
  ArrowLeft,
  History,
  ArrowRight,
  CheckCircle2,
  User as UserIcon,
  Lock,
  Edit2,
  Check,
  Gift,
  Plus,
  MapPin,
  X,
  Trash2,
} from "lucide-react";

import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { getAllOrder, OrderHistory } from "@/src/services/order.service";
import Link from "next/link";
import { formatDateTime } from "@/src/utils/formatDateTime";
import { toast, Toaster } from "sonner";
import {
  addCustomerAddress,
  AddCustomerAddressPayload,
  CustomerAddress,
  deleteCustomerAddress,
  DeleteCustomerAddressPayload,
  getCustomerAddresses,
  setDefaultAddress,
  updateCustomerAddress,
  UpdateCustomerAddressPayload,
} from "@/src/services/customer.service";

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

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-teal-100 text-teal-700" },
  preparing: { label: "Đang làm", color: "bg-blue-100 text-blue-700" },
  delivering: { label: "Đang giao", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Hoàn thành", color: "bg-green-200 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

const orderTypeLabels: Record<string, string> = {
  carry_out: "Đến lấy",
  delivery: "Giao hàng",
};

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function Profile() {
  const { user, getInfo } = useCustomerAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [addressFormState, setAddressFormState] = useState<"list" | "add" | "edit">("list");
  const [formAddressName, setFormAddressName] = useState("");
  const [formAddressPhone, setFormAddressPhone] = useState("");
  const [formAddressText, setFormAddressText] = useState("");
  const [formAddressIsDefault, setFormAddressIsDefault] = useState(false);
  const [listAddress, setListAddress] = useState([]);
  const [editAddress, setEditAddress] = useState<CustomerAddress>();

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");

  const [ordersHistory, setOrderHistory] = useState<OrderHistory[]>();

  const fecthData = async () => {
    const customer = await getInfo();
    const res = await getAllOrder(`customer_id=${customer.ref_id?._id}`, "customer");
    const listAddress = await getCustomerAddresses(user?.id, "customer");
    setListAddress(listAddress);
    setOrderHistory(res);
  };
  useEffect(() => {
    fecthData();
  }, []);

  if (!user) return null;

  const showSaved = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2500);
  };

  const handleOpenAddAddress = () => {
    setFormAddressName("");
    setFormAddressPhone("");
    setFormAddressText("");
    setFormAddressIsDefault(false);
    setAddressFormState("add");
  };

  const handleOpenEditAddress = async (addr: CustomerAddress) => {
    setFormAddressName(addr.name || "");
    setFormAddressPhone(addr.phone || "");
    setFormAddressText(addr.address || "");
    setFormAddressIsDefault(addr.isDefault || false);
    setEditAddress(addr);
    setAddressFormState("edit");
  };

  const handleDeleteAddress = async (addr: CustomerAddress) => {
    const payload: DeleteCustomerAddressPayload = {
      user_id: user.id,
      address_id: addr?._id || "",
    };
    const res = await deleteCustomerAddress(payload, "customer");
    if (res) {
      toast.success(res.message);
      setAddressFormState("list");
      fecthData();
    }
  };

  const handleAddAddress = async () => {
    const payload: AddCustomerAddressPayload = {
      user_id: user.id,
      name: formAddressName,
      address: formAddressText,
      phone: formAddressPhone,
      isDefault: formAddressIsDefault,
    };
    const res = await addCustomerAddress(payload, "customer");
    if (res) {
      toast.success(res.message);
      setAddressFormState("list");
      fecthData();
    }
  };

  const handleSetDefaultAddress = async (addr: CustomerAddress | undefined) => {
    const payload: UpdateCustomerAddressPayload = {
      user_id: user.id,
      address_id: addr?._id || "",
    };

    const res = await setDefaultAddress(payload, "customer");

    if (res) {
      toast.success(res.message);
      setAddressFormState("list");
      fecthData();
    }
  };

  const handleEditAddress = async (addr: CustomerAddress | undefined) => {
    const payload: UpdateCustomerAddressPayload = {
      user_id: user.id,
      address_id: addr?._id || "",
      name: formAddressName,
      address: formAddressText,
      phone: formAddressPhone,
      isDefault: formAddressIsDefault,
    };

    const res = await updateCustomerAddress(payload, "customer");

    if (res) {
      toast.success(res.message);
      setAddressFormState("list");
      fecthData();
    }
  };

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError("Vui lòng nhập đầy đủ");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Mật khẩu xác nhận không khớp");
      return;
    }
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    showSaved("Đã đổi mật khẩu thành công!");
  };

  const totalSpent = ordersHistory?.filter(o => o.status === "completed").reduce((a, o) => a + o.total, 0);
  const completedCount = ordersHistory?.filter(o => o.status === "completed").length;
  const recentOrders = ordersHistory?.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-green-500 text-white text-sm">
          <CheckCircle2 size={18} /> {savedToast}
        </div>
      )}

      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>

          {/* Header card */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">{tierBadges[user?.tier || 0]}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Đơn đã đặt</p>
                <p className="text-foreground text-xl mt-0.5">{ordersHistory?.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hoàn thành</p>
                <p className="text-foreground text-xl mt-0.5">{completedCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
                <p className="text-primary text-xl mt-0.5">{formatVND(totalSpent || 0)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground flex items-center gap-2">
                    <UserIcon size={18} className="text-primary" /> Thông tin cá nhân
                  </h3>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-sm text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                    >
                      <Edit2 size={14} /> Chỉnh sửa
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(false);
                        showSaved("Đã lưu thông tin");
                      }}
                      className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90"
                    >
                      <Check size={14} /> Lưu
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Họ và tên</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary disabled:bg-muted/40 disabled:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
                      <input
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-muted-foreground outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Số điện thoại</label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary disabled:bg-muted/40 disabled:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Ngày sinh</label>
                      <input
                        type="date"
                        disabled={!editing}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary disabled:bg-muted/40 disabled:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Địa chỉ giao hàng</label>
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      disabled={!editing}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary disabled:bg-muted/40 disabled:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground flex items-center gap-2">
                    <History size={18} className="text-primary" /> Đơn hàng gần đây
                  </h3>
                  <Link href="/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Xem tất cả <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentOrders?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn hàng nào</p>
                  ) : (
                    recentOrders?.map(order => {
                      const st = orderStatusConfig[order.status];
                      return (
                        <div
                          key={order._id}
                          className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center text-sm gap-3">
                              <span
                                title="Nhấn để copy toàn bộ ID"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(order._id);
                                    toast.success("Đã sao chép ID!");
                                  } catch (err) {
                                    toast.error("Không thể sao chép ID");
                                  }
                                }}
                                className="hover:underline text-primary cursor-pointer "
                              >
                                ...{order._id.slice(-9)}
                              </span>
                              <span className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${st.color}`}>{st.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-2">
                            {order.items.map(i => `${i.product_id?.name || i.sku} x${i.quantity}`).join(", ")}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                              {orderTypeLabels[order.orderType]}
                            </span>
                            <span className="text-primary text-sm">{formatVND(order.total)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {showAddressesModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
                onClick={() => setShowAddressesModal(false)}
              >
                <div
                  className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-border flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
                    <h3 className="text-foreground font-bold flex items-center gap-2">
                      <MapPin size={18} className="text-primary" />
                      {addressFormState === "list" && "Địa chỉ nhận hàng đã lưu"}
                      {addressFormState === "add" && "Thêm địa chỉ nhận hàng mới"}
                      {addressFormState === "edit" && "Chỉnh sửa địa chỉ nhận hàng"}
                    </h3>
                    <button
                      onClick={() => setShowAddressesModal(false)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {addressFormState === "list" ? (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs text-muted-foreground">Bạn có thể lưu nhiều địa chỉ để đặt hàng nhanh chóng.</p>
                          <button
                            onClick={() => {
                              handleOpenAddAddress();
                            }}
                            className="flex items-center gap-1 text-xs bg-primary text-white px-2.5 py-1.5 rounded-lg hover:bg-primary/95 transition-colors font-bold cursor-pointer"
                          >
                            <Plus size={14} /> Thêm mới
                          </button>
                        </div>

                        {listAddress?.length == 0 ? (
                          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                            <MapPin size={32} className="mx-auto mb-2 opacity-30 text-primary animate-bounce" />
                            <p className="text-sm">Chưa có địa chỉ nào được lưu.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {listAddress.map((addr: CustomerAddress, i: number) => (
                              <div
                                key={i}
                                className={`p-4 rounded-xl border transition-all ${
                                  addr.isDefault
                                    ? "border-primary bg-primary/[0.02] shadow-sm shadow-primary/5"
                                    : "border-border hover:border-primary/30"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">{addr.name}</span>
                                    {addr.isDefault && (
                                      <span className="px-2 py-0.5 text-[9px] bg-green-500/10 text-green-600  rounded-full border border-green-500/20">
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditAddress(addr)}
                                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                      title="Sửa địa chỉ"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAddress(addr)}
                                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                      title="Xóa địa chỉ"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                  SĐT nhận hàng: <span className="text-foreground">{addr.phone}</span>
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  Địa chỉ: <span className="text-foreground">{addr.address}</span>
                                </p>

                                {!addr.isDefault && (
                                  <button
                                    onClick={() => {
                                      handleSetDefaultAddress(addr);
                                    }}
                                    className="mt-3 text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    Đặt làm mặc định
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Tên <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formAddressName}
                            onChange={e => setFormAddressName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Số điện thoại nhận hàng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formAddressPhone}
                            onChange={e => setFormAddressPhone(e.target.value)}
                            placeholder="Nhập số điện thoại người nhận"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Địa chỉ giao hàng <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={formAddressText}
                            onChange={e => setFormAddressText(e.target.value)}
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="isDefaultCheckbox"
                            checked={formAddressIsDefault}
                            onChange={e => setFormAddressIsDefault(e.target.checked)}
                            // disabled={editingAddressIndex !== null && customerLoyalty?.listAddress[editingAddressIndex]?.isDefault}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
                          />
                          <label htmlFor="isDefaultCheckbox" className="text-xs text-foreground cursor-pointer select-none">
                            Đặt làm địa chỉ giao hàng mặc định
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5 border-t border-border bg-muted/10 flex items-center justify-end gap-3">
                    {addressFormState === "list" ? (
                      <button
                        onClick={() => setShowAddressesModal(false)}
                        className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm font-semibold transition-colors w-full sm:w-auto text-center cursor-pointer"
                      >
                        Đóng
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setAddressFormState("list")}
                          className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm font-semibold transition-colors cursor-pointer"
                        >
                          Quay lại
                        </button>
                        <button
                          onClick={() => {
                            addressFormState == "add" ? handleAddAddress() : handleEditAddress(editAddress);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 text-sm transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                        >
                          Lưu địa chỉ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-foreground flex items-center gap-2 mb-4">
                  <Lock size={18} className="text-primary" /> Đổi mật khẩu
                </h3>

                <form onSubmit={handleChangePwd} className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={oldPwd}
                      onChange={e => setOldPwd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary"
                    />
                  </div>
                  {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPwdError("");
                        setOldPwd("");
                        setNewPwd("");
                        setConfirmPwd("");
                      }}
                      className="flex-1 py-2 rounded-xl border border-border text-foreground hover:bg-muted text-sm"
                    >
                      Hủy
                    </button>
                    <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm">
                      Cập nhật
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-foreground mb-3">Tùy chọn khác</h3>
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() => {
                      setAddressFormState("list");
                      setShowAddressesModal(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground"
                  >
                    Địa chỉ đã lưu
                  </button>
                  {/* <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                    Phương thức thanh toán
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground">Thông báo</button> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Toaster position="top-right" richColors />
    </div>
  );
}
