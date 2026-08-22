import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ArrowRightLeft,
  Package,
  Flag,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { useState, useEffect } from "react";
import {
  getItems as fetchItemsAPI,
  getUserStats,
  IMAGE_BASE_URL,
} from "@/api/api";
import ReportModal from "@/components/ReportModal";

// 💡 กำหนด Interface ของคำรีวิวจริงที่ส่งมาจาก API หลังบ้าน
interface DBUserReview {
  ExchangeID: number;
  ReviewerName: string;
  Rating: number | string;
  Comment: string;
  ReviewDate: string;
}

interface UserProfileData {
  MemberID?: number;
  DisplayName?: string;
  Email?: string;
  ProfileImage?: string;
  MemberStatus?: string;
  role?: string;
  totalItems?: number;
  successfulExchanges?: number;
  reviewScore?: string;
}

// 💡 เพิ่ม Interface สำหรับข้อมูล Item เพื่อแทนที่การใช้ any
interface ItemData {
  MemberID?: number | string;
  member_id?: number | string;
  DisplayName?: string;
  Email?: string;
  ProfileImage?: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [reviews, setReviews] = useState<DBUserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  // แกะข้อมูลที่ถูกส่งพ่วงต่อมาข้ามหน้า
  const stateData = location.state as {
    fromAdmin?: boolean;
    authorName?: string;
    authorEmail?: string;
    rawProfileImg?: string;
    authorRating?: string;
    authorExchanges?: number;
  } | null;

  const fromAdmin = stateData?.fromAdmin || false;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const loadProfileAndRealDBStats = async () => {
      try {
        setIsLoading(true);

        // 1. ดึงสิ่งของทั้งหมด และกรองนับเฉพาะของ User คนนี้
        const itemsRes = await fetchItemsAPI();
        const items = itemsRes.data || [];

        // 💡 แปลง ID เป็น String ทั้งคู่ก่อนเทียบ ป้องกันบั๊กสิ่งของโชว์เลขซ้ำกัน
        const userItemsCount = items.filter(
          (item: ItemData) =>
            String(item.MemberID || item.member_id) === String(userId),
        ).length;

        // 2. เรียก API ดึงข้อมูลสถิติจริงและคำรีวิว
        const statsRes = await getUserStats(userId!);

        let dbExchanges = stateData?.authorExchanges || 0;
        let dbRating = stateData?.authorRating || "0.0";
        let dbReviews: DBUserReview[] = [];

        // 💡 เช็คว่าถ้า Backend คืนค่ากลับมา Success ค่อยจับยัดใส่ State
        if (statsRes && statsRes.success && statsRes.data) {
          dbExchanges = statsRes.data.successfulExchanges;
          dbRating = statsRes.data.reviewScore;
          dbReviews = statsRes.data.reviews || [];
        }

        setReviews(dbReviews); // อัปเดตตารางคอมเมนต์

        // 3. ผูกข้อมูลลงหน้าจอ
        const currentLoggedInID = String(
          loggedInUser?.MemberID || loggedInUser?.member_id || "",
        );

        if (currentLoggedInID === String(userId)) {
          setUserData({
            MemberID: Number(userId),
            DisplayName:
              loggedInUser.DisplayName ||
              loggedInUser.display_name ||
              "ผู้ใช้งานทั่วไป",
            Email:
              loggedInUser.Email || loggedInUser.email || "ไม่มีข้อมูลอีเมล",
            ProfileImage:
              loggedInUser.ProfileImage || loggedInUser.profile_image || "",
            totalItems: userItemsCount,
            successfulExchanges: dbExchanges,
            reviewScore: dbRating,
          });
        } else {
          const matchedPost = items.find(
            (item: ItemData) =>
              String(item.MemberID || item.member_id) === String(userId),
          );
          setUserData({
            MemberID: Number(userId),
            DisplayName:
              matchedPost?.DisplayName ||
              stateData?.authorName ||
              "ผู้ใช้งานทั่วไป",
            Email:
              matchedPost?.Email ||
              stateData?.authorEmail ||
              "ไม่มีข้อมูลอีเมล",
            ProfileImage:
              matchedPost?.ProfileImage || stateData?.rawProfileImg || "",
            totalItems: userItemsCount,
            successfulExchanges: dbExchanges,
            reviewScore: dbRating,
          });
        }
      } catch (error) {
        console.error("Error loading profile statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadProfileAndRealDBStats();
    }
  }, [userId, stateData]);

