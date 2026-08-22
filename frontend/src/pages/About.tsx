import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRightLeft, 
  ShieldCheck, 
  Search, 
  ArrowRight,
  Leaf,
  Users
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

const FEATURES = [
  {
    icon: Search,
    title: "ระบบจับคู่อัจฉริยะ",
    desc: "ค้นหาสิ่งของที่คุณต้องการ และแนะนำของที่คุณสามารถนำไปแลกได้โดยอัตโนมัติ"
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัย เป็นส่วนตัว",
    desc: "ข้อมูลการติดต่อจะถูกเปิดเผยก็ต่อเมื่อทั้งสองฝ่ายกดยืนยันการแลกเปลี่ยนแล้วเท่านั้น"
  },
  {
    icon: ArrowRightLeft,
    title: "จัดการง่ายในที่เดียว",
    desc: "ติดตามสถานะการแลกเปลี่ยน นัดหมาย และจัดการข้อเสนอทั้งหมดได้จากหน้าโปรไฟล์"
  },
  {
    icon: Users,
    title: "คอมมูนิตี้ที่ยั่งยืน",
    desc: "ร่วมเป็นส่วนหนึ่งในการลดขยะ และสร้างคุณค่าใหม่ให้กับสิ่งของที่ไม่ได้ใช้งานแล้ว"
  }
];

const STEPS = [
  {
    title: "สมัครและยืนยันตัวตน",
    desc: "สร้างบัญชีผู้ใช้ฟรี พร้อมยืนยันอีเมลเพื่อความปลอดภัยของคอมมูนิตี้"
  },
  {
    title: "ลงประกาศสิ่งของ",
    desc: "ถ่ายรูปสิ่งของที่คุณไม่ใช้แล้ว พร้อมระบุสิ่งที่คุณกำลังมองหา"
  },
  {
    title: "รอระบบจับคู่ หรือค้นหาเอง",
    desc: "ค้นหาของที่ถูกใจเพื่อยื่นข้อเสนอ หรือรอให้คนอื่นมาเสนอของแลกกับคุณ"
  },
  {
    title: "ยืนยันและนัดแลกเปลี่ยน",
    desc: "ตกลงสถานที่ นัดหมาย และแลกเปลี่ยนของกันได้เลย"
  }
];

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        {/* 🌿 1. HERO SECTION (Minimal & Typography Focused) */}
        <section className="pt-28 pb-20 md:pt-40 md:pb-32 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <img 
              src={logo} 
              alt="Tradin Logo" 
              className="w-16 h-auto mx-auto drop-shadow-sm opacity-90" 
              loading="lazy" 
            />
            
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.2] lg:leading-[1.15] tracking-tight text-foreground text-balance mb-4 sm:mb-6 w-full">
  เปลี่ยนของที่คุณไม่ใช้ <br className="hidden lg:block" />
  ให้เป็นสิ่งที่<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">มีค่า</span>สำหรับคนอื่น
</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Tradin พื้นที่สำหรับแลกเปลี่ยนสิ่งของ สร้างคุณค่าใหม่ให้ของเดิม 
                ใช้งานง่าย ปลอดภัย และไม่มีค่าใช้จ่าย
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 text-sm font-semibold transition-transform hover:-translate-y-0.5" asChild>
                <Link to="/register">
                  เริ่มต้นใช้งานฟรี
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 text-sm font-semibold" asChild>
                <Link to="/feed">ดูรายการสิ่งของ</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 🎯 2. FEATURES (Clean Grid) */}
        <section className="py-24 bg-muted/30 border-y border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-16 md:text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">ออกแบบมาเพื่อให้การแลกเปลี่ยนเป็นเรื่องง่าย</h2>
              <p className="text-muted-foreground">ฟีเจอร์ที่คิดมาเพื่อตอบโจทย์ทั้งความสะดวกและความปลอดภัยของคุณ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Card key={i} className="bg-card/50 border-border/50 shadow-none hover:bg-card hover:shadow-sm transition-all duration-300">
                    <CardContent className="p-8 flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          {feature.desc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 🛣️ 3. HOW IT WORKS (Minimal Timeline) */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-16 md:text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">เริ่มต้นได้ใน 4 ขั้นตอน</h2>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {STEPS.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline Dot */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted text-muted-foreground font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {idx + 1}
                  </div>
                  
                  {/* Content Box */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-card border border-border/50 p-6 rounded-2xl shadow-sm transition-all hover:border-primary/30 hover:shadow-md ml-4 md:ml-0">
                    <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 🚀 4. CALL TO ACTION (Soft & Elegant) */}
        <section className="py-24 bg-card border-t border-border/50 text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-8">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Leaf className="w-8 h-8" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                พร้อมแลกเปลี่ยนของชิ้นแรกหรือยัง?
              </h2>
              <p className="text-muted-foreground text-lg">
                เข้าร่วมชุมชนของเราวันนี้ เพื่อส่งต่อและค้นหาสิ่งของที่คุณต้องการ
              </p>
            </div>

            <Button size="lg" className="rounded-full px-10 h-12 text-sm font-semibold transition-transform hover:-translate-y-0.5" asChild>
              <Link to="/register">
                สร้างบัญชีผู้ใช้ใหม่
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}