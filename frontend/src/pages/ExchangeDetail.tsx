import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ArrowRightLeft, Star, MapPin, 
  Calendar, CheckCircle2, XCircle, Package, Phone, 
  ShieldCheck, Info, Lock, MessageSquareQuote
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { 
  getExchanges, getUserStats, IMAGE_BASE_URL, 
  requestExchangeCode, verifyExchangeCode, 
  cancelExchange, completeExchange 
} from "@/api/api";

// 🎯 INTERFACES
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

export default function ExchangeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<ExchangeDetailData | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats>({ successfulExchanges: 0, reviewScore: "0.0" });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  const [otpStep, setOtpStep] = useState<"none" | "verifying">("none");
  const [otpCode, setOtpCode] = useState<string>("");
  
  const [showReview, setShowReview] = useState<boolean>(false);
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");

  const fetchDetailData = async () => {
    try {
      setLoading(true);
      const response = await getExchanges();
      if (response && response.success) {
        const foundItem = response.data.find((e: ExchangeDetailData) => String(e.ExchangeID) === String(id));
        
        if (foundItem) {
          setItem(foundItem);

          const savedUser = localStorage.getItem("user");
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          const currentUserId = currentUser ? (currentUser.id || currentUser.UserID || currentUser.MemberID) : "";
          
          const partnerId = String(foundItem.MemberID) === String(currentUserId) 
            ? foundItem.TargetMemberID 
            : foundItem.MemberID;

          if (partnerId) {
            const statsResponse = await getUserStats(partnerId);
            if (statsResponse && statsResponse.success && statsResponse.data) {
              const avgScore = parseFloat(statsResponse.data.reviewScore || "0");
              setPartnerStats({
                successfulExchanges: statsResponse.data.successfulExchanges || 0,
                reviewScore: avgScore > 0 ? avgScore.toFixed(1) : "0.0"
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

  useEffect(() => {
    fetchDetailData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const getErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
      return String((err as ApiError).message);
    }
    return defaultMessage;
  };

  const handleRequestOTP = async () => { /* โค้ดเดิม */ };
  const handleVerifyOTP = async () => { /* โค้ดเดิม */ };
  const handleCancel = async () => { /* โค้ดเดิม */ };
  const handleSubmitReview = async () => { /* โค้ดเดิม */ };

  if (loading) return <div className="text-center py-20 font-medium text-muted-foreground">กำลังโหลดข้อมูลการแลกเปลี่ยน...</div>;
  if (!item) return <div className="text-center py-20 font-medium text-muted-foreground">ไม่พบข้อมูลรายการนี้</div>;

  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const currentUserId = currentUser ? (currentUser.id || currentUser.UserID || currentUser.MemberID) : "";
  
  const isRequester = String(item.MemberID) === String(currentUserId);
  const myVerified = isRequester ? item.IsMemberVerified : item.IsTargetMemberVerified;
  const hasReviewed = isRequester ? item.IsMemberReceived === 1 : item.IsTargetMemberReceived === 1;

  const status = item.ExchangeStatus.toLowerCase();
  const isCompleted = status === "completed";
  const isAccepted = status === "accepted";
  const isInProgress = status === "in_progress";
  const isFailedOrCancelled = ["cancelled", "rejected", "failed"].includes(status);

  // ดึงคะแนนสำหรับรายการนี้โดยเฉพาะ
  const receivedScore = isRequester ? item.PartnerScore : item.Score;
  const receivedComment = isRequester ? item.PartnerComment : item.Comment;

  const getImageUrl = (imageString: string): string => {
    if (!imageString) return "/placeholder-image.png";
    return `${IMAGE_BASE_URL}/uploads/${imageString.split(",")[0].trim()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString.split(" ")[0];
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <AppLayout>
      <section className="py-8 sm:py-12 bg-[#FAFAFA] min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">รายละเอียดการแลกเปลี่ยน</h1>
          </div>

          {/* Stepper Status */}
          {!isFailedOrCancelled ? (
            <Card className="border border-border/50 shadow-sm bg-background p-6">
              <div className="grid grid-cols-4 gap-2 text-center relative">
                <StepIndicator step={1} currentStatus={status} label="ยื่นข้อเสนอ" />
                <StepIndicator step={2} currentStatus={status} label="ตอบรับแล้ว" />
                <StepIndicator step={3} currentStatus={status} label="ยืนยัน OTP" />
                <StepIndicator step={4} currentStatus={status} label="สำเร็จ" />
              </div>
            </Card>
          ) : (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">การแลกเปลี่ยนนี้ถูกยกเลิก / ไม่สำเร็จ</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            
            {/* 1. Item Comparison Card */}
            <Card className="border border-border/50 shadow-sm bg-background">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-6 justify-between w-full">
                  
                  {/* ของของคุณ */}
                  <div className="flex-1 w-full min-w-0 bg-muted/20 p-5 rounded-2xl border border-border/60">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 p-2">
                        <img src={getImageUrl(item.myPostImage)} alt="My Item" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center w-full min-w-0 flex flex-col items-center">
                        <span className="text-[11px] text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-2 font-bold">ของของคุณ</span>
                        <p className="text-sm font-bold truncate w-full px-2" title={item.myPostTitle}>{item.myPostTitle}</p>
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3 text-center break-words w-full px-2">
                          {item.myPostDescription || "ไม่มีรายละเอียด"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 bg-white p-2 rounded-lg border border-border/50 w-full justify-center">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.myMeetingLocation || "ไม่ระบุสถานที่"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ไอคอนสลับ */}
                  <div className="hidden sm:flex items-center justify-center pt-24 flex-shrink-0 px-2">
                    <ArrowRightLeft className="h-6 w-6 text-primary/40" />
                  </div>

                  {/* สิ่งที่ได้รับ */}
                  <div className="flex-1 w-full min-w-0 bg-muted/20 p-5 rounded-2xl border border-border/60">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl overflow-hidden shadow-sm flex-shrink-0 p-2">
                        <img src={getImageUrl(item.theirPostImage)} alt="Their Item" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center w-full min-w-0 flex flex-col items-center">
                        <span className="text-[11px] text-primary bg-primary/10 rounded-full px-3 py-1 inline-block mb-2 font-bold">สิ่งที่ได้รับ</span>
                        <p className="text-sm font-bold truncate w-full px-2" title={item.theirPostTitle}>{item.theirPostTitle}</p>
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3 text-center break-words w-full px-2">
                          {item.theirPostDescription || "ไม่มีรายละเอียด"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 bg-white p-2 rounded-lg border border-border/50 w-full justify-center">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.theirMeetingLocation || "ไม่ระบุสถานที่"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* แสดงวันที่ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow icon={<Calendar />} label="วันที่เริ่มแลกเปลี่ยน" value={item.StartDate ? formatDate(item.StartDate) : "-"} />
                  <DetailRow icon={<CheckCircle2 />} label="วันที่แลกเปลี่ยนสำเร็จ" value={item.SuccessDate ? formatDate(item.SuccessDate) : "ยังไม่สำเร็จ"} />
                </div>
              </CardContent>
            </Card>

            {/* 2. Review Section (แสดงเฉพาะรีวิวที่คุณได้รับเท่านั้น) */}
            {receivedScore != null && (
              <Card className="border border-border/50 shadow-sm bg-background">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquareQuote className="w-5 h-5 text-primary" /> การประเมินและรีวิว
                  </h2>
                  
                  <div className="space-y-4">
                    {/* คะแนนที่คุณได้รับ */}
                    <div className="bg-background border shadow-sm rounded-xl p-5 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                      <p className="text-xs font-bold text-primary">คะแนนที่คุณได้รับ</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= receivedScore ? 'text-amber-500 fill-amber-500' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-bold">{Number(receivedScore).toFixed(1)}</span>
                      </div>
                      <div className="bg-secondary/20 p-3.5 rounded-lg border border-border/50">
                        <p className="text-[13px] text-foreground italic">"{receivedComment || 'ไม่มีคำบรรยายเพิ่มเติม'}"</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. ข้อมูลคู่แลกเปลี่ยน (ค่าเฉลี่ยทั้งหมด) */}
            <Card className="border border-border/50 shadow-sm bg-background">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-sm font-bold text-foreground">ข้อมูลคู่แลกเปลี่ยน</h2>
                <div className="flex items-center gap-4 bg-background border border-border/60 p-4 rounded-xl shadow-sm">
                  <Avatar className="h-14 w-14 shadow-sm border border-border">
                    {item.theirProfileImage ? (
                      <img 
                        src={`${IMAGE_BASE_URL}/uploads/${item.theirProfileImage}`} 
                        alt="profile" 
                        className="w-full h-full object-cover rounded-full" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {item.theirAuthorName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-base">{item.theirAuthorName}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-semibold border border-amber-200 text-[11px]">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> คะแนนเฉลี่ย {partnerStats.reviewScore}
                      </span>
                      <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold border border-primary/20 text-[11px]">
                        <Package className="h-3.5 w-3.5" /> แลกสำเร็จ {partnerStats.successfulExchanges} ครั้ง
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

// Sub-components
function StepIndicator({ step, currentStatus, label }: { step: number; currentStatus: string; label: string }) {
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
          isPassed ? "bg-primary text-white" : isCurrent ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground border border-border"
        }`}
      >
        {isPassed ? <CheckCircle2 className="w-5 h-5" /> : step}
      </div>
      <p className={`text-[11px] sm:text-xs font-medium ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
}

function DetailRow({ icon, label, value, full = false }: { icon: React.ReactNode; label: string; value: string; full?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-0 ${full ? "sm:col-span-2" : ""}`}>
      <div className="bg-transparent p-1 text-muted-foreground">{icon}</div>
      <div className="space-y-0.5 mt-1">
        <p className="text-[11px] text-muted-foreground font-bold">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}