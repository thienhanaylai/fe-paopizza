"use client";
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserCircle,
  Briefcase,
  Clock,
  Filter,
  GraduationCap,
  MapPinned,
} from "lucide-react";
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
import { getAllEmployee } from "@/src/services/employee.service";

export type EmployeeType = "fulltime" | "parttime";

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  type: EmployeeType;
  level: EmployeeLevel;
  station: EmployeeStation;
  phone: string;
  email: string;
  joinDate: string;
  status: "active" | "inactive";
  baseSalary: number;
  hourlyRate: number;
  totalHoursMonth: number;
}

export const mockEmployees: Employee[] = [
  {
    id: "E001",
    name: "Nguyễn Văn An",
    role: "manager",
    type: "fulltime",
    level: "store_manager",
    station: "management",
    phone: "0901234567",
    email: "an@paopizza.com",
    joinDate: "01/01/2024",
    status: "active",
    baseSalary: 15000000,
    hourlyRate: 0,
    totalHoursMonth: 176,
  },
  {
    id: "E002",
    name: "Trần Thị Bình",
    role: "staff",
    type: "fulltime",
    level: "senior",
    station: "crs",
    phone: "0912345678",
    email: "binh@paopizza.com",
    joinDate: "15/03/2024",
    status: "active",
    baseSalary: 8000000,
    hourlyRate: 0,
    totalHoursMonth: 168,
  },
  {
    id: "E003",
    name: "Lê Minh Cường",
    role: "staff",
    type: "fulltime",
    level: "junior",
    station: "kitchen",
    phone: "0923456789",
    email: "cuong@paopizza.com",
    joinDate: "01/06/2024",
    status: "active",
    baseSalary: 8000000,
    hourlyRate: 0,
    totalHoursMonth: 160,
  },
  {
    id: "E004",
    name: "Phạm Thu Dung",
    role: "staff",
    type: "parttime",
    level: "fresher",
    station: "crs",
    phone: "0934567890",
    email: "dung@paopizza.com",
    joinDate: "10/08/2024",
    status: "active",
    baseSalary: 0,
    hourlyRate: 45000,
    totalHoursMonth: 96,
  },
  {
    id: "E005",
    name: "Hoàng Đức Em",
    role: "staff",
    type: "parttime",
    level: "intern",
    station: "delivery",
    phone: "0945678901",
    email: "em@paopizza.com",
    joinDate: "20/10/2024",
    status: "inactive",
    baseSalary: 0,
    hourlyRate: 42000,
    totalHoursMonth: 0,
  },
  {
    id: "E006",
    name: "Vũ Thị Phương",
    role: "staff",
    type: "parttime",
    level: "fresher",
    station: "kitchen",
    phone: "0956789012",
    email: "phuong@paopizza.com",
    joinDate: "05/01/2025",
    status: "active",
    baseSalary: 0,
    hourlyRate: 45000,
    totalHoursMonth: 72,
  },
  {
    id: "E007",
    name: "Đỗ Quốc Bảo",
    role: "staff",
    type: "fulltime",
    level: "junior",
    station: "delivery",
    phone: "0967890123",
    email: "bao@paopizza.com",
    joinDate: "15/09/2024",
    status: "active",
    baseSalary: 7500000,
    hourlyRate: 0,
    totalHoursMonth: 152,
  },
  {
    id: "E008",
    name: "Ngô Thanh Tâm",
    role: "staff",
    type: "parttime",
    level: "intern",
    station: "crs",
    phone: "0978901234",
    email: "tam@paopizza.com",
    joinDate: "01/02/2025",
    status: "active",
    baseSalary: 0,
    hourlyRate: 40000,
    totalHoursMonth: 64,
  },
];

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function getEstimatedSalary(emp: Employee): number {
  if (emp.type === "fulltime") return emp.baseSalary;
  return emp.hourlyRate * emp.totalHoursMonth;
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
  const { authMode } = useEmployeeAuth();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EmployeeType>("all");
  const [stationFilter, setStationFilter] = useState<"all" | EmployeeStation>("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Employee | null>(null);
  const [listEmployee, setListEmployee] = useState([]);

  const filtered = mockEmployees.filter(
    e =>
      (typeFilter === "all" || e.type === typeFilter) &&
      (stationFilter === "all" || e.station === stationFilter) &&
      (e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())),
  );
  useEffect(() => {
    const fectdata = async () => {
      const list = await getAllEmployee();
      setListEmployee(list);
    };
    fectdata();
  }, []);
  console.log(listEmployee);
  const fulltimeCount = mockEmployees.filter(e => e.type === "fulltime" && e.status === "active").length;
  const parttimeCount = mockEmployees.filter(e => e.type === "parttime" && e.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý nhân viên</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin nhân viên cửa hàng</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
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
            <p className="text-foreground text-xl">4</p>
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
              onChange={e => setTypeFilter(e.target.value as any)}
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
              onChange={e => setStationFilter(e.target.value as any)}
              className="bg-transparent py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Tất cả station</option>
              <option value="kitchen">Bếp</option>
              <option value="crs">CRS</option>
              <option value="delivery">Delivery</option>
              <option value="management">Quản lý</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp, i) => {
          const estimated = getEstimatedSalary(emp);
          return (
            <div key={emp.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white`}
                  >
                    {emp.name
                      .split(" ")
                      .map(w => w[0])
                      .slice(-2)
                      .join("")}
                  </div>
                  <div>
                    <h4 className="text-foreground">{emp.name}</h4>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getLevelColor(emp.level)}`}>
                        {getLevelLabel(emp.level)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getStationColor(emp.station)}`}>
                        {getStationLabel(emp.station)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {emp.status === "active" ? "Đang làm" : "Nghỉ việc"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${emp.type === "fulltime" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                  >
                    {emp.type === "fulltime" ? "Full-time" : "Part-time"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={13} /> {emp.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={13} /> {emp.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserCircle size={13} /> Ngày vào: {emp.joinDate}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={13} /> Giờ tháng này: <span className="text-foreground">{emp.totalHoursMonth}h</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                {emp.type === "fulltime" ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Lương cố định</p>
                    <p className="text-primary">{formatVND(emp.baseSalary)}/tháng</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground">{formatVND(emp.hourlyRate)}/h</p>
                    <p className="text-primary">
                      {formatVND(estimated)} <span className="text-xs text-muted-foreground">(dự kiến)</span>
                    </p>
                  </div>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditItem(emp);
                      setShowModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Họ tên</label>
                <input
                  defaultValue={editItem?.name}
                  placeholder="Nhập họ tên"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Vai trò</label>
                  <select
                    defaultValue={editItem?.role}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="manager">Quản lý cửa hàng</option>
                    <option value="staff">Nhân viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Loại nhân viên</label>
                  <select
                    defaultValue={editItem?.type || "fulltime"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="fulltime">Full-time</option>
                    <option value="parttime">Part-time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Cấp bậc</label>
                  <select
                    defaultValue={editItem?.level || "intern"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="intern">Intern</option>
                    <option value="fresher">Fresher</option>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="manager">Store Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Station</label>
                  <select
                    defaultValue={editItem?.station || "crs"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="kitchen">Bếp</option>
                    <option value="crs">CRS</option>
                    <option value="delivery">Delivery</option>
                    <option value="management">Quản lý</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Lương cố định (FT)</label>
                  <input
                    type="number"
                    defaultValue={editItem?.baseSalary || 0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Lương theo giờ (PT)</label>
                  <input
                    type="number"
                    defaultValue={editItem?.hourlyRate || 0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Số điện thoại</label>
                  <input
                    defaultValue={editItem?.phone}
                    placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    defaultValue={editItem?.email}
                    placeholder="email@paopizza.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
              </div>
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
                  {editItem ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
