
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Timer,
  CheckCircle2,
  Camera,
  User,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ImagePlus,
  RefreshCw,
} from "lucide-react";
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

  const [step, setStep] = useState<Step>("form");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendCountdown, setResendCountdown] = useState(60);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};

    if (!formData.email.trim().includes("@")) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (formData.displayName.trim().length < 2) {
      newErrors.displayName = "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร";
    }

    if (formData.password.length < 8) {
      newErrors.password = "รหัสผ่านต้องมี 8 ตัวอักษรขึ้นไป";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      setStep("preview");
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์มีขนาดใหญ่เกินไป",
        description: "กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5 MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => setProfileImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const requestOTP = async (isResend = false) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: data.message || "ไม่สามารถส่งรหัส OTP ได้",
          variant: "destructive",
        });

        if (!isResend) setStep("form");
        return;
      }

      if (!isResend) setStep("otp");

      setTimeLeft(600);
      setResendCountdown(60);

      toast({
        title: "ส่งรหัสยืนยันแล้ว",
        description: "กรุณาตรวจสอบรหัส OTP ในอีเมลของคุณ",
      });
    } catch {
      toast({
        title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("email", formData.email);
      submitData.append("password", formData.password);
      submitData.append("display_name", formData.displayName);
      submitData.append("otp", otp);

      if (selectedFile) {
        submitData.append("profile_image", selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/register/confirm`, {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep("success");
        return;
      }

      toast({
        title: "ยืนยันไม่สำเร็จ",
        description: data.message || "รหัส OTP ไม่ถูกต้อง",
        variant: "destructive",
      });

      setOtp("");
    } catch {
      toast({
        title: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // นับเวลารหัส OTP และเวลาส่งรหัสใหม่
  useEffect(() => {
    if (step !== "otp") return;

    const timer = setInterval(() => {
      setTimeLeft((time) => Math.max(0, time - 1));
      setResendCountdown((time) => Math.max(0, time - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans selection:bg-primary/25 dark:bg-zinc-950">
      <Navbar />

      <main className="relative mt-16 flex flex-1 items-center justify-center overflow-hidden px-4 pb-16 pt-28 sm:p-8">
        <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[130px]" />

        <div className="relative z-10 grid h-auto w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl animate-in fade-in duration-500 dark:border-zinc-800 dark:bg-zinc-900 md:h-[650px] md:grid-cols-2">
          {/* ส่วนสมัครสมาชิก */}
          <div className="flex h-full flex-col justify-center p-8 sm:p-12">
            {step === "form" && (
              <>
                <div className="mb-4 text-center">
                  <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    สมัครสมาชิก
                  </h1>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div className="mb-6 mt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative cursor-pointer"
                      aria-label="เลือกรูปโปรไฟล์"
                    >
                      <Avatar className="h-24 w-24 border-2 border-slate-200 shadow-sm transition-opacity group-hover:opacity-80 dark:border-zinc-700">
                        <AvatarImage
                          src={profileImagePreview || ""}
                          className="object-cover"
                        />
                        <AvatarFallback className="flex flex-col items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-800">
                          <ImagePlus className="h-6 w-6 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-500">
                            เพิ่มรูป
                          </span>
                        </AvatarFallback>
                      </Avatar>

                      <div className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-primary p-2 text-white shadow-md transition-colors group-hover:bg-primary/90 dark:border-zinc-900">
                        <Camera className="h-4 w-4" />
                      </div>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="ml-1 text-xs font-bold text-slate-500">
                      ชื่อผู้ใช้
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="ชื่อของคุณ"
                        value={formData.displayName}
                        onChange={(e) => updateField("displayName", e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                    {errors.displayName && (
                      <p className="ml-1 text-[11px] font-bold text-red-500">
                        {errors.displayName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="ml-1 text-xs font-bold text-slate-500">
                      อีเมล
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="example@gmail.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                    {errors.email && (
                      <p className="ml-1 text-[11px] font-bold text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="ml-1 text-xs font-bold text-slate-500">
                      รหัสผ่าน
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-11 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="ml-1 text-[11px] font-bold text-red-500">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="ml-1 text-xs font-bold text-slate-500">
                      ยืนยันรหัสผ่าน
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          updateField("confirmPassword", e.target.value)
                        }
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-11 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                        }
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="ml-1 text-[11px] font-bold text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="mt-2 h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
                  >
                    สมัครสมาชิก
                  </Button>
                </form>
              </>
            )}

            {step === "preview" && (
              <div className="space-y-6 text-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  ตรวจสอบข้อมูล
                </h2>

                <div className="flex justify-center">
                  <Avatar className="h-20 w-20 border-2 border-primary shadow-md">
                    <AvatarImage
                      src={profileImagePreview || ""}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      <User className="h-8 w-8 text-slate-400" />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-slate-700 dark:bg-zinc-800 dark:text-slate-300">
                  <p>
                    <b>ชื่อ:</b> {formData.displayName}
                  </p>
                  <p>
                    <b>อีเมล:</b> {formData.email}
                  </p>
                </div>

                <Button
                  onClick={() => requestOTP(false)}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/25"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "ยืนยันและรับรหัส OTP"
                  )}
                </Button>

                <Button
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => setStep("form")}
                  className="h-11 w-full rounded-xl"
                >
                  กลับไปแก้ไขข้อมูล
                </Button>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-6 text-center">
                <h2 className="text-2xl font-black">ยืนยันรหัส OTP</h2>
                <p className="text-xs text-slate-400">
                  รหัสถูกส่งไปที่ {formData.email}
                </p>

                <div className="font-mono font-bold text-orange-500">
                  <Timer className="mr-1 inline" />
                  {formatTime(timeLeft)}
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }, (_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-11 w-10 rounded-xl"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="my-4 flex h-6 items-center justify-center text-sm">
                  {resendCountdown > 0 ? (
                    <p className="font-medium text-slate-400">
                      ส่งรหัสใหม่ได้ใน {resendCountdown} วินาที
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requestOTP(true)}
                      disabled={isLoading}
                      className="mx-auto flex items-center justify-center gap-1 font-bold text-primary transition-all hover:underline"
                    >
                      <RefreshCw
                        size={14}
                        className={isLoading ? "animate-spin" : ""}
                      />
                      ส่งรหัสยืนยันอีกครั้ง
                    </button>
                  )}
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="h-12 w-full rounded-xl bg-[#84b89b] font-bold text-white shadow-lg transition-all hover:bg-[#6fa084]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "ยืนยัน OTP"
                  )}
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-6 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-black">สมัครสำเร็จ!</h2>
                <Button
                  onClick={() => navigate("/login")}
                  className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground"
                >
                  เข้าสู่ระบบ
                </Button>
              </div>
            )}
          </div>

          {/* ส่วนเข้าสู่ระบบ */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden p-8 text-center text-white sm:p-12">
            <img
              src={promoImage}
              alt="ภาพประกอบ Tradin"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

            <div className="relative z-10 max-w-sm space-y-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-inner backdrop-blur-md">
                <img
                  src={logo}
                  alt="Tradin Logo"
                  className="h-8 w-8 object-contain brightness-0 invert"
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                  มีบัญชีอยู่แล้ว?
                </h2>
                <p className="text-sm font-medium leading-relaxed text-slate-200 drop-shadow">
                  ยินดีต้อนรับกลับมา!
                  เข้าสู่ระบบเพื่อดำเนินการต่อและใช้งานฟีเจอร์ทั้งหมดได้ทันที
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-2 border-white bg-transparent px-10 font-bold tracking-wider text-white shadow-lg transition-all hover:bg-white hover:text-slate-900"
              >
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}