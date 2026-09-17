import { useState, useEffect, useCallback } from "react";
import { Link, useLocation,
  useNavigate, useSearchParams } from "react-router-dom";
import { Plus, ArrowLeftRight, Bell, Package, Sun, Moon, LogOut, ChevronRight, AlertTriangle, X, User, Shield, Search, Home, Grid3X3, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/logo.png";
import { getUnreadNotificationCount, getNotifications, IMAGE_BASE_URL } from "@/api/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  { to: "/create-post", icon: Plus, label: "สร้างโพสต์" },
  { to: "/categories", icon: Grid3X3, label: "หมวดหมู่" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [notifCount, setNotifCount] = useState(0);
  const [bellSeenCount, setBellSeenCount] = useState<number>(() => {
    return Number(localStorage.getItem("bell_last_seen") || 0); // 💡 คง localStorage ไว้
  });

  const [user, setUser] = useState<{
    id?: string | number;
    displayName: string;
    photoURL: string;
    role?: string;
  } | null>(null);

  const [quickNotifs, setQuickNotifs] = useState<NotificationItem[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      navigate(`/feed?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate(`/feed`);
    }
    window.dispatchEvent(
      new CustomEvent("globalSearch", { detail: searchInput.trim() }),
    );
  };

  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res && res.success) {
        const totalUnread = res.count;
        const lastSeen = Number(localStorage.getItem("bell_last_seen") || 0); // 💡 คง localStorage ไว้
        if (totalUnread < lastSeen) {
          localStorage.setItem("bell_last_seen", String(totalUnread)); // 💡 คง localStorage ไว้
          setBellSeenCount(totalUnread);
        }
        setNotifCount(totalUnread);
      }
    } catch (error) {
      console.error("โหลดจำนวนแจ้งเตือนล้มเหลว:", error);
    }
  }, []);

  useEffect(() => {
    // ⚠️ เปลี่ยนเป็น sessionStorage
    const savedUser = sessionStorage.getItem("user");
    const userRole = sessionStorage.getItem("role");

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
        role: userRole || parsedUser.Role,
      });

      fetchNotifCount();
    } catch (error) {
      console.error("Failed to parse user data:", error);
      sessionStorage.removeItem("user"); // ⚠️ เปลี่ยนเป็น sessionStorage
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
      localStorage.setItem("bell_last_seen", String(notifCount)); // 💡 คง localStorage ไว้
      setBellSeenCount(notifCount);
    }
  }, [location.pathname, notifCount]);

  const displayNotifCount = Math.max(0, notifCount - bellSeenCount);

  const handleBellClick = async () => {
    localStorage.setItem("bell_last_seen", String(notifCount)); // 💡 คง localStorage ไว้
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

  const confirmLogout = () => {
    // ⚠️ เคลียร์ Session เฉพาะของแท็บนี้
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    
    // เคลียร์ค่าการแจ้งเตือนส่วนกลาง
    localStorage.removeItem("bell_last_seen");
    
    setShowLogoutModal(false);
    navigate("/");
  };

  const formatMiniMessage = (msg: string) => {
    if (!msg) return "";
    try {
      if (msg.trim().startsWith("{") || msg.trim().startsWith("[")) {
        const parsed = JSON.parse(msg);
        if (parsed.sender_name || parsed.SenderName) {
          const sender = parsed.sender_name || parsed.SenderName;
          const sItem = parsed.sender_item || parsed.SenderItemName;
          const myItem = parsed.my_item || parsed.MyItemName;
          return `${sender} ต้องการแลก ${sItem} กับ ${myItem}`;
        }
      }
    } catch {
      // ข้ามกรณีไม่ใช่ JSON ปกติ
    }
    return msg;
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50/50 dark:bg-zinc-950 selection:bg-primary/20 selection:text-primary font-sans antialiased overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[800px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-[120px] opacity-70 dark:opacity-30 rounded-full" />
      </div>

      {/* Responsive Header Layout */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border-b border-slate-200/80 dark:border-zinc-800 shadow-xs h-16 px-4 md:px-6 transition-all duration-300">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-full max-w-[1920px] mx-auto w-full gap-2 sm:gap-4">
          {/* Left Section: Logo & Search Bar */}
          <div className="flex items-center gap-2 sm:gap-3 justify-start z-10">
            <Link
              to="/feed"
              className="flex items-center shrink-0 group py-1 bg-transparent border-none cursor-pointer"
            >
              <img
                src={logo}
                alt="Tradin Logo"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-32 sm:w-48 md:w-60 lg:w-72 h-9 pl-9 pr-8 rounded-full bg-slate-100 dark:bg-zinc-800 border-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="ค้นหาสิ่งของ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                }}
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    handleSearchSubmit();
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Center Section: Nav Tabs */}
          <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-2 justify-self-center">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`group relative flex items-center justify-center w-24 lg:w-32 h-11 rounded-lg transition-colors duration-200 ${
                    active
                      ? "bg-transparent text-primary"
                      : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-primary rounded-t-full" />
                  )}
                  {/* Facebook-style Hover Tooltip */}
                  <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-800 text-white text-[10px] font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Actions & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-transform active:scale-90"
              title="เปลี่ยนธีม"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </Button>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  onClick={handleBellClick}
                  className={`relative flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 active:scale-90 ${
                    location.pathname === "/notifications"
                      ? "text-primary bg-primary/10 ring-2 ring-primary/30"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                  title="การแจ้งเตือน"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {displayNotifCount > 0 &&
                    location.pathname !== "/notifications" && (
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-2 ring-white dark:ring-zinc-900"></span>
                      </span>
                    )}
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 sm:w-96 p-0 shadow-2xl rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl mt-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                align="end"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
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
                    className="text-xs text-primary hover:underline font-bold flex items-center gap-0.5"
                    onClick={() => setIsPopoverOpen(false)}
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                  {quickNotifs.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
                        <Bell className="h-5 w-5 opacity-40" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
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
                        className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-3 items-start ${item.IsRead === 0 ? "bg-primary/[0.04]" : ""}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.IsRead === 0 ? "bg-primary shadow-sm shadow-primary" : "bg-transparent"}`}
                        />
                        <div className="space-y-1 flex-1">
                          <p
                            className={`text-xs leading-relaxed ${item.IsRead === 0 ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-400"}`}
                          >
                            {formatMiniMessage(item.Message)}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium block">
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

            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 group outline-none">
                  <div className="relative">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="avatar"
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20 shadow-xs group-hover:ring-primary/40 transition-all"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center text-xs font-black text-primary-foreground ring-2 ring-primary/20 shadow-xs">
                        {getInitial(user?.displayName)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                  </div>
                  <span className="hidden md:block text-xs font-bold text-slate-900 dark:text-white max-w-[90px] truncate">
                    {user?.displayName || "ผู้ใช้งาน"}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-2"
                align="end"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.displayName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    ระบบจัดการสิ่งของ
                  </p>
                </div>

                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer gap-2.5 text-slate-900 dark:text-zinc-100 focus:bg-slate-100 dark:focus:bg-zinc-800 focus:text-slate-900 dark:focus:text-white transition-all"
                >
                  <User className="h-4 w-4 text-slate-500" /> โปรไฟล์ของฉัน
                </DropdownMenuItem>

                {user?.role === "admin" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer gap-2.5 text-primary focus:bg-slate-100 dark:focus:bg-zinc-800 transition-all"
                  >
                    <Shield className="h-4 w-4" /> จัดการระบบ (Admin)
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-zinc-800" />

                <DropdownMenuItem
                  onClick={() => setShowLogoutModal(true)}
                  className="rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer gap-2.5 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-600 dark:focus:text-red-400 transition-all"
                >
                  <LogOut className="h-4 w-4" /> ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-24 sm:pt-28 pb-28 lg:pb-12 animate-in fade-in duration-300">
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer className="hidden lg:block border-t border-slate-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-10 py-6">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-500 font-medium">
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="Tradin"
                className="h-5 w-auto object-contain grayscale opacity-60"
              />
              <span>
                Tradin Platform &bull; Item Circulation & Barter Ecosystem
              </span>
            </div>
            <p>
              &copy; {new Date().getFullYear()} Tradin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Dock - Modern Redesign */}
<nav className="fixed bottom-5 left-4 right-4 z-50 lg:hidden">
  <div className="max-w-md mx-auto h-16 bg-white/85 dark:bg-zinc-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-zinc-800/80 rounded-full shadow-2xl shadow-black/15 flex items-center justify-around px-2 relative">
    
    {/* หน้าหลัก */}
    <Link
      to="/feed"
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
        location.pathname === "/feed" 
          ? "text-primary font-bold scale-105" 
          : "text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <Home className="h-5 w-5" />
      <span className="text-[10px] mt-0.5 font-medium tracking-tight">หน้าหลัก</span>
    </Link>

    {/* จับคู่ */}
    <Link
      to="/matching"
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
        location.pathname === "/matching" 
          ? "text-primary font-bold scale-105" 
          : "text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <ArrowLeftRight className="h-5 w-5" />
      <span className="text-[10px] mt-0.5 font-medium tracking-tight">จับคู่</span>
    </Link>

    {/* ปุ่มสร้างโพสต์ (Floating Center Button) */}
    <Link
      to="/create-post"
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
        location.pathname === "/create-post" 
          ? "text-primary font-bold scale-105" 
          : "text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <Plus className="h-5 w-5" />
      <span className="text-[10px] mt-0.5 font-medium tracking-tight">ของฉัน</span>
    </Link>

    {/* ของฉัน */}
    <Link
      to="/my-posts"
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
        location.pathname === "/my-posts" 
          ? "text-primary font-bold scale-105" 
          : "text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <Package className="h-5 w-5" />
      <span className="text-[10px] mt-0.5 font-medium tracking-tight">ของฉัน</span>
    </Link>

    {/* โปรไฟล์ */}
    <Link
      to="/profile"
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
        location.pathname === "/profile" 
          ? "text-primary font-bold scale-105" 
          : "text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <User className="h-5 w-5" />
      <span className="text-[10px] mt-0.5 font-medium tracking-tight">โปรไฟล์</span>
    </Link>

    {/* หมวดหมู่ */}
    <Link
      to="/Categories"
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
        location.pathname === "/Categories" 
          ? "text-primary font-bold scale-105" 
          : "text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <Grid3X3 className="h-5 w-5" />
      <span className="text-[10px] mt-0.5 font-medium tracking-tight">หมวดหมู่</span>
    </Link>

  </div>
</nav>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  ออกจากระบบหรือไม่?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed px-2">
                  คุณกำลังจะออกจากระบบ Tradin หากต้องการใช้งานต่อ
                  คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                </p>
              </div>

              <div className="flex items-center gap-3 w-full pt-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-10 text-xs font-bold"
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