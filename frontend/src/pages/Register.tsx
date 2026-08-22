import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowRight, ArrowLeft, Mail, Timer, CheckCircle2, Camera,
  User, Eye, EyeOff, Lock, Loader2, Sparkles, ImagePlus,
  FileText, ShieldCheck, Rocket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// เส้นทางไป Backend
import API_BASE_URL from "../api/api"; 

type Step = "form" | "preview" | "otp" | "success"; 

export default function Register() {
  const navigate = useNavigate(); 
  const { toast } = useToast(); 
  const fileInputRef = useRef<HTMLInputElement>(null); 

  const [showPassword, setShowPassword] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  const [step, setStep] = useState<Step>("form"); 
  
  const [formData, setFormData] = useState({
    email: "", displayName: "", password: "", confirmPassword: "" 
  });
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
    } else if (file) {
      toast({ title: "ขนาดรูปภาพต้องไม่เกิน 5MB", variant: "destructive" }); 
    }
  };

  const handleRegister = async () => { 
    setIsLoading(true); 
    try {
      const submitData = new FormData(); 
      submitData.append("email", formData.email); 
      submitData.append("password", formData.password); 
      submitData.append("display_name", formData.displayName); 
      
      if (selectedFile) { 
        submitData.append("profile_image", selectedFile); 
      }

      const response = await fetch(`${API_BASE_URL}/register`, { 
        method: "POST", 
        body: submitData, 
      });

      const data = await response.json(); 

      if (response.ok && data.success) { 
        setStep("otp"); 
        setTimeLeft(30 * 60); 
        toast({ title: "ส่งรหัสยืนยันแล้ว", description: "กรุณาตรวจสอบรหัส OTP ในอีเมลของคุณ" }); 
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: data.message || "อีเมลนี้อาจมีผู้ใช้งานแล้ว", variant: "destructive" }); 
        setStep("form"); 
      }
    } catch (error) { 
      toast({ title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", description: "กรุณาตรวจสอบการรัน Backend", variant: "destructive" }); 
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
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({ 
          email: formData.email, 
          code: otp, 
        }),
      });

      const data = await response.json(); 

      if (response.ok && data.success) { 
        setStep("success"); 
      } else {
        toast({ title: "ยืนยันไม่สำเร็จ", description: data.message || "รหัส OTP ไม่ถูกต้องหรือหมดอายุ", variant: "destructive" }); 
        setOtp(""); 
      }
    } catch (error) { 
      toast({ title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", variant: "destructive" }); 
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (step !== "otp" || timeLeft <= 0) { 
      if (timeLeft <= 0 && step === "otp") { 
        toast({ title: "รหัส OTP หมดอายุ", description: "กรุณาทำรายการสมัครใหม่อีกครั้ง", variant: "destructive" }); 
        setStep("form"); 
        setTimeLeft(30 * 60); 
      }
      return; 
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000); 
    return () => clearInterval(timer); 
  }, [step, timeLeft, toast]); 

  const formatTime = (s: number) => 
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`; 

  // ข้อมูลสำหรับ Stepper ด้านซ้าย
  const stepsData = [
    { id: "form", label: "ข้อมูลส่วนตัว", desc: "ตั้งค่าโปรไฟล์และบัญชี", icon: User },
    { id: "preview", label: "ตรวจสอบความถูกต้อง", desc: "ยืนยันข้อมูลก่อนดำเนินการ", icon: FileText },
    { id: "otp", label: "ยืนยันรหัสผ่าน", desc: "กรอก OTP จากอีเมลของคุณ", icon: ShieldCheck },
    { id: "success", label: "พร้อมใช้งาน", desc: "เริ่มต้นแลกเปลี่ยนสิ่งของได้เลย", icon: Rocket }
  ];
  
  const currentStepIndex = stepsData.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col font-sans selection:bg-primary/20 transition-colors duration-300">
      <Navbar /> 

      <main className="flex-1 flex items-center justify-center relative py-12 px-4 sm:px-8 overflow-hidden">
        
        {/* 🎨 Subtle Animated Gradient Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[15000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10">
          
          {/* 🌟 Left: Premium Stepper Panel (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col items-start justify-center space-y-10 p-2 py-12 min-h-[600px]">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2rem] shadow-sm border border-slate-200/50 dark:border-white/5 inline-flex items-center justify-center">
              <img src={logo} alt="Tradin Logo" className="w-14 h-14 object-contain drop-shadow-sm" />
            </div>
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                ECO-FRIENDLY COMMUNITY
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                เริ่มต้นการแบ่งปัน <br />กับ Tradin<span className="text-primary">.</span>
              </h2>
            </div>

            {/* 🔥 Enhanced Interactive Stepper */}
            <div className="pt-6 w-full relative">
              {/* Progress Line Background - ระบุ z-0 เพื่อให้อยู่หลังสุด */}
              <div className="absolute left-[23px] top-6 bottom-6 w-[3px] bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden z-0">
                {/* Active Progress Line */}
                <div 
                  className="absolute top-0 left-0 w-full bg-primary transition-all duration-700 ease-in-out"
                  style={{ height: `${(currentStepIndex / (stepsData.length - 1)) * 100}%` }}
                />
              </div>
              
              <div className="flex flex-col gap-8 relative z-10">
                {stepsData.map((stepInfo, idx) => {
                  const isActive = currentStepIndex === idx;
                  const isCompleted = currentStepIndex > idx;
                  const Icon = isCompleted ? CheckCircle2 : stepInfo.icon;

                  return (
                    // ⚠️ ลบ opacity-40 ออกจากตรงนี้ เพื่อไม่ให้วงกลมโปร่งแสง
                    <div key={stepInfo.id} className={`flex items-start gap-5 transition-all duration-500 ${isActive || isCompleted ? "translate-x-0" : "-translate-x-2"}`}>
                      
                      {/* Icon Circle */}
                      <div className="relative mt-1">
                        {/* Glow effect for active step */}
                        {isActive && (
                          <div className="absolute -inset-2 bg-primary/20 rounded-full animate-pulse blur-sm" />
                        )}
                        {/* ⚠️ เปลี่ยน bg เป็นสีทึบ (bg-slate-50 / bg-zinc-950) เสมอเพื่อให้บังเส้น */}
                        <div className={`relative h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ring-4 ring-slate-50 dark:ring-zinc-950 z-10
                          ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110" : 
                            isCompleted ? "bg-green-500 text-white shadow-md shadow-green-500/20" : "bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 border-2 border-slate-200 dark:border-zinc-800"}`}>
                          <Icon className={`w-5 h-5 ${isActive ? "animate-in zoom-in duration-300" : ""}`} />
                        </div>
                      </div>

                      {/* Text Content - ⚠️ ย้าย opacity-40 มาใส่ที่กลุ่มตัวหนังสือแทน */}
                      <div className={`flex flex-col pt-1 transition-opacity duration-500 ${isActive || isCompleted ? "opacity-100" : "opacity-40"}`}>
                        <span className={`text-[17px] font-bold transition-colors ${isActive ? "text-slate-900 dark:text-white" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-500"}`}>
                          {stepInfo.label}
                        </span>
                        <span className={`text-[13px] font-medium mt-0.5 transition-colors ${isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-400/70 dark:text-slate-600"}`}>
                          {stepInfo.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 📝 Right: Dynamic Form Area */}
          <div className="w-full max-w-[480px] mx-auto lg:col-span-7">
            
            {/* Mobile Header */}
            <div className="lg:hidden text-center space-y-4 mb-8">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 shadow-sm">
                <img src={logo} alt="Tradin Logo" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Tradin<span className="text-primary">.</span>
              </h2>
            </div>

            {/* Main Card */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative overflow-hidden transition-all duration-500">
              
              {/* Step 1: Form */}
              {step === "form" && ( 
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">สร้างบัญชีใหม่</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">กรอกข้อมูลด้านล่างเพื่อเริ่มต้นการใช้งาน</p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-5 text-left"> 
                    
                    {/* 📸 Profile Image Upload */}
                    <div className="flex flex-col items-center justify-center gap-3 mb-8">
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="relative group outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded-full transition-all"
                      >
                        <Avatar className="h-28 w-28 border-[3px] border-white dark:border-zinc-800 shadow-xl transition-all duration-300 group-hover:scale-105 bg-slate-100 dark:bg-zinc-800">
                          <AvatarImage src={profileImagePreview || ""} className="object-cover" /> 
                          <AvatarFallback className="bg-transparent">
                            <ImagePlus className="h-10 w-10 text-slate-300 dark:text-slate-600" /> 
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Camera Badge Hover Effect */}
                        <div className="absolute -bottom-1 -right-1 p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg transform transition-all duration-300 group-hover:scale-110 border-[3px] border-white dark:border-zinc-900">
                          <Camera size={18} strokeWidth={2.5} /> 
                        </div>
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} /> 
                      <span className="text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
                        อัปโหลดรูปโปรไฟล์
                      </span>
                    </div>

                    {/* 📝 Inputs */}
                    <div className="space-y-4">
                      {[
                        { id: "displayName", label: "ชื่อที่แสดง", type: "text", placeholder: "ชื่อของคุณ", icon: <User className="w-5 h-5" /> }, 
                        { id: "email", label: "อีเมล", type: "email", placeholder: "mail@example.com", icon: <Mail className="w-5 h-5" /> }, 
                        { id: "password", label: "รหัสผ่าน", type: "password", placeholder: "••••••••", icon: <Lock className="w-5 h-5" /> }, 
                        { id: "confirmPassword", label: "ยืนยันรหัสผ่าน", type: "password", placeholder: "••••••••", icon: <Lock className="w-5 h-5" /> } 
                      ].map((input) => {
                        const hasError = !!errors[input.id as keyof typeof formData]; 
                        
                        return (
                          <div key={input.id} className="space-y-1.5 group">
                            <Label htmlFor={input.id} className={`text-[13px] font-bold ml-1 transition-colors ${hasError ? "text-red-500" : "text-slate-600 dark:text-slate-400 group-focus-within:text-primary"}`}>
                              {input.label} <span className="text-red-500">*</span> 
                            </Label>
                            
                            <div className="relative">
                              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${hasError ? "text-red-400" : "text-slate-400 group-focus-within:text-primary"}`}>
                                {input.icon}
                              </div>
                              
                              <Input
                                id={input.id} 
                                type={(input.id === "password" || input.id === "confirmPassword") ? (showPassword ? "text" : "password") : input.type} 
                                placeholder={input.placeholder} 
                                value={formData[input.id as keyof typeof formData]} 
                                onChange={(e) => updateField(input.id as keyof typeof formData, e.target.value)} 
                                className={`pl-12 h-14 bg-slate-50/50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 focus-visible:bg-white dark:focus-visible:bg-zinc-950 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 rounded-[1rem] text-base transition-all duration-300 shadow-sm ${hasError ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20 bg-red-50/50 dark:bg-red-950/20" : ""}`}
                              />
                              
                              {(input.id === "password" || input.id === "confirmPassword") && ( 
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-primary">
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} 
                                </button>
                              )}
                            </div>
                            
                            {/* Error Animation */}
                            <div className={`overflow-hidden transition-all duration-300 ${hasError ? "max-h-8 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                              <p className="text-[12.5px] text-red-500 font-semibold ml-2">
                                {errors[input.id as keyof typeof formData]} 
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Button type="submit" className="w-full h-14 mt-6 rounded-[1rem] text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 group">
                      ดำเนินการต่อ
                      <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" /> 
                    </Button>
                  </form>
                </div>
              )}

              {/* Step 2: Preview */}
              {step === "preview" && ( 
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">ตรวจสอบข้อมูล</h2>
                    <p className="text-sm text-slate-500">กรุณายืนยันความถูกต้องก่อนดำเนินการต่อ</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800">
                    <Avatar className="h-24 w-24 border-[3px] border-white dark:border-zinc-800 shadow-xl bg-slate-100 dark:bg-zinc-800">
                      <AvatarImage src={profileImagePreview || ""} className="object-cover" /> 
                      <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">{formData.displayName[0]}</AvatarFallback> 
                    </Avatar>
                    
                    <div className="w-full space-y-3 text-left">
                      <div className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-[1rem] shadow-sm border border-slate-100 dark:border-zinc-800">
                        <span className="text-[13px] font-bold text-slate-500">ชื่อที่แสดง</span>
                        <b className="text-[15px] text-slate-900 dark:text-white">{formData.displayName}</b> 
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-[1rem] shadow-sm border border-slate-100 dark:border-zinc-800">
                        <span className="text-[13px] font-bold text-slate-500">อีเมล</span>
                        <b className="text-[15px] text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{formData.email}</b> 
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button onClick={handleRegister} disabled={isLoading} className="w-full h-14 rounded-[1rem] text-base font-bold shadow-lg shadow-primary/25 transition-all"> 
                      {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังประมวลผล...</> : "ยืนยันและรับรหัส OTP"} 
                    </Button>
                    <button onClick={() => setStep("form")} disabled={isLoading} className="text-[14px] font-semibold flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-30"> 
                      <ArrowLeft size={16} /> กลับไปแก้ไขข้อมูล 
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: OTP */}
              {step === "otp" && ( 
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center space-y-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto text-primary relative">
                    <Mail className="w-10 h-10" /> 
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-white dark:border-zinc-900 animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">ยืนยันรหัส OTP</h2>
                    <p className="text-[15px] text-slate-500">
                      เราได้ส่งรหัส 6 หลักไปที่ <br/>
                      <b className="text-slate-900 dark:text-white">{formData.email}</b> 
                    </p>
                  </div>
                  
                  <div className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-mono font-bold tracking-widest">
                    <Timer size={16} /> {formatTime(timeLeft)} 
                  </div>
                  
                  <div className="flex justify-center w-full">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isLoading}> 
                      <InputOTPGroup className="gap-2 sm:gap-3">
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} className="h-12 w-10 sm:h-14 sm:w-12 text-xl sm:text-2xl font-black rounded-xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all shadow-sm shrink-0" />
                        ))} 
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length < 6} className="w-full h-14 rounded-[1rem] text-base font-bold shadow-lg shadow-primary/25 transition-all"> 
                     {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังตรวจสอบ...</> : "ยืนยันรหัส OTP"} 
                  </Button>
                </div>
              )}

              {/* Step 4: Success */}
              {step === "success" && ( 
                <div className="animate-in zoom-in-95 duration-500 text-center space-y-8 py-6">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6 relative shadow-inner">
                    <CheckCircle2 size={50} className="relative z-10" /> 
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-50" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">สมัครสำเร็จ! 🎉</h2> 
                    <p className="text-[16px] text-slate-500 leading-relaxed">
                      ยินดีต้อนรับคุณ <span className="font-bold text-slate-900 dark:text-white">{formData.displayName}</span> <br/> 
                      เข้าสู่ชุมชนการแบ่งปันของเรา
                    </p>
                  </div>
                  
                  <Button onClick={() => navigate("/login")} className="w-full h-14 mt-6 rounded-[1rem] text-base font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all"> 
                    เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน
                  </Button>
                </div>
              )}
            </div>

            {/* Login Link Outside Card */}
            {step !== "success" && ( 
              <div className="mt-8 text-center animate-in fade-in duration-700">
                <p className="text-[14px] font-medium text-slate-500">
                  มีบัญชีผู้ใช้อยู่แล้ว?{" "} 
                  <Link to="/login" className="text-slate-900 dark:text-white font-bold hover:text-primary dark:hover:text-primary transition-colors underline decoration-2 underline-offset-4 decoration-slate-300 dark:decoration-zinc-700 hover:decoration-primary">
                    เข้าสู่ระบบ 
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer /> 
    </div>
  );
}