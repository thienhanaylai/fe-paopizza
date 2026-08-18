"use client";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  Users,
  UserCircle,
  Phone,
  MoreVertical,
  Lock,
  Unlock,
} from "lucide-react";
import { getRoleLabel, getRoleColor, getStationLabel, getStationColor } from "@/src/context/authEmployeeContext";
import { createUser, deleteUser, getAllUser, updateUser, updateUserStatus, User } from "@/src/services/user.service";
import { updateEmployee } from "@/src/services/employee.service";
import { updateCustomer } from "@/src/services/customer.service";
import { getAllStore } from "@/src/services/store.service";
import { useSort } from "@/src/hooks/useSort";
import { SortableHeader } from "@/src/components/ui/SortableHeader";
import { toast, Toaster } from "sonner";
import Pagination from "@/src/components/ui/Pagination";
type UserRole = "admin" | "manager" | "staff";

type ActionMenuPosition = {
  top: number;
  left: number;
  openUp: boolean;
};

const ACTION_MENU_WIDTH = 176;

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

const createEmptyForm = () => ({
  role: "staff",
  name: "",
  email: "",
  phone: "",
  address: "",
  birthday: "",
  station: "kitchen",
  salary: 0,
  salaryType: "monthly",
  store_id: "",
  username: "",
  password: "",
});

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole | null>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | boolean>("all");
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<User | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<User | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState("");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuPosition | null>(null);
  const [listUser, setListUser] = useState<User[]>();
  const [listStore, setListStore] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [formData, setFormData] = useState(createEmptyForm);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fecthData = async () => {
      const { data: res } = await getAllUser();
      const { data: res2 } = await getAllStore();
      setListStore(res2);
      setListUser(res);
      setIsPageLoading(false);
    };
    fecthData();
  }, [isLoading]);

  // Reset page khi filter/search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (!actionMenu) return;

    const closeActionMenu = () => {
      setActionMenu(null);
      setActionMenuPosition(null);
    };

    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);

    return () => {
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
    };
  }, [actionMenu]);

  const handleActionMenuToggle = (event: MouseEvent<HTMLButtonElement>, account: User) => {
    if (actionMenu === account._id) {
      setActionMenu(null);
      setActionMenuPosition(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const estimatedMenuHeight = account.role === "admin" ? 88 : 124;
    const openUp = window.innerHeight - buttonRect.bottom < estimatedMenuHeight + 8 && buttonRect.top > estimatedMenuHeight + 8;
    const left = Math.max(8, Math.min(buttonRect.right - ACTION_MENU_WIDTH, window.innerWidth - ACTION_MENU_WIDTH - 8));

    setActionMenuPosition({
      top: openUp ? buttonRect.top - 4 : buttonRect.bottom + 4,
      left,
      openUp,
    });
    setActionMenu(account._id);
  };

  const handleTogleStatus = async (account: User) => {
    setIsLoading(true);
    try {
      await updateUserStatus(account._id, { status: !account.status });
      toast.success(account.status ? "Khóa tài khoản thành công!" : "Mở khóa thành công!");
      setActionMenu(null);
      setActionMenuPosition(null);
    } catch (error) {
      toast.error(`Cập nhật trạng thái thất bại: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirmation = (account: User) => {
    setDeleteAccount(account);
    setDeleteConfirmationId("");
    setActionMenu(null);
    setActionMenuPosition(null);
  };

  const closeDeleteConfirmation = () => {
    if (isLoading) return;
    setDeleteAccount(null);
    setDeleteConfirmationId("");
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccount || deleteConfirmationId.trim() !== deleteAccount._id) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteUser(deleteAccount._id);
      toast.success("Xóa tài khoản thành công!");
      setDeleteAccount(null);
      setDeleteConfirmationId("");
      setActionMenu(null);
      setActionMenuPosition(null);
    } catch (error) {
      toast.error(`Xóa tài khoản thất bại: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!editAccount) {
        await createUser(formData);
        toast.success("Thêm mới thành công!");
      } else {
        const isCustomer = editAccount.user_type === "Customer" || editAccount.role === null || formData.role === "customer";

        if (isCustomer) {
          await updateCustomer({
            user_id: editAccount._id,
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            email: formData.email,
          });
          await updateUser(editAccount._id, {
            username: formData.phone,
            role: null,
          });
        } else {
          const employeeId = (editAccount.ref_id as any)?._id;
          await updateEmployee({
            employee_id: employeeId,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            birthday: formData.birthday || undefined,
            station: formData.station,
            salaryType: formData.salaryType,
            salary: Number(formData.salary) || 0,
            store_id: formData.store_id || null,
          });

          const roleForUser = formData.role === "store_manager" ? "manager" : formData.role;
          await updateUser(editAccount._id, {
            username: formData.username || editAccount.username,
            role: roleForUser as any,
          });
        }

        toast.success("Cập nhật thành công!");
      }

      setIsLoading(false);
      setShowModal(false);
      setEditAccount(null);
      setFormData(createEmptyForm());
    } catch (error) {
      toast.error(editAccount ? `Cập nhật thất bại: ${error}` : `Thêm mới thất bại: ${error}`);
      setIsLoading(false);
      return;
    }
  };
  const filtered = listUser?.filter(
    a =>
      (roleFilter === "all" || a.role === roleFilter) &&
      (statusFilter === "all" || a.status === statusFilter) &&
      (a.ref_id.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.ref_id.email?.toLowerCase().includes(search.toLowerCase())),
  );

  const { sortedData, sortConfig, toggleSort } = useSort(filtered || [], "ref_id.name", "asc");

  // Phân trang
  const totalFiltered = sortedData.length;
  const totalPages = Math.ceil(totalFiltered / limit);
  const paginatedData = sortedData.slice((page - 1) * limit, page * limit);

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
            setFormData(createEmptyForm());
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <UserPlus size={18} /> Tạo tài khoản
        </button>
      </div>

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

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isPageLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i} className="px-4 py-3">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" style={{ width: `${50 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-left">
                  <SortableHeader
                    label="Người dùng"
                    sortKey="ref_id.name"
                    sortConfig={sortConfig}
                    onSort={toggleSort}
                    className="px-4 py-3"
                  />
                  <SortableHeader
                    label="Vai trò"
                    sortKey="role"
                    sortConfig={sortConfig}
                    onSort={toggleSort}
                    className="px-4 py-3"
                  />
                  <SortableHeader
                    label="Level / Station"
                    sortKey="ref_id.station"
                    sortConfig={sortConfig}
                    onSort={toggleSort}
                    className="px-4 py-3 hidden md:table-cell"
                  />
                  <SortableHeader
                    label="Liên hệ"
                    sortKey="ref_id.phone"
                    sortConfig={sortConfig}
                    onSort={toggleSort}
                    className="px-4 py-3 hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Trạng thái"
                    sortKey="status"
                    sortConfig={sortConfig}
                    onSort={toggleSort}
                    className="px-4 py-3"
                  />
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData?.map((account, i) => {
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

                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={event => handleActionMenuToggle(event, account)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {actionMenu === account._id &&
                            actionMenuPosition &&
                            createPortal(
                              <div
                                className="fixed w-44 bg-card rounded-xl border border-border shadow-xl z-[101] py-1"
                                style={{
                                  top: actionMenuPosition.top,
                                  left: actionMenuPosition.left,
                                  transform: actionMenuPosition.openUp ? "translateY(-100%)" : undefined,
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setEditAccount(account);
                                    const isCustomer = account.user_type === "Customer" || account.role === null;
                                    setFormData({
                                      role: isCustomer ? "customer" : account.role || "staff",
                                      name: account.ref_id?.name || "",
                                      email: account.ref_id?.email || "",
                                      phone: account.ref_id?.phone || "",
                                      address: account.ref_id?.address || "",
                                      birthday: !isCustomer ? toDateInputValue((account.ref_id as any)?.birthday) : "",
                                      station: !isCustomer ? (account.ref_id as any)?.station || "kitchen" : "kitchen",
                                      salary: !isCustomer ? (account.ref_id as any)?.salary || 0 : 0,
                                      salaryType: !isCustomer ? (account.ref_id as any)?.salaryType || "monthly" : "monthly",
                                      store_id: !isCustomer ? (account.ref_id as any)?.store_id || "" : "",
                                      username: account.username || "",
                                      password: "",
                                    });
                                    setShowModal(true);
                                    setActionMenu(null);
                                    setActionMenuPosition(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                >
                                  <Edit2 size={14} /> Chỉnh sửa
                                </button>
                                <button
                                  onClick={() => handleTogleStatus(account)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                >
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
                                  <button
                                    onClick={() => openDeleteConfirmation(account)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} /> Xóa tài khoản
                                  </button>
                                )}
                              </div>,
                              document.body,
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Phân trang */}
      {!isPageLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={totalFiltered}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={newLimit => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 m-0 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editAccount ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Họ tên *</label>
                <input
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
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Địa chỉ</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
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
                  <option value="manager">Quản lý cửa hàng</option>
                  <option value="staff">Nhân viên</option>
                  <option value="customer">Khách hàng</option>
                </select>
              </div>
              {(formData.role === "staff" || formData.role === "manager" || formData.role === "admin") && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Loại nhân viên</label>
                      <select
                        name="salaryType"
                        value={formData.salaryType}
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
                        <option key={store._id} value={store._id}>
                          {store.name}
                        </option>
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

                {isLoading ? (
                  <button className="flex-1 py-2.5 rounded-xl bg-primary text-white bg-primary/50 transition-colors" disabled>
                    Đang xử lý ...
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit()}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    {editAccount ? "Cập nhật" : "Tạo mới"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteAccount && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={closeDeleteConfirmation}>
          <form
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={event => event.stopPropagation()}
            onSubmit={event => {
              event.preventDefault();
              void handleDeleteAccount();
            }}
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 size={19} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Xác nhận xóa tài khoản</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thao tác này không thể hoàn tác. Hãy nhập chính xác ID tài khoản để tiếp tục.
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{deleteAccount.ref_id?.name || deleteAccount.username}</p>
              <p className="mt-1 break-all font-mono text-xs text-red-600">{deleteAccount._id}</p>
            </div>

            <label htmlFor="delete-account-id" className="mb-1.5 block text-sm font-medium text-foreground">
              ID tài khoản
            </label>
            <input
              id="delete-account-id"
              value={deleteConfirmationId}
              onChange={event => setDeleteConfirmationId(event.target.value)}
              placeholder="Nhập ID tài khoản"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              disabled={isLoading}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {deleteConfirmationId && deleteConfirmationId.trim() !== deleteAccount._id && (
              <p className="mt-2 text-xs text-red-600">ID tài khoản không khớp.</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || deleteConfirmationId.trim() !== deleteAccount._id}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Đang xóa..." : "Xóa tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}

      {actionMenu &&
        createPortal(
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => {
              setActionMenu(null);
              setActionMenuPosition(null);
            }}
          />,
          document.body,
        )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
