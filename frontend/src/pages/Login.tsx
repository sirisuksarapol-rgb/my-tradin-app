import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Sparkles, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo.png";
import promoImage from "@/assets/people-meeting-barter-event-exchange-goods.jpg";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { login as loginApi } from "@/api/api";

interface UserFormData {
  email: string;
  password: string;
}

interface SuspendData {
  reason: string;
  until: string;
}

export default function Login() {
  const navigate = useNavigate(); 
  const { toast } = useToast(); 

  const [formData, setFormData] = useState<UserFormData>({ email: "", password: "" }); 
  const [errors, setErrors] = useState<Partial<UserFormData>>({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [suspendData, setSuspendData] = useState<SuspendData | null>(null);

  const updateField = (field: keyof UserFormData, value: string) => { 
    setFormData((prev) => ({ ...prev, [field]: value })); 
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" })); 
  };

  const validateForm = () => { 
    const newErrors: Partial<UserFormData> = {}; 
    if (!formData.email.includes("@")) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง"; 
    if (formData.password.length < 8) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"; 
    setErrors(newErrors); 
    return Object.keys(newErrors).length === 0; 
  };

  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!validateForm()) return; 
    setIsLoading(true);
    setSuspendData(null); 

    try {
      const response = await loginApi(formData); 
      if (response.data.success) { 
        sessionStorage.setItem("user", JSON.stringify(response.data.user)); 
        sessionStorage.setItem("token", response.data.token); 
        sessionStorage.setItem("role", response.data.role); 

        if (response.data.role === "admin") { 
          navigate("/admin"); 
        } else {
          navigate("/feed"); 
        }
      }
    } catch (error) { 
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 403 && data) {
          setSuspendData({
            reason: data.reason || data.message || "ละเมิดเงื่อนไขการใช้งาน",
            until: data.suspended_until || "ถาวร"
          });
          setIsLoading(false);
          return;
        } 
        
        if (status === 401) {
          toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: data?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง", 
            variant: "destructive" 
          });
          setIsLoading(false);
          return;
        }
      }
      
      toast({
        title: "ระบบขัดข้อง",
        description: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary/25">
      <Navbar /> 

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-28 pb-16 mt-16 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-4xl h-auto md:h-[650px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden grid md:grid-cols-2 relative z-10 animate-in fade-in duration-500">
          
          {/* Left Panel: Clear Image & Promo Switch */}
          <div className="relative text-white p-8 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden">
            <img src={promoImage} alt="Promo" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
            
            <div className="relative z-10 space-y-6 max-w-sm">
              <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto border border-white/30 shadow-inner">
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">ยังไม่มีบัญชีใช่ไหม?</h2>
                <p className="text-sm text-slate-200 leading-relaxed font-medium drop-shadow">
                  เข้าร่วมชุมชนของเราวันนี้ เพื่อเริ่มต้นแลกเปลี่ยนสิ่งของได้ทันที ไม่มีค่าใช้จ่าย!
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full px-10 h-12 border-2 border-white text-white hover:bg-white hover:text-slate-900 font-bold tracking-wider transition-all shadow-lg bg-transparent">
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          </div>

          {/* Right Panel: Sign In Form */}
          <div className="p-8 sm:p-12 flex flex-col justify-center h-full">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1">เข้าสู่ระบบ</h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <div className="w-3.5 h-3.5 text-primary" /> ยินดีต้อนรับกลับมา
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={formData.email} 
                    onChange={(e) => updateField("email", e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700" 
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 ml-1">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={(e) => updateField("password", e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700" 
                  />
                </div>
                {errors.password && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.password}</p>}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all mt-4">
                {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </div>

        </div>
      </main>

      {suspendData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[100] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-[420px] w-full p-6 sm:p-8 text-center border border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-4">บัญชีถูกระงับการใช้งาน</h2>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 text-sm text-left mb-6 space-y-3">
              <div>
                <span className="block font-bold text-red-600 dark:text-red-400 mb-1">สาเหตุที่ถูกระงับ:</span>
                <p className="text-zinc-700 dark:text-zinc-300">{suspendData.reason}</p>
              </div>
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-700/50" />
              <div>
                <span className="block font-bold text-zinc-900 dark:text-white mb-1">ระงับถึงวันที่:</span>
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">{suspendData.until}</p>
              </div>
            </div>
            <Button className="w-full h-12 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900" onClick={() => setSuspendData(null)}>
              รับทราบและปิดหน้าต่าง
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}