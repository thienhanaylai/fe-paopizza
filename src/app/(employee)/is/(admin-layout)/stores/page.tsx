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
} from "lucide-react";
import { createStore, getAllStore, StoreData1 } from "@/src/services/store.service";
import { getEmployeeByRole } from "@/src/services/employee.service";
import { toast, Toaster } from "sonner";

// interface StoreData {
//   _id: string;
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   manager: string;
//   manager_id: string;
//   staffCount: number;
//   status: "active" | "inactive" | "maintenance";
//   openTime: string;
//   closeTime: string;
//   monthlyRevenue: number;
//   monthlyOrders: number;
//   revenueChange: number;
//   createdAt: string;
// }

// const listStore: StoreData[] = [
//   {
//     _id: "store-1",
//     name: "Chi nhánh Quận 1",
//     address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
//     phone: "028 1234 5678",
//     email: "q1@paopizza.com",
//     manager: "Nguyễn Văn A",
//     manager_id: "2",
//     staffCount: 18,
//     status: "active",
//     openTime: "10:00",
//     closeTime: "22:00",
//     monthlyRevenue: 175000000,
//     monthlyOrders: 2340,
//     revenueChange: 12.5,
//     createdAt: "15/01/2024",
//   },
//   {
//     _id: "store-2",
//     name: "Chi nhánh Quận 7",
//     address: "456 Nguyễn Thị Thập, Quận 7, TP.HCM",
//     phone: "028 2345 6789",
//     email: "q7@paopizza.com",
//     manager: "Trần Minh B",
//     manager_id: "5",
//     staffCount: 14,
//     status: "active",
//     openTime: "10:00",
//     closeTime: "22:00",
//     monthlyRevenue: 130000000,
//     monthlyOrders: 1780,
//     revenueChange: 8.3,
//     createdAt: "20/03/2024",
//   },
//   {
//     _id: "store-3",
//     name: "Chi nhánh Thủ Đức",
//     address: "789 Võ Văn Ngân, Thủ Đức, TP.HCM",
//     phone: "028 3456 7890",
//     email: "td@paopizza.com",
//     manager: "Lê Thị C",
//     manager_id: "8",
//     staffCount: 12,
//     status: "active",
//     openTime: "10:00",
//     closeTime: "22:00",
//     monthlyRevenue: 110000000,
//     monthlyOrders: 1520,
//     revenueChange: -2.1,
//     createdAt: "10/06/2024",
//   },
//   {
//     _id: "store-4",
//     name: "Chi nhánh Bình Thạnh",
//     address: "321 Điện Biên Phủ, Bình Thạnh, TP.HCM",
//     phone: "028 4567 8901",
//     email: "bt@paopizza.com",
//     manager: "Phạm Quốc D",
//     manager_id: "11",
//     staffCount: 10,
//     status: "maintenance",
//     openTime: "10:00",
//     closeTime: "22:00",
//     monthlyRevenue: 0,
//     monthlyOrders: 0,
//     revenueChange: 0,
//     createdAt: "01/02/2026",
//   },
// ];

