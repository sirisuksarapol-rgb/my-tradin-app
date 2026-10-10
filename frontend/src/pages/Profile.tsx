
import { useState, useEffect, type ComponentType } from "react";
import {
  Star,
  ArrowRightLeft,
  HelpCircle,
  LogOut,
  UserCog,
  ChevronRight,
  AlertTriangle,
  Package,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { getUserStats, getItems, IMAGE_BASE_URL } from "@/api/api";

interface ProfileUser {
  MemberID?: number;
  DisplayName?: string;
  Email?: string;
  ProfileImage?: string;
  id?: number;
  name?: string;
  email?: string;
  avatar?: string;
}

interface MenuButtonProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  subLabel?: string;
  onClick: () => void;
}

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    exchanges: 0,
    rating: "0.0",
    reviews: 0,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");

    if (!savedUser) {
      navigate("/");
      return;
    }

    const loadProfile = async () => {
      try {
        const parsedUser = JSON.parse(savedUser) as ProfileUser;

        let avatar = parsedUser.ProfileImage || parsedUser.avatar || "";

        if (parsedUser.ProfileImage && !parsedUser.ProfileImage.startsWith("http")) {
          avatar = `${IMAGE_BASE_URL}/uploads/${parsedUser.ProfileImage}`;
        }

        const mappedUser: ProfileUser = {
          ...parsedUser,
          id: parsedUser.MemberID || parsedUser.id,
          name: parsedUser.DisplayName || parsedUser.name || "ผู้ใช้งาน",
          email: parsedUser.Email || parsedUser.email || "ไม่มีข้อมูลอีเมล",
          avatar,
        };

        setUser(mappedUser);

        if (!mappedUser.id) return;

        const itemsRes = await getItems();
        const items = itemsRes?.data || [];

        const myItems = items.filter(
          (item: { MemberID?: number | string; member_id?: number | string }) =>
            String(item.MemberID || item.member_id) === String(mappedUser.id)
        );

        const statsRes = await getUserStats(mappedUser.id);
        const statsData = statsRes?.success ? statsRes.data : null;

        setStats({
          totalItems: myItems.length,
          exchanges: statsData?.successfulExchanges || 0,
          rating: statsData?.reviewScore || "0.0",
          reviews: statsData?.reviews?.length || 0,
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
        sessionStorage.removeItem("user");
        navigate("/");
      }
    };

    loadProfile();
  }, [navigate]);

  const performLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-white px-4 py-8 font-sans sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/10 via-emerald-500/10 to-sky-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl space-y-6">
          {/* Profile Header */}
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm backdrop-blur-md">
            <div className="relative flex h-32 items-start justify-between bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:h-40" />

            <div className="px-6 pb-6 pt-0">
              <div className="-mt-16 flex flex-col items-center justify-between gap-6 sm:items-end sm:flex-row">
                <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-left">
                  <Avatar className="h-28 w-28 shrink-0 border-4 border-background bg-background shadow-xl ring-2 ring-primary/20 sm:h-32 sm:w-32">
                    <AvatarImage src={user?.avatar || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-3xl font-black text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 space-y-1.5 pb-1">
                    <h1 className="max-w-[280px] truncate text-2xl font-bold tracking-tight text-foreground sm:max-w-[360px]">
                      {user?.name}
                    </h1>
                    <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate("/edit-profile")}
                  className="h-10 shrink-0 gap-2 rounded-full px-5 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-slate-200/60 hover:text-foreground dark:hover:bg-zinc-800/60"
                >
                  <UserCog className="h-4 w-4" />
                  ตั้งค่าโปรไฟล์
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border border-border/60 bg-background shadow-sm transition-all hover:border-primary/40">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="shrink-0 rounded-2xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="shrink-0 border-blue-200 text-[10px] text-blue-600">
                    Active
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-foreground">
                    {stats.totalItems}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    สิ่งของที่ลงโพสต์
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background shadow-sm transition-all hover:border-primary/40">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="shrink-0 rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="shrink-0 border-emerald-200 text-[10px] text-emerald-600">
                    Success
                  </Badge>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-foreground">
                    {stats.exchanges}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    แลกเปลี่ยนสำเร็จ
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background shadow-sm transition-all hover:border-primary/40">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="shrink-0 rounded-2xl bg-amber-500/10 p-2.5 text-amber-500">
                    <Star className="h-5 w-5 fill-amber-500" />
                  </div>
                  <span className="whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                    {stats.reviews} รีวิว
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-foreground">
                    {stats.rating}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
                    คะแนนความน่าเชื่อถือ
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Menu */}
          <Card className="border border-border/60 bg-background/90 shadow-sm backdrop-blur-md">
            <CardContent className="space-y-3 p-5">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                เมนูดำเนินการ
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <MenuCard
                  icon={UserCog}
                  label="แก้ไขโปรไฟล์"
                  onClick={() => navigate("/edit-profile")}
                />

                <MenuCard
                  icon={ArrowRightLeft}
                  label="ประวัติการแลกเปลี่ยน"
                  onClick={() => navigate("/exchange-history")}
                />

                <MenuCard
                  icon={HelpCircle}
                  label="ศูนย์ช่วยเหลือ"
                  onClick={() => navigate("/help")}
                />
              </div>

              <Separator className="my-3" />

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="h-10 gap-2 rounded-2xl border border-transparent bg-transparent px-5 text-xs font-bold text-red-600 transition-all hover:bg-red-500/15 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  ออกจากระบบ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm animate-in overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl zoom-in-95 duration-200 dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="ปิดหน้าต่างยืนยัน"
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center space-y-4 pt-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-inner">
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  ออกจากระบบหรือไม่?
                </h3>
                <p className="px-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  คุณกำลังจะออกจากระบบ Tradin หากต้องการใช้งานต่อ คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                </p>
              </div>

              <div className="flex w-full items-center gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="h-10 flex-1 rounded-xl border-border/60 text-xs font-bold text-foreground transition-all hover:bg-slate-200/60 hover:text-foreground dark:hover:bg-zinc-800/60"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={performLogout}
                  className="h-11 flex-1 rounded-2xl bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95"
                >
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function MenuCard({ icon: Icon, label, subLabel, onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card p-4 text-left text-foreground shadow-xs transition-all hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary transition-transform group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">{label}</p>
          {subLabel && (
            <p className="mt-0.5 truncate text-[10px] font-normal text-muted-foreground">
              {subLabel}
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}