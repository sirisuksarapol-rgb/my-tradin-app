import { useState, useEffect } from "react";
import { Star, ArrowRightLeft, HelpCircle, LogOut, UserCog, ChevronRight, AlertTriangle, ShieldCheck, Package, LucideIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { getUserStats, getItems, IMAGE_BASE_URL } from "@/api/api";

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

// =========================================================================
// COMPONENT: Profile (หน้าจอโปรไฟล์ผู้ใช้งาน จัดการข้อมูลส่วนตัว สถิติการแลกเปลี่ยน และเมนูตั้งค่า)
// =========================================================================
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
      const savedUser = sessionStorage.getItem("user");
      if (!savedUser) {
        navigate("/");
        return;
      }

      try {
        const parsedUser: ProfileUser = JSON.parse(savedUser);
        const BACKEND_URL = `${IMAGE_BASE_URL}/uploads/`;
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
      <div className="bg-muted/15 min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-primary/10 via-emerald-500/10 to-sky-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto space-y-6 relative z-10">

          {/* Profile Header Card */}
          <div className="bg-background rounded-3xl border border-border/60 shadow-sm overflow-hidden backdrop-blur-md">
            <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 relative p-6 flex items-start justify-between" />

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
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate("/edit-profile")}
                  className="gap-2 rounded-full shadow-sm relative overflow-visible hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground hover:text-foreground transition-all shrink-0 px-5 h-10 text-xs font-semibold"
                >
                  <UserCog className="h-4 w-4 shrink-0" />
                  <span>ตั้งค่าโปรไฟล์</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border/60 shadow-sm bg-background hover:border-primary/40 transition-all">
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

            <Card className="border border-border/60 shadow-sm bg-background hover:border-primary/40 transition-all">
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

            <Card className="border border-border/60 shadow-sm bg-background hover:border-primary/40 transition-all">
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

          {/* Action Menu Section */}
          <Card className="border border-border/60 shadow-sm bg-background/90 backdrop-blur-md">
            <CardContent className="p-5 space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                เมนูดำเนินการ
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MenuCard
                  icon={UserCog}
                  label="แก้ไขโปรไฟล์"
                  subLabel="จัดการข้อมูลส่วนตัวและรหัสผ่าน"
                  onClick={() => navigate("/edit-profile")}
                />

                <MenuCard
                  icon={ArrowRightLeft}
                  label="ประวัติการแลกเปลี่ยน"
                  subLabel="ตรวจสอบการแลกเปลี่ยนทั้งหมด"
                  onClick={() => navigate("/exchange-history")}
                />

                <MenuCard
                  icon={HelpCircle}
                  label="ศูนย์ช่วยเหลือ"
                  subLabel="การใช้งานและคำถามที่พบบ่อย"
                  onClick={() => navigate("/help")}
                />
              </div>

              <Separator className="my-3" />

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  className="h-10 px-5 rounded-2xl bg-transparent hover:bg-red-500/15 border border-transparent text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 font-bold text-xs gap-2 transition-all"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <LogOut className="h-4 w-4 text-red-400 dark:text-red-400" />
                  <span>ออกจากระบบ</span>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogoutConfirm(false)}
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
                  คุณกำลังจะออกจากระบบ Tradin หากต้องการใช้งานต่อ คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง
                </p>
              </div>

              <div className="flex items-center gap-3 w-full pt-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-10 text-xs font-bold text-foreground border-border/60 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-foreground transition-all"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1 rounded-2xl h-11 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  onClick={performLogout}
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
      className="w-full p-4 rounded-2xl border border-border/60 bg-card hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all flex items-center justify-between group text-left shadow-xs"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{label}</p>
          {subLabel && (
            <p className="text-[10px] text-muted-foreground truncate font-normal mt-0.5">
              {subLabel}
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-muted-foreground shrink-0 ml-2" />
    </button>
  );
}