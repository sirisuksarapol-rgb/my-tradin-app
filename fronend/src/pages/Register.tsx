import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowRight, ArrowLeft, Mail, Timer, CheckCircle2, Camera,
  User, Eye, EyeOff, Leaf, Lock, UserCircle, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// เพิ่มบรรทัดนี้เข้ามาเพื่อให้หน้าเว็บรู้จักเส้นทางไป Backend
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
  
  // จัดการไฟล์รูปภาพ
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 นาทีตาม Backend

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // ตรวจสอบความถูกต้องฝั่ง Frontend ก่อนยิง API
  const validateForm = () => {
    let isValid = true;
    const newErrors: Partial<typeof formData> = {};
    if (!formData.email.includes("@")) { newErrors.email = "อีเมลไม่ถูกต้อง"; isValid = false; }
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
    if (file && file.size <= 5 * 1024 * 1024) { // ไม่เกิน 5MB
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "ขนาดรูปภาพต้องไม่เกิน 5MB", variant: "destructive" });
    }
  };

  // ==========================================
  // ยิง API 1: ส่งข้อมูลฟอร์ม + ไฟล์รูป ไปบันทึกลง Database
  // ==========================================
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

      // ยิงไปที่ Blueprint "register" ของ Flask
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
        setStep("form"); // กลับไปหน้าแก้ข้อมูลหากอีเมลซ้ำ
      }
    } catch (error) {
      toast({ title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", description: "กรุณาตรวจสอบการรัน Backend", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ยิง API 2: ส่ง OTP ไปเทียบกับใน Database
  // ==========================================
  const handleVerifyOTP = async () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    
    try {
      // ยิงไปที่ Blueprint "verify" ของ Flask
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
        setOtp(""); // เคลียร์ช่องให้กรอกใหม่
      }
    } catch (error) {
      toast({ title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // จัดการเวลา OTP
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

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* ส่วนฝั่งซ้าย: โลโก้และข้อความ */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-8 p-12 bg-muted/30 rounded-3xl border border-border/50">
            <img src={logo} alt="Tradin Logo" className="w-24 h-auto" />
            <h2 className="text-3xl font-extrabold tracking-tight text-center">
              เริ่มต้นการแลกเปลี่ยน <br />กับ Tradin<span className="text-primary">.</span>
            </h2>
            <p className="text-muted-foreground text-center max-w-sm leading-relaxed">
              สมัครสมาชิกฟรี เข้าร่วมชุมชนแลกเปลี่ยนสิ่งของที่ยั่งยืน ลดขยะ สร้างคุณค่าใหม่
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              <span>ร่วมสร้างโลกที่ยั่งยืนไปด้วยกัน</span>
            </div>

            {/* ตัวบ่งชี้สถานะ (Progress) */}
            <div className="flex items-center gap-3 mt-4">
              {["กรอกข้อมูล", "ยืนยัน", "OTP", "สำเร็จ"].map((label, idx) => {
                const steps: Step[] = ["form", "preview", "otp", "success"];
                const isActive = steps.indexOf(step) >= idx;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? "eco-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {idx + 1}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                    {idx < 3 && <div className={`w-6 h-0.5 ${isActive ? "bg-primary" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ส่วนฝั่งขวา: ฟอร์มสมัคร */}
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="lg:hidden text-center space-y-2">
              <img src={logo} alt="Tradin Logo" className="w-16 sm:w-20 h-auto mx-auto" />
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight block">
                Tradin<span className="text-primary">.</span>
              </span>
            </div>

            {/* ขั้นตอน 1: กรอกฟอร์ม */}
            {step === "form" && (
              <Card className="glass-card border-border/50 shadow-xl">
                <CardHeader className="text-center pb-2">
                  <h2 className="text-xl font-bold">สมัครสมาชิก</h2>
                  <p className="text-sm text-muted-foreground">เริ่มต้นการแลกเปลี่ยนได้ที่นี่</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="relative">
                        <Avatar className="h-20 w-20 border-2 border-dashed border-primary/30">
                          <AvatarImage src={profileImagePreview || ""} />
                          <AvatarFallback><UserCircle className="h-10 w-10 opacity-20" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full shadow-md">
                          <Camera size={12} className="text-primary-foreground" />
                        </div>
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      <span className="text-xs font-medium text-muted-foreground">เพิ่มรูปโปรไฟล์ (ไม่บังคับ)</span>
                    </div>

                    {[
                      { id: "displayName", label: "ชื่อที่แสดง", type: "text", placeholder: "ชื่อของคุณ", icon: <User className="h-4 w-4" /> },
                      { id: "email", label: "อีเมล", type: "email", placeholder: "mail@example.com", icon: <Mail className="h-4 w-4" /> },
                      { id: "password", label: "รหัสผ่าน", type: "password", placeholder: "••••••••", icon: <Lock className="h-4 w-4" /> },
                      { id: "confirmPassword", label: "ยืนยันรหัสผ่าน", type: "password", placeholder: "••••••••", icon: <Lock className="h-4 w-4" /> }
                    ].map((input) => (
                      <div key={input.id} className="space-y-1.5">
                        <Label htmlFor={input.id} className={`text-xs font-semibold ${errors[input.id as keyof typeof formData] ? "text-red-500" : ""}`}>
                          {input.label} <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                            {input.icon}
                          </div>
                          <Input
                            id={input.id}
                            type={(input.id === "password" || input.id === "confirmPassword") ? (showPassword ? "text" : "password") : input.type}
                            placeholder={input.placeholder}
                            value={formData[input.id as keyof typeof formData]}
                            onChange={(e) => updateField(input.id as keyof typeof formData, e.target.value)}
                            className={`pl-10 pr-10 h-11 transition-all ${errors[input.id as keyof typeof formData] ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                          />
                          {(input.id === "password" || input.id === "confirmPassword") && (
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        {errors[input.id as keyof typeof formData] && (
                          <p className="text-[10px] text-red-500 font-medium ml-1">{errors[input.id as keyof typeof formData]}</p>
                        )}
                      </div>
                    ))}

                    <Button type="submit" className="w-full eco-gradient h-12 mt-6 font-bold shadow-lg shadow-primary/20">
                      ถัดไป <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ขั้นตอน 2: พรีวิวและยืนยันเพื่อยิง API เข้า Database */}
            {step === "preview" && (
              <Card className="glass-card border-border/50 shadow-xl">
                <CardContent className="pt-6 space-y-6 text-center">
                  <Avatar className="h-24 w-24 mx-auto border-4 border-primary/10">
                    <AvatarImage src={profileImagePreview || ""} />
                    <AvatarFallback className="text-xl bg-primary/5">{formData.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 p-4 rounded-xl text-sm space-y-3 border border-border/50 text-left">
                    <div className="flex justify-between items-center"><span className="opacity-60">ชื่อ</span><b className="text-primary">{formData.displayName}</b></div>
                    <div className="flex justify-between items-center"><span className="opacity-60">อีเมล</span><b>{formData.email}</b></div>
                  </div>
                  
                  {/* ปุ่มนี้คือจุดที่ทำการ Insert ลง Database */}
                  <Button onClick={handleRegister} disabled={isLoading} className="w-full eco-gradient h-12 font-bold">
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังประมวลผล...</> : "ยืนยันและรับรหัส OTP"}
                  </Button>
                  
                  <button onClick={() => setStep("form")} disabled={isLoading} className="text-xs flex items-center justify-center gap-1 mx-auto opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30">
                    <ArrowLeft size={12} />แก้ไขข้อมูล
                  </button>
                </CardContent>
              </Card>
            )}

            {/* ขั้นตอน 3: กรอกรหัส OTP (ยิง API ตรวจสอบกับ Database) */}
            {step === "otp" && (
              <Card className="glass-card border-border/50 shadow-xl">
                <CardContent className="pt-8 space-y-6 text-center">
                  <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse"><Mail /></div>
                  <div className="space-y-1">
                    <h2 className="font-bold text-lg">ยืนยันอีเมล</h2>
                    <p className="text-sm opacity-60 px-4">ระบบได้ส่งรหัส 6 หลักไปที่ <b>{formData.email}</b></p>
                  </div>
                  <div className="flex justify-center items-center gap-2 text-sm font-mono font-bold text-primary">
                    <Timer size={14} /> {formatTime(timeLeft)}
                  </div>
                  <div className="flex justify-center w-full overflow-hidden px-2">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isLoading}>
                      <InputOTPGroup className="gap-1.5 sm:gap-2">
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} className="h-10 w-8 sm:h-12 sm:w-10 md:h-14 md:w-12 text-base sm:text-lg rounded-md border-primary/20 focus:border-primary shrink-0" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  {/* ปุ่มนี้คือจุดที่ตรวจสอบ Update verified=1 ใน Database */}
                  <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length < 6} className="w-full eco-gradient h-12 font-bold">
                     {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังตรวจสอบ...</> : "ยืนยันรหัส"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ขั้นตอน 4: สมัครสำเร็จ */}
            {step === "success" && (
              <Card className="glass-card border-border/50 shadow-xl py-6 text-center">
                <CardContent className="space-y-4">
                  <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 animate-bounce"><CheckCircle2 size={40} /></div>
                  <h2 className="text-2xl font-black">สมัครสำเร็จ! 🎉</h2>
                  <p className="text-sm text-muted-foreground px-4">ยินดีต้อนรับคุณ <span className="font-bold text-foreground">{formData.displayName}</span></p>
                  <Button onClick={() => navigate("/login")} className="w-full eco-gradient h-12 mt-4 font-bold">ไปหน้าเข้าสู่ระบบ</Button>
                </CardContent>
              </Card>
            )}

            <p className="text-center text-sm">
              มีบัญชีแล้ว?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}