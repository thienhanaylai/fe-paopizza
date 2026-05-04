"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, Phone, Mail, UserCircle, Briefcase, Clock, Filter, MapPinned } from "lucide-react";
import {
  EmployeeRole,
  EmployeeLevel,
  EmployeeStation,
  getLevelLabel,
  getLevelColor,
  getStationLabel,
  getStationColor,
  useEmployeeAuth,
} from "@/src/context/authEmployeeContext";
import {
  createEmployee,
  deleteEmployee,
  getAllEmployee,
  getEmployeesByStore,
  updateEmployee,
} from "@/src/services/employee.service";
import { toast, Toaster } from "sonner";

export type EmployeeType = "fulltime" | "parttime";

export interface Employee {
  _id: string;
  store_id?: string | { _id: string };
  name: string;
  birthday?: string;
  email: string;
  phone: string;
  station?: EmployeeStation;
  salary_type?: "hourly" | "monthly";
  salary?: number;
  status?: boolean;
  createdAt?: string;
  address?: string;
  bank_account?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  };
  isDeleted?: boolean;
  updatedAt?: string;
  __v?: number;
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function getEstimatedSalary(employee: Employee, totalHoursMonth: number): number {
  const salary = employee.salary || 0;
  if ((employee.salary_type || "monthly") === "monthly") return salary;
  return salary * totalHoursMonth;
}

function getEmployeeType(employee: Employee): EmployeeType {
  return (employee.salary_type || "monthly") === "monthly" ? "fulltime" : "parttime";
}

function getEmployeeStation(employee: Employee): EmployeeStation {
  return employee.station || "cashier";
}

function getEmployeeStatus(employee: Employee): "active" | "inactive" {
  return employee.status === false ? "inactive" : "active";
}

const avatarColors = [
  "bg-primary",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-indigo-500",
];