  const isOwner =
    String(loggedInUser?.MemberID || loggedInUser?.member_id || "") ===
    String(userData?.MemberID || "");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-muted-foreground">
          กำลังโหลดข้อมูลโปรไฟล์และคำรีวิวจริงจากระบบ...
        </div>
      </AppLayout>
    );
  }

  const profileName = userData?.DisplayName || "ผู้ใช้งานทั่วไป";
  const profileEmail = userData?.Email || "ไม่มีข้อมูลอีเมล";

  let profileImageUrl = "";
  const rawImg = userData?.ProfileImage;
  if (
    rawImg &&
    rawImg.trim() !== "undefined" &&
    rawImg.trim() !== "null" &&
    rawImg.trim() !== ""
  ) {
    profileImageUrl = rawImg.trim().startsWith("http")
      ? rawImg.trim()
      : `${IMAGE_BASE_URL}/uploads/${rawImg.trim()}`;
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="flex items-center justify-between">
          <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

          {/* 🟢 เพิ่มปุ่มรายงานผู้ใช้งานตรงนี้ */}
          {!isOwner && (
            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsReportOpen(true)}
                title="รายงานผู้ใช้งาน"
              >
                <Flag className="h-5 w-5" />
              </Button>
          )}
        </div>
        {/* ข้อมูลโปรไฟล์หลักและสถิติ 3 ช่อง */}
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <Avatar className="h-28 w-28 mx-auto md:mx-0 border-4 border-background shadow-lg">
            {profileImageUrl && (
              <AvatarImage
                src={profileImageUrl}
                alt={profileName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-4xl font-bold text-primary-foreground eco-gradient">
              {profileName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
              {profileName}
            </h1>
            <p className="text-muted-foreground">{profileEmail}</p>

            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto md:mx-0">
              {[
                {
                  icon: Package,
                  value: String(userData?.totalItems || 0),
                  label: "รายการสิ่งของ",
                },
                {
                  icon: ArrowRightLeft,
                  value: String(userData?.successfulExchanges || 0),
                  label: "แลกเปลี่ยนสำเร็จ",
                },
                {
                  icon: Star,
                  value: String(userData?.reviewScore || "0.0"),
                  label: "คะแนนรีวิว",
                },
              ].map(({ icon: Icon, value, label }) => (
                <Card key={label} className="glass-card">
                  <CardContent className="p-4 text-center space-y-2">
                    <Icon className="h-5 w-5 text-primary mx-auto" />
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* โซนส่วนแสดงรีวิวและความคิดเห็นจริง */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />{" "}
            คำวิจารณ์และรีวิวจากผู้ใช้งานจริง
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-25 text-yellow-500" />
              <p className="text-sm">
                ผู้ใช้งานรายนี้ยังไม่ได้รับคำรีวิวความคิดเห็นในระบบ
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card
                  key={review.ExchangeID}
                  className="bg-card/50 border shadow-sm"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                            {review.ReviewerName
                              ? review.ReviewerName.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {review.ReviewerName || "ผู้ใช้งานทั่วไป"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {review.ReviewDate
                              ? review.ReviewDate
                              : "ไม่มีระบุวันที่"}
                          </p>
                        </div>
                      </div>

                      {/* ส่วนคะแนนรีวิวจริงที่คู่แลกเปลี่ยนให้ */}
                      <div className="flex items-center gap-0.5 bg-yellow-500/10 px-2 py-0.5 rounded-full text-yellow-600 text-xs font-semibold">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {Number(review.Rating || 0).toFixed(1)}
                      </div>
                    </div>
                    {/* ความคิดเห็นจากฟิลด์ Comment ในตาราง DB */}
                    <p className="text-sm text-muted-foreground pl-10 italic">
                      "{review.Comment}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {fromAdmin && (
          <Button
            variant="secondary"
            onClick={() => navigate("/admin")}
            className="w-full max-w-xs gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
          >
            <ShieldAlert className="h-4 w-4" /> กลับหน้า Admin
          </Button>
        )}
      </div>

      {/* แจ้งปัญหา */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="user"
        targetId={userId}
        targetTitle={profileName}
      />
    </AppLayout>
  );
}
