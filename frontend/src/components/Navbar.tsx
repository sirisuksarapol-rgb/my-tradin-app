import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import logo from "@/assets/logo.png";

const NAV_LINKS = [
  { to: "#hero", label: "หน้าแรก" },
  { to: "#categories", label: "หมวดหมู่" },
  { to: "#about", label: "ภาพรวมระบบ" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#hero");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      const scrollPosition = window.scrollY + 250;
      for (const link of NAV_LINKS) {
        const element = document.querySelector(link.to);
        if (element) {
          const top = (element as HTMLElement).offsetTop;
          const height = (element as HTMLElement).offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(link.to);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (to: string) => {
    setIsMenuOpen(false);
    setActiveSection(to);
    if (location.pathname !== "/") {
      window.location.href = "/" + to;
    } else {
      const element = document.querySelector(to);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/40 transition-all duration-300 ${scrolled ? "shadow-sm border-border/80" : ""}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8 lg:gap-10">
            <button 
              onClick={() => handleNavClick("#hero")} 
              className="flex items-center shrink-0 group py-1 bg-transparent border-none cursor-pointer"
            >
              <img 
                src={logo} 
                alt="Tradin Logo" 
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </button>

            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.to;
                return (
                  <button
                    key={link.to}
                    onClick={() => handleNavClick(link.to)}
                    className={`group relative px-4 py-2 text-sm font-semibold tracking-wide transition-colors cursor-pointer bg-transparent border-none ${isActive ? "text-primary" : "text-neutral-900 hover:text-primary"}`}
                  >
                    <span>{link.label}</span>
                    <span className={`absolute bottom-0 left-4 right-4 h-[3px] bg-primary rounded-full transition-all duration-300 ease-out origin-center ${isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="font-semibold text-sm text-neutral-900 hover:text-primary hover:bg-muted/50 gap-2 h-10 px-4 transition-colors" 
              asChild
            >
              <Link to="/login">
                <User size={18} />
                เข้าสู่ระบบ
              </Link>
            </Button>

            <div className="h-5 w-[1px] bg-border/80" />

            <Button 
              size="sm" 
              className="font-bold text-sm px-6 h-10 rounded-full shadow-sm hover:shadow transition-all" 
              asChild
            >
              <Link to="/register">สมัครสมาชิก</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2.5 text-neutral-900 hover:bg-muted rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Mobile Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-xl border-b border-border shadow-xl p-4 animate-in fade-in-80 slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.to}
                onClick={() => handleNavClick(link.to)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-neutral-900 hover:bg-muted/50 text-left cursor-pointer bg-transparent border-none"
              >
                {link.label}
              </button>
            ))}
            <div className="h-px bg-border my-2" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="outline" className="w-full font-semibold text-neutral-900 h-11 rounded-xl gap-2" asChild onClick={() => setIsMenuOpen(false)}>
                <Link to="/login">
                  <User size={16} />
                  เข้าสู่ระบบ
                </Link>
              </Button>
              <Button className="w-full font-bold h-11 rounded-xl shadow-sm" asChild onClick={() => setIsMenuOpen(false)}>
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export { Navbar };