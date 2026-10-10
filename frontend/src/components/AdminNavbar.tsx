
import { useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminNavbarProps {
  onLogout: () => void;
}

export function AdminNavbar({ onLogout }: AdminNavbarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-1 shadow-xs">
              <img
                src="/tradin-favicon-v2.png"
                alt="Tradin Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-extrabold tracking-tight text-foreground">
                Tradin
              </span>
              <span className="rounded-md border border-primary/20 bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Admin
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutConfirm(true)}
            className="h-9 gap-1.5 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 animate-in bg-background/80 backdrop-blur-md fade-in duration-200"
            onClick={() => setShowLogoutConfirm(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="relative w-full max-w-sm space-y-5 rounded-2xl border border-border/80 bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-inner">
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h3
                  id="logout-title"
                  className="text-base font-bold text-foreground"
                >
                  ยืนยันการออกจากระบบ?
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งาน
                </p>
              </div>
            </div>

            <div className="flex w-full gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="h-10 flex-1 rounded-xl text-xs font-bold hover:bg-muted"
              >
                ยกเลิก
              </Button>

              <Button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="h-10 flex-1 rounded-xl bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600 active:scale-95"
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