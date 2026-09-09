import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Timer, CheckCircle2, Camera, User, Lock, Loader2, Sparkles, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import promoImage from "@/assets/hero-illustration.png";
import Navbar from "@/components/Navbar";
import API_BASE_URL from "../api/api";
import logo from "@/assets/logo.png";

type Step = "form" | "preview" | "otp" | "success";

export default function Register() {
  const navigate = useNavigate(); 
  const { toast } = useToast(); 
  const fileInputRef = useRef<HTMLInputElement>(null); 

  const [isLoading, setIsLoading] = useState(false); 
  const [step, setStep] = useState<Step>("form"); 
  const [formData, setFormData] = useState({ email: "", displayName: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<typeof formData>>({}); 
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const [otp, setOtp] = useState(""); 
  const [timeLeft, setTimeLeft] = useState(30 * 60); 

  const updateField = (field: keyof typeof formData, value: string) => { 
    setFormData(prev => ({ ...prev, [field]: value })); 
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" })); 
  };

  const validateForm = () => { 
    let isValid = true; 
    const newErrors: Partial<typeof formData> = {}; 
    if (!formData.email.includes("@")) { newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง"; isValid = false; } 
    if (formData.displayName.trim().length < 2) { newErrors.displayName = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"; isValid = false; } 
    if (formData.password.length < 8) { newErrors.password = "รหัสผ่านต้องมี 8 ตัวอักษรขึ้นไป"; isValid = false; } 
    if (formData.password !== formData.confirmPassword) { newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"; isValid = false; } 
    setErrors(newErrors); 
    return isValid; 
  };

  const handleFormSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (validateForm()) { setStep("preview"); } 
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file && file.size <= 5 * 1024 * 1024) { 
      setSelectedFile(file); 
      const reader = new FileReader(); 
      reader.onload = (ev) => setProfileImagePreview(ev.target?.result as string); 
      reader.readAsDataURL(file); 
    } 
  };

  const handleRegister = async () => { 
    setIsLoading(true); 
    try {
      const submitData = new FormData(); 
      submitData.append("email", formData.email); 
      submitData.append("password", formData.password); 
      submitData.append("display_name", formData.displayName); 
      if (selectedFile) submitData.append("profile_image", selectedFile); 

      const response = await fetch(`${API_BASE_URL}/register`, { method: "POST", body: submitData });
      const data = await response.json(); 

      if (response.ok && data.success) { 
        setStep("otp"); 
        setTimeLeft(30 * 60); 
        toast({ title: "ส่งรหัสยืนยันแล้ว", description: "กรุณาตรวจสอบรหัส OTP ในอีเมลของคุณ" }); 
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: data.message || "อีเมลนี้อาจมีผู้ใช้งานแล้ว", variant: "destructive" }); 
        setStep("form"); 
      }
    } catch { 
      toast({ title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", variant: "destructive" }); 
    } finally {
      setIsLoading(false); 
    }
  };

  const handleVerifyOTP = async () => { 
    if (otp.length < 6) return; 
    setIsLoading(true); 
    try {
      const response = await fetch(`${API_BASE_URL}/verify-email`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: otp }),
      });
      const data = await response.json(); 
      if (response.ok && data.success) { setStep("success"); } 
      else { toast({ title: "ยืนยันไม่สำเร็จ", description: data.message, variant: "destructive" }); setOtp(""); }
    } catch { 
      toast({ title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", variant: "destructive" }); 
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (step !== "otp" || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000); 
    return () => clearInterval(timer); 
  }, [step, timeLeft]); 

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`; 

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary/25">
      <Navbar /> 

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-28 pb-16 mt-16 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-4xl h-auto md:h-[650px] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden grid md:grid-cols-2 relative z-10 animate-in fade-in duration-500">
          
          {/* Left Panel: Register Form */}
          <div className="p-8 sm:p-12 flex flex-col justify-center h-full">
            {step === "form" && (
              <>
                <div className="text-center mb-4">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1">สมัครสมาชิก</h1>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">สร้างบัญชีใหม่</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="flex justify-center mb-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group rounded-full">
                      <Avatar className="h-16 w-16 border-2 border-primary shadow-md">
                        <AvatarImage src={profileImagePreview || ""} className="object-cover" /> 
                        <AvatarFallback><ImagePlus className="h-5 w-5 text-slate-400" /></AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full shadow">
                        <Camera size={12} />
                      </div>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} /> 
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-500 ml-1">ชื่อผู้ใช้</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="ชื่อของคุณ" value={formData.displayName} onChange={(e) => updateField("displayName", e.target.value)} className="pl-11 h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700" />
                    </div>
                    {errors.displayName && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.displayName}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-500 ml-1">อีเมล</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="email" placeholder="name@example.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="pl-11 h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700" />
                    </div>
                    {errors.email && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-500 ml-1">รหัสผ่าน</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => updateField("password", e.target.value)} className="pl-11 h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700" />
                    </div>
                    {errors.password && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-500 ml-1">ยืนยันรหัสผ่าน</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} className="pl-11 h-11 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700" />
                    </div>
                    {errors.confirmPassword && <p className="text-[11px] text-red-500 font-bold ml-1">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all mt-2">
                    สมัครสมาชิก
                  </Button>
                </form>
              </>
            )}

            {step === "preview" && (
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">ตรวจสอบข้อมูล</h2>
                
                {/* 📌 เพิ่มส่วนแสดงตัวอย่างรูปโปรไฟล์ */}
                <div className="flex justify-center">
                  <Avatar className="h-20 w-20 border-2 border-primary shadow-md">
                    <AvatarImage src={profileImagePreview || ""} className="object-cover" />
                    <AvatarFallback>
                      <User className="h-8 w-8 text-slate-400" />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl space-y-2 text-left text-slate-700 dark:text-slate-300">
                  <p><b>ชื่อ:</b> {formData.displayName}</p>
                  <p><b>อีเมล:</b> {formData.email}</p>
                </div>
                
                <Button onClick={handleRegister} disabled={isLoading} className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  {isLoading ? <Loader2 className="animate-spin" /> : "ยืนยันและรับรหัส OTP"}
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-black">ยืนยันรหัส OTP</h2>
                <p className="text-xs text-slate-400">รหัสถูกส่งไปที่ {formData.email}</p>
                <div className="text-orange-500 font-mono font-bold"><Timer className="inline mr-1" /> {formatTime(timeLeft)}</div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {[...Array(6)].map((_, i) => <InputOTPSlot key={i} index={i} className="h-11 w-10 rounded-xl" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length < 6} className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground">
                  ยืนยัน OTP
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="text-center space-y-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-black">สมัครสำเร็จ!</h2>
                <Button onClick={() => navigate("/login")} className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground">
                  เข้าสู่ระบบ
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel: Clear Image & Sign In Switch */}
          <div className="relative text-white p-8 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden">
            <img src={promoImage} alt="Promo" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

            <div className="relative z-10 space-y-6 max-w-sm">
              <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mx-auto border border-white/30 shadow-inner">
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">มีบัญชีอยู่แล้ว?</h2>
                <p className="text-sm text-slate-200 leading-relaxed font-medium drop-shadow">
                  ยินดีต้อนรับกลับมา! เข้าสู่ระบบเพื่อดำเนินการต่อและใช้งานฟีเจอร์ทั้งหมดได้ทันที
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full px-10 h-12 border-2 border-white text-white hover:bg-white hover:text-slate-900 font-bold tracking-wider transition-all shadow-lg bg-transparent">
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}