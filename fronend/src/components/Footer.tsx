import { Link } from "react-router-dom";
import { Leaf, Mail, MapPin, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Tradin" className="h-8 w-8 rounded-full" />
              <span className="text-xl font-extrabold tracking-tight">Tradin<span className="text-primary">.</span></span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              แพลตฟอร์มแลกเปลี่ยนสิ่งของออนไลน์ ที่ช่วยลดขยะและสร้างคุณค่าใหม่ให้กับชุมชน
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              <span>ร่วมสร้างโลกที่ยั่งยืน</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm">เมนูหลัก</h4>
            <ul className="space-y-2">
              {[
                { to: "/", label: "หน้าแรก" },
                { to: "/about", label: "ภาพรวมระบบ" },
                { to: "/categories", label: "หมวดหมู่สิ่งของ" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm">บัญชีผู้ใช้</h4>
            <ul className="space-y-2">
              {[
                { to: "/login", label: "เข้าสู่ระบบ" },
                { to: "/register", label: "สมัครสมาชิก" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm">ติดต่อเรา</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>support@tradin.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>กรุงเทพมหานคร, ประเทศไทย</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Tradin. สงวนลิขสิทธิ์ทุกประการ
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>สร้างด้วย</span>
            <Heart className="h-3 w-3 text-primary fill-primary" />
            <span>เพื่อสิ่งแวดล้อมที่ดีกว่า</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
