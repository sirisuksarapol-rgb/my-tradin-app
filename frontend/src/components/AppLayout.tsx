import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  PlusCircle,
  ArrowLeftRight,
  Bell,
  Package,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/logo.png";
import { getUnreadNotificationCount, IMAGE_BASE_URL } from "@/api/api"; // 💡 เปลี่ยนมาดึง API จริง

const navItems = [
  { to: "/feed", icon: Home, label: "หน้าหลัก" },
  { to: "/create-post", icon: PlusCircle, label: "โพสต์" },
  { to: "/my-posts", icon: Package, label: "ของฉัน" },
  { to: "/matching", icon: ArrowLeftRight, label: "จับคู่" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [notifCount, setNotifCount] = useState(0);
  const [user, setUser] = useState<{
    id?: string | number;
    displayName: string;
    photoURL: string;
  } | null>(null);

  // ฟังก์ชันยิงเรียกนับจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res && res.success) {
        setNotifCount(res.count);
      }
    } catch (error) {
      console.error("โหลดจำนวนแจ้งเตือนล้มเหลว:", error);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      const BACKEND_URL = `${IMAGE_BASE_URL}/uploads/`;
      let imageUrl = "";

      if (parsedUser.ProfileImage) {
        imageUrl = parsedUser.ProfileImage.startsWith("http")
          ? parsedUser.ProfileImage
          : `${BACKEND_URL}${parsedUser.ProfileImage}`;
      } else {
        imageUrl = parsedUser.photoURL || "";
      }

      setUser({
        id: parsedUser.MemberID || parsedUser.id,
        displayName: parsedUser.DisplayName || parsedUser.name || "ผู้ใช้",
        photoURL: imageUrl,
      });

      // ดึงข้อมูลจำนวนแจ้งเตือนจริงจากหลังบ้าน
      fetchNotifCount();
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [location.pathname, navigate, fetchNotifCount]);

  // คอยรับสัญญาณ Event สั่งลด/เพิ่ม ตัวเลขบนกระดิ่งแบบไม่ต้อง refresh หน้าจอ
  useEffect(() => {
    window.addEventListener("notificationUpdate", fetchNotifCount);
    return () =>
      window.removeEventListener("notificationUpdate", fetchNotifCount);
  }, [fetchNotifCount]);

  const getInitial = (name?: string) => {
    if (!name || name.trim() === "") return "U";
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-8 xl:px-12 h-16 max-w-[2000px] mx-auto w-full">
          {/* Left: Logo */}
          <Link to="/feed" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="Tradin"
              className="h-8 w-8 rounded-lg transition-transform group-hover:scale-105"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold font-display text-foreground tracking-tight hidden sm:block">
              Tradin<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors duration-200 
                    ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className={`h-4 w-4 ${active ? "" : "opacity-70"}`} />
                  <span>{label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full transition-all duration-300" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Notification */}
            <Link
              to="/notifications"
              className="relative flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              title="การแจ้งเตือน"
            >
              <Bell className="h-5 w-5" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background animate-pulse">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:block h-6 w-px bg-border mx-1" />

            {/* Profile */}
            <Link
              to="/profile"
              className="flex items-center gap-2 group p-1 pr-2 rounded-full hover:bg-muted transition-colors"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent transition-all group-hover:ring-primary/50"
                  loading="lazy"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-transparent transition-all group-hover:ring-primary/50">
                  {getInitial(user?.displayName)}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-foreground transition-colors">
                {user?.displayName || "ไม่ได้ล็อกอิน"}
              </span>
            </Link>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive rounded-full ml-1 hover:bg-muted"
              title="ออกจากระบบ"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-6 pb-24 lg:pb-8 animate-fade-in">
        {children}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden lg:block border-t border-border mt-auto bg-background">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="Tradin"
                className="h-5 w-5 rounded grayscale opacity-70"
                width={20}
                height={20}
              />
              <span>Tradin Platform</span>
            </div>
            <p>© {new Date().getFullYear()} Tradin. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background border-t border-border pb-safe">
        <div className="flex items-center justify-around px-2 max-w-md mx-auto h-16">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200 
                  ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium`}>{label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full transition-all duration-300" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
