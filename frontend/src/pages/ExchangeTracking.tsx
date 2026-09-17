import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  ArrowRightLeft,
  ShieldCheck,
  Star,
  Package,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  UserCheck,
  Check,
  FileText,
  MessageSquareQuote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  completeExchange,
  getExchanges,
  IMAGE_BASE_URL,
  verifyExchangeCode,
  cancelExchange,
} from "@/api/api";

// ========================================================
// 📐 TYPES & INTERFACES
// ========================================================
interface ExchangeItem {
  ExchangeID: number | string;
  ExchangeStatus: string;
  ExchangeType?: string;
  MatchScore?: number;
  myPostTitle?: string;
  myPostImage?: string;
  myPostDescription?: string;
  theirPostTitle?: string;
  theirPostImage?: string;
  theirPostDescription?: string;
  PhoneNumber?: string;
  TargetPhoneNumber?: string;
  partnerPhone?: string;
  MemberID?: number;
  TargetMemberID?: number;
  IsMemberVerified?: number;
  IsTargetMemberVerified?: number;
  ExchangeLocation?: string;
  IsMemberReceived?: number;
  IsTargetMemberReceived?: number;
  Score?: number | null;
  PartnerScore?: number | null;
  Comment?: string | null;
  PartnerComment?: string | null;
  CancelReason?: string | null; // 👈 เพิ่มบรรทัดนี้ เพื่อให้ TypeScript รู้จัก
}

interface ErrorResponse {
  message?: string;
}

const stepIndex: Record<string, number> = {
  pending: 0,
  accepted: 1,
  in_progress: 2,
  completed: 3,
  failed: 3,
  auto_cancelled: 3,
  rejected: 0,
};

const statusConfig = {
  pending: {
    label: "รอตอบรับ",
    icon: Clock,
    circleClass: "bg-amber-500 text-white border-amber-500",
    currentCircleClass:
      "bg-amber-500 text-white border-amber-500 ring-4 ring-amber-500/20",
    textClass: "text-amber-600",
  },
  accepted: {
    label: "ตอบรับแล้ว",
    icon: CheckCircle,
    circleClass: "bg-blue-500 text-white border-blue-500",
    currentCircleClass:
      "bg-blue-500 text-white border-blue-500 ring-4 ring-blue-500/20",
    textClass: "text-blue-600",
  },
  in_progress: {
    label: "ระหว่างดำเนินการ",
    icon: ArrowRightLeft,
    circleClass: "bg-purple-500 text-white border-purple-500",
    currentCircleClass:
      "bg-purple-500 text-white border-purple-500 ring-4 ring-purple-500/20",
    textClass: "text-purple-600",
  },
  completed: {
    label: "สำเร็จแล้ว",
    icon: Star,
    circleClass: "bg-emerald-500 text-white border-emerald-500",
    currentCircleClass:
      "bg-emerald-500 text-white border-emerald-500 ring-4 ring-emerald-500/20",
    textClass: "text-emerald-600",
  },
  rejected: {
    label: "ถูกปฏิเสธ",
    icon: XCircle,
    circleClass: "bg-orange-500 text-white border-orange-500",
    currentCircleClass:
      "bg-orange-500 text-white border-orange-500 ring-4 ring-orange-500/20",
    textClass: "text-orange-600",
  },
  failed: {
    label: "ยกเลิกแล้ว",
    icon: AlertCircle,
    circleClass: "bg-red-500 text-white border-red-500",
    currentCircleClass:
      "bg-red-500 text-white border-red-500 ring-4 ring-red-500/20",
    textClass: "text-red-600",
  },
  auto_cancelled: {
    label: "ยกเลิกอัตโนมัติ",
    icon: AlertCircle,
    circleClass: "bg-slate-600 text-white border-slate-600",
    currentCircleClass:
      "bg-slate-600 text-white border-slate-600 ring-4 ring-slate-600/20",
    textClass: "text-slate-700 dark:text-slate-300",
  },
};

