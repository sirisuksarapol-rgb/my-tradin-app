import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bug, Lightbulb, HelpCircle, Send, CheckCircle, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const categories = [
   { value: "bug", label: "แจ้งปัญหาระบบ", icon: Bug, color: "text-destructive" },
   { value: "suggestion", label: "ข้อเสนอแนะ", icon: Lightbulb, color: "text-accent" },
   { value: "other", label: "อื่น ๆ", icon: HelpCircle, color: "text-primary" },
];

export default function HelpCenter() {
   const [category, setCategory] = useState("bug");
   const [message, setMessage] = useState("");
   const [submitted, setSubmitted] = useState(false);
   const { toast } = useToast();
   const navigate = useNavigate();

   const submit = () => {
      if (!message.trim()) return;
      const feedback = {
         id: Date.now().toString(),
         category,
         description: message,
         status: "pending",
         createdAt: new Date().toLocaleDateString(),
      };
      const list = JSON.parse(localStorage.getItem("feedbacks") || "[]");
      list.push(feedback);
      localStorage.setItem("feedbacks", JSON.stringify(list));
      setMessage("");
      setSubmitted(true);
      toast({ title: "ส่งข้อมูลเรียบร้อยแล้ว", description: "ทีมงานจะตรวจสอบข้อมูลของคุณเร็ว ๆ นี้" });
      setTimeout(() => setSubmitted(false), 3000);
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
                        onChange={(e) => setMessage(e.target.value)}
                     />
                  </div>
                  <Button onClick={submit} disabled={!message.trim() || submitted} className="w-full gap-2 eco-gradient text-primary-foreground" size="lg">
                     {submitted ? (<><CheckCircle className="w-4 h-4" /> ส่งข้อมูลเรียบร้อย!</>) : (<><Send className="w-4 h-4" /> ส่งข้อมูล</>)}
                  </Button>
               </CardContent>
            </Card>
         </div>
      </AppLayout>
   );
}
