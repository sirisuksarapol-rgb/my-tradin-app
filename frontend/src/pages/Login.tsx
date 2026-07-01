import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { login as loginApi } from "@/api/api"; // แก้ path ให้ตรงกับที่อยู่ของไฟล์ api.js

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.email.includes("@")) newErrors.email = "อีเมลไม่ถูกต้องต้องมี @";
    if (formData.password.length < 8) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await loginApi(formData);
      if (response.data.success) {
        
        // 1. เก็บข้อมูล User
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        // 2. เก็บ Token ไว้ใช้ยืนยันตัวตนในหน้าอื่นๆ (เพิ่มบรรทัดนี้!)
        localStorage.setItem("token", response.data.token); 

        navigate(response.data.user.role === "admin" ? "/admin" : "/feed");
      } else {
        toast({ title: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Branding panel (desktop) */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-8 p-12 bg-muted/30 rounded-3xl border border-border/50">
            <img src={logo} alt="Tradin Logo" className="w-24 h-auto" />
            <h2 className="text-3xl font-extrabold tracking-tight text-center">
              ยินดีต้อนรับกลับสู่ <br />Tradin<span className="text-primary">.</span>
            </h2>
            <p className="text-muted-foreground text-center max-w-sm leading-relaxed">
              เข้าสู่ระบบเพื่อเริ่มต้นแลกเปลี่ยนสิ่งของ และเป็นส่วนหนึ่งของชุมชนที่ยั่งยืน
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              <span>ร่วมสร้างโลกที่ยั่งยืนไปด้วยกัน</span>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Mobile logo */}
            <div className="lg:hidden text-center space-y-4">
              <img src={logo} alt="Tradin Logo" className="w-16 sm:w-20 h-auto mx-auto" />
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight block">
                Tradin<span className="text-primary">.</span>
              </span>
            </div>

            <Card className="glass-card border-border/50 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-xl font-bold">เข้าสู่ระบบ</h2>
                  <p className="text-sm text-muted-foreground">ยินดีต้อนรับกลับสู่สังคมแห่งการแบ่งปัน</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {[
                    { id: "email", label: "อีเมล", type: "email", ph: "mail@example.com", icon: <Mail className="h-4 w-4" /> },
                    { id: "password", label: "รหัสผ่าน", type: "password", ph: "••••••••", icon: <Lock className="h-4 w-4" /> },
                  ].map((f) => (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={f.id} className={`text-xs font-semibold ${errors[f.id as keyof typeof formData] ? "text-red-500" : ""}`}>
                        {f.label}
                      </Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                          {f.icon}
                        </div>
                        <Input
                          id={f.id}
                          type={f.id === "password" && showPassword ? "text" : f.type}
                          placeholder={f.ph}
                          value={formData[f.id as keyof typeof formData]}
                          onChange={(e) => updateField(f.id as keyof typeof formData, e.target.value)}
                          className={`pl-10 pr-10 h-11 transition-all ${errors[f.id as keyof typeof formData] ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                        />
                        {f.id === "password" && (
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                      {errors[f.id as keyof typeof formData] && (
                        <p className="text-[10px] text-red-500 font-medium ml-1">{errors[f.id as keyof typeof formData]}</p>
                      )}
                    </div>
                  ))}

                  <Button type="submit" className="w-full eco-gradient h-12 mt-4 font-bold shadow-lg shadow-primary/20">
                    เข้าสู่ระบบ <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                <p className="text-center text-sm mt-6">
                  ยังไม่มีบัญชี?{" "}
                  <Link to="/register" className="text-primary font-bold hover:underline">สมัครสมาชิก</Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
