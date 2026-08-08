import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Clock, ArrowRightLeft, ChevronRight, Calendar, 
  CheckCircle2, XCircle, RefreshCw 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getExchanges, IMAGE_BASE_URL } from "@/api/api";

// 🎯 TYPES & INTERFACES
interface ExchangeItem {
  ExchangeID: number;
  ExchangeStatus: string;
  ExchangeLocation: string;
  Score: number;
  MemberID: number;
  TargetMemberID: number;
  MyItemID: number;
  TargetItemID: number;
  PhoneNumber: string;
  StartDate: string;
  SuccessDate?: string;
  CancelDate?: string;
  CancelReason?: string;
  myPostTitle: string;
  myPostImage: string;
  theirPostTitle: string;
  theirPostImage: string;
  theirAuthorName: string;
}

export default function ExchangeHistory() {
  const navigate = useNavigate();
  const [userExchanges, setUserExchanges] = useState<ExchangeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        const response = await getExchanges();
        if (response && response.success) {
          setUserExchanges(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch exchange history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 💡 แยกประเภทรายการเป็น 2 กลุ่มตามแท็บที่ต้องการ (สำเร็จ, ไม่สำเร็จ)
  const completedList = userExchanges.filter((item) =>
    item.ExchangeStatus.toLowerCase() === "completed"
  );
  const failedList = userExchanges.filter((item) =>
    ["cancelled", "rejected", "failed"].includes(item.ExchangeStatus.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">ประวัติการแลกเปลี่ยน</h1>
              <p className="text-xs text-muted-foreground mt-0.5">ติดตามและดูประวัติการทำรายการแลกเปลี่ยนทั้งหมดของคุณ</p>
            </div>
          </div>
        </div>

        {loading ? (
          /* Skeleton Loading */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-52 rounded-2xl bg-muted/60 animate-pulse p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-5 w-16 bg-muted rounded-full"></div>
                </div>
                <div className="flex justify-between items-center gap-2 py-4">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                </div>
                <div className="h-4 w-full bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Tabs สำเร็จ และ ไม่สำเร็จ */}
            <Tabs defaultValue="success" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full bg-muted p-1 h-11">
                <TabsTrigger value="success" className="rounded-full py-2 text-xs sm:text-sm font-medium">
                  สำเร็จ ({completedList.length})
                </TabsTrigger>
                <TabsTrigger value="failed" className="rounded-full py-2 text-xs sm:text-sm font-medium">
                  ไม่สำเร็จ ({failedList.length})
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="success" className="mt-6 outline-none">
                  {completedList.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedList.map((item) => (
                        <ExchangeDetailCard key={item.ExchangeID} item={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="คุณยังไม่มีรายการแลกเปลี่ยนที่สำเร็จ" />
                  )}
                </TabsContent>

                <TabsContent value="failed" className="mt-6 outline-none">
                  {failedList.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {failedList.map((item) => (
                        <ExchangeDetailCard key={item.ExchangeID} item={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="ไม่มีรายการที่ถูกยกเลิกหรือปฏิเสธ" />
                  )}
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function ExchangeDetailCard({ item }: { item: ExchangeItem }) {
  const navigate = useNavigate();
  const status = item.ExchangeStatus.toLowerCase();
  const partnerName = item.theirAuthorName;

  const getImageUrl = (imageString: string) => {
    if (!imageString) return "/placeholder-image.png";
    const firstImage = imageString.split(",")[0].trim();
    return `${IMAGE_BASE_URL}/uploads/${firstImage}`;
  };

  // 💡 เพิ่มฟังก์ชันแปลงวันที่ให้อยู่ในฟอร์แมต YYYY-MM-DD
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-"; // ป้องกันกรณีข้อมูลพัง
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
  };

  const myItemImage = getImageUrl(item.myPostImage);
  const theirItemImage = getImageUrl(item.theirPostImage);

  // Badge สถานะ
  let statusBadge = { label: "รอดำเนินการ", style: "bg-amber-100 text-amber-800 border-amber-200", icon: RefreshCw };
  
  if (status === "completed") {
    statusBadge = { label: "แลกสำเร็จ", style: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
  } else if (["cancelled", "rejected", "failed"].includes(status)) {
    statusBadge = { label: "ไม่สำเร็จ", style: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card border-none shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {partnerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-sm line-clamp-1">{partnerName}</p>
            </div>
            <Badge variant="outline" className={`text-[11px] font-medium gap-1 px-2 py-0.5 ${statusBadge.style}`}>
              <StatusIcon className="w-3 h-3" /> {statusBadge.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <img src={myItemImage} className="w-16 h-16 rounded-lg object-cover mx-auto shadow-sm" alt={item.myPostTitle} loading="lazy" />
              <p className="text-[10px] font-bold mt-2 line-clamp-1">{item.myPostTitle}</p>
            </div>
            <div className="bg-muted p-2 rounded-full flex-shrink-0">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-center">
              <img src={theirItemImage} className="w-16 h-16 rounded-lg object-cover mx-auto shadow-sm" alt={item.theirPostTitle} loading="lazy" />
              <p className="text-[10px] font-bold mt-2 line-clamp-1">{item.theirPostTitle}</p>
            </div>
          </div>

          {["cancelled", "rejected", "failed"].includes(status) && item.CancelReason && (
            <p className="text-[11px] text-destructive bg-destructive/5 p-2 rounded-md line-clamp-1">
              เหตุผล: {item.CancelReason}
            </p>
          )}

          {/* 💡 เรียกใช้ฟังก์ชัน formatDate ตรงนี้แทน .split(" ")[0] */}
          <div className="flex flex-col text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>วันที่เริ่ม: <span className="font-medium text-foreground">{formatDate(item.StartDate)}</span></span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {status === "completed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                )}
                <span>
                  {status === "completed" ? "วันที่สำเร็จ: " : "วันที่ยกเลิก: "}
                  <span className="font-medium text-foreground">
                    {status === "completed" ? formatDate(item.SuccessDate) : formatDate(item.CancelDate)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={() => navigate(`/exchange-detail/${item.ExchangeID}`)}>
            ดูรายละเอียด <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 opacity-60">
      <Clock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-bold">{message}</p>
    </div>
  );
}