"use client";
import { useEffect, useState } from "react";
import { useEmployeeAuth } from "@/src/context/authEmployeeContext";
import { Pizza, Eye, EyeOff, Shield, Store, UserCheck, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type EmployeeRole = "admin" | "manager" | "staff";

const roleOptions: { role: EmployeeRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: "admin", label: "Admin", icon: <Shield size={20} />, desc: "Quản trị toàn hệ thống" },
  { role: "manager", label: "Quản lý", icon: <Store size={20} />, desc: "Quản lý cửa hàng" },
  { role: "staff", label: "Nhân viên", icon: <UserCheck size={20} />, desc: "Nhân viên bán hàng" },
];

export default function IndexPage() {
  const { employeeLogin, isAuthenticated } = useEmployeeAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<EmployeeRole>("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    const res = await employeeLogin(username, password, selectedRole);
    if (res.success) {
      router.push("/is/dashboard");
      router.refresh();
    } else {
      setError(res.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/is/dashboard");
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1594394206170-4ed1c3564417?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMGNoZWYlMjBjb29raW5nJTIwb3ZlbnxlbnwxfHx8fDE3NzM2NDcwNDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Pizza"
          fill
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Pizza size={26} className="text-white" />
            </div>
            <h1 className="text-white text-3xl">PaoPizza</h1>
          </div>
          <p className="text-white/80 text-lg max-w-md">
            Hệ thống quản lý cửa hàng pizza thông minh. Quản lý đơn hàng, nguyên liệu, nhân viên một cách hiệu quả.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Về trang chủ
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <Pizza size={24} className="text-white" />
            </div>
            <h1 className="text-2xl text-foreground">PaoPizza</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-foreground mb-1">Đăng nhập quản trị</h2>
            <p className="text-muted-foreground">Dành cho nhân viên và quản lý nhà hàng</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {roleOptions.map(opt => (
              <button
                key={opt.role}
                type="button"
                onClick={() => setSelectedRole(opt.role)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  selectedRole === opt.role
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <span className={`${selectedRole === opt.role ? "text-primary" : "text-muted-foreground"}`}>{opt.icon}</span>
                <div>
                  <p className={`text-sm ${selectedRole === opt.role ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm text-foreground mb-1.5">Username</label>
              <input
                type="username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Tài khoản"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-foreground mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Mật khẩu"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
