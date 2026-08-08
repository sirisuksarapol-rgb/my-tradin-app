import React, { useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png"; // Import โลโก้โปรเจกต์

interface AdminNavbarProps {
  onLogout: () => void;
}

export function AdminNavbar({ onLogout }: AdminNavbarProps) {
  // State สำหรับเปิด/ปิด Modal แจ้งเตือนการออกจากระบบ
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // ฟังก์ชันยืนยันออกจากระบบ
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 flex h-14 items-center justify-between">
          
          {/* 📌 ส่วนแสดงผล โลโก้ และ ชื่อระบบ */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 overflow-hidden p-1 border border-primary/20 shadow-xs">
              <img 
                src={logo} 
                alt="Tradin Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="leading-none flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-foreground tracking-tight">Tradin</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20 uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>

          {/* 📌 ปุ่มกดออกจากระบบ (กดแล้วจะเปิด Modal) */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLogoutConfirm(true)} 
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl px-3 h-9 transition-all gap-1.5 font-medium text-xs active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </Button>
        </div>
      </header>

      {/* 📌 Modal ยืนยันการออกจากระบบ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* พื้นหลังมืดจางแบบ Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
            onClick={() => setShowLogoutConfirm(false)} 
          />

          {/* การ์ดกล่องข้อความเตือน */}
          <div className="relative bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border/80 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground whitespace-nowrap">ยืนยันการออกจากระบบ?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งาน</p>
              </div>
            </div>

            {/* ปุ่มกดยืนยัน / ยกเลิก */}
            <div className="flex gap-2.5 w-full pt-1">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-10 text-xs font-bold whitespace-nowrap hover:bg-muted" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                ยกเลิก
              </Button>
              <Button 
                className="flex-1 rounded-xl h-10 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95" 
                onClick={handleConfirmLogout}
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}