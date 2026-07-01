import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowRightLeft, ChevronRight } from "lucide-react";
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
  
  // พร็อพเพอร์ตี้เสริมสำหรับรองรับโครงสร้าง Object ในอนาคต
  SenderName?: string;         
  SenderItemName?: string;     
  MyItemName?: string;         
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // 1. ดึงข้อมูลการแจ้งเตือนจาก API ทันทีเมื่อเปิดหน้าจอ
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

  // 2. ฟังก์ชันจัดการเมื่อผู้ใช้งานคลิกเลือกที่กล่องการแจ้งเตือน
  const handleNotificationClick = async (e: React.MouseEvent, clickedNotif: NotificationItem) => {
    e.stopPropagation();

    try {
      // ถ้าการแจ้งเตือนนี้ยังไม่ได้อ่าน (IsRead === 0) ให้ส่งคำขออัปเดตไปที่ฝั่งหลังบ้าน
      if (clickedNotif.IsRead === 0) {
        await markNotificationAsRead(clickedNotif.NotificationID);
        
        // ปรับสถานะใน State หน้าบ้านทันที เพื่อลบจุดส้มออก (โดยที่กล่องแจ้งเตือนไม่หายไป)
        setNotifications((prev) =>
          prev.map((n) =>
            n.NotificationID === clickedNotif.NotificationID ? { ...n, IsRead: 1 } : n
          )
        );

        // ยิง Event เพื่อรีเฟรชและลดตัวเลข Badge บนกระดิ่งแจ้งเตือนที่ Navbar แถวบน
        window.dispatchEvent(new Event("notificationUpdate"));
      }
    } catch (error) {
      console.error("อัปเดตสถานะการอ่านล้มเหลว:", error);
    } finally {
      // เปลี่ยนเส้นทางหน้าจอไปยังลิงก์ปลายทางที่แนบมากับแจ้งเตือนนั้นทันที
      if (clickedNotif.Link) {
        navigate(clickedNotif.Link);
      }
    }
  };

  // 3. ฟังก์ชันแปลงและจัดฟอร์แมตข้อความแจ้งเตือนให้เป็นตัวหนาในจุดสำคัญ
  const formatNotificationMessage = (n: NotificationItem) => {
    // 💡 กรณีที่ 1: ตรวจสอบข้อมูลหากหลังบ้านส่งมาในรูปแบบโครงสร้าง JSON string
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
      // หากไม่ใช่โครงสร้าง JSON ให้ปล่อยผ่านไปทำงานในเงื่อนไขถัดไป
    }

    // 💡 กรณีที่ 2: รองรับหากหลังบ้านแนบ Properties แยกมากับอ็อบเจกต์ตรง ๆ
    if (n.SenderName && n.SenderItemName && n.MyItemName) {
      return (
        <span>
          คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก <strong className="text-foreground font-semibold">{n.SenderName}</strong> ต้องการแลก <strong className="text-primary font-semibold">{n.SenderItemName}</strong> กับ <strong className="text-orange-500 font-semibold">{n.MyItemName}</strong>
        </span>
      );
    }

    // 💡 กรณีที่ 3: ตรวจจับและแยกคำจากข้อความยาวปกติของหลังบ้าน เพื่อเน้นตัวหนาให้สวยงามยิ่งขึ้น
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
        // ป้องกันกรณีแบ่งคำล้มเหลว ให้กลับไปใช้ข้อความดิบ
      }
    }

    // กรณีข้อความระบบทั่วไป ให้ส่งค่ากลับไปแสดงผลตรง ๆ
    return <span>{n.Message}</span>;
  };

  // ฟังก์ชันจัดรูปแบบการแสดงผลวันที่และเวลาภาษาไทย
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
              return (
                <Card 
                  key={n.NotificationID} 
                  className={`glass-card cursor-pointer hover:border-primary/40 hover:bg-muted/10 transition-all duration-200 shadow-sm ${
                    n.IsRead === 0 ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : ""
                  }`} 
                  onClick={(e) => handleNotificationClick(e, n)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    {/* ไอคอนสัญลักษณ์ประเภทแจ้งเตือนการแลกเปลี่ยน */}
                    <div className={`p-2 rounded-full shrink-0 ${n.IsRead === 0 ? "bg-primary/10" : "bg-muted"}`}>
                      <ArrowRightLeft className={`h-4 w-4 ${n.IsRead === 0 ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    
                    {/* บล็อกเนื้อหาข้อความรายละเอียดผู้เสนอและสิ่งของ */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm leading-relaxed ${n.IsRead === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {formatNotificationMessage(n)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(n.CreateDate)}
                      </p>
                    </div>

                    {/* สัญลักษณ์สถานะฝั่งขวา: จุดกะพริบสีส้ม (เมื่อยังไม่ได้อ่าน) และลูกศรนำทาง */}
                    <div className="flex items-center gap-2 shrink-0">
                      {n.IsRead === 0 && <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 animate-pulse" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60" />
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