import { useState, useEffect, useMemo, memo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Search,
  ArrowLeftRight,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { getCategories, getItems, IMAGE_BASE_URL } from "@/api/api";
import { icons, LucideIcon } from "lucide-react";

interface DBCategory {
  CategoryID: number;
  CategoryName: string;
  IconName?: string;
  ItemCount?: number;
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

const ItemCard = memo(({ post }: { post: FormattedPost }) => {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block group outline-none h-full">
      {/* 🔹 Card Container: ขอบมนขึ้น เพิ่มเอฟเฟกต์ยกตัว (Lift) และเงาฟุ้งๆ ตอน Hover */}
      <Card className="h-full overflow-hidden border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] rounded-2xl flex flex-col">
        
        {/* 🔹 Image Section: แอนิเมชันซูมสมูทๆ และเงา Gradient */}
        <div className="w-full aspect-[4/3] bg-muted/20 relative overflow-hidden">
          <img
            src={imgSrc}
            alt={post.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            onError={() => {
              if (imgSrc !== "/placeholder.jpg") setImgSrc("/placeholder.jpg");
            }}
          />
          {/* Overlay อ่อนๆ ตอน Hover เพื่อเน้นความลึก */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* 🔹 Content Section */}
        <CardContent className="p-4 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-3.5">
            {/* Title: ขยายเป็น 2 บรรทัดได้เผื่อชื่อยาว และเปลี่ยนสีตอน Hover */}
            <h3 className="font-bold text-sm sm:text-base leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {post.name}
            </h3>

            {/* 🔹 Desired Item Box: เปลี่ยนเป็นโทนสี Primary อ่อนๆ เพื่อดึงดูดสายตา */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-2.5 flex items-start gap-3 group-hover:bg-primary/10 transition-colors duration-300">
              <div className="bg-background rounded-lg p-1.5 shadow-sm border border-border/50 shrink-0">
                <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="text-xs min-w-0 flex-1 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary/80 mb-0.5 block">
                  อยากแลกกับ
                </span>
                <p className="font-semibold text-foreground truncate text-xs">
                  {post.desired}
                </p>
              </div>
            </div>
          </div>

          {/* 🔹 Footer Metadata */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground mt-auto">
            {/* Location */}
            <div className="flex items-center gap-1.5 truncate pr-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
              <span className="truncate font-medium">{post.location}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get("category");

  const [categoriesList, setCategoriesList] = useState<DBCategory[]>([]);
  const [itemsList, setItemsList] = useState<DBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    catParam,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCategory(catParam);
  }, [catParam]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [catRes, itemsRes] = await Promise.all([
          getCategories(),
          getItems(),
        ]);
        setCategoriesList(catRes.data || []);
        setItemsList(itemsRes.data || []);
      } catch (error) {
        console.error("Error loading categories and items:", error);
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
        const firstImage = rawImageStr.includes(",")
          ? rawImageStr.split(",")[0].trim()
          : rawImageStr.trim();

        if (firstImage.startsWith("http")) {
          imageUrl = firstImage;
        } else if (firstImage.startsWith("[")) {
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
        desired:
          item.DesiredItem || item.desired_item || "เปิดรับข้อเสนอทั้งหมด",
        catId: item.CategoryID || item.category_id || 0,
        location:
          item.MeetingLocation || item.meeting_location || "นัดรับตามตกลง",
        imgUrl: imageUrl,
        ownerName: item.DisplayName || "สมาชิก Tradin",
        ownerAvatar: item.ProfileImage,
      };
    });
  }, [itemsList]);

  const filteredItems = useMemo(() => {
    return itemsWithUrls.filter((p) => {
      const matchCat =
        !selectedCategory || String(p.catId) === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desired.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [itemsWithUrls, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleSelectCategory = (catId: string) => {
    const newCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCat);
    setCurrentPage(1);
    if (newCat) {
      setSearchParams({ category: newCat });
    } else {
      setSearchParams({});
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const activeCategoryName = useMemo(() => {
    if (!selectedCategory) return "ทั้งหมด";
    const found = categoriesList.find(
      (c) => String(c.CategoryID) === selectedCategory,
    );
    return found ? found.CategoryName : "หมวดหมู่";
  }, [selectedCategory, categoriesList]);

  const scrollToItems = () => {
    itemsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans">
        
        {/* Hero Banner Section */}
        <section className="relative -mt-6 py-8 md:py-10">
          {/* กล่องพื้นหลังขยายเต็มหน้าจอ (ไม่กระทบโครงสร้างตัวอักษร) */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen border-b border-border/50 -z-10 pointer-events-none" />
          
          {/* เนื้อหาด้านใน (จะเรียงตรงกับขอบหมวดหมู่ด้านล่างเป๊ะ 100%) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-foreground">
                ระบบค้นหาหมวดหมู่สิ่งของ
              </h1>
              <p className="text-sm text-muted-foreground">
                จัดการโพสต์สิ่งของที่คุณนำมาแลกเปลี่ยน
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid Selector (2 Rows, Scrollable, Soft Gray Hover/Selected) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                หมวดหมู่ทั้งหมด
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedCategory && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchParams({});
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold mr-2"
                >
                  <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
                </button>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollCategories("left")}
                  className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCategories("right")}
                  className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-rows-2 grid-flow-col gap-3.5 overflow-x-auto pb-3 scrollbar-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[200px] h-24 rounded-2xl bg-card border border-border/40 animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="grid grid-rows-2 grid-flow-col gap-3.5 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
            >
              {categoriesList.map((cat, index) => {
                const catId = String(cat.CategoryID);
                const isSelected = selectedCategory === catId;
                const iconName = cat.IconName;
                const IconComponent =
                  (icons[iconName as keyof typeof icons] as LucideIcon) ||
                  Sparkles;
                const colorTheme =
                  CATEGORY_COLORS[index % CATEGORY_COLORS.length];

                return (
                  <button
                    key={`cat-card-${catId}`}
                    onClick={() => handleSelectCategory(catId)}
                    className={`w-[220px] sm:w-[240px] p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3.5 h-24 shrink-0 snap-start group relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 shadow-sm"
                        : "bg-card border-border/50 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:border-border"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.text}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm tracking-tight truncate text-foreground">
                        {cat.CategoryName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {cat.ItemCount ?? 0} ไอเทม
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Filtered Items Section */}
        <section className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>
                รายการในหมวดหมู่:{" "}
                <span className="text-primary">{activeCategoryName}</span>
              </span>
            </h2>

            <div className="relative w-full sm:w-64">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl overflow-hidden border border-border/40 animate-pulse h-72"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/80 p-8 space-y-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">
                  ไม่พบรายการสิ่งของในหมวดหมู่นี้
                </h3>
                <p className="text-xs text-muted-foreground">
                  ลองเลือกหมวดหมู่อื่น หรือค้นหาด้วยคำอื่นดูนะครับ
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchParams({});
                  setSearchQuery("");
                }}
                className="rounded-xl text-xs"
              >
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

              {/* Pagination */}
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
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
                          return (
                            <span
                              key={page}
                              className="text-muted-foreground px-1 text-xs"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      },
                    )}
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
