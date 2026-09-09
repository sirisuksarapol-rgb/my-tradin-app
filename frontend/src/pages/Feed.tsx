import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, ArrowLeftRight, MapPin, Sparkles, X, Flame, ChevronLeft, ChevronRight, ArrowUpRight, icons, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { getCategories as fetchCategoriesAPI, getItems as fetchItemsAPI, IMAGE_BASE_URL } from "@/api/api";

interface DBCategory {
  CategoryID: number;
  CategoryName: string;
  IconName?: string;
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

const CATEGORY_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
  { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
];

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Flame className="w-4 h-4 fill-primary/20" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            รายการแนะนำน่าแลกวันนี้
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/65 transition-all disabled:opacity-30 shadow-xs"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/65 transition-all disabled:opacity-30 shadow-xs"
            disabled={currentIndex === featuredItems.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-2xl"
      >
        {featuredItems.map((item, idx) => (
          <div 
            key={`featured-${item.id}-${idx}`}
            className="min-w-full md:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-11px)] snap-start shrink-0"
          >
            <Link to={`/post/${item.id}`} className="block group">
              <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden border border-border/50 bg-card group-hover:border-primary/40 transition-all duration-300 shadow-sm">
                <img 
                  src={item.imgUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-background/90 backdrop-blur-md text-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/25 shadow-sm flex items-center gap-1">
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

                  <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary-foreground transition-colors">
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
    </div>
  );
};

const ItemSkeleton = () => (
  <div className="bg-card rounded-xl overflow-hidden border border-border/40 animate-pulse shadow-sm">
    <div className="w-full aspect-[4/3] bg-muted/65"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted/80 rounded-md w-3/4"></div>
      <div className="h-10 bg-muted/40 rounded-lg w-full"></div>
      <div className="flex justify-between pt-2">
        <div className="h-3 bg-muted/65 rounded w-1/3"></div>
        <div className="h-3 bg-muted/65 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

const ItemCard = memo(({ post }: { post: FormattedPost }) => {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block group">
      <Card className="h-full overflow-hidden border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300 rounded-xl flex flex-col">
        <div className="w-full aspect-[4/3] bg-muted/30 relative overflow-hidden">
          <img 
            src={imgSrc} 
            alt={post.name} 
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out" 
            onError={() => { 
              if (imgSrc !== "/placeholder.jpg") setImgSrc("/placeholder.jpg"); 
            }}
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/40 text-[11px] font-medium text-foreground shadow-xs">
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

        <CardContent className="p-3.5 flex flex-col flex-1 justify-between space-y-3">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {post.name}
            </h3>

            <div className="bg-muted/40 border border-border/40 rounded-lg p-2 flex items-start gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5 min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  อยากแลกกับ
                </span>
                <p className="font-medium text-foreground truncate text-[11px]">
                  {post.desired}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate text-[11px]">{post.location}</span>
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const querySearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(querySearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [itemsList, setItemsList] = useState<DBItem[]>([]);
  const [categoryList, setCategoryList] = useState<DBCategory[]>([]); 
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

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
      const matchCat = selectedCategory === null || String(p.catId) === selectedCategory;
      const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (p.desired || "").toLowerCase().includes(search.toLowerCase());
      
      return matchCat && matchSearch;
    });
  }, [itemsWithUrls, selectedCategory, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(null);
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

        {!isLoading && itemsWithUrls.length > 0 && !search && selectedCategory === null && (
          <section className="pt-2">
            <FeaturedCarousel items={itemsWithUrls} />
          </section>
        )}

        {/* Professional E-Commerce Category Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>หมวดหมู่สินค้า</span>
            {(selectedCategory !== null || search) && (
              <button 
                onClick={clearFilters}
                className="text-primary hover:underline flex items-center gap-1 font-normal lowercase"
              >
                <X className="w-3 h-3" /> ล้างตัวกรอง
              </button>
            )}
          </div>

          <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoryList.map((catObj, index) => {
              const catName = catObj.CategoryName;
              const catId = String(catObj.CategoryID);
              const iconName = catObj.IconName;
              const isActive = selectedCategory === catId;

              const IconComponent = (icons[iconName as keyof typeof icons] as LucideIcon) || Sparkles;
              const colorTheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

              return (
                <button
                  key={`cat-${catId}-${index}`}
                  onClick={() => {
                    setSelectedCategory(isActive ? null : catId);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all shrink-0 min-w-[140px] sm:min-w-[160px] ${
                    isActive
                      ? "bg-slate-200 dark:bg-zinc-800 text-foreground font-semibold border-slate-300 dark:border-zinc-700 shadow-sm"
                      : "bg-card border-border/40 text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${colorTheme.bg} ${colorTheme.text}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="truncate">{catName}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section ref={itemsSectionRef} className="space-y-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              {search ? `ผลการค้นหา "${search}"` : selectedCategory !== null ? "รายการในหมวดหมู่นี้" : "รายการทั้งหมด"}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ItemSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/80 p-8 space-y-4 shadow-xs">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">ไม่พบรายการที่คุณกำลังค้นหา</h3>
                <p className="text-xs text-muted-foreground">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะเพื่อน</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl text-xs">
                ดูรายการทั้งหมด
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>

      </div>
    </AppLayout>
  );
}