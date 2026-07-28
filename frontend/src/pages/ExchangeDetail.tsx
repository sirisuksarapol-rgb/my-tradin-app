import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ArrowRightLeft, Star, MapPin, 
  Calendar, CheckCircle, XCircle, Package, Phone, ShieldCheck, AlertCircle
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

// 🎯 INTERFACES แบบเข้มงวด (ไม่มี any)
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
  myPostTitle: string;
  myPostImage: string;
  theirPostTitle: string;
  theirPostImage: string;
  theirAuthorName: string;
  CancelDate?: string;
  
  Score?: number | null;
  Comment?: string | null;
  PartnerScore?: number | null;
  PartnerComment?: string | null;
}

interface PartnerStats {
  successfulExchanges: number;
  reviewScore: string;
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: boolean;
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
  const [otpStep, setOtpStep] = useState<"none" | "requesting" | "verifying">("none");
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
              setPartnerStats({
                successfulExchanges: statsResponse.data.successfulExchanges || 0,
                reviewScore: statsResponse.data.reviewScore || "0.0"
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

  const handleRequestOTP = async () => {
    if (!item) return;
    try {
      setActionLoading(true);
      const res = await requestExchangeCode(item.ExchangeID);
      if (res.success) {
        alert(res.message);
        setOtpStep("verifying");
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "เกิดข้อผิดพลาดในการขอรหัส"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!item || !otpCode) return alert("กรุณากรอกรหัส OTP");
    try {
      setActionLoading(true);
      const res = await verifyExchangeCode(item.ExchangeID, otpCode);
      if (res.success) {
        alert(res.message);
        setOtpStep("none");
        fetchDetailData();
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "รหัส OTP ไม่ถูกต้อง"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!item) return;
    const reason = prompt("กรุณาระบุเหตุผลที่ต้องการยกเลิก:");
    if (reason === null) return;
    try {
      setActionLoading(true);
      const res = await cancelExchange(item.ExchangeID, reason);
      if (res.success) {
        alert("ยกเลิกสำเร็จ");
        fetchDetailData();
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "เกิดข้อผิดพลาดในการยกเลิก"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!item) return;
    try {
      setActionLoading(true);
      const reviewData = { score: reviewScore, comment: reviewComment };
      const res = await completeExchange(item.ExchangeID, reviewData);
      if (res.success) {
        alert(res.message);
        setShowReview(false);
        fetchDetailData();
      } else {
        alert(res.message);
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "เกิดข้อผิดพลาดในการบันทึกรีวิว"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">กำลังโหลด...</div>;
  if (!item) return <div className="text-center py-20">ไม่พบข้อมูล</div>;

  // 🎯 UI Logic variables
  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const currentUserId = currentUser ? (currentUser.id || currentUser.UserID || currentUser.MemberID) : "";
  
  const isRequester = String(item.MemberID) === String(currentUserId);
  const myVerified = isRequester ? item.IsMemberVerified : item.IsTargetMemberVerified;
  
  // ตรวจสอบว่าผู้ใช้งานปัจจุบันได้รีวิวหรือยัง
  const hasReviewed = isRequester ? item.IsMemberReceived === 1 : item.IsTargetMemberReceived === 1;
  
  const isCompleted = item.ExchangeStatus.toLowerCase() === "completed";
  const isAccepted = item.ExchangeStatus.toLowerCase() === "accepted";
  const isInProgress = item.ExchangeStatus.toLowerCase() === "in_progress";
  const isFailedOrCancelled = ["cancelled", "rejected", "failed"].includes(item.ExchangeStatus.toLowerCase());

  const getImageUrl = (imageString: string): string => {
    if (!imageString) return "/placeholder-image.png";
    return `${IMAGE_BASE_URL}/uploads/${imageString.split(",")[0].trim()}`;
  };

  let statusColor = "bg-gray-50 border-gray-200 text-gray-700";
  let statusText = "รอดำเนินการ";
  let StatusIcon = AlertCircle;

  if (isCompleted) { statusColor = "bg-green-50 border-green-200 text-green-700"; statusText = "แลกเปลี่ยนสำเร็จ"; StatusIcon = CheckCircle; }
  else if (isInProgress) { statusColor = "bg-blue-50 border-blue-200 text-blue-700"; statusText = "กำลังดำเนินการ (ยืนยัน OTP แล้ว)"; StatusIcon = ShieldCheck; }
  else if (isAccepted) { statusColor = "bg-yellow-50 border-yellow-200 text-yellow-700"; statusText = "ตอบรับแล้ว (รอการยืนยันตัวตน)"; StatusIcon = CheckCircle; }
  else if (isFailedOrCancelled) { statusColor = "bg-red-50 border-red-200 text-red-700"; statusText = `ยกเลิก/ไม่สำเร็จ (${item.ExchangeStatus})`; StatusIcon = XCircle; }

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 mb-8">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold">รายละเอียดการแลกเปลี่ยน</h1>
            </div>
            
            {(!isCompleted && !isFailedOrCancelled) && (
                <Button variant="destructive" size="sm" onClick={handleCancel} disabled={actionLoading}>
                    ยกเลิกดีลนี้
                </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border ${statusColor}`}>
                <div className="flex items-center gap-3">
                  <StatusIcon className="w-6 h-6" />
                  <div>
                    <p className="text-sm font-bold">สถานะ: {statusText}</p>
                    <p className="text-[11px] opacity-80 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> ยื่นข้อเสนอเมื่อ: {item.StartDate.split(" ")[0]}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="glass-card border-none shadow-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-6 justify-center">
                    <div className="flex-1 flex flex-col items-center space-y-3">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden shadow-sm">
                        <img src={getImageUrl(item.myPostImage)} alt="My Item" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold line-clamp-1">{item.myPostTitle}</p>
                        <span className="text-[10px] text-primary bg-primary/10 rounded-full px-2 py-0.5 inline-block mt-1">ของของคุณ</span>
                      </div>
                    </div>

                    <ArrowRightLeft className="h-6 w-6 text-primary flex-shrink-0" />

                    <div className="flex-1 flex flex-col items-center space-y-3">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden shadow-sm">
                        <img src={getImageUrl(item.theirPostImage)} alt="Their Item" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold line-clamp-1">{item.theirPostTitle}</p>
                        <span className="text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 inline-block mt-1">สิ่งที่ได้รับ</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow icon={<MapPin />} label="สถานที่นัดรับ" value={item.ExchangeLocation} full />
                    
                    <div className="sm:col-span-2 bg-secondary/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-background p-2 rounded-lg shadow-sm border border-border"><Phone className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">เบอร์โทรติดต่อคู่กรณี</p>
                                <p className="text-sm font-semibold">
                                    {myVerified === 1 ? (item.partnerPhone || "ยังไม่ระบุเบอร์") : "🔒 ถูกซ่อนไว้เพื่อความปลอดภัย"}
                                </p>
                            </div>
                        </div>

                        {(isAccepted || isInProgress) && myVerified === 0 && otpStep === "none" && (
                            <Button size="sm" onClick={handleRequestOTP} disabled={actionLoading}>ขอรหัสยืนยัน (OTP)</Button>
                        )}
                        {otpStep === "verifying" && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <input 
                                    type="text" maxLength={6} placeholder="รหัส 6 หลัก" 
                                    className="border rounded-md px-3 py-1 text-sm w-full sm:w-32"
                                    value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                                />
                                <Button size="sm" onClick={handleVerifyOTP} disabled={actionLoading}>ยืนยันรหัส</Button>
                            </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass-card border-none shadow-sm border-l-4 border-l-primary/30">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase">ข้อมูลคู่แลกเปลี่ยน</h2>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {item.theirAuthorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.theirAuthorName}</p>
                      <div className="flex gap-2 mt-2 text-[11px]">
                        <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">
                          <Star className="h-3 w-3 fill-yellow-500" /> {partnerStats.reviewScore}
                        </span>
                        <span className="flex items-center gap-1 bg-primary/5 text-primary px-1.5 py-0.5 rounded">
                          <Package className="h-3 w-3" /> แลกสำเร็จ {partnerStats.successfulExchanges}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ส่วนแสดงรีวิวที่ "คู่แลกเปลี่ยน" ให้เรา */}
              {item.PartnerScore != null && (
                <div className="bg-background border shadow-sm rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> รีวิวจากคู่แลกเปลี่ยน
                  </h2>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-3 w-3 ${star <= (item.PartnerScore || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  {item.PartnerComment && (
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">"{item.PartnerComment}"</p>
                  )}
                </div>
              )}

              {/* ส่วนแสดงรีวิวที่ "เรา" ให้คู่แลกเปลี่ยน */}
              {hasReviewed && item.Score != null && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" /> รีวิวที่คุณเขียน
                  </h2>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-3 w-3 ${star <= (item.Score || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  {item.Comment && (
                    <p className="text-sm italic text-muted-foreground">"{item.Comment}"</p>
                  )}
                </div>
              )}

              {/* ปุ่มกดยืนยันการรับของ (แสดงเมื่อสถานะ in_progress หรือ accepted และยังไม่ได้รีวิว) */}
              {(isInProgress || (isAccepted && myVerified === 1)) && !hasReviewed && !showReview && (
                 <Button className="w-full" onClick={() => setShowReview(true)}>
                     ยืนยันว่าได้รับสิ่งของแล้ว
                 </Button>
              )}

              {/* ฟอร์มการให้คะแนน */}
              {showReview && (
                  <Card className="shadow-sm border-primary/20 bg-primary/5">
                      <CardContent className="p-5 space-y-4">
                          <h3 className="font-bold text-sm">ให้คะแนนการแลกเปลี่ยนนี้</h3>
                          <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-6 w-6 cursor-pointer ${star <= reviewScore ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                    onClick={() => setReviewScore(star)}
                                  />
                              ))}
                          </div>
                          <textarea 
                              className="w-full text-sm p-3 rounded-md border focus:ring-1 focus:ring-primary outline-none" 
                              rows={3} 
                              placeholder="เขียนความรู้สึกประทับใจ..." 
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                          />
                          <div className="flex gap-2">
                              <Button variant="outline" className="w-full" onClick={() => setShowReview(false)}>ยกเลิก</Button>
                              <Button className="w-full" onClick={handleSubmitReview} disabled={actionLoading}>ส่งรีวิว</Button>
                          </div>
                      </CardContent>
                  </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function DetailRow({ icon, label, value, full = false }: DetailRowProps) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors ${full ? "sm:col-span-2" : ""}`}>
      <div className="bg-background p-2 rounded-lg shadow-sm border border-border text-primary">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[10px] text-muted-foreground font-bold uppercase">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}