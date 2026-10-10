import { useState, useMemo, useEffect, type SyntheticEvent } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRightLeft,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Box,
  CheckCircle2,
  Circle,
  Loader2,
  Info,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  getItems as fetchItemsAPI,
  IMAGE_BASE_URL,
  createExchangeRequest,
} from "@/api/api";

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

interface PreviewPost {
  title: string;
  description: string;
  category: string;
  image: string;
  location: string;
  authorName?: string;
}

function getCorrectImagePath(imageName?: string) {
  if (!imageName || imageName.trim() === "undefined" || imageName === "null") {
    return "/placeholder.jpg";
  }

  try {
    let image = imageName.trim();

    if (image.startsWith("[")) {
      const parsed = JSON.parse(image.replace(/'/g, '"'));

      if (Array.isArray(parsed) && parsed.length > 0) {
        image = parsed[0].trim();
      }
    } else if (image.includes(",")) {
      image = image.split(",")[0].trim();
    }

    return image.startsWith("http")
      ? image
      : `${IMAGE_BASE_URL}/uploads/${image}`;
  } catch {
    const image =
      imageName
        .split("[")
        .join("")
        .split("]")
        .join("")
        .split("{")
        .join("")
        .split("}")
        .join("")
        .split('"')
        .join("")
        .split("'")
        .join("")
        .split(",")[0]
        ?.trim() || "";

    if (!image) return "/placeholder.jpg";

    return image.startsWith("http")
      ? image
      : `${IMAGE_BASE_URL}/uploads/${image}`;
  }
}

function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;

  if (image.src !== `${window.location.origin}/placeholder.jpg`) {
    image.src = "/placeholder.jpg";
  }
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as ApiErrorResponse;
    return err.message || err.error || "ไม่สามารถติดต่อระบบ API ได้ในขณะนี้";
  }

  return "ไม่สามารถติดต่อระบบ API ได้ในขณะนี้";
}

