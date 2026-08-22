import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCategories } from "@/api/api";
import { getCategoryIcon } from "@/utils/iconMapping";
import { Sparkles, Layers } from "lucide-react";

interface DBCategory {
  CategoryID: number;
  CategoryName: string;
  IconName: string;
  ItemCount?: number;
}

// โทนสีละมุน สไตล์ Minimal
const CATEGORY_STYLES = [
  "bg-blue-50/60 text-blue-600 border-blue-100/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40",
  "bg-emerald-50/60 text-emerald-600 border-emerald-100/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40",
  "bg-purple-50/60 text-purple-600 border-purple-100/60 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40",
  "bg-amber-50/60 text-amber-600 border-amber-100/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
  "bg-rose-50/60 text-rose-600 border-rose-100/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40",
  "bg-cyan-50/60 text-cyan-600 border-cyan-100/60 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/40",
];

export default function Categories() {
  const [categoriesList, setCategoriesList] = useState<DBCategory[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setIsLoading(true);
        const response = await getCategories();
        if (response && response.data) {
          setCategoriesList(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategoriesData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background flex flex-col font-sans text-foreground selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />

        {/* 🚀 Hero Section */}
        <section className="pt-24 pb-10 md:pt-32 md:pb-16 px-4">
          <div className="mx-auto max-w-3xl text-center space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-card border border-black/5 dark:border-white/10 shadow-sm text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Discover Items by Category
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.2] lg:leading-[1.15] tracking-tight text-foreground text-balance mb-3 sm:mb-5 w-full">
              เลือกดูสิ่งของตาม <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                หมวดหมู่ที่คุณสนใจ
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              จัดระเบียบทุกไอเทมเพื่อให้คุณค้นพบสิ่งของที่ใช่ และแลกเปลี่ยนได้อย่างตรงใจที่สุด
            </p>
          </div>
        </section>

        {/* 🧩 Categories Grid */}
        <section className="pb-28 px-4">
          <div className="mx-auto max-w-5xl">
            {isLoading ? (
              // 🌟 Skeleton Loading
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-card/40 border border-black/5 dark:border-white/5 rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 h-[160px] sm:h-[180px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-muted/60 mb-3" />
                    <div className="w-20 sm:w-24 h-3.5 bg-muted/60 rounded-full mb-2" />
                    <div className="w-12 h-2.5 bg-muted/40 rounded-full" />
                  </div>
                ))}
              </div>
            ) : categoriesList.length === 0 ? (
              // 📭 Empty State
              <div className="text-center py-16 bg-white dark:bg-card/30 rounded-2xl border border-dashed border-border/60 max-w-xl mx-auto">
                <Layers className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-base font-medium text-foreground">ยังไม่มีหมวดหมู่ในระบบ</p>
                <p className="text-xs text-muted-foreground mt-1">กลับมาตรวจสอบใหม่ในภายหลัง</p>
              </div>
            ) : (
              // ✨ Content Grid (Unclickable Tile)
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {categoriesList.map((cat, i) => {
                  const name = cat.CategoryName || "";
                  const Icon = getCategoryIcon(cat.IconName);
                  const styleClass = CATEGORY_STYLES[i % CATEGORY_STYLES.length];

                  return (
                    // เปลี่ยนจาก <Link> มาใช้ <div> พร้อมเพิ่ม select-none กันคนคลุมดำข้อความ
                    <div 
                      key={cat.CategoryID || i}
                      className="group outline-none animate-in fade-in zoom-in-95 duration-500 fill-mode-both cursor-default block h-full select-none"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="relative h-full bg-white dark:bg-card/40 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_24px_-10px_rgba(255,255,255,0.03)] hover:border-primary/30 overflow-hidden isolate">
                        
                        {/* Light Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                        {/* Icon Box */}
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[4deg] ${styleClass}`}>
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
                        </div>
                        
                        {/* Content Area */}
                        <div className="space-y-2 w-full mt-auto">
                          <h3 className="font-bold text-sm sm:text-base tracking-tight leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {name}
                          </h3>
                          
                          {/* Badge จำนวนไอเทม */}
                          <div className="inline-flex items-center justify-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-muted/50 dark:bg-muted/20 border border-black/5 dark:border-white/5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                            {cat.ItemCount ?? 0} ไอเทม
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}