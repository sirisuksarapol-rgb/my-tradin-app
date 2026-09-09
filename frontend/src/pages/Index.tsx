import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, BookOpen, Grid3X3, Recycle, Sparkles, ChevronLeft, ChevronRight, Layers, ShieldCheck, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCategories } from "@/api/api";
import { getCategoryIcon } from "@/utils/iconMapping";
import heroIllustration from "@/assets/hero-illustration.png";
import peopleMeetingBarter from "@/assets/people-meeting-barter-event-exchange-goods.jpg";
import sideViewSmiley from "@/assets/side-view-smiley-friends-flea-market.jpg";
import barterAvif from "@/assets/people-meeting-barter-event-exchange-goods_23-2150208178.avif";
import dynamicImage from "@/assets/images - 2026-09-07T205513.769.jpg";
import coverImage from "@/assets/62287bc33c154d777e299c8d_800x0xcover_XrsGdXdc.jpg";
import { Highlighter } from "@/components/highlighter";

interface DBCategory {
  CategoryID: number;
  CategoryName: string;
  IconName: string;
  ItemCount?: number;
}

const CAROUSEL_SLIDES = [
  {
    image: heroIllustration,
    title: "ระบบแลกเปลี่ยนสิ่งของ (Item Circulation System)",
    desc: "สื่อกลางให้ผู้ใช้งานนำสิ่งของที่ไม่ใช้แล้วมาแลกเปลี่ยนกัน ช่วยลดขยะและเพิ่มความคุ้มค่าสูงสุด"
  },
  {
    image: peopleMeetingBarter,
    title: "ลดค่าใช้จ่ายและสร้างความยั่งยืน",
    desc: "ไม่ใช่การซื้อขายด้วยเงินหรืออาหาร แต่เป็นการแบ่งปันสิ่งของในสภาพดีเพื่อประโยชน์ร่วมกัน"
  },
  {
    image: sideViewSmiley,
    title: "หลากหลายหมวดหมู่ครอบคลุม",
    desc: "รองรับทั้งอุปกรณ์อิเล็กทรอนิกส์ หนังสือ อุปกรณ์การเรียน ของใช้ในบ้าน และอื่นๆ อีกมากมาย"
  },
  {
    image: barterAvif,
    title: "ระบบค้นหาและจับคู่อัจฉริยะ",
    desc: "ประมวลผลข้อความภาษาไทยด้วย PyThaiNLP และอัลกอริทึม BM25 เพื่อการค้นหาที่แม่นยำ"
  },
  {
    image: dynamicImage,
    title: "ปลอดภัยและเป็นส่วนตัว",
    desc: "ข้อมูลการติดต่อจะแสดงต่อเมื่อทั้งสองฝ่ายกดยืนยันการแลกเปลี่ยนสำเร็จแล้วเท่านั้น"
  },
  {
    image: coverImage,
    title: "ร่วมเป็นส่วนหนึ่งของคอมมูนิตี้",
    desc: "ติดตามสถานะ นัดหมาย และสร้างคุณค่าใหม่ให้กับสิ่งของที่ไม่ใช้งานแล้วไปพร้อมกัน"
  }
];

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
    icon: Recycle,
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
    desc: "สร้างบัญชีผู้ใช้ฟรี พร้อมยืนยันอีเมลภายใน 30 นาทีเพื่อความปลอดภัย"
  },
  {
    title: "ลงประกาศสิ่งของ",
    desc: "ถ่ายรูปสินค้า 3-6 รูป พร้อมระบุรายละเอียดและสิ่งของที่ต้องการแลกเปลี่ยน"
  },
  {
    title: "รอระบบจับคู่ หรือค้นหาเอง",
    desc: "ระบบแนะนำคู่แลกเปลี่ยนพร้อมแสดงคะแนนความน่าเชื่อถือ"
  },
  {
    title: "ยืนยันและนัดแลกเปลี่ยน",
    desc: "ตกลงสถานที่ นัดหมาย และแลกเปลี่ยนของกันได้เลย"
  }
];

