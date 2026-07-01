import {
  ArrowLeft, ArrowRightLeft, Star, MapPin, Info, Tag,
  ShoppingBag, Calendar, CheckCircle, XCircle, Package
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactNode, useEffect } from "react";
import { Separator } from "@/components/ui/separator";

import { mockMatches } from "@/lib/match_data";

export default function ExchangeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const item = mockMatches.find((e) => e.id === id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!item) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
          <p>ไม่พบข้อมูลการแลกเปลี่ยน</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            กลับหน้าหลัก
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isSuccess = item.status === "completed";
  const myItem = item.myPost;
  const theirItem = item.theirPost;

  const myItemTitle = myItem?.title || "ไม่ระบุ";
  const myItemImage = myItem?.images?.[0] || "";
  const theirItemTitle = theirItem?.title || "ไม่ระบุ";
  const theirItemImage = theirItem?.images?.[0] || "";

  const partnerName = theirItem?.author?.name || "ไม่ทราบชื่อ";
  const partnerAvatar = (theirItem?.author as any)?.avatar;
  const location = theirItem?.location || myItem?.location || "ไม่ระบุสถานที่";
  const category = myItem?.category || theirItem?.category || "ทั่วไป";
  const wantedItem = myItem?.wantedItem || "-";

  const displayDate = item.completedAt || "ไม่ระบุวันที่";
  const reviewText = (item as any).review || (item as any).reviewText;
  const reasonText = (item as any).reason || (item as any).selectedReason || "ยกเลิกรายการ";

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">รายละเอียดการแลกเปลี่ยน</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Status + Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border ${isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {isSuccess ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                  <div>
                    <p className={`text-sm font-bold ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                      สถานะ: {isSuccess ? "ยืนยันสำเร็จแล้ว" : "ไม่สำเร็จ / ยกเลิก"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> อัปเดตเมื่อ: {displayDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exchange Items */}
              <Card className="glass-card border-none shadow-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-6 justify-center">
                    <div className="flex-1 flex flex-col items-center space-y-3">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden border border-primary/10 shadow-sm">
                        <img src={myItemImage} alt={myItemTitle} className="w-full h-full object-cover transition-transform hover:scale-105" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <p className="text-sm font-bold text-foreground line-clamp-1" title={myItemTitle}>{myItemTitle}</p>
                        <p className="text-[10px] text-primary font-bold uppercase bg-primary/10 rounded-full px-2 py-0.5 inline-block">ของของคุณ</p>
                      </div>
                    </div>

                    <div className="z-10 bg-background p-3 rounded-full border border-border shadow-sm flex-shrink-0">
                      <ArrowRightLeft className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 flex flex-col items-center space-y-3">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-2xl overflow-hidden border border-primary/10 shadow-sm">
                        <img src={theirItemImage} alt={theirItemTitle} className="w-full h-full object-cover transition-transform hover:scale-105" />
                      </div>
                      <div className="space-y-0.5 text-center">
                        <p className="text-sm font-bold text-foreground line-clamp-1" title={theirItemTitle}>{theirItemTitle}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase bg-secondary rounded-full px-2 py-0.5 inline-block">สิ่งที่ได้รับ</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow icon={<Tag className="h-4 w-4 text-primary" />} label="หมวดหมู่สินค้า" value={category} />
                    <DetailRow icon={<ShoppingBag className="h-4 w-4 text-primary" />} label="ต้องการแลกกับ" value={wantedItem} />
                    <DetailRow icon={<MapPin className="h-4 w-4 text-primary" />} label="สถานที่นัดรับ" value={location} full />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Partner + Review */}
            <div className="space-y-6">
              {/* Partner Card */}
              <Card className="glass-card border-none shadow-sm border-l-4 border-l-primary/30">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ข้อมูลคู่แลกเปลี่ยน</h2>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-sm">
                      <AvatarImage src={partnerAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {partnerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {partnerName}
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{(item as any).rating || "4.8"}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                          <Package className="h-3 w-3" />
                          <span className="font-medium">แลกสำเร็จ 12 ครั้ง</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review */}
              {isSuccess && reviewText && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold flex items-center gap-2 px-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    รีวิวที่ได้รับ
                  </h2>
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 italic text-sm text-muted-foreground leading-relaxed">
                    "{reviewText}"
                  </div>
                </div>
              )}

              {!isSuccess && reasonText && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1 text-red-600 font-bold text-xs uppercase">
                    <Info className="h-3.5 w-3.5" />
                    เหตุผลที่ยกเลิก
                  </div>
                  <p className="text-sm text-red-700/80 italic">"{reasonText}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function DetailRow({
  icon,
  label,
  value,
  full = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors ${full ? "sm:col-span-2" : ""}`}>
      <div className="bg-background p-2 rounded-lg shadow-sm border border-border">{icon}</div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}
