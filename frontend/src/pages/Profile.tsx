import React, { useEffect, useState } from "react";
import { 
  Star, 
  ArrowRightLeft, 
  Award, 
  HelpCircle, 
  LogOut, 
  UserCog, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck, 
  Package, 
  ArrowUpRight, 
  LucideIcon 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { getUserStats, getItems } from "@/api/api";

interface ProfileUser {
  MemberID: number;
  DisplayName: string;
  Email: string;
  ProfileImage?: string;
  MemberStatus?: string;
  id?: number;
  name?: string;
  email?: string;
  avatar?: string;
}

interface ProfileStats {
  totalItems: number;
  exchanges: number;
  rating: string;
  reviews: number;
}

interface ItemData {
  MemberID?: number | string;
  member_id?: number | string;
  [key: string]: unknown;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  [key: string]: unknown;
}

interface UserStatsData {
  successfulExchanges?: number;
  reviewScore?: string;
  reviews?: Array<unknown>;
}

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  subLabel?: string;
  onClick: () => void;
}

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalItems: 0,
    exchanges: 0,
    rating: "0.0",
    reviews: 0,
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  useEffect(() => {
    const loadProfile = async () => {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        navigate("/");
        return;
      }

      try {
        const parsedUser: ProfileUser = JSON.parse(savedUser);
        const BACKEND_URL = "http://localhost:5000/uploads/";

        let imageUrl = "";
        if (parsedUser.ProfileImage) {
          imageUrl = parsedUser.ProfileImage.startsWith("http")
            ? parsedUser.ProfileImage
            : `${BACKEND_URL}${parsedUser.ProfileImage}`;
        } else {
          imageUrl = parsedUser.avatar || "";
        }

        const name = parsedUser.DisplayName || parsedUser.name || "ผู้ใช้งาน";
        const email = parsedUser.Email || parsedUser.email || "ไม่มีข้อมูลอีเมล";

        const mappedUser: ProfileUser = {
          ...parsedUser,
          id: parsedUser.MemberID || parsedUser.id,
          name,
          email,
          avatar: imageUrl,
        };

        setUser(mappedUser);

        const memberId = mappedUser.id;
        if (!memberId) return;

        const itemsRes = (await getItems()) as ApiResponse<ItemData[]>;
        const itemsList = itemsRes?.data || [];
        const myItems = itemsList.filter(
          (item: ItemData) => String(item.MemberID || item.member_id) === String(memberId)
        );

        const statsRes = (await getUserStats(memberId)) as ApiResponse<UserStatsData>;
        if (statsRes?.success && statsRes.data) {
          setStats({
            totalItems: myItems.length,
            exchanges: statsRes.data.successfulExchanges || 0,
            rating: statsRes.data.reviewScore || "0.0",
            reviews: statsRes.data.reviews?.length || 0,
          });
        } else {
          setStats({ totalItems: myItems.length, exchanges: 0, rating: "0.0", reviews: 0 });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        localStorage.removeItem("user");
        navigate("/");
      }
    };

    loadProfile();
  }, [navigate]);

  const performLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="bg-muted/15 min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-primary/10 via-emerald-500/10 to-sky-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">

          <div className="bg-background rounded-3xl border border-border/60 shadow-sm overflow-hidden backdrop-blur-md">
            <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 relative p-6 flex items-start justify-between">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                บัญชีพร้อมใช้งาน
              </div>
            </div>

            <div className="px-6 pb-6 pt-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-16">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left min-w-0">
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl ring-2 ring-primary/20 bg-background shrink-0">
                    <AvatarImage src={user?.avatar || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1.5 pb-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold tracking-tight text-foreground truncate max-w-[280px] sm:max-w-[360px]">
                        {user?.name}
                      </h1>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 gap-1 text-[10px] font-bold whitespace-nowrap shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> ยืนยันตัวตนแล้ว
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/edit-profile")}
                  className="rounded-xl h-10 px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0 shadow-sm"
                >
                  <UserCog className="h-4 w-4 shrink-0" />
                  <span>ตั้งค่าโปรไฟล์</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border border-border/60 shadow-sm bg-background/80 backdrop-blur-md">
                <CardContent className="p-4 space-y-4">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pt-1">
                    เมนูดำเนินการ
                  </p>

                  <div className="space-y-1">
                    <MenuButton
                      icon={UserCog}
                      label="แก้ไขโปรไฟล์"
                      subLabel="จัดการข้อมูลส่วนตัวและรหัสผ่าน"
                      onClick={() => navigate("/edit-profile")}
                    />

                    <MenuButton
                      icon={ArrowRightLeft}
                      label="ประวัติการแลกเปลี่ยน"
                      subLabel="ตรวจสอบการแลกเปลี่ยนทั้งหมด"
                      onClick={() => navigate("/exchange-history")}
                    />

                    <MenuButton
                      icon={HelpCircle}
                      label="ศูนย์ช่วยเหลือ"
                      subLabel="การใช้งานและคำถามที่พบบ่อย"
                      onClick={() => navigate("/help")}
                    />
                  </div>

                  <Separator className="my-2" />

                  <Button
  variant="ghost"
  className="w-full h-auto p-3 justify-between rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/35 group transition-all duration-200 flex items-center gap-3 overflow-hidden shadow-xs shadow-red-500/5 active:scale-[0.98]"
  onClick={() => setShowLogoutConfirm(true)}
>
  <div className="flex items-center gap-3 min-w-0 flex-1">
    {/* ไอคอนหมุนและขยายเบาๆ ตอน Hover พร้อม Soft Shadow */}
    <div className="p-2 rounded-xl bg-red-500 text-white shrink-0 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-300 flex items-center justify-center shadow-md shadow-red-500/30">
      <LogOut className="h-4 w-4 shrink-0" />
    </div>

    <div className="text-left min-w-0 flex-1">
      <p className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap truncate tracking-wide">
        ออกจากระบบ
      </p>
    </div>
  </div>
</Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border/60 shadow-sm bg-background hover:border-primary/40 transition-all hover:-translate-y-0.5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <Package className="h-5 w-5 shrink-0" />
                      </div>
                      <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 shrink-0">Active</Badge>
                    </div>
                    <div>
                      <p className="text-3xl font-black tracking-tight text-foreground">{stats.totalItems}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5 whitespace-nowrap">สิ่งของที่ลงโพสต์</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 shadow-sm bg-background hover:border-primary/40 transition-all hover:-translate-y-0.5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <ArrowRightLeft className="h-5 w-5 shrink-0" />
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 shrink-0">Success</Badge>
                    </div>
                    <div>
                      <p className="text-3xl font-black tracking-tight text-foreground">{stats.exchanges}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5 whitespace-nowrap">แลกเปลี่ยนสำเร็จ (ครั้ง)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 shadow-sm bg-background hover:border-primary/40 transition-all hover:-translate-y-0.5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                        <Star className="h-5 w-5 fill-amber-500 shrink-0" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">{stats.reviews} รีวิว</span>
                    </div>
                    <div>
                      <p className="text-3xl font-black tracking-tight text-foreground">{stats.rating}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5 whitespace-nowrap">คะแนนความน่าเชื่อถือ</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background shadow-sm">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2 whitespace-nowrap">
                      <Award className="h-4 w-4 text-primary shrink-0" /> สมาชิกยืนยันตัวตนระดับพรีเมียม
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      บัญชีของคุณได้รับการไว้วางใจในการทำรายการแลกเปลี่ยนอย่างปลอดภัย
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/exchange-history")}
                    className="rounded-xl h-10 px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-1.5 whitespace-nowrap"
                  >
                    <span>ดูประวัติทำรายการ</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border/80 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground whitespace-nowrap">ยืนยันการออกจากระบบ?</h3>
                <p className="text-xs text-muted-foreground">คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งาน</p>
              </div>
            </div>
            <div className="flex gap-2.5 w-full">
              <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold whitespace-nowrap" onClick={() => setShowLogoutConfirm(false)}>
                ยกเลิก
              </Button>
              <Button className="flex-1 rounded-2xl h-11 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95" onClick={performLogout}>
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function MenuButton({ icon: Icon, label, subLabel, onClick }: MenuButtonProps) {
  return (
    <Button
      variant="ghost"
      className="w-full h-auto p-3 justify-between rounded-xl hover:bg-muted/80 group transition-all flex items-center gap-3 overflow-hidden"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <div className="text-left min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate whitespace-nowrap">{label}</p>
          {subLabel && (
            <p className="text-[10px] text-muted-foreground truncate font-normal mt-0.5 whitespace-nowrap">
              {subLabel}
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-muted-foreground shrink-0" />
    </Button>
  );
}