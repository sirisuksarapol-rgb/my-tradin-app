import React, { useState, useEffect } from "react";
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
import { mockExchangeTracking } from "@/lib/exchang_data";

const mockPhoneNumbers: Record<string, string> = {
  m1: "081-234-5678", m2: "089-876-5432", m3: "086-555-4444", m4: "082-111-2222", m5: "080-999-8888",
};

const stepIndex: Record<string, number> = {
  pending: 0, accepted: 1, in_progress: 2, completed: 3, failed: 3
};

export default function ExchangeTracking() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  const [exchange, setExchange] = useState(() => {
    if (location.state?.matchData) {
      const matchData = location.state.matchData;
      return {
        matchId: matchData.id || matchId || "unknown",
        status: matchData.status || "pending",
        myItem: { title: matchData.myPost.title, image: matchData.myPost.images[0] },
        theirItem: { title: matchData.theirPost.title, image: matchData.theirPost.images[0] },
        partnerPhone: "080-000-0000",
        reasonOptions: ["เปลี่ยนใจไม่ต้องการแลกแล้ว", "ติดต่อคู่แลกเปลี่ยนไม่ได้", "สินค้าจริงไม่ตรงกับรูปภาพ", "ตกลงสถานที่นัดพบไม่ได้", "เหตุผลอื่นๆ"],
      };
    }
    return mockExchangeTracking.find((e) => e.matchId === matchId) ?? mockExchangeTracking[0];
  });

  const reasonOptions = exchange.reasonOptions || ["เปลี่ยนใจไม่ต้องการแลกแล้ว", "ติดต่อคู่แลกเปลี่ยนไม่ได้", "สินค้าจริงไม่ตรงกับรูปภาพ", "ตกลงสถานที่นัดพบไม่ได้", "เหตุผลอื่นๆ"];

  const [finalReason, setFinalReason] = useState(() => {
    if (exchange.status === "failed" && exchange.reasonOptions) return exchange.reasonOptions[0];
    return "";
  });

  const [cancelReason, setCancelReason] = useState("");
  const [hasReceived, setHasReceived] = useState(false);

  const partnerPhone = (matchId && mockPhoneNumbers[matchId]) || exchange.partnerPhone || "080-000-0000";
  const currentStatus = exchange.status;
  const currentIdx = stepIndex[currentStatus] ?? 0;

  const steps = [
    { key: "pending", label: "รอตอบรับ", icon: Clock },
    { key: "accepted", label: "ตอบรับแล้ว", icon: CheckCircle },
    { key: "in_progress", label: "ระหว่างดำเนินการ", icon: ArrowRightLeft },
    currentStatus === "failed"
      ? { key: "failed", label: "ยกเลิกแล้ว", icon: XCircle }
      : { key: "completed", label: "สำเร็จ", icon: Star },
  ];

  const handleConfirmCancel = () => {
    if (!cancelReason) return;
    setFinalReason(cancelReason);
    setExchange(prev => ({ ...prev, status: "failed" }));
    toast({ title: "ยกเลิกรายการแล้ว", description: `สาเหตุ: ${cancelReason}`, variant: "destructive" });
  };

  const handleConfirmReceive = () => {
    setHasReceived(true);
    toast({ title: "ยืนยันการรับของสำเร็จ", description: "ระบบได้บันทึกว่าคุณได้รับสินค้าเรียบร้อยแล้ว" });
    setTimeout(() => {
      setExchange(prev => ({ ...prev, status: "completed" }));
      toast({ title: "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", description: "คู่แลกเปลี่ยนของคุณกดยืนยันรับของแล้วเช่นกัน" });
    }, 2000);
  };

  useEffect(() => {
    if (location.state?.newStatus) {
      setExchange(prev => ({ ...prev, status: location.state.newStatus }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <AppLayout>
      <section className="py-4 sm:py-8">
        <div className="mx-auto max-w-3xl"> {/* ปรับ max-w ให้พอดีกับการจัดเรียงแนวตั้ง */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold font-heading">ติดตามสถานะ</h1>
          </div>

          <div className="flex flex-col gap-6">
            {/* 1. ด้านบน: สรุปการแลกเปลี่ยน */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-bold text-muted-foreground">สรุปการแลกเปลี่ยน</h2>
                <div className="flex items-center gap-3">
                  <img src={exchange.myItem.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="" />
                  <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                  <img src={exchange.theirItem.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="" />
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

            {/* 3. Action Cards ตามสถานะต่างๆ */}
            {currentStatus === "accepted" && (
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="p-6 sm:p-8 space-y-4 text-center">
                  <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                  <h2 className="text-lg font-bold font-heading">เข้าถึงข้อมูลติดต่อ</h2>
                  <p className="text-sm text-muted-foreground">กรุณายืนยันรหัสความปลอดภัยเพื่อดูข้อมูลการติดต่อ</p>
                  <Button className="eco-gradient text-primary-foreground" size="lg" onClick={() => navigate(`/security-verify/${exchange.matchId}`)}>
                    ยืนยันรหัสความปลอดภัย
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStatus === "in_progress" && (
              <Card className="glass-card border-primary/20 bg-primary/5">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <Clock className="h-8 w-8 text-primary mx-auto" />
                    <h2 className="text-lg font-bold text-primary font-heading">รายการกำลังดำเนินการ</h2>
                    <p className="text-sm text-muted-foreground">กรุณารอคู่แลกเปลี่ยนส่งของและยืนยันการรับของ</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 bg-card p-4 rounded-xl border border-primary/10 w-fit mx-auto shadow-sm">
                    <Phone className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-base font-bold tracking-wide">{partnerPhone}</span>
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
                      {reasonOptions.map((reason) => (
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