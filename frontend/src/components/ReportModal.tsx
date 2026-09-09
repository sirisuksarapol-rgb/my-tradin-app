import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createReport } from "@/api/api";
import { AlertTriangle, Loader2 } from "lucide-react";

// =========================================================================
// INTERFACES: โครงสร้างข้อมูลสำหรับ TypeScript Type Safety
// =========================================================================

/**
 * กำหนดประเภทของ Props ที่จำเป็นสำหรับการควบคุมและส่งข้อมูลในคอมโพเนนต์ ReportModal
 */
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "item" | "user";
  targetId: number | string;
  targetTitle?: string;
}

/**
 * โครงสร้างข้อมูลผู้ใช้งานที่จัดเก็บใน LocalStorage เพื่อใช้ตรวจสอบยืนยันตัวตนของผู้แจ้งรายงาน
 */
interface LocalUser {
  id?: string | number;
  MemberID?: string | number;
  UserID?: string | number;
  member_id?: string | number;
}

/**
 * โครงสร้างข้อมูลผลลัพธ์ที่ได้รับจากการตอบกลับ (Response) ของ API สร้างรายงาน
 */
interface ReportApiResponse {
  success?: boolean;
  ProblemID?: number;
  message?: string;
}

/**
 * โครงสร้างข้อมูลสำหรับจัดการรูปแบบข้อผิดพลาด (Error Handling) จาก Axios หรือเซิร์ฟเวอร์
 */
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/**
 * โครงสร้างข้อมูลสำหรับตัวเลือกเหตุผลในการรายงานปัญหา
 */
interface ReasonOption {
  id: string;
  label: string;
}

// =========================================================================
// CONSTANTS: รายการตัวเลือกเหตุผลในการรายงานปัญหาแยกตามประเภทเป้าหมาย
// =========================================================================

/** รายการตัวเลือกเหตุผลสำหรับการรายงานโพสต์หรือสินค้าที่ไม่เหมาะสม */
const ITEM_REASONS: ReasonOption[] = [
  { id: "spam", label: "สแปม / โฆษณาซ้ำซ้อน" },
  { id: "fraud", label: "เข้าข่ายหลอกลวง / สินค้าเท็จ" },
  { id: "illegal", label: "สินค้าผิดกฎหมาย / ของต้องห้าม" },
  { id: "inappropriate", label: "ภาพหรือเนื้อหาไม่เหมาะสม" },
  { id: "other", label: "อื่น ๆ" },
];

/** รายการตัวเลือกเหตุผลสำหรับการรายงานพฤติกรรมของผู้ใช้งาน */
const USER_REASONS: ReasonOption[] = [
  { id: "scam", label: "พฤติกรรมสุ่มเสี่ยงฉ้อโกง / โกงการแลกเปลี่ยน" },
  { id: "harassment", label: "ใช้วาจาไม่สุภาพ / คุกคาม" },
  { id: "fake_profile", label: "โปรไฟล์ปลอม / แอบอ้างผู้อื่น" },
  { id: "other", label: "อื่น ๆ" },
];

