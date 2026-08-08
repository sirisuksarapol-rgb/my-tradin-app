import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Plus,
  ArrowLeftRight,
  Bell,
  Package,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/logo.png";
import {
  getUnreadNotificationCount,
  getNotifications,
  IMAGE_BASE_URL,
} from "@/api/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NotificationItem {
  NotificationID: number;
  MemberID: number;
  Message: string;
  Link: string;
  IsRead: number;
  CreateDate: string;
  SenderName?: string;
  SenderItemName?: string;
  MyItemName?: string;
}

const navItems = [
  { to: "/feed", icon: Home, label: "หน้าหลัก" },
  { to: "/matching", icon: ArrowLeftRight, label: "จับคู่" },
  { to: "/my-posts", icon: Package, label: "ของฉัน" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [notifCount, setNotifCount] = useState(0);
  const [bellSeenCount, setBellSeenCount] = useState<number>(() => {
    return Number(localStorage.getItem("bell_last_seen") || 0);
  });

  const [user, setUser] = useState<{
    id?: string | number;
    displayName: string;
    photoURL: string;
  } | null>(null);

  const [quickNotifs, setQuickNotifs] = useState<NotificationItem[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 🟢 State สำหรับเปิด/ปิด Logout Confirmation Dialog
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res && res.success) {
        const totalUnread = res.count;
        const lastSeen = Number(localStorage.getItem("bell_last_seen") || 0);

        if (totalUnread < lastSeen) {
          localStorage.setItem("bell_last_seen", String(totalUnread));
          setBellSeenCount(totalUnread);
        }

        setNotifCount(totalUnread);
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

      fetchNotifCount();
    } catch (error) {
      console.error("Failed to parse user data:", error);
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [location.pathname, navigate, fetchNotifCount]);

  useEffect(() => {
    window.addEventListener("notificationUpdate", fetchNotifCount);
    return () =>
      window.removeEventListener("notificationUpdate", fetchNotifCount);
  }, [fetchNotifCount]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchNotifCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, fetchNotifCount]);

  useEffect(() => {
    if (location.pathname === "/notifications" && notifCount > 0) {
      localStorage.setItem("bell_last_seen", String(notifCount));
      setBellSeenCount(notifCount);
    }
  }, [location.pathname, notifCount]);

  const displayNotifCount = Math.max(0, notifCount - bellSeenCount);

  const handleBellClick = async () => {
    localStorage.setItem("bell_last_seen", String(notifCount));
    setBellSeenCount(notifCount);

    try {
      const res = await getNotifications();
      if (res && res.success) {
        setQuickNotifs(res.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching quick notifications", err);
    }
  };

  const getInitial = (name?: string) => {
    if (!name || name.trim() === "") return "U";
    return name.charAt(0).toUpperCase();
  };

  // 🟢 ฟังก์ชัน Logout จริงที่จะทำงานหลังผู้ใช้ยืนยันผ่าน Modal
  const confirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("bell_last_seen");
    setShowLogoutModal(false);
    navigate("/");
  };

  const formatMiniMessage = (msg: string) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.sender_name || parsed.SenderName) {
        const sender = parsed.sender_name || parsed.SenderName;
        const sItem = parsed.sender_item || parsed.SenderItemName;
        const myItem = parsed.my_item || parsed.MyItemName;
        return `${sender} ต้องการแลก ${sItem} กับ ${myItem}`;
      }
    } catch {
      // ไม่ใช่ JSON ปล่อยผ่าน
    }
    return msg;
  };

  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20 selection:text-primary font-sans antialiased overflow-x-hidden">
      {/* 🌟 Background Ambient Lighting (เพิ่มฟีลพรีเมียม ไฮเทค) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[350px] w-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl opacity-60 dark:opacity-30 rounded-full" />
      </div>

      {/* 🌟 Desktop & Mobile Top Modern Glassmorphism Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-background/60 border-b border-border/30 transition-all duration-300">
        <div className="flex items-center justify-between px-4 sm:px-8 md:px-12 h-16 max-w-[1800px] mx-auto w-full">
          {/* Brand Logo */}
          <Link
            to="/feed"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-primary/5 border border-primary/30 shadow-sm shadow-primary/10 transition-transform duration-300 group-hover:scale-105 active:scale-95">
              <img
                src={logo}
                alt="Tradin"
                className="h-6 w-6 rounded-xl object-cover"
                width={24}
                height={24}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-foreground font-display leading-none flex items-center gap-0.5">
                Tradin<span className="text-primary">.</span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
                Exchange Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (Floating Pill with Soft Glow) */}
          <nav className="hidden lg:flex items-center gap-1 bg-muted/30 p-1.5 rounded-full border border-border/40 backdrop-blur-md shadow-inner">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                    active
                      ? "bg-background text-primary shadow-md shadow-primary/5 ring-1 ring-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-300 ${active ? "scale-110 text-primary" : "opacity-70"}`}
                  />
                  <span>{label}</span>
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-primary rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* CTA: Create Post Button (Desktop Only) */}
            <Link to="/create-post" className="hidden sm:flex">
              <Button
                size="sm"
                className="h-9 px-4 rounded-full font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 active:scale-95 gap-1.5 border border-primary/20"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>ลงประกาศใหม่</span>
              </Button>
            </Link>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/60 transition-transform active:scale-90"
              title="เปลี่ยนธีม"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </Button>

            {/* Notification Popover */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={handleBellClick}
                  className={`relative flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 active:scale-90 ${
                    location.pathname === "/notifications"
                      ? "text-primary bg-primary/10 ring-2 ring-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="การแจ้งเตือน"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {displayNotifCount > 0 &&
                    location.pathname !== "/notifications" && (
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-2 ring-background"></span>
                      </span>
                    )}
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 sm:w-96 p-0 shadow-2xl rounded-3xl border border-border/60 bg-background/95 backdrop-blur-2xl mt-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                align="end"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground">
                      การแจ้งเตือน
                    </span>
                    {displayNotifCount > 0 && (
                      <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full border border-primary/20">
                        {displayNotifCount} ใหม่
                      </span>
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    className="text-xs text-primary hover:opacity-80 font-bold flex items-center gap-0.5 transition-opacity"
                    onClick={() => setIsPopoverOpen(false)}
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-border/30">
                  {quickNotifs.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground border border-border/40">
                        <Bell className="h-5 w-5 opacity-40" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้
                      </p>
                    </div>
                  ) : (
                    quickNotifs.map((item) => (
                      <div
                        key={item.NotificationID}
                        onClick={() => {
                          setIsPopoverOpen(false);
                          if (item.Link) navigate(item.Link);
                        }}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3 items-start ${
                          item.IsRead === 0 ? "bg-primary/[0.04]" : ""
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.IsRead === 0 ? "bg-primary shadow-sm shadow-primary" : "bg-transparent"}`}
                        />
                        <div className="space-y-1 flex-1">
                          <p
                            className={`text-xs leading-relaxed ${item.IsRead === 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}
                          >
                            {formatMiniMessage(item.Message)}
                          </p>
                          <span className="text-[10px] text-muted-foreground/70 font-medium block">
                            {new Date(item.CreateDate).toLocaleString("th-TH", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="hidden sm:block h-4 w-px bg-border/40 mx-1" />

            {/* Profile Widget */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-muted/60 transition-all border border-transparent hover:border-border/40 group"
            >
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20 shadow-xs group-hover:ring-primary/40 transition-all"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center text-xs font-black text-primary-foreground ring-2 ring-primary/20 shadow-xs">
                    {getInitial(user?.displayName)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-background" />
              </div>
              <span className="hidden md:block text-xs font-bold text-foreground max-w-[100px] truncate">
                {user?.displayName || "ผู้ใช้งาน"}
              </span>
            </Link>

            {/* Logout Trigger Button (จะเปิด Modal ไม่หลุดทันที) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLogoutModal(true)}
              className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 🟢 Main Content Viewport */}
      <main className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-6 pb-28 lg:pb-10 animate-in fade-in duration-300">
        {children}
      </main>

      {/* 🏢 Footer (Desktop) */}
      <footer className="hidden lg:block border-t border-border/30 bg-background/40 backdrop-blur-md mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-10 py-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="Tradin"
                className="h-4 w-4 rounded grayscale opacity-50"
                width={16}
                height={16}
              />
              <span>Tradin Platform &bull; Barter & Exchange Ecosystem</span>
            </div>
            <p>© {new Date().getFullYear()} Tradin. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 📱 Mobile Modern Floating Dock (UX Level: God Tier) */}
      <nav className="fixed bottom-5 left-4 right-4 z-50 lg:hidden">
        <div className="max-w-md mx-auto h-16 bg-background/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl shadow-black/20 flex items-center justify-between px-4 relative ring-1 ring-border/30">
          {/* Feed Link */}
          <Link
            to="/feed"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
              location.pathname === "/feed"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 font-bold">หน้าหลัก</span>
          </Link>

          {/* Matching Link */}
          <Link
            to="/matching"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
              location.pathname === "/matching"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 font-bold">จับคู่</span>
          </Link>

          {/* 🌟 Center Elevated Floating Action (Create Post) */}
          <Link
            to="/create-post"
            className="flex items-center justify-center -mt-6 group focus:outline-none"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 ring-4 ring-background transform group-active:scale-90 transition-transform">
              <Plus className="h-6 w-6 stroke-[3]" />
            </div>
          </Link>

          {/* My Posts Link */}
          <Link
            to="/my-posts"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
              location.pathname === "/my-posts"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 font-bold">ของฉัน</span>
          </Link>

          {/* Profile / Notifications Link */}
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${
              location.pathname === "/profile"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 font-bold">โปรไฟล์</span>
          </Link>
        </div>
      </nav>

      {/* 🔴 Modern Logout Confirmation Modal (ปุ่มออกจากระบบจะถามก่อนออกเสมอ) */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/60 bg-background/95 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow เตือนภัย */}
            <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-destructive/15 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              {/* Animated Danger Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight text-foreground">
                  ออกจากระบบหรือไม่?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  คุณกำลังจะออกจากระบบ Tradin หากต้องการใช้งานต่อ
                  คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                </p>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-3 w-full pt-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-10 text-xs font-bold whitespace-nowrap"
                  onClick={() => setShowLogoutModal(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1 rounded-2xl h-11 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  onClick={confirmLogout}
                >
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
