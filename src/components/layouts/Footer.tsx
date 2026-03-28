import { Pizza, Mail, Facebook, Instagram } from "lucide-react";
const NavMenu = [
  {
    name: "Trang chủ",
    link: "/",
  },
  {
    name: "Menu",
    link: "#menu",
  },
  {
    name: "Về chúng tôi",
    link: "#about",
  },
];
export default function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Pizza size={18} className="text-white" />
              </div>
              <span className="text-lg text-white">PaoPizza</span>
            </div>
            <p className="text-sidebar-foreground/60 text-sm max-w-sm">Pizza Ý đích thực, giao hàng tận nơi.</p>
            <div className="flex items-center gap-3 mt-4">
              {[Facebook, Instagram, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white mb-3">Liên kết</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              {NavMenu?.map(item => {
                return (
                  <p key={item.link} className="hover:text-white cursor-pointer transition-colors">
                    {item.name}
                  </p>
                );
              })}
            </div>
          </div>
          <div>
            <h4 className="text-white mb-3">Chính sách</h4>
            <div className="space-y-2 text-sm text-sidebar-foreground/60">
              <p className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</p>
              <p className="hover:text-white cursor-pointer transition-colors">Điều khoản sử dụng</p>
            </div>
          </div>
        </div>
        <div className="border-t border-sidebar-border mt-8 pt-6 text-center text-sm text-sidebar-foreground/40">
          © 2026 PaoPizza. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
