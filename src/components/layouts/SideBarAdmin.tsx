import { usePathname, useRouter } from "next/navigation";
import { useEmployeeAuth, getRoleLabel, getRoleColor, EmployeeRole } from "@/src/context/authEmployeeContext";
import {
  LayoutDashboard,
  Pizza,
  Warehouse,
  Users,
  Clock,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Truck,
  DollarSign,
  Settings,
  Contact,
  UserCog,
  Monitor,
  KeyRound,
  Store,
  Package,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: EmployeeRole[];
  separator?: boolean;
}

const navItems: NavItem[] = [
  { label: "Tổng quan", path: "/is/dashboard", icon: <LayoutDashboard size={20} />, roles: ["admin", "manager", "staff"] },
  { label: "Quản lý cửa hàng", path: "/is/stores", icon: <Store size={20} />, roles: ["admin"] },
  { label: "Quản lý sản phẩm", path: "/is/products", icon: <Pizza size={20} />, roles: ["admin", "manager"] },
  { label: "Danh mục nguyên liệu", path: "/is/ingredient-catalog", icon: <Warehouse size={20} />, roles: ["admin"] },
  { label: "Nhà cung cấp", path: "/is/suppliers", icon: <Truck size={20} />, roles: ["admin"] },
  { label: "Kho nguyên liệu", path: "/is/ingredients", icon: <Package size={20} />, roles: ["manager"] },
  { label: "Quản lý nhân viên", path: "/is/employees", icon: <Users size={20} />, roles: ["manager"] },
  { label: "Quản lý ca", path: "/is/shifts", icon: <Clock size={20} />, roles: ["manager", "staff"] },
  { label: "Lương dự kiến", path: "/is/my-salary", icon: <DollarSign size={20} />, roles: ["staff"] },
  { label: "Đồng nghiệp", path: "/is/contacts", icon: <Contact size={20} />, roles: ["staff"] },
  { label: "Quản lý đơn hàng", path: "/is/orders", icon: <ShoppingCart size={20} />, roles: ["manager", "staff"] },
  { label: "Doanh thu", path: "/is/revenue", icon: <TrendingUp size={20} />, roles: ["admin", "manager"] },
  { label: "Quản lý tài khoản", path: "/is/accounts", icon: <UserCog size={20} />, roles: ["admin"], separator: true },
  // { label: "Cài đặt", path: "/is/settings", icon: <Settings size={20} />, roles: ["admin"] },
  // {
  //   label: "Đổi mật khẩu",
  //   path: "/is/change-password",
  //   icon: <KeyRound size={20} />,
  //   roles: ["admin", "manager", "staff", null],
  //   separator: true,
  // },
];

export function Sidebar() {
  const { user, logout } = useEmployeeAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push("/is");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Pizza size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-white truncate">PaoPizza</h2>
            <p className="text-sidebar-foreground/60 text-xs truncate">Quản lý cửa hàng</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map(item => (
          <div key={item.path}>
            {item.separator && <div className={`border-t border-sidebar-border my-3 ${collapsed ? "mx-1" : "mx-2"}`} />}
            <Link
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group 
                   ${pathname === item.path ? `bg-primary text-white shadow-lg shadow-primary/25` : `text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white`}  
                `}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          </div>
        ))}
      </nav>

      {/* <div className="px-3 pb-2">
        <Link
          href="/pos"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-primary ${collapsed ? "justify-center" : ""}`}
        >
          <span className="shrink-0">
            <Monitor size={20} />
          </span>
          {!collapsed && <span className="text-sm truncate">POS Bán hàng</span>}
        </Link>
      </div> */}

      <div className="border-t border-sidebar-border p-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary text-sm">{user.name.charAt(0)}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{user.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
              {/* {user.storeName && <p className="text-sidebar-foreground/50 text-[10px] truncate mt-0.5">{user.storeName}</p>} */}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-sidebar-foreground/50 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-sidebar text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-sidebar" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white">
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar h-screen sticky top-0 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
