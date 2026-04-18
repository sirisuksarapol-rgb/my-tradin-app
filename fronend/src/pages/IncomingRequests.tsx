import { useState } from "react";
import { ArrowRightLeft, CheckCircle, XCircle, Inbox, ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { mockPosts } from "@/lib/post_data";
import { IncomingRequest, mockIncomingRequests } from "@/lib/incomingrequest";

export default function IncomingRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [requests, setRequests] = useState<IncomingRequest[]>(() => {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (!user || !user.id) return [];
    const myPostIds = mockPosts.filter((post) => String(post.author.id) === String(user.id)).map((post) => String(post.id));
    return mockIncomingRequests.filter((req) => myPostIds.includes(String(req.myItem.postId)));
  });

  const handleAccept = (req: IncomingRequest) => {
    toast({ title: "ตอบรับคำขอแล้ว! 🎉", description: `ระบบกำลังพาคุณไปหน้าติดตามสถานะของ ${req.requesterName}` });
    const matchData = { id: req.id, status: "accepted", myPost: { title: req.myItem.title, images: [req.myItem.image] }, theirPost: { title: req.theirItem.title, images: [req.theirItem.image] } };
    setTimeout(() => { navigate(`/exchange-tracking/${req.id}`, { state: { matchData } }); }, 1000);
  };

  const handleReject = (req: IncomingRequest) => {
    setRequests((prev) => prev.filter((item) => item.id !== req.id));
    toast({ title: "ปฏิเสธคำขอแล้ว", description: `แจ้งผลไปยัง ${req.requesterName} แล้ว`, variant: "destructive" });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <Inbox className="h-5 w-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">คำขอแลกเปลี่ยนที่ได้รับ</h1>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">ยังไม่มีคำขอแลกเปลี่ยนใหม่</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <Card key={req.id} className="glass-card border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-warning/10 text-warning border-0 text-xs">คำขอใหม่</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{req.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center space-y-1">
                      <img src={req.theirItem.image} alt={req.theirItem.title} className="w-16 h-16 rounded-lg object-cover mx-auto" loading="lazy" />
                      <p className="text-xs font-medium truncate">{req.theirItem.title}</p>
                      <p className="text-[10px] text-muted-foreground">{req.requesterName}</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 text-center space-y-1">
                      <img src={req.myItem.image} alt={req.myItem.title} className="w-16 h-16 rounded-lg object-cover mx-auto" loading="lazy" />
                      <p className="text-xs font-medium truncate">{req.myItem.title}</p>
                      <p className="text-[10px] text-muted-foreground">ของคุณ</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/50 mt-3">
                    <Button variant="secondary" className="w-full text-xs h-8" onClick={() => navigate(`/post/${req.theirItem.postId}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> ดูรายละเอียดสิ่งของ
                    </Button>
                    <div className="flex gap-2">
                      <Button className="flex-1 eco-gradient text-primary-foreground" size="sm" onClick={() => handleAccept(req)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> ตอบรับ
                      </Button>
                      <Button variant="outline" className="flex-1" size="sm" onClick={() => handleReject(req)}>
                        <XCircle className="h-4 w-4 mr-1" /> ปฏิเสธ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
