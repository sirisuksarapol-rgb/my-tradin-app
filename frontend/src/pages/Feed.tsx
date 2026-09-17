import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, ArrowLeftRight, MapPin, Flame, ChevronLeft, ChevronRight, ArrowUpRight, ArrowRight} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { getItems as fetchItemsAPI, IMAGE_BASE_URL } from "@/api/api";

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

const ITEMS_PER_PAGE = 40;

const FeaturedCarousel = ({ items }: { items: FormattedPost[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const featuredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const shuffled = [...items].sort(() => 0.5 - Math.random());
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
    <div className="space-y-5">
      {/* 🔹 Header Section: ปรับให้ดูเป็น Section ระดับพรีเมียม */}
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
            รายการแลกเปลี่ยนล่าสุด
          </h2>
        </div>

        {/* 🔹 Custom Navigation Buttons: ปุ่มสไตล์มินิมอล */}
        <div className="flex items-center gap-2 mb-1">
          <button 
            onClick={() => scroll("left")}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border/60 bg-background/50 backdrop-blur-md text-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none disabled:hover:scale-100 shadow-sm"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border/60 bg-background/50 backdrop-blur-md text-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none disabled:hover:scale-100 shadow-sm"
            disabled={currentIndex === featuredItems.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🔹 Carousel Container: ปรับ Padding ไม่ให้โดนตัดเงา (Clipping) */}
      <div className="-mx-1 px-1 py-4 -my-4">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {featuredItems.map((item, idx) => (
            <div 
              key={`featured-${item.id}-${idx}`}
              className="w-[85vw] sm:w-[320px] md:w-[340px] lg:w-[380px] snap-start shrink-0"
            >
              <Link to={`/post/${item.id}`} className="block group outline-none">
                {/* 🔹 Card Body: ทรงสูง (Portrait) ดูแพงและทันสมัย */}
                <div className="relative h-[340px] sm:h-[380px] rounded-[2rem] overflow-hidden bg-muted/20 border border-border/40 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-500">
                  
                  {/* ภาพพื้นหลัง: แอนิเมชันซูมเข้าแบบสมูท (Cubic Bezier) */}
                  <img 
                    src={item.imgUrl} 
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                  />

                  {/* Gradient Overlay: ไล่ระดับสีดำจากฐานขึ้นไป เพื่อให้ตัวหนังสืออ่านง่ายเสมอ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                  {/* Icon Hover (Top Right): เด้งขึ้นมาตอนเอาเมาส์ชี้ */}
                  <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>

                  {/* Content Container (Bottom) */}
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end">
                    
                    {/* Meta Data: ผู้โพสต์ และ สถานที่ */}
                    <div className="flex items-center gap-2.5 text-white/80 text-xs font-medium mb-3">
                      <span className="truncate max-w-[120px]">{item.ownerName}</span>
                      <span className="w-1 h-1 rounded-full bg-white/40 shrink-0" />
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 opacity-70" />
                        {item.location}
                      </span>
                    </div>

                    {/* Item Title */}
                    <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight mb-5 line-clamp-2 drop-shadow-sm group-hover:text-primary-foreground transition-colors">
                      {item.name}
                    </h3>

                    {/* Desired Item Badge: ดีไซน์แบบ Glassmorphism (กระจกฝ้า) ลอยตัว */}
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 w-full transform group-hover:-translate-y-1 transition-transform duration-500">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <ArrowLeftRight className="w-4 h-4 text-slate-900" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-white/60 font-semibold uppercase tracking-widest mb-0.5 leading-none">
                          อยากแลกกับ
                        </p>
                        <p className="text-sm font-bold text-white truncate">
                          {item.desired}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ItemCard = memo(({ post }: { post: FormattedPost }) => {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block h-full outline-none group">
      <Card className="relative h-full flex flex-col overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm transition-all duration-500 ease-out hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 cursor-pointer">
        
        {/* รูปภาพ และ Floating Badge */}
        <div className="w-full aspect-[4/3] bg-muted/20 relative overflow-hidden">
          <img 
            src={imgSrc} 
            alt={post.name} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
            onError={() => { 
              if (imgSrc !== "/placeholder.jpg") setImgSrc("/placeholder.jpg"); 
            }}
          />
        </div>

        {/* เนื้อหาด้านล่าง */}
        <CardContent className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-3.5">
            {/* ชื่อสิ่งของ (อนุญาตให้แสดง 2 บรรทัดถ้าชื่อยาวไป) */}
            <h3 className="font-bold text-sm sm:text-base leading-tight text-foreground line-clamp-2  transition-colors duration-300">
              {post.name}
            </h3>

            {/* ส่วน "ความต้องการ" ดีไซน์ใหม่ให้ดูเป็นสัดส่วน ไม่ทึบ */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 transition-colors duration-300 group-hover:bg-primary/10">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-primary/80">
                  ต้องการแลกกับ
                </span>
                <p className="font-semibold text-foreground truncate text-xs sm:text-sm">
                  {post.desired}
                </p>
              </div>
            </div>
          </div>

          {/* Footer: สถานที่ และ Icon บอกใบ้การคลิก */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-between text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{post.location}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default function Feed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const querySearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(querySearch);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [itemsList, setItemsList] = useState<DBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const itemsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(querySearch);
  }, [querySearch]);

  useEffect(() => {
    const handleGlobalSearch = (e: CustomEvent) => {
      setSearch(e.detail || "");
    };
    window.addEventListener("globalSearch", handleGlobalSearch as EventListener);
    return () => window.removeEventListener("globalSearch", handleGlobalSearch as EventListener);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const itemsRes = await fetchItemsAPI();
        setItemsList(itemsRes.data || []);
      } catch (error) { 
        console.error("Error fetching data:", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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
      const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (p.desired || "").toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [itemsWithUrls, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setCurrentPage(1);
    navigate("/feed", { replace: true });
    window.dispatchEvent(new CustomEvent("globalSearch", { detail: "" }));
  };

  const scrollToItems = () => {
    itemsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">

        {!isLoading && itemsWithUrls.length > 0 && !search && (
          <section className="pt-2">
            <FeaturedCarousel items={itemsWithUrls} />
          </section>
        )}

        <section ref={itemsSectionRef} className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              รายการทั้งหมด
            </h2>
          </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {paginatedItems.map((post) => (
                  <ItemCard key={post.id} post={post} />
                ))}
              </div>

              {/* Professional Centered Icon-only Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/40 mt-10">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      scrollToItems();
                    }}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="ก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        const isActive = currentPage === page;
                        return (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page);
                              scrollToItems();
                            }}
                            className={`min-w-[36px] h-9 rounded-xl text-xs font-medium border transition-all ${
                              isActive
                                ? "bg-slate-200 dark:bg-zinc-800 text-foreground font-semibold border-slate-300 dark:border-zinc-700 shadow-sm"
                                : "bg-card border-border/40 text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-muted-foreground px-1 text-xs">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      scrollToItems();
                    }}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="ถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
        </section>
      </div>
    </AppLayout>
  );
}