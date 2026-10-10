
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  ArrowLeftRight,
  Bell,
  Package,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  AlertTriangle,
  X,
  User,
  Shield,
  Search,
  Home,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/logo.png";
import { getUnreadNotificationCount, getNotifications, IMAGE_BASE_URL } from "@/api/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationItem {
  NotificationID: number;
  MemberID: number;
  Message: string;
  Link: string;
  IsRead: number;
  CreateDate: string;
}

interface UserData {
  id?: string | number;
  displayName: string;
  photoURL: string;
  role?: string;
}

const navItems = [
  { to: "/feed", icon: Home, label: "หน้าหลัก" },
  { to: "/matching", icon: ArrowLeftRight, label: "จับคู่" },
  { to: "/my-posts", icon: Package, label: "ของฉัน" },
  { to: "/create-post", icon: Plus, label: "สร้างโพสต์" },
  { to: "/categories", icon: Grid3X3, label: "หมวดหมู่" },
];

const mobileNavItems = [
  { to: "/feed", icon: Home, label: "หน้าหลัก" },
  { to: "/matching", icon: ArrowLeftRight, label: "จับคู่" },
  { to: "/create-post", icon: Plus, label: "สร้างโพสต์" },
  { to: "/my-posts", icon: Package, label: "ของฉัน" },
  { to: "/profile", icon: User, label: "โปรไฟล์" },
  { to: "/categories", icon: Grid3X3, label: "หมวดหมู่" },
];

