
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
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#hero");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      if (location.pathname !== "/") return;

      const scrollPosition = window.scrollY + 250;

      for (const link of NAV_LINKS) {
        const element = document.querySelector<HTMLElement>(link.to);

        if (
          element &&
          scrollPosition >= element.offsetTop &&
          scrollPosition < element.offsetTop + element.offsetHeight
        ) {
          setActiveSection(link.to);
          break;
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const element = document.querySelector(location.hash);

    if (element) {
      setActiveSection(location.hash);
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.pathname, location.hash]);

  const handleNavClick = (to: string) => {
    setIsMenuOpen(false);
    setActiveSection(to);

    if (location.pathname !== "/") {
      navigate(`/${to}`);
      return;
    }

    document.querySelector(to)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = (active: boolean) =>
    `group relative cursor-pointer rounded-lg border-none bg-transparent px-4 py-2 text-sm font-semibold tracking-wide transition-colors hover:bg-slate-200/60 dark:hover:bg-zinc-800 ${
      active
        ? "text-black dark:text-white"
        : "text-neutral-900 dark:text-zinc-300"
    }`;

  const buttonHoverClass =
    "hover:bg-slate-200/60 hover:text-neutral-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "border-border/80 shadow-sm" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-8 lg:gap-10">
            <button
              type="button"
              onClick={() => handleNavClick("#hero")}
              className="group flex shrink-0 cursor-pointer items-center border-none bg-transparent py-1"
              aria-label="กลับไปหน้าแรก"
            >
              <img
                src={logo}
                alt="Tradin Logo"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-9"
              />
            </button>

            <nav className="hidden items-center gap-1 md:flex lg:gap-2">
              {NAV_LINKS.map((link) => {
                const active = activeSection === link.to;

                return (
                  <button
                    key={link.to}
                    type="button"
                    onClick={() => handleNavClick(link.to)}
                    className={navLinkClass(active)}
                  >
                    {link.label}

                    <span
                      className={`absolute bottom-0 left-4 right-4 h-[3px] origin-center rounded-full bg-primary transition-all duration-300 ease-out ${
                        active
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Account Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={`h-10 gap-2 px-4 text-sm font-semibold text-neutral-900 transition-colors dark:text-zinc-200 ${buttonHoverClass}`}
            >
              <Link to="/login">
                <User size={18} />
                เข้าสู่ระบบ
              </Link>
            </Button>

            <div className="h-5 w-px bg-border/80" />

            <Button
              size="sm"
              asChild
              className="h-10 rounded-full px-6 text-sm font-bold shadow-sm transition-all hover:shadow"
            >
              <Link to="/register">สมัครสมาชิก</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={isMenuOpen}
            className={`cursor-pointer rounded-xl p-2.5 text-neutral-900 transition-colors dark:text-zinc-200 ${buttonHoverClass} md:hidden`}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-full animate-in border-b border-border bg-white p-4 shadow-xl fade-in-80 slide-in-from-top-2 dark:bg-zinc-900 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => handleNavClick(link.to)}
                className={`rounded-xl border-none bg-transparent px-4 py-3 text-left text-sm font-semibold transition-colors ${buttonHoverClass}`}
              >
                {link.label}
              </button>
            ))}

            <div className="my-2 h-px bg-border" />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                asChild
                className={`h-11 w-full gap-2 rounded-xl font-semibold text-neutral-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${buttonHoverClass}`}
              >
                <Link to="/login" onClick={closeMenu}>
                  <User size={16} />
                  เข้าสู่ระบบ
                </Link>
              </Button>

              <Button
                asChild
                className="h-11 w-full rounded-xl font-bold shadow-sm"
              >
                <Link to="/register" onClick={closeMenu}>
                  สมัครสมาชิก
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export { Navbar };