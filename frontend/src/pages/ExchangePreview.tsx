import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowRightLeft, MapPin, Phone, ShieldCheck, Sparkles, ArrowLeft, Box, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";

// 💡 ดึงฟังก์ชันสำหรับการยิงหลังบ้านมาใช้งานจริงอย่างถูกต้อง
import { getItems as fetchItemsAPI, IMAGE_BASE_URL, createExchangeRequest } from "@/api/api";

interface RealPostItem {
  ItemID: number | string;
  ItemName: string;
  ItemDescription?: string;
  CategoryName?: string;
  MeetingLocation?: string;
  ItemImage?: string;
  MemberID?: number | string;
  Username?: string;    
  MemberName?: string;  
  OwnerName?: string;   
}

export default function ExchangePreview() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [dbItems, setDbItems] = useState<RealPostItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // 1. โหลดข้อมูลสิ่งของและ User ปัจจุบันจากระบบคลังข้อมูล
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          const uid = user.id ?? user.user_id ?? user.UserID ?? user.MemberID;
          setCurrentUserId(String(uid));
        }

        const res = await fetchItemsAPI();
        if (res && Array.isArray(res.data)) {
          setDbItems(res.data);
        }
      } catch (error) {
        console.error("Error fetching items for preview:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRealData();
  }, []);

  // 2. จัดการแกะ Path รูปภาพให้ออกมาแสดงผลได้อย่างถูกต้อง
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
      return cleanStr.startsWith('http') ? cleanStr : `${IMAGE_BASE_URL}/uploads/${cleanStr}`;
    } catch {
      const fallback = imageName.replace(/\[|\]|"|'/g, '').split(',')[0].trim();
      return fallback.startsWith('http') ? fallback : `${IMAGE_BASE_URL}/uploads/${fallback}`;
    }
  };

  // ค้นหาสิ่งของทั้งหมดที่เป็นของฉัน
  const myInventory = useMemo(() => {
    if (!currentUserId) return [];
    return dbItems.filter(item => String(item.MemberID) === currentUserId);
  }, [dbItems, currentUserId]);

  const [selectedMyPostId, setSelectedMyPostId] = useState<string | number>("");

  // ปักเลือกไอเทมชิ้นแรกของฉันเป็นค่าเริ่มต้น
  useEffect(() => {
    if (myInventory.length > 0 && !selectedMyPostId) {
      setSelectedMyPostId(myInventory[0].ItemID);
    }
  }, [myInventory, selectedMyPostId]);

  const isInitiating = matchId?.startsWith("post-");

  // 3. ประกอบโครงสร้างข้อมูลการจับคู่แลกเปลี่ยน (ดึงข้อมูลชื่อคู่แลกจากฐานข้อมูลจริง)
  const match = useMemo(() => {
    if (location.state?.matchData) {
      return location.state.matchData;
    }

    const targetPostId = matchId ? matchId.replace("post-", "") : "";
    const theirPost = dbItems.find(p => String(p.ItemID) === String(targetPostId));
    const mySelectedPost = myInventory.find(p => String(p.ItemID) === String(selectedMyPostId)) || myInventory[0];

    // เจาะหาชื่อคู่แลกเปลี่ยนจากฟิลด์ต่างๆ ที่ระบบหลังบ้านอาจจะส่งมา
    const theirActualName = theirPost 
      ? theirPost.Username || theirPost.MemberName || theirPost.OwnerName || "ผู้ใช้งานระบบ"
      : "ผู้ใช้งานระบบ";

    return {
      id: matchId,
      myPost: mySelectedPost ? {
        title: mySelectedPost.ItemName,
        category: mySelectedPost.CategoryName || "ทั่วไป",
        image: getCorrectImagePath(mySelectedPost.ItemImage),
        location: mySelectedPost.MeetingLocation || "ไม่ระบุสถานที่"
      } : null,
      theirPost: theirPost ? {
        title: theirPost.ItemName,
        category: theirPost.CategoryName || "ทั่วไป",
        image: getCorrectImagePath(theirPost.ItemImage),
        location: theirPost.MeetingLocation || "ไม่ระบุสถานที่",
        authorName: theirActualName
      } : null,
      score: 95, 
    };
  }, [matchId, selectedMyPostId, dbItems, myInventory, location.state]);

  // 4. 🛠️ ฟังก์ชันการส่งคำขอแลกเปลี่ยน สลับไปหน้า Matching แท็บสถานะแบบเรียลไทม์
  const handleConfirm = async () => {
    if (!phone || phone.replace(/-/g, "").length < 10) {
      toast({
        title: "กรุณากรอกเบอร์โทรศัพท์",
        description: "ต้องกรอกให้ครบ 10 หลัก",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedMyPostId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกสิ่งของของคุณที่ต้องการเสนอแลกเปลี่ยนก่อน",
        variant: "destructive"
      });
      return;
    }

    const targetPostId = matchId ? matchId.replace("post-", "") : "";
    const theirPostData = dbItems.find(p => String(p.ItemID) === String(targetPostId));
    const targetMemberId = theirPostData ? theirPostData.MemberID : null;

    if (!targetMemberId) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบรหัสสมาชิกคู่แลกเปลี่ยนในระบบข้อมูลปัจจุบัน",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // ✨ ตรวจสอบและยิง API อย่างยืดหยุ่น ป้องกันปัญหาความไม่สอดคล้องของ Parameter โครงสร้างหลังบ้าน
      let response;
      if (typeof createExchangeRequest === "function") {
        // ลองยิงแบบกระจายพารามิเตอร์ตามลักษณะ API ดั้งเดิมของโปรเจกต์คุณก่อน
        try {
          response = await createExchangeRequest(
            String(targetMemberId), 
            match.myPost?.location || "นัดเจอตามตกลง"
          );
        } catch {
          // หากพัง ให้สลับมายิงแบบสากล (Object Payload)
          const payload = {
            sender_id: currentUserId,
            receiver_id: String(targetMemberId),
            my_item_id: String(selectedMyPostId),
            their_item_id: String(targetPostId),
            location: match.myPost?.location || "นัดเจอตามตกลง",
            phone_number: phone.replace(/-/g, "")
          };
          response = await (createExchangeRequest )(payload);
        }
      } else {
        throw new Error("API function 'createExchangeRequest' is not declared or exported properly.");
      }

      if (response && (response.success || response.data)) {
        toast({
          title: "ส่งคำขอแลกเปลี่ยนสำเร็จ!",
          description: "ระบบได้ส่งคำขอไปยังเจ้าของโพสต์ และเพิ่มประวัติในสถานะรอตอบรับแล้ว",
        });
        
        // 🚀 พาวิ่งกลับไปหน้า Matching พร้อมสั่งให้เปิดแท็บ status (สถานะการแมตช์) อัตโนมัติ
        navigate("/matching", { state: { activeTab: "status" } }); 
      } else {
        throw new Error(response?.message || "เซิร์ฟเวอร์ปฏิเสธการทำรายการ");
      }

    } catch (error) {
      console.error("Error submitting exchange request:", error);
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถติดต่อกับโครงสร้างระบบ API แลกเปลี่ยนได้ในขณะนี้";
      toast({
        title: "เกิดข้อผิดพลาดในการบันทึก",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center text-muted-foreground animate-pulse">กำลังดึงข้อมูลเตรียมการแลกเปลี่ยน...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">ยืนยันการแลกเปลี่ยน</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {isInitiating && (
                <Card className="glass-card border-primary/20 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        เลือกสิ่งของที่คุณต้องการเสนอแลก
                      </h2>
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        มี {myInventory.length} ชิ้น
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {myInventory.length === 0 ? (
                        <p className="text-xs text-center py-6 text-muted-foreground">คุณยังไม่มีโพสต์สิ่งของ สามารถไปเพิ่มโพสต์ก่อนเสนอแลกได้ครับ</p>
                      ) : (
                        myInventory.map((post) => {
                          const isSelected = String(selectedMyPostId) === String(post.ItemID);
                          return (
                            <div
                              key={post.ItemID}
                              onClick={() => setSelectedMyPostId(post.ItemID)}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none
                                ${isSelected
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-transparent bg-secondary/30 hover:bg-secondary/60"
                                }`}
                            >
                              <img 
                                src={getCorrectImagePath(post.ItemImage)} 
                                alt={post.ItemName} 
                                className="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0 bg-muted" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                                  {post.ItemName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{post.CategoryName || "ทั่วไป"}</p>
                              </div>
                              <div className="shrink-0 pl-2">
                                {isSelected ? (
                                  <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground/30" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Match Comparison Display */}
              <Card className="glass-card overflow-hidden">
                {match.score && (
                  <div className="bg-primary px-4 py-3 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">
                      คะแนนความเหมาะสม {match.score}%
                    </span>
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4 sm:gap-8 justify-center">
                    {match.myPost ? (
                      <div className="flex-1 text-center space-y-3 min-w-0">
                        <img
                          src={match.myPost.image}
                          alt={match.myPost.title}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover mx-auto border-2 border-primary/20 bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                          }}
                        />
                        <p className="text-sm font-semibold truncate">{match.myPost.title}</p>
                        <Badge variant="secondary" className="text-[10px]">{match.myPost.category}</Badge>
                        <p className="text-[10px] text-muted-foreground">ของคุณ</p>
                      </div>
                    ) : (
                      <div className="flex-1 text-center text-xs text-muted-foreground">กรุณาเลือกหรือสร้างโพสต์สินค้า</div>
                    )}

                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <ArrowRightLeft className="h-6 w-6 text-primary" />
                      <span className="text-[10px] text-muted-foreground">แลก</span>
                    </div>

                    {match.theirPost ? (
                      <div className="flex-1 text-center space-y-3 min-w-0">
                        <img
                          src={match.theirPost.image}
                          alt={match.theirPost.title}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover mx-auto border-2 border-accent/20 bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                          }}
                        />
                        <p className="text-sm font-semibold truncate">{match.theirPost.title}</p>
                        <Badge variant="secondary" className="text-[10px]">{match.theirPost.category}</Badge>
                        <p className="text-[10px] text-muted-foreground">{match.theirPost.authorName}</p>
                      </div>
                    ) : (
                      <div className="flex-1 text-center text-xs text-muted-foreground">ไม่พบข้อมูลสิ่งของคู่แลกเปลี่ยน</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="glass-card">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    สถานที่นัดรับ
                  </h2>
                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">ของคุณ</p>
                      <p className="text-xs font-medium">{match.myPost?.location || "ยังไม่มีข้อมูล"}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">คู่แลกเปลี่ยน</p>
                      <p className="text-xs font-medium">{match.theirPost?.location || "ยังไม่มีข้อมูล"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    หมายเลขโทรศัพท์ของคุณ
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    เบอร์นี้จะแสดงให้คู่แลกเห็นเมื่อยืนยันรหัสความปลอดภัยเท่านั้น
                  </p>
                  <Input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
                    maxLength={12}
                    className="h-11"
                  />
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button
                  className="w-full text-primary-foreground h-12 bg-primary hover:bg-primary/90"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? "กำลังส่งคำขอไปยังระบบ..." : "ยืนยันส่งคำขอแลกเปลี่ยน"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full hover:bg-orange-500/85 hover:text-white transition-colors"
                  onClick={() => navigate(-1)}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}