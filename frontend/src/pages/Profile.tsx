import { useEffect, useState } from "react";
import {
  Star,
  ArrowRightLeft,
  Award,
  HelpCircle,
  LogOut,
  UserCog,
  ChevronRight,
  AlertTriangle,
  LucideIcon,
  Map,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  MemberID?: number;
  member_id?: number;
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

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        navigate("/");
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);

        const BACKEND_URL = "http://localhost:5000/uploads/";

        let imageUrl = "";

        if (parsedUser.ProfileImage) {
          imageUrl = parsedUser.ProfileImage.startsWith("http")
            ? parsedUser.ProfileImage
            : `${BACKEND_URL}${parsedUser.ProfileImage}`;
        } else {
          imageUrl = parsedUser.photoURL || parsedUser.avatar || "";
        }

        const mappedUser: ProfileUser = {
          ...parsedUser,
          id: parsedUser.MemberID || parsedUser.id,
          name: parsedUser.DisplayName || parsedUser.name || "ผู้ใช้",
          email: parsedUser.Email || parsedUser.email || "ไม่มีอีเมล",
          avatar: imageUrl,
        };

        setUser(mappedUser);

        const memberId = mappedUser.id;

        if (!memberId) return;

        // ดึงรายการสิ่งของทั้งหมด
        const itemsRes = await getItems();

        const myItems = itemsRes.data.filter(
          (item: ItemData) =>
            String(item.MemberID || item.member_id) === String(memberId)
        );

        // ดึงสถิติผู้ใช้
        const statsRes = await getUserStats(memberId);

        if (statsRes?.success) {
          setStats({
            totalItems: myItems.length,
            exchanges: statsRes.data.successfulExchanges || 0,
            rating: statsRes.data.reviewScore || "0.0",
            reviews: statsRes.data.reviews?.length || 0,
          });
        } else {
          setStats({
            totalItems: myItems.length,
            exchanges: 0,
            rating: "0.0",
            reviews: 0,
          });
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
      <div className="max-w-lg mx-auto space-y-6 py-4">
        {/* Profile Header */}
        <div className="text-center space-y-4 pt-2">
          <Avatar className="h-24 w-24 mx-auto border-4 border-card shadow-md">
            <AvatarImage
              src={user?.avatar || ""}
              className="object-cover"
            />
            <AvatarFallback className="eco-gradient text-3xl font-bold text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-heading">
              {user?.name || "ผู้ใช้"}
            </h1>

            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Award,
              value: stats.totalItems.toString(),
              label: "รายการสิ่งของ",
            },
            {
              icon: ArrowRightLeft,
              value: stats.exchanges.toString(),
              label: "แลกเปลี่ยนสำเร็จ",
            },
            {
              icon: Star,
              value: stats.rating,
              label: "คะแนนรีวิว",
            },
          ].map(({ icon: Icon, value, label }) => (
            <Card key={label} className="glass-card">
              <CardContent className="p-4 text-center space-y-1.5">
                <Icon className="h-5 w-5 text-primary mx-auto mb-1" />

                <p className="text-xl font-bold text-foreground">
                  {value}
                </p>

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="opacity-50" />

        {/* Menu */}
        <div className="space-y-1 bg-card rounded-2xl p-2.5 border border-border/50 shadow-sm">
          <MenuButton
            icon={UserCog}
            label="แก้ไขโปรไฟล์"
            onClick={() => navigate("/edit-profile")}
          />

          <MenuButton
            icon={ArrowRightLeft}
            label="ประวัติการแลกเปลี่ยน"
            onClick={() => navigate("/exchange-history")}
          />

          <MenuButton
            icon={HelpCircle}
            label="ศูนย์ช่วยเหลือ"
            onClick={() => navigate("/help")}
          />

          <MenuButton
            icon={Map}
            label="แผนผังเว็บไซต์"
            onClick={() => navigate("/sitemap")}
          />

          <div className="h-px bg-border/40 my-2.5 mx-2" />

          <Button
            variant="ghost"
            className="w-full h-12 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 group"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <div className="bg-destructive/10 p-2 rounded-lg mr-3 shrink-0">
              <LogOut className="h-4 w-4" />
            </div>

            <span className="flex-1 text-left">
              ออกจากระบบ
            </span>

            <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-all" />
          </Button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />

          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border/50">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3.5 bg-destructive/10 rounded-full border border-destructive/20">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>

              <h3 className="text-lg font-bold font-heading">
                ยืนยันการออกจากระบบ?
              </h3>

              <div className="flex gap-2.5 w-full pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-11"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  ยกเลิก
                </Button>

                <Button
                  className="flex-1 rounded-full h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

function MenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="w-full h-12 text-sm font-medium rounded-xl hover:bg-primary/10 hover:text-primary group"
      onClick={onClick}
    >
      <div className="bg-primary/10 p-2 rounded-lg mr-3 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <span className="flex-1 text-left">{label}</span>

      <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-all" />
    </Button>
  );
}