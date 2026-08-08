import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  ArrowRightLeft,
  Star,
  MessageCircle,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Flag,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getItems as fetchItemsAPI,
  getUserStats,
  IMAGE_BASE_URL,
} from "@/api/api";
import { createReport } from "@/api/api";
import ReportModal from "@/components/ReportModal";

interface DBItemDetail {
  ItemID?: number;
  item_id?: number;
  ItemName?: string;
  item_name?: string;

  ItemDescription?: string;
  Description?: string;
  description?: string;

  DesiredItem?: string;
  desired_item?: string;
  CategoryID?: number;
  category_id?: number;
  category_name?: string;
  CategoryName?: string;
  MeetingLocation?: string;
  meeting_location?: string;
  image_path?: string;
  image_name?: string;
  ItemImage?: string;
  image_paths?: string[];
  created_at?: string;
  CreatedAt?: string;
  createdAt?: string;
  created_date?: string;
  date?: string;
  item_date?: string;
  map_link?: string;

  // ข้อมูลสมาชิก
  MemberID?: number;
  member_id?: number;
  DisplayName?: string;
  display_name?: string;
  Email?: string;
  email?: string;
  MemberStatus?: string;

  ProfileImage?: string;
  profile_image?: string;
  user_image?: string;

  // เรตติ้งและการแลกเปลี่ยน
  author_rating?: number;
  AuthorRating?: number;
  rating?: number | string;
  author_exchanges?: number;
  AuthorExchanges?: number;
  exchange_count?: number;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [post, setPost] = useState<DBItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  // 💡 1. สร้าง State มารองรับค่าสถิติจริงที่ดึงแบบ Real-time จาก DB หลังบ้าน
  const [realRating, setRealRating] = useState<string>("0.0");
  const [realExchanges, setRealExchanges] = useState<number>(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fromPage = location.state?.fromPage;
  const isFromIncomingRequest =
    location.state?.fromIncomingRequest || fromPage === "incoming";

  const isOwnPostView = location.state?.isOwnPostView || false;
  const fromAdmin = location.state?.fromAdmin || false;

  const matchScore = location.state?.matchScore;
  const isFromMatch = location.state?.fromMatch;
  const matchData = location.state?.matchData;

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setIsLoading(true);
        const res = await fetchItemsAPI();
        const items: DBItemDetail[] = res.data || [];

        const foundPost = items.find(
          (item) => String(item.ItemID || item.item_id) === String(id),
        );

        if (foundPost) {
          setPost(foundPost);

          // 💡 2. ดึงไอดีผู้โพสต์เพื่อส่งไปขอข้อมูลสถิติจริงจากตาราง exchange
          const targetAuthorId = foundPost.MemberID || foundPost.member_id;
          if (targetAuthorId) {
            const statsRes = await getUserStats(targetAuthorId);
            if (statsRes && statsRes.success) {
              setRealRating(statsRes.data.reviewScore || "0.0");
              setRealExchanges(statsRes.data.successfulExchanges || 0);
            }
          }
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error("Error fetching post detail:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อดึงรายละเอียดได้",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPostDetail();
    }
  }, [id, toast]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">
            กำลังดึงข้อมูลจากฐานข้อมูล...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">ไม่พบโพสต์นี้ในระบบฐานข้อมูล</p>
        </div>
      </AppLayout>
    );
  }

  const itemId = post.ItemID || post.item_id || "";
  const title = post.ItemName || post.item_name || "ไม่ระบุชื่อ";
  const category = post.category_name || post.CategoryName || "ทั่วไป";

  const createdAt =
    post.created_at ||
    post.CreatedAt ||
    post.createdAt ||
    post.created_date ||
    post.date ||
    post.item_date ||
    "";
  const wantedItem =
    post.DesiredItem || post.desired_item || "ไม่ระบุสิ่งที่ต้องการแลก";
  const description =
    post.ItemDescription ||
    post.Description ||
    post.description ||
    "ไม่มีรายละเอียดเพิ่มเติม";

  const locationName =
    post.MeetingLocation || post.meeting_location || "ไม่ระบุสถานที่";
  const mapLink =
    post.map_link ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;

  const authorId = post.MemberID || post.member_id || "";
  const isOwner =
    String(user?.MemberID || user?.member_id || "") === String(authorId) ||
    isOwnPostView;

  const loggedInName = user?.DisplayName || user?.display_name || "";
  let authorName = post.DisplayName || post.display_name || "";

  if (!authorName && isOwner && loggedInName) {
    authorName = loggedInName;
  }
  if (!authorName) {
    authorName = "ผู้ใช้งานทั่วไป";
  }

  const authorEmail =
    post.Email ||
    post.email ||
    (isOwner ? user?.Email || user?.email : "") ||
    "ไม่มีข้อมูลอีเมล";

  const rawProfileImg =
    post.ProfileImage ||
    post.profile_image ||
    post.user_image ||
    (isOwner ? user?.ProfileImage || user?.profile_image : "");
  let profileImageUrl = "";
  if (
    rawProfileImg &&
    rawProfileImg.trim() !== "undefined" &&
    rawProfileImg.trim() !== "null" &&
    rawProfileImg.trim() !== ""
  ) {
    const cleanImg = rawProfileImg.trim();
    profileImageUrl = cleanImg.startsWith("http")
      ? cleanImg
      : `${IMAGE_BASE_URL}/uploads/${cleanImg}`;
  }

  let images: string[] = [];
  if (
    post.image_paths &&
    Array.isArray(post.image_paths) &&
    post.image_paths.length > 0
  ) {
    images = post.image_paths;
  } else {
    const rawImage = String(
      post.image_path || post.image_name || post.ItemImage || "",
    );
    if (rawImage && rawImage.trim() !== "undefined" && rawImage.trim() !== "") {
      try {
        const cleanStr = rawImage.trim();
        if (cleanStr.includes(",")) {
          images = cleanStr.split(",").map((img) => {
            const tImg = img.trim();
            return tImg.startsWith("http")
              ? tImg
              : `${IMAGE_BASE_URL}/uploads/${tImg}`;
          });
        } else {
          images.push(
            cleanStr.startsWith("http")
              ? cleanStr
              : `${IMAGE_BASE_URL}/uploads/${cleanStr}`,
          );
        }
      } catch (e) {
        images.push("/placeholder.jpg");
      }
    } else {
      images.push("/placeholder.jpg");
    }
  }

  const nextImage = () =>
    setCurrentImageIndex((p) => (p === images.length - 1 ? 0 : p + 1));
  const prevImage = () =>
    setCurrentImageIndex((p) => (p === 0 ? images.length - 1 : p - 1));

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "กรุณาระบุเหตุผล",
        variant: "destructive",
      });

      return;
    }

    try {
      await createReport({
        ItemID: itemId,

        MemberID: user.MemberID,

        ProblemType: "รายงานโพสต์",

        HelpCenterData: reportReason,
      });

      toast({
        title: "ส่งรายงานสำเร็จ",

        description: "ขอบคุณสำหรับการแจ้งปัญหา",
      });

      setReportReason("");

      setIsReportOpen(false);
    } catch (err) {
      console.log(err);

      toast({
        title: "ส่งรายงานไม่สำเร็จ",

        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">รายละเอียดโพสต์</h1>
            </div>

            {!isOwner && !fromAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsReportOpen(true)}
                title="รายงานโพสต์นี้"
              >
                <Flag className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden group bg-muted">
                <img
                  src={images[currentImageIndex]}
                  alt={`${title} - รูปที่ ${currentImageIndex + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "/placeholder.jpg") {
                      target.src = "/placeholder.jpg";
                    }
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentImageIndex ? "bg-primary" : "bg-white/70"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === currentImageIndex ? "border-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Content */}
            <div className="space-y-6">
              {/* แถบแสดงคะแนนความเหมาะสมจาก AI (จะแสดงเมื่อกดมาจากหน้า MatchResults) */}
              {matchScore !== undefined && (
                <div className="bg-primary rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-sm">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm font-semibold text-primary-foreground">
                    คะแนนความเหมาะสมจาก AI: {matchScore}%
                  </span>
                </div>
              )}

              {/* ส่วน Title และ Date */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {title}
                  </h1>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {category}
                  </Badge>
                </div>
                {createdAt && (
                  <p className="text-sm text-muted-foreground">{createdAt}</p>
                )}
              </div>

              {/* Wanted Item */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <ArrowRightLeft className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ต้องการแลกกับ
                    </p>
                    <p className="text-base font-semibold">{wantedItem}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold">รายละเอียด</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold">สถานที่นัดรับ</h2>
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-secondary/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {locationName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-bold h-8 px-2 hover:text-orange-600 hover:bg-orange-50"
                    asChild
                  >
                    <a href={mapLink} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-1.5" /> View Map
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Author Card */}
              <Link
                to={`/user/${authorId}`}
                state={{
                  fromAdmin,
                  authorName,
                  authorEmail,
                  rawProfileImg,
                  authorRating: realRating, // 💡 ผูกข้อมูลจริงเรียบร้อย
                  authorExchanges: realExchanges, // 💡 ผูกข้อมูลจริงเรียบร้อย
                }}
              >
                <Card className="glass-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        {profileImageUrl ? (
                          <AvatarImage
                            src={profileImageUrl}
                            alt={authorName}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="eco-gradient text-primary-foreground font-bold text-lg">
                          {authorName
                            ? authorName.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{authorName}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="font-medium text-foreground">
                              {realRating}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                            <span>{realExchanges} แลกเปลี่ยน</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-primary font-medium hidden sm:inline">
                        ดูโปรไฟล์ →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {fromAdmin ? (
                  <Button
                    variant="secondary"
                    className="w-full hover:bg-primary/20 bg-primary/10 text-primary font-semibold transition-colors"
                    size="lg"
                    onClick={() => navigate("/admin")}
                  >
                    <ShieldAlert className="h-5 w-5 mr-2" />
                    กลับหน้า Admin
                  </Button>
                ) : (
                  <Button
                    className="flex-1 eco-gradient text-primary-foreground shadow-sm"
                    size="lg"
                    disabled={isOwner}
                    onClick={() => {
                      // 💡 เช็กว่าถ้ามาจากหน้า AI Match ให้ส่ง URL แบบ match พร้อมแนบข้อมูลไปด้วย
                      if (isFromMatch && matchData) {
                        navigate(
                          `/exchange-preview/match-${matchData.myPost.ItemID}-${itemId}`,
                          {
                            state: { matchData: matchData },
                          },
                        );
                      } else {
                        // กรณีเข้ามาดูโพสต์ปกติทั่วไป
                        navigate(`/exchange-preview/post-${itemId}`);
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {isOwner ? "โพสต์ของคุณ" : "ส่งคำขอแลกเปลี่ยน"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Dialog */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="item" // หรือใช้ "user" ถ้าเป็นหน้าโปรไฟล์
        targetId={itemId}
        targetTitle={title}
      />
    </AppLayout>
  );
}
