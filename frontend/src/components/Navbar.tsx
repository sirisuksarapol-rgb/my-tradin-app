import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const NAV_LINKS = [
  { to: "/", label: "หน้าแรก" },
  { to: "/about", label: "ภาพรวมระบบ" },
  { to: "/categories", label: "หมวดหมู่" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img src={logo} alt="Tradin" className="h-8 w-8 sm:h-10 sm:w-10 transition-transform group-hover:scale-110 rounded-full" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Tradin<span className="text-primary">.</span></span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.to}
              variant={location.pathname === link.to ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full"
              asChild
            >
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
          <div className="h-5 w-px bg-border/80 mx-2" />
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link to="/login">เข้าสู่ระบบ</Link>
          </Button>
          <Button size="sm" className="rounded-full eco-gradient px-5" asChild>
            <Link to="/register">สมัครสมาชิก</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background border-b border-border p-4 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Button key={link.to} variant="ghost" className="justify-start w-full" asChild onClick={() => setIsMenuOpen(false)}>
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
            <div className="h-px bg-border my-2" />
            <Button variant="outline" className="w-full" asChild onClick={() => setIsMenuOpen(false)}>
              <Link to="/login">เข้าสู่ระบบ</Link>
            </Button>
            <Button className="w-full eco-gradient" asChild onClick={() => setIsMenuOpen(false)}>
              <Link to="/register">สมัครสมาชิก</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
