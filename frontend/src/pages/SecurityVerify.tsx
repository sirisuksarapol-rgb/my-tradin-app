import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";

const MOCK_PIN = "5291";
const MOCK_PHONE = "089-123-4567";

export default function SecurityVerify() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    if (pin === MOCK_PIN) {
      setVerified(true);
      toast({ title: "ยืนยันสำเร็จ!", description: "สามารถดูเบอร์โทรศัพท์ได้ที่หน้าติดตามสถานะ" });
    } else {
      toast({ title: "รหัสผิดพลาด", description: "กรุณาตรวจสอบรหัส PIN อีกครั้ง", variant: "destructive" });
      setPin("");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6 py-4">
        <div className="flex items-center gap-2">
          <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
          <h1 className="text-xl font-bold font-heading">ความปลอดภัย</h1>
        </div>

        {!verified ? (
          <Card className="glass-card shadow-lg">
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold font-heading">ยืนยันรหัส PIN</p>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">กรุณากรอกรหัส PIN 4 หลักที่ระบบส่งให้ทางแชทเพื่อเปิดเผยข้อมูลการติดต่อ</p>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">รหัส DEMO 5291</p>
              </div>
              <div className="flex justify-center py-4">
                <InputOTP maxLength={4} value={pin} onChange={setPin} className="gap-3">
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold rounded-xl border-muted-foreground/20" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 disabled:opacity-50" disabled={pin.length < 4} onClick={handleVerify}>
                ยืนยันเพื่อดูเบอร์โทรศัพท์
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card shadow-lg overflow-hidden animate-slide-up">
            <div className="h-2 bg-success" />
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-success font-heading">ยืนยันตัวตนสำเร็จ!</p>
                <p className="text-xs text-muted-foreground italic">ข้อมูลนี้จะถูกเก็บไว้ที่หน้าติดตามสถานะของคุณ</p>
              </div>
              <div className="bg-muted/50 rounded-2xl p-6 space-y-3 border border-dashed border-primary/30">
                <div className="flex items-center justify-center gap-2 text-primary/70">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Contact Number</span>
                </div>
                <p className="text-3xl font-black text-primary tracking-tighter select-all">{MOCK_PHONE}</p>
                <Button variant="outline" size="sm" className="rounded-full text-[11px] h-7 border-primary/20 hover:bg-primary/5" onClick={() => window.open(`tel:${MOCK_PHONE}`)}>
                  กดเพื่อโทรออกทันที
                </Button>
              </div>
              <Button className="w-full h-12 rounded-xl font-bold" onClick={() => navigate(`/exchange-tracking/${matchId || "m3"}`, { state: { newStatus: "in_progress" } })}>
                กลับไปหน้าติดตามสถานะ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