const defaultReasonOptions = [
  "เปลี่ยนใจไม่ต้องการแลกแล้ว",
  "ติดต่อคู่แลกเปลี่ยนไม่ได้",
  "สินค้าจริงไม่ตรงกับรูปภาพ",
  "ตกลงสถานที่นัดพบไม่ได้",
  "เหตุผลอื่นๆ",
];

export default function ExchangeTracking() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ========================================================
  // ⚙️ STATE MANAGEMENT
  // ========================================================
  const [isLoading, setIsLoading] = useState(true);
  const [exchange, setExchange] = useState({
    matchId: matchId || "unknown",
    status: "pending",
    exchangeType: "manual",
    matchScore: 0,
    score: null as number | null, // 👈 ใส่ as number | null เพื่อกันแดง
    partnerScore: null as number | null, // 👈 ใส่ as number | null เพื่อกันแดง
    comment: "",
    partnerComment: "",
    cancelReasonDb: "",
    myItem: {
      title: "กำลังโหลด...",
      image: "",
      description: "ไม่ได้ระบุรายละเอียด",
    },
    theirItem: {
      title: "กำลังโหลด...",
      image: "",
      description: "ไม่ได้ระบุรายละเอียด",
    },
    partnerPhone: "-",
    exchangeLocation: "นัดเจอตามตกลง",
    reasonOptions: defaultReasonOptions,
    memberId: 0,
    targetMemberId: 0,
    isMemberVerified: 0,
    isTargetMemberVerified: 0,
    isMemberReceived: 0,
    isTargetMemberReceived: 0,
  });

  const [cancelReason, setCancelReason] = useState("");
  const [finalReason, setFinalReason] = useState("");

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // ========================================================
  // 📦 HELPER FUNCTIONS
  // ========================================================
  const getCorrectImagePath = (imageName: string | undefined) => {
    if (!imageName || imageName.trim() === "undefined" || imageName === "null")
      return "/placeholder.jpg";
    try {
      let cleanStr = imageName.trim();
      if (cleanStr.startsWith("[")) {
        const safeJsonStr = cleanStr.replace(/'/g, '"');
        const parsed = JSON.parse(safeJsonStr);
        if (Array.isArray(parsed) && parsed.length > 0)
          cleanStr = parsed[0].trim();
      } else if (cleanStr.includes(",")) {
        cleanStr = cleanStr.split(",")[0].trim();
      }
      if (cleanStr.startsWith("http")) return cleanStr;
      return `${IMAGE_BASE_URL}/uploads/${cleanStr}`;
    } catch {
      const fallback = imageName
        .replace(/\[|\]|"|'/g, "")
        .split(",")[0]
        .trim();
      return fallback.startsWith("http")
        ? fallback
        : `${IMAGE_BASE_URL}/uploads/${fallback}`;
    }
  };

  const fetchTrackingData = useCallback(async () => {
    if (!matchId) return;
    try {
      setIsLoading(true);
      const res = await getExchanges();
      if (res && Array.isArray(res.data)) {
        const matchData = res.data.find(
          (e: ExchangeItem) => String(e.ExchangeID) === String(matchId),
        );

        if (matchData) {
          const savedUser = sessionStorage.getItem("user");
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          const currentUserId =
            currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;
          const isMember = String(currentUserId) === String(matchData.MemberID);

          setExchange({
            score: matchData.Score || null,
            partnerScore: matchData.PartnerScore || null,
            comment: matchData.Comment || "",
            partnerComment: matchData.PartnerComment || "",
            cancelReasonDb: matchData.CancelReason || "", // 👈 ตรงนี้ก็จะไม่แดง
            matchId: String(matchData.ExchangeID),
            status: (matchData.ExchangeStatus || "pending").toLowerCase(),
            exchangeType: matchData.ExchangeType || "manual",
            matchScore: matchData.MatchScore || 0,
            myItem: {
              title: matchData.myPostTitle || "สิ่งของของคุณ",
              image: matchData.myPostImage || "",
              description:
                matchData.myPostDescription ||
                "รายละเอียดเพิ่มเติมของสิ่งของ...",
            },
            theirItem: {
              title: matchData.theirPostTitle || "ของที่สนใจแลก",
              image: matchData.theirPostImage || "",
              description:
                matchData.theirPostDescription ||
                "รายละเอียดเพิ่มเติมของสิ่งของ...",
            },
            partnerPhone: isMember
              ? matchData.TargetPhoneNumber || matchData.partnerPhone || "-"
              : matchData.PhoneNumber || "-",
            exchangeLocation: matchData.ExchangeLocation || "นัดเจอตามตกลง",
            reasonOptions: defaultReasonOptions,
            memberId: matchData.MemberID ?? 0,
            targetMemberId: matchData.TargetMemberID ?? 0,
            isMemberVerified: matchData.IsMemberVerified ?? 0,
            isTargetMemberVerified: matchData.IsTargetMemberVerified ?? 0,
            isMemberReceived: matchData.IsMemberReceived ?? 0,
            isTargetMemberReceived: matchData.IsTargetMemberReceived ?? 0,
          });
        }
      }
    } catch (error: unknown) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลสถานะได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [matchId, toast]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // ========================================================
  // ⚡ HANDLERS
  // ========================================================
  const handleVerifyCode = async () => {
    if (!matchId) return;
    if (!verificationCode || verificationCode.length < 6) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกรหัสให้ครบ 6 หลัก",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyExchangeCode(matchId, verificationCode);
      if (res && res.success) {
        setIsVerifying(false);
        setIsVerifyModalOpen(false);
        setVerificationCode("");

        toast({
          title: "ยืนยันสำเร็จ",
          description: "ปลดล็อกเบอร์โทรศัพท์สำหรับติดต่อแล้ว",
        });
        fetchTrackingData();
      }
    } catch (error: unknown) {
      setIsVerifying(false);
      let errorMsg = "รหัสไม่ถูกต้องหรือหมดอายุ";
      if (error && typeof error === "object" && "message" in error) {
        errorMsg = (error as ErrorResponse).message || errorMsg;
      }
      toast({
        title: "รหัสไม่ถูกต้อง",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || !matchId) return;
    try {
      await cancelExchange(matchId, cancelReason);
      setFinalReason(cancelReason);
      setExchange((prev) => ({ ...prev, status: "failed" }));
      toast({
        title: "ยกเลิกรายการแล้ว",
        description: `สาเหตุ: ${cancelReason}`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกรายการได้ กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

  // 🟢 แก้ไข: ยิง API completeExchange ไปบันทึกในฐานข้อมูลจริง
  const handleConfirmReceive = async () => {
    if (!matchId) return;
    try {
      // เอา score: 5 ออก
      const res = await completeExchange(matchId, {
        score: null,
        comment: null,
      });
      if (res) {
        toast({
          title: "ยืนยันการรับของสำเร็จ",
          description: "ระบบบันทึกว่าคุณได้รับสินค้าเรียบร้อยแล้ว",
        });
        fetchTrackingData(); // โหลดข้อมูลสถานะใหม่ล่าสุดทันที
      }
    } catch (error) {
      console.error("Error confirming receive:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกสถานะได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4 text-muted-foreground">
            <Package className="h-12 w-12 text-primary opacity-50" />
            <p className="font-medium">กำลังโหลดข้อมูลการแลกเปลี่ยน...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // คำนวณสถานะ
  const currentStatus = exchange.status;
  const currentIdx = stepIndex[currentStatus] ?? 0;

  const savedUser = sessionStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const currentUserId =
    currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;
  const isMember = String(currentUserId) === String(exchange.memberId);

  const myVerifyStatus = isMember
    ? exchange.isMemberVerified
    : exchange.isTargetMemberVerified;
  const myReceiveStatus = isMember
    ? exchange.isMemberReceived
    : exchange.isTargetMemberReceived;
  const partnerReceiveStatus = isMember
    ? exchange.isTargetMemberReceived
    : exchange.isMemberReceived;

  const showOtpScreen =
    (currentStatus === "accepted" || currentStatus === "in_progress") &&
    myVerifyStatus === 0;
  const showProgressScreen =
    (currentStatus === "accepted" || currentStatus === "in_progress") &&
    myVerifyStatus === 1;
  const hasReceived = myReceiveStatus === 1;

  const steps = [
    currentStatus === "rejected"
      ? { key: "rejected", label: "ถูกปฏิเสธ", icon: XCircle }
      : { key: "pending", label: "รอตอบรับ", icon: Clock },
    { key: "accepted", label: "ตอบรับแล้ว", icon: CheckCircle },
    { key: "in_progress", label: "ระหว่างดำเนินการ", icon: ArrowRightLeft },
    currentStatus === "failed" || currentStatus === "auto_cancelled" // 👈 แก้ไขบรรทัดนี้
      ? {
          key: currentStatus,
          label:
            currentStatus === "auto_cancelled"
              ? "ยกเลิกอัตโนมัติ"
              : "ยกเลิกแล้ว",
          icon: XCircle,
        }
      : { key: "completed", label: "สำเร็จ", icon: Star },
  ];

  return (
    <AppLayout>
      <section className="py-6 sm:py-10 max-w-5xl mx-auto px-4 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ติดตามการแลกเปลี่ยน
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                ตรวจสอบรายละเอียดและสถานะการแลกเปลี่ยนของทั้งสองฝ่าย
              </p>
            </div>
          </div>

          {/* ส่วนขวา: ป้ายคะแนน (แสดงอยู่มุมขวา) */}
          {exchange.exchangeType === "match" && exchange.matchScore > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary border border-primary/20 px-3 py-1 text-xs font-bold text-white shadow-sm shrink-0 whitespace-nowrap">
              เหมาะสม{" "}
              {exchange.matchScore ? Math.round(exchange.matchScore) : 0}%
            </span>
          )}
        </div>

        {/* 🚀 Stepper */}
        <Card className="border bg-card shadow-sm rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-8">
              <Clock className="h-5 w-5 text-primary" /> สถานะการดำเนินการ
            </h2>

            {/* ใช้ items-start เพื่อให้ตำแหน่งของเส้นและไอคอนอยู่ด้านบนเสมอแม้ข้อความจะยาว */}
            <div className="relative flex flex-col sm:flex-row justify-between items-start w-full gap-6 sm:gap-0">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isDone = idx <= currentIdx; // ผ่านไปแล้วหรือเป็นปัจจุบัน
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                // ดึงค่า config ตามสเต็ปนั้นๆ
                const config =
                  statusConfig[step.key as keyof typeof statusConfig] ||
                  statusConfig.pending;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-3 z-10 relative sm:w-32">
                      {idx < steps.length - 1 && (
                        <div className="sm:hidden absolute left-6 top-[56px] w-[2px] h-6 -ml-[1px]">
                          <div
                            className={`w-full h-full rounded-full transition-all duration-500 ${isPast ? "bg-primary" : "bg-muted/60"}`}
                          />
                        </div>
                      )}

                      {/* 🟢 วงกลม Icon: ถ้าผ่านหรือปัจจุบัน จะใช้สีประจำสถานะนั้นทันที */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all border-2 ${
                          isDone
                            ? isCurrent
                              ? config.currentCircleClass
                              : config.circleClass
                            : "bg-card text-muted-foreground border-muted"
                        }`}
                      >
                        <StepIcon className="h-5 w-5" />
                      </div>

                      {/* 🟢 ข้อความสถานะ: ถ้าผ่านหรือปัจจุบัน จะใช้ textClass ประจำสถานะนั้น */}
                      <div className="text-left sm:text-center w-full">
                        <p
                          className={`text-sm font-bold ${
                            isDone ? config.textClass : "text-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
                            {step.key === "failed" ||
                            step.key === "auto_cancelled"
                              ? "รายการถูกยกเลิก"
                              : step.key === "rejected"
                                ? "คำขอถูกปฏิเสธ"
                                : "ขั้นตอนปัจจุบัน"}
                          </span>
                        )}
                      </div>
                    </div>

                    {idx < steps.length - 1 && (
                      <div className="hidden sm:flex flex-1 items-start justify-center pt-6 px-2 lg:px-4">
                        <div
                          className={`h-[3px] w-full rounded-full transition-all duration-500 ${
                            isPast ? "bg-slate-300" : "bg-muted/60"
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 🎉 สถานะ: สำเร็จแล้ว */}
        {currentStatus === "completed" && (
          <Card className="border bg-card rounded-2xl shadow-sm p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-4xl mb-1">🎉</div>
              <h3 className="font-bold text-lg">การแลกเปลี่ยนสำเร็จสมบูรณ์!</h3>
              <p className="text-xs text-muted-foreground">
                การแลกเปลี่ยนนี้เสร็จสิ้นเรียบร้อยแล้ว
                ขอบคุณที่ร่วมเป็นส่วนหนึ่งของคอมมูนิตี้
              </p>
            </div>

            {(() => {
              // ตรวจสอบคะแนนและคอมเมนต์ของฝั่งตัวเอง
              const userRating = isMember
                ? exchange.score
                : exchange.partnerScore;
              const userComment = isMember
                ? exchange.comment
                : exchange.partnerComment;
              const hasReviewed =
                userRating !== null &&
                userRating !== undefined &&
                userRating > 0;

              return hasReviewed ? (
                // 🌟 กรณีรีวิวแล้ว: แสดงการ์ดสรุปรีวิวสไตล์สวยงาม
                <Card className="border border-border/50 shadow-sm bg-background">
                  <CardContent className="p-6 space-y-6">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MessageSquareQuote className="w-5 h-5 text-primary" />{" "}
                      การประเมินและรีวิวของคุณ
                    </h2>

                    <div className="space-y-4">
                      <div className="bg-background border shadow-sm rounded-xl p-5 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                        <p className="text-xs font-bold text-primary">
                          คะแนนที่คุณให้กับคู่แลกเปลี่ยน
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= (userRating || 0) ? "text-amber-500 fill-amber-500" : "text-gray-200 fill-gray-200"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-bold">
                            {Number(userRating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="bg-secondary/20 p-3.5 rounded-lg border border-border/50">
                          <p className="text-[13px] text-foreground italic">
                            "{userComment || "ไม่มีคำบรรยายเพิ่มเติม"}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // 🔘 กรณีที่ยังไม่ได้รีวิว: แสดงปุ่มกดไปหน้าเขียนรีวิว
                <div className="text-center pt-2">
                  <Button
                    className="rounded-xl bg-primary px-8 h-11 font-semibold shadow-md hover:bg-primary/90"
                    onClick={() => navigate(`/review/${exchange.matchId}`)}
                  >
                    <Star className="h-4 w-4 mr-2 fill-current" />{" "}
                    ให้คะแนนและรีวิว
                  </Button>
                </div>
              );
            })()}
          </Card>
        )}

        {/* 🚫 สถานะ: ถูกปฏิเสธ (คู่สนทนากด reject) */}
        {currentStatus === "rejected" && (
          <Card className="border border-orange-300 shadow-sm bg-orange-500/10 rounded-2xl mt-6">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-orange-600" /> คำขอถูกปฏิเสธ
              </h2>
              <div className="space-y-3 text-xs">
                <div className="bg-background/70 p-3 rounded-xl border border-orange-200 space-y-1">
                  <span className="text-muted-foreground font-medium block">
                    สถานะปัจจุบัน:
                  </span>
                  <p className="font-semibold text-foreground italic">
                    "คู่แลกเปลี่ยนได้ปฏิเสธคำขอแลกเปลี่ยนนี้ รายการจึงถูกยกเลิก"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ⚠️ สถานะ: รายการถูกยกเลิก (มีคนกดยกเลิกกลางคัน หรือระบบยกเลิกอัตโนมัติ) */}
        {currentStatus === "failed" && (
          <Card className="border border-rose-300 shadow-sm bg-rose-500/10 rounded-2xl mt-6">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />{" "}
                สรุปข้อมูลการยกเลิกรายการ
              </h2>
              <div className="space-y-3 text-xs">
                <div className="bg-background/70 p-3 rounded-xl border border-rose-200 space-y-1">
                  <span className="text-muted-foreground font-medium block">
                    เหตุผลในการยกเลิก:
                  </span>
                  <p className="font-semibold text-foreground italic">
                    "
                    {exchange.cancelReasonDb ||
                      finalReason ||
                      "ไม่มีระบุเหตุผลเพิ่มเติม"}
                    "
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === "auto_cancelled" && (
          <Card className="border border-slate-300 shadow-sm bg-slate-500/10 rounded-2xl mt-6">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-slate-600" />{" "}
                รายการถูกยกเลิกอัตโนมัติโดยระบบ
              </h2>
              <div className="space-y-3 text-xs">
                <div className="bg-background/70 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-muted-foreground font-medium block">
                    เหตุผล:
                  </span>
                  <p className="font-semibold text-foreground italic">
                    "
                    {exchange.cancelReasonDb ||
                      finalReason ||
                      "ไม่มีระบุเหตุผลเพิ่มเติม"}
                    "
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 📦 รายละเอียดข้อเสนอทั้งสองฝ่าย */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            const isCancelled =
              currentStatus === "failed" ||
              currentStatus === "auto_cancelled" ||
              currentStatus === "rejected";

            // 🟢 สไตล์การ์ดฝั่งของคุณ
            const myCardClass = isCancelled
              ? "border-2 border-rose-300 bg-rose-50/10 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
              : hasReceived
                ? "border-2 border-emerald-300 bg-emerald-50/10 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
                : "border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"; // สีเทาปกติ

            const myHeaderClass = isCancelled
              ? "bg-rose-500/10 px-4 py-2.5 border-b border-rose-200 flex items-center justify-between text-rose-700 font-bold text-xs"
              : hasReceived
                ? "bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between text-emerald-700 font-bold text-xs"
                : "bg-muted px-4 py-2.5 border-b flex items-center justify-between text-muted-foreground font-bold text-xs";

            // 🔵 สไตล์การ์ดฝั่งคู่แลกเปลี่ยน
            const theirCardClass = isCancelled
              ? "border-2 border-rose-300 bg-rose-50/10 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
              : partnerReceiveStatus === 1
                ? "border-2 border-emerald-300 bg-emerald-50/10 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"
                : "border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between"; // สีเทาปกติ

            const theirHeaderClass = isCancelled
              ? "bg-rose-500/10 px-4 py-2.5 border-b border-rose-200 flex items-center justify-between text-rose-700 font-bold text-xs"
              : partnerReceiveStatus === 1
                ? "bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between text-emerald-700 font-bold text-xs"
                : "bg-muted px-4 py-2.5 border-b flex items-center justify-between text-muted-foreground font-bold text-xs";

            return (
              <>
                {/* 🔘 การ์ดฝั่งของคุณ */}
                <Card className={myCardClass}>
                  <div>
                    <div className={myHeaderClass}>
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4" /> ฝั่งของคุณ (ผู้เสนอ)
                      </span>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden border">
                        <img
                          src={getCorrectImagePath(exchange.myItem.image)}
                          alt={exchange.myItem.title}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder.jpg")
                          }
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 text-foreground">
                          {exchange.myItem.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {exchange.myItem.description}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-3 bg-muted p-2.5 rounded-xl border">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold">
                            {exchange.exchangeLocation}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t text-xs">
                      <p className="text-muted-foreground font-medium mb-1.5">
                        สถานะการรับสินค้า:
                      </p>
                      {isCancelled ? (
                        <Badge className="bg-rose-600 hover:bg-rose-700 text-white w-full justify-center py-1.5 rounded-lg">
                          <XCircle className="h-3.5 w-3.5 mr-1" />{" "}
                          รายการถูกยกเลิก / ปฏิเสธ
                        </Badge>
                      ) : hasReceived ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center py-1.5 rounded-lg">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                          ยืนยันได้รับของแล้ว
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="w-full justify-center py-1.5 text-muted-foreground bg-muted/30 rounded-lg"
                        >
                          ยังไม่ได้กดรับสินค้า
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>

                {/* 🔘 การ์ดฝั่งคู่แลกเปลี่ยน */}
                <Card className={theirCardClass}>
                  <div>
                    <div className={theirHeaderClass}>
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4" /> ฝั่งคู่แลกเปลี่ยน
                      </span>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden border">
                        <img
                          src={getCorrectImagePath(exchange.theirItem.image)}
                          alt={exchange.theirItem.title}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder.jpg")
                          }
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 text-foreground">
                          {exchange.theirItem.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {exchange.theirItem.description}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-3 bg-muted p-2.5 rounded-xl border">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold">
                            {exchange.exchangeLocation}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t text-xs">
                      <p className="text-muted-foreground font-medium mb-1.5">
                        สถานะการรับสินค้า:
                      </p>
                      {isCancelled ? (
                        <Badge className="bg-rose-600 hover:bg-rose-700 text-white w-full justify-center py-1.5 rounded-lg">
                          <XCircle className="h-3.5 w-3.5 mr-1" />{" "}
                          รายการถูกยกเลิก / ปฏิเสธ
                        </Badge>
                      ) : partnerReceiveStatus === 1 ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center py-1.5 rounded-lg">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                          ยืนยันได้รับของแล้ว
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="w-full justify-center py-1.5 text-muted-foreground bg-muted/30 rounded-lg"
                        >
                          รอคู่แลกเปลี่ยนกดยืนยัน
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </>
            );
          })()}
        </div>

        {/* ⚡ ACTION CARDS (OTP / โชว์เบอร์) */}
        <div className="space-y-4">
          {/* 🔴 บล็อกที่ 1: หน้าจอบังคับกรอก OTP */}
          {showOtpScreen && (
            <Card className="glass-card border-primary/20 bg-primary/5 rounded-2xl">
              <CardContent className="p-6 sm:p-8 space-y-4 text-center">
                <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-lg font-bold font-heading">
                  เข้าถึงข้อมูลติดต่อ
                </h2>
                <p className="text-sm text-muted-foreground">
                  กรุณายืนยันรหัสความปลอดภัยเพื่อดูข้อมูลการติดต่อ
                </p>

                <AlertDialog
                  open={isVerifyModalOpen}
                  onOpenChange={setIsVerifyModalOpen}
                >
                  <Button
                    className="eco-gradient text-primary-foreground w-full max-w-sm mx-auto"
                    size="lg"
                    onClick={() => setIsVerifyModalOpen(true)}
                  >
                    ยืนยันรหัสความปลอดภัย
                  </Button>
                  <AlertDialogContent className="rounded-2xl max-w-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center text-xl font-bold text-primary">
                        กรอกรหัสความปลอดภัย (OTP)
                      </AlertDialogTitle>
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        ระบบได้ส่งรหัสยืนยัน 6
                        หลักไปยังอีเมลและการแจ้งเตือนของคุณแล้ว
                      </p>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="******"
                        className="w-full text-center tracking-[0.4em] font-bold text-2xl h-14 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      />
                    </div>
                    <AlertDialogFooter className="flex flex-row gap-3 mt-2">
                      <AlertDialogCancel
                        className="flex-1 mt-0 rounded-2xl h-11 text-xs font-semibold border border-border/60 bg-card text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-foreground transition-all shadow-xs"
                        onClick={() => setVerificationCode("")}
                      >
                        ยกเลิก
                      </AlertDialogCancel>
                      <Button
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length < 6 || isVerifying}
                        className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isVerifying ? "กำลังตรวจสอบ..." : "ยืนยันรหัส"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {/* 🟢 บล็อกที่ 2: หน้าจอโชว์เบอร์โทร */}
          {showProgressScreen && (
            <Card className="glass-card border-primary/20 bg-primary/5 shadow-sm rounded-2xl">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <Clock className="h-8 w-8 text-primary mx-auto" />
                  <h2 className="text-lg font-bold text-primary font-heading">
                    รายการกำลังดำเนินการ
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    กรุณารอคู่แลกเปลี่ยนส่งของและยืนยันการรับของ
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 bg-card p-4 rounded-xl border border-primary/10 w-fit mx-auto shadow-sm">
                  <Phone className="h-5 w-5 text-primary animate-pulse" />
                  <a
                    href={`tel:${exchange.partnerPhone}`}
                    className="text-base font-bold tracking-wide hover:underline text-foreground"
                  >
                    {exchange.partnerPhone}
                  </a>
                </div>
                {!hasReceived ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full max-w-md mx-auto eco-gradient text-primary-foreground rounded-xl h-12 shadow-md block">
                        <CheckCircle className="h-5 w-5 mr-2 inline" />{" "}
                        ฉันได้รับของแล้ว
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-xl font-bold text-primary">
                          ยืนยันการรับสินค้า
                        </AlertDialogTitle>
                        <div className="text-center text-sm text-muted-foreground mt-2 space-y-1">
                          <p>แน่ใจนะว่าคุณได้รับสินค้าเรียบร้อยแล้ว?</p>
                          <p className="text-[10px] text-destructive font-medium">
                            (การกระทำนี้ไม่สามารถย้อนกลับได้)
                          </p>
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-row gap-3 mt-4">
                        <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-12">
                          ย้อนกลับ
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmReceive}
                          className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          ยืนยันได้รับแล้ว
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center gap-1 max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-bold">
                        คุณยืนยันการรับของแล้ว
                      </span>
                    </div>
                    <span className="text-[10px] font-medium opacity-80 mt-1 text-emerald-600/80">
                      รอคู่แลกเปลี่ยนกดยืนยัน...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 🔴 DANGER ZONE: พบปัญหาหรือต้องการยกเลิก? */}
        {currentStatus !== "completed" &&
          currentStatus !== "failed" &&
          currentStatus !== "rejected" &&
          currentStatus !== "auto_cancelled" && ( // 👈 เพิ่ม !== "rejected"
            <Card className="border border-destructive/20 bg-destructive/5 rounded-2xl p-5 sm:p-6 transition-all mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />{" "}
                    พบปัญหาหรือต้องการยกเลิก?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    หากไม่สะดวกแลกเปลี่ยน หรือติดต่อคู่แลกเปลี่ยนไม่ได้
                    สามารถขอยกเลิกรายการได้ที่นี่
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white rounded-xl text-xs h-10 shadow-sm transition-all shrink-0 w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> ยกเลิกการแลกเปลี่ยน
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center text-xl font-bold text-foreground">
                        ระบุสาเหตุการยกเลิก
                      </AlertDialogTitle>
                      <p className="text-center text-xs text-muted-foreground mt-1">
                        เลือกเหตุผลหลักที่ทำให้คุณต้องการยกเลิกรายการนี้
                      </p>
                    </AlertDialogHeader>

                    <div className="space-y-2.5 my-4 max-h-[45vh] overflow-y-auto pr-1">
                      {exchange.reasonOptions.map((reason) => {
                        const isSelected = cancelReason === reason;
                        return (
                          <button
                            key={reason}
                            onClick={() => setCancelReason(reason)}
                            className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? "border-destructive bg-destructive/10 text-destructive font-bold ring-2 ring-destructive/20 shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            }`}
                          >
                            <span>{reason}</span>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "border-destructive bg-destructive text-white"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <AlertDialogFooter className="flex flex-row gap-3">
                      <AlertDialogCancel className="w-full sm:flex-1 rounded-2xl h-11 text-xs font-semibold border-border/60 bg-card text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-foreground transition-all mt-0 shadow-xs">
                        ย้อนกลับ
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmCancel}
                        disabled={!cancelReason}
                        className="flex-1 rounded-xl h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs sm:text-sm shadow-md"
                      >
                        ยืนยันยกเลิก
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          )}
      </section>
    </AppLayout>
  );
}
