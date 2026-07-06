import { useState, ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bug, Lightbulb, HelpCircle, Send, CheckCircle, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

// 🚀 นำเข้าฟังก์ชันจากไฟล์ api.js ส่วนกลางของคุณ
import { createReport } from "@/api/api";

// กำหนด Type ของประเภทปัญหาให้ชัดเจนแทนการใช้ string หว่านแห
type ProblemCategory = "bug" | "suggestion" | "other";

interface CategoryItem {
   value: ProblemCategory;
   label: string;
   icon: React.ComponentType<{ className?: string }>;
   color: string;
}

// โครงสร้างข้อมูลสมาชิกที่เก็บใน LocalStorage
interface LocalUser {
   id?: string | number;
   MemberID?: string | number;
   UserID?: string | number;
   user_id?: string | number;
}

// โครงสร้างข้อผิดพลาดที่ส่งมาจาก Axios / Backend
interface AxiosErrorResponse {
   response?: {
      data?: {
         message?: string;
      };
   };
   message?: string;
}

const categories: CategoryItem[] = [
   { value: "bug", label: "แจ้งปัญหาระบบ", icon: Bug, color: "text-destructive" },
   { value: "suggestion", label: "ข้อเสนอแนะ", icon: Lightbulb, color: "text-accent" },
   { value: "other", label: "อื่น ๆ", icon: HelpCircle, color: "text-primary" },
];

export default function HelpCenter() {
   const [category, setCategory] = useState<ProblemCategory>("bug");
   const [message, setMessage] = useState<string>("");
   const [submitted, setSubmitted] = useState<boolean>(false);
   const [isLoading, setIsLoading] = useState<boolean>(false);
   
   const { toast } = useToast();
   const navigate = useNavigate();

   const submit = async (): Promise<void> => {
      if (!message.trim()) return;
      
      try {
         setIsLoading(true);
         
         const savedUser = localStorage.getItem("user");
         const currentUser: LocalUser | null = savedUser ? JSON.parse(savedUser) : null;
         const memberId = currentUser?.id || currentUser?.MemberID || currentUser?.UserID || currentUser?.user_id;

         if (!memberId) {
             toast({ 
                 title: "เกิดข้อผิดพลาด", 
                 description: "กรุณาเข้าสู่ระบบก่อนทำการส่งรายงาน",
                 variant: "destructive"
             });
             return;
         }

         const payload = {
             MemberID: Number(memberId),
             ProblemType: category,
             HelpCenterData: message,
             ReportedMemberID: Number(memberId), 
             ItemID: null
         };

         const result = await createReport(payload);

         if (result && result.success) {
             setMessage("");
             setSubmitted(true);
             toast({ 
                 title: "ส่งข้อมูลเรียบร้อยแล้ว", 
                 description: "ทีมงานจะตรวจสอบข้อมูลของคุณเร็ว ๆ นี้" 
             });
             setTimeout(() => setSubmitted(false), 3000);
         } else {
             throw new Error(result?.message || "ไม่สามารถส่งข้อมูลได้");
         }

      } catch (error) {
         console.error("Error submitting report:", error);
         const err = error as AxiosErrorResponse;
         const errorMessage = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
         
         toast({ 
             title: "ส่งข้อมูลไม่สำเร็จ", 
             description: errorMessage,
             variant: "destructive"
         });
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <AppLayout>
         <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex items-center gap-2 mb-8">
               <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
               </Button>
               <FileText className="h-5 w-5 text-primary" />
               <h1 className="text-xl font-bold">ศูนย์ช่วยเหลือ</h1>
            </div>

            {/* Header */}
            <div className="text-center mb-10 space-y-3">
               <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <MessageCircle className="w-7 h-7 text-primary" />
               </div>
               <h1 className="text-3xl font-bold text-foreground tracking-tight">ศูนย์ช่วยเหลือ</h1>
               <p className="text-muted-foreground mt-2">แจ้งปัญหาหรือส่งข้อเสนอแนะ เราพร้อมรับฟังเสมอ</p>
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-3 gap-3 mb-6">
               {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.value;
                  return (
                     <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition-all duration-200 ${isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"}`}
                     >
                        <Icon className={`w-6 h-6 ${isActive ? cat.color : "text-muted-foreground"}`} />
                        <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{cat.label}</span>
                        {isActive && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                     </button>
                  );
               })}
            </div>

            {/* Form Card */}
            <Card className="border-border shadow-sm">
               <CardContent className="p-6 space-y-5">
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-2">รายละเอียด</label>
                     <textarea
                        className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-background"
                        placeholder="อธิบายปัญหาหรือข้อเสนอแนะของคุณ..."
                        value={message}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        disabled={isLoading}
                     />
                  </div>
                  <Button 
                     onClick={submit} 
                     disabled={!message.trim() || submitted || isLoading} 
                     className="w-full gap-2 eco-gradient text-primary-foreground transition-all" 
                     size="lg"
                  >
                     {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> กำลังส่งข้อมูล...</>
                     ) : submitted ? (
                        <><CheckCircle className="w-4 h-4" /> ส่งข้อมูลเรียบร้อย!</>
                     ) : (
                        <><Send className="w-4 h-4" /> ส่งข้อมูล</>
                     )}
                  </Button>
               </CardContent>
            </Card>
         </div>
      </AppLayout>
   );
}