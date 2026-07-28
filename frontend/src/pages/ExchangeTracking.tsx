import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle, ArrowRightLeft,
  ShieldCheck, Star, Package, XCircle, AlertCircle, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// นำเข้า API จากไฟล์ส่วนกลางของคุณ
import { getExchanges, IMAGE_BASE_URL, requestExchangeCode, verifyExchangeCode, cancelExchange } from "@/api/api";

// ========================================================
// 📐 TYPES & INTERFACES (Type-Safe No any)
// ========================================================
interface ExchangeItem {
  ExchangeID: number | string;
  ExchangeStatus: string;
  myPostTitle?: string;
  myPostImage?: string;
  theirPostTitle?: string;
  theirPostImage?: string;
  partnerPhone?: string;
  MemberID?: number;
  TargetMemberID?: number;
  IsMemberVerified?: number;
  IsTargetMemberVerified?: number;
}

interface ErrorResponse {
  message?: string;
}

const stepIndex: Record<string, number> = {
  pending: 0, accepted: 1, in_progress: 2, completed: 3, failed: 3
};

const defaultReasonOptions = [
  "เปลี่ยนใจไม่ต้องการแลกแล้ว", 
  "ติดต่อคู่แลกเปลี่ยนไม่ได้", 
  "สินค้าจริงไม่ตรงกับรูปภาพ", 
  "ตกลงสถานที่นัดพบไม่ได้", 
  "เหตุผลอื่นๆ"
];

