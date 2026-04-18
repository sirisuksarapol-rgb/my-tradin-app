import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminNavbarProps {
  onLogout: () => void;
}

export function AdminNavbar({ onLogout }: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="leading-none">
            <span className="font-semibold text-sm text-foreground">Tradin</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-medium">Admin</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-destructive gap-1.5">
          <LogOut className="w-3.5 h-3.5" />
          ออกจากระบบ
        </Button>
      </div>
    </header>
  );
}
