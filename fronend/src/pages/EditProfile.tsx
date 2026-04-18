import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
   ArrowLeft, Camera, Save, User as UserIcon, Mail,
   Lock, Eye, EyeOff, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { User } from "@/lib/user_data";

export default function EditProfile() {
   const navigate = useNavigate();
   const [user, setUser] = useState<User | null>(null);
   const [isLoading, setIsLoading] = useState(false);

   const [toast, setToast] = useState<{ show: boolean; title: string; message: string; type: "success" | "error" }>({
      show: false,
      title: "",
      message: "",
      type: "success"
   });

   const [fieldErrors, setFieldErrors] = useState({
      name: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
   });

   const fileInputRef = useRef<HTMLInputElement>(null);
   const [avatarPreview, setAvatarPreview] = useState<string>("");

   const [formData, setFormData] = useState({
      name: "",
      email: "",
   });

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

   useEffect(() => {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
         navigate("/login");
         return;
      }
   

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setFormData({
         name: parsedUser.name || "",
         email: parsedUser.email || "",
      });
      setAvatarPreview(parsedUser.avatar || "");
   }, [navigate]);

   const showToast = (title: string, message: string, type: "success" | "error") => {
      setToast({ show: true, title, message, type });
      setTimeout(() => {
         setToast(prev => ({ ...prev, show: false }));
      }, 3500);
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (fieldErrors[name as keyof typeof fieldErrors]) {
         setFieldErrors(prev => ({ ...prev, [name]: "" }));
      }
   };

   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setPasswords((prev) => ({ ...prev, [name]: value }));
      if (fieldErrors[name as keyof typeof fieldErrors]) {
         setFieldErrors(prev => ({ ...prev, [name]: "" }));
      }
   };

   const toggleShowPassword = (field: keyof typeof showPassword) => {
      setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         if (file.size > 2 * 1024 * 1024) {
            showToast("ไฟล์ใหญ่เกินไป", "ขนาดรูปภาพต้องไม่เกิน 2MB ครับ", "error");
            return;
         }
         const reader = new FileReader();
         reader.onloadend = () => setAvatarPreview(reader.result as string);
         reader.readAsDataURL(file);
      }
   };

   const verifyOldPassword = () => {
      const currentPassword = user?.password || "12345678";

      if (!passwords.oldPassword) {
         setFieldErrors(prev => ({ ...prev, oldPassword: "กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน" }));
         return;
      }

      if (passwords.oldPassword !== currentPassword) {
         setFieldErrors(prev => ({ ...prev, oldPassword: "รหัสผ่านเดิมไม่ถูกต้อง" }));
         return;
      }

      setIsOldPasswordVerified(true);
      setFieldErrors(prev => ({ ...prev, oldPassword: "" }));
   };

   const cancelPasswordChange = () => {
      setIsOldPasswordVerified(false);
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setFieldErrors(prev => ({ ...prev, oldPassword: "", newPassword: "", confirmPassword: "" }));
   };

   // ฟังก์ชันบันทึกหลัก
   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();

      let hasError = false;
      const errors = { name: "", oldPassword: "", newPassword: "", confirmPassword: "" };

      // 1. ตรวจสอบชื่อ
      if (!formData.name.trim()) {
         errors.name = "กรุณากรอกชื่อที่แสดงของคุณ";
         hasError = true;
      }

      // 2. ตรวจสอบรหัสผ่าน (เฉพาะถ้ามีการยืนยันรหัสเก่าแล้ว)
      if (isOldPasswordVerified) {
         if (!passwords.newPassword) {
            errors.newPassword = "กรุณากรอกรหัสผ่านใหม่";
            hasError = true;
         } else if (passwords.newPassword.length < 8) {
            errors.newPassword = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
            hasError = true;
         }

         if (passwords.newPassword !== passwords.confirmPassword) {
            errors.confirmPassword = "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน";
            hasError = true;
         }
      }

      setFieldErrors(prev => ({ ...prev, ...errors }));

      if (hasError) {
         showToast("พบข้อผิดพลาด", "กรุณาตรวจสอบข้อมูลที่กรอกใหม่อีกครั้ง", "error");
         return;
      }

      setIsLoading(true);

      // จำลองการส่งข้อมูล
      setTimeout(() => {
         const updatedUser = {
            ...user,
            name: formData.name,
            avatar: avatarPreview,
         } as User;

         // ถ้ามีการเปลี่ยนรหัสผ่าน ให้ใส่รหัสใหม่ลงไป
         if (isOldPasswordVerified) {
            updatedUser.password = passwords.newPassword;
         }

         // บันทึกลง LocalStorage
         localStorage.setItem("user", JSON.stringify(updatedUser));
         setUser(updatedUser);
         setIsLoading(false);

         // Reset สถานะรหัสผ่านหลังบันทึก
         setIsOldPasswordVerified(false);
         setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });

         showToast("อัปเดตสำเร็จ!", "บันทึกข้อมูลโปรไฟล์ของคุณเรียบร้อยแล้ว", "success");

         // กลับหน้าเดิมหลังจากแสดง Toast แป๊บหนึ่ง
         setTimeout(() => navigate("/profile"), 1500);
      }, 800);
   };

   useEffect(() => {
       window.scrollTo({ top: 0, behavior: "smooth" });
     }, []);
   

   return (
      <AppLayout>
         <div className="px-4 py-4 max-w-lg mx-auto space-y-6 relative h-full">

            {/* Header */}
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                  <ArrowLeft className="h-5 w-5" />
               </Button>
               <h1 className="text-xl font-bold text-foreground">
                  แก้ไขโปรไฟล์
               </h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
               {/* Avatar Section */}
               <div className="flex flex-col items-center space-y-4 pt-2">
                  <div className="relative group">
                     <Avatar className="h-28 w-28 border-4 border-background shadow-md transition-transform group-hover:scale-105">
                        <AvatarImage src={avatarPreview} className="object-cover" />
                        <AvatarFallback className="eco-gradient text-4xl font-bold text-primary-foreground">
                           {formData.name?.charAt(0) || "U"}
                        </AvatarFallback>
                     </Avatar>

                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                     />

                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-all border-2 border-background hover:scale-110 active:scale-95"
                     >
                        <Camera className="h-4 w-4" />
                     </button>
                  </div>
               </div>

               {/* ข้อมูลทั่วไป */}
               <div className="space-y-2">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">ข้อมูลทั่วไป</h2>
                  <Card className="glass-card border-none shadow-sm">
                     <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                              ชื่อที่แสดง
                           </label>
                           <div className="relative">
                              <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${fieldErrors.name ? "text-destructive" : "text-muted-foreground"}`} />
                              <Input
                                 name="name"
                                 value={formData.name}
                                 onChange={handleChange}
                                 className={`pl-9 bg-background/50 font-medium transition-colors ${fieldErrors.name ? "border-destructive focus-visible:ring-destructive/20" : "border-primary/10 focus-visible:ring-primary/20"
                                    }`}
                                 placeholder="ระบุชื่อของคุณ"
                              />
                           </div>
                           {fieldErrors.name && (
                              <div className="flex items-center gap-1.5 text-[10px] text-destructive font-semibold px-1 mt-1 animate-in slide-in-from-top-1">
                                 <AlertCircle className="h-3 w-3" /> {fieldErrors.name}
                              </div>
                           )}
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              อีเมล (ไม่สามารถเปลี่ยนได้)
                           </label>
                           <div className="relative opacity-70">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                 name="email"
                                 value={formData.email}
                                 className="pl-9 bg-secondary/30 text-muted-foreground border-transparent cursor-not-allowed font-medium"
                                 readOnly
                              />
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               {/* เปลี่ยนรหัสผ่าน */}
               <div className="space-y-2">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">เปลี่ยนรหัสผ่าน</h2>
                  <Card className="glass-card border-none shadow-sm">
                     <CardContent className="p-5 space-y-4">
                        {!isOldPasswordVerified ? (
                           <div className="space-y-3">
                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex justify-between">
                                    รหัสผ่านเดิม
                                    <span className="text-muted-foreground font-normal normal-case">(เว้นว่างหากไม่เปลี่ยน)</span>
                                 </label>
                                 <div className="relative">
                                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${fieldErrors.oldPassword ? "text-destructive" : "text-muted-foreground"}`} />
                                    <Input
                                       type={showPassword.old ? "text" : "password"}
                                       name="oldPassword"
                                       value={passwords.oldPassword}
                                       onChange={handlePasswordChange}
                                       className={`pl-9 pr-10 bg-background/50 transition-colors ${fieldErrors.oldPassword ? "border-destructive focus-visible:ring-destructive/20" : "border-primary/10 focus-visible:ring-primary/20"
                                          }`}
                                       placeholder="••••••••"
                                    />
                                    <button
                                       type="button"
                                       onClick={() => toggleShowPassword('old')}
                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                       {showPassword.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                 </div>
                                 {fieldErrors.oldPassword && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-destructive font-semibold px-1 mt-1 animate-in slide-in-from-top-1">
                                       <AlertCircle className="h-3 w-3" /> {fieldErrors.oldPassword}
                                    </div>
                                 )}
                              </div>
                              <Button
                                 type="button"
                                 variant="secondary"
                                 className="w-full text-xs h-9 font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                 onClick={verifyOldPassword}
                                 disabled={!passwords.oldPassword}
                              >
                                 ตรวจสอบรหัสเดิม
                              </Button>
                           </div>
                        ) : (
                           <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex items-center justify-between bg-green-500/10 text-green-600 px-3 py-2.5 rounded-xl text-xs font-bold border border-green-500/20 shadow-sm">
                                 <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    รหัสผ่านเดิมถูกต้อง
                                 </div>
                                 <button
                                    type="button"
                                    onClick={cancelPasswordChange}
                                    className="text-muted-foreground hover:text-destructive underline font-normal text-[10px] transition-colors"
                                 >
                                    ยกเลิก
                                 </button>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                                    รหัสผ่านใหม่
                                 </label>
                                 <div className="relative">
                                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${fieldErrors.newPassword ? "text-destructive" : "text-primary/70"}`} />
                                    <Input
                                       type={showPassword.new ? "text" : "password"}
                                       name="newPassword"
                                       value={passwords.newPassword}
                                       onChange={handlePasswordChange}
                                       className={`pl-9 pr-10 bg-background/50 transition-colors ${fieldErrors.newPassword ? "border-destructive focus-visible:ring-destructive/20" : "border-primary/10 focus-visible:ring-primary/20"
                                          }`}
                                       placeholder="อย่างน้อย 8 ตัวอักษร"
                                    />
                                    <button
                                       type="button"
                                       onClick={() => toggleShowPassword('new')}
                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                       {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                 </div>
                                 {fieldErrors.newPassword && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-destructive font-semibold px-1 mt-1 animate-in slide-in-from-top-1">
                                       <AlertCircle className="h-3 w-3" /> {fieldErrors.newPassword}
                                    </div>
                                 )}
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                                    ยืนยันรหัสผ่านใหม่
                                 </label>
                                 <div className="relative">
                                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${fieldErrors.confirmPassword ? "text-destructive" : "text-primary/70"}`} />
                                    <Input
                                       type={showPassword.confirm ? "text" : "password"}
                                       name="confirmPassword"
                                       value={passwords.confirmPassword}
                                       onChange={handlePasswordChange}
                                       className={`pl-9 pr-10 bg-background/50 transition-colors ${fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive/20" : "border-primary/10 focus-visible:ring-primary/20"
                                          }`}
                                       placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                    />
                                    <button
                                       type="button"
                                       onClick={() => toggleShowPassword('confirm')}
                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                       {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                 </div>
                                 {fieldErrors.confirmPassword && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-destructive font-semibold px-1 mt-1 animate-in slide-in-from-top-1">
                                       <AlertCircle className="h-3 w-3" /> {fieldErrors.confirmPassword}
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>

               {/* Action Buttons */}
               <div className="pt-2 pb-8">
                  <Button
                     type="submit"
                     className="w-full h-12 rounded-xl text-base font-bold shadow-md eco-gradient border-0 text-white hover:opacity-90 transition-opacity active:scale-[0.98]"
                     disabled={isLoading}
                  >
                     {isLoading ? (
                        <div className="flex items-center gap-2">
                           <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                           กำลังบันทึก...
                        </div>
                     ) : (
                        <div className="flex items-center gap-2">
                           <Save className="h-5 w-5" />
                           บันทึกการเปลี่ยนแปลง
                        </div>
                     )}
                  </Button>
               </div>
            </form>

            {/* Toast Notification */}
            {toast.show && (
               <div className="fixed bottom-6 right-6 z-[100] flex items-start gap-3 w-72 p-4 rounded-2xl shadow-2xl border border-border/50 bg-background/80 backdrop-blur-xl animate-in slide-in-from-bottom-8 fade-in duration-300">
                  <div className={`p-2 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                     {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                     <p className="text-sm font-bold text-foreground">{toast.title}</p>
                     <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{toast.message}</p>
                  </div>
               </div>
            )}
         </div>
      </AppLayout>
   );
}