function getImageUrl(image?: string) {
  if (!image || image === "null" || image === "undefined") return "";

  return image.startsWith("http")
    ? image
    : `${IMAGE_BASE_URL}/uploads/${image}`;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const [notifCount, setNotifCount] = useState(0);
  const [bellSeenCount, setBellSeenCount] = useState(() =>
    Number(localStorage.getItem("bell_last_seen") || 0)
  );

  const [user, setUser] = useState<UserData | null>(null);
  const [quickNotifs, setQuickNotifs] = useState<NotificationItem[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();

      if (!res?.success) return;

      const totalUnread = Number(res.count || 0);
      const lastSeen = Number(localStorage.getItem("bell_last_seen") || 0);

      if (totalUnread < lastSeen) {
        localStorage.setItem("bell_last_seen", String(totalUnread));
        setBellSeenCount(totalUnread);
      }

      setNotifCount(totalUnread);
    } catch (error) {
      console.error("โหลดจำนวนแจ้งเตือนล้มเหลว:", error);
    }
  }, []);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");

    if (!savedUser) {
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      const image = parsedUser.ProfileImage || parsedUser.photoURL || "";

      setUser({
        id: parsedUser.MemberID || parsedUser.id,
        displayName:
          parsedUser.DisplayName || parsedUser.name || "ผู้ใช้",
        photoURL: getImageUrl(image),
        role:
          sessionStorage.getItem("role") ||
          parsedUser.Role ||
          parsedUser.role,
      });

      fetchNotifCount();
    } catch (error) {
      console.error("Failed to parse user data:", error);
      sessionStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate, fetchNotifCount]);

  useEffect(() => {
    window.addEventListener("notificationUpdate", fetchNotifCount);

    return () => {
      window.removeEventListener("notificationUpdate", fetchNotifCount);
    };
  }, [fetchNotifCount]);

  useEffect(() => {
    if (!user) return;

    const timer = setInterval(fetchNotifCount, 15000);

    return () => clearInterval(timer);
  }, [user, fetchNotifCount]);

  useEffect(() => {
    if (location.pathname === "/notifications" && notifCount > 0) {
      localStorage.setItem("bell_last_seen", String(notifCount));
      setBellSeenCount(notifCount);
    }
  }, [location.pathname, notifCount]);

  const displayNotifCount = Math.max(0, notifCount - bellSeenCount);

  const handleSearchSubmit = (value = searchInput) => {
    const search = value.trim();

    navigate(search ? `/feed?search=${encodeURIComponent(search)}` : "/feed");

    window.dispatchEvent(
      new CustomEvent("globalSearch", { detail: search })
    );
  };

  const handleBellClick = async () => {
    localStorage.setItem("bell_last_seen", String(notifCount));
    setBellSeenCount(notifCount);

    try {
      const res = await getNotifications();

      if (res?.success && Array.isArray(res.data)) {
        setQuickNotifs(res.data.slice(0, 5));
      } else {
        setQuickNotifs([]);
      }
    } catch (error) {
      console.error("โหลดรายการแจ้งเตือนล้มเหลว:", error);
    }
  };

  const getInitial = (name?: string) => {
    return name?.trim().charAt(0).toUpperCase() || "U";
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("bell_last_seen");

    setShowLogoutModal(false);
    navigate("/");
  };

  const formatMiniMessage = (message: string) => {
    if (!message) return "";

    try {
      const text = message.trim();

      if (text.startsWith("{") || text.startsWith("[")) {
        const data = JSON.parse(text);
        const sender = data.sender_name || data.SenderName;

        if (sender) {
          const senderItem = data.sender_item || data.SenderItemName || "";
          const myItem = data.my_item || data.MyItemName || "";

          return `${sender} ต้องการแลก ${senderItem} กับ ${myItem}`;
        }
      }
    } catch {
      // แสดงข้อความเดิมหากไม่ใช่ JSON
    }

    return message;
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white font-sans antialiased selection:bg-primary/20 selection:text-primary dark:bg-zinc-950">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 h-16 w-full border-b border-slate-200/80 bg-white/90 px-4 shadow-xs backdrop-blur-xl transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/90 md:px-6">
        <div className="mx-auto grid h-full w-full max-w-[1920px] grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          {/* Logo and Search */}
          <div className="z-10 flex items-center justify-start gap-2 sm:gap-3">
            <Link to="/feed" className="group flex shrink-0 items-center bg-transparent py-1">
              <img
                src={logo}
                alt="Tradin Logo"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-9"
              />
            </Link>

            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />

              <input
                type="text"
                placeholder="ค้นหาสิ่งของ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                }}
                className="h-9 w-32 rounded-full border-none bg-slate-100 pl-9 pr-8 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-zinc-800 dark:text-white sm:w-48 sm:text-sm md:w-60 lg:w-72"
              />

              {searchInput && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => {
                    setSearchInput("");
                    handleSearchSubmit("");
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center justify-center gap-1 justify-self-center md:flex lg:gap-2">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;

              return (
                <Link
                  key={to}
                  to={to}
                  className={`group relative flex h-11 w-24 items-center justify-center rounded-lg transition-colors duration-200 lg:w-32 ${
                    active
                      ? "bg-transparent text-primary"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />

                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-full bg-primary" />
                  )}

                  <span className="pointer-events-none absolute -bottom-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Header Actions */}
          <div className="z-10 flex items-center justify-end gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="เปลี่ยนธีม"
              className="h-9 w-9 rounded-full text-slate-600 transition-transform hover:bg-slate-200/60 hover:text-slate-600 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
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
                  type="button"
                  onClick={handleBellClick}
                  title="การแจ้งเตือน"
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                    location.pathname === "/notifications"
                      ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                  }`}
                >
                  <Bell className="h-[18px] w-[18px]" />

                  {displayNotifCount > 0 &&
                    location.pathname !== "/notifications" && (
                      <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-zinc-900" />
                      </span>
                    )}
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-0 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-900/95 sm:w-96"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      การแจ้งเตือน
                    </span>

                    {displayNotifCount > 0 && (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
                        {displayNotifCount} ใหม่
                      </span>
                    )}
                  </div>

                  <Link
                    to="/notifications"
                    onClick={() => setIsPopoverOpen(false)}
                    className="flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
                  >
                    ดูทั้งหมด
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto dark:divide-zinc-800">
                  {quickNotifs.length === 0 ? (
                    <div className="space-y-2 p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-800">
                        <Bell className="h-5 w-5 opacity-40" />
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้
                      </p>
                    </div>
                  ) : (
                    quickNotifs.map((item) => (
                      <button
                        type="button"
                        key={item.NotificationID}
                        onClick={() => {
                          setIsPopoverOpen(false);
                          if (item.Link) navigate(item.Link);
                        }}
                        className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 ${
                          item.IsRead === 0 ? "bg-primary/[0.04]" : ""
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            item.IsRead === 0
                              ? "bg-primary shadow-sm shadow-primary"
                              : "bg-transparent"
                          }`}
                        />

                        <span className="min-w-0 flex-1 space-y-1">
                          <span
                            className={`block text-xs leading-relaxed ${
                              item.IsRead === 0
                                ? "font-bold text-slate-900 dark:text-white"
                                : "text-slate-600 dark:text-zinc-400"
                            }`}
                          >
                            {formatMiniMessage(item.Message)}
                          </span>

                          <span className="block text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                            {new Date(item.CreateDate).toLocaleString("th-TH", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="mx-1 hidden h-4 w-px bg-slate-200 dark:bg-zinc-800 sm:block" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2.5 rounded-full border border-transparent p-1 pr-2.5 outline-none transition-all hover:border-slate-200 hover:bg-slate-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800">
                  <div className="relative">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="รูปโปรไฟล์"
                        className="h-8 w-8 rounded-full object-cover shadow-xs ring-2 ring-primary/20 transition-all group-hover:ring-primary/40"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/70 text-xs font-black text-primary-foreground shadow-xs ring-2 ring-primary/20">
                        {getInitial(user?.displayName)}
                      </div>
                    )}

                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                  </div>

                  <span className="hidden max-w-[90px] truncate text-xs font-bold text-slate-900 dark:text-white md:block">
                    {user?.displayName || "ผู้ใช้งาน"}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-1 border-b border-slate-100 px-3 py-2 dark:border-zinc-800">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {user?.displayName}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    ระบบจัดการสิ่งของ
                  </p>
                </div>

                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 transition-all focus:bg-slate-100 focus:text-slate-900 dark:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  โปรไฟล์ของฉัน
                </DropdownMenuItem>

                {user?.role === "admin" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-primary transition-all focus:bg-slate-100 dark:focus:bg-zinc-800"
                  >
                    <Shield className="h-4 w-4" />
                    จัดการระบบ (Admin)
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-zinc-800" />

                <DropdownMenuItem
                  onClick={() => setShowLogoutModal(true)}
                  className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition-all focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto w-full max-w-[1600px] flex-1 animate-in px-4 pb-28 pt-24 fade-in duration-300 sm:px-6 sm:pt-28 md:px-10 lg:pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto hidden border-t border-slate-200/60 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 lg:block">
        <div className="mx-auto max-w-[1600px] px-10 py-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-zinc-500">
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="Tradin"
                className="h-5 w-auto object-contain grayscale opacity-60"
              />
              <span>
                Tradin Platform &bull; Item Circulation &amp; Barter Ecosystem
              </span>
            </div>

            <p>&copy; {new Date().getFullYear()} Tradin. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-5 left-4 right-4 z-50 lg:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around rounded-full border border-slate-200/80 bg-white/85 px-2 shadow-2xl shadow-black/15 backdrop-blur-2xl dark:border-zinc-800/80 dark:bg-zinc-900/90">
          {mobileNavItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;

            return (
              <Link
                key={to}
                to={to}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 ${
                  active
                    ? "scale-105 font-bold text-primary"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-400 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium tracking-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in duration-200"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative w-full max-w-sm animate-in overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="ปิดหน้าต่างยืนยัน"
              onClick={() => setShowLogoutModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center space-y-4 pt-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-inner">
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h3
                  id="logout-title"
                  className="text-lg font-black tracking-tight text-slate-900 dark:text-white"
                >
                  ออกจากระบบหรือไม่?
                </h3>
                <p className="px-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  คุณกำลังจะออกจากระบบ Tradin หากต้องการใช้งานต่อ
                  คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                </p>
              </div>

              <div className="flex w-full items-center gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutModal(false)}
                  className="h-10 flex-1 rounded-xl border-border/60 text-xs font-bold text-foreground transition-all hover:bg-slate-200/60 hover:text-foreground dark:hover:bg-zinc-800/60"
                >
                  ยกเลิก
                </Button>

                <Button
                  onClick={confirmLogout}
                  className="h-11 flex-1 rounded-2xl bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95"
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