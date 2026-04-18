import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightLeft, Shield, Star, Leaf, Search, Users, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

const FEATURES = [
  { icon: ArrowRightLeft, title: "แลกเปลี่ยนสิ่งของ", desc: "โพสต์สิ่งของที่ไม่ใช้แล้ว ระบุสิ่งที่ต้องการแลก ระบบจะจับคู่ให้อัตโนมัติ" },
  { icon: Search, title: "ค้นหาและจับคู่อัจฉริยะ", desc: "วิเคราะห์ความเหมาะสมและแนะนำคู่แลกเปลี่ยนที่ดีที่สุด" },
  { icon: Shield, title: "ระบบยืนยันตัวตน", desc: "รหัส PIN ความปลอดภัย เปิดเผยข้อมูลเมื่อทั้งสองฝ่ายยืนยันเท่านั้น" },
  { icon: Star, title: "ระบบรีวิวและคะแนน", desc: "ให้คะแนนและรีวิวหลังแลกเปลี่ยนสำเร็จ สร้างความน่าเชื่อถือ" },
  { icon: Users, title: "ชุมชนที่ยั่งยืน", desc: "เชื่อมต่อผู้คนที่ต้องการลดขยะและสร้างคุณค่าใหม่จากสิ่งของเดิม" },
];

const STEPS = [
  "สมัครสมาชิกและยืนยันอีเมล",
  "โพสต์สิ่งของที่ต้องการแลกเปลี่ยน",
  "ค้นหาหรือรอระบบจับคู่อัตโนมัติ",
  "ยืนยันการแลกเปลี่ยนและนัดพบ",
  "แลกของสำเร็จ ให้คะแนนรีวิว!",
];

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-6">
            <img src={logo} alt="Tradin Logo" className="w-20 sm:w-24 h-auto mx-auto" loading="lazy" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              เกี่ยวกับ Tradin<span className="text-primary">.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              แพลตฟอร์มแลกเปลี่ยนสิ่งของออนไลน์ ที่ช่วยลดขยะ สร้างคุณค่าใหม่ และเชื่อมต่อชุมชนที่ยั่งยืน
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10 text-center">ฟีเจอร์หลัก</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                  <CardContent className="p-6 sm:p-8 flex gap-5 items-start">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors duration-300">
                      <f.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 sm:py-24 bg-muted/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10 text-center">วิธีการใช้งาน</h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              {STEPS.map((step, idx) => (
                <div key={idx} className="flex items-center gap-5 group bg-background rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-all">
                  <div className="h-10 w-10 rounded-full eco-gradient flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <span className="text-sm font-black text-primary-foreground">{idx + 1}</span>
                  </div>
                  <span className="text-base font-medium group-hover:text-primary transition-colors">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center space-y-6">
            <Leaf className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-2xl sm:text-3xl font-bold">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
            <p className="text-muted-foreground italic text-lg">"เพราะของที่คุณไม่ใช้ อาจเป็นสิ่งที่คนอื่นตามหา"</p>
            <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold eco-gradient shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all" asChild>
              <Link to="/register">เริ่มต้นใช้งาน <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
