import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// =========================================================================
// INTERFACE: โครงสร้างข้อมูลสำหรับกำหนดประเภทของ Props ในคอมโพเนนต์ StatCard
// =========================================================================
interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass: string;
}

// =========================================================================
// COMPONENT: StatCard (การ์ดแสดงผลสถิติเชิงตัวเลขพร้อมไอคอนและแนวโน้ม)
// =========================================================================
export function StatCard({ value, label, icon, trend, colorClass }: StatCardProps) {
  return (
    // โครงสร้างการ์ดหลัก พร้อมเอฟเฟกต์เงาและการเปลี่ยนผ่านอย่างราบรื่นเมื่อชี้เมาส์ (Hover Effect)
    <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          
          {/* ส่วนแสดงข้อความหัวข้อ ตัวเลขสถิติ และข้อมูลแนวโน้ม */}
          <div className="space-y-1">
            {/* แสดงป้ายชื่อหัวข้อสถิติ */}
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            
            {/* แสดงค่าตัวเลขสถิติ พร้อมจัดรูปแบบตัวเลขคั่นหลักพันด้วย toLocaleString() */}
            <p className="text-2xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
            
            {/* แสดงข้อความแสดงแนวโน้ม (Trend) เฉพาะเมื่อมีการส่งค่า trend เข้ามา */}
            {trend && (
              <p className="text-xs text-success font-medium">{trend}</p>
            )}
          </div>

          {/* ส่วนแสดงกล่องไอคอน พร้อมปรับแต่งสีพื้นหลังและสีไอคอนด้วย utility function cn และ colorClass */}
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", colorClass)}>
            {icon}
          </div>
        </div>
      </CardContent>

      {/* แถบเส้นขอบตกแต่งด้านล่างของการ์ด ที่จะปรากฏขึ้นเมื่อผู้ใช้นำเมาส์มาวาง (Group Hover State) */}
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300", colorClass)} />
    </Card>
  );
}