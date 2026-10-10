
import { useState, useEffect, type SyntheticEvent } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { MapPin, ArrowLeft, ArrowRightLeft, Star, MessageCircle, Globe, FileText, ChevronLeft, ChevronRight, ShieldAlert, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { getItems as fetchItemsAPI, getUserStats, IMAGE_BASE_URL } from "@/api/api";
import ReportModal from "@/components/ReportModal";

interface DBItemDetail {
  ItemID?: number | string;
  item_id?: number | string;
  ItemName?: string;
  item_name?: string;
  ItemDescription?: string;
  Description?: string;
  description?: string;
  DesiredItem?: string;
  desired_item?: string;
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
  MemberID?: number | string;
  member_id?: number | string;
  DisplayName?: string;
  display_name?: string;
  Email?: string;
  email?: string;
  ProfileImage?: string;
  profile_image?: string;
  user_image?: string;
}

interface CurrentUser {
  id?: string | number;
  user_id?: string | number;
  UserID?: string | number;
  MemberID?: string | number;
  member_id?: string | number;
  DisplayName?: string;
  display_name?: string;
  Email?: string;
  email?: string;
  ProfileImage?: string;
  profile_image?: string;
}

interface MatchRouteData {
  myPost?: {
    ItemID?: string | number;
  };
  [key: string]: unknown;
}

interface PostDetailLocationState {
  fromAdmin?: boolean;
  isOwnPostView?: boolean;
  fromMatch?: boolean;
  matchScore?: number | string;
  matchData?: MatchRouteData;
}

const PLACEHOLDER_IMAGE = "/placeholder.jpg";

function getCurrentUser(): CurrentUser {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return PLACEHOLDER_IMAGE;

  let image = imagePath.trim();

  if (
    !image ||
    image === "undefined" ||
    image === "null" ||
    image === PLACEHOLDER_IMAGE
  ) {
    return PLACEHOLDER_IMAGE;
  }

  if (image.startsWith("[")) {
    try {
      const parsed = JSON.parse(image.split("'").join('"'));
      image = Array.isArray(parsed) ? String(parsed[0] || "").trim() : "";
    } catch {
      image = image
        .split("[").join("")
        .split("]").join("")
        .split('"').join("")
        .split("'").join("");
    }
  }

  image = image.split(",")[0]?.trim() || "";

  if (!image || image === "undefined" || image === "null") {
    return PLACEHOLDER_IMAGE;
  }

  return image.startsWith("http")
    ? image
    : `${IMAGE_BASE_URL}/uploads/${image}`;
}

function getImageUrls(post: DBItemDetail): string[] {
  if (Array.isArray(post.image_paths) && post.image_paths.length > 0) {
    const images = post.image_paths.map((image) => getImageUrl(image));
    return images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  }

  const rawImage =
    post.image_path || post.image_name || post.ItemImage || "";

  if (!rawImage.trim() || rawImage.trim() === "undefined") {
    return [PLACEHOLDER_IMAGE];
  }

  if (rawImage.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(rawImage.trim().split("'").join('"'));

      if (Array.isArray(parsed) && parsed.length > 0) {
        const images = parsed.map((image) => getImageUrl(String(image || "")));
        return images.length > 0 ? images : [PLACEHOLDER_IMAGE];
      }
    } catch {
      // หากข้อมูลไม่ใช่ JSON จะใช้วิธีแยกรูปแบบข้อความต่อไป
    }
  }

  const images = rawImage
    .split(",")
    .map((image) => getImageUrl(image))
    .filter(Boolean);

  return images.length > 0 ? images : [PLACEHOLDER_IMAGE];
}

function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;

  if (image.src !== `${window.location.origin}${PLACEHOLDER_IMAGE}`) {
    image.src = PLACEHOLDER_IMAGE;
  }
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
  const [realRating, setRealRating] = useState("0.0");
  const [realExchanges, setRealExchanges] = useState(0);

  const user = getCurrentUser();
  const routeState = (location.state || {}) as PostDetailLocationState;

  const fromAdmin = routeState.fromAdmin === true;
  const isOwnPostView = routeState.isOwnPostView === true;
  const isFromMatch = routeState.fromMatch === true;
  const matchScore = routeState.matchScore;
  const matchData = routeState.matchData;

  useEffect(() => {
    let isMounted = true;

    const fetchPostDetail = async () => {
      if (!id) {
        setPost(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setCurrentImageIndex(0);
        setRealRating("0.0");
        setRealExchanges(0);

        const response = await fetchItemsAPI();
        const items: DBItemDetail[] = Array.isArray(response?.data)
          ? response.data
          : [];

        const foundPost = items.find(
          (item) => String(item.ItemID ?? item.item_id) === String(id),
        );

        if (!isMounted) return;

        if (!foundPost) {
          setPost(null);
          return;
        }

        setPost(foundPost);

        const authorId = foundPost.MemberID ?? foundPost.member_id;

        if (authorId != null) {
          try {
            const statsResponse = await getUserStats(authorId);

            if (isMounted && statsResponse?.success) {
              setRealRating(
                String(statsResponse.data.reviewScore ?? "0.0"),
              );
              setRealExchanges(
                statsResponse.data.successfulExchanges || 0,
              );
            }
          } catch (error) {
            console.error("Error fetching user statistics:", error);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Error fetching post detail:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อดึงรายละเอียดได้",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPostDetail();

    return () => {
      isMounted = false;
    };
  }, [id, toast]);

  if (isLoading) {
    const loadingContent = (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">
          กำลังดึงข้อมูลจากฐานข้อมูล...
        </p>
      </div>
    );

    return fromAdmin ? (
      <div className="min-h-screen bg-background">{loadingContent}</div>
    ) : (
      <AppLayout>{loadingContent}</AppLayout>
    );
  }

  if (!post) {
    const notFoundContent = (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">
          ไม่พบโพสต์นี้ในระบบฐานข้อมูล
        </p>
        <Button variant="link" onClick={() => navigate(-1)}>
          ย้อนกลับ
        </Button>
      </div>
    );

    return fromAdmin ? (
      <div className="min-h-screen bg-background">{notFoundContent}</div>
    ) : (
      <AppLayout>{notFoundContent}</AppLayout>
    );
  }

  const itemId = post.ItemID ?? post.item_id ?? "";
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

  const authorId = post.MemberID ?? post.member_id ?? "";
  const currentUserId =
    user.id ?? user.user_id ?? user.UserID ?? user.MemberID ?? user.member_id;

  const isOwner =
    isOwnPostView ||
    (currentUserId != null &&
      authorId !== "" &&
      String(currentUserId) === String(authorId));

  const loggedInName = user.DisplayName || user.display_name || "";

  const authorName =
    post.DisplayName ||
    post.display_name ||
    (isOwner ? loggedInName : "") ||
    "ผู้ใช้งานทั่วไป";

  const authorEmail =
    post.Email ||
    post.email ||
    (isOwner ? user.Email || user.email : "") ||
    "ไม่มีข้อมูลอีเมล";

  const rawProfileImg =
    post.ProfileImage ||
    post.profile_image ||
    post.user_image ||
    (isOwner ? user.ProfileImage || user.profile_image : "");

  const profileImageUrl =
    rawProfileImg &&
    rawProfileImg.trim() !== "undefined" &&
    rawProfileImg.trim() !== "null"
      ? getImageUrl(rawProfileImg)
      : "";

  const images = getImageUrls(post);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + images.length) % images.length,
    );
  };

  const mainContent = (
    <>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
                aria-label="ย้อนกลับ"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>

              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">
                รายละเอียดโพสต์
              </h1>
            </div>

            {!isOwner && !fromAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsReportOpen(true)}
                title="รายงานโพสต์นี้"
                aria-label="รายงานโพสต์นี้"
              >
                <Flag className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden group bg-muted">
                <img
                  src={images[currentImageIndex] || PLACEHOLDER_IMAGE}
                  alt={`${title} - รูปที่ ${currentImageIndex + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                  onError={handleImageError}
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="รูปก่อนหน้า"
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="รูปถัดไป"
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`ดูรูปที่ ${index + 1}`}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            index === currentImageIndex
                              ? "bg-primary"
                              : "bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`เลือกภาพที่ ${index + 1}`}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        index === currentImageIndex
                          ? "border-primary shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {matchScore !== undefined && (
                <div className="bg-primary border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-sm">
                  <span className="text-sm font-semibold text-white">
                    คะแนนความเหมาะสม: {matchScore}%
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {title}
                  </h2>
                  <Badge className="text-white shrink-0 text-xs bg-primary">
                    {category}
                  </Badge>
                </div>

                {createdAt && (
                  <p className="text-sm text-muted-foreground">
                    {createdAt}
                  </p>
                )}
              </div>

              <Card className="glass-card border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ต้องการแลกกับ
                    </p>
                    <p className="text-base font-semibold">{wantedItem}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h2 className="text-sm font-bold">รายละเอียด</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold">สถานที่นัดรับ</h2>
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-secondary/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">
                      {locationName}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-bold h-8 px-2 hover:text-orange-600 hover:bg-orange-50 shrink-0"
                    asChild
                  >
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-1.5" />
                      View Map
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              <Link
                to={`/user/${authorId}`}
                state={{
                  fromAdmin,
                  authorName,
                  authorEmail,
                  rawProfileImg,
                  authorRating: realRating,
                  authorExchanges: realExchanges,
                }}
              >
                <Card className="glass-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        {profileImageUrl && (
                          <AvatarImage
                            src={profileImageUrl}
                            alt={authorName}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="eco-gradient text-primary-foreground font-bold text-lg">
                          {authorName.charAt(0).toUpperCase() || "U"}
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
                      if (isFromMatch && matchData?.myPost?.ItemID != null) {
                        navigate(
                          `/exchange-preview/match-${matchData.myPost.ItemID}-${itemId}`,
                          { state: { matchData } },
                        );
                      } else {
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

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="item"
        targetId={itemId}
        targetTitle={title}
      />
    </>
  );

  return fromAdmin ? (
    <div className="min-h-screen bg-background overflow-y-auto w-full">
      {mainContent}
    </div>
  ) : (
    <AppLayout>{mainContent}</AppLayout>
  );
}