import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  Sparkles,
  Package,
  Search,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { getAIRecommendations, IMAGE_BASE_URL } from "@/api/api";

// ========================================================
// 📐 TYPES & INTERFACES
// ========================================================
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
  v_score?: number;
}

interface FrontendMyItem {
  id: number;
  title: string;
  wantedItem: string;
  images: string[]; // ปรับให้เป็น Array ตามรูปแบบ UI ของคุณ
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

// ========================================================
// 🖥️ COMPONENT
// ========================================================
export default function MatchResults() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();

  const [myItem, setMyItem] = useState<FrontendMyItem | null>(null);
  const [bestMatches, setBestMatches] = useState<MatchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getFirstImageName = (imageStr: string | null): string => {
    if (!imageStr) return "";
    return imageStr.split(",")[0].trim();
  };

  useEffect(() => {
    const fetchRealAIRecommendations = async () => {
      if (!itemId) return;
      setIsLoading(true);
      try {
        const response = await getAIRecommendations(itemId);
        const {
          status,
          myItem: backendMyItem,
          matches,
        } = response.data as AIRecommendationsResponse;

        if (status === "success" && backendMyItem) {
          // 1. จัดการรูปภาพของเรา
          const myImageName = getFirstImageName(backendMyItem.ItemImage);
          setMyItem({
            id: backendMyItem.ItemID,
            title: backendMyItem.ItemName,
            wantedItem: backendMyItem.DesiredItem,
            images: [
              myImageName
                ? `${IMAGE_BASE_URL}/uploads/${myImageName}`
                : "/placeholder.jpg",
            ],
          });

          // 2. จัดการรูปภาพของคู่แมตช์ทั้งหมด
          const formattedMatches: MatchResultItem[] = matches.map(
            (item: BackendMatchItem) => {
              const percentageScore = Math.min(
                Math.round(item.score * 100),
                100,
              );
              const theirImageName = getFirstImageName(item.ItemImage);

              return {
                id: `match-${backendMyItem.ItemID}-${item.ItemID}`,
                score: percentageScore,
                myPost: backendMyItem,
                theirPost: {
                  id: item.ItemID,
                  title: item.ItemName,
                  description: item.ItemDescription,
                  category: item.CategoryName || "ทั่วไป",
                  images: [
                    theirImageName
                      ? `${IMAGE_BASE_URL}/uploads/${theirImageName}`
                      : "/placeholder.jpg",
                  ],
                },
                status: "pending",
              };
            },
          );

          setBestMatches(formattedMatches);
        }
      } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลคู่แมตช์ด้วย AI:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealAIRecommendations();
  }, [itemId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-12 h-[60vh] text-primary">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className="font-medium animate-pulse text-sm">
            ระบบ AI กำลังค้นหาและคำนวณคู่แมตช์ที่เหมาะสมที่สุด...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!myItem) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
          <Package className="h-12 w-12 mb-3 opacity-20" />
          <p className="font-medium">ไม่พบข้อมูลสิ่งของ</p>
          <Button variant="link" onClick={() => navigate(-1)}>
            ย้อนกลับ
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-2 sm:py-6 space-y-8">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="font-bold text-2xl font-heading">ค้นหาคู่แมตช์</span>
        </div>

        {/* My item */}
        <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl bg-primary/5 p-5 border border-primary/10 max-w-2xl">
          <img
            src={myItem.images[0]}
            alt={myItem.title}
            className="h-20 w-20 rounded-xl object-cover border border-border shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">
              แลกเปลี่ยนสิ่งของ
            </p>
            <h1 className="font-bold text-lg text-foreground truncate">
              {myItem.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              อยากได้:{" "}
              <span className="text-primary font-medium">
                {myItem.wantedItem}
              </span>
            </p>
          </div>
        </div>

        {/* Results */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-heading">
              ผลการแมทช์ที่แนะนำ
            </h2>
          </div>

          {bestMatches.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bestMatches.map((match: MatchResultItem) => (
                <Card
                  key={match.id}
                  className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all group"
                >
                  <div className="absolute top-3 right-3 z-10 rounded-full bg-primary/90 px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                    เหมาะสม {match.score}%
                  </div>
                  <CardContent className="p-0">
                    {/* เพิ่ม onClick และ cursor-pointer เพื่อกดไปที่หน้า รายละเอียดโพสต์ */}
                    <div
                      className="aspect-[4/3] overflow-hidden cursor-pointer"
                      onClick={() =>
                        navigate(`/post/${match.theirPost.id}`, {
                          state: { matchScore: match.score, fromMatch: true, matchData: match },
                        })
                      }
                    >
                      <img
                        src={match.theirPost.images[0]}
                        alt={match.theirPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      {/* เพิ่ม onClick ที่ชื่อเรื่องให้กดได้เช่นกัน */}
                      <h3
                        className="font-bold text-sm leading-tight line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() =>
                          navigate(`/item/${match.theirPost.id}`, {
                            state: { matchScore: match.score, fromMatch: true, matchData: match },
                          })
                        }
                      >
                        {match.theirPost.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        "{match.theirPost.description}"
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {match.theirPost.category}
                        </Badge>
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-[11px] eco-gradient text-primary-foreground rounded-full px-3 shadow-sm"
                          onClick={() =>
                            navigate(`/exchange-preview/${match.id}`, {
                              state: { matchData: match },
                            })
                          }
                        >
                          <ArrowRightLeft className="h-3 w-3" /> แลกเลย
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border/50">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold text-muted-foreground">
                ไม่พบสิ่งที่ตรงกับความต้องการ
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ลองเปลี่ยนคำค้นหา หรือดูรายการใกล้เคียง
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
