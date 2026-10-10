
import { Link } from "react-router-dom";
import { Leaf, Mail, MapPin, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const footerLinks = [
  {
    title: "เมนูหลัก",
    links: [
      { to: "/", label: "หน้าแรก" },
      { to: "/about", label: "ภาพรวมระบบ" },
      { to: "/categories", label: "หมวดหมู่สิ่งของ" },
    ],
  },
  {
    title: "บัญชีผู้ใช้",
    links: [
      { to: "/login", label: "เข้าสู่ระบบ" },
      { to: "/register", label: "สมัครสมาชิก" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/20 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-12">
          {/* ข้อมูล Tradin */}
          <div className="space-y-4">
            <Link to="/" className="group inline-block">
              <img
                src={logo}
                alt="Tradin Logo"
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground">
              แพลตฟอร์มแลกเปลี่ยนสิ่งของออนไลน์ ที่ช่วยลดขยะและสร้างคุณค่าใหม่ให้กับชุมชน
            </p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              <span>ร่วมสร้างโลกที่ยั่งยืน</span>
            </div>
          </div>

          {/* เมนูและบัญชีผู้ใช้ */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {section.title}
              </h4>

              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ติดต่อเรา */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              ติดต่อเรา
            </h4>

            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>support@tradin.com</span>
              </li>

              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>กรุงเทพมหานคร, ประเทศไทย</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Tradin. สงวนลิขสิทธิ์ทุกประการ
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>สร้างด้วย</span>
            <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
            <span>เพื่อสิ่งแวดล้อมที่ดีกว่า</span>
          </div>
        </div>
      </div>
    </footer>
  );
}