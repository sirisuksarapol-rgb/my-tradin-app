import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios"; // ✅ เพิ่ม axios เพื่อใช้ทำ Type Guard
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Mail, Lock, Sparkles, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { login as loginApi } from "@/api/api"; 

export default function Login() {
  const navigate = useNavigate(); 
  const { toast } = useToast(); 

  const [formData, setFormData] = useState({ email: "", password: "" }); 
  const [errors, setErrors] = useState<Partial<typeof formData>>({}); 
  const [showPassword, setShowPassword] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [suspendData, setSuspendData] = useState<{reason: string, until: string} | null>(null);

  const updateField = (field: keyof typeof formData, value: string) => { 
    setFormData((prev) => ({ ...prev, [field]: value })); 
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" })); 
  };

  const validateForm = () => { 
    const newErrors: Partial<typeof formData> = {}; 
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
        localStorage.setItem("user", JSON.stringify(response.data.user)); 
        localStorage.setItem("token", response.data.token); 
        localStorage.setItem("role", response.data.role); 

        if (response.data.role === "admin") { 
          navigate("/admin"); 
        } else {
          navigate("/feed"); 
        }
      }
    }  catch (error) { 
      console.error(error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 403 && data) {
          // ✅ เก็บข้อมูลแยกเป็นเหตุผลและเวลา
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
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary/20">
      <Navbar /> 

      <main className="flex-1 flex items-center justify-center relative overflow-hidden p-4 sm:p-8">
        
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[100px] sm:blur-[150px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-emerald-400/10 dark:bg-emerald-500/20 rounded-full blur-[100px] sm:blur-[150px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-[0.98] duration-700">
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)] rounded-[2.5rem] p-8 sm:p-10">
            
            <div className="text-center space-y-6 mb-10">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 shadow-sm mb-2">
                <img src={logo} alt="Tradin Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  เข้าสู่ระบบ
                </h1>
                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  ยินดีต้อนรับกลับสู่พื้นที่แลกเปลี่ยน
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5"> 
              
              {[
                { id: "email", label: "อีเมล", type: "email", ph: "hello@example.com", icon: <Mail className="w-5 h-5" /> }, 
                { id: "password", label: "รหัสผ่าน", type: "password", ph: "••••••••", icon: <Lock className="w-5 h-5" /> }, 
              ].map((f) => {
                const hasError = !!errors[f.id as keyof typeof formData]; 
                return (
                  <div key={f.id} className="space-y-1.5 group">
                    <Label htmlFor={f.id} className={`text-xs font-bold uppercase tracking-wider ml-1 transition-colors ${hasError ? "text-red-500" : "text-muted-foreground group-focus-within:text-foreground"}`}>
                      {f.label} 
                    </Label>
                    
                    <div className="relative">
                      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${hasError ? "text-red-400" : "text-muted-foreground/60 group-focus-within:text-primary"}`}>
                        {f.icon}
                      </div>
                      
                      <Input
                        id={f.id} 
                        type={f.id === "password" && showPassword ? "text" : f.type} 
                        placeholder={f.ph} 
                        value={formData[f.id as keyof typeof formData]} 
                        onChange={(e) => updateField(f.id as keyof typeof formData, e.target.value)} 
                        className={`pl-12 h-14 bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-black/40 focus-visible:bg-white dark:focus-visible:bg-black/50 focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10 rounded-[1.25rem] text-base transition-all duration-300 ${hasError ? "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/20 bg-red-50/50 dark:bg-red-950/10" : ""}`}
                      />
                      
                      {f.id === "password" && ( 
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} 
                        </button>
                      )}
                    </div>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${hasError ? "max-h-6 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                      <p className="text-[11px] text-red-500 font-bold ml-2">
                        {errors[f.id as keyof typeof formData]} 
                      </p>
                    </div>
                  </div>
                );
              })}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 mt-4 rounded-[1.25rem] text-base font-bold shadow-[0_8px_20px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_8px_25px_-5px_rgba(var(--primary),0.6)] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /> 
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              ยังไม่มีบัญชีผู้ใช้?{" "} 
              <Link to="/register" className="text-foreground font-bold hover:text-primary transition-colors underline decoration-2 underline-offset-4 decoration-border hover:decoration-primary">
                สมัครสมาชิกฟรี 
              </Link>
            </p>
          </div>
        </div>

        {/* 🚨 Suspension Modal Overlay */}
        {/* 🚨 Suspension Modal Overlay */}
        {suspendData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-[420px] w-full p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-zinc-800">
              
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                บัญชีถูกระงับการใช้งาน
              </h2>
              
              {/* ✅ กล่องแสดงรายละเอียดแบบแบ่งสัดส่วน */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 text-sm text-left mb-6 shadow-sm space-y-4">
                
                {/* ส่วนที่ 1: สาเหตุ */}
                <div>
                  <span className="block font-bold text-red-600 dark:text-red-400 mb-1">สาเหตุที่ถูกระงับ:</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {suspendData.reason}
                  </p>
                </div>
                
                <div className="h-px w-full bg-zinc-200 dark:bg-zinc-700/50"></div>
                
                {/* ส่วนที่ 2: ระยะเวลา */}
                <div>
                  <span className="block font-bold text-zinc-900 dark:text-white mb-1">ระงับการใช้งานถึงวันที่:</span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {suspendData.until}
                  </p>
                </div>

              </div>
              
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                หากคุณคิดว่านี่คือข้อผิดพลาด สามารถติดต่อทีมงานได้
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full h-12 rounded-xl text-base font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all shadow-md"
                  onClick={() => setSuspendData(null)}
                >
                  รับทราบและปิดหน้าต่าง
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}