"use client";

import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Phone, Mail, MapPin, Package, Star, Truck } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  rating: number;
  status: "active" | "inactive";
  totalOrders: number;
  lastDelivery: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: "SUP001",
    name: "Công ty TNHH ABC Foods",
    contactPerson: "Nguyễn Văn Tuấn",
    phone: "0281234567",
    email: "sales@abcfoods.vn",
    address: "KCN Tân Bình, TP.HCM",
    category: "Nguyên liệu chính",
    rating: 4.8,
    status: "active",
    totalOrders: 245,
    lastDelivery: "17/03/2026",
  },
  {
    id: "SUP002",
    name: "Công ty XYZ Import",
    contactPerson: "Trần Minh Hải",
    phone: "0289876543",
    email: "order@xyzimport.vn",
    address: "Q.7, TP.HCM",
    category: "Phô mai & Sốt",
    rating: 4.5,
    status: "active",
    totalOrders: 180,
    lastDelivery: "16/03/2026",
  },
  {
    id: "SUP003",
    name: "Chợ đầu mối Hóc Môn",
    contactPerson: "Lê Thị Hoa",
    phone: "0901122334",
    email: "hoa.le@gmail.com",
    address: "Hóc Môn, TP.HCM",
    category: "Rau củ & Trái cây",
    rating: 4.2,
    status: "active",
    totalOrders: 520,
    lastDelivery: "17/03/2026",
  },
  {
    id: "SUP004",
    name: "Italia Gourmet Co.",
    contactPerson: "Marco Rossi",
    phone: "0283456789",
    email: "vietnam@italiagourmet.com",
    address: "Q.2, TP.HCM",
    category: "Topping nhập khẩu",
    rating: 4.9,
    status: "active",
    totalOrders: 95,
    lastDelivery: "14/03/2026",
  },
  {
    id: "SUP005",
    name: "Hải sản Vũng Tàu",
    contactPerson: "Phạm Đức Long",
    phone: "0254123456",
    email: "long@haisanvt.vn",
    address: "TP. Vũng Tàu",
    category: "Hải sản",
    rating: 4.3,
    status: "active",
    totalOrders: 150,
    lastDelivery: "17/03/2026",
  },
  {
    id: "SUP006",
    name: "Đại lý nước giải khát Miền Nam",
    contactPerson: "Hoàng Thị Lan",
    phone: "0285554433",
    email: "lan@nuocgk.vn",
    address: "Bình Dương",
    category: "Đồ uống",
    rating: 4.0,
    status: "inactive",
    totalOrders: 88,
    lastDelivery: "01/03/2026",
  },
];

const ratingColors = (r: number) => {
  if (r >= 4.5) return "text-green-600";
  if (r >= 4.0) return "text-yellow-600";
  return "text-red-600";
};

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [viewItem, setViewItem] = useState<Supplier | null>(null);

  const filtered = mockSuppliers.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground">Quản lý nhà cung cấp</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin và đánh giá nhà cung cấp</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} /> Thêm nhà cung cấp
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Tổng nhà cung cấp</p>
            <p className="text-foreground text-xl">{mockSuppliers.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Đang hợp tác</p>
            <p className="text-foreground text-xl">{mockSuppliers.filter(s => s.status === "active").length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Star size={20} />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Đánh giá TB</p>
            <p className="text-foreground text-xl">
              {(mockSuppliers.reduce((a, s) => a + s.rating, 0) / mockSuppliers.length).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm nhà cung cấp, danh mục..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      {/* Supplier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(sup => (
          <div key={sup.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-foreground truncate">{sup.name}</h4>
                  <span className="text-xs text-muted-foreground">{sup.category}</span>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-[10px] shrink-0 ${sup.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
              >
                {sup.status === "active" ? "Đang hợp tác" : "Ngừng"}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone size={13} /> {sup.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={13} /> <span className="truncate">{sup.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={13} /> <span className="truncate">{sup.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 ${ratingColors(sup.rating)}`}>
                  <Star size={13} className="fill-current" /> {sup.rating}
                </span>
                <span className="text-muted-foreground">{sup.totalOrders} đơn</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditItem(sup);
                    setShowModal(true);
                  }}
                  className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-foreground mb-4">{editItem ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Tên công ty</label>
                <input
                  defaultValue={editItem?.name}
                  placeholder="Nhập tên công ty"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Người liên hệ</label>
                  <input
                    defaultValue={editItem?.contactPerson}
                    placeholder="Họ tên"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Danh mục cung cấp</label>
                  <select
                    defaultValue={editItem?.category}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option>Nguyên liệu chính</option>
                    <option>Phô mai & Sốt</option>
                    <option>Rau củ & Trái cây</option>
                    <option>Topping nhập khẩu</option>
                    <option>Hải sản</option>
                    <option>Đồ uống</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Số điện thoại</label>
                  <input
                    defaultValue={editItem?.phone}
                    placeholder="028xxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    defaultValue={editItem?.email}
                    placeholder="email@company.vn"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Địa chỉ</label>
                <input
                  defaultValue={editItem?.address}
                  placeholder="Nhập địa chỉ"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Đánh giá (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    defaultValue={editItem?.rating || 4.0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Trạng thái</label>
                  <select
                    defaultValue={editItem?.status || "active"}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background outline-none"
                  >
                    <option value="active">Đang hợp tác</option>
                    <option value="inactive">Ngừng hợp tác</option>
                  </select>
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