function ItemPreviewCard({
  label,
  category,
  image,
  title,
  description,
}: {
  label: string;
  category: string;
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-primary/10 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Badge className="text-[10px] bg-primary hover:bg-primary/90 text-white font-semibold truncate max-w-[140px] border-none">
            {label}
          </Badge>
          <Badge className="text-[10px] bg-primary hover:bg-primary/90 text-white border-none">
            {category}
          </Badge>
        </div>

        <img
          src={image}
          alt={title}
          className="w-full h-48 rounded-lg object-cover border border-border mb-3 bg-background"
          onError={handleImageError}
        />

        <h3 className="text-base font-bold text-foreground line-clamp-1">
          {title}
        </h3>

        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          <div className="flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
            <p className="line-clamp-3 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedMyPostId, setSelectedMyPostId] = useState<string | number>("");

  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);

        const savedUser = sessionStorage.getItem("user");

        if (savedUser) {
          const user = JSON.parse(savedUser);
          const uid = user.id ?? user.user_id ?? user.UserID ?? user.MemberID;
          setCurrentUserId(String(uid));
        }

        const response = await fetchItemsAPI();

        if (response && Array.isArray(response.data)) {
          setDbItems(response.data);
        }
      } catch (error: unknown) {
        console.error("Error fetching items for preview:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  const myInventory = useMemo(() => {
    if (!currentUserId) return [];

    return dbItems.filter((item) => String(item.MemberID) === currentUserId);
  }, [dbItems, currentUserId]);

  let targetId = matchId || "";
  let preSelectedMyId = "";

  if (matchId?.startsWith("match-")) {
    const parts = matchId.split("-");
    preSelectedMyId = parts[1];
    targetId = parts[2];
  } else if (matchId?.startsWith("post-")) {
    targetId = matchId.replace("post-", "");
  }

  const isFromMatchResults = matchId?.startsWith("match-");
  const isFromPostDetails = matchId?.startsWith("post-");

  useEffect(() => {
    if (preSelectedMyId && !selectedMyPostId) {
      setSelectedMyPostId(preSelectedMyId);
    } else if (myInventory.length > 0 && !selectedMyPostId) {
      setSelectedMyPostId(myInventory[0].ItemID);
    }
  }, [myInventory, selectedMyPostId, preSelectedMyId]);

  const stateData = location.state?.matchData;

  const selectedMyItem =
    myInventory.find(
      (item) => String(item.ItemID) === String(selectedMyPostId),
    ) || myInventory[0];

  const targetItem = dbItems.find(
    (item) => String(item.ItemID) === String(targetId),
  );

  let myPost: PreviewPost | null = null;

  if (selectedMyItem) {
    myPost = {
      title: selectedMyItem.ItemName,
      description: selectedMyItem.ItemDescription || "ไม่มีรายละเอียดเพิ่มเติม",
      category: selectedMyItem.CategoryName || "ทั่วไป",
      image: getCorrectImagePath(selectedMyItem.ItemImage),
      location: selectedMyItem.MeetingLocation || "นัดเจอตามตกลง",
    };
  } else if (stateData?.myPost) {
    const post = stateData.myPost;

    myPost = {
      title: post.ItemName || post.title || "สิ่งของของคุณ",
      description:
        post.ItemDescription || post.description || "ไม่มีรายละเอียดเพิ่มเติม",
      category: post.CategoryName || "ทั่วไป",
      image: getCorrectImagePath(post.ItemImage || post.images?.[0]),
      location: post.MeetingLocation || "นัดเจอตามตกลง",
    };
  }

  let theirPost: PreviewPost | null = null;

  if (targetItem) {
    theirPost = {
      title: targetItem.ItemName,
      description: targetItem.ItemDescription || "ไม่มีรายละเอียดเพิ่มเติม",
      category: targetItem.CategoryName || "ทั่วไป",
      image: getCorrectImagePath(targetItem.ItemImage),
      location: targetItem.MeetingLocation || "นัดเจอตามตกลง",
      authorName:
        targetItem.DisplayName ||
        targetItem.MemberName ||
        targetItem.OwnerName ||
        targetItem.Username ||
        "ผู้ใช้งานระบบ",
    };
  } else if (stateData?.theirPost) {
    const post = stateData.theirPost;

    theirPost = {
      title: post.title || "สิ่งของคู่แลก",
      description: post.description || "ไม่มีรายละเอียดเพิ่มเติม",
      category: post.category || "ทั่วไป",
      image: getCorrectImagePath(post.images?.[0]),
      location: post.location || "นัดเจอตามตกลง",
      authorName: "ผู้ใช้งานระบบ",
    };
  }

  const match = {
    score: stateData?.score || null,
    myPost,
    theirPost,
  };

  const handleConfirm = async () => {
    if (!phone || phone.replace(/-/g, "").length < 10) {
      toast({
        title: "กรุณากรอกเบอร์โทรศัพท์",
        description: "ต้องกรอกให้ครบ 10 หลัก",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMyPostId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกสิ่งของของคุณที่ต้องการเสนอแลกเปลี่ยนก่อน",
        variant: "destructive",
      });
      return;
    }

    const targetMemberId = targetItem?.MemberID;

    if (!targetMemberId) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบรหัสสมาชิกคู่แลกเปลี่ยนในระบบข้อมูลปัจจุบัน",
        variant: "destructive",
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
        phone_number: phone.replace(/-/g, ""),
        match_score: match.score ? Number(match.score) : 0,
        exchange_type: isFromMatchResults ? "match" : "manual",
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

      toast({
        title: "เกิดข้อผิดพลาดในการบันทึก",
        description: formatErrorMessage(error),
        variant: "destructive",
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
        <div className="mx-auto max-w-[1000px] px-4 md:px-8 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">
                ยืนยันการแลกเปลี่ยน
              </h1>
            </div>
          </div>

          {isFromPostDetails && (
            <Card className="glass-card border-primary/20 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Box className="h-4 w-4 text-primary" />
                    เลือกสิ่งของของคุณที่จะนำไปแลก
                  </CardTitle>
                  <Badge className="bg-primary hover:bg-primary/90 text-white border-none">
                    มี {myInventory.length} ชิ้น
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-0">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {myInventory.length === 0 ? (
                    <p className="text-xs text-center py-6 text-muted-foreground">
                      คุณยังไม่มีโพสต์สิ่งของ
                      สามารถไปเพิ่มโพสต์ก่อนเสนอแลกได้ครับ
                    </p>
                  ) : (
                    myInventory.map((post) => {
                      const isSelected =
                        String(selectedMyPostId) === String(post.ItemID);

                      return (
                        <div
                          key={post.ItemID}
                          onClick={() => setSelectedMyPostId(post.ItemID)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:bg-muted/50"
                          }`}
                        >
                          <img
                            src={getCorrectImagePath(post.ItemImage)}
                            alt={post.ItemName}
                            className="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0 bg-muted"
                            onError={handleImageError}
                          />

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isSelected ? "text-black" : "text-foreground"
                              }`}
                            >
                              {post.ItemName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {post.CategoryName || "ทั่วไป"}
                            </p>
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

          <Card className="glass-card border-primary/20 overflow-hidden">
            {match.score && isFromMatchResults && (
              <div className="bg-primary border border-primary/20 px-4 py-2.5 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">
                  คะแนนความเหมาะสมจาก : {match.score}%
                </span>
              </div>
            )}

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {match.myPost ? (
                  <ItemPreviewCard
                    label="ของคุณ"
                    category={match.myPost.category}
                    image={match.myPost.image}
                    title={match.myPost.title}
                    description={match.myPost.description}
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border flex items-center justify-center">
                    กรุณาเลือกสิ่งของของคุณ
                  </div>
                )}

                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-white items-center justify-center shadow-md border-2 border-primary/20 z-10 transition-transform hover:scale-110">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>

                {match.theirPost ? (
                  <ItemPreviewCard
                    label={match.theirPost.authorName || "ผู้ใช้งานระบบ"}
                    category={match.theirPost.category}
                    image={match.theirPost.image}
                    title={match.theirPost.title}
                    description={match.theirPost.description}
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border flex items-center justify-center">
                    ไม่พบข้อมูลสิ่งของคู่แลกเปลี่ยน
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                    ของคุณ
                  </span>
                  <p className="text-xs text-foreground font-medium">
                    {match.myPost?.location || "นัดเจอตามตกลง"}
                  </p>
                </div>

                <div className="bg-secondary/10 border border-primary/10 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                    คู่แลกเปลี่ยน
                  </span>
                  <p className="text-xs text-foreground font-medium">
                    {match.theirPost?.location || "นัดเจอตามตกลง"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                หมายเลขโทรศัพท์ของคุณ
              </CardTitle>
            </CardHeader>

            <CardContent className="px-5 pb-5 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                เบอร์นี้จะแสดงให้คู่แลกเห็นเมื่อยืนยันรหัสความปลอดภัย OTP
                เท่านั้น
              </p>
              <Input
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/[^0-9-]/g, ""))
                }
                maxLength={12}
                className="h-11 text-sm font-medium focus-visible:ring-primary"
              />
            </CardContent>
          </Card>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700/80 dark:text-amber-500/90 leading-normal font-medium">
              ตรวจสอบสภาพสินค้าจริง ณ วันนัดพบ
              และสามารถยกเลิกการแลกเปลี่ยนได้หากสินค้าไม่ตรงตามรายละเอียดที่ระบุ
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-12 eco-gradient text-primary-foreground shadow-sm transition-all font-semibold"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังส่งคำขอ...
                </span>
              ) : (
                "ยืนยันส่งคำขอแลกเปลี่ยน"
              )}
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
