"use client";
import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCircle,
  Phone,
  Mail,
  MoreVertical,
  Lock,
  Unlock,
} from "lucide-react";
import {
  EmployeeRole,
  getRoleLabel,
  getRoleColor,
  EmployeeLevel,
  EmployeeStation,
  getLevelLabel,
  getLevelColor,
  getStationLabel,
  getStationColor,
} from "@/src/context/authEmployeeContext";
import { createUser, getAllUser, User } from "@/src/services/user.service";
import { getAllStore } from "@/src/services/store.service";
type UserRole = "admin" | "manager" | "staff";

const statusConfig: Record<boolean, { label: string; color: string }> = {
  true: { label: "Hoạt động", color: "bg-green-100 text-green-700" },
  false: { label: "Bị khóa", color: "bg-red-100 text-red-600" },
};

const avatarColors = [
  "bg-primary",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
];

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole | null>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | boolean>("all");
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<User | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [listUser, setListUser] = useState<User[]>();
  const [listStore, setListStore] = useState([]);

  const [formData, setFormData] = useState({
    role: "staff",
    name: "",
    email: "",
    phone: "",
    address: "",
    birthday: "",
    station: "",
    salary: 0,
    salary_type: "",
    store_id: "",
    username: "",
    password: "",
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fecthData = async () => {
      const res = await getAllUser();
      const res2 = await getAllStore();
      setListStore(res2);
      setListUser(res);
    };
    fecthData();
  }, []);
  const handleSubmit = async () => {
    try {
      await createUser(formData);
    } catch (error) {
      console.log(error);
    }
  };
  const filtered = listUser?.filter(
    a =>
      (roleFilter === "all" || a.role === roleFilter) &&
      (statusFilter === "all" || a.status === statusFilter) &&
      (a.ref_id.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.ref_id.email?.toLowerCase().includes(search.toLowerCase())),
  );

  const counts = {
    total: listUser?.length,
    admin: listUser?.filter(a => a.role === "admin").length,
    staff: listUser?.filter(a => a.role === "staff" || a.role === "manager").length,
    customer: listUser?.filter(a => a.role === null).length,
    locked: listUser?.filter(a => a.status === false).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý tài khoản</h1>
          <p className="text-muted-foreground mt-1">Quản lý tài khoản người dùng và phân quyền hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditAccount(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <UserPlus size={18} /> Tạo tài khoản
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tổng</p>
            <p className="text-foreground text-xl">{counts.total}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Nhân viên</p>
            <p className="text-foreground text-xl">{counts.staff}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <UserCircle size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Khách hàng</p>
            <p className="text-foreground text-xl">{counts.customer}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Bị khóa</p>
            <p className="text-foreground text-xl">{counts.locked}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
            <Shield size={16} className="text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={e => {
                if (e.target.value === "null") setRoleFilter(null);
                else setRoleFilter(e.target.value as any);
              }}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="manager">Quản lý</option>
              <option value="staff">Nhân viên</option>
              <option value="null">Khách hàng</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={e => {
                if (e.target.value === "all") {
                  setStatusFilter("all");
                  return;
                }
                if (e.target.value === "true") setStatusFilter(true);
                else setStatusFilter(false);
              }}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-left">
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3 hidden md:table-cell">Level / Station</th>
                <th className="px-4 py-3 hidden lg:table-cell">Liên hệ</th>
                <th className="px-4 py-3">Trạng thái</th>
                {/* <th className="px-4 py-3 hidden lg:table-cell">Lần đăng nhập cuối</th> */}
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((account, i) => {
                const st = statusConfig[account.status];
                return (
                  <tr key={account._id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs`}
                        >
                          {account.ref_id.name
                            .split(" ")
                            .map(w => w[0])
                            .slice(-2)
                            .join("")}
                        </div>
                        <div>
                          <p className="text-foreground">{account.ref_id.name}</p>
                          <p className="text-xs text-muted-foreground">{account.ref_id.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {account.role ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRoleColor(account.role)}`}
                        >
                          {getRoleLabel(account.role)}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRoleColor(account.role)}`}
                        >
                          Khách hàng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {account.ref_id.station ? (
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStationColor(account.ref_id.station)}`}>
                            {getStationLabel(account.ref_id.station)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Phone size={12} /> {account.ref_id.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] ${st.color}`}>{st.label}</span>
                    </td>
                    {/* <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{account.lastLogin}</td> */}
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenu(actionMenu === account._id ? null : account._id)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenu === account._id && (
                          <div className="absolute right-0 mt-1 w-44 bg-card rounded-xl border border-border shadow-xl z-10 py-1">
                            <button
                              onClick={() => {
                                setEditAccount(account);
                                setShowModal(true);
                                setActionMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit2 size={14} /> Chỉnh sửa
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                              {account.status === false ? (
                                <>
                                  <Unlock size={14} /> Mở khóa
                                </>
                              ) : (
                                <>
                                  <Lock size={14} /> Khóa tài khoản
                                </>
                              )}
                            </button>
                            {account.role !== "admin" && (
                              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 size={14} /> Xóa tài khoản
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editAccount ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Họ tên *</label>
                <input
                  defaultValue={editAccount?.ref_id.name}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ tên"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Email *</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    defaultValue={editAccount?.ref_id.email}
                    placeholder="email@paopizza.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    Số điện thoại * {formData.role === "customer" ? "(Dùng để đăng nhập)" : ""}
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    defaultValue={editAccount?.ref_id.phone}
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Địa chỉ *</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  defaultValue={editAccount?.ref_id.address}
                  type="text"
                  placeholder="43 Pham nhu tang, p4, q8, HCM"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Ngày sinh *</label>
                <input
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  defaultValue={editAccount?.ref_id.address}
                  type="date"
                  placeholder="43 Pham nhu tang, p4, q8, HCM"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Vai trò *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="store_manager">Quản lý cửa hàng</option>
                  <option value="staff">Nhân viên</option>
                  <option value="customer">Khách hàng</option>
                </select>
              </div>
              {(formData.role === "staff" || formData.role === "store_manager" || formData.role === "admin") && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Loại nhân viên</label>
                      <select
                        name="salary_type"
                        value={formData.salary_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                      >
                        <option value="monthly">Fulltime</option>
                        <option value="hourly">Partime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Mức lương</label>
                      <input
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        type="number"
                        placeholder="Mức lương"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Station</label>
                      <select
                        name="station"
                        value={formData.station}
                        onChange={handleChange}
                        defaultValue={editAccount?.ref_id.station || "cashier"}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                      >
                        <option value="kitchen">Bếp</option>
                        <option value="cashier">Cashier</option>
                        <option value="delivery">Delivery</option>
                        <option value="barista">Barista</option>
                        <option value="manager">Quản lý</option>
                        <option value="store_manager">Cừa hàng trưởng</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Cửa hàng làm việc</label>
                    <select
                      name="store_id"
                      value={formData.store_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    >
                      <option value="">Chọn cửa hàng làm việc</option>
                      {listStore?.map(store => (
                        <>
                          <option value={store._id}>{store.name}</option>
                        </>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Tên đăng nhập *</label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      type="text"
                      placeholder="Tài khoản"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                    />
                  </div>
                </>
              )}

              {!editAccount && (
                <div>
                  <label className="block text-sm mb-1">Mật khẩu *</label>
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleSubmit()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  {editAccount ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenu && <div className="fixed inset-0 z-0" onClick={() => setActionMenu(null)} />}
    </div>
  );
}
