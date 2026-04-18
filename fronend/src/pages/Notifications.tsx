import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, MessageSquare, ShieldCheck, Star, ArrowRightLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { mockNotifications } from "@/lib/notifications_data";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (!user || !user.id) return [];
    return mockNotifications.filter((n) => String(n.userId) === String(user.id));
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold">การแจ้งเตือน</h1>
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <Card key={n.id} className={`glass-card cursor-pointer hover:border-primary/40 transition-colors ${!n.read ? "border-primary/30" : ""}`} onClick={() => navigate(n.link)}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-medium" : "text-muted-foreground"}`}>{n.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />}
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