// =========================================================================
// COMPONENT: ReportModal (หน้าต่าง Dialog สำหรับส่งรายงานปัญหาและข้อเสนอแนะ)
// =========================================================================
export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }: ReportModalProps) {
  
  // สถานะเก็บหมวดหมู่เหตุผลที่ผู้ใช้งานเลือกจากตัวเลือก Radio Group
  const [reasonCategory, setReasonCategory] = useState<string>("");
  
  // สถานะเก็บข้อความรายละเอียดเพิ่มเติมที่ผู้ใช้งานกรอกเพิ่มเติม
  const [details, setDetails] = useState<string>("");
  
  // สถานะควบคุมการแสดงผล Loading State (ไอคอนหมุน) ในปุ่มขณะระบบกำลังประมวลผลส่งข้อมูล
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // เรียกใช้งาน Toast Hook สำหรับแสดงการแจ้งเตือนผลลัพธ์แบบ Popup ให้ผู้ใช้ทราบ
  const { toast } = useToast();

  // กำหนดชุดตัวเลือกเหตุผลโดยอัตโนมัติตาม targetType (สินค้าหรือผู้ใช้)
  const options = targetType === "item" ? ITEM_REASONS : USER_REASONS;

  // =====================================================================
  // ฟังก์ชัน: จัดการกระบวนการตรวจสอบข้อมูลและส่งคำขอรายงานไปยัง API (HANDLE REPORT)
  // =====================================================================
  const handleReport = async (): Promise<void> => {
    // ตรวจสอบความสมบูรณ์: หากยังไม่ได้เลือกหมวดหมู่เหตุผล ให้ยุติการทำงานทันที
    if (!reasonCategory) return;
    
    try {
      // เริ่มต้นเปิดสถานะกำลังโหลดเพื่อป้องกันการกดซ้ำและแสดงสถานะให้ผู้ใช้เห็น
      setIsLoading(true);
      
      // ดึงข้อมูลบัญชีผู้ใช้งานปัจจุบันที่จัดเก็บไว้ใน LocalStorage
      const savedUser = localStorage.getItem("user");
      const user: LocalUser = savedUser ? JSON.parse(savedUser) : {};
      
      // ค้นหารหัสประจำตัวผู้ใช้ผ่านคีย์รูปแบบต่าง ๆ เพื่อความยืดหยุ่นสูงสุด
      const reporterId = user.MemberID || user.member_id || user.id || user.UserID;

      // ตรวจสอบสิทธิ์: หากไม่พบรหัสผู้ใช้งาน ให้แจ้งเตือนปฏิเสธการทำงานและบังคับเข้าสู่ระบบ
      if (!reporterId) {
        toast({ 
          title: "กรุณาเข้าสู่ระบบ", 
          description: "ต้องเข้าสู่ระบบก่อนทำการส่งรายงาน", 
          variant: "destructive" 
        });
        return;
      }

      // ค้นหาข้อความป้ายกำกับของเหตุผลที่ผู้ใช้เลือก
      const selectedOption = options.find((o) => o.id === reasonCategory);
      
      // กำหนดประเภทปัญหาเชิงโครงสร้างตาม targetType
      const problemType = targetType === "item" ? "รายงานโพสต์" : "รายงานผู้ใช้งาน";
      
      // รวมข้อความหัวข้อหมวดหมู่และรายละเอียดเพิ่มเติมให้เป็นข้อความสมบูรณ์ชุดเดียว
      const fullMessage = `[หัวข้อ: ${selectedOption?.label}] ${details.trim()}`;

      // จัดเตรียมโครงสร้างข้อมูล (Payload) สำหรับส่งไปยัง Backend API
      const payload = {
        MemberID: Number(reporterId),
        ProblemType: problemType,
        HelpCenterData: fullMessage,
        ItemID: targetType === "item" ? Number(targetId) : null,
        ReportedMemberID: targetType === "user" ? Number(targetId) : null,
      };

      // เรียกใช้งานฟังก์ชัน API เพื่อบันทึกข้อมูลรายงานปัญหาลงในฐานข้อมูล
      const res: ReportApiResponse = await createReport(payload);

      // ตรวจสอบผลลัพธ์การตอบกลับจากเซิร์ฟเวอร์ว่าสำเร็จหรือไม่
      if (res && (res.success || res.ProblemID)) {
        toast({ 
          title: "ส่งรายงานสำเร็จ", 
          description: "ระบบได้รับข้อมูลแล้ว และจะดำเนินการตรวจสอบโดยเร็ว" 
        });
        
        // ล้างค่าสถานะฟอร์มทั้งหมดและปิดหน้าต่าง Dialog เมื่อส่งข้อมูลสำเร็จ
        setReasonCategory("");
        setDetails("");
        onClose();
      } else {
        throw new Error(res?.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error: unknown) {
      // ดักจับข้อผิดพลาด (Error Handling) และแปลงประเภทข้อมูลเพื่อดึงข้อความแจ้งเตือนที่ชัดเจน
      const err = error as AxiosErrorResponse;
      const errorMessage = err.response?.data?.message || err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
      
      // แสดงข้อความแจ้งเตือนความผิดพลาดผ่าน Toast Notification
      toast({
        title: "ส่งรายงานไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // ปิดสถานะการโหลดเสมอไม่ว่าการทำงานจะสำเร็จหรือเกิดข้อผิดพลาด
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {targetType === "item" ? "รายงานโพสต์ที่ไม่เหมาะสม" : "รายงานผู้ใช้งาน"}
          </DialogTitle>
          {targetTitle && (
            <div className="p-2.5 mt-2 bg-muted/60 rounded-lg border border-border/50 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{targetTitle}</span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              เลือกเหตุผลในการรายงาน <span className="text-destructive">*</span>
            </label>
            <RadioGroup value={reasonCategory} onValueChange={setReasonCategory} className="space-y-2">
              {options.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2 border p-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  <Label htmlFor={opt.id} className="text-sm cursor-pointer flex-1">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              รายละเอียดเพิ่มเติม {reasonCategory === "other" && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม หรือเหตุการณ์ที่เกิดขึ้น..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[90px] text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleReport}
            disabled={!reasonCategory || (reasonCategory === "other" && !details.trim()) || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            ส่งรายงาน
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}