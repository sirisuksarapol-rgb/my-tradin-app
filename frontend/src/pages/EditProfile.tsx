
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, User as UserIcon, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, Upload, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { updateUserProfile } from "@/api/api";

interface User {
  MemberID: number;
  DisplayName: string;
  Email: string;
  ProfileImage?: string;
  MemberStatus?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isOldPasswordVerified, setIsOldPasswordVerified] = useState(false);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "success" as "success" | "error",
  });

  // โหลดข้อมูลผู้ใช้จาก sessionStorage
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser: User = JSON.parse(savedUser);
      const name = parsedUser.DisplayName || parsedUser.name || "";
      const email = parsedUser.Email || parsedUser.email || "";
      const avatar = parsedUser.ProfileImage
        ? `http://localhost:5000/uploads/${parsedUser.ProfileImage}`
        : parsedUser.avatar || "";

      const mappedUser = { ...parsedUser, name, email, avatar };

      setUser(mappedUser);
      setFormData({ name, email });
      setAvatarPreview(avatar);
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      navigate("/login");
    }
  }, [navigate]);

  // แสดงข้อความแจ้งเตือน
  const showToast = (
    title: string,
    message: string,
    type: "success" | "error",
  ) => {
    setToast({ show: true, title, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // ล้าง Error ของช่องที่แก้ไข
  const clearError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // จัดการการกรอกข้อมูลทั่วไป
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name as keyof typeof fieldErrors);
  };

  // จัดการการกรอกรหัสผ่าน
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setPasswords((prev) => ({ ...prev, [name]: value }));
    clearError(name as keyof typeof fieldErrors);
  };

  // แสดงหรือซ่อนรหัสผ่าน
  const toggleShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // เลือกรูปโปรไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("ไฟล์ใหญ่เกินไป", "ขนาดรูปภาพต้องไม่เกิน 2MB", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  // ตรวจสอบข้อมูลรหัสผ่านเบื้องต้น
  const verifyOldPassword = () => {
    if (!passwords.oldPassword.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        oldPassword: "กรุณากรอกรหัสผ่านเดิม",
      }));
      return;
    }

    clearError("oldPassword");
    setIsOldPasswordVerified(true);
  };

  // ยกเลิกการเปลี่ยนรหัสผ่าน
  const cancelPasswordChange = () => {
    setIsOldPasswordVerified(false);
    setPasswords({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setFieldErrors((prev) => ({
      ...prev,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  // บันทึกข้อมูลโปรไฟล์
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        name: "กรุณาระบุชื่อที่แสดง",
      }));
      return;
    }

    if (isOldPasswordVerified && passwords.newPassword) {
      if (passwords.newPassword.length < 8) {
        setFieldErrors((prev) => ({
          ...prev,
          newPassword: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
        }));
        return;
      }

      if (passwords.newPassword !== passwords.confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "ยืนยันรหัสผ่านใหม่ไม่ตรงกัน",
        }));
        return;
      }
    }

    try {
      setIsLoading(true);

      const payload = new FormData();
      payload.append("DisplayName", formData.name);

      if (
        isOldPasswordVerified &&
        passwords.oldPassword &&
        passwords.newPassword
      ) {
        payload.append("OldPassword", passwords.oldPassword);
        payload.append("NewPassword", passwords.newPassword);
      }

      const profileImage = fileInputRef.current?.files?.[0];

      if (profileImage) {
        payload.append("profile_image", profileImage);
      }

      const result = await updateUserProfile(user.MemberID, payload);

      if (!result.success) {
        showToast("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง", "error");
        return;
      }

      const dbUser = result.data;

      const updatedUser: User = {
        ...dbUser,
        name: dbUser.DisplayName,
        email: dbUser.Email,
        avatar: dbUser.ProfileImage
          ? `http://localhost:5000/uploads/${dbUser.ProfileImage}`
          : "",
      };

      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setFormData({
        name: updatedUser.DisplayName || "",
        email: updatedUser.Email || "",
      });
      setAvatarPreview(updatedUser.avatar || "");

      showToast("บันทึกสำเร็จ", "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว", "success");
      cancelPasswordChange();

      setTimeout(() => navigate("/profile"), 1200);
    } catch (error) {
      console.error(error);

      const apiError = error as ApiErrorResponse;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง";

      showToast("เกิดข้อผิดพลาด", message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="bg-muted/20 min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-6 rounded-2xl border border-border/60 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="-ml-2 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground transition-all"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  ตั้งค่าโปรไฟล์
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  จัดการข้อมูลส่วนตัวและตั้งค่าความปลอดภัยของบัญชี
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-xl text-xs font-semibold text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-foreground transition-all"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-xl px-6 h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึกเปลี่ยนแปลง
                  </>
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border border-border/60 shadow-sm overflow-hidden bg-background">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-5">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={avatarPreview} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-4xl font-black">
                        {formData.name.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px]">
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] font-semibold">เปลี่ยนรูปภาพ</span>
                    </div>

                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2.5 rounded-full shadow-md border-2 border-background hover:scale-110 active:scale-95 transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-bold text-lg text-foreground flex items-center justify-center gap-1.5">
                      {formData.name || "ผู้ใช้งานระบบ"}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {formData.email}
                    </p>
                  </div>

                  <Separator />

                  <div className="w-full text-left bg-muted/30 p-3.5 rounded-xl space-y-1 border border-border/40">
                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      คำแนะนำรูปโปรไฟล์
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      ใช้รูปถ่ายใบหน้าที่ชัดเจน ไฟล์นามสกุล JPG หรือ PNG
                      ขนาดไม่เกิน 2MB เพื่อสร้างความน่าเชื่อถือในการแลกเปลี่ยน
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <Card className="border border-border/60 shadow-sm bg-background">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      ข้อมูลส่วนตัว
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>
                          ชื่อที่แสดงในระบบ <span className="text-destructive">*</span>
                        </span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`pl-10 h-11 bg-background font-medium rounded-xl transition-all ${
                            fieldErrors.name
                              ? "border-destructive focus-visible:ring-destructive/20"
                              : "border-border/80 focus-visible:border-primary focus-visible:ring-primary/20"
                          }`}
                          placeholder="ระบุชื่อที่คุณต้องการให้ผู้อื่นเห็น"
                        />
                      </div>
                      {fieldErrors.name && (
                        <p className="text-[11px] text-destructive font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-foreground">อีเมลประจำบัญชี</label>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                          🔒 ไม่สามารถเปลี่ยนได้
                        </span>
                      </div>
                      <div className="relative opacity-80">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          value={formData.email}
                          readOnly
                          className="pl-10 h-11 bg-muted/40 text-muted-foreground border-border/50 cursor-not-allowed font-medium rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-sm bg-background">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        ความปลอดภัยและรหัสผ่าน
                      </h2>
                    </div>
                  </div>

                  {!isOldPasswordVerified ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex justify-between">
                          <span>รหัสผ่านเดิม</span>
                          <span className="text-muted-foreground font-normal text-[11px]">
                            (ยืนยันเพื่อเปลี่ยนรหัสผ่านใหม่)
                          </span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword.old ? "text" : "password"}
                            name="oldPassword"
                            value={passwords.oldPassword}
                            onChange={handlePasswordChange}
                            className={`pl-10 pr-10 h-11 bg-background rounded-xl transition-all ${
                              fieldErrors.oldPassword
                                ? "border-destructive focus-visible:ring-destructive/20"
                                : "border-border/80 focus-visible:border-primary focus-visible:ring-primary/20"
                            }`}
                            placeholder="กรอกรหัสผ่านปัจจุบัน"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowPassword("old")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {fieldErrors.oldPassword && (
                          <p className="text-[11px] text-destructive font-semibold flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> {fieldErrors.oldPassword}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-xl h-10 text-xs font-bold border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                        onClick={verifyOldPassword}
                        disabled={!passwords.oldPassword}
                      >
                        ตรวจสอบรหัสผ่านเดิม
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>ยืนยันรหัสผ่านเดิมเรียบร้อยแล้ว</span>
                        </div>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-[11px] font-medium"
                        >
                          <X className="h-3.5 w-3.5" /> ยกเลิก
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {(["new", "confirm"] as const).map((field) => {
                          const isNew = field === "new";
                          const name = isNew ? "newPassword" : "confirmPassword";
                          const label = isNew ? "รหัสผ่านใหม่" : "ยืนยันรหัสผ่านใหม่";
                          const placeholder = isNew ? "อย่างน้อย 8 ตัวอักษร" : "กรอกรหัสผ่านใหม่อีกครั้ง";
                          const error = isNew ? fieldErrors.newPassword : fieldErrors.confirmPassword;

                          return (
                            <div key={field} className="space-y-1.5">
                              <label className="text-xs font-bold text-foreground">{label}</label>
                              <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type={showPassword[field] ? "text" : "password"}
                                  name={name}
                                  value={passwords[name]}
                                  onChange={handlePasswordChange}
                                  className="pl-10 pr-10 h-11 bg-background rounded-xl border-border/80 focus-visible:border-primary"
                                  placeholder={placeholder}
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleShowPassword(field)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPassword[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              {error && (
                                <p className="text-[11px] text-destructive font-semibold flex items-center gap-1 mt-1">
                                  <AlertCircle className="h-3 w-3" /> {error}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 w-80 p-4 rounded-2xl shadow-2xl border border-border/50 bg-background/90 backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`p-2 rounded-xl shrink-0 ${toast.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">{toast.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{toast.message}</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}