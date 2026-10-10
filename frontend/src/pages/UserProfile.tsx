
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  ArrowRightLeft,
  Package,
  User,
  ShieldAlert,
  MessageSquare,
  Flag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { getItems, getUserStats, IMAGE_BASE_URL } from "@/api/api";
import ReportModal from "@/components/ReportModal";

interface DBUserReview {
  ExchangeID: number;
  ReviewerName?: string;
  Rating?: number | string;
  Comment?: string;
  ReviewDate?: string;
  ReviewerProfileImage?: string;
}

interface ProfileUser {
  MemberID?: number | string;
  member_id?: number | string;
  DisplayName?: string;
  display_name?: string;
  ProfileImage?: string;
  profile_image?: string;
}

interface UserProfileData {
  MemberID?: number;
  DisplayName?: string;
  ProfileImage?: string;
  totalItems?: number;
  successfulExchanges?: number;
  reviewScore?: string | number;
}

interface ItemData {
  MemberID?: number | string;
  member_id?: number | string;
  DisplayName?: string;
  ProfileImage?: string;
}

interface ProfileLocationState {
  fromAdmin?: boolean;
  authorName?: string;
  rawProfileImg?: string;
  authorRating?: string;
  authorExchanges?: number;
}

function getImageUrl(image?: string | null) {
  if (!image) return "";

  const path = image.trim();

  if (!path || path === "null" || path === "undefined") {
    return "";
  }

  return path.startsWith("http")
    ? path
    : `${IMAGE_BASE_URL}/uploads/${path}`;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [reviews, setReviews] = useState<DBUserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [loggedInUser] = useState<ProfileUser>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const stateData = location.state as ProfileLocationState | null;
  const fromAdmin = Boolean(stateData?.fromAdmin);

  const currentUserId = String(
    loggedInUser.MemberID || loggedInUser.member_id || ""
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const itemsRes = await getItems();
        const items: ItemData[] = itemsRes?.data || [];

        const myItems = items.filter(
          (item) =>
            String(item.MemberID || item.member_id) === String(userId)
        );

        const statsRes = await getUserStats(userId);

        let exchanges = stateData?.authorExchanges || 0;
        let rating: string | number = stateData?.authorRating || "0.0";
        let userReviews: DBUserReview[] = [];

        if (statsRes?.success && statsRes.data) {
          exchanges = statsRes.data.successfulExchanges ?? exchanges;
          rating = statsRes.data.reviewScore ?? rating;
          userReviews = statsRes.data.reviews || [];
        }

        const isViewingSelf = currentUserId === String(userId);

        const matchedPost = items.find(
          (item) =>
            String(item.MemberID || item.member_id) === String(userId)
        );

        const profile: UserProfileData = {
          MemberID: Number(userId),
          DisplayName: isViewingSelf
            ? loggedInUser.DisplayName ||
              loggedInUser.display_name ||
              "ผู้ใช้งานทั่วไป"
            : matchedPost?.DisplayName ||
              stateData?.authorName ||
              "ผู้ใช้งานทั่วไป",
          ProfileImage: isViewingSelf
            ? loggedInUser.ProfileImage || loggedInUser.profile_image || ""
            : matchedPost?.ProfileImage ||
              stateData?.rawProfileImg ||
              "",
          totalItems: myItems.length,
          successfulExchanges: exchanges,
          reviewScore: rating,
        };

        if (isMounted) {
          setUserData(profile);
          setReviews(userReviews);
        }
      } catch (error) {
        console.error("Error loading profile statistics:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId, stateData, currentUserId, loggedInUser]);

  const isOwner =
    Boolean(currentUserId) &&
    currentUserId === String(userData?.MemberID ?? "");

  const profileName = userData?.DisplayName || "ผู้ใช้งานทั่วไป";
  const profileImageUrl = getImageUrl(userData?.ProfileImage);

  const stats = [
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
      value: String(userData?.reviewScore ?? "0.0"),
      label: "คะแนนรีวิว",
    },
  ];

  const mainContent = (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2 text-foreground transition-all hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <User className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold font-heading sm:text-2xl">
            โปรไฟล์เจ้าของ
          </h1>
        </div>

        {!isOwner && !fromAdmin && (
          <Button
            variant="ghost"
            size="icon"
            title="รายงานผู้ใช้นี้"
            onClick={() => setIsReportOpen(true)}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Flag className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[auto_1fr]">
        <Avatar className="mx-auto h-28 w-28 border-4 border-background shadow-lg md:mx-0">
          <AvatarImage
            src={profileImageUrl}
            alt={profileName}
            className="object-cover"
          />
          <AvatarFallback className="eco-gradient text-4xl font-bold text-primary-foreground">
            {profileName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-3 text-center md:text-left">
          <h2 className="flex items-center justify-center gap-2 text-3xl font-bold md:justify-start">
            {profileName}
          </h2>

          <div className="mx-auto grid max-w-md grid-cols-3 gap-4 pt-4 md:mx-0">
            {stats.map(({ icon: Icon, value, label }) => (
              <Card key={label} className="glass-card">
                <CardContent className="space-y-2 p-4 text-center">
                  <Icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <MessageSquare className="h-5 w-5 text-primary" />
          คำวิจารณ์และรีวิวจากผู้ใช้งานจริง
        </h2>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/10 py-12 text-center text-muted-foreground">
            <Star className="mx-auto mb-2 h-8 w-8 text-yellow-500 opacity-25" />
            <p className="text-sm">
              ผู้ใช้งานรายนี้ยังไม่ได้รับคำรีวิวความคิดเห็นในระบบ
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => {
              const reviewerName =
                review.ReviewerName || "ผู้ใช้งานทั่วไป";

              return (
                <Card
                  key={review.ExchangeID}
                  className="border bg-card/50 shadow-sm"
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={getImageUrl(review.ReviewerProfileImage)}
                            alt={reviewerName}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                            {reviewerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {reviewerName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-600">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {Number(review.Rating || 0).toFixed(1)}
                      </div>
                    </div>

                    <p className="break-words pl-10 text-sm italic text-muted-foreground">
                      "{review.Comment || ""}"
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {fromAdmin && (
        <Button
          variant="secondary"
          onClick={() => navigate("/admin")}
          className="w-full gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
        >
          <ShieldAlert className="h-4 w-4" />
          กลับหน้า Admin
        </Button>
      )}

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="user"
        targetId={userId}
        targetTitle={profileName}
      />
    </div>
  );

  if (isLoading) {
    const loadingContent = (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        กำลังโหลดข้อมูลโปรไฟล์และคำรีวิวจริงจากระบบ...
      </div>
    );

    return fromAdmin ? (
      <div className="min-h-screen w-full overflow-y-auto bg-background">
        {loadingContent}
      </div>
    ) : (
      <AppLayout>{loadingContent}</AppLayout>
    );
  }

  return fromAdmin ? (
    <div className="min-h-screen w-full overflow-y-auto bg-background">
      {mainContent}
    </div>
  ) : (
    <AppLayout>{mainContent}</AppLayout>
  );
}