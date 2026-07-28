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

  // ของเรา (ผู้รับคำขอ)
  myPostTitle?: string;
  my_post_title?: string;
  TargetItemName?: string;
  target_item_name?: string;

  myPostImage?: string;
  my_post_image?: string;
  TargetItemImage?: string;
  target_item_image?: string;

  // ของเขา (ผู้ส่งคำขอ)
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

  // 🌟 State ควบคุมหน้าต่างกรอกเบอร์โทรศัพท์
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<ExchangeRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. ดึง ID รายการที่เคยเปิดดูแล้วจาก localStorage
  const [seenIds, setSeenIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("seen_exchange_ids");
    return saved ? JSON.parse(saved) : [];
  });

  // 2. ฟังก์ชันคำนวณจำนวนวัน (วันนี้ / X วันที่แล้ว)
  const getRequestAgeText = (startDateStr: string | null): string => {
    if (!startDateStr) return "เมื่อเร็วๆ นี้";

    const createdDate = new Date(startDateStr);
    const now = new Date();

    // ปรับเป็นระดับวันที่ (ตัดเวลา HH:mm:ss ออกเพื่อเปรียบเทียบข้ามวัน)
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

  const savedUser = localStorage.getItem("user");
  const user: LoggedInUser | null = savedUser ? JSON.parse(savedUser) : null;

  const fetchIncomingRequests = async () => {
    const currentUserId = user?.id || user?.MemberID;

    if (!currentUserId) {
      console.error("ไม่พบข้อมูล User ID หรือ MemberID ใน localStorage:", user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("📡 กำลังดึงข้อมูลสำหรับ User ID:", currentUserId);

      const response = await axios.get<ApiResponse<ExchangeRequest[]>>(
        `${API_BASE_URL}?member_id=${currentUserId}`,
      );

      if (response.data.success) {
        console.log("📦 ข้อมูลดิบจาก Backend:", response.data.data);
        const dataList = response.data.data || [];

        const incoming = dataList.filter(
          (req) =>
            req.ExchangeStatus === "pending" &&
            String(req.TargetMemberID) === String(currentUserId),
        );

        console.log("🎯 ข้อมูลคำขอเข้าที่กรองเสร็จแล้ว:", incoming);
        setRequests(incoming);

        // 🌟 ส่วนที่เพิ่มเข้ามา: บันทึก ExchangeID ทั้งหมดลง localStorage
        // เพื่อให้ระบบรู้ว่า "เคยเห็นคำขอเหล่านี้แล้ว" ในการเปิดดูครั้งถัดไป
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

  // 🌟 ฟังก์ชันนี้แค่เปิด Modal ขึ้นมาเฉยๆ ยังไม่ยิง API
  const handleAccept = (req: ExchangeRequest) => {
    setSelectedRequest(req);
    setPhoneInput("");
    setIsPhoneModalOpen(true);
  };

  // 🌟 ฟังก์ชันนี้จะทำงานเมื่อกด "ยืนยัน" ใน Modal
  const confirmAccept = async () => {
    if (!selectedRequest) return;

    // ตรวจสอบว่ากรอกเบอร์หรือยัง
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
        toast({
          title: "ตอบรับคำขอแล้ว! 🎉",
          description: "กำลังส่งรหัส OTP ให้คุณและคู่แลกเปลี่ยน...",
        });

        // ยิง OTP ให้ทั้ง 2 ฝ่าย
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

        const matchData = {
          id: req.ExchangeID,
          status: "accepted",
          myPost: { title: req.myPostTitle, images: [req.myPostImage] },
          theirPost: {
            title: req.theirPostTitle,
            images: [req.theirPostImage],
          },
        };

        // ปิด Modal และพาไปหน้า Tracking
        setIsPhoneModalOpen(false);
        setTimeout(() => {
          // 🌟 เปลี่ยนชื่อคีย์ state เป็น newStatus หน้า Tracking ถึงจะรู้ตัวและอัปเดตสถานะให้ทันที
          navigate(`/exchange-tracking/${req.ExchangeID}`, {
            state: { newStatus: "accepted" },
          });
        }, 1500);
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

  const handleReject = async (req: ExchangeRequest) => {
    try {
      const response = await axios.put<ApiResponse<null>>(
        `${API_BASE_URL}/${req.ExchangeID}`,
        { action: "reject" },
      );

      if (response.data.success) {
        setRequests((prev) =>
          prev.filter((item) => item.ExchangeID !== req.ExchangeID),
        );

        toast({
          title: "ปฏิเสธคำขอแล้ว",
          description: `แจ้งผลไปยัง ${req.theirAuthorName || "ผู้ใช้งาน"} เรียบร้อย`,
          variant: "destructive",
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
    }
  };

  // 💡 ปรับปรุงฟังก์ชัน `getImageUrl` ให้ล้าง path และเพิ่ม onError handler ที่ดีขึ้น
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (
      !imagePath ||
      imagePath.trim() === "undefined" ||
      imagePath === "null" ||
      imagePath === "/placeholder.jpg"
    )
      return "/placeholder.jpg";
    if (imagePath.startsWith("http")) return imagePath;

    // คลีน path จากวงเล็บเหลี่ยมและเครื่องหมายคำพูด (cite syntax)
    let cleanPath = imagePath.trim().replace(/\|"|'/g, "");
    cleanPath = cleanPath.split(",")[0]; // เลือกรูปแรกกรณี Joint มาหลายรูป

    return `${IMAGE_BASE_URL}${cleanPath}`;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
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
                    {/* เช็กว่าถ้ายังไม่เคยเห็น ID นี้มาก่อน ให้ขึ้นป้าย "คำขอใหม่" */}
                    {!seenIds.includes(req.ExchangeID) ? (
                      <Badge className="bg-warning/10 text-warning border-0 text-xs font-medium">
                        คำขอใหม่
                      </Badge>
                    ) : (
                      /* ถ้าเคยเปิดเข้ามาดูแล้ว ให้เปลี่ยนเป็น "วันนี้" หรือ "X วันที่แล้ว" */
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
                    {/* ของของเขา (ผู้ส่ง) */}
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

                    {/* ของของเรา (ผู้รับ) */}
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
                    {/* ✅ แก้ไข: เปลี่ยน ID สินค้าเป็น MyItemID เพื่อดูรายละเอียดสินค้าของคนอื่น (ผู้ส่ง) */}
                    {/* บรรทัดที่ประมาณ 185: ปรับปรุงโค้ดปุ่มดูรายละเอียดเพื่อแนบ state ข้ามหน้า */}
                    <Button
                      variant="secondary"
                      className="w-full text-xs h-8"
                      onClick={() =>
                        navigate(`/post/${req.MyItemID}`, {
                          state: {
                            fromPage: "incoming", // แจ้งหน้าปลายทางว่ามาจากหน้า incoming
                            fromIncomingRequest: true, // แนบเผื่อไว้สำหรับตัวแปรเช็กคีย์อื่นๆ
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
                        className="flex-1"
                        size="sm"
                        onClick={() => handleReject(req)}
                      >
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
      {/* 🌟 Modal สำหรับกรอกเบอร์โทรศัพท์ */}
      <AlertDialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">
              ระบุข้อมูลการติดต่อ
            </AlertDialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-2">
              กรุณากรอกเบอร์โทรศัพท์ของคุณเพื่อใช้ในการติดต่อกับ{" "}
              <strong>{selectedRequest?.theirAuthorName}</strong>
            </p>
          </AlertDialogHeader>

          <div className="my-4">
            <input
              type="tel"
              maxLength={10}
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
              placeholder="08X-XXX-XXXX"
              className="w-full text-center tracking-widest font-bold text-xl h-14 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background shadow-inner transition-all"
            />
          </div>

          <AlertDialogFooter className="flex flex-row gap-3 mt-2">
            <AlertDialogCancel
              className="flex-1 mt-0 rounded-xl h-12"
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
              className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  กำลังบันทึก...
                </>
              ) : (
                "ยืนยันการตอบรับ"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
