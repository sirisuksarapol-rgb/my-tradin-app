import { useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, MapPin, ArrowRightLeft, Star, MessageCircle, Globe,
  FileText, ChevronLeft, ChevronRight, Inbox, ShieldAlert, Flag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { mockPosts } from "@/lib/post_data";

import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const post = mockPosts.find((p) => p.id === id);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!post) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">ไม่พบโพสต์นี้</p>
        </div>
      </AppLayout>
    );
  }

  const isFromIncomingRequest = location.state?.fromIncomingRequest || false;
  const isOwnPostView = location.state?.isOwnPostView || false;
  const fromAdmin = location.state?.fromAdmin || false;

  const isOwner = String(user?.id) === String(post.author?.id) || isOwnPostView;

  const nextImage = () => setCurrentImageIndex((p) => (p === post.images.length - 1 ? 0 : p + 1));
  const prevImage = () => setCurrentImageIndex((p) => (p === 0 ? post.images.length - 1 : p - 1));

  const handleReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: "ยังไม่ได้ระบุเหตุผล",
        description: "กรุณากรอกเหตุผลก่อนส่งรายงาน",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "ส่งรายงานโพสต์เรียบร้อย",
      description: "ระบบจะดำเนินการตรวจสอบให้เร็วที่สุด ขอบคุณที่แจ้งเข้ามาครับ",
    });

    setIsReportOpen(false);
    setReportReason("");
  };

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">รายละเอียดโพสต์</h1>
            </div>

            {!isOwner && !fromAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsReportOpen(true)}
                title="รายงานโพสต์นี้"
              >
                <Flag className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden group bg-muted">
                <img
                  src={post.images[currentImageIndex]}
                  alt={`${post.title} - รูปที่ ${currentImageIndex + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                />

                {post.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {post.images.map((_, index) => (
                        <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentImageIndex ? "bg-primary" : "bg-white/70"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {post.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {post.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${i === currentImageIndex ? "border-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Content */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{post.title}</h1>
                  <Badge variant="secondary" className="shrink-0 text-xs">{post.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{post.createdAt}</p>
              </div>

              {/* Wanted Item */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <ArrowRightLeft className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">ต้องการแลกกับ</p>
                    <p className="text-base font-semibold">{post.wantedItem}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold">รายละเอียด</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.description}</p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold">สถานที่นัดรับ</h2>
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-secondary/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{post.location}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold h-8 px-2 hover:text-orange-600 hover:bg-orange-50" asChild>
                    <a href={post.mapLink || `http://googleusercontent.com/maps.google.com/?q=${encodeURIComponent(post.location)}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-1.5" /> View Map
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Author Card */}
              <Link to={`/user/${post.author.id}`} state={fromAdmin ? { fromAdmin: true } : {}}>
                <Card className="glass-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="eco-gradient text-primary-foreground font-bold text-lg">{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{post.author.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5 fill-warning text-warning" /><span>{post.author.rating}</span></div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowRightLeft className="h-3.5 w-3.5" /><span>{post.author.exchanges} แลกเปลี่ยน</span></div>
                        </div>
                      </div>
                      <span className="text-xs text-primary font-medium hidden sm:inline">ดูโปรไฟล์ →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {fromAdmin ? (
                  <Button
                    variant="secondary"
                    className="w-full hover:bg-primary/20 bg-primary/10 text-primary font-semibold transition-colors"
                    size="lg"
                    onClick={() => navigate("/admin")}
                  >
                    <ShieldAlert className="h-5 w-5 mr-2" />
                    กลับหน้า Admin
                  </Button>
                ) : isFromIncomingRequest ? (
                  <Button
                    variant="secondary"
                    className="w-full hover:bg-orange-500/85 hover:text-white transition-colors"
                    size="lg"
                    onClick={() => navigate(-1)}
                  >
                    <Inbox className="h-5 w-5 mr-2" />
                    กลับไปจัดการคำขอแลกเปลี่ยน
                  </Button>
                ) : (
                  <Button
                    className="flex-1 eco-gradient text-primary-foreground shadow-sm"
                    size="lg"
                    disabled={isOwner}
                    onClick={() => navigate(`/exchange-preview/post-${post.id}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {isOwner ? "โพสต์ของคุณ" : "ส่งคำขอแลกเปลี่ยน"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>รายงานโพสต์ที่ไม่เหมาะสม</DialogTitle>
            <div className="p-3 mt-2 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">คุณกำลังรายงานโพสต์:</p>
              <p className="font-semibold text-sm line-clamp-1">{post.title}</p>
            </div>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="ระบุเหตุผลที่รายงานโพสต์นี้ (เช่น สินค้าผิดกฎหมาย, ข้อมูลเท็จ, สแปม, หลอกลวง...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsReportOpen(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleReport} disabled={!reportReason.trim()}>ส่งรายงาน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
