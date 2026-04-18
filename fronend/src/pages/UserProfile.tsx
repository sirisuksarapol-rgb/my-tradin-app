import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, ArrowRightLeft, Award, Flag, AlertTriangle, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";
import { MOCK_USERS } from "@/lib/user_data";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const mockReviews = [
  { id: "r1", reviewer: "อาทิตย์", rating: 5, comment: "แลกเปลี่ยนรวดเร็ว สิ่งของตรงตามที่โพสต์ ประทับใจมากครับ", date: "2 วันที่แล้ว" },
  { id: "r2", reviewer: "มณี", rating: 4, comment: "สินค้าสภาพดี ตรงเวลานัดหมาย แนะนำเลย", date: "1 สัปดาห์ที่แล้ว" },
  { id: "r3", reviewer: "ชาติ", rating: 5, comment: "พูดคุยสุภาพ สิ่งของดีมาก ขอบคุณครับ", date: "2 สัปดาห์ที่แล้ว" },
];

export default function UserProfile() {
  const { userId } = useParams();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const user = MOCK_USERS.find((u) => u.id === userId);
  const fromAdmin = location.state?.fromAdmin || false;
  const isOwner = String(loggedInUser?.id) === String(user?.id);

  const handleReport = async () => {
    if (!reportReason.trim()) { toast({ title: "ยังไม่ได้ระบุเหตุผล", variant: "destructive" }); return; }
    toast({ title: "ส่งรายงานเรียบร้อย", description: "ระบบจะดำเนินการตรวจสอบให้เร็วที่สุด" });
    setIsReportOpen(false); setReportReason("");
  };

  if (!user) {
    return (<AppLayout><div className="px-4 py-16 text-center max-w-6xl mx-auto mt-20"><AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">ไม่พบข้อมูลผู้ใช้</h2><Button onClick={() => navigate(-1)}>ย้อนกลับ</Button></div></AppLayout>);
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1 -ml-4"><ArrowLeft className="h-4 w-4" /> กลับ</Button>
          {!isOwner && !fromAdmin && (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setIsReportOpen(true)}><Flag className="h-5 w-5" /></Button>
          )}
        </div>

        {/* Profile header - web layout */}
        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <div className="text-center md:text-left">
            <Avatar className="h-28 w-28 mx-auto md:mx-0 border-4 border-background shadow-lg">
              <AvatarFallback className={`text-4xl font-bold text-primary-foreground ${user.suspended ? 'bg-destructive' : 'eco-gradient'}`}>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
              {user.name}
              {user.suspended && <Badge variant="destructive" className="text-xs">ถูกระงับ</Badge>}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
            {user.role === "admin" && <Badge variant="secondary">ผู้ดูแลระบบ</Badge>}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md mx-auto md:mx-0">
              {[{ icon: ArrowRightLeft, value: "12", label: "แลกเปลี่ยนสำเร็จ" }, { icon: Star, value: "4.8", label: "คะแนนรีวิว" }, { icon: Award, value: String(mockReviews.length), label: "รีวิว" }].map(({ icon: Icon, value, label }) => (
                <Card key={label} className="glass-card"><CardContent className="p-4 text-center space-y-2"><Icon className="h-5 w-5 text-primary mx-auto" /><p className="text-xl font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></CardContent></Card>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Reviews - web grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> รีวิวจากสมาชิก</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockReviews.map((review) => (
              <Card key={review.id} className="glass-card"><CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{review.reviewer.charAt(0)}</AvatarFallback></Avatar><span className="text-sm font-semibold">{review.reviewer}</span></div>
                  <div className="flex gap-0.5">{Array.from({ length: review.rating }).map((_, i) => (<Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />))}</div>
                </div>
                <p className="text-sm text-foreground/90">"{review.comment}"</p>
                <p className="text-[11px] text-muted-foreground">{review.date}</p>
              </CardContent></Card>
            ))}
          </div>
        </div>

        {fromAdmin && (<><Separator /><Button variant="secondary" onClick={() => navigate("/admin")} className="w-full max-w-xs gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"><ShieldAlert className="h-4 w-4" /> กลับหน้า Admin</Button></>)}
      </div>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>แจ้งปัญหาผู้ใช้งาน</DialogTitle></DialogHeader>
          <Textarea placeholder="ระบุรายละเอียดปัญหา..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="min-h-[120px]" />
          <DialogFooter className="gap-2"><Button variant="ghost" onClick={() => setIsReportOpen(false)}>ยกเลิก</Button><Button variant="destructive" onClick={handleReport} disabled={!reportReason.trim()}>ส่งรายงาน</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
