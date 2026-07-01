import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  MoreHorizontal, Cpu, Smartphone, Paperclip, 
  BookOpen, ShoppingBag, Home, Wrench, Dribbble 
} from "lucide-react";
import { getCategories } from "@/api/api";

interface DBCategory {
  category_id: number;     // ✅ ใช้พิมพ์เล็กตาม Console ของคุณ
  category_name: string;   // ✅ ใช้พิมพ์เล็กตาม Console ของคุณ
}

const CATEGORY_COLORS = [
  "bg-blue-500/10 text-blue-500",
  "bg-green-500/10 text-green-500",
  "bg-purple-500/10 text-purple-500",
  "bg-orange-500/10 text-orange-500",
  "bg-pink-500/10 text-pink-500",
  "bg-teal-500/10 text-teal-500",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "อุปกรณ์อิเล็กทรอนิกส์และไอที": Cpu,
  "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์": Smartphone,
  "อุปกรณ์สำนักงานและการเรียน": Paperclip,
  "หนังสือและสื่อการเรียนรู้": BookOpen,
  "ของใช้ในชีวิตประจำวัน": ShoppingBag,
  "ของใช้ภายในบ้าน": Home,
  "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก": Wrench,
  "อุปกรณ์กีฬาและสันทนาการ": Dribbble
};

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
    <div className="min-h-screen bg-background flex flex-col select-none">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 sm:py-16 bg-muted/20 border-b border-border/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">หมวดหมู่สิ่งของ</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              สรุปรายการสิ่งของที่มีในระบบปัจจุบัน พร้อมจำนวนรายการในแต่ละหมวด
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {categoriesList.map((cat, i) => {
                  const name = cat.category_name || ""; // ✅ ดึงผ่านพิมพ์เล็ก
                  const Icon = CATEGORY_ICONS[name] || MoreHorizontal;
                  const colorClass = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

                  return (
                    <Card key={cat.category_id || i} className="border-border/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                      <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center space-y-3">
                        <div className={`h-14 w-14 rounded-xl ${colorClass} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                          <Icon className="h-7 w-7 shrink-0" />
                        </div>
                        <div className="space-y-1.5 w-full">
                          <h3 className="font-bold text-xs sm:text-sm leading-tight min-h-[2.5rem] flex items-center justify-center line-clamp-2">
                            {name}
                          </h3>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary/50 text-[10px] font-bold text-muted-foreground">
                            รายการ
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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