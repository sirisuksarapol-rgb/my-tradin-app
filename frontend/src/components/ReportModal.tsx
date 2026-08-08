import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createReport } from "@/api/api";
import { AlertTriangle, Loader2 } from "lucide-react";

// 1. กำหนด Props Interface สำหรับ Component
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "item" | "user";
  targetId: number | string;
  targetTitle?: string;
}

// 2. กำหนด Interface สำหรับข้อมูล User จาก LocalStorage
interface LocalUser {
  id?: string | number;
  MemberID?: string | number;
  UserID?: string | number;
  member_id?: string | number;
}

// 3. กำหนด Interface สำหรับ Response ที่ส่งคืนจาก API
interface ReportApiResponse {
  success?: boolean;
  ProblemID?: number;
  message?: string;
}

// 4. กำหนด Interface สำหรับการ Handle Catch Error จาก Axios / Server
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface ReasonOption {
  id: string;
  label: string;
}

const ITEM_REASONS: ReasonOption[] = [
  { id: "spam", label: "สแปม / โฆษณาซ้ำซ้อน" },
  { id: "fraud", label: "เข้าข่ายหลอกลวง / สินค้าเท็จ" },
  { id: "illegal", label: "สินค้าผิดกฎหมาย / ของต้องห้าม" },
  { id: "inappropriate", label: "ภาพหรือเนื้อหาไม่เหมาะสม" },
  { id: "other", label: "อื่น ๆ" },
];

const USER_REASONS: ReasonOption[] = [
  { id: "scam", label: "พฤติกรรมสุ่มเสี่ยงฉ้อโกง / โกงการแลกเปลี่ยน" },
  { id: "harassment", label: "ใช้วาจาไม่สุภาพ / คุกคาม" },
  { id: "fake_profile", label: "โปรไฟล์ปลอม / แอบอ้างผู้อื่น" },
  { id: "other", label: "อื่น ๆ" },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }: ReportModalProps) {
  const [reasonCategory, setReasonCategory] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const options = targetType === "item" ? ITEM_REASONS : USER_REASONS;

  const handleReport = async (): Promise<void> => {
    if (!reasonCategory) return;
    
    try {
      setIsLoading(true);
      const savedUser = localStorage.getItem("user");
      const user: LocalUser = savedUser ? JSON.parse(savedUser) : {};
      const reporterId = user.MemberID || user.member_id || user.id || user.UserID;

      if (!reporterId) {
        toast({ 
          title: "กรุณาเข้าสู่ระบบ", 
          description: "ต้องเข้าสู่ระบบก่อนทำการส่งรายงาน", 
          variant: "destructive" 
        });
        return;
      }

      const selectedOption = options.find((o) => o.id === reasonCategory);
      const problemType = targetType === "item" ? "รายงานโพสต์" : "รายงานผู้ใช้งาน";
      const fullMessage = `[หัวข้อ: ${selectedOption?.label}] ${details.trim()}`;

      const payload = {
        MemberID: Number(reporterId),
        ProblemType: problemType,
        HelpCenterData: fullMessage,
        ItemID: targetType === "item" ? Number(targetId) : null,
        ReportedMemberID: targetType === "user" ? Number(targetId) : null,
      };

      const res: ReportApiResponse = await createReport(payload);

      if (res && (res.success || res.ProblemID)) {
        toast({ 
          title: "ส่งรายงานสำเร็จ", 
          description: "ระบบได้รับข้อมูลแล้ว และจะดำเนินการตรวจสอบโดยเร็ว" 
        });
        setReasonCategory("");
        setDetails("");
        onClose();
      } else {
        throw new Error(res?.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error: unknown) {
      // ใช้ unknown + Type Assertion แทนการใช้ any
      const err = error as AxiosErrorResponse;
      const errorMessage = err.response?.data?.message || err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
      
      toast({
        title: "ส่งรายงานไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
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