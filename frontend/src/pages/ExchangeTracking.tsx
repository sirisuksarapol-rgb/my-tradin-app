import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle, ArrowRightLeft,
  ShieldCheck, Star, Package, XCircle, AlertCircle, Phone, 
  MapPin, UserCheck, Check, FileText
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

import { completeExchange, getExchanges, IMAGE_BASE_URL, verifyExchangeCode, cancelExchange } from "@/api/api";

// ========================================================
// 📐 TYPES & INTERFACES
// ========================================================
interface ExchangeItem {
  ExchangeID: number | string;
  ExchangeStatus: string;
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
}

interface ErrorResponse {
  message?: string;
}

const stepIndex: Record<string, number> = {
  pending: 0, 
  accepted: 1, 
  in_progress: 2, 
  completed: 3, 
  failed: 3
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

  // ========================================================
  // ⚙️ STATE MANAGEMENT
  // ========================================================
  const [isLoading, setIsLoading] = useState(true);
  const [exchange, setExchange] = useState({
    matchId: matchId || "unknown",
    status: "pending",
    myItem: { title: "กำลังโหลด...", image: "", description: "ไม่ได้ระบุรายละเอียด" },
    theirItem: { title: "กำลังโหลด...", image: "", description: "ไม่ได้ระบุรายละเอียด" },
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

  const fetchTrackingData = useCallback(async () => {
    if (!matchId) return;
    try {
      setIsLoading(true);
      const res = await getExchanges();
      if (res && Array.isArray(res.data)) {
        const matchData = res.data.find((e: ExchangeItem) => String(e.ExchangeID) === String(matchId));
        
        if (matchData) {
          const savedUser = localStorage.getItem("user");
          const currentUser = savedUser ? JSON.parse(savedUser) : null;
          const currentUserId = currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;
          const isMember = String(currentUserId) === String(matchData.MemberID);

          setExchange({
            matchId: String(matchData.ExchangeID),
            status: (matchData.ExchangeStatus || "pending").toLowerCase(),
            myItem: { 
              title: matchData.myPostTitle || "สิ่งของของคุณ", 
              image: matchData.myPostImage || "",
              description: matchData.myPostDescription || "รายละเอียดเพิ่มเติมของสิ่งของ..."
            },
            theirItem: { 
              title: matchData.theirPostTitle || "ของที่สนใจแลก", 
              image: matchData.theirPostImage || "",
              description: matchData.theirPostDescription || "รายละเอียดเพิ่มเติมของสิ่งของ..."
            },
            partnerPhone: isMember ? (matchData.TargetPhoneNumber || matchData.partnerPhone || "-") : (matchData.PhoneNumber || "-"),
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
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถดึงข้อมูลสถานะได้", variant: "destructive" });
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
        
        toast({ title: "ยืนยันสำเร็จ", description: "ปลดล็อกเบอร์โทรศัพท์สำหรับติดต่อแล้ว" });
        fetchTrackingData();
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

  // 🟢 แก้ไข: ยิง API completeExchange ไปบันทึกในฐานข้อมูลจริง
  const handleConfirmReceive = async () => {
    if (!matchId) return;
    try {
      const res = await completeExchange(matchId, { score: 5, comment: "ได้รับสินค้าเรียบร้อยแล้ว" });
      if (res) {
        toast({ title: "ยืนยันการรับของสำเร็จ", description: "ระบบบันทึกว่าคุณได้รับสินค้าเรียบร้อยแล้ว" });
        fetchTrackingData(); // โหลดข้อมูลสถานะใหม่ล่าสุดทันที
      }
    } catch (error) {
      console.error("Error confirming receive:", error);
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกสถานะได้ กรุณาลองใหม่อีกครั้ง", variant: "destructive" });
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

  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const currentUserId = currentUser?.id ?? currentUser?.user_id ?? currentUser?.MemberID;
  const isMember = String(currentUserId) === String(exchange.memberId);

  const myVerifyStatus = isMember ? exchange.isMemberVerified : exchange.isTargetMemberVerified;
  const myReceiveStatus = isMember ? exchange.isMemberReceived : exchange.isTargetMemberReceived;
  const partnerReceiveStatus = isMember ? exchange.isTargetMemberReceived : exchange.isMemberReceived;

  const showOtpScreen = (currentStatus === "accepted" || currentStatus === "in_progress") && myVerifyStatus === 0;
  const showProgressScreen = (currentStatus === "accepted" || currentStatus === "in_progress") && myVerifyStatus === 1;
  const hasReceived = myReceiveStatus === 1;

  const steps = [
    { key: "pending", label: "รอตอบรับ", icon: Clock },
    { key: "accepted", label: "ตอบรับแล้ว", icon: CheckCircle },
    { key: "in_progress", label: "ระหว่างดำเนินการ", icon: ArrowRightLeft },
    currentStatus === "failed"
      ? { key: "failed", label: "ยกเลิกแล้ว", icon: XCircle }
      : { key: "completed", label: "สำเร็จ", icon: Star },
  ];

  return (
    <AppLayout>
      <section className="py-6 sm:py-10 max-w-5xl mx-auto px-4 space-y-6">
        
        {/* Header Bar */}
        <div className="flex items-center gap-3">
          <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ติดตามการแลกเปลี่ยน</h1>
            <p className="text-xs text-muted-foreground mt-0.5">ตรวจสอบรายละเอียดและสถานะการแลกเปลี่ยนของทั้งสองฝ่าย</p>
          </div>
        </div>

        {/* 🚀 Stepper แนวยาว (ปรับแต่งแก้ดีไซน์ลอย/เส้นทะลุ) */}
        <Card className="border bg-card shadow-sm rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-primary" /> สถานะการดำเนินการ
            </h2>
            
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-2">
              
              {/* เส้นหลัง Background */}
              <div className="hidden sm:block absolute top-6 left-[12%] right-[12%] h-1 bg-muted z-0" />
              
              {/* เส้น Progress สีไฮไลต์ */}
              <div 
                className="hidden sm:block absolute top-6 left-[12%] h-1 bg-primary transition-all duration-500 z-0" 
                style={{ width: `${(currentIdx / (steps.length - 1)) * 76}%` }} 
              />

              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step.key} className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 z-10 w-full sm:w-1/4 relative">
                    
                    {/* เส้นแนวตั้งสำหรับ Mobile */}
                    {idx < steps.length - 1 && (
                      <div className={`sm:hidden absolute left-6 top-12 w-0.5 h-10 -ml-[1px] ${isDone && idx < currentIdx ? "bg-primary" : "bg-muted"}`} />
                    )}

                    {/* วงกลม Icon ใส่ bg ทึบทับเส้น และ shadow */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all border-2 ${
                      isCurrent 
                        ? (step.key === "failed" 
                            ? "bg-destructive text-destructive-foreground border-destructive shadow-md ring-4 ring-destructive/20" 
                            : "bg-primary text-primary-foreground border-primary shadow-md ring-4 ring-primary/20") 
                        : isDone 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-card text-muted-foreground border-muted"
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>

                    <div className="text-left sm:text-center">
                      <p className={`text-sm font-bold ${isCurrent ? (step.key === "failed" ? "text-destructive" : "text-primary") : "text-foreground"}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] text-muted-foreground block sm:mt-1 font-medium">
                          {step.key === "failed" ? "รายการถูกยกเลิก" : "ขั้นตอนปัจจุบัน"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 🎉 สถานะ: สำเร็จแล้ว (ให้รีวิว) */}
        {currentStatus === "completed" && (
          <Card className="border bg-card rounded-2xl shadow-sm text-center p-6 space-y-3">
            <div className="text-4xl">🎉</div>
            <h3 className="font-bold text-lg">การแลกเปลี่ยนสำเร็จ!</h3>
            <p className="text-xs text-muted-foreground">คุณสามารถให้คะแนนรีวิวคู่แลกเปลี่ยนเพื่อเพิ่มความน่าเชื่อถือได้</p>
            <Button className="rounded-xl bg-primary px-8" onClick={() => navigate(`/review/${exchange.matchId}`)}>
              <Star className="h-4 w-4 mr-2 fill-current" /> ให้คะแนนและรีวิว
            </Button>
          </Card>
        )}

        {/* 🚫 สถานะ: รายการถูกยกเลิก */}
        {currentStatus === "failed" && (
          <Card className="border border-destructive/20 bg-destructive/5 rounded-2xl p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-destructive font-bold text-base">
              <AlertCircle className="h-5 w-5" /> รายการถูกยกเลิกแล้ว
            </div>
            <p className="text-xs text-muted-foreground">สาเหตุ: {finalReason || "ผู้ใช้งานขอยกเลิกรายการ"}</p>
          </Card>
        )}

        {/* 📦 รายละเอียดข้อเสนอทั้งสองฝ่าย */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" /> รายละเอียดข้อเสนอทั้งสองฝ่าย
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 🟢 การ์ดฝั่งของคุณ */}
            <Card className="border-2 border-primary/20 bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-primary/10 px-4 py-2.5 border-b border-primary/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" /> ฝั่งของคุณ (ผู้เสนอ)
                  </span>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden border">
                    <img 
                      src={getCorrectImagePath(exchange.myItem.image)} 
                      alt={exchange.myItem.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base line-clamp-2 text-foreground">{exchange.myItem.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                       <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" /> 
                       <span className="line-clamp-2">{exchange.myItem.description}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-3 bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold">{exchange.exchangeLocation}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t text-xs">
                  <p className="text-muted-foreground font-medium mb-1.5">สถานะการรับสินค้า:</p>
                  {hasReceived ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center py-1.5 rounded-lg">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> ยืนยันได้รับของแล้ว
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center py-1.5 text-muted-foreground bg-muted/30 rounded-lg">
                      ยังไม่ได้กดรับสินค้า
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* 🔵 การ์ดฝั่งคู่แลกเปลี่ยน */}
            <Card className="border bg-card shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-muted px-4 py-2.5 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" /> ฝั่งคู่แลกเปลี่ยน
                  </span>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden border">
                    <img 
                      src={getCorrectImagePath(exchange.theirItem.image)} 
                      alt={exchange.theirItem.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base line-clamp-2 text-foreground">{exchange.theirItem.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                       <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" /> 
                       <span className="line-clamp-2">{exchange.theirItem.description}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-3 bg-muted p-2.5 rounded-xl border">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold">{exchange.exchangeLocation}</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t text-xs">
                  <p className="text-muted-foreground font-medium mb-1.5">สถานะการรับสินค้า:</p>
                  {partnerReceiveStatus === 1 ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white w-full justify-center py-1.5 rounded-lg">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> ยืนยันได้รับของแล้ว
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center py-1.5 text-muted-foreground bg-muted/30 rounded-lg">
                      รอคู่แลกเปลี่ยนกดยืนยัน
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

          </div>
        </div>

        {/* ⚡ ACTION CARDS (OTP / โชว์เบอร์) */}
        <div className="space-y-4">
          {/* 🔴 บล็อกที่ 1: หน้าจอบังคับกรอก OTP */}
          {showOtpScreen && (
            <Card className="glass-card border-primary/20 bg-primary/5 rounded-2xl">
              <CardContent className="p-6 sm:p-8 space-y-4 text-center">
                <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-lg font-bold font-heading">เข้าถึงข้อมูลติดต่อ</h2>
                <p className="text-sm text-muted-foreground">กรุณายืนยันรหัสความปลอดภัยเพื่อดูข้อมูลการติดต่อ</p>
                
                <AlertDialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
                  <Button 
                    className="eco-gradient text-primary-foreground w-full max-w-sm mx-auto" 
                    size="lg" 
                    onClick={() => setIsVerifyModalOpen(true)}
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

          {/* 🟢 บล็อกที่ 2: หน้าจอโชว์เบอร์โทร */}
          {showProgressScreen && (
            <Card className="glass-card border-primary/20 bg-primary/5 shadow-sm rounded-2xl">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <Clock className="h-8 w-8 text-primary mx-auto" />
                  <h2 className="text-lg font-bold text-primary font-heading">รายการกำลังดำเนินการ</h2>
                  <p className="text-sm text-muted-foreground">กรุณารอคู่แลกเปลี่ยนส่งของและยืนยันการรับของ</p>
                </div>
                <div className="flex items-center justify-center gap-3 bg-card p-4 rounded-xl border border-primary/10 w-fit mx-auto shadow-sm">
                  <Phone className="h-5 w-5 text-primary animate-pulse" />
                  <a href={`tel:${exchange.partnerPhone}`} className="text-base font-bold tracking-wide hover:underline text-foreground">
                    {exchange.partnerPhone}
                  </a>
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
                        <AlertDialogAction onClick={handleConfirmReceive} className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
                          ยืนยันได้รับแล้ว
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center gap-1 max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-bold">คุณยืนยันการรับของแล้ว</span>
                    </div>
                    <span className="text-[10px] font-medium opacity-80 mt-1 text-emerald-600/80">รอคู่แลกเปลี่ยนกดยืนยัน...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 🔴 DANGER ZONE: พบปัญหาหรือต้องการยกเลิก? */}
        {currentStatus !== "completed" && currentStatus !== "failed" && (
          <Card className="border border-destructive/20 bg-destructive/5 rounded-2xl p-5 sm:p-6 transition-all mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" /> พบปัญหาหรือต้องการยกเลิก?
                </p>
                <p className="text-xs text-muted-foreground">
                  หากไม่สะดวกแลกเปลี่ยน หรือติดต่อคู่แลกเปลี่ยนไม่ได้ สามารถขอยกเลิกรายการได้ที่นี่
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
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? "border-destructive bg-destructive text-white" : "border-muted-foreground/30"
                          }`}>
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <AlertDialogFooter className="flex flex-row gap-3">
                    <AlertDialogCancel className="flex-1 mt-0 rounded-xl h-11 text-xs sm:text-sm">
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