
import { useState, useEffect, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRightLeft, CheckCircle, XCircle, Inbox, ArrowLeft, Eye, Loader2, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";

interface ExchangeRequest {
  ExchangeID: number;
  ExchangeStatus: string;
  ExchangeLocation: string;
  Score: number;
  MatchScore?: number;
  MemberID: number;
  TargetMemberID: number;
  MyItemID: number;
  TargetItemID: number;
  PhoneNumber: string;
  StartDate: string | null;
  myPostTitle?: string;
  my_post_title?: string;
  TargetItemName?: string;
  target_item_name?: string;
  myPostImage?: string;
  my_post_image?: string;
  TargetItemImage?: string;
  target_item_image?: string;
  theirPostTitle?: string;
  their_post_title?: string;
  MyItemName?: string;
  my_item_name?: string;
  theirPostImage?: string;
  their_post_image?: string;
  MyItemImage?: string;
  my_item_image?: string;
  theirAuthorName?: string;
  sender_name?: string;
  MemberName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ErrorResponse {
  message?: string;
}

interface LoggedInUser {
  id?: string | number;
  MemberID?: string | number;
  name?: string;
}

interface RequestItemPreviewProps {
  image?: string;
  title: string;
  owner: string;
}

const API_BASE_URL = "http://localhost:5000/api/exchanges";
const IMAGE_BASE_URL = "http://localhost:5000/uploads/";
const PLACEHOLDER_IMAGE = "/placeholder.jpg";

function getSavedUser(): LoggedInUser | null {
  try {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function getSavedIds(storage: Storage, key: string): number[] {
  try {
    const saved = JSON.parse(storage.getItem(key) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getRequestAgeText(startDate: string | null): string {
  if (!startDate) return "เมื่อเร็วๆ นี้";

  const createdDate = new Date(startDate);

  if (isNaN(createdDate.getTime())) return "เมื่อเร็วๆ นี้";

  const now = new Date();
  const createdDay = new Date(
    createdDate.getFullYear(),
    createdDate.getMonth(),
    createdDate.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.floor(
    (today.getTime() - createdDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  return diffDays <= 0 ? "วันนี้" : `${diffDays} วันที่แล้ว`;
}

function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return PLACEHOLDER_IMAGE;

  let image = imagePath.trim();

  if (
    !image ||
    image === "undefined" ||
    image === "null" ||
    image === PLACEHOLDER_IMAGE
  ) {
    return PLACEHOLDER_IMAGE;
  }

  if (image.startsWith("http")) return image;

  if (image.startsWith("[")) {
    try {
      const images = JSON.parse(image.split("'").join('"'));
      image = Array.isArray(images) ? String(images[0] || "").trim() : "";
    } catch {
      image = image
        .split("[").join("")
        .split("]").join("")
        .split('"').join("")
        .split("'").join("");
    }
  }

  image = image.split(",")[0]?.trim() || "";

  if (!image || image === "undefined" || image === "null") {
    return PLACEHOLDER_IMAGE;
  }

  return image.startsWith("http")
    ? image
    : `${IMAGE_BASE_URL}${image}`;
}

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;

  if (image.src !== `${window.location.origin}${PLACEHOLDER_IMAGE}`) {
    image.src = PLACEHOLDER_IMAGE;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}

function RequestItemPreview({
  image,
  title,
  owner,
}: RequestItemPreviewProps) {
  return (
    <div className="flex-1 text-center space-y-1 min-w-0">
      <img
        src={getImageUrl(image)}
        alt={title}
        className="w-16 h-16 rounded-lg object-cover mx-auto bg-muted shadow-sm"
        onError={handleImageError}
      />
      <p className="text-xs font-medium truncate">{title}</p>
      <p className="text-[10px] text-muted-foreground truncate">{owner}</p>
    </div>
  );
}

export default function IncomingRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const [rejectRequest, setRejectRequest] = useState<ExchangeRequest | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "accept" | "reject" | "";
    exchangeId: number | null;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "",
    exchangeId: null,
  });

  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [seenIds] = useState<number[]>(() =>
    getSavedIds(sessionStorage, "seen_exchange_ids"),
  );

  useEffect(() => {
    const fetchIncomingRequests = async () => {
      const user = getSavedUser();
      const currentUserId = user?.id || user?.MemberID;

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get<ApiResponse<ExchangeRequest[]>>(
          `${API_BASE_URL}?member_id=${currentUserId}`,
        );

        if (response.data.success) {
          const dataList = response.data.data || [];

          const incoming = dataList.filter(
            (request) =>
              request.ExchangeStatus?.toLowerCase() === "pending" &&
              String(request.TargetMemberID) === String(currentUserId),
          );

          setRequests(incoming);

          // บันทึกรหัสคำขอสำหรับระบบแจ้งเตือนส่วนอื่น
          const currentSeen = getSavedIds(
            localStorage,
            "seen_exchange_ids",
          );
          const incomingIds = incoming.map((item) => item.ExchangeID);
          const updatedSeen = Array.from(
            new Set([...currentSeen, ...incomingIds]),
          );

          localStorage.setItem(
            "seen_exchange_ids",
            JSON.stringify(updatedSeen),
          );
        }
      } catch (error) {
        console.error("Error fetching incoming requests:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลคำขอแลกเปลี่ยนได้",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIncomingRequests();
  }, [toast]);

  const handleAccept = (request: ExchangeRequest) => {
    setSelectedRequest(request);
    setPhoneInput("");
    setIsPhoneModalOpen(true);
  };

  const closePhoneModal = () => {
    if (isAccepting) return;

    setPhoneInput("");
    setSelectedRequest(null);
    setIsPhoneModalOpen(false);
  };

  const confirmAccept = async () => {
    if (!selectedRequest || isAccepting) return;

    if (!phoneInput || phoneInput.trim().length < 9) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)",
        variant: "destructive",
      });
      return;
    }

    const request = selectedRequest;

    try {
      setIsAccepting(true);

      const response = await axios.put<ApiResponse<null>>(
        `${API_BASE_URL}/${request.ExchangeID}`,
        {
          action: "accept",
          phone_number: phoneInput.trim(),
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่สามารถตอบรับคำขอได้");
      }

      try {
        await axios.post(
          `${API_BASE_URL}/${request.ExchangeID}/request-code`,
          { user_id: request.MemberID },
        );
        await axios.post(
          `${API_BASE_URL}/${request.ExchangeID}/request-code`,
          { user_id: request.TargetMemberID },
        );
      } catch (error) {
        console.error("ไม่สามารถส่ง OTP อัตโนมัติได้:", error);
      }

      setIsPhoneModalOpen(false);

      setSuccessModal({
        isOpen: true,
        title: "ตอบรับคำขอสำเร็จ! 🎉",
        description:
          "ระบบกำลังส่งรหัส OTP ให้คุณและคู่แลกเปลี่ยน สามารถตรวจสอบสถานะได้ที่หน้าติดตามการแลกเปลี่ยน",
        type: "accept",
        exchangeId: request.ExchangeID,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: getErrorMessage(error, "ไม่สามารถตอบรับคำขอได้"),
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectRequest || isRejecting) return;

    const request = rejectRequest;

    try {
      setIsRejecting(true);

      const response = await axios.put<ApiResponse<null>>(
        `${API_BASE_URL}/${request.ExchangeID}`,
        { action: "reject" },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่สามารถปฏิเสธคำขอได้");
      }

      setRequests((previous) =>
        previous.filter((item) => item.ExchangeID !== request.ExchangeID),
      );
      setRejectRequest(null);

      setSuccessModal({
        isOpen: true,
        title: "ปฏิเสธคำขอเรียบร้อย",
        description: `แจ้งผลไปยัง ${request.theirAuthorName || "ผู้ใช้งาน"} เรียบร้อยแล้ว`,
        type: "reject",
        exchangeId: null,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: getErrorMessage(error, "ไม่สามารถปฏิเสธคำขอได้"),
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const closeSuccessModal = () => {
    const { type, exchangeId } = successModal;

    setSuccessModal((previous) => ({ ...previous, isOpen: false }));

    if (type === "accept" && exchangeId) {
      navigate(`/exchange-tracking/${exchangeId}`, {
        state: { newStatus: "accepted" },
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <Inbox className="h-5 w-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">
            คำขอแลกเปลี่ยนที่ได้รับ
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">ยังไม่มีคำขอแลกเปลี่ยนใหม่</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((request) => {
              const theirTitle =
                request.theirPostTitle ||
                request.their_post_title ||
                request.MyItemName ||
                request.my_item_name ||
                "ไม่มีชื่อสิ่งของของเขา";

              const myTitle =
                request.myPostTitle ||
                request.my_post_title ||
                request.TargetItemName ||
                request.target_item_name ||
                "ไม่มีชื่อสิ่งของของเรา";

              return (
                <Card
                  key={request.ExchangeID}
                  className="glass-card border-primary/20"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-3 items-center gap-1">
                      <div className="justify-self-start">
                        {!seenIds.includes(request.ExchangeID) ? (
                          <Badge className="bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 hover:bg-orange-500/15 dark:hover:bg-orange-500/20 pointer-events-none border-0 text-xs font-medium">
                            คำขอใหม่
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-muted text-xs font-normal"
                          >
                            {getRequestAgeText(request.StartDate)}
                          </Badge>
                        )}
                      </div>

                      <div className="justify-self-center">
                        {request.MatchScore && request.MatchScore > 0 && (
                          <Badge className="bg-primary text-white hover:bg-primary pointer-events-none border-0 text-[10px] px-1.5 py-0.5 font-semibold shadow-xs whitespace-nowrap">
                            คะแนนจับคู่ {request.MatchScore}%
                          </Badge>
                        )}
                      </div>

                      <div className="justify-self-end">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {request.StartDate
                            ? new Date(request.StartDate).toLocaleDateString("th-TH")
                            : "เมื่อเร็วๆ นี้"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <RequestItemPreview
                        image={
                          request.theirPostImage ||
                          request.their_post_image ||
                          request.MyItemImage ||
                          request.my_item_image
                        }
                        title={theirTitle}
                        owner={
                          request.theirAuthorName ||
                          request.sender_name ||
                          request.MemberName ||
                          "ผู้ใช้งาน"
                        }
                      />

                      <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />

                      <RequestItemPreview
                        image={
                          request.myPostImage ||
                          request.my_post_image ||
                          request.TargetItemImage ||
                          request.target_item_image
                        }
                        title={myTitle}
                        owner="ของคุณ"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/50 mt-3">
                      <Button
                        variant="secondary"
                        className="w-full text-xs h-8"
                        onClick={() =>
                          navigate(`/post/${request.MyItemID}`, {
                            state: {
                              fromPage: "incoming",
                              fromIncomingRequest: true,
                            },
                          })
                        }
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        ดูรายละเอียดของที่สนใจแลก
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 eco-gradient text-primary-foreground"
                          size="sm"
                          onClick={() => handleAccept(request)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          ตอบรับ
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-1 border-border/60 text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-foreground transition-all"
                          size="sm"
                          onClick={() => setRejectRequest(request)}
                        >
                          <XCircle className="h-4 w-4 mr-1 text-muted-foreground" />
                          ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={isPhoneModalOpen}
        onOpenChange={(open) => {
          if (!open) closePhoneModal();
          else setIsPhoneModalOpen(true);
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-md p-6 sm:p-8 shadow-2xl border border-border/50 bg-card backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-end">
            <button
              type="button"
              aria-label="ปิดหน้าต่าง"
              onClick={closePhoneModal}
              disabled={isAccepting}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 -mt-2">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/25">
              <Phone className="h-6 w-6" />
            </div>

            <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
              ข้อมูลการติดต่อผู้แลกเปลี่ยน
            </AlertDialogTitle>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
              กรอกเบอร์โทรศัพท์มือถือของคุณ เพื่อให้{" "}
              <strong className="text-foreground">
                {selectedRequest?.theirAuthorName || "คู่แลกเปลี่ยน"}
              </strong>{" "}
              สามารถติดต่อประสานงานนัดรับสินค้าได้สะดวกยิ่งขึ้น
            </p>
          </div>

          <div className="space-y-2 py-2">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                +66
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phoneInput}
                onChange={(event) =>
                  setPhoneInput(
                    event.target.value.split("").filter((char) => char >= "0" && char <= "9").join(""),
                  )
                }
                placeholder="8XXXXXXXX"
                disabled={isAccepting}
                className="w-full text-center tracking-widest font-bold text-lg h-14 pl-12 pr-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background/50 shadow-inner transition-all text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <p className="text-[11px] text-center text-muted-foreground">
              ระบุเบอร์โทรศัพท์ 10 หลัก (เช่น 0812345678)
            </p>
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <AlertDialogCancel
              className="w-full sm:flex-1 rounded-2xl h-11 text-xs font-semibold border-border/60 bg-card text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-foreground transition-all mt-0 shadow-xs"
              onClick={closePhoneModal}
              disabled={isAccepting}
            >
              ยกเลิก
            </AlertDialogCancel>

            <Button
              onClick={confirmAccept}
              disabled={phoneInput.length < 9 || isAccepting}
              className="w-full sm:flex-1 rounded-2xl h-11 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2" />
                  กำลังประมวลผล...
                </>
              ) : (
                "ยืนยันและดำเนินการต่อ"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!rejectRequest}
        onOpenChange={(open) => {
          if (!open && !isRejecting) setRejectRequest(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm p-6 text-center shadow-xl">
          <AlertDialogTitle className="text-xl text-center">
            ยืนยันการปฏิเสธ
          </AlertDialogTitle>

          <p className="text-sm text-muted-foreground mt-2">
            คุณต้องการปฏิเสธคำขอแลกเปลี่ยนจาก{" "}
            <strong>{rejectRequest?.theirAuthorName || "ผู้ใช้งาน"}</strong>{" "}
            ใช่หรือไม่?
          </p>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-5 sm:space-x-0">
            <AlertDialogCancel
              className="w-full sm:flex-1 rounded-2xl h-11 text-xs font-semibold border-border/60 bg-card text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-foreground transition-all mt-0 shadow-xs"
              onClick={() => setRejectRequest(null)}
              disabled={isRejecting}
            >
              ยกเลิก
            </AlertDialogCancel>

            <AlertDialogAction
              className="w-full sm:flex-1 rounded-xl h-11 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                confirmReject();
              }}
              disabled={isRejecting}
            >
              {isRejecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              ยืนยันการปฏิเสธ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={successModal.isOpen}
        onOpenChange={(open) => {
          if (!open) closeSuccessModal();
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm p-6 text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <AlertDialogTitle className="text-xl text-center">
            {successModal.title}
          </AlertDialogTitle>

          <p className="text-sm text-muted-foreground mt-2">
            {successModal.description}
          </p>

          <Button
            className="w-full rounded-xl mt-6 h-11 font-semibold"
            onClick={closeSuccessModal}
          >
            ตกลง
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}