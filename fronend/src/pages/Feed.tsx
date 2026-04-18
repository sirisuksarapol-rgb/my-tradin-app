import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Star, ArrowRightLeft, Sparkles,
  LayoutGrid, TrendingUp, Package, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

// นำเข้าเฉพาะ Icon
import { CATEGORY_ICONS } from "@/lib/categories_data"; 

// นำเข้า API ดึงข้อมูล
import { categories as fetchCategoriesAPI, items as fetchItemsAPI, IMAGE_BASE_URL } from "@/api/api";

// ✅ ฟังก์ชันช่วยจัดการ URL รูปภาพให้แสดงผลได้ทุกรูปแบบ
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return "/placeholder.jpg";
  try {
    // 1. กรณีรูปเก็บเป็น JSON Array (เช่น ["https://..."])
    if (imagePath.startsWith('[')) {
      const parsed = JSON.parse(imagePath);
      return parsed[0] || "/placeholder.jpg"; 
    }
    // 2. กรณีเป็น URL เต็มๆ อยู่แล้ว
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // 3. กรณีเป็นชื่อไฟล์ที่อัปโหลดเข้า Backend ของเรา
    return `${IMAGE_BASE_URL}/uploads/${imagePath}`;
  } catch {
    return "/placeholder.jpg";
  }
};

export default function Feed() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [itemsList, setItemsList] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ดึงข้อมูลจาก Backend API เมื่อ Component โหลด
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const loadData = async () => {
      try {
        setIsLoading(true);
        // ดึงข้อมูลจากตาราง Item และ Category พร้อมกัน
        const [itemsResponse, categoriesResponse] = await Promise.all([
          fetchItemsAPI(),
          fetchCategoriesAPI()
        ]);
        
        setItemsList(itemsResponse.data); 
        setCategoryList(categoriesResponse.data); // เก็บหมวดหมู่ลง State
      } catch (error) {
        console.error("Error fetching data from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // กรองข้อมูล
  const filtered = itemsList.filter((p) => {
    const matchCat = selectedCategory === "ทั้งหมด" || p.category_name === selectedCategory;
    const matchSearch = (p.item_name || "").toLowerCase().includes(search.toLowerCase());
    
    // กรองไอเทมของตัวเองออก (ไม่แสดงของตัวเอง)
    const myId = user?.id || user?.member_id;
    const notMyPost = String(p.member_id) !== String(myId); 
    
    return matchCat && matchSearch && notMyPost;
  });

  // นำข้อมูลหมวดหมู่จาก DB มาต่อท้าย "ทั้งหมด"
  const allCategories = ["ทั้งหมด", ...categoryList.map(c => c.category_name)];

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Search */}
        <section className="relative rounded-3xl bg-gradient-to-br from-primary/8 to-accent/5 p-8 sm:p-12">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-56 h-56 bg-accent/5 rounded-full blur-3xl" />

          <div className="relative space-y-8 max-w-3xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles size={14} />
                แพลตฟอร์มแลกเปลี่ยนของ
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading text-foreground leading-tight">
                ค้นหาสิ่งของที่คุณสนใจ
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                ค้นหาสิ่งของที่ต้องการแลกเปลี่ยนจากชุมชนของเรา
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-700" />
              <div className="relative flex">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาสิ่งของที่คุณสนใจ..."
                  className="relative w-full h-14 pl-12 pr-28 rounded-2xl border-none bg-card shadow-sm ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/50 transition-all text-sm sm:text-base outline-none"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
                />
                <Button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-xl px-6"
                  onClick={() => setSearch(searchInput)}
                >
                  ค้นหา
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-card rounded-2xl border border-border shadow-sm relative overflow-visible">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground/80 font-heading">หมวดหมู่</h2>
            <span className="text-xs text-muted-foreground">หมวดหมู่ทั้งหมด</span>
          </div>

          <div className="relative w-full py-5">
            <button
              onClick={() => scroll("left")}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 bg-card border border-border rounded-full items-center justify-center shadow-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 gap-1"
            >
              {allCategories.map((cat) => {
                const Icon = cat === "ทั้งหมด" ? LayoutGrid : (CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || Sparkles);
                const isActive = selectedCategory === cat;

                return (
                  <div
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearch(""); setSearchInput(""); }}
                    className="flex flex-col items-center gap-2 min-w-[80px] w-[80px] sm:min-w-[100px] sm:w-[100px] cursor-pointer group snap-start shrink-0 py-1"
                  >
                    <div
                      className={`w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] rounded-2xl flex items-center justify-center transition-all duration-300 
                        ${isActive
                          ? "bg-primary/10 ring-2 ring-primary shadow-sm"
                          : "bg-muted/50 hover:bg-muted ring-1 ring-border/30 group-hover:scale-105"
                        }`}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isActive ? "text-primary" : "text-foreground/60 group-hover:text-foreground"}`}
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                    </div>
                    <span className={`text-[10px] sm:text-[11px] text-center leading-tight line-clamp-2 px-1 transition-colors ${isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {cat}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => scroll("right")}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 bg-card border border-border rounded-full items-center justify-center shadow-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>พบ <strong className="text-foreground">{filtered.length}</strong> รายการ</span>
              {selectedCategory !== "ทั้งหมด" && (
                <span className="hidden sm:inline">ในหมวด <strong className="text-foreground">{selectedCategory}</strong></span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>เรียงตามล่าสุด</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {filtered.map((post) => (
                  <Link key={post.item_id} to={`/post/${post.item_id}`} className="group h-full">
                    <Card className="border-border/50 bg-card overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                      <CardContent className="p-0 flex flex-col h-full">
                        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                          {/* ✅ ใช้งานฟังก์ชันดึงรูปภาพตรงนี้ */}
                          <img 
                            src={getImageUrl(post.image_path)}
                            alt={post.item_name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            loading="lazy" 
                            onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
                          />
                          <div className="absolute top-2.5 right-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card/90 backdrop-blur-md text-[10px] font-bold text-foreground shadow-sm">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {post.rating || "5.0"}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 sm:p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">{post.item_name}</h3>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/5 p-2 rounded-lg border border-primary/10">
                            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">แลก: {post.wanted_item}</span>
                          </div>
                          <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{post.meeting_location || "ไม่ระบุสถานที่"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border space-y-4">
                  <div className="text-5xl opacity-50">🔍</div>
                  <h3 className="text-foreground font-semibold text-lg font-heading">ไม่พบรายการที่คุณกำลังตามหา</h3>
                  <p className="text-sm text-muted-foreground">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูสิ</p>
                  <Button variant="outline" onClick={() => { setSearch(""); setSearchInput(""); setSelectedCategory("ทั้งหมด"); }} className="mt-4 rounded-full px-6">
                    ล้างการค้นหา
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}