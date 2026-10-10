
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowRightLeft, Loader2, Package, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { getAIRecommendations, IMAGE_BASE_URL } from "@/api/api";

interface BackendItem {
  ItemID: number;
  ItemName: string;
  ItemDescription: string;
  DesiredItem: string;
  ItemImage: string | null;
  ItemStatus: string;
  PostDate: string;
  CancelDate: string | null;
  MeetingLocation: string | null;
  LocationLink: string | null;
  CategoryID: number;
  CategoryName: string;
  MemberID: number;
}

interface BackendMatchItem extends BackendItem {
  score: number;
}

interface FrontendMyItem {
  id: number;
  title: string;
  wantedItem: string;
  images: string[];
}

interface FrontendTheirPost {
  id: number;
  title: string;
  description: string;
  category: string | number;
  images: string[];
}

interface MatchResultItem {
  id: string;
  score: number;
  myPost: BackendItem;
  theirPost: FrontendTheirPost;
  status: string;
}

interface AIRecommendationsResponse {
  status: string;
  myItem: BackendItem;
  matches: BackendMatchItem[];
}

const PLACEHOLDER_IMAGE = "/placeholder.jpg";

function getImageUrl(imageStr?: string | null): string {
  if (!imageStr) return PLACEHOLDER_IMAGE;

  let imageName = imageStr.trim();

  if (
    !imageName ||
    imageName === "undefined" ||
    imageName === "null"
  ) {
    return PLACEHOLDER_IMAGE;
  }

  if (imageName.startsWith("[")) {
    try {
      const images = JSON.parse(imageName.split("'").join('"'));
      imageName = Array.isArray(images)
        ? String(images[0] || "").trim()
        : "";
    } catch {
      imageName = imageName
        .split("[").join("")
        .split("]").join("")
        .split('"').join("")
        .split("'").join("");
    }
  }

  imageName = imageName.split(",")[0]?.trim() || "";

  if (
    !imageName ||
    imageName === "undefined" ||
    imageName === "null"
  ) {
    return PLACEHOLDER_IMAGE;
  }

  return imageName.startsWith("http")
    ? imageName
    : `${IMAGE_BASE_URL}/uploads/${imageName}`;
}

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;

  if (image.src !== `${window.location.origin}${PLACEHOLDER_IMAGE}`) {
    image.src = PLACEHOLDER_IMAGE;
  }
}

