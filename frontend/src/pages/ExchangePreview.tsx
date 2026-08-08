import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowRightLeft, MapPin, Phone, ShieldCheck, Sparkles, ArrowLeft, 
  Box, CheckCircle2, Circle, Loader2, Info, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
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
  DisplayName?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
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
  const [selectedMyPostId, setSelectedMyPostId] = useState<string | number>("");

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
      } catch (error: unknown) {
        console.error("Error fetching items for preview:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRealData();
  }, []);

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

  const myInventory = useMemo(() => {
    if (!currentUserId) return [];
    return dbItems.filter(item => String(item.MemberID) === currentUserId);
  }, [dbItems, currentUserId]);

  const { targetId, preSelectedMyId } = useMemo(() => {
    if (!matchId) return { targetId: "", preSelectedMyId: "" };
    if (matchId.startsWith("match-")) {
      const parts = matchId.split("-");
      return { preSelectedMyId: parts[1], targetId: parts[2] };
    }
    if (matchId.startsWith("post-")) {
      return { preSelectedMyId: "", targetId: matchId.replace("post-", "") };
    }
    return { targetId: matchId, preSelectedMyId: "" };
  }, [matchId]);

  useEffect(() => {
    if (preSelectedMyId && !selectedMyPostId) {
      setSelectedMyPostId(preSelectedMyId);
    } else if (myInventory.length > 0 && !selectedMyPostId) {
      setSelectedMyPostId(myInventory[0].ItemID);
    }
  }, [myInventory, selectedMyPostId, preSelectedMyId]);

  const isFromMatchResults = matchId?.startsWith("match-");
  const isFromPostDetails = matchId?.startsWith("post-");

  const match = useMemo(() => {
    const theirPost = dbItems.find(p => String(p.ItemID) === String(targetId));
    const mySelectedPost = myInventory.find(p => String(p.ItemID) === String(selectedMyPostId)) || myInventory[0];

    const theirActualName = theirPost 
      ? theirPost.DisplayName || theirPost.MemberName || theirPost.OwnerName || theirPost.Username || "ผู้ใช้งานระบบ"
      : "ผู้ใช้งานระบบ";

    const stateData = location.state?.matchData;

    return {
      id: matchId,
      score: stateData?.score || null,
      
      myPost: mySelectedPost ? {
        title: mySelectedPost.ItemName,
        description: mySelectedPost.ItemDescription || "ไม่มีรายละเอียดเพิ่มเติม",
        category: mySelectedPost.CategoryName || "ทั่วไป",
        image: getCorrectImagePath(mySelectedPost.ItemImage),
        location: mySelectedPost.MeetingLocation || "นัดเจอตามตกลง"
      } : stateData?.myPost ? {
        title: stateData.myPost.ItemName || stateData.myPost.title || "สิ่งของของคุณ",
        description: stateData.myPost.ItemDescription || stateData.myPost.description || "ไม่มีรายละเอียดเพิ่มเติม",
        category: stateData.myPost.CategoryName || "ทั่วไป",
        image: getCorrectImagePath(stateData.myPost.ItemImage || (stateData.myPost.images ? stateData.myPost.images[0] : "")),
        location: stateData.myPost.MeetingLocation || "นัดเจอตามตกลง"
      } : null,
      
      theirPost: theirPost ? {
        title: theirPost.ItemName,
        description: theirPost.ItemDescription || "ไม่มีรายละเอียดเพิ่มเติม",
        category: theirPost.CategoryName || "ทั่วไป",
        image: getCorrectImagePath(theirPost.ItemImage),
        location: theirPost.MeetingLocation || "นัดเจอตามตกลง",
        authorName: theirActualName
      } : stateData?.theirPost ? {
        title: stateData.theirPost.title || "สิ่งของคู่แลก",
        description: stateData.theirPost.description || "ไม่มีรายละเอียดเพิ่มเติม",
        category: stateData.theirPost.category || "ทั่วไป",
        image: getCorrectImagePath(stateData.theirPost.images ? stateData.theirPost.images[0] : ""),
        location: stateData.theirPost.location || "นัดเจอตามตกลง",
        authorName: "ผู้ใช้งานระบบ"
      } : null,
    };
  }, [matchId, selectedMyPostId, dbItems, myInventory, location.state, targetId]);

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

    const theirPostData = dbItems.find(p => String(p.ItemID) === String(targetId));
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

      const payload = {
        sender_id: currentUserId,
        receiver_id: String(targetMemberId),
        my_item_id: String(selectedMyPostId),
        their_item_id: String(targetId),
        location: match.myPost?.location || "นัดเจอตามตกลง",
        phone_number: phone.replace(/-/g, "")
      };

      const response = await createExchangeRequest(payload);

      if (response && (response.success || response.status === "success")) {
        toast({
          title: "ส่งคำขอแลกเปลี่ยนสำเร็จ!",
          description: "ระบบได้ส่งคำขอไปยังเจ้าของโพสต์เรียบร้อยแล้ว",
        });
        
        navigate("/matching", { state: { activeTab: "status" } }); 
      } else {
        throw new Error(response?.message || "เซิร์ฟเวอร์ปฏิเสธการทำรายการ");
      }

    } catch (error: unknown) {
      console.error("Error submitting exchange request:", error);
      
      let errorMessage = "ไม่สามารถติดต่อระบบ API ได้ในขณะนี้";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        const errObj = error as ApiErrorResponse;
        errorMessage = errObj.message || errObj.error || errorMessage;
      }

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
        <div className="px-4 py-12 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-3 h-[60vh] justify-center">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           กำลังดึงข้อมูลเตรียมการแลกเปลี่ยน...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold">ยืนยันการแลกเปลี่ยน</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">ตรวจสอบรายละเอียดสินค้าและสถานที่ก่อนส่งคำขอ</p>
            </div>
          </div>

          {/* 1. เลือกสิ่งของของตัวเอง (แสดงเมื่อเข้าผ่านหน้า Post Detail) */}
          {isFromPostDetails && (
            <Card className="glass-card border-primary/20 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Box className="h-4 w-4 text-primary" />
                    เลือกสิ่งของของคุณที่จะนำไปแลก
                  </CardTitle>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    มี {myInventory.length} ชิ้น
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
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
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                            ${isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:bg-muted/50"
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
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
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

          {/* 2. Match Comparison Display */}
          <Card className="glass-card border-primary/20 overflow-hidden">
            {match.score && isFromMatchResults && (
              <div className="bg-primary px-4 py-2.5 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">
                  คะแนนความเหมาะสมจาก AI: {match.score}%
                </span>
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* สิ่งของของคุณ */}
                {match.myPost ? (
                  <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-primary/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold">
                          ของคุณ
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {match.myPost.category}
                        </Badge>
                      </div>
                      <img
                        src={match.myPost.image}
                        alt={match.myPost.title}
                        className="w-full h-48 rounded-lg object-cover border border-border mb-3 bg-background"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                        }}
                      />
                      <h3 className="text-base font-bold text-foreground line-clamp-1">{match.myPost.title}</h3>
                      
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
                          <p className="line-clamp-3 leading-relaxed">{match.myPost.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border flex items-center justify-center">
                    กรุณาเลือกสิ่งของของคุณ
                  </div>
                )}

                {/* ปุ่มลูกศรตรงกลาง (ปรับตามธีมหน้า Detail) */}
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-md border-2 border-background z-10 transition-transform hover:scale-110">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>

                {/* สิ่งของคู่แลกเปลี่ยน */}
                {match.theirPost ? (
                  <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-primary/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px] bg-muted text-foreground border-border font-semibold truncate max-w-[140px]">
                          {match.theirPost.authorName}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {match.theirPost.category}
                        </Badge>
                      </div>
                      <img
                        src={match.theirPost.image}
                        alt={match.theirPost.title}
                        className="w-full h-48 rounded-lg object-cover border border-border mb-3 bg-background"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                        }}
                      />
                      <h3 className="text-base font-bold text-foreground line-clamp-1">{match.theirPost.title}</h3>
                      
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
                          <p className="line-clamp-3 leading-relaxed">{match.theirPost.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border flex items-center justify-center">
                    ไม่พบข้อมูลสิ่งของคู่แลกเปลี่ยน
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* 3. สถานที่นัดรับ */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                สถานที่นัดรับ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-secondary/10 border border-primary/10 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">ของคุณ</span>
                  <p className="text-xs text-foreground font-medium">{match.myPost?.location || "นัดเจอตามตกลง"}</p>
                </div>
                <div className="bg-secondary/10 border border-primary/10 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block mb-1">คู่แลกเปลี่ยน</span>
                  <p className="text-xs text-foreground font-medium">{match.theirPost?.location || "นัดเจอตามตกลง"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. หมายเลขโทรศัพท์ */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                หมายเลขโทรศัพท์ของคุณ
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                เบอร์นี้จะแสดงให้คู่แลกเห็นเมื่อยืนยันรหัสความปลอดภัย OTP เท่านั้น
              </p>
              <Input
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ""))}
                maxLength={12}
                className="h-11 text-sm font-medium focus-visible:ring-primary"
              />
            </CardContent>
          </Card>

          {/* 5. คำแนะนำความปลอดภัย */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700/80 dark:text-amber-500/90 leading-normal font-medium">
              ตรวจสอบสภาพสินค้าจริง ณ วันนัดพบ และสามารถยกเลิกการแลกเปลี่ยนได้หากสินค้าไม่ตรงตามรายละเอียดที่ระบุ
            </p>
          </div>

          {/* 6. Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-12 eco-gradient text-primary-foreground shadow-sm transition-all font-semibold"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> กำลังส่งคำขอ...
                </span>
              ) : (
                "ยืนยันส่งคำขอแลกเปลี่ยน"
              )}
            </Button>
            
            {/* ปุ่มยกเลิก แบบลูกศรย้อนกลับ+สีแดง */}
            <Button
              variant="ghost"
              className="w-full h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-semibold"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
          </div>

        </div>
      </section>
    </AppLayout>
  );
}