export default function ExchangeTracking() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // ========================================================
  // ⚙️ STATE MANAGEMENT (ต้องประกาศก่อน Early Return เสมอ)
  // ========================================================
  const [isLoading, setIsLoading] = useState(true);
  const [exchange, setExchange] = useState({
    matchId: matchId || "unknown",
    status: "pending",
    myItem: { title: "กำลังโหลด...", image: "" },
    theirItem: { title: "กำลังโหลด...", image: "" },
    partnerPhone: "กำลังโหลด...",
    reasonOptions: defaultReasonOptions,
    memberId: 0,
    targetMemberId: 0,
    isMemberVerified: 0,
    isTargetMemberVerified: 0,
  });

  const [cancelReason, setCancelReason] = useState("");
  const [finalReason, setFinalReason] = useState("");
  const [hasReceived, setHasReceived] = useState(false);

  // States สำหรับควบคุมโมดอลและการส่งรหัสความปลอดภัย OTP
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // ========================================================
  // 📦 FUNCTIONS & HANDLERS
  // ========================================================
  
  // 1. ฟังก์ชันจัดการ Path รูปภาพ
  const getCorrectImagePath = (imageName: string | undefined) => {
    if (!imageName || imageName.trim() === "undefined" || imageName === "null") return "/placeholder.jpg";
    try {
      let cleanStr = imageName.trim();
      if (cleanStr.startsWith('[')) {
        const safeJsonStr = cleanStr.replace(/'/g, '"');
        const parsed = JSON.parse(safeJsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) cleanStr = parsed[0].trim();
      } else if (cleanStr.includes(',')) {
        cleanStr = cleanStr.split(',')[0].trim();
      }
      if (cleanStr.startsWith('http')) return cleanStr;
      return `${IMAGE_BASE_URL}/uploads/${cleanStr}`;
    } catch {
      const fallback = imageName.replace(/\[|\]|"|'/g, '').split(',')[0].trim();
      return fallback.startsWith('http') ? fallback : `${IMAGE_BASE_URL}/uploads/${fallback}`;
    }
  };

  // 2. ดึงข้อมูลสถานะการแลกเปลี่ยนจาก Database
  const fetchTrackingData = useCallback(async () => {
    if (!matchId) return;
    try {
      setIsLoading(true);
      const res = await getExchanges();
      if (res && Array.isArray(res.data)) {
        const matchData = res.data.find((e: ExchangeItem) => String(e.ExchangeID) === String(matchId));
        
        if (matchData) {
          setExchange({
            matchId: String(matchData.ExchangeID),
            status: (matchData.ExchangeStatus || "pending").toLowerCase(),
            myItem: { 
              title: matchData.myPostTitle || "สิ่งของของคุณ", 
              image: matchData.myPostImage || ""
            },
            theirItem: { 
              title: matchData.theirPostTitle || "ของที่สนใจแลก", 
              image: matchData.theirPostImage || ""
            },
            partnerPhone: matchData.partnerPhone || "080-000-0000",
            reasonOptions: defaultReasonOptions,
            // 🌟 เพิ่ม 4 บรรทัดนี้
            // 🌟 ดักชื่อตัวแปรเผื่อไว้ทุกรูปแบบ ไม่ว่า Backend จะส่งมาสไตล์ไหนก็ไม่หลุดเป็น 0 แน่นอน
            memberId: matchData.MemberID ?? matchData.member_id ?? matchData.memberId ?? 0,
            targetMemberId: matchData.TargetMemberID ?? matchData.target_member_id ?? matchData.targetMemberId ?? 0,
            isMemberVerified: matchData.IsMemberVerified ?? matchData.is_member_verified ?? matchData.isMemberVerified ?? 0,
            isTargetMemberVerified: matchData.IsTargetMemberVerified ?? matchData.is_target_member_verified ?? matchData.isTargetMemberVerified ?? 0,
          });
        }
      }
    } catch (error: unknown) {
      console.error("Error fetching exchange tracking data:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถดึงข้อมูลสถานะได้", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [matchId, toast]);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  useEffect(() => {
    const state = location.state as { newStatus?: string } | null;
    if (state?.newStatus) {
      setExchange(prev => ({ ...prev, status: state.newStatus! }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 3. ฟังก์ชันกดขอรหัส OTP
  const handleRequestCode = async () => {
    if (!matchId) return;

    const savedUser = localStorage.getItem("user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const userId = currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;

    if (!userId) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
      return;
    }

    try {
      const res = await requestExchangeCode(matchId); 
      if (res && res.success) {
        setIsCodeSent(true);
        // 🌟 จุดที่แก้: ให้เอาข้อความจาก API มาแสดง (ถ้าไม่มีให้ใช้ข้อความเริ่มต้น)
        toast({
          title: "แจ้งเตือนระบบ",
          description: res.message || "ส่งรหัสสำเร็จ กรุณาตรวจสอบการแจ้งเตือน",
        });
      }
    } catch (error: unknown) {
      let errorMsg = "ไม่สามารถส่งรหัสได้ กรุณาลองใหม่";
      if (error && typeof error === "object" && "message" in error) {
        errorMsg = (error as ErrorResponse).message || errorMsg;
      }
      toast({ title: "เกิดข้อผิดพลาด", description: errorMsg, variant: "destructive" });
    }
  };

  // 4. ฟังก์ชันยืนยันตรวจสอบรหัส OTP
  const handleVerifyCode = async () => {
    if (!matchId) return;
    if (!verificationCode || verificationCode.length < 6) {
      toast({ title: "ข้อมูลไม่ครบ", description: "กรุณากรอกรหัสให้ครบ 6 หลัก", variant: "destructive" });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyExchangeCode(matchId, verificationCode);
      if (res && res.success) {
        setIsVerifying(false);
        setIsVerifyModalOpen(false);
        setVerificationCode("");
        
        // 🌟 จุดสำคัญ: บังคับให้อัปเดต State ทันที เพื่อปิดการ์ด OTP และเปิดการ์ดเบอร์โทร
        setExchange(prev => {
          // หาว่าคนที่ล็อกอินอยู่คือใคร
          const savedUser = localStorage.getItem("user");
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          const currentUserId = currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;
          
          // เช็กว่าเราคือคนขอแลก (Member) ใช่หรือไม่
          const isMember = currentUserId === prev.memberId;
          
          return {
            ...prev, 
            status: "in_progress", 
            // 🌟 ปรับสถานะของตัวเราให้เป็น 1 ทันที เพื่อให้เงื่อนไข showOtpScreen กลายเป็น False
            isMemberVerified: isMember ? 1 : prev.isMemberVerified,
            isTargetMemberVerified: !isMember ? 1 : prev.isTargetMemberVerified
          };
        });

        toast({ title: "ยืนยันสำเร็จ", description: "คุณสามารถดูข้อมูลการติดต่อได้แล้ว" });
      }
    } catch (error: unknown) {
      setIsVerifying(false);
      let errorMsg = "รหัสไม่ถูกต้องหรือหมดอายุ";
      if (error && typeof error === "object" && "message" in error) {
        errorMsg = (error as ErrorResponse).message || errorMsg;
      }
      toast({ title: "รหัสไม่ถูกต้อง", description: errorMsg, variant: "destructive" });
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || !matchId) return;

    try {
      await cancelExchange(matchId, cancelReason);

      setFinalReason(cancelReason);
      setExchange(prev => ({ ...prev, status: "failed" }));
      toast({ title: "ยกเลิกรายการแล้ว", description: `สาเหตุ: ${cancelReason}`, variant: "destructive" });
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถยกเลิกรายการได้ กรุณาลองใหม่", variant: "destructive" });
    }
  };

  const handleConfirmReceive = () => {
    setHasReceived(true);
    toast({ title: "ยืนยันการรับของสำเร็จ", description: "ระบบได้บันทึกว่าคุณได้รับสินค้าเรียบร้อยแล้ว" });
    setTimeout(() => {
      setExchange(prev => ({ ...prev, status: "completed" }));
      toast({ title: "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", description: "คู่แลกเปลี่ยนของคุณกดยืนยันรับของแล้วเช่นกัน" });
    }, 2000);
  };

  // ย้ายตรวจสอบ Loading มาไว้ท้ายสุดก่อนการแสดงผลโครงสร้าง UI เสมอ เพื่อไม่ให้กระทบต่อ React Hooks
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4 text-muted-foreground">
            <Package className="h-10 w-10 opacity-50" />
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentStatus = exchange.status;
  const currentIdx = stepIndex[currentStatus] ?? 0;

  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const currentUserId = currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;
  const isMember = String(currentUserId) === String(exchange.memberId);
  const myVerifyStatus = isMember ? exchange.isMemberVerified : exchange.isTargetMemberVerified;

  const showOtpScreen = (currentStatus === "accepted" || currentStatus === "in_progress") && myVerifyStatus === 0;
  const showProgressScreen = (currentStatus === "accepted" || currentStatus === "in_progress") && myVerifyStatus === 1;

  const steps = [
    { key: "pending", label: "รอตอบรับ", icon: Clock },
    { key: "accepted", label: "ตอบรับแล้ว", icon: CheckCircle },
    { key: "in_progress", label: "ระหว่างดำเนินการ", icon: ArrowRightLeft },
    currentStatus === "failed"
      ? { key: "failed", label: "ยกเลิกแล้ว", icon: XCircle }
      : { key: "completed", label: "สำเร็จ", icon: Star },
  ];

  // ========================================================
  // 🖥️ RENDER UI (ตรงตามโครงสร้างและดีไซน์ล่าสุดของคุณทั้งหมด)
  // ========================================================
  return (
    <AppLayout>
      <section className="py-4 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold font-heading">ติดตามสถานะ</h1>
          </div>

          <div className="flex flex-col gap-6">
            {/* 1. ด้านบน: สรุปการแลกเปลี่ยน */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-bold text-muted-foreground">สรุปการแลกเปลี่ยน</h2>
                <div className="flex items-center gap-3">
                  <img 
                    src={getCorrectImagePath(exchange.myItem.image)} 
                    className="w-16 h-16 rounded-xl object-cover shadow-sm bg-muted" 
                    alt={exchange.myItem.title}
                    onError={(e) => (e.currentTarget.src = "/placeholder.jpg")} 
                  />
                  <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                  <img 
                    src={getCorrectImagePath(exchange.theirItem.image)} 
                    className="w-16 h-16 rounded-xl object-cover shadow-sm bg-muted" 
                    alt={exchange.theirItem.title}
                    onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{exchange.myItem.title}</p>
                  <p className="text-xs text-muted-foreground">แลกกับ {exchange.theirItem.title}</p>
                </div>
              </CardContent>
            </Card>

            {/* 2. ตรงกลาง: สถานะ (Stepper) */}
            <Card className="glass-card">
              <CardContent className="p-6 space-y-1">
                <h2 className="text-sm font-bold text-muted-foreground mb-4">สถานะการดำเนินการ</h2>
                {steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  let circleClass = "bg-muted";
                  if (isCurrent) circleClass = step.key === "failed" ? "bg-destructive shadow-sm" : "eco-gradient shadow-sm";
                  else if (isDone) circleClass = "eco-gradient opacity-60";

                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${circleClass}`}>
                          <StepIcon className={`h-5 w-5 ${isDone ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </div>
                        {idx < steps.length - 1 && <div className={`w-0.5 h-10 transition-all ${isDone ? "bg-primary/30" : "bg-muted"}`} />}
                      </div>
                      <div className="pt-2">
                        <p className={`text-sm font-bold ${isCurrent ? (step.key === "failed" ? "text-destructive" : "text-primary") : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isCurrent && <Badge variant="secondary" className="text-[10px] mt-1 px-2 py-0 animate-pulse">{step.key === "failed" ? "สิ้นสุดรายการ" : "สถานะปัจจุบัน"}</Badge>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 3. ส่วน Action Cards ตามสถานะปัจจุบัน */}
            {/* 🔴 บล็อกที่ 1: หน้าจอบังคับกรอก OTP (แสดงเมื่อยังไม่เคยกดยืนยัน) */}
            {showOtpScreen && (
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="p-6 sm:p-8 space-y-4 text-center">
                  <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                  <h2 className="text-lg font-bold font-heading">เข้าถึงข้อมูลติดต่อ</h2>
                  <p className="text-sm text-muted-foreground">กรุณายืนยันรหัสความปลอดภัยเพื่อดูข้อมูลการติดต่อ</p>
                  
                  <AlertDialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
                    <Button 
                      className="eco-gradient text-primary-foreground" 
                      size="lg" 
                      onClick={() => {
                        setIsVerifyModalOpen(true);
                      }}
                    >
                      ยืนยันรหัสความปลอดภัย
                    </Button>
                    <AlertDialogContent className="rounded-2xl max-w-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-xl font-bold text-primary">กรอกรหัสความปลอดภัย (OTP)</AlertDialogTitle>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          ระบบได้ส่งรหัสยืนยัน 6 หลักไปยังอีเมลและการแจ้งเตือนของคุณแล้ว
                        </p>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <input
                          type="text"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="******"
                          className="w-full text-center tracking-[0.4em] font-bold text-2xl h-14 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                      <AlertDialogFooter className="flex flex-row gap-3 mt-2">
                        <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-12" onClick={() => setVerificationCode("")}>
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

            {/* 🟢 บล็อกที่ 2: หน้าจอโชว์เบอร์โทร (แสดงเมื่อตัวเองกรอก OTP ผ่านแล้วเท่านั้น!) */}
            {showProgressScreen && (
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <Clock className="h-8 w-8 text-primary mx-auto" />
                    <h2 className="text-lg font-bold text-primary font-heading">รายการกำลังดำเนินการ</h2>
                    <p className="text-sm text-muted-foreground">กรุณารอคู่แลกเปลี่ยนส่งของและยืนยันการรับของ</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 bg-card p-4 rounded-xl border border-primary/10 w-fit mx-auto shadow-sm">
                    <Phone className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-base font-bold tracking-wide">{exchange.partnerPhone}</span>
                  </div>
                  {!hasReceived ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full max-w-md mx-auto eco-gradient text-primary-foreground rounded-xl h-12 shadow-md block">
                          <CheckCircle className="h-5 w-5 mr-2 inline" /> ฉันได้รับของแล้ว
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-center text-xl font-bold text-primary">ยืนยันการรับสินค้า</AlertDialogTitle>
                          <div className="text-center text-sm text-muted-foreground mt-2 space-y-1">
                            <p>แน่ใจนะว่าคุณได้รับสินค้าเรียบร้อยแล้ว?</p>
                            <p className="text-[10px] text-destructive font-medium">(การกระทำนี้ไม่สามารถย้อนกลับได้)</p>
                          </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-row gap-3 mt-4">
                          <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-12">ย้อนกลับ</AlertDialogCancel>
                          <AlertDialogAction onClick={handleConfirmReceive} className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground">ยืนยันได้รับแล้ว</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="bg-success/10 text-success border border-success/20 p-4 rounded-xl flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-bold">คุณยืนยันการรับของแล้ว</span>
                      </div>
                      <span className="text-[10px] font-medium opacity-80 mt-1">รอคู่แลกเปลี่ยนกดยืนยัน...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStatus === "completed" && (
              <Card className="glass-card">
                <CardContent className="p-6 sm:p-8 text-center space-y-4">
                  <div className="text-4xl">🎉</div>
                  <h2 className="text-xl font-bold font-heading">การแลกเปลี่ยนเสร็จสมบูรณ์!</h2>
                  <p className="text-sm text-muted-foreground">ขอบคุณที่ใช้บริการ Tradin ร่วมสร้างสังคมแห่งการแบ่งปัน</p>
                  <Button className="eco-gradient text-primary-foreground py-6 text-lg shadow-lg w-full sm:w-auto" size="lg" onClick={() => navigate(`/review/${exchange.matchId}`)}>
                    <Star className="h-5 w-5 mr-2 fill-current" /> ให้คะแนนและรีวิว
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStatus === "failed" && (
              <div className="space-y-4">
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-sm text-destructive uppercase font-black tracking-widest">รายการถูกยกเลิก</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 shadow-sm border border-destructive/5">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-1">สาเหตุที่ยกเลิก</p>
                      <p className="text-sm font-semibold text-foreground">{finalReason || "ผู้ใช้งานขอยกเลิกรายการแลกเปลี่ยน"}</p>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1 eco-gradient text-primary-foreground py-6 text-lg shadow-lg" onClick={() => navigate(`/review/${exchange.matchId}`)}>
                    <Star className="h-5 w-5 mr-2 fill-current" /> ให้คะแนนและรีวิว
                  </Button>
                  <Button variant="outline" className="flex-1 py-6 text-lg" onClick={() => navigate(-1)}>กลับไปหน้าหลัก</Button>
                </div>
              </div>
            )}

            {/* 4. ล่างสุด: ปุ่มยกเลิกการแลกเปลี่ยน */}
            {currentStatus !== "completed" && currentStatus !== "failed" && (
              <div className="pt-4 mt-2 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/50">
                      ยกเลิกการแลกเปลี่ยน
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center text-xl font-bold">ระบุสาเหตุการยกเลิก</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-2 my-4 max-h-[40vh] overflow-y-auto pr-2">
                      {exchange.reasonOptions.map((reason) => (
                        <button key={reason} onClick={() => setCancelReason(reason)}
                          className={`w-full p-4 rounded-xl border text-left text-sm transition-all ${cancelReason === reason ? "border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                          {reason}
                        </button>
                      ))}
                    </div>
                    <AlertDialogFooter className="flex flex-row gap-3 mt-2">
                      <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-12">ย้อนกลับ</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmCancel} disabled={!cancelReason} className="flex-1 rounded-xl h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-30">
                        ยืนยันยกเลิก
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}