const CATEGORY_STYLES = [
  "bg-blue-50/60 text-blue-600 border-blue-100/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40",
  "bg-emerald-50/60 text-emerald-600 border-emerald-100/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40",
  "bg-purple-50/60 text-purple-600 border-purple-100/60 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40",
  "bg-amber-50/60 text-amber-600 border-amber-100/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
  "bg-rose-50/60 text-rose-600 border-rose-100/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40",
  "bg-cyan-50/60 text-cyan-600 border-cyan-100/60 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/40",
];

export default function Index() {
  const location = useLocation();
  const [categoriesList, setCategoriesList] = useState<DBCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [categoryPage, setCategoryPage] = useState<number>(0);
  const itemsPerPage = 8;

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await getCategories();
        if (response && response.data) {
          setCategoriesList(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories for index:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const totalCategoryPages = Math.ceil(categoriesList.length / itemsPerPage);
  const currentCategories = categoriesList.slice(
    categoryPage * itemsPerPage,
    (categoryPage + 1) * itemsPerPage
  );

  const nextCategoryPage = () => {
    setCategoryPage((prev) => (prev + 1) % (totalCategoryPages || 1));
  };

  const prevCategoryPage = () => {
    setCategoryPage((prev) => (prev - 1 + (totalCategoryPages || 1)) % (totalCategoryPages || 1));
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col overflow-x-hidden font-sans scroll-smooth">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION WITH CAROUSEL & CAPTIONS */}
        <section id="hero" className="relative w-full pt-28 pb-12 flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 bg-gradient-to-b from-muted/30 to-background">
          <div className="relative w-full max-w-6xl h-[52vh] sm:h-[60vh] flex items-center justify-center group mt-2">
            {CAROUSEL_SLIDES.map((slide, index) => {
              const diff = (index - currentSlide + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length;
              
              let styleClass = "opacity-0 scale-75 pointer-events-none z-0 translate-x-full";
              if (diff === 0) {
                styleClass = "opacity-100 scale-100 z-30 translate-x-0 shadow-2xl pointer-events-auto";
              } else if (diff === 1) {
                styleClass = "opacity-50 scale-90 z-20 translate-x-[25%] sm:translate-x-[30%] pointer-events-none blur-[2px]";
              } else if (diff === CAROUSEL_SLIDES.length - 1) {
                styleClass = "opacity-50 scale-90 z-20 -translate-x-[25%] sm:-translate-x-[30%] pointer-events-none blur-[2px]";
              }

              return (
                <div
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden border border-border/60 bg-card transition-all duration-700 ease-in-out cursor-pointer ${styleClass}`}
                >
                  <img
                    src={slide.image}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-12 text-white">
                    <h3 className="text-xl sm:text-3xl font-extrabold mb-2 drop-shadow-md">
                      {slide.title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-200 max-w-2xl drop-shadow">
                      {slide.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 z-30">
            {CAROUSEL_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="text-center mt-6 z-30 max-w-3xl space-y-3 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs font-semibold text-primary backdrop-blur-md shadow-sm">
              <div className="w-3.5 h-3.5" />
              Welcome to Tradin - Your Sustainable Exchange Platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              ให้สิ่งของเก่า ได้ชีวิตใหม่กับ{" "}
              <Highlighter action="highlight" color="#a7f3d0" isView={true}>
                Tradin
              </Highlighter>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              เปลี่ยนของที่คุณไม่ได้ใช้ ให้กลายเป็นของที่มีค่าสำหรับผู้อื่น ลดขยะ สร้างคุณค่าใหม่ และร่วมเป็นส่วนหนึ่งของชุมชนที่ใส่ใจสิ่งแวดล้อม
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 z-30">
            <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold eco-gradient shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 w-full sm:w-auto" asChild>
              <Link to="/register">เริ่มต้นใช้งานฟรี <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <section id="categories" className="py-12 sm:py-16 bg-muted/20 border-y border-border/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary mb-3">
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Categories Overview
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                  <Highlighter action="highlight" color="#a7f3d0" isView={true}>
                    หมวดหมู่สิ่งของ
                  </Highlighter>ในระบบ
                </h2>
                <p className="text-muted-foreground mt-2">สำรวจรายการสิ่งของตามหมวดหมู่ที่มีในฐานข้อมูลจริง</p>
              </div>

              {totalCategoryPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={prevCategoryPage} className="w-10 h-10 rounded-full bg-card border border-border hover:border-primary text-foreground flex items-center justify-center shadow-sm transition-all hover:scale-105" aria-label="Previous Category Page">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold px-2 text-muted-foreground">{categoryPage + 1} / {totalCategoryPages}</span>
                  <button onClick={nextCategoryPage} className="w-10 h-10 rounded-full bg-card border border-border hover:border-primary text-foreground flex items-center justify-center shadow-sm transition-all hover:scale-105" aria-label="Next Category Page">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {isLoadingCategories ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-border/50 rounded-2xl p-5 h-36 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-muted mb-3" />
                    <div className="w-20 h-3.5 bg-muted rounded-full mb-2" />
                  </div>
                ))}
              </div>
            ) : categoriesList.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">ยังไม่มีข้อมูลหมวดหมู่ในระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-500">
                {currentCategories.map((cat, i) => {
                  const catName = cat.CategoryName || "";
                  const IconComponent = getCategoryIcon(cat.IconName);
                  const styleClass = CATEGORY_STYLES[i % CATEGORY_STYLES.length];

                  return (
                    <div key={cat.CategoryID || i} className="group block outline-none cursor-default">
                      <div className="h-full bg-card border border-border/60 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/30">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${styleClass}`}>
                          <IconComponent className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-base mb-1.5 text-foreground group-hover:text-primary transition-colors line-clamp-1">{catName}</h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {cat.ItemCount ?? 0} ไอเทม
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
                <BookOpen className="w-3.5 h-3.5" />
                System Overview
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                ออกแบบมาเพื่อให้การแลกเปลี่ยนเป็น{" "}
                <Highlighter action="highlight" color="#a7f3d0" isView={true}>เรื่องง่าย</Highlighter>
              </h2>
              <p className="text-muted-foreground">ฟีเจอร์และภาพรวมระบบที่คิดมาเพื่อตอบโจทย์ทั้งความสะดวกและความปลอดภัยของคุณ</p>
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
                        <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 sm:py-24 bg-muted/20 border-t border-border/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">
                เริ่มต้นได้ใน{" "}
                <Highlighter action="underline" color="#10b981" isView={true}>4 ขั้นตอน</Highlighter>
              </h2>
              <p className="text-muted-foreground">ขั้นตอนการทำงานที่ออกแบบให้ใช้งานง่าย ไม่มีค่าใช้จ่าย</p>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {STEPS.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted text-muted-foreground font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-card border border-border/50 p-6 rounded-2xl shadow-sm transition-all hover:border-primary/30 hover:shadow-md ml-4 md:ml-0">
                    <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-16 sm:py-24 bg-primary/5 border-t border-border/50 text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-6">
            <Recycle className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              พร้อมแลกเปลี่ยนของชิ้นแรกหรือยัง?
            </h2>
            <p className="text-muted-foreground text-lg">
              เข้าร่วมชุมชนของเราวันนี้ เพื่อส่งต่อและค้นหาสิ่งของที่คุณต้องการ
            </p>
            <Button size="lg" className="rounded-full px-10 h-14 text-base font-semibold eco-gradient shadow-xl shadow-primary/25 transition-all hover:-translate-y-1" asChild>
              <Link to="/register">
                สร้างบัญชีผู้ใช้ใหม่
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}