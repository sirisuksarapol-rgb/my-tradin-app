import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Inbox,
  ArrowLeft,
  Eye,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";

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
  myPostTitle: string;
  myPostImage: string;
  theirPostTitle: string;
  theirPostImage: string;
  theirAuthorName: string;
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

  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const handleAccept = async (req: ExchangeRequest) => {
    try {
      const response = await axios.put<ApiResponse<null>>(
        `${API_BASE_URL}/${req.ExchangeID}`,
        { action: "accept" },
      );

      if (response.data.success) {
        toast({
          title: "ตอบรับคำขอแล้ว! 🎉",
          description: `ระบบกำลังพาคุณไปหน้าติดตามสถานะของ ${req.theirAuthorName || "ผู้ใช้งาน"}`,
        });

        const matchData = {
          id: req.ExchangeID,
          status: "accepted",
          myPost: { title: req.myPostTitle, images: [req.myPostImage] },
          theirPost: {
            title: req.theirPostTitle,
            images: [req.theirPostImage],
          },
        };

        setTimeout(() => {
          navigate(`/exchange-tracking/${req.ExchangeID}`, {
            state: { matchData },
          });
        }, 1000);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          axiosError.response?.data?.message || "ไม่สามารถตอบรับคำขอได้",
        variant: "destructive",
      });
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
                    <Badge className="bg-warning/10 text-warning border-0 text-xs">
                      คำขอใหม่
                    </Badge>
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
                        src={getImageUrl(req.theirPostImage)}
                        alt={req.theirPostTitle}
                        className="w-16 h-16 rounded-lg object-cover mx-auto bg-muted shadow-sm"
                        // ✅ แก้ไข: เพิ่ม onError handler เพื่อลดอาการกระพริบโดยใช้ placeholder
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
                        {req.theirPostTitle || "ไม่มีชื่อสิ่งของของเขา"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {req.theirAuthorName}
                      </p>
                    </div>

                    <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />

                    {/* ของของเรา (ผู้รับ) */}
                    <div className="flex-1 text-center space-y-1 min-w-0">
                      <img
                        src={getImageUrl(req.myPostImage)}
                        alt={req.myPostTitle}
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
                        {req.myPostTitle || "ไม่มีชื่อสิ่งของของเรา"}
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
    </AppLayout>
  );
}
