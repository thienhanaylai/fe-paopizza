"use client";
import { useState, useEffect, useRef } from "react";
import {
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
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import { useCustomerAuth } from "@/src/context/authCustomerContext";
import { getAllOrder, OrderHistory } from "@/src/services/order.service";
import Link from "next/link";
import { formatDateTime } from "@/src/utils/formatDateTime";
import { toast, Toaster } from "sonner";
import OrderDetailModal from "@/src/components/modals/OrderDetailModal";
import {
  addCustomerAddress,
  AddCustomerAddressPayload,
  changePassword,
  CustomerAddress,
  deleteCustomerAddress,
  DeleteCustomerAddressPayload,
  getCustomerAddresses,
  setDefaultAddress,
  updateCustomer,
  updateCustomerAddress,
  UpdateCustomerAddressPayload,
} from "@/src/services/customer.service";
import { autocomplete } from "@/src/services/map.service";

type AddressFieldErrors = Partial<Record<"name" | "phone" | "address", string>>;
type AddressSuggestion = { place_id: string; description: string };

const PHONE_REGEX = /^(?:0|84|\+84)[35789]\d{8}$/;
const AUTOCOMPLETE_DEBOUNCE_MS = 600;
const AUTOCOMPLETE_CACHE_LIMIT = 50;

const normalizePhone = (value: string) => value.replace(/[\s.-]/g, "");

const getAddressNameError = (value: string) => {
  if (!value.trim()) return "Vui lòng nhập tên người nhận";
  if (/\d/.test(value)) return "Tên người nhận không được chứa số";
  return "";
};

const getAddressPhoneError = (value: string) => {
  if (!value.trim()) return "Vui lòng nhập số điện thoại người nhận";
  if (!PHONE_REGEX.test(normalizePhone(value))) return "Số điện thoại không đúng định dạng Việt Nam";
  return "";
};

const getAddressTextError = (value: string) => (value.trim() ? "" : "Vui lòng nhập địa chỉ giao hàng");

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

function getCustomerUpdateErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const errorMessages: Record<string, string> = {
    PHONE_ALREADY_EXISTS: "Số điện thoại này đã được sử dụng bởi tài khoản khác.",
    EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng bởi tài khoản khác.",
  };

  return errorMessages[message] || message || "Lỗi khi cập nhật thông tin";
}

function getAddressActionErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  const errorMessages: Record<string, string> = {
    ADDRESS_NOT_FOUND: "Không tìm thấy địa chỉ này. Vui lòng tải lại danh sách.",
    CUSTOMER_NOT_FOUND: "Không tìm thấy thông tin khách hàng.",
  };

  return errorMessages[message] || message || fallback;
}

export default function Profile() {
  const { user, getInfo } = useCustomerAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Đồng bộ local state khi user thay đổi (sau khi getInfo cập nhật context)
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setAddress(user.address || "");
      setBirthday(user.birthday || "");
    }
  }, [user]);

  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [addressFormState, setAddressFormState] = useState<"list" | "add" | "edit">("list");
  const [formAddressName, setFormAddressName] = useState("");
  const [formAddressPhone, setFormAddressPhone] = useState("");
  const [formAddressText, setFormAddressText] = useState("");
  const [formAddressIsDefault, setFormAddressIsDefault] = useState(false);
  const [listAddress, setListAddress] = useState([]);
  const [editAddress, setEditAddress] = useState<CustomerAddress>();
  const [addressFieldErrors, setAddressFieldErrors] = useState<AddressFieldErrors>({});
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressSessionTokenRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  );
  const addressAutocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressAutocompleteCacheRef = useRef(new Map<string, AddressSuggestion[]>());
  const addressAutocompleteQueryRef = useRef("");

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");

  const [ordersHistory, setOrderHistory] = useState<OrderHistory[]>();
  const [detailOrder, setDetailOrder] = useState<OrderHistory | null>(null);

  const setAddressFieldError = (field: keyof AddressFieldErrors, message: string) => {
    setAddressFieldErrors(previous => ({ ...previous, [field]: message }));
  };

  const validateAddressForm = () => {
    const errors: AddressFieldErrors = {
      name: getAddressNameError(formAddressName),
      phone: getAddressPhoneError(formAddressPhone),
      address: getAddressTextError(formAddressText),
    };
    const activeErrors = Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
    setAddressFieldErrors(activeErrors);
    return Object.keys(activeErrors).length === 0;
  };

  const resetAddressSuggestions = () => {
    addressAutocompleteQueryRef.current = "";
    if (addressAutocompleteTimerRef.current) {
      clearTimeout(addressAutocompleteTimerRef.current);
      addressAutocompleteTimerRef.current = null;
    }
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setAddressSuggestionsLoading(false);
  };

  const handleAddressTextInput = (value: string) => {
    setFormAddressText(value);
    if (addressFieldErrors.address) setAddressFieldError("address", getAddressTextError(value));

    const query = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
    addressAutocompleteQueryRef.current = query;

    if (addressAutocompleteTimerRef.current) clearTimeout(addressAutocompleteTimerRef.current);

    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      setAddressSuggestionsLoading(false);
      return;
    }

    const cachedSuggestions = addressAutocompleteCacheRef.current.get(query);
    if (cachedSuggestions !== undefined) {
      setAddressSuggestions(cachedSuggestions);
      setShowAddressSuggestions(cachedSuggestions.length > 0);
      setAddressSuggestionsLoading(false);
      return;
    }

    setShowAddressSuggestions(true);
    addressAutocompleteTimerRef.current = setTimeout(async () => {
      if (addressAutocompleteQueryRef.current !== query) return;

      setAddressSuggestionsLoading(true);
      try {
        const result = await autocomplete({
          input: value.trim(),
          sessiontoken: addressSessionTokenRef.current,
          limit: 6,
        });
        if (addressAutocompleteQueryRef.current !== query) return;

        const predictions = (result.predictions || []) as AddressSuggestion[];
        const cache = addressAutocompleteCacheRef.current;
        if (cache.size >= AUTOCOMPLETE_CACHE_LIMIT) {
          cache.delete(cache.keys().next().value as string);
        }
        cache.set(query, predictions);
        setAddressSuggestions(predictions);
        setShowAddressSuggestions(predictions.length > 0);
      } catch {
        if (addressAutocompleteQueryRef.current === query) {
          setAddressSuggestions([]);
          setShowAddressSuggestions(false);
        }
      } finally {
        if (addressAutocompleteQueryRef.current === query) setAddressSuggestionsLoading(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  const handleSelectAddressSuggestion = (description: string) => {
    setFormAddressText(description);
    setAddressFieldError("address", "");
    resetAddressSuggestions();
    addressSessionTokenRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  };

  const fecthData = async () => {
    const customer = await getInfo();
    const res = await getAllOrder(`customer_id=${customer.ref_id?._id}`, "customer");
    const listAddress = await getCustomerAddresses(customer._id, "customer");
    setListAddress(listAddress);
    setOrderHistory(res.data);
  };
  useEffect(() => {
    fecthData();
  }, []);

  useEffect(
    () => () => {
      if (addressAutocompleteTimerRef.current) clearTimeout(addressAutocompleteTimerRef.current);
    },
    [],
  );

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
    setAddressFieldErrors({});
    resetAddressSuggestions();
    setAddressFormState("add");
  };

  const handleOpenEditAddress = async (addr: CustomerAddress) => {
    setFormAddressName(addr.name || "");
    setFormAddressPhone(addr.phone || "");
    setFormAddressText(addr.address || "");
    setFormAddressIsDefault(addr.isDefault || false);
    setEditAddress(addr);
    setAddressFieldErrors({});
    resetAddressSuggestions();
    setAddressFormState("edit");
  };

  const handleDeleteAddress = async (addr: CustomerAddress) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa địa chỉ này không?");
    if (!confirmed) return;

    const payload: DeleteCustomerAddressPayload = {
      user_id: user.id,
      address_id: addr?._id || "",
    };

    try {
      const res = await deleteCustomerAddress(payload, "customer");
      if (res) {
        await fecthData();
        toast.success(res.message);
        setAddressFormState("list");
      }
    } catch (error) {
      toast.error(getAddressActionErrorMessage(error, "Không thể xóa địa chỉ. Vui lòng thử lại."));
    }
  };

  const handleAddAddress = async () => {
    if (!validateAddressForm()) return;

    const payload: AddCustomerAddressPayload = {
      user_id: user.id,
      name: formAddressName.trim(),
      address: formAddressText.trim(),
      phone: normalizePhone(formAddressPhone),
      isDefault: formAddressIsDefault,
    };
    try {
      const res = await addCustomerAddress(payload, "customer");
      if (res) {
        await fecthData();
        toast.success(res.message);
        setAddressFormState("list");
      }
    } catch (error) {
      toast.error(getAddressActionErrorMessage(error, "Không thể thêm địa chỉ. Vui lòng thử lại."));
    }
  };

  const handleSetDefaultAddress = async (addr: CustomerAddress | undefined) => {
    const payload: UpdateCustomerAddressPayload = {
      user_id: user.id,
      address_id: addr?._id || "",
    };

    try {
      const res = await setDefaultAddress(payload, "customer");

      if (res) {
        await fecthData();
        toast.success(res.message);
        setAddressFormState("list");
      }
    } catch (error) {
      toast.error(getAddressActionErrorMessage(error, "Không thể đặt địa chỉ mặc định. Vui lòng thử lại."));
    }
  };

  const handleEditAddress = async (addr: CustomerAddress | undefined) => {
    if (!validateAddressForm()) return;

    const payload: UpdateCustomerAddressPayload = {
      user_id: user.id,
      address_id: addr?._id || "",
      name: formAddressName.trim(),
      address: formAddressText.trim(),
      phone: normalizePhone(formAddressPhone),
      isDefault: formAddressIsDefault,
    };

    try {
      const res = await updateCustomerAddress(payload, "customer");

      if (res) {
        await fecthData();
        toast.success(res.message);
        setAddressFormState("list");
      }
    } catch (error) {
      toast.error(getAddressActionErrorMessage(error, "Không thể cập nhật địa chỉ. Vui lòng thử lại."));
    }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
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
    try {
      const res = await changePassword(oldPwd, newPwd, "customer");
      if (res) {
        setOldPwd("");
        setNewPwd("");
        setConfirmPwd("");
        showSaved(res.message || "Đã đổi mật khẩu thành công!");
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      setPwdError(error?.data?.message || "Lỗi khi đổi mật khẩu");
    }
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
                      onClick={async () => {
                        try {
                          await updateCustomer({
                            user_id: user.id,
                            name,
                            phone,
                            email,
                            address,
                            birthday: birthday || undefined,
                          });

                          await getInfo();
                          setEditing(false);
                          showSaved("Đã lưu thông tin");
                        } catch (updateError) {
                          toast.error(getCustomerUpdateErrorMessage(updateError));
                        }
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
                        type="email"
                        value={email || ""}
                        onChange={e => setEmail(e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-muted-foreground outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Số điện thoại</label>
                      <input
                        value={phone || ""}
                        onChange={e => setPhone(e.target.value)}
                        disabled={!editing}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm focus:border-primary disabled:bg-muted/40 disabled:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Ngày sinh</label>
                      <input
                        type="date"
                        value={birthday ? new Date(birthday).toISOString().split("T")[0] : ""}
                        onChange={e => setBirthday(e.target.value)}
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
                          onClick={() => setDetailOrder(order)}
                          className="border cursor-pointer border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDetailOrder(order)}
                                className="text-xs text-primary hover:underline font-medium"
                              >
                                Chi tiết
                              </button>
                              <span className="text-primary text-sm">{formatVND(order.total)}</span>
                            </div>
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0 animate-in fade-in duration-200"
                onClick={() => setShowAddressesModal(false)}
              >
                <div
                  className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-border flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
                  onClick={e => e.stopPropagation()}
                >
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
                            onChange={e => {
                              const value = e.target.value;
                              setFormAddressName(value);
                              if (addressFieldErrors.name) setAddressFieldError("name", getAddressNameError(value));
                            }}
                            onBlur={() => setAddressFieldError("name", getAddressNameError(formAddressName))}
                            placeholder="Nguyễn Văn A"
                            aria-invalid={!!addressFieldErrors.name}
                            className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors ${
                              addressFieldErrors.name
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                            }`}
                          />
                          {addressFieldErrors.name && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle size={12} /> {addressFieldErrors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Số điện thoại nhận hàng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            inputMode="tel"
                            value={formAddressPhone}
                            onChange={e => {
                              const value = e.target.value;
                              setFormAddressPhone(value);
                              if (addressFieldErrors.phone) setAddressFieldError("phone", getAddressPhoneError(value));
                            }}
                            onBlur={() => setAddressFieldError("phone", getAddressPhoneError(formAddressPhone))}
                            placeholder="Nhập số điện thoại người nhận"
                            aria-invalid={!!addressFieldErrors.phone}
                            className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors ${
                              addressFieldErrors.phone
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                            }`}
                          />
                          {addressFieldErrors.phone && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle size={12} /> {addressFieldErrors.phone}
                            </p>
                          )}
                        </div>
                        <div className="relative">
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            Địa chỉ giao hàng <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <textarea
                              value={formAddressText}
                              onChange={e => handleAddressTextInput(e.target.value)}
                              onFocus={() => {
                                if (addressSuggestions.length > 0 || addressSuggestionsLoading) {
                                  setShowAddressSuggestions(true);
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => setShowAddressSuggestions(false), 350);
                                setAddressFieldError("address", getAddressTextError(formAddressText));
                              }}
                              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                              rows={3}
                              autoComplete="off"
                              aria-invalid={!!addressFieldErrors.address}
                              className={`w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none transition-colors ${
                                addressFieldErrors.address
                                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                  : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                              }`}
                            />
                            {addressSuggestionsLoading && (
                              <LoaderCircle
                                size={16}
                                className="absolute right-3 top-3 animate-spin text-muted-foreground"
                              />
                            )}
                          </div>
                          {addressFieldErrors.address && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle size={12} /> {addressFieldErrors.address}
                            </p>
                          )}
                          {showAddressSuggestions && (addressSuggestionsLoading || addressSuggestions.length > 0) && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
                              {addressSuggestionsLoading && addressSuggestions.length === 0 && (
                                <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                                  <LoaderCircle size={13} className="animate-spin" /> Đang tìm địa chỉ...
                                </div>
                              )}
                              {addressSuggestions.map(suggestion => (
                                <button
                                  key={suggestion.place_id}
                                  type="button"
                                  onMouseDown={event => event.preventDefault()}
                                  onClick={() => handleSelectAddressSuggestion(suggestion.description)}
                                  className="flex w-full items-start gap-2.5 border-b border-border/50 px-4 py-3 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-muted"
                                >
                                  <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                                  <span>{suggestion.description}</span>
                                </button>
                              ))}
                            </div>
                          )}
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
      {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
    </div>
  );
}
