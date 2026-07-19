"use client";
import { useEffect, useState } from "react";
import { Search, Phone, Mail, MapPinned } from "lucide-react";
import {
  getLevelLabel,
  getLevelColor,
  getStationLabel,
  getStationColor,
  EmployeeLevel,
  EmployeeStation,
  useEmployeeAuth,
} from "@/src/context/authEmployeeContext";
import { getEmployeesByStore } from "@/src/services/employee.service";

interface StaffContact {
  id: string;
  name: string;
  level: EmployeeLevel;
  station: EmployeeStation;
  phone: string;
  email: string;
  status: "online" | "busy" | "offline";
}

type EmployeeRecord = {
  _id?: string;
  id?: string;
  name?: string;
  level?: EmployeeLevel;
  station?: EmployeeStation;
  phone?: string;
  email?: string;
  status?: boolean;
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  online: { label: "Đang làm", color: "text-green-600", dot: "bg-green-500" },
  busy: { label: "Bận", color: "text-yellow-600", dot: "bg-yellow-500" },
  offline: { label: "Offline", color: "text-gray-400", dot: "bg-gray-400" },
};

const avatarColors = [
  "bg-primary",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
];

export default function StaffContacts() {
  const { user, getInfo } = useEmployeeAuth();
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState<"all" | EmployeeStation>("all");
  const [contacts, setContacts] = useState<StaffContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadContacts = async () => {
      setIsLoading(true);
      try {
        let storeId = user?.store_id;

        if (!storeId) {
          const info = await getInfo();
          const storeRef = info?.ref_id?.store_id;
          storeId = typeof storeRef === "string" ? storeRef : storeRef?._id;
        }

        if (!storeId) {
          if (!cancelled) setContacts([]);
          return;
        }

        const employees: EmployeeRecord[] = await getEmployeesByStore(storeId);
        if (cancelled) return;

        const normalized = (employees || []).map((employee, index) => ({
          id: employee?._id || employee?.id || `emp-${index}`,
          name: employee?.name || "N/A",
          level: employee?.level || "fresher",
          station: employee?.station || "cashier",
          phone: employee?.phone || "",
          email: employee?.email || "",
          status: employee?.status === false ? "offline" : "online",
        }));

        setContacts(normalized);
      } catch (error) {
        console.error("Loi tai danh sach nhan vien:", error);
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, [getInfo, user?.store_id]);

  const filtered = contacts.filter(
    c =>
      (stationFilter === "all" || c.station === stationFilter) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground">Nhân viên cửa hàng</h1>
        <p className="text-muted-foreground mt-1">Liên hệ đồng nghiệp khi cần thiết</p>
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
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3">
          <MapPinned size={16} className="text-muted-foreground" />
          <select
            value={stationFilter}
            onChange={e => setStationFilter(e.target.value as any)}
            className="bg-transparent py-2.5 text-sm outline-none text-foreground"
          >
            <option value="all">Tất cả station</option>
            <option value="kitchen">Bếp</option>
            <option value="cashier">CRS</option>
            <option value="delivery">Delivery</option>
            <option value="manager">Quản lý</option>
            <option value="store_manager">Cửa hàng trưởng</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : (
          filtered.map((contact, i) => {
          const st = statusConfig[contact.status];
          return (
            <div key={contact.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white`}
                  >
                    {contact.name
                      .split(" ")
                      .map(w => w[0])
                      .slice(-2)
                      .join("")}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-foreground truncate">{contact.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getLevelColor(contact.level)}`}>
                      {getLevelLabel(contact.level)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStationColor(contact.station)}`}>
                      {getStationLabel(contact.station)}
                    </span>
                  </div>
                </div>
                {/* <span className={`text-xs ${st.color}`}>{st.label}</span> */}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={13} /> {contact.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={13} /> {contact.email}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-600 text-sm hover:bg-green-100 transition-colors"
                >
                  <Phone size={14} /> Gọi
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm hover:bg-blue-100 transition-colors"
                >
                  <Mail size={14} /> Email
                </a>
              </div>
            </div>
          );
        })}
        )}
      </div>
      {!isLoading && filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">Khong tim thay nhan vien phu hop.</div>
      )}
    </div>
  );
}
