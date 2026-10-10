
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

interface NotificationMessageData {
  sender_name?: string;
  SenderName?: string;
  sender_item?: string;
  SenderItemName?: string;
  my_item?: string;
  MyItemName?: string;
}

function renderExchangeMessage(
  prefix: string,
  sender: unknown,
  senderItem: unknown,
  myItem: unknown,
) {
  return (
    <span>
      {prefix}
      <strong className="text-foreground font-semibold">
        {String(sender ?? "")}
      </strong>{" "}
      ต้องการแลก{" "}
      <strong className="text-primary font-semibold">
        {String(senderItem ?? "")}
      </strong>{" "}
      กับ{" "}
      <strong className="text-orange-500 font-semibold">
        {String(myItem ?? "")}
      </strong>
    </span>
  );
}

function formatNotificationMessage(notification: NotificationItem) {
  const message = notification.Message || "";

  try {
    const data = JSON.parse(message) as NotificationMessageData;

    if (data && (data.sender_name || data.SenderName)) {
      return renderExchangeMessage(
        "คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก ",
        data.sender_name || data.SenderName,
        data.sender_item || data.SenderItemName,
        data.my_item || data.MyItemName,
      );
    }
  } catch {
    // ถ้าไม่ใช่ JSON จะตรวจสอบรูปแบบข้อความต่อไป
  }

  if (
    notification.SenderName &&
    notification.SenderItemName &&
    notification.MyItemName
  ) {
    return renderExchangeMessage(
      "คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก ",
      notification.SenderName,
      notification.SenderItemName,
      notification.MyItemName,
    );
  }

  const match = message.match(
    /^(.*?)จาก (.*?) ต้องการแลก (.*?) กับ (.*)$/,
  );

  if (match) {
    return renderExchangeMessage(
      `${match[1]}จาก `,
      match[2],
      match[3],
      match[4],
    );
  }

  return <span>{message}</span>;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();

        if (response?.success && Array.isArray(response.data)) {
          setNotifications(response.data);
        }
      } catch (error) {
        console.error("ดึงข้อมูลการแจ้งเตือนล้มเหลว:", error);
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationClick = async (
    notification: NotificationItem,
  ) => {
    const notificationId = notification.NotificationID;

    if (processingIds.has(notificationId)) return;

    try {
      if (notification.IsRead === 0) {
        setProcessingIds((prev) => new Set(prev).add(notificationId));

        await markNotificationAsRead(notificationId);

        setNotifications((prev) =>
          prev.map((item) =>
            item.NotificationID === notificationId
              ? { ...item, IsRead: 1 }
              : item,
          ),
        );

        window.dispatchEvent(new Event("notificationUpdate"));
      }
    } catch (error) {
      console.error("อัปเดตสถานะการอ่านล้มเหลว:", error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });

      if (notification.Link) {
        navigate(notification.Link);
      }
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          การแจ้งเตือน
        </h1>

        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isProcessing = processingIds.has(
                notification.NotificationID,
              );
              const isUnread = notification.IsRead === 0;

              return (
                <Card
                  key={notification.NotificationID}
                  role="button"
                  tabIndex={0}
                  className={`glass-card transition-all duration-200 shadow-sm ${
                    isProcessing
                      ? "opacity-70 cursor-not-allowed"
                      : "cursor-pointer hover:border-primary/40 hover:bg-muted/10"
                  } ${
                    isUnread && !isProcessing
                      ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
                      : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(event) => {
                    if (
                      (event.key === "Enter" || event.key === " ") &&
                      !isProcessing
                    ) {
                      event.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full shrink-0 ${
                        isUnread ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <ArrowRightLeft
                        className={`h-4 w-4 ${
                          isUnread
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm leading-relaxed ${
                          isUnread
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatNotificationMessage(notification)}
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatTime(notification.CreateDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 animate-pulse" />
                          )}
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