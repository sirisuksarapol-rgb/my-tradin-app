import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Shield, Users, BookOpen,
  Grid3X3, Recycle, Leaf, Sparkles, TrendingUp, Globe, Heart
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroIllustration from "@/assets/hero-illustration.png";

const FEATURES = [
  { icon: Recycle, title: "แลกเปลี่ยนสิ่งของ", desc: "นำสิ่งของที่ไม่ใช้แล้วมาแลกเปลี่ยนกับผู้อื่น ลดขยะ สร้างคุณค่าใหม่" },
  { icon: Shield, title: "ปลอดภัยและน่าเชื่อถือ", desc: "ระบบยืนยันตัวตนและรหัสความปลอดภัยเพื่อการแลกเปลี่ยนที่มั่นใจ" },
  { icon: Users, title: "ชุมชนที่ยั่งยืน", desc: "เข้าร่วมกับผู้ใช้ที่ใส่ใจสิ่งแวดล้อมและต้องการสร้างการเปลี่ยนแปลง" },
];

const QUICK_LINKS = [
  { to: "/about", icon: BookOpen, title: "คำอธิบายภาพรวมระบบ", desc: "เรียนรู้ว่า Tradin ทำงานอย่างไร" },
  { to: "/categories", icon: Grid3X3, title: "ตรวจสอบหมวดหมู่สิ่งของ", desc: "สำรวจสิ่งของที่มีในระบบก่อนสมัคร" },
];



export default function Index() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              {/* Left: Content */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left order-2 lg:order-1">
                <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary mb-6 sm:mb-8 shadow-sm">
                  <Sparkles size={14} className="animate-pulse sm:w-4 sm:h-4" />
                  แพลตฟอร์มแลกเปลี่ยนที่ยั่งยืน
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.2] lg:leading-[1.15] tracking-tight text-foreground text-balance mb-4 sm:mb-6 w-full">
                  ให้สิ่งของเก่า <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">ได้ชีวิตใหม่</span> กับ Tradin
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-xl leading-relaxed text-balance">
                  เปลี่ยนของที่คุณไม่ได้ใช้ ให้กลายเป็นของที่มีค่าสำหรับผู้อื่น ลดขยะ สร้างคุณค่าใหม่ และร่วมเป็นส่วนหนึ่งของชุมชนที่ใส่ใจสิ่งแวดล้อม
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <Button size="lg" className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-semibold eco-gradient shadow-lg sm:shadow-xl shadow-primary/25 transition-all hover:-translate-y-1 w-full sm:w-auto" asChild>
                    <Link to="/register">เริ่มต้นใช้งานฟรี <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" /></Link>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-semibold border-border transition-all w-full sm:w-auto" asChild>
                    <Link to="/about">ดูภาพรวมระบบ</Link>
                  </Button>
                </div>
              </div>

              {/* Right: Illustration */}
              <div className="lg:pl-10 order-1 lg:order-2 px-4 sm:px-8 lg:px-0 mt-4 lg:mt-0">
                <div className="relative group max-w-md mx-auto lg:max-w-none">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-3xl rotate-3 scale-[1.03] transition-transform duration-500 group-hover:rotate-6" />
                  <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 to-primary/5 rounded-3xl -rotate-3 scale-[1.03] transition-transform duration-500 group-hover:-rotate-6" />
                  <img
                    src={heroIllustration}
                    alt="ชุมชนแลกเปลี่ยนสิ่งของ Tradin"
                    className="relative w-full h-auto object-cover rounded-3xl shadow-xl sm:shadow-2xl shadow-foreground/10 border border-border/50 bg-background"
                    width={1024}
                    height={768}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Features Grid */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">ฟีเจอร์เด่นของเรา</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">ขับเคลื่อนเศรษฐกิจหมุนเวียนให้เกิดขึ้นจริง ด้วยระบบที่ออกแบบมาเพื่อคุณ</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {FEATURES.map((item) => (
                <Card key={item.title} className="glass-card overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 group h-full hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-8 space-y-5 text-center flex flex-col items-center h-full">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 shrink-0">
                      <item.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">เริ่มต้นง่ายๆ ใน 3 ขั้นตอน</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">ไม่มีค่าใช้จ่าย ไม่ต้องติดตั้ง เริ่มได้ทันที</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "สมัครสมาชิก", desc: "สร้างบัญชีฟรีด้วยอีเมลของคุณ ยืนยันตัวตนผ่าน OTP", icon: TrendingUp },
                { step: "02", title: "โพสต์สิ่งของ", desc: "ถ่ายรูปสิ่งของที่ต้องการแลก ระบุรายละเอียดและหมวดหมู่", icon: Recycle },
                { step: "03", title: "แลกเปลี่ยน!", desc: "ระบบจับคู่ให้อัตโนมัติ ยืนยันและนัดพบเพื่อแลกของ", icon: Heart },
              ].map((item) => (
                <div key={item.step} className="relative text-center space-y-4 p-6">
                  <div className="text-5xl font-black text-primary/10">{item.step}</div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">สำรวจเพิ่มเติม</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {QUICK_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="group block outline-none">
                  <Card className="glass-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/40 h-full">
                    <CardContent className="flex items-center gap-6 p-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                        <link.icon className="h-8 w-8 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{link.title}</h3>
                        <p className="text-sm text-muted-foreground">{link.desc}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border shadow-sm group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all shrink-0">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-primary/5">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
            <Leaf className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">พร้อมเริ่มต้นหรือยัง?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">เข้าร่วมชุมชนของเราวันนี้ และเป็นส่วนหนึ่งของการเปลี่ยนแปลงที่ยั่งยืน</p>
            <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold eco-gradient shadow-xl shadow-primary/25 transition-all hover:-translate-y-1" asChild>
              <Link to="/register">สมัครสมาชิกฟรี <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
