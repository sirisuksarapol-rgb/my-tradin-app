
import { useState, type ChangeEvent, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Bug, Lightbulb, HelpCircle, Send, CheckCircle, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { createReport } from "@/api/api";

type ProblemCategory = "bug" | "suggestion" | "other";

interface CategoryItem {
  value: ProblemCategory;
  label: string;
  sublabel: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

interface LocalUser {
  id?: string | number;
  MemberID?: string | number;
  UserID?: string | number;
  user_id?: string | number;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const categories: CategoryItem[] = [
  {
    value: "bug",
    label: "แจ้งปัญหาระบบ",
    sublabel: "ระบบทำงานผิดปกติ บั๊ก หรือแสดงผลผิดพลาด",
    icon: Bug,
    color: "text-destructive",
  },
  {
    value: "suggestion",
    label: "ข้อเสนอแนะ",
    sublabel: "เสนอไอเดียหรือฟีเจอร์ที่อยากให้มีเพิ่มเติม",
    icon: Lightbulb,
    color: "text-amber-500",
  },
  {
    value: "other",
    label: "สอบถามอื่น ๆ",
    sublabel: "ข้อสงสัยการใช้งาน หรือต้องการความช่วยเหลือทั่วไป",
    icon: HelpCircle,
    color: "text-primary",
  },
];

export default function HelpCenter() {
  const [category, setCategory] = useState<ProblemCategory>("bug");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async () => {
    const reportMessage = message.trim();

    if (!reportMessage || isLoading) return;

    try {
      setIsLoading(true);

      const savedUser = sessionStorage.getItem("user");
      const currentUser: LocalUser | null = savedUser
        ? JSON.parse(savedUser)
        : null;

      const memberId =
        currentUser?.id ||
        currentUser?.MemberID ||
        currentUser?.UserID ||
        currentUser?.user_id;

      if (!memberId) {
        toast({
          title: "เข้าสู่ระบบก่อนทำรายการ",
          description: "กรุณาเข้าสู่ระบบก่อนทำการส่งรายงานปัญหา",
          variant: "destructive",
        });
        return;
      }

      const result = await createReport({
        MemberID: Number(memberId),
        ProblemType: category,
        HelpCenterData: reportMessage,
        ReportedMemberID: null,
        ItemID: null,
      });

      if (!result || (!result.success && !result.ProblemID)) {
        throw new Error(result?.message || "ไม่สามารถส่งข้อมูลได้");
      }

      setMessage("");
      setSubmitted(true);

      toast({
        title: "ส่งข้อมูลเรียบร้อยแล้ว",
        description: "ทีมงานได้รับข้อมูลแล้ว และจะดำเนินการตรวจสอบให้เร็วที่สุด",
      });

      window.setTimeout(() => setSubmitted(false), 4000);
    } catch (error: unknown) {
      console.error("Error submitting report:", error);

      const err = error as AxiosErrorResponse;
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";

      toast({
        title: "ส่งข้อมูลไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>

          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">ศูนย์ช่วยเหลือ</h1>
        </div>

        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-2">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            เราพร้อมช่วยเหลือคุณ
          </h2>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            แจ้งปัญหาการใช้งาน หรือส่งข้อเสนอแนะเพื่อให้เราพัฒนาบริการให้ดียิ่งขึ้น
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.value;

            return (
              <button
                key={cat.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setCategory(cat.value)}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? cat.color : "text-muted-foreground"
                    }`}
                  />
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>

                <span
                  className={`font-semibold text-sm ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {cat.label}
                </span>

                <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {cat.sublabel}
                </span>
              </button>
            );
          })}
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="report-message"
                  className="text-sm font-medium text-foreground"
                >
                  รายละเอียดปัญหา / ข้อเสนอแนะ
                </label>

                <span className="text-xs text-muted-foreground">
                  {message.length}/1000
                </span>
              </div>

              <textarea
                id="report-message"
                className="w-full h-36 p-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none resize-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-background text-sm"
                placeholder="อธิบายรายละเอียด สิ่งที่เกิดขึ้น หรือขั้นตอนการพบปัญหาเพื่อให้ทีมงานตรวจสอบได้รวดเร็วขึ้น..."
                value={message}
                maxLength={1000}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setMessage(event.target.value)
                }
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={submit}
              disabled={!message.trim() || submitted || isLoading}
              className="w-full gap-2 text-primary-foreground transition-all rounded-xl"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังส่งข้อมูล...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ส่งข้อมูลเรียบร้อยแล้ว!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ส่งรายงาน
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}