export default function Employees() {
  const { authMode, user, getInfo } = useEmployeeAuth();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EmployeeType>("all");
  const [stationFilter, setStationFilter] = useState<"all" | EmployeeStation>("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [listEmployee, setListEmployee] = useState<Employee[]>([]);
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formBirthday, setFormBirthday] = useState("");
  const [formRole, setFormRole] = useState<EmployeeRole>("staff");
  const [formStation, setFormStation] = useState<EmployeeStation>("cashier");
  const [formSalaryType, setFormSalaryType] = useState<"monthly" | "hourly">("monthly");
  const [formSalary, setFormSalary] = useState(0);
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [idConfirm, setIdConfirm] = useState("");
  const [info, setInfo] = useState();

  const managerStoreId = authMode === "manager" ? (user?.store_id ?? null) : null;

  const fetchEmployees = useCallback(
    async (storeId?: string | null) => {
      if (authMode === "manager") {
        if (!storeId) {
          setListEmployee([]);
          return;
        }
        const list = await getEmployeesByStore(storeId);

        const ress = await getInfo();
        setInfo(ress);
        setListEmployee(list);
        return;
      }

      const list = await getAllEmployee();
      setListEmployee(list);
    },
    [authMode],
  );

  useEffect(() => {
    fetchEmployees(authMode === "manager" ? managerStoreId : null);
  }, [authMode, managerStoreId, fetchEmployees]);

  const resetForm = () => {
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormBirthday("");
    setFormRole("staff");
    setFormStation("cashier");
    setFormSalaryType("monthly");
    setFormSalary(0);
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
  };

  const openCreateModal = () => {
    setEditItem(null);
    resetForm();
    setShowModal(true);
  };

  const handleDeleteEmployee = async () => {
    try {
      if (!idConfirm || !editItem?._id) {
        toast.warning("Không tìm thấy nhân viên!");
        return;
      }
      if (editItem.station === "store_manager") {
        toast.warning("Vui lòng liên hệ admin để xoá quản lý cửa hàng!");
        return;
      }
      if (editItem._id === info?.ref_id._id) {
        toast.warning("Không xoá được tài khoản đang đăng nhập!");
        return;
      }
      await deleteEmployee(editItem?._id || "");
      setModalConfirm(false);
      setEditItem(null);
      resetForm();
      fetchEmployees();
      toast.success("Xoá nhân viên thành công!");
    } catch (e) {
      toast.error(`Lỗi: ${e}`);
    }
  };

  const openEditModal = (employee: Employee) => {
    const station = employee.station || "cashier";
    const salaryType = employee.salary_type || "monthly";
    setEditItem(employee);
    setFormName(employee.name || "");
    setFormUsername("");
    setFormPassword("");
    setFormBirthday(employee.birthday || "");
    setFormRole(station === "manager" || station === "store_manager" ? "manager" : "staff");
    setFormStation(station);
    setFormSalaryType(salaryType);
    setFormSalary(employee.salary || 0);
    setFormPhone(employee.phone || "");
    setFormEmail(employee.email || "");
    setFormAddress(employee.address || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formName || !formEmail || !formPhone || !formBirthday) return;
    if (!editItem && (!formUsername || !formPassword)) return;

    setIsSubmitting(true);
    try {
      const storeId = authMode === "manager" ? managerStoreId : undefined;

      if (editItem) {
        await updateEmployee({
          employee_id: editItem._id,
          store_id: storeId || undefined,
          name: formName,
          birthday: formBirthday || undefined,
          email: formEmail,
          phone: formPhone,
          station: formStation,
          salary_type: formSalaryType,
          role: formRole || undefined,
          address: formAddress || undefined,
          salary: formSalary || 0,
        });
      } else {
        await createEmployee({
          username: formUsername,
          password: formPassword,
          store_id: storeId || undefined,
          name: formName,
          birthday: formBirthday,
          email: formEmail,
          phone: formPhone,
          station: formStation,
          salary_type: formSalaryType,
          role: formRole || "staff",
          address: formAddress || undefined,
          salary: formSalary || 0,
        });
      }

      await fetchEmployees(storeId ?? null);
      closeModal();
    } catch (error) {
      console.error("Lỗi xử lý nhân viên:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = listEmployee.filter(employee => {
    const type = getEmployeeType(employee);
    const station = getEmployeeStation(employee);

    return (
      (typeFilter === "all" || type === typeFilter) &&
      (stationFilter === "all" || station === stationFilter) &&
      (employee.name.toLowerCase().includes(search.toLowerCase()) || employee.email.toLowerCase().includes(search.toLowerCase()))
    );
  });
  const fulltimeCount = listEmployee.filter(
    employee => getEmployeeType(employee) === "fulltime" && employee.status !== false,
  ).length;
  const parttimeCount = listEmployee.filter(
    employee => getEmployeeType(employee) === "parttime" && employee.status !== false,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý nhân viên</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin nhân viên cửa hàng</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Thêm nhân viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Full-time</p>
            <p className="text-foreground text-xl">{fulltimeCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Part-time</p>
            <p className="text-foreground text-xl">{parttimeCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <MapPinned size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Stations</p>
            <p className="text-foreground text-xl">6</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <UserCircle size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tổng cộng</p>
            <p className="text-foreground text-xl">{fulltimeCount + parttimeCount}</p>
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
            placeholder="Tìm kiếm nhân viên..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as "all" | EmployeeType)}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả loại</option>
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
            <MapPinned size={16} className="text-muted-foreground" />
            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value as "all" | EmployeeStation)}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả station</option>
              <option value="kitchen">Bếp</option>
              <option value="cashier">Cashier</option>
              <option value="delivery">Delivery</option>
              <option value="barista">Barista</option>
              <option value="manager">Quản lý</option>
              <option value="store_manager">Cửa hàng trưởng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((employee, i) => {
          const station = getEmployeeStation(employee);
          const type = getEmployeeType(employee);
          const status = getEmployeeStatus(employee);
          // const level: EmployeeLevel = station === "store_manager" ? "store_manager" : "junior";
          const totalHoursMonth = 0;
          const salary = employee.salary || 0;
          const estimated = getEstimatedSalary(employee, totalHoursMonth);
          const joinDate = employee.createdAt ? new Date(employee.createdAt).toLocaleDateString("vi-VN") : "-";
          return (
            <div key={employee._id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white`}
                  >
                    {employee.name
                      .split(" ")
                      .map(w => w[0])
                      .slice(-2)
                      .join("")}
                  </div>
                  <div>
                    <h4 className="text-foreground">{employee.name}</h4>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {/* <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getLevelColor(level)}`}>
                        {getLevelLabel(level)}
                      </span> */}
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getStationColor(station)}`}>
                        {getStationLabel(station)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {status === "active" ? "Đang làm" : "Nghỉ việc"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${type === "fulltime" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                  >
                    {type === "fulltime" ? "Full-time" : "Part-time"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={13} /> {employee.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={13} /> {employee.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCircle size={13} /> Ngày vào: {joinDate}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={13} /> Giờ tháng này: <span className="text-foreground">{totalHoursMonth}h</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                {type === "fulltime" ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Lương cố định</p>
                    <p className="text-primary">{formatVND(salary)}/tháng</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">{formatVND(salary)}/h</p>
                    <p className="text-primary">
                      {formatVND(estimated)} <span className="text-xs text-muted-foreground">(dự kiến)</span>
                    </p>
                  </div>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(employee)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setModalConfirm(true);
                      setEditItem(employee);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Họ tên</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Nhập họ tên"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              {!editItem && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Tên đăng nhập</label>
                    <input
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                      placeholder="newstaff01"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Mật khẩu</label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="12345678"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={formBirthday}
                  onChange={e => setFormBirthday(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Vai trò</label>
                  <select
                    value={formRole || "staff"}
                    onChange={e => setFormRole(e.target.value as EmployeeRole)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="manager">Quản lý cửa hàng</option>
                    <option value="staff">Nhân viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Loại lương</label>
                  <select
                    value={formSalaryType}
                    onChange={e => setFormSalaryType(e.target.value as "monthly" | "hourly")}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="monthly">Lương tháng</option>
                    <option value="hourly">Lương giờ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Station</label>
                  <select
                    value={formStation}
                    onChange={e => setFormStation(e.target.value as EmployeeStation)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="kitchen">Bếp</option>
                    <option value="cashier">Cashier</option>
                    <option value="delivery">Delivery</option>
                    <option value="barista">Barista</option>
                    <option value="manager">Quản lý</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Mức lương</label>
                  <input
                    type="number"
                    value={formSalary}
                    onChange={e => setFormSalary(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Số điện thoại</label>
                  <input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="email@paopizza.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Địa chỉ</label>
                <input
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Nhập địa chỉ"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modalConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 m-0"
            onClick={() => setModalConfirm(false)}
          >
            <div
              className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3>Xoá {editItem?.name}</h3>
              <div className="flex gap-1 m-2">
                Nhập <p className="font-mono">`{editItem?._id.slice(-8)}`</p> để xác nhận xoá nhân viên?
              </div>
              <input
                className="w-full pl-4 pr-1 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                type="text"
                onChange={e => setIdConfirm(e.target.value)}
                placeholder={`Nhập '${editItem?._id.slice(-8)}' để xác nhận`}
              />
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setModalConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-black hover:bg-red-50 transition-colors"
                >
                  Thoát
                </button>
                <button
                  onClick={() => {
                    if (idConfirm === editItem?._id.slice(-8)) handleDeleteEmployee();
                  }}
                  disabled={idConfirm !== editItem?._id.slice(-8)}
                  className="flex-1 py-2.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70 rounded-xl bg-red-600 text-white hover:bg-red-700/90 transition-colors"
                >
                  Xoá nhân viên
                </button>
              </div>
            </div>
          </div>
        </>
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
