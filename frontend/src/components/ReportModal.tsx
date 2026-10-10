import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createReport } from "@/api/api";
import { Loader2, ArrowLeft, X } from "lucide-react";

// =========================================================================
// INTERFACES
// =========================================================================

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "item" | "user";
  targetId: number | string;
  targetTitle?: string;
}

interface LocalUser {
  id?: string | number;
  MemberID?: string | number;
  UserID?: string | number;
  member_id?: string | number;
}

interface ReportApiResponse {
  success?: boolean;
  ProblemID?: number;
  message?: string;
}

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

// =========================================================================
// CONSTANTS
// =========================================================================

const ITEM_REASONS: ReasonOption[] = [
  { id: "sex", label: "เนื้อหาเกี่ยวกับเรื่องเพศ" },
  { id: "violence", label: "เนื้อหารุนแรงหรือน่ารังเกียจ" },
  { id: "hate_speech", label: "เนื้อหาแสดงความเกลียดชังหรือการล่วงละเมิด" },
  { id: "harassment", label: "การคุกคามหรือการกลั่นแกล้ง" },
  { id: "dangerous", label: "การกระทำที่เสี่ยงอันตรายหรือเป็นภัย" },
  { id: "self_harm", label: "การฆ่าตัวตาย การทำร้ายตนเอง หรือการกินที่ผิดปกติ" },
  { id: "spam", label: "สแปม / โฆษณาซ้ำซ้อน" },
  { id: "fraud", label: "เข้าข่ายหลอกลวง / สินค้าเท็จ" },
  { id: "illegal", label: "สินค้าผิดกฎหมาย / ของต้องห้าม" },
  { id: "other", label: "อื่น ๆ" },
];

const USER_REASONS: ReasonOption[] = [
  { id: "scam", label: "พฤติกรรมสุ่มเสี่ยงฉ้อโกง / โกงการแลกเปลี่ยน" },
  { id: "harassment", label: "ใช้วาจาไม่สุภาพ / คุกคาม" },
  { id: "fake_profile", label: "โปรไฟล์ปลอม / แอบอ้างผู้อื่น" },
  { id: "other", label: "อื่น ๆ" },
];

// =========================================================================
// COMPONENT
// =========================================================================
export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  // จัดการขั้นตอน (1 = เลือกเหตุผล, 2 = กรอกรายละเอียดเพิ่มเติม)
  const [step, setStep] = useState<number>(1);
  const [reasonCategory, setReasonCategory] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const options = targetType === "item" ? ITEM_REASONS : USER_REASONS;

  // ฟังก์ชันสลับไปหน้ากรอกรายละเอียด
  const handleNextStep = () => {
    if (reasonCategory) {
      setStep(2);
    }
  };

  // ฟังก์ชันย้อนกลับไปหน้าเลือกเหตุผล
  const handleBackStep = () => {
    setStep(1);
  };

  const handleReport = async (): Promise<void> => {
    if (!reasonCategory) return;

    try {
      setIsLoading(true);
      const savedUser = localStorage.getItem("user");
      const user: LocalUser = savedUser ? JSON.parse(savedUser) : {};
      const reporterId =
        user.MemberID || user.member_id || user.id || user.UserID;

      if (!reporterId) {
        toast({
          title: "กรุณาเข้าสู่ระบบ",
          description: "ต้องเข้าสู่ระบบก่อนทำการส่งรายงาน",
          variant: "destructive",
        });
        return;
      }

      const selectedOption = options.find((o) => o.id === reasonCategory);
      const problemType =
        targetType === "item" ? "รายงานโพสต์" : "รายงานผู้ใช้งาน";
      
      // รวมข้อความรายละเอียด
      const detailText = details.trim() ? `\nรายละเอียด: ${details.trim()}` : "";
      const fullMessage = `[หัวข้อ: ${selectedOption?.label}]${detailText}`;

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
          description: "ระบบได้รับข้อมูลแล้ว และจะดำเนินการตรวจสอบโดยเร็ว",
        });

        // รีเซ็ตค่าหลังจากส่งเสร็จ
        setStep(1);
        setReasonCategory("");
        setDetails("");
        onClose();
      } else {
        throw new Error(res?.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error: unknown) {
      const err = error as AxiosErrorResponse;
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";

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
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          // คืนค่ากลับสู่สถานะเริ่มต้นเมื่อปิด
          setTimeout(() => {
            setStep(1);
            setReasonCategory("");
            setDetails("");
          }, 300);
        }
      }}
    >
      {/* ลบปุ่มปิด (X) อัตโนมัติออก เพื่อจัดการวาง Layout เอง */}
      <DialogContent className="sm:max-w-md p-0 overflow-hidden [&>button]:hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button 
                onClick={handleBackStep}
                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <DialogTitle className="text-lg font-bold">
              รายงาน
            </DialogTitle>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY - แสดงข้อมูลของสิ่งที่จะรีพอร์ต (ถ้ามี) */}
        {targetTitle && step === 1 && (
            <div className="px-6 pt-4">
               <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                รายงาน: <span className="font-semibold text-foreground">{targetTitle}</span>
              </div>
            </div>
        )}

        <div className="p-6 pt-4 pb-0 max-h-[60vh] overflow-y-auto">
          {/* STEP 1: เลือกเหตุผล */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold mb-2">เกิดอะไรขึ้น</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  เราจะตรวจสอบหลักเกณฑ์ของชุมชนทั้งหมด ดังนั้นคุณไม่ต้องกังวลว่าจะต้องเลือกข้อที่ถูกที่สุด
                </p>

                <RadioGroup
                  value={reasonCategory}
                  onValueChange={setReasonCategory}
                  className="space-y-0"
                >
                  {options.map((opt) => {
                    const isSelected = reasonCategory === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setReasonCategory(opt.id)}
                        className="flex items-center space-x-4 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 -mx-4 px-4 rounded-lg transition-colors"
                      >
                        <RadioGroupItem 
                          value={opt.id} 
                          id={opt.id} 
                          className={`w-6 h-6 border-2 ${isSelected ? 'border-black text-black dark:border-white dark:text-white' : 'border-gray-400'}`}
                        />
                        <Label
                          htmlFor={opt.id}
                          className="text-base cursor-pointer flex-1 font-normal"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* STEP 2: กรอกรายละเอียดเพิ่มเติม */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold mb-2 leading-tight">
                  มีรายละเอียดอื่นๆ ที่อยากจะบอกเราไหม โดยจะแจ้งให้เราทราบหรือไม่ก็ได้
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  การระบุรายละเอียดบางอย่างจะช่วยให้เราเข้าใจปัญหาได้ดีขึ้น โปรดอย่าใส่ข้อมูลส่วนบุคคลหรือคำถาม
                </p>

                <Textarea
                  placeholder="เพิ่มรายละเอียด..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="min-h-[200px] text-base resize-none p-4 rounded-xl focus-visible:ring-black dark:focus-visible:ring-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t mt-4">
          {step === 1 ? (
             <Button
             onClick={handleNextStep}
             disabled={!reasonCategory}
             className="w-full rounded-full h-12 text-base font-semibold bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
           >
             ถัดไป
           </Button>
          ) : (
            <Button
              onClick={handleReport}
              disabled={isLoading || (reasonCategory === "other" && !details.trim())}
              className="w-full rounded-full h-12 text-base font-semibold bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
              รายงาน
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}