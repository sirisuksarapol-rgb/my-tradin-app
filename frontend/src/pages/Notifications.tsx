import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowRightLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { getNotifications, markNotificationAsRead } from "@/api/api"; 

interface NotificationItem {
  NotificationID: number;
  MemberID: number;
  Message: string;
  Link: string;
  IsRead: number;
  CreateDate: string;
  SenderName?: string;         
  SenderItemName?: string;     
  MyItemName?: string;         
}

// =========================================================================
// COMPONENT: Notifications (หน้าจอสำหรับแสดงและจัดการรายการแจ้งเตือนของผู้ใช้งาน)
// =========================================================================
export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  
  /**
   * ฟังก์ชัน: useEffect สำหรับดึงข้อมูลรายการแจ้งเตือนทั้งหมดจาก API ทันทีเมื่อหน้าจอถูกโหลดขึ้นมาครั้งแรก (Mounting)
   */
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await getNotifications();
        if (res && res.success) {
          setNotifications(res.data);
        }
      } catch (error) {
        console.error("ดึงข้อมูลการแจ้งเตือนล้มเหลว:", error);
      }
    };
    fetchNotifs();
  }, []);

  /**
   * ฟังก์ชัน: handleNotificationClick
   * มีไว้สำหรับ: จัดการเหตุการณ์เมื่อผู้ใช้งานคลิกเลือกรายการแจ้งเตือน ป้องกันการกดซ้ำซ้อนขณะระบบกำลังประมวลผล 
   * ทำการบันทึกสถานะการอ่านลงในระบบ อัปเดตสถานะบนหน้าจอ ส่งอีเวนต์แจ้งเตือนการอัปเดต และนำทางไปยังลิงก์ปลายทาง
   */
  const handleNotificationClick = async (e: React.MouseEvent, clickedNotif: NotificationItem) => {
    e.stopPropagation();
    
    if (processingIds.has(clickedNotif.NotificationID)) return;
    
    try {
      if (clickedNotif.IsRead === 0) {
        setProcessingIds((prev) => new Set(prev).add(clickedNotif.NotificationID));

        await markNotificationAsRead(clickedNotif.NotificationID);
        
        setNotifications((prev) =>
          prev.map((n) =>
            n.NotificationID === clickedNotif.NotificationID ? { ...n, IsRead: 1 } : n
          )
        );

        window.dispatchEvent(new Event("notificationUpdate"));
      }
    } catch (error) {
      console.error("อัปเดตสถานะการอ่านล้มเหลว:", error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(clickedNotif.NotificationID);
        return newSet;
      });

      if (clickedNotif.Link) {
        navigate(clickedNotif.Link);
      }
    }
  };

  /**
   * ฟังก์ชัน: formatNotificationMessage
   * มีไว้สำหรับ: แปลงและจัดรูปแบบข้อความแจ้งเตือนที่รับมาในรูปแบบ JSON หรือสตริงเทมเพลต 
   * ให้แสดงผลเป็นองค์ประกอบ HTML พร้อมเน้นตัวหนาและสีข้อความในส่วนสำคัญ เช่น ชื่อผู้ส่ง ชื่อสิ่งของที่ต้องการแลก
   */
  const formatNotificationMessage = (n: NotificationItem) => {
    try {
      const jsonData = JSON.parse(n.Message);
      if (jsonData.sender_name || jsonData.SenderName) {
        const sender = jsonData.sender_name || jsonData.SenderName;
        const sItem = jsonData.sender_item || jsonData.SenderItemName;
        const myItem = jsonData.my_item || jsonData.MyItemName;
        return (
          <span>
            คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก <strong className="text-foreground font-semibold">{sender}</strong> ต้องการแลก <strong className="text-primary font-semibold">{sItem}</strong> กับ <strong className="text-orange-500 font-semibold">{myItem}</strong>
          </span>
        );
      }
    } catch (e) {
      // ปล่อยผ่านไปทำงานในเงื่อนไขถัดไป
    }

    if (n.SenderName && n.SenderItemName && n.MyItemName) {
      return (
        <span>
          คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก <strong className="text-foreground font-semibold">{n.SenderName}</strong> ต้องการแลก <strong className="text-primary font-semibold">{n.SenderItemName}</strong> กับ <strong className="text-orange-500 font-semibold">{n.MyItemName}</strong>
        </span>
      );
    }

    const msg = n.Message;
    if (msg && msg.includes("จาก") && msg.includes("ต้องการแลก") && msg.includes("กับ")) {
      try {
        const part1 = msg.split("จาก ");
        const mainTitle = part1[0]; 
        
        const part2 = part1[1].split(" ต้องการแลก ");
        const senderName = part2[0];
        
        const part3 = part2[1].split(" กับ ");
        const senderItem = part3[0];
        const myItem = part3[1];

        return (
          <span>
            {mainTitle}จาก <strong className="text-foreground font-bold">{senderName}</strong> ต้องการแลก <strong className="text-primary font-bold">{senderItem}</strong> กับ <strong className="text-orange-500 font-bold">{myItem}</strong>
          </span>
        );
      } catch (err) {
        // ป้องกันกรณีแบ่งคำล้มเหลว
      }
    }

    return <span>{n.Message}</span>;
  };

  /**
   * ฟังก์ชัน: formatTime
   * มีไว้สำหรับ: แปลงสตริงวันที่และเวลาให้อยู่ในรูปแบบมาตรฐานภาษาไทยที่อ่านง่าย (วัน เดือน ปี และเวลา ชั่วโมง:นาที)
   */
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">การแจ้งเตือน</h1>
        
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isProcessing = processingIds.has(n.NotificationID);

              return (
                <Card 
                  key={n.NotificationID} 
                  className={`glass-card transition-all duration-200 shadow-sm ${
                    isProcessing ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-primary/40 hover:bg-muted/10"
                  } ${
                    n.IsRead === 0 && !isProcessing ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : ""
                  }`} 
                  onClick={(e) => handleNotificationClick(e, n)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${n.IsRead === 0 ? "bg-primary/10" : "bg-muted"}`}>
                      <ArrowRightLeft className={`h-4 w-4 ${n.IsRead === 0 ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm leading-relaxed ${n.IsRead === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {formatNotificationMessage(n)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(n.CreateDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <>
                          {n.IsRead === 0 && <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 animate-pulse" />}
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60" />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}