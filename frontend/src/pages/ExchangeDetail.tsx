import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ArrowRightLeft, Star, MapPin, Info, Tag, 
  ShoppingBag, Calendar, CheckCircle, XCircle, Package 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// 💡 นำเข้า API เซอร์วิสและ Base URL จากที่คุณจัดระเบียบไว้
import { getExchanges, getUserStats, IMAGE_BASE_URL } from "@/api/api";

// ========================================================
// 🎯 TYPES & INTERFACES (แก้ไขปัญหาตัวหนังสือสีแดงทั้งหมด)
// ========================================================
interface ExchangeDetailData {
  ExchangeID: number;
  ExchangeStatus: string;
  ExchangeLocation: string;
  Score: number;
  MemberID: number;
  TargetMemberID: number;
  MyItemID: number;
  TargetItemID: number;
  PhoneNumber: string;
  StartDate: string;
  myPostTitle: string;
  myPostImage: string;
  theirPostTitle: string;
  theirPostImage: string;
  theirAuthorName: string;
  Comment?: string;
  CancelDate?: string;
}

interface PartnerStats {
  successfulExchanges: number;
  reviewScore: string;
}

export default function ExchangeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // State Management
  const [item, setItem] = useState<ExchangeDetailData | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({ successfulExchanges: 0, reviewScore: "0.0" });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDetailData = async () => {
      try {
        setLoading(true);
        // 1. ดึงประวัติรายการแลกเปลี่ยนทั้งหมดเพื่อมาค้นหาใบสัญญา ID นี้
        const response = await getExchanges();
        if (response && response.success) {
          const foundItem = response.data.find((e: ExchangeDetailData) => String(e.ExchangeID) === String(id));
          
          if (foundItem) {
            setItem(foundItem);

            // 2. ดึงสถิติของคู่แลกเปลี่ยน (ดูว่าปัจจุบันเราคุยกับ Target หรือ Requester เพื่อหา ID คู่กรณี)
            const savedUser = localStorage.getItem("user");
            const currentUser = savedUser ? JSON.parse(savedUser) : null;
            const currentUserId = currentUser ? (currentUser.id || currentUser.UserID || currentUser.MemberID) : "";
            
            const partnerId = String(foundItem.MemberID) === String(currentUserId) 
              ? foundItem.TargetMemberID 
              : foundItem.MemberID;

            if (partnerId) {
              const statsResponse = await getUserStats(partnerId);
              if (statsResponse && statsResponse.success && statsResponse.data) {
                setPartnerStats({
                  successfulExchanges: statsResponse.data.successfulExchanges || 0,
                  reviewScore: statsResponse.data.reviewScore || "0.0"
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching exchange details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">กำลังโหลดรายละเอียดสัญญาแลกเปลี่ยน...</p>
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
          <p>ไม่พบข้อมูลการแลกเปลี่ยนชิ้นนี้ในระบบ</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            กลับหน้าหลัก
          </Button>
        </div>
      </AppLayout>
    );
  }

  // เช็คสถานะความสำเร็จจากการคัดกรองคำหลังบ้าน
  const isSuccess = item.ExchangeStatus.toLowerCase() === "accepted" || item.ExchangeStatus.toLowerCase() === "completed";
  
  // จัดรูปภาพคอมมาสตริงจากดาต้าเบส
  const getImageUrl = (imageString: string) => {
    if (!imageString) return "/placeholder-image.png";
    const firstImage = imageString.split(",")[0].trim();
    return `${IMAGE_BASE_URL}/uploads/${firstImage}`;
  };

  const myItemImage = getImageUrl(item.myPostImage);
  const theirItemImage = getImageUrl(item.theirPostImage);

  const myItemTitle = item.myPostTitle || "ไม่ระบุชื่อ";
  const theirItemTitle = item.theirPostTitle || "ไม่ระบุชื่อ";
  const partnerName = item.theirAuthorName || "ผู้ใช้งานระบบ";
  const location = item.ExchangeLocation || "นัดเจอตามตกลง";
  const displayDate = item.StartDate ? item.StartDate.split(" ")[0] : "ไม่ระบุวันที่";

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">รายละเอียดการแลกเปลี่ยน</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Status + Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border ${isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {isSuccess ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                  <div>
                    <p className={`text-sm font-bold ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                      สถานะ: {isSuccess ? "ยืนยันสำเร็จแล้ว" : `ไม่สำเร็จ (${item.ExchangeStatus})`}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> ยื่นข้อเสนอเมื่อ: {displayDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exchange Items */}
              <Card className="glass-card border-none shadow-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-6 justify-center">
                    <div className="flex-1 flex flex-col items-center space-y-3">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden border border-primary/10 shadow-sm">
                        <img src={myItemImage} alt={myItemTitle} className="w-full h-full object-cover transition-transform hover:scale-105" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <p className="text-sm font-bold text-foreground line-clamp-1" title={myItemTitle}>{myItemTitle}</p>
                        <p className="text-[10px] text-primary font-bold uppercase bg-primary/10 rounded-full px-2 py-0.5 inline-block">ของของคุณ</p>
                      </div>
                    </div>

                    <div className="z-10 bg-background p-3 rounded-full border border-border shadow-sm flex-shrink-0">
                      <ArrowRightLeft className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 flex flex-col items-center space-y-3">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden border border-primary/10 shadow-sm">
                        <img src={theirItemImage} alt={theirItemTitle} className="w-full h-full object-cover transition-transform hover:scale-105" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <p className="text-sm font-bold text-foreground line-clamp-1" title={theirItemTitle}>{theirItemTitle}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase bg-secondary rounded-full px-2 py-0.5 inline-block">สิ่งที่ได้รับ</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow icon={<MapPin className="h-4 w-4 text-primary" />} label="สถานที่นัดรับ" value={location} full />
                    {item.PhoneNumber && (
                      <DetailRow icon={<Info className="h-4 w-4 text-primary" />} label="เบอร์โทรติดต่อข้อเสนอ" value={item.PhoneNumber} full />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Partner + Review */}
            <div className="space-y-6">
              {/* Partner Card */}
              <Card className="glass-card border-none shadow-sm border-l-4 border-l-primary/30">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ข้อมูลคู่แลกเปลี่ยน</h2>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {partnerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {partnerName}
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{partnerStats.reviewScore}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                          <Package className="h-3 w-3" />
                          <span className="font-medium">แลกสำเร็จ {partnerStats.successfulExchanges} ครั้ง</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Comment จากตาราง Exchange หลังบ้าน */}
              {isSuccess && item.Comment && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold flex items-center gap-2 px-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    บันทึกรีวิวเพิ่มเติม
                  </h2>
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 italic text-sm text-muted-foreground leading-relaxed">
                    "{item.Comment}"
                  </div>
                </div>
              )}

              {/* ส่วนกรณีถูกปฏิเสธ หรือแคนเซิลดีล */}
              {!isSuccess && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1 text-red-600 font-bold text-xs uppercase">
                    <Info className="h-3.5 w-3.5" />
                    หมายเหตุของดีล
                  </div>
                  <p className="text-sm text-red-700/80 italic">"รายการนี้ถูกปิดหรือยกเลิกโดยระบบ"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function DetailRow({
  icon,
  label,
  value,
  full = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors ${full ? "sm:col-span-2" : ""}`}>
      <div className="bg-background p-2 rounded-lg shadow-sm border border-border">{icon}</div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}