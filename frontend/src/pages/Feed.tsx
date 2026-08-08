import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  ArrowLeftRight, 
  MapPin, 
  SlidersHorizontal, 
  Sparkles, 
  X,
  PackageCheck,
  Flame,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { 
  getCategories as fetchCategoriesAPI, 
  getItems as fetchItemsAPI, 
  IMAGE_BASE_URL 
} from "@/api/api";
import { CATEGORY_ICONS } from "@/lib/categories_data";

interface DBCategory {
  CategoryID: number;
  CategoryName: string;
}

interface DBItem {
  ItemID?: number;
  item_id?: number;
  ItemName?: string;
  item_name?: string;
  DesiredItem?: string;
  desired_item?: string;
  CategoryID?: number;
  category_id?: number;
  MeetingLocation?: string;
  meeting_location?: string;
  image_path?: string;
  image_name?: string;
  ItemImage?: string;
  DisplayName?: string;
  ProfileImage?: string;
}

interface FormattedPost {
  id: string | number;
  name: string;
  desired: string;
  catId: string | number;
  location: string;
  imgUrl: string;
  ownerName: string;
  ownerAvatar?: string;
}

// 🌟 Carousel สำหรับไฮไลท์สิ่งของน่าสนใจ (Hero Spotlight)
const FeaturedCarousel = ({ items }: { items: FormattedPost[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🎲 Logic สุ่มของ 5 ชิ้นไม่ซ้ำกันจากรายการทั้งหมด
  const featuredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    // คัดลอก Array ออกมาเพื่อไม่ให้กระทบข้อมูลหลัก แล้วทำการ Random Shuffle
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    
    // ดึงมาแสดงผลสูงสุด 5 รายการ
    return shuffled.slice(0, 5);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth;
      const newScrollLeft = direction === "left" 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth"
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const newIndex = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(newIndex);
    }
  };

  if (featuredItems.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header ของสไลด์ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Flame className="w-4 h-4 fill-primary/20" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            รายการแนะนำน่าแลกวันนี้
          </h2>
        </div>

        {/* ปุ่มเลื่อน Slide */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-30"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-30"
            disabled={currentIndex === featuredItems.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* สไลเดอร์ คอนเทนเนอร์ */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-3xl"
      >
        {featuredItems.map((item, idx) => (
          <div 
            key={`featured-${item.id}-${idx}`}
            className="min-w-full md:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] snap-start shrink-0"
          >
            <Link to={`/post/${item.id}`} className="block group">
              <div className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-border/50 bg-card group-hover:border-primary/40 transition-all duration-300">
                <img 
                  src={item.imgUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-background/90 backdrop-blur-md text-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    สุ่มแนะนำ
                  </span>
                </div>

                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 text-white">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <span className="truncate">{item.ownerName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary-foreground transition-colors">
                    {item.name}
                  </h3>

                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white/90 w-full">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-medium text-white/70 shrink-0">อยากแลก:</span>
                    <span className="font-medium truncate">{item.desired}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center items-center gap-1.5 pt-1">
        {featuredItems.map((_, idx) => (
          <div 
            key={`dot-${idx}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx ? "w-6 bg-primary" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// 🌟 Skeleton Loader
const ItemSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border/40 animate-pulse">
    <div className="w-full aspect-[4/3] bg-muted/60"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted/80 rounded-md w-3/4"></div>
      <div className="h-12 bg-muted/40 rounded-xl w-full"></div>
      <div className="flex justify-between pt-2">
        <div className="h-3 bg-muted/60 rounded w-1/3"></div>
        <div className="h-3 bg-muted/60 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

// 🌟 Item Card
const ItemCard = memo(({ post }: { post: FormattedPost }) => {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block group">
      <Card className="h-full overflow-hidden border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col">
        <div className="w-full aspect-[4/3] bg-muted/30 relative overflow-hidden">
          <img 
            src={imgSrc} 
            alt={post.name} 
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out" 
            onError={() => { 
              if (imgSrc !== "/placeholder.jpg") setImgSrc("/placeholder.jpg"); 
            }}
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/40 text-[11px] font-medium text-foreground shadow-sm">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary overflow-hidden shrink-0">
              {post.ownerAvatar ? (
                <img src={`${IMAGE_BASE_URL}/uploads/${post.ownerAvatar}`} alt="" className="w-full h-full object-cover" />
              ) : (
                post.ownerName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="truncate max-w-[80px] text-muted-foreground">{post.ownerName}</span>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1 justify-between space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-base leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {post.name}
            </h3>

            <div className="bg-muted/40 border border-border/40 rounded-xl p-2.5 flex items-start gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  อยากแลกกับ
                </span>
                <p className="font-medium text-foreground truncate">
                  {post.desired}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{post.location}</span>
            </div>
            <span className="text-[10px] text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-md shrink-0">
              พร้อมแลก
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default function Feed() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  
  const [itemsList, setItemsList] = useState<DBItem[]>([]);
  const [categoryList, setCategoryList] = useState<DBCategory[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [itemsRes, catRes] = await Promise.all([fetchItemsAPI(), fetchCategoriesAPI()]);
        setItemsList(itemsRes.data || []);
        setCategoryList(catRes.data || []);
      } catch (error) { 
        console.error("Error fetching data:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    loadData();
  }, []);

  const itemsWithUrls = useMemo<FormattedPost[]>(() => {
    if (!Array.isArray(itemsList)) return [];
    
    return itemsList.map((item, index) => {
      const rawImageStr = item.image_name || item.ItemImage || item.image_path;
      let imageUrl = "/placeholder.jpg";
      
      if (rawImageStr) {
        const firstImage = rawImageStr.includes(',') 
          ? rawImageStr.split(',')[0].trim() 
          : rawImageStr.trim();

        if (firstImage.startsWith('http')) {
          imageUrl = firstImage;
        } else if (firstImage.startsWith('[')) {
          try {
            const parsed = JSON.parse(firstImage);
            imageUrl = parsed[0] || "/placeholder.jpg";
          } catch {
            // fallback
          }
        } else {
          imageUrl = `${IMAGE_BASE_URL}/uploads/${firstImage}`;
        }
      }

      return {
        id: item.ItemID || item.item_id || `fallback-id-${index}`,
        name: item.ItemName || item.item_name || "ไม่ระบุชื่อสิ่งของ",
        desired: item.DesiredItem || item.desired_item || "เปิดรับข้อเสนอทั้งหมด",
        catId: item.CategoryID || item.category_id || 0,
        location: item.MeetingLocation || item.meeting_location || "นัดรับตามตกลง",
        imgUrl: imageUrl,
        ownerName: item.DisplayName || "สมาชิก Tradin",
        ownerAvatar: item.ProfileImage
      };
    });
  }, [itemsList]);

  const filtered = useMemo(() => {
    return itemsWithUrls.filter((p) => {
      const matchCat = selectedCategory === "ทั้งหมด" || String(p.catId) === String(selectedCategory);
      const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (p.desired || "").toLowerCase().includes(search.toLowerCase());
      
      return matchCat && matchSearch;
    });
  }, [itemsWithUrls, selectedCategory, search]);

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedCategory("ทั้งหมด");
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-16">
        
        {/* Header & Search Section */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                ตลาดแลกเปลี่ยนสิ่งของ
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ค้นหาสิ่งของที่คุณต้องการ แล้วนำของที่คุณไม่ใช้มาเสนอแลกได้ทันที
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-muted/50 border border-border/50 px-3 py-1.5 rounded-xl text-xs text-muted-foreground self-start md:self-auto">
              <PackageCheck className="w-4 h-4 text-primary" />
              <span>มีรายการพร้อมแลกทั้งหมด <strong className="text-foreground font-semibold">{itemsWithUrls.length}</strong> ชิ้น</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              className="w-full h-12 sm:h-13 pl-11 pr-24 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="ค้นหาชื่อของ หรือสิ่งที่ต้องการแลก..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(searchInput);
              }}
            />
            {searchInput && (
              <button 
                onClick={() => { setSearchInput(""); setSearch(""); }} 
                className="absolute right-20 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Button 
              onClick={() => setSearch(searchInput)}
              className="absolute right-1.5 h-9 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-medium"
            >
              ค้นหา
            </Button>
          </div>
        </section>

        {/* 🌟 FEATURED CAROUSEL SECTION (เพิ่มเข้ามาใหม่เพื่อลดความโล่ง) */}
        {!isLoading && itemsWithUrls.length > 0 && !search && selectedCategory === "ทั้งหมด" && (
          <section className="pt-2">
            <FeaturedCarousel items={itemsWithUrls} />
          </section>
        )}

        {/* Category Pill Filters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>หมวดหมู่สิ่งของ</span>
            {(selectedCategory !== "ทั้งหมด" || search) && (
              <button 
                onClick={clearFilters}
                className="text-primary hover:underline flex items-center gap-1 font-normal lowercase"
              >
                <X className="w-3 h-3" /> ล้างตัวกรอง
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["ทั้งหมด", ...categoryList].map((catObj, index) => {
              const isAll = catObj === "ทั้งหมด";
              const catName = isAll ? "ทั้งหมด" : (catObj as DBCategory).CategoryName;
              const catId = isAll ? "ทั้งหมด" : (catObj as DBCategory).CategoryID;
              const isActive = selectedCategory === String(catId);
              const Icon = isAll ? SlidersHorizontal : (CATEGORY_ICONS[catName as keyof typeof CATEGORY_ICONS] || Sparkles);

              return (
                <button
                  key={`cat-${catId}-${index}`}
                  onClick={() => setSelectedCategory(String(catId))}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Items Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {search ? `ผลการค้นหา "${search}"` : selectedCategory !== "ทั้งหมด" ? "รายการในหมวดหมู่นี้" : "รายการทั้งหมด"}
            </h2>
            <span className="text-xs text-muted-foreground">พบ {filtered.length} รายการ</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ItemSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border/80 p-8 space-y-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">ไม่พบรายการที่คุณกำลังค้นหา</h3>
                <p className="text-sm text-muted-foreground">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะเพื่อน</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl">
                ดูรายการทั้งหมด
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((post) => (
                <ItemCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  );
}