export default function MatchResults() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const [myItem, setMyItem] = useState<FrontendMyItem | null>(null);
  const [bestMatches, setBestMatches] = useState<MatchResultItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      if (!itemId) {
        setMyItem(null);
        setBestMatches([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setMyItem(null);
      setBestMatches([]);
      setCurrentIndex(0);

      try {
        const response = await getAIRecommendations(itemId);
        const data = response.data as AIRecommendationsResponse;

        if (!isMounted) return;

        if (data.status !== "success" || !data.myItem) {
          setMyItem(null);
          return;
        }

        const backendMyItem = data.myItem;
        const matches = Array.isArray(data.matches) ? data.matches : [];

        setMyItem({
          id: backendMyItem.ItemID,
          title: backendMyItem.ItemName,
          wantedItem: backendMyItem.DesiredItem || "เปิดรับข้อเสนอทั้งหมด",
          images: [getImageUrl(backendMyItem.ItemImage)],
        });

        const formattedMatches = matches.map((item): MatchResultItem => ({
          id: `match-${backendMyItem.ItemID}-${item.ItemID}`,
          score: Math.min(Math.round(item.score * 100), 100),
          myPost: backendMyItem,
          theirPost: {
            id: item.ItemID,
            title: item.ItemName,
            description: item.ItemDescription || "ไม่มีรายละเอียดเพิ่มเติม",
            category: item.CategoryName || "ทั่วไป",
            images: [getImageUrl(item.ItemImage)],
          },
          status: "pending",
        }));

        setBestMatches(formattedMatches);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคู่แมตช์:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const changeMatch = (direction: number) => {
    if (bestMatches.length === 0) return;

    setCurrentIndex(
      (prev) => (prev + direction + bestMatches.length) % bestMatches.length,
    );
  };

  const openPost = (match: MatchResultItem) => {
    navigate(`/post/${match.theirPost.id}`, {
      state: {
        matchScore: match.score,
        fromMatch: true,
        matchData: match,
      },
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-primary">
          <Loader2 className="mb-4 h-10 w-10 animate-spin" />
          <p className="text-sm font-medium">
            กำลังค้นหาและคำนวณคู่แมตช์ที่เหมาะสมที่สุด...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!myItem) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 opacity-20" />
          <p className="font-medium">ไม่พบข้อมูลสิ่งของ</p>
          <Button variant="link" onClick={() => navigate(-1)}>
            ย้อนกลับ
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentMatch = bestMatches[currentIndex];
  const previousIndex =
    (currentIndex - 1 + bestMatches.length) % bestMatches.length;
  const nextIndex = (currentIndex + 1) % bestMatches.length;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8 py-3 sm:py-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2 text-foreground transition-all hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>

          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            ค้นหาคู่แมตช์
          </h1>
        </div>

        <div className="ml-[52px] w-[calc(100%-52px)]">
          <Card className="w-full max-w-2xl overflow-hidden border-primary/10 bg-primary/[0.03] shadow-sm">
            <CardContent className="flex items-center gap-4 p-4 sm:p-5">
              <img
                src={myItem.images[0]}
                alt={myItem.title}
                onError={handleImageError}
                className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-border"
              />

              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-primary">
                  สิ่งของของคุณ
                </span>

                <h2 className="truncate text-base font-bold sm:text-lg">
                  {myItem.title}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  ต้องการแลกกับ{" "}
                  <span className="font-semibold text-primary">
                    {myItem.wantedItem}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-heading text-xl font-bold">
              ผลการแมทช์ที่แนะนำ
            </h2>

            {bestMatches.length > 0 && (
              <div className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                {currentIndex + 1} / {bestMatches.length}
              </div>
            )}
          </div>

          {bestMatches.length > 0 && currentMatch ? (
            <div className="ml-7 w-[calc(100%-1.75rem)]">
              <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 sm:grid-cols-[44px_minmax(80px,1fr)_minmax(0,410px)_minmax(80px,1fr)_44px] sm:gap-5 lg:grid-cols-[48px_minmax(140px,1fr)_410px_minmax(140px,1fr)_48px] lg:gap-8">
                {bestMatches.length > 1 ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeMatch(-1)}
                    className="z-10 h-10 w-10 rounded-full bg-background shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                    aria-label="รายการก่อนหน้า"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <div />
                )}

                {bestMatches.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => changeMatch(-1)}
                    className="group hidden h-[300px] w-full overflow-hidden rounded-2xl border bg-background shadow-md transition-all duration-300 hover:-translate-x-1 hover:shadow-lg sm:block lg:h-[360px]"
                    aria-label="ดูรายการก่อนหน้า"
                  >
                    <img
                      src={bestMatches[previousIndex].theirPost.images[0]}
                      alt={bestMatches[previousIndex].theirPost.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover opacity-50 transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
                    />
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <Card className="w-full overflow-hidden rounded-3xl border-0 bg-background shadow-xl ring-1 ring-black/5">
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => openPost(currentMatch)}
                      className="group relative block aspect-[4/3] w-full overflow-hidden text-left"
                    >
                      <img
                        src={currentMatch.theirPost.images[0]}
                        alt={currentMatch.theirPost.title}
                        onError={handleImageError}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      <div className="absolute right-3 top-3">
                        <div className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                          เหมาะสม {currentMatch.score}%
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-[11px] font-medium text-white/80">
                          ดูรายละเอียดสิ่งของ
                        </span>
                        <h3 className="mt-1 line-clamp-1 text-lg font-bold text-white">
                          {currentMatch.theirPost.title}
                        </h3>
                      </div>
                    </button>

                    <div className="space-y-4 p-5">
                      <button
                        type="button"
                        onClick={() => openPost(currentMatch)}
                        className="line-clamp-1 text-left text-lg font-bold transition-colors hover:text-primary"
                      >
                        {currentMatch.theirPost.title}
                      </button>

                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {currentMatch.theirPost.description}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <Badge className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-white hover:bg-primary">
                          {currentMatch.theirPost.category}
                        </Badge>

                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/exchange-preview/${currentMatch.id}`, {
                              state: { matchData: currentMatch },
                            })
                          }
                          className="h-9 rounded-full px-5 text-xs font-semibold shadow-sm"
                        >
                          <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                          แลกเลย
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {bestMatches.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => changeMatch(1)}
                    className="group hidden h-[300px] w-full overflow-hidden rounded-2xl border bg-background shadow-md transition-all duration-300 hover:translate-x-1 hover:shadow-lg sm:block lg:h-[360px]"
                    aria-label="ดูรายการถัดไป"
                  >
                    <img
                      src={bestMatches[nextIndex].theirPost.images[0]}
                      alt={bestMatches[nextIndex].theirPost.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover opacity-50 transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
                    />
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {bestMatches.length > 1 ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeMatch(1)}
                    className="z-10 h-10 w-10 rounded-full bg-background shadow-md transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                    aria-label="รายการถัดไป"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <div />
                )}
              </div>

              {bestMatches.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  {bestMatches.map((match, index) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`ดูรายการที่ ${index + 1}`}
                      aria-current={index === currentIndex ? "true" : undefined}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentIndex
                          ? "w-7 bg-primary"
                          : "w-1.5 bg-muted-foreground/25 hover:bg-primary/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border/50 bg-muted/30 py-16 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm font-semibold text-muted-foreground">
                ไม่พบสิ่งที่ตรงกับความต้องการ
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ลองเปลี่ยนคำค้นหา หรือดูรายการใกล้เคียง
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}