const statusConfig = {
  active: { label: "Hoạt động", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
  close: { label: "Tạm đóng", color: "bg-red-100 text-red-700", icon: <XCircle size={14} /> },
  maintenance: { label: "Đang sửa chữa", color: "bg-yellow-100 text-yellow-700", icon: <Settings size={14} /> },
};

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function Stores() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "close" | "maintenance">("all");
  const [selectedStore, setSelectedStore] = useState<StoreData1 | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [listStore, setListStore] = useState<StoreData1[]>();
  const [listManager, setListManager] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameStore, setNameStore] = useState("");
  const [addressStore, setAddressStore] = useState("");
  const [phoneStore, setPhoneStore] = useState("");
  const [emailStore, setEmailStore] = useState("");
  const [timeOpenStore, setTimeOpenStore] = useState("10:00");
  const [timeCloseStore, setTimeCloseStore] = useState("22:00");
  const [managerStore, setManagerStore] = useState("");

  useEffect(() => {
    const fecthdata = async () => {
      const res = await getAllStore();
      const listManager = await getEmployeeByRole("manager");

      setListManager(listManager);
      setListStore(res);
    };
    fecthdata();
  }, []);

  const clearFrom = () => {
    setNameStore("");
    setAddressStore("");
    setPhoneStore("");
    setEmailStore("");
    setTimeOpenStore("10:00");
    setTimeCloseStore("22:00");
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (
        nameStore === "" ||
        addressStore === "" ||
        phoneStore === "" ||
        emailStore === "" ||
        timeOpenStore === "" ||
        timeCloseStore === ""
      ) {
        toast.warning("Vui lòng nhập đầy đủ thông tin !");
        setIsLoading(false);
        return;
      }
      const res = await createStore({
        name: nameStore,
        address: addressStore,
        phone: phoneStore,
        email: emailStore,
        time_open: timeOpenStore,
        time_close: timeCloseStore,
        manager_by: managerStore,
      });

      if (res) {
        toast.success("Thêm mới cửa hàng thành công!");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(`Lỗi: ${error}`);
      setIsLoading(false);
    }
  };

  // || s.manager.toLowerCase().includes(search.toLowerCase());
  const filtered = listStore?.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = 0; //listStore?.filter(s => s.status === "active").reduce((a, b) => a + b.monthlyRevenue, 0);
  const totalOrders = 0; //listStore?.filter(s => s.status === "active").reduce((a, b) => a + b.monthlyOrders, 0);
  const totalStaff = 0; //listStore?.reduce((a, b) => a + b.staffCount, 0);
  const activeStores = listStore?.filter(s => s.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-2">
            <Store size={24} className="text-primary" /> Quản lý cửa hàng
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý toàn bộ hệ thống chi nhánh PaoPizza</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus size={16} /> Thêm cửa hàng
        </button>
      </div>

      {/* Stats */}
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
            value: totalOrders.toLocaleString(),
            sub: "Các CN hoạt động",
            icon: <ShoppingCart size={20} />,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Tổng nhân sự",
            value: totalStaff.toString(),
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

      {/* Filters */}
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

      {/* Store cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered?.map(store => {
          const st = statusConfig[store.status];
          return (
            <div
              key={store._id}
              className="bg-card rounded-2xl border border-border hover:shadow-md transition-all overflow-h_idden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store size={22} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-foreground">{store.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedStore(store)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{store.address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} /> {store.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {store.time_open} - {store.time_close}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={14} className="shrink-0" />
                    <span>
                      Quản lý: <span className="text-foreground">{store.manager_by?.name}</span> • {0} nhân viên
                    </span>
                  </div>
                </div>

                {store.status === "active" && (
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Doanh thu tháng</p>
                      <p className="text-sm text-foreground mt-0.5">{formatVND(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Đơn hàng</p>
                      <p className="text-sm text-foreground mt-0.5">{0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tăng trưởng</p>
                      <p className={`text-sm mt-0.5 flex items-center gap-1 ${0 >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <TrendingUp size={12} /> {0 > 0 ? "+" : ""}
                        {0}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Store size={48} className="mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy cửa hàng nào</p>
        </div>
      )}

      {selectedStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedStore(null)}
        >
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
              {/* Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <MapPin size={16} />, label: "Địa chỉ", value: selectedStore.address },
                  { icon: <Phone size={16} />, label: "Điện thoại", value: selectedStore.phone },
                  { icon: <Mail size={16} />, label: "Email", value: selectedStore.email },
                  {
                    icon: <Clock size={16} />,
                    label: "Giờ mở cửa",
                    value: `${selectedStore.time_open} - ${selectedStore.time_close}`,
                  },
                  { icon: <Users size={16} />, label: "Quản lý", value: selectedStore.manager_by?.name },
                  { icon: <Users size={16} />, label: "Số nhân viên", value: `${0} người` },
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

              {/* Revenue stats */}
              {selectedStore.status === "active" && (
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
              )}

              <div className="text-xs text-muted-foreground">Ngày tạo: {selectedStore.createdAt}</div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-border">
              <button className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2">
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

      {/* Add store modal */}
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
                <Store size={20} className="text-primary" /> Thêm cửa hàng mới
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
                  onChange={e => setNameStore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Địa chỉ</label>
                <input
                  type="text"
                  placeholder={"42 Hưng Gia 1, P. Phú Mỹ, HCM"}
                  onChange={e => setAddressStore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Số điện thoại</label>
                <input
                  type="text"
                  placeholder={"0917580860"}
                  onChange={e => setPhoneStore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  placeholder={"pmh@paopizza.com"}
                  onChange={e => setEmailStore(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                />
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
                  defaultValue={""}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
                >
                  <option value="null">Chọn cửa hàng trưởng</option>
                  {listManager?.map(item => (
                    <>
                      <option value={item.ref_id._id}>{item.ref_id.name}</option>
                    </>
                  ))}
                </select>
              </div>
            </div>
            <div className={`flex  gap-3 p-6 border-t border-border`}>
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
                {isLoading ? <LoaderCircle className="animate-spin" size={18} /> : "Thêm cửa hàng"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster
        toastOptions={{
          classNames: {
            success: "bg-green-500! text-white! border-green-600!",
            error: "bg-red-500! text-white! border-red-600!",
            warning: "bg-yellow-500! text-white! border-yellow-600!",
            toast: "bg-gray-800! text-white!",
          },
        }}
      />
    </div>
  );
}
