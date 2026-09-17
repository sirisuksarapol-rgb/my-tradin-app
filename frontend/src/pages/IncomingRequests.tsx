import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Inbox,
  ArrowLeft,
  Eye,
  Loader2,
  Phone,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ExchangeRequest {
  ExchangeID: number;
  ExchangeStatus: string;
  ExchangeLocation: string;
  Score: number;
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

const API_BASE_URL = "http://localhost:5000/api/exchanges";
const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

export default function IncomingRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<ExchangeRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // State สำหรับเปิดหน้าต่างยืนยันการปฏิเสธ
  const [rejectRequest, setRejectRequest] = useState<ExchangeRequest | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // State สำหรับหน้าต่างแจ้งผลลัพธ์ (แก้ไข Syntax แล้ว)
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
  const [loading, setLoading] = useState<boolean>(true);

  const [seenIds, setSeenIds] = useState<number[]>(() => {
    const saved = sessionStorage.getItem("seen_exchange_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const getRequestAgeText = (startDateStr: string | null): string => {
    if (!startDateStr) return "เมื่อเร็วๆ นี้";

    const createdDate = new Date(startDateStr);
    const now = new Date();

    const createdZero = new Date(
      createdDate.getFullYear(),
      createdDate.getMonth(),
      createdDate.getDate(),
    );
    const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowZero.getTime() - createdZero.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "วันนี้";
    } else {
      return `${diffDays} วันที่แล้ว`;
    }
  };

  const savedUser = sessionStorage.getItem("user");
  const user: LoggedInUser | null = savedUser ? JSON.parse(savedUser) : null;

  const fetchIncomingRequests = async () => {
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

        const incoming = dataList.filter((req) => {
          const status = (req.ExchangeStatus || "").toLowerCase();
          return (
            status === "pending" &&
            String(req.TargetMemberID) === String(currentUserId)
          );
        });

        setRequests(incoming);

        const currentSeen: number[] = JSON.parse(
          localStorage.getItem("seen_exchange_ids") || "[]",
        );
        const incomingIds = incoming.map((item) => item.ExchangeID);
        const updatedSeen = Array.from(
          new Set([...currentSeen, ...incomingIds]),
        );

        localStorage.setItem("seen_exchange_ids", JSON.stringify(updatedSeen));
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

  useEffect(() => {
    fetchIncomingRequests();
  }, []);

  const handleAccept = (req: ExchangeRequest) => {
    setSelectedRequest(req);
    setPhoneInput("");
    setIsPhoneModalOpen(true);
  };

  const confirmAccept = async () => {
    if (!selectedRequest) return;

    if (!phoneInput || phoneInput.trim().length < 9) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)",
        variant: "destructive",
      });
      return;
    }

    setIsAccepting(true);
    const req = selectedRequest;

    try {
      const response = await axios.put<ApiResponse<null>>(
        `${API_BASE_URL}/${req.ExchangeID}`,
        {
          action: "accept",
          phone_number: phoneInput.trim(),
        },
      );

      if (response.data.success) {
        try {
          await axios.post(`${API_BASE_URL}/${req.ExchangeID}/request-code`, {
            user_id: req.MemberID,
          });
          await axios.post(`${API_BASE_URL}/${req.ExchangeID}/request-code`, {
            user_id: req.TargetMemberID,
          });
        } catch (otpError) {
          console.error("แจ้งเตือน: ไม่สามารถส่ง OTP อัตโนมัติได้", otpError);
        }

        setIsPhoneModalOpen(false);
        setSuccessModal({
          isOpen: true,
          title: "ตอบรับคำขอสำเร็จ! 🎉",
          description: "ระบบกำลังส่งรหัส OTP ให้คุณและคู่แลกเปลี่ยน สามารถตรวจสอบสถานะได้ที่หน้าติดตามการแลกเปลี่ยน",
          type: "accept",
          exchangeId: req.ExchangeID,
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          axiosError.response?.data?.message || "ไม่สามารถตอบรับคำขอได้",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectRequest) return;
    setIsRejecting(true);

    try {
      const response = await axios.put<ApiResponse<null>>(
        `${API_BASE_URL}/${rejectRequest.ExchangeID}`,
        { action: "reject" },
      );

      if (response.data.success) {
        setRequests((prev) =>
          prev.filter((item) => item.ExchangeID !== rejectRequest.ExchangeID),
        );
        
        setRejectRequest(null);
        setSuccessModal({
          isOpen: true,
          title: "ปฏิเสธคำขอเรียบร้อย",
          description: `แจ้งผลไปยัง ${rejectRequest.theirAuthorName || "ผู้ใช้งาน"} เรียบร้อยแล้ว`,
          type: "reject",
          exchangeId: null,
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          axiosError.response?.data?.message || "ไม่สามารถปฏิเสธคำขอได้",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (
      !imagePath ||
      imagePath.trim() === "undefined" ||
      imagePath === "null" ||
      imagePath === "/placeholder.jpg"
    )
      return "/placeholder.jpg";
    if (imagePath.startsWith("http")) return imagePath;

    let cleanPath = imagePath.trim().replace(/\|"|'/g, "");
    cleanPath = cleanPath.split(",")[0];

    return `${IMAGE_BASE_URL}${cleanPath}`;
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
            {requests.map((req) => (
              <Card
                key={req.ExchangeID}
                className="glass-card border-primary/20 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {!seenIds.includes(req.ExchangeID) ? (
                      <Badge className="bg-warning/10 text-warning border-0 text-xs font-medium">
                        คำขอใหม่
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground border-muted text-xs font-normal"
                      >
                        {getRequestAgeText(req.StartDate)}
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground ml-auto">
                      {req.StartDate
                        ? new Date(req.StartDate).toLocaleDateString("th-TH")
                        : "เมื่อเร็วๆ นี้"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center space-y-1 min-w-0">
                      <img
                        src={getImageUrl(
                          req.theirPostImage ||
                            req.their_post_image ||
                            req.MyItemImage ||
                            req.my_item_image,
                        )}
                        alt={
                          req.theirPostTitle ||
                          req.their_post_title ||
                          req.MyItemName ||
                          req.my_item_name
                        }
                        className="w-16 h-16 rounded-lg object-cover mx-auto bg-muted shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (
                            target.src !==
                            window.location.origin + "/placeholder.jpg"
                          ) {
                            target.src = "/placeholder.jpg";
                          }
                        }}
                      />
                      <p className="text-xs font-medium truncate">
                        {req.theirPostTitle ||
                          req.their_post_title ||
                          req.MyItemName ||
                          req.my_item_name ||
                          "ไม่มีชื่อสิ่งของของเขา"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {req.theirAuthorName ||
                          req.sender_name ||
                          req.MemberName ||
                          "ผู้ใช้งาน"}
                      </p>
                    </div>

                    <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />

                    <div className="flex-1 text-center space-y-1 min-w-0">
                      <img
                        src={getImageUrl(
                          req.myPostImage ||
                            req.my_post_image ||
                            req.TargetItemImage ||
                            req.target_item_image,
                        )}
                        alt={
                          req.myPostTitle ||
                          req.my_post_title ||
                          req.TargetItemName ||
                          req.target_item_name
                        }
                        className="w-16 h-16 rounded-lg object-cover mx-auto bg-muted shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (
                            target.src !==
                            window.location.origin + "/placeholder.jpg"
                          ) {
                            target.src = "/placeholder.jpg";
                          }
                        }}
                      />
                      <p className="text-xs font-medium truncate">
                        {req.myPostTitle ||
                          req.my_post_title ||
                          req.TargetItemName ||
                          req.target_item_name ||
                          "ไม่มีชื่อสิ่งของของเรา"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ของคุณ
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/50 mt-3">
                    <Button
                      variant="secondary"
                      className="w-full text-xs h-8"
                      onClick={() =>
                        navigate(`/post/${req.MyItemID}`, {
                          state: {
                            fromPage: "incoming",
                            fromIncomingRequest: true,
                          },
                        })
                      }
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />{" "}
                      ดูรายละเอียดของที่สนใจแลก
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 eco-gradient text-primary-foreground"
                        size="sm"
                        onClick={() => handleAccept(req)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> ตอบรับ
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-border/60 text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-foreground transition-all"
                        size="sm"
                        onClick={() => setRejectRequest(req)}
                      >
                        <XCircle className="h-4 w-4 mr-1 text-muted-foreground" />{" "}
                        ปฏิเสธ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <AlertDialogContent className="rounded-3xl max-w-md p-6 sm:p-8 shadow-2xl border border-border/50 bg-card backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setPhoneInput("");
                setSelectedRequest(null);
                setIsPhoneModalOpen(false);
              }}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
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
                {selectedRequest?.theirAuthorName}
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
                onChange={(e) =>
                  setPhoneInput(e.target.value.replace(/\D/g, ""))
                }
                placeholder="8XXXXXXXX"
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
              onClick={() => {
                setPhoneInput("");
                setSelectedRequest(null);
              }}
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
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
        onOpenChange={(open) => !open && !isRejecting && setRejectRequest(null)}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm p-6 text-center shadow-xl">
          <AlertDialogTitle className="text-xl text-center">ยืนยันการปฏิเสธ</AlertDialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            คุณต้องการปฏิเสธคำขอแลกเปลี่ยนจาก <strong>{rejectRequest?.theirAuthorName}</strong> ใช่หรือไม่?
          </p>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-5 sm:space-x-0">
            <Button
              variant="outline"
              className="w-full sm:flex-1 rounded-2xl h-11 text-xs font-semibold border-border/60 bg-card text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-foreground transition-all mt-0 shadow-xs"
              onClick={() => setRejectRequest(null)}
              disabled={isRejecting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:flex-1 rounded-xl h-11 text-xs font-semibold"
              onClick={confirmReject}
              disabled={isRejecting}
            >
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              ยืนยันการปฏิเสธ
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={successModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessModal(prev => ({ ...prev, isOpen: false }));
            if (successModal.type === "accept" && successModal.exchangeId) {
              navigate(`/exchange-tracking/${successModal.exchangeId}`, {
                state: { newStatus: "accepted" },
              });
            }
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm p-6 text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <AlertDialogTitle className="text-xl text-center">{successModal.title}</AlertDialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {successModal.description}
          </p>
          <Button
            className="w-full rounded-xl mt-6 h-11 font-semibold"
            onClick={() => {
              setSuccessModal(prev => ({ ...prev, isOpen: false }));
              if (successModal.type === "accept" && successModal.exchangeId) {
                navigate(`/exchange-tracking/${successModal.exchangeId}`, {
                  state: { newStatus: "accepted" },
                });
              }
            }}
          >
            ตกลง
          </Button>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}