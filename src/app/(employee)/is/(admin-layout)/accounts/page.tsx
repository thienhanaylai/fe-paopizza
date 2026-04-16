"use client";
import { useState } from "react";
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

type UserRole = "customer" | "admin" | "manager" | "staff";

interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  level?: EmployeeLevel;
  station?: EmployeeStation;
  status: "active" | "locked" | "inactive";
  joinDate: string;
  lastLogin: string;
}

const mockAccounts: Account[] = [
  {
    id: "U001",
    name: "Admin PaoPizza",
    email: "admin@paopizza.com",
    phone: "0900000001",
    role: "admin",
    level: "store_manager",
    station: "management",
    status: "active",
    joinDate: "01/01/2024",
    lastLogin: "17/03/2026 14:30",
  },
  {
    id: "U002",
    name: "Nguyễn Văn An",
    email: "an@paopizza.com",
    phone: "0901234567",
    role: "manager",
    level: "store_manager",
    station: "management",
    status: "active",
    joinDate: "01/01/2024",
    lastLogin: "17/03/2026 13:20",
  },
  {
    id: "U003",
    name: "Trần Thị Bình",
    email: "binh@paopizza.com",
    phone: "0912345678",
    role: "staff",
    level: "senior",
    station: "crs",
    status: "active",
    joinDate: "15/03/2024",
    lastLogin: "17/03/2026 10:15",
  },
  {
    id: "U004",
    name: "Lê Minh Cường",
    email: "cuong@paopizza.com",
    phone: "0923456789",
    role: "staff",
    level: "junior",
    station: "kitchen",
    status: "active",
    joinDate: "01/06/2024",
    lastLogin: "17/03/2026 09:00",
  },
  {
    id: "U005",
    name: "Phạm Thu Dung",
    email: "dung@paopizza.com",
    phone: "0934567890",
    role: "staff",
    level: "fresher",
    station: "crs",
    status: "active",
    joinDate: "10/08/2024",
    lastLogin: "16/03/2026 18:45",
  },
  {
    id: "U006",
    name: "Hoàng Đức Em",
    email: "em@paopizza.com",
    phone: "0945678901",
    role: "staff",
    level: "intern",
    station: "delivery",
    status: "inactive",
    joinDate: "20/10/2024",
    lastLogin: "01/03/2026 12:00",
  },
  {
    id: "U007",
    name: "Đỗ Quốc Bảo",
    email: "bao@paopizza.com",
    phone: "0967890123",
    role: "staff",
    level: "junior",
    station: "delivery",
    status: "active",
    joinDate: "15/09/2024",
    lastLogin: "17/03/2026 12:30",
  },
  {
    id: "U008",
    name: "Ngô Thanh Tâm",
    email: "tam@paopizza.com",
    phone: "0978901234",
    role: "staff",
    level: "intern",
    station: "crs",
    status: "active",
    joinDate: "01/02/2025",
    lastLogin: "17/03/2026 08:00",
  },
  {
    id: "U009",
    name: "Lê Văn C",
    email: "levanc@gmail.com",
    phone: "0989012345",
    role: "customer",
    status: "active",
    joinDate: "05/01/2025",
    lastLogin: "17/03/2026 14:00",
  },
  {
    id: "U010",
    name: "Trần Thị D",
    email: "tranthid@gmail.com",
    phone: "0990123456",
    role: "customer",
    status: "active",
    joinDate: "12/02/2025",
    lastLogin: "16/03/2026 20:00",
  },
  {
    id: "U011",
    name: "Nguyễn Văn E",
    email: "nguyenvane@gmail.com",
    phone: "0901122334",
    role: "customer",
    status: "locked",
    joinDate: "20/12/2024",
    lastLogin: "10/03/2026 15:00",
  },
  {
    id: "U012",
    name: "Phạm Thị F",
    email: "phamthif@gmail.com",
    phone: "0912233445",
    role: "customer",
    status: "active",
    joinDate: "08/03/2025",
    lastLogin: "17/03/2026 11:30",
  },
];

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <ShieldAlert size={16} />,
  manager: <ShieldCheck size={16} />,
  staff: <Shield size={16} />,
  customer: <UserCircle size={16} />,
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Hoạt động", color: "bg-green-100 text-green-700" },
  locked: { label: "Bị khóa", color: "bg-red-100 text-red-600" },
  inactive: { label: "Không hoạt động", color: "bg-gray-100 text-gray-600" },
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
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = mockAccounts.filter(
    a =>
      (roleFilter === "all" || a.role === roleFilter) &&
      (statusFilter === "all" || a.status === statusFilter) &&
      (a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())),
  );

  const counts = {
    total: mockAccounts.length,
    admin: mockAccounts.filter(a => a.role === "admin").length,
    staff: mockAccounts.filter(a => a.role === "staff" || a.role === "manager").length,
    customer: mockAccounts.filter(a => a.role === "customer").length,
    locked: mockAccounts.filter(a => a.status === "locked").length,
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
              onChange={e => setRoleFilter(e.target.value as any)}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="store_manager">Quản lý</option>
              <option value="staff">Nhân viên</option>
              <option value="customer">Khách hàng</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Bị khóa</option>
              <option value="inactive">Không hoạt động</option>
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
                <th className="px-4 py-3 hidden lg:table-cell">Lần đăng nhập cuối</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account, i) => {
                const st = statusConfig[account.status];
                return (
                  <tr key={account.id} className="border-t border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs`}
                        >
                          {account.name
                            .split(" ")
                            .map(w => w[0])
                            .slice(-2)
                            .join("")}
                        </div>
                        <div>
                          <p className="text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRoleColor(account.role)}`}
                      >
                        {roleIcons[account.role]} {getRoleLabel(account.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {account.level && account.station ? (
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${getLevelColor(account.level)}`}>
                            {getLevelLabel(account.level)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStationColor(account.station)}`}>
                            {getStationLabel(account.station)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Phone size={12} /> {account.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{account.lastLogin}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenu(actionMenu === account.id ? null : account.id)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenu === account.id && (
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
                              {account.status === "locked" ? (
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
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editAccount ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Họ tên *</label>
                <input
                  defaultValue={editAccount?.name}
                  placeholder="Nhập họ tên"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Email *</label>
                  <input
                    defaultValue={editAccount?.email}
                    placeholder="email@paopizza.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Số điện thoại</label>
                  <input
                    defaultValue={editAccount?.phone}
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Vai trò *</label>
                <select
                  defaultValue={editAccount?.role || "staff"}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="store_manager">Quản lý cửa hàng</option>
                  <option value="staff">Nhân viên</option>
                  <option value="customer">Khách hàng</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Cấp bậc</label>
                  <select
                    defaultValue={editAccount?.level || "intern"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="intern">Intern</option>
                    <option value="fresher">Fresher</option>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="store_manager">Store Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Station</label>
                  <select
                    defaultValue={editAccount?.station || "crs"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="kitchen">Bếp</option>
                    <option value="crs">CRS</option>
                    <option value="delivery">Delivery</option>
                    <option value="management">Quản lý</option>
                  </select>
                </div>
              </div>
              {!editAccount && (
                <div>
                  <label className="block text-sm mb-1">Mật khẩu *</label>
                  <input
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
                  onClick={() => setShowModal(false)}
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
