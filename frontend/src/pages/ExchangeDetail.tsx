import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Package,
  MessageSquareQuote, FileText
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getExchanges, getUserStats, IMAGE_BASE_URL } from "@/api/api";

interface ExchangeDetailData {
  ExchangeID: number;
  ExchangeStatus: string;
  ExchangeLocation: string;
  MemberID: number;
  TargetMemberID: number;
  MyItemID: number;
  TargetItemID: number;
  PhoneNumber: string;
  partnerPhone: string;
  IsMemberVerified: number;
  IsTargetMemberVerified: number;
  IsMemberReceived: number;
  IsTargetMemberReceived: number;
  StartDate: string;
  SuccessDate?: string;
  CancelDate?: string;
  CancelReason?: string;
  myPostTitle: string;
  myPostImage: string;
  myPostDescription?: string;
  myMeetingLocation?: string;
  theirPostTitle: string;
  theirPostImage: string;
  theirPostDescription?: string;
  theirMeetingLocation?: string;
  theirAuthorName: string;
  theirProfileImage?: string;
  Score?: number | null;
  Comment?: string | null;
  PartnerScore?: number | null;
  PartnerComment?: string | null;
}

interface PartnerStats {
  successfulExchanges: number;
  reviewScore: string;
}

interface ApiError {
  message?: string;
}

