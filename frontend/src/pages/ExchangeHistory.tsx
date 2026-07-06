import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, ArrowRightLeft, ChevronRight, Calendar, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getExchanges, IMAGE_BASE_URL } from "@/api/api"; // 💡 นำเข้า API และ Base URL จากที่คุณจัดระเบียบไว้

// ========================================================
// 🎯 TYPES & INTERFACES (แก้ปัญหาโค้ดแดงจาก any)
// ========================================================
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
            // 💡 เรียกใช้ฟังก์ชัน API จริงที่แกะ localstorage ให้สำเร็จรูปแล้ว
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

   // 💡 คัดกรองตามสถานะจากฟิลด์ ExchangeStatus ของ Backend (สอดคล้องกับค่า 'accepted' และ 'rejected')
   const completedList = userExchanges.filter(
      (item) => item.ExchangeStatus.toLowerCase() === "accepted" || item.ExchangeStatus.toLowerCase() === "completed"
   );
   const failedList = userExchanges.filter(
      (item) => 
         item.ExchangeStatus.toLowerCase() === "cancelled" || 
         item.ExchangeStatus.toLowerCase() === "rejected" || 
         item.ExchangeStatus.toLowerCase() === "failed"
   );

   return (
      <AppLayout>
         <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                     <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-2xl sm:text-3xl font-bold">ประวัติการแลกเปลี่ยน</h1>
               </div>
            </div>

            {loading ? (
               <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลประวัติ...</p>
               </div>
            ) : (
               <>
                  <Tabs defaultValue="success" className="w-full">
                     <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full bg-muted p-1 h-11">
                        <TabsTrigger value="success" className="rounded-full py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                           สำเร็จ ({completedList.length})
                        </TabsTrigger>
                        <TabsTrigger value="failed" className="rounded-full py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                           ไม่สำเร็จ ({failedList.length})
                        </TabsTrigger>
                     </TabsList>

                     <AnimatePresence mode="wait">
                        <TabsContent value="success" className="mt-6 outline-none">
                           {completedList.length > 0 ? (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {completedList.map((item) => <ExchangeDetailCard key={item.ExchangeID} item={item} />)}
                              </div>
                           ) : <EmptyState message="คุณยังไม่มีรายการแลกเปลี่ยนที่สำเร็จ" />}
                        </TabsContent>
                        <TabsContent value="failed" className="mt-6 outline-none">
                           {failedList.length > 0 ? (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {failedList.map((item) => <ExchangeDetailCard key={item.ExchangeID} item={item} />)}
                              </div>
                           ) : <EmptyState message="ไม่มีรายการที่ถูกยกเลิกหรือปฏิเสธ" />}
                        </TabsContent>
                     </AnimatePresence>
                  </Tabs>

                  {/* Summary */}
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                           <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm text-primary">สรุปยอดรวมทั้งหมด</span>
                     </div>
                     <div className="text-right flex items-center gap-4">
                        <div className="text-xs">
                           <p className="text-muted-foreground">สำเร็จ</p>
                           <p className="font-bold text-primary text-sm">{completedList.length}</p>
                        </div>
                        <div className="text-xs">
                           <p className="text-muted-foreground">ไม่สำเร็จ</p>
                           <p className="font-bold text-destructive text-sm">{failedList.length}</p>
                        </div>
                     </div>
                  </div>
               </>
            )}
         </div>
      </AppLayout>
   );
}

function ExchangeDetailCard({ item }: { item: ExchangeItem }) {
   const navigate = useNavigate();
   
   const isSuccess = item.ExchangeStatus.toLowerCase() === "accepted" || item.ExchangeStatus.toLowerCase() === "completed";
   const partnerName = item.theirAuthorName;
   
   // 💡 แปลงชื่อรูปภาพคอมมาดิบให้เป็น Web Link ชี้ไปที่โฟลเดอร์ uploads ของหลังบ้าน
   const getImageUrl = (imageString: string) => {
      if (!imageString) return "/placeholder-image.png"; // เปลี่ยนเป็นพาร์ธรูปเริ่มต้นของระบบคุณตามต้องการ
      const firstImage = imageString.split(",")[0].trim();
      return `${IMAGE_BASE_URL}/uploads/${firstImage}`;
   };

   const myItemImage = getImageUrl(item.myPostImage);
   const theirItemImage = getImageUrl(item.theirPostImage);

   // จัดการรูปแบบวันที่แสดงผลแบบง่าย
   const formattedDate = item.StartDate ? item.StartDate.split(" ")[0] : "-";

   return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
         <Card className="glass-card border-none shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-4 space-y-4">
               <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                     <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                           {partnerName.charAt(0)}
                        </AvatarFallback>
                     </Avatar>
                     <p className="font-bold text-sm">{partnerName}</p>
                  </div>
                  <Badge className={isSuccess ? "bg-primary/10 text-primary border-0" : "bg-destructive/10 text-destructive border-0"}>
                     {isSuccess ? "แลกสำเร็จ" : "ไม่สำเร็จ"}
                  </Badge>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                     <img src={myItemImage} className="w-16 h-16 rounded-lg object-cover mx-auto shadow-sm" alt={item.myPostTitle} loading="lazy" />
                     <p className="text-[10px] font-bold mt-2 line-clamp-1">{item.myPostTitle}</p>
                  </div>
                  <div className="bg-muted p-2 rounded-full">
                     <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-center">
                     <img src={theirItemImage} className="w-16 h-16 rounded-lg object-cover mx-auto shadow-sm" alt={item.theirPostTitle} loading="lazy" />
                     <p className="text-[10px] font-bold mt-2 line-clamp-1">{item.theirPostTitle}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5">
                     <Calendar className="h-3.5 w-3.5" />
                     <span>วันที่ยื่นข้อเสนอ: <span className="font-medium text-foreground">{formattedDate}</span></span>
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
      <div className="text-center py-20 opacity-50">
         <Clock className="h-10 w-10 mx-auto mb-2" />
         <p className="text-sm font-bold">{message}</p>
      </div>
   );
}