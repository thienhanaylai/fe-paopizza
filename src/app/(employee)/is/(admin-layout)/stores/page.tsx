"use client";
import { useEffect, useState } from "react";
import {
  Store,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Users,
  Clock,
  Edit2,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Settings,
  LoaderCircle,
  Square,
  SquareCheckBig,
  Trash2,
} from "lucide-react";
import { createStore, getAllStore, StoreAddress, StoreData, updateStore } from "@/src/services/store.service";
import { getEmployeeByRole } from "@/src/services/employee.service";
import { toast, Toaster } from "sonner";
import { getRevenue } from "@/src/services/revenue.service";
import { formatVND } from "@/src/utils/formatVND";

const statusConfig = {
  active: { label: "Hoạt động", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
  close: { label: "Tạm đóng", color: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
  maintenance: { label: "Đang sửa chữa", color: "bg-yellow-100 text-yellow-700", icon: <Settings size={14} /> },
};

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

function formatAddress(addr: StoreData["address"] | string): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  return [addr.streetNumber, addr.district, addr.city].filter(Boolean).join(", ");
}

export default function Stores() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "close" | "maintenance">("all");
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [listStore, setListStore] = useState<StoreData[]>();
  const [listManager, setListManager] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nameStore, setNameStore] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [phoneStore, setPhoneStore] = useState("");
  const [emailStore, setEmailStore] = useState("");
  const [timeOpenStore, setTimeOpenStore] = useState("10:00");
  const [timeCloseStore, setTimeCloseStore] = useState("22:00");
  const [managerStore, setManagerStore] = useState("");
  const [statusStore, setStatusStore] = useState<StoreData["status"]>("active");
  const [revenue, setRevenue] = useState();

  const managerOptions = (listManager as any[])
    .map(item => ({
      id: item?.ref_id?._id || item?._id || "",
      name: item?.ref_id?.name || item?.name || "",
    }))
    .filter(option => option.id && option.name);

  const selectedManagerOption = editingStore?.manager_by
    ? { id: editingStore.manager_by._id, name: editingStore.manager_by.name }
    : null;

  const mergedManagerOptions =
    selectedManagerOption && !managerOptions.some(option => option.id === selectedManagerOption.id)
      ? [selectedManagerOption, ...managerOptions]
      : managerOptions;

  const fecthdata = async () => {
    const res = await getAllStore();
    const listManager = await getEmployeeByRole("manager");

    const totalRev = await getRevenue(getMonthRange().start, getMonthRange().end, "", "", "", "");

    setRevenue(totalRev);
    setListManager(listManager);
    setListStore(res);
  };
  useEffect(() => {
    fecthdata();
  }, []);

  const clearFrom = () => {
    setNameStore("");
    setStreetNumber("");
    setDistrict("");
    setCity("");
    setLatitude("");
    setLongitude("");
    setPhoneStore("");
    setEmailStore("");
    setTimeOpenStore("10:00");
    setTimeCloseStore("22:00");
    setManagerStore("");
    setStatusStore("active");
    setEditingStore(null);
    setShowForm(false);
    setIsLoading(false);
  };

  const openEditForm = (store: StoreData) => {
    setEditingStore(store);
    setNameStore(store.name || "");
    setStreetNumber(typeof store.address === "string" ? "" : store.address?.streetNumber || "");
    setDistrict(typeof store.address === "string" ? "" : store.address?.district || "");
    setCity(typeof store.address === "string" ? "" : store.address?.city || "");
    setLatitude(store.location?.coordinates?.[1]?.toString() || "");
    setLongitude(store.location?.coordinates?.[0]?.toString() || "");
    setPhoneStore(store.phone || "");
    setEmailStore(store.email || "");
    setTimeOpenStore(store.time_open || "10:00");
    setTimeCloseStore(store.time_close || "22:00");
    setManagerStore(store.manager_by?._id || "");
    setStatusStore(store.status || "active");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (
        nameStore === "" ||
        streetNumber === "" ||
        district === "" ||
        city === "" ||
        phoneStore === "" ||
        emailStore === "" ||
        timeOpenStore === "" ||
        timeCloseStore === ""
      ) {
        toast.warning("Vui lòng nhập đầy đủ thông tin !");
        setIsLoading(false);

        return;
      }

      const addressPayload: StoreAddress = {
        streetNumber,
        district,
        city,
      };

      const locationPayload =
        latitude && longitude
          ? { type: "Point" as const, coordinates: [parseFloat(longitude), parseFloat(latitude)] as [number, number] }
          : undefined;

      if (editingStore) {
        const res = await updateStore({
          store_id: editingStore._id,
          name: nameStore,
          address: addressPayload,
          phone: phoneStore,
          email: emailStore,
          time_open: timeOpenStore,
          time_close: timeCloseStore,
          manager_by: managerStore,
          status: statusStore,
          location: locationPayload,
        });

        if (res) {
          toast.success("Cập nhật cửa hàng thành công!");
          fecthdata();
          clearFrom();
          setIsLoading(false);
        }
      } else {
        const res = await createStore({
          name: nameStore,
          address: addressPayload,
          phone: phoneStore,
          email: emailStore,
          time_open: timeOpenStore,
          time_close: timeCloseStore,
          manager_by: managerStore,
          location: locationPayload,
        });

        if (res) {
          toast.success("Thêm mới cửa hàng thành công!");
          fecthdata();
          clearFrom();
          setIsLoading(false);
        }
      }
    } catch (error) {
      toast.error(`Lỗi: ${error}`);
      setIsLoading(false);
    }
  };

  const filtered = listStore
    ?.sort((a, b) => a.name.localeCompare(b.name))
    .filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        formatAddress(s.address).toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || s.status === filterStatus;
      return matchSearch && matchStatus;
    });

  const isAllSelected = (filtered?.length ?? 0) > 0 && filtered!.every(s => selectedIds.has(s._id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered?.map(s => s._id) ?? []));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const totalRevenue = revenue?.metrics.total_revenue || 0;
  const totalOrders = revenue?.metrics.total_orders || 0;
  const totalStaff = listStore?.reduce((a, b) => a + b.employee_count, 0);
  const activeStores = listStore?.filter(s => s.status === "active").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-2">
            <Store size={24} className="text-primary" /> Quản lý cửa hàng
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý toàn bộ hệ thống chi nhánh PaoPizza</p>
        </div>
        <button
          onClick={() => {
            clearFrom();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus size={16} /> Thêm cửa hàng
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng cửa hàng",
            value: listStore?.length.toString(),
            sub: `${activeStores} hoạt động`,
            icon: <Store size={20} />,
            color: "bg-primary/10 text-primary",
          },
          {
            label: "Tổng doanh thu tháng",
            value: formatVND(totalRevenue),
            sub: "Các CN hoạt động",
            icon: <DollarSign size={20} />,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Tổng đơn hàng tháng",
            value: totalOrders?.toLocaleString(),
            sub: "Các CN hoạt động",
            icon: <ShoppingCart size={20} />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Tổng nhân sự",
            value: totalStaff?.toString(),
            sub: "Toàn hệ thống",
            icon: <Users size={20} />,
            color: "bg-purple-50 text-purple-600",
          },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="text-foreground text-xl mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên, địa chỉ, quản lý..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "close", "maintenance"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-sm transition-colors ${filterStatus === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}
            >
              {s === "all" ? "Tất cả" : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
              title="Bỏ chọn"
            >
              <X size={16} />
            </button>
            <span className="text-sm font-medium text-foreground">
              Đã chọn <span className="text-primary font-semibold">{selectedIds.size}</span> cửa hàng
            </span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-12 px-4 py-3.5">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isAllSelected ? (
                      <SquareCheckBig size={18} className="text-primary" />
                    ) : isIndeterminate ? (
                      <SquareCheckBig size={18} className="text-primary/60" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70">Tên cửa hàng</th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden md:table-cell">Địa chỉ</th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell">SĐT</th>
                <th className="text-left px-5 py-3.5 text-sm font-semibold text-foreground/70 hidden lg:table-cell">Quản lý</th>
                <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Trạng thái</th>
                <th className="text-center px-5 py-3.5 text-sm font-semibold text-foreground/70">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!filtered || filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                    <Store size={40} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm">Không tìm thấy cửa hàng nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map(store => {
                  const st = statusConfig[store.status];
                  const isSelected = selectedIds.has(store._id);
                  return (
                    <tr
                      key={store._id}
                      className={`border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleSelectOne(store._id)}
                          className="flex items-center justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSelected ? <SquareCheckBig size={18} className="text-primary" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Store size={18} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{store.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden mt-0.5 truncate">
                              {formatAddress(store.address)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin size={13} className="shrink-0" />
                          <span className="truncate max-w-[200px]">{formatAddress(store.address)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-foreground/80">{store.phone || "-"}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users size={13} className="text-muted-foreground shrink-0" />
                          <span className="text-foreground/80">{store.manager_by?.name || "Chưa có"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${st.color}`}>
                          {st.icon}
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedStore(store)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditForm(store)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 m-0 p-4"
          onClick={() => setSelectedStore(null)}
        >
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store size={22} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-foreground">{selectedStore.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${statusConfig[selectedStore.status].color}`}
                  >
                    {statusConfig[selectedStore.status].icon} {statusConfig[selectedStore.status].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedStore(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <MapPin size={16} />, label: "Địa chỉ", value: formatAddress(selectedStore.address) },
                  { icon: <Phone size={16} />, label: "Điện thoại", value: selectedStore.phone },
                  { icon: <Mail size={16} />, label: "Email", value: selectedStore.email },
                  {
                    icon: <Clock size={16} />,
                    label: "Giờ mở cửa",
                    value: `${selectedStore.time_open} - ${selectedStore.time_close}`,
                  },
                  { icon: <Users size={16} />, label: "Quản lý", value: selectedStore.manager_by?.name },
                  { icon: <Users size={16} />, label: "Số nhân viên", value: `${selectedStore.employee_count} người` },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm text-foreground mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* {selectedStore.status === "active" && (
                <div>
                  <h3 className="text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" /> Hiệu suất tháng này
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <p className="text-xs text-muted-foreground">Doanh thu</p>
                      <p className="text-foreground mt-1">{formatVND(0)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                      <p className="text-xs text-muted-foreground">Đơn hàng</p>
                      <p className="text-foreground mt-1">{0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                      <p className="text-xs text-muted-foreground">Tăng trưởng</p>
                      <p className={`mt-1 ${0 >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {0 > 0 ? "+" : ""}
                        {0}%
                      </p>
                    </div>
                  </div>
                </div>
              )} */}

              <div className="text-xs text-muted-foreground">Ngày tạo: {selectedStore.createdAt}</div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-border">
              <button
                onClick={() => {
                  openEditForm(selectedStore);
                  setSelectedStore(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
              <button
                onClick={() => setSelectedStore(null)}
                className="px-6 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
          onClick={() => {
            clearFrom();
            setShowForm(false);
          }}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-hide"
            onClick={e => {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-foreground flex items-center gap-2">
                <Store size={20} className="text-primary" /> {editingStore ? "Chỉnh sửa cửa hàng" : "Thêm cửa hàng mới"}
              </h2>
              <button
                onClick={() => {
                  clearFrom();
                  setShowForm(false);
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Tên cửa hàng</label>
                <input
                  type="text"
                  placeholder={"Paopizza Phú Mỹ Hưng"}
                  value={nameStore}
                  onChange={e => setNameStore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Địa chỉ</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường"
                    value={streetNumber}
                    onChange={e => setStreetNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Quận / Huyện"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Tỉnh / Thành phố"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Số điện thoại</label>
                <input
                  type="text"
                  placeholder={"0917580860"}
                  onChange={e => setPhoneStore(e.target.value)}
                  value={phoneStore}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  placeholder={"pmh@paopizza.com"}
                  onChange={e => setEmailStore(e.target.value)}
                  value={emailStore}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Vị trí (tùy chọn)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Vĩ độ (latitude)"
                    value={latitude}
                    onChange={e => setLatitude(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Kinh độ (longitude)"
                    value={longitude}
                    onChange={e => setLongitude(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">Giờ mở cửa</label>
                  <input
                    type="time"
                    value={timeOpenStore}
                    onChange={e => setTimeOpenStore(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">Giờ đóng cửa</label>
                  <input
                    type="time"
                    value={timeCloseStore}
                    onChange={e => setTimeCloseStore(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Quản lý cửa hàng</label>
                <select
                  onChange={e => setManagerStore(e.target.value)}
                  value={managerStore}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                >
                  <option value="">Chọn cửa hàng trưởng</option>
                  {mergedManagerOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              {editingStore && (
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">Trạng thái cửa hàng</label>
                  <select
                    onChange={e => setStatusStore(e.target.value as StoreData["status"])}
                    value={statusStore}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                  >
                    {(["active", "maintenance", "close"] as const).map(status => (
                      <option key={status} value={status}>
                        {statusConfig[status].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={`flex gap-3 p-6 border-t border-border`}>
              <button
                onClick={() => {
                  clearFrom();
                  setShowForm(false);
                }}
                className={`px-6 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm`}
              >
                Hủy
              </button>
              <button
                onClick={() => handleSubmit()}
                className={`flex justify-center flex-1 py-2.5 rounded-xl  text-white ${isLoading ? "bg-primary/60" : "bg-primary hover:bg-primary/90"} transition-colors text-sm`}
              >
                {isLoading ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : editingStore ? (
                  "Cập nhật cửa hàng"
                ) : (
                  "Thêm cửa hàng"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