// =========================================================================
// COMPONENT: ExchangeDetail (หน้าจอแสดงรายละเอียดเชิงลึกของรายการแลกเปลี่ยน)[cite: 10]
// =========================================================================
export default function ExchangeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<ExchangeDetailData | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({
    successfulExchanges: 0,
    reviewScore: "0.0",
  });
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * ฟังก์ชัน: fetchDetailData[cite: 10]
   * มีไว้สำหรับ: ดึงข้อมูลรายการแลกเปลี่ยนทั้งหมดจาก API กรองเฉพาะรายการที่ตรงกับ ID บน URL[cite: 10]
   * และดึงข้อมูลสถิติคะแนนรีวิวของคู่แลกเปลี่ยนมาแสดงผลประกอบกัน[cite: 10]
   */
  const fetchDetailData = async () => {
    try {
      setLoading(true);
      const response = await getExchanges();
      if (response && response.success) {
        const foundItem = response.data.find(
          (e: ExchangeDetailData) => String(e.ExchangeID) === String(id),
        );

        if (foundItem) {
          setItem(foundItem);

          const savedUser = sessionStorage.getItem("user");
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          const currentUserId = currentUser
            ? currentUser.id || currentUser.UserID || currentUser.MemberID
            : "";

          const partnerId =
            String(foundItem.MemberID) === String(currentUserId)
              ? foundItem.TargetMemberID
              : foundItem.MemberID;

          if (partnerId) {
            const statsResponse = await getUserStats(partnerId);
            if (statsResponse && statsResponse.success && statsResponse.data) {
              const avgScore = parseFloat(
                statsResponse.data.reviewScore || "0",
              );
              setPartnerStats({
                successfulExchanges:
                  statsResponse.data.successfulExchanges || 0,
                reviewScore: avgScore > 0 ? avgScore.toFixed(1) : "0.0",
              });
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error fetching exchange details:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * EFFECT: เรียกใช้งานฟังก์ชัน fetchDetailData และเลื่อนหน้าจอขึ้นด้านบนสุดอัตโนมัติเมื่อค่า id เปลี่ยนแปลง[cite: 10]
   */
  useEffect(() => {
    fetchDetailData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-20 font-medium text-muted-foreground">
        กำลังโหลดข้อมูลการแลกเปลี่ยน...
      </div>
    );
  if (!item)
    return (
      <div className="text-center py-20 font-medium text-muted-foreground">
        ไม่พบข้อมูลรายการนี้
      </div>
    );

  const savedUser = sessionStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const currentUserId = currentUser
    ? currentUser.id || currentUser.UserID || currentUser.MemberID
    : "";

  const isRequester = String(item.MemberID) === String(currentUserId);
  const status = item.ExchangeStatus.toLowerCase();
  const isCompleted = status === "completed";
  const isRejected = status === "rejected";
  const isFailed = status === "failed" || status === "cancelled";
  const isAutoCancelled = status === "auto_cancelled";
  const isFailedOrCancelled = isRejected || isFailed || isAutoCancelled;

  const receivedScore = isRequester ? item.PartnerScore : item.Score;
  const receivedComment = isRequester ? item.PartnerComment : item.Comment;

  /**
   * ฟังก์ชัน: getImageUrl[cite: 10]
   * มีไว้สำหรับ: จัดรูปแบบ URL ของรูปภาพสินค้า โดยดึงชื่อไฟล์ภาพแรกและเชื่อมต่อกับ Base URL ของระบบอัปโหลด[cite: 10]
   */
  const getImageUrl = (imageString: string): string => {
    if (!imageString) return "/placeholder-image.png";
    return `${IMAGE_BASE_URL}/uploads/${imageString.split(",")[0].trim()}`;
  };

  /**
   * ฟังก์ชัน: formatDate[cite: 10]
   * มีไว้สำหรับ: แปลงรูปแบบสตริงวันที่ให้อยู่ในรูปแบบมาตรฐาน YYYY-MM-DD เพื่อให้อ่านง่าย[cite: 10]
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString.split(" ")[0];
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <AppLayout>
      <section className="py-8 sm:py-12 bg-[#FAFAFA] min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold font-heading">
                รายละเอียดการแลกเปลี่ยน
              </h1>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border border-border/50 shadow-sm bg-background">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-6 justify-between w-full">
                  <div className="flex-1 w-full min-w-0 bg-muted/20 p-5 rounded-2xl border border-border/60">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 p-2">
                        <img
                          src={getImageUrl(item.myPostImage)}
                          alt="My Item"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center w-full min-w-0 flex flex-col items-center">
                        <span className="text-[11px] text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-2 font-bold">
                          ของของคุณ
                        </span>
                        <p
                          className="text-sm font-bold truncate w-full px-2"
                          title={item.myPostTitle}
                        >
                          {item.myPostTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3 text-center break-words w-full px-2">
                          {item.myPostDescription || "ไม่มีรายละเอียด"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 bg-white p-2 rounded-lg border border-border/50 w-full justify-center">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {item.myMeetingLocation || "ไม่ระบุสถานที่"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-center pt-24 flex-shrink-0 px-2">
                    <ArrowRightLeft className="h-6 w-6 text-primary/40" />
                  </div>

                  <div className="flex-1 w-full min-w-0 bg-muted/20 p-5 rounded-2xl border border-border/60">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 p-2">
                        <img
                          src={getImageUrl(item.theirPostImage)}
                          alt="Their Item"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center w-full min-w-0 flex flex-col items-center">
                        <span className="text-[11px] text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-2 font-bold">
                          สิ่งที่ได้รับ
                        </span>
                        <p
                          className="text-sm font-bold truncate w-full px-2"
                          title={item.theirPostTitle}
                        >
                          {item.theirPostTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3 text-center break-words w-full px-2">
                          {item.theirPostDescription || "ไม่มีรายละเอียด"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 bg-white p-2 rounded-lg border border-border/50 w-full justify-center">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {item.theirMeetingLocation || "ไม่ระบุสถานที่"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow
                    icon={<Calendar />}
                    label="วันที่เริ่มแลกเปลี่ยน"
                    value={item.StartDate ? formatDate(item.StartDate) : "-"}
                  />
                  <DetailRow
                    icon={<CheckCircle2 />}
                    label={
                      isFailedOrCancelled
                        ? "วันที่ยกเลิก"
                        : "วันที่แลกเปลี่ยนสำเร็จ"
                    }
                    value={
                      isFailedOrCancelled
                        ? item.CancelDate
                          ? formatDate(item.CancelDate)
                          : "-"
                        : item.SuccessDate
                          ? formatDate(item.SuccessDate)
                          : "ยังไม่สำเร็จ"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* แสดงส่วนรีวิวเฉพาะเมื่อสำเร็จและมีคะแนน */}
            {isCompleted && receivedScore != null && (
              <Card className="border border-border/50 shadow-sm bg-background">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquareQuote className="w-5 h-5 text-primary" />{" "}
                    การประเมินและรีวิว
                  </h2>

                  <div className="space-y-4">
                    <div className="bg-background border shadow-sm rounded-xl p-5 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                      <p className="text-xs font-bold text-primary">
                        คะแนนที่คุณได้รับ
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= receivedScore ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold">
                          {Number(receivedScore).toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-secondary/20 p-3.5 rounded-lg border border-border/50">
                        <p className="text-[13px] text-foreground italic">
                          "{receivedComment || "ไม่มีคำบรรยายเพิ่มเติม"}"
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* แสดงสรุปข้อมูลการยกเลิก / ปฏิเสธ แยกตามสถานะและโทนสี */}
            {isFailedOrCancelled && (
              <Card
                className={`border shadow-sm ${
                  isRejected
                    ? "border-orange-200 bg-orange-50/20"
                    : isAutoCancelled
                      ? "border-slate-200 bg-slate-50/10"
                      : "border-rose-200 bg-rose-50/20"
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  <h2
                    className={`text-sm font-bold flex items-center gap-2 ${
                      isRejected
                        ? "text-orange-900"
                        : isAutoCancelled
                          ? "text-slate-900 dark:text-slate-200"
                          : "text-rose-900"
                    }`}
                  >
                    <XCircle
                      className={`w-5 h-5 ${
                        isRejected
                          ? "text-orange-600"
                          : isAutoCancelled
                            ? "text-slate-600"
                            : "text-rose-600"
                      }`}
                    />
                    {isRejected
                      ? "คำขอถูกปฏิเสธ"
                      : isAutoCancelled
                        ? "รายการถูกยกเลิกอัตโนมัติโดยระบบ"
                        : "สรุปข้อมูลการยกเลิกรายการ"}
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-white/70 dark:bg-zinc-900/40 p-3 rounded-xl border border-border/50">
                      <span className="text-muted-foreground font-medium">
                        วันที่ยกเลิก / ปฏิเสธ:
                      </span>
                      <span className="font-bold text-foreground">
                        {item.CancelDate ? formatDate(item.CancelDate) : "-"}
                      </span>
                    </div>
                    <div className="bg-white/70 dark:bg-zinc-900/40 p-3 rounded-xl border border-border/50 space-y-1">
                      <span className="text-muted-foreground font-medium block">
                        เหตุผล:
                      </span>
                      <p className="font-semibold text-foreground italic">
                        "{item.CancelReason || "ไม่มีระบุเหตุผลเพิ่มเติม"}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-border/50 shadow-sm bg-background">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-foreground">
                  ข้อมูลคู่แลกเปลี่ยน
                </h2>
                <div className="flex items-center gap-4 bg-background border border-border/60 p-4 rounded-xl shadow-sm">
                  <Avatar className="h-14 w-14 shadow-sm border border-border">
                    {item.theirProfileImage ? (
                      <img
                        src={`${IMAGE_BASE_URL}/uploads/${item.theirProfileImage}`}
                        alt="profile"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {item.theirAuthorName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-base">
                      {item.theirAuthorName}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-semibold border border-amber-200 text-[11px]">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />{" "}
                        คะแนนเฉลี่ย {partnerStats.reviewScore}
                      </span>
                      <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold border border-primary/20 text-[11px]">
                        <Package className="h-3.5 w-3.5" /> แลกสำเร็จ{" "}
                        {partnerStats.successfulExchanges} ครั้ง
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

// =========================================================================
// COMPONENT: StepIndicator[cite: 10]
// =========================================================================
function StepIndicator({
  step,
  currentStatus,
  label,
}: {
  step: number;
  currentStatus: string;
  label: string;
}) {
  let activeStep = 1;
  if (currentStatus === "accepted") activeStep = 2;
  if (currentStatus === "in_progress") activeStep = 3;
  if (currentStatus === "completed") activeStep = 4;

  const isPassed = step < activeStep;
  const isCurrent = step === activeStep;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
          isPassed
            ? "bg-primary text-white"
            : isCurrent
              ? "bg-primary text-white ring-4 ring-primary/20"
              : "bg-muted text-muted-foreground border border-border"
        }`}
      >
        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : step}
      </div>
      <p
        className={`text-[11px] sm:text-xs font-medium ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}
      >
        {label}
      </p>
    </div>
  );
}

// =========================================================================
// COMPONENT: DetailRow[cite: 10]
// =========================================================================
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
    <div
      className={`flex items-start gap-3 p-0 ${full ? "sm:col-span-2" : ""}`}
    >
      <div className="bg-transparent p-1 text-muted-foreground">{icon}</div>
      <div className="space-y-0.5 mt-1">
        <p className="text-[11px] text-muted-foreground font-bold">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
