import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeftRight, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
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
            {/* ชื่อสิ่งของ */}
            <h3 className="font-bold text-sm sm:text-base leading-tight text-foreground line-clamp-2 transition-colors duration-300">
              {post.name}
            </h3>

            {/* ส่วน "ความต้องการ" */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-black dark:bg-zinc-900 dark:border-zinc-100">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm border border-black/20">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400">
                  ต้องการแลกกับ
                </span>
                <p className="font-semibold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                  {post.desired}
                </p>
              </div>
            </div>
          </div>

          {/* Footer: สถานที่ */}
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

  const scrollToItems = () => {
    itemsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">

        <section ref={itemsSectionRef} className="space-y-4 pt-2 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
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