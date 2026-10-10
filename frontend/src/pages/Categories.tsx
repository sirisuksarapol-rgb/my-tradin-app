import { useState, useEffect, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Search, ArrowLeftRight, MapPin, X, ChevronLeft, ChevronRight, icons, LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { getCategories, getItems, IMAGE_BASE_URL } from "@/api/api";

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
  {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
  },
  {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
  },
  {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
  },
];

const ITEMS_PER_PAGE = 40;
const CATEGORIES_PER_PAGE = 10;

/* =========================================================
   Item Card
========================================================= */

const ItemCard = memo(({ post }: { post: FormattedPost }) => {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block group outline-none h-full">
      <Card className="h-full overflow-hidden border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] rounded-2xl flex flex-col">
        {/* Image */}
        <div className="w-full aspect-[4/3] bg-muted/20 relative overflow-hidden">
          <img
            src={imgSrc}
            alt={post.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            onError={() => {
              if (imgSrc !== "/placeholder.jpg") {
                setImgSrc("/placeholder.jpg");
              }
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content */}
        <CardContent className="p-4 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-3.5">
            <h3 className="font-bold text-sm sm:text-base leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {post.name}
            </h3>

            {/* Desired Item */}
            <div className="flex items-center gap-3 bg-white border border-black dark:bg-zinc-900 dark:border-zinc-100 rounded-2xl p-2.5 w-full">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-black/20 flex items-center justify-center shrink-0 shadow-sm">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-widest mb-0.5 leading-none">
                  อยากแลกกับ
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {post.desired}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground mt-auto">
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

/* =========================================================
   Main Page
========================================================= */

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();

  const catParam = searchParams.get("category");

  /* -----------------------------
     State
  ----------------------------- */

  const [categoriesList, setCategoriesList] = useState<DBCategory[]>([]);
  const [itemsList, setItemsList] = useState<DBItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    catParam,
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  /* Category Carousel Page */
  const [categoryPage, setCategoryPage] = useState(1);

  /* -----------------------------
     Sync URL category
  ----------------------------- */

  useEffect(() => {
    setSelectedCategory(catParam);
    setCurrentPage(1);
  }, [catParam]);

  /* -----------------------------
     Load Data
  ----------------------------- */

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

  /* =========================================================
     Format Items
  ========================================================= */

  const itemsWithUrls: FormattedPost[] = itemsList.map((item, index) => {
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
            imageUrl = "/placeholder.jpg";
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

  const keyword = searchQuery.trim().toLowerCase();

  const filteredItems = itemsWithUrls.filter((post) => {
    const matchCategory =
      !selectedCategory || String(post.catId) === selectedCategory;

    const matchSearch =
      !keyword ||
      post.name.toLowerCase().includes(keyword) ||
      post.desired.toLowerCase().includes(keyword);

    return matchCategory && matchSearch;
  });

  /* =========================================================
     Item Pagination
  ========================================================= */

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(start, start + ITEMS_PER_PAGE);

  /* =========================================================
     Category Carousel
  ========================================================= */

  const totalCategoryPages = Math.ceil(
    categoriesList.length / CATEGORIES_PER_PAGE,
  );

  const categoryStart = (categoryPage - 1) * CATEGORIES_PER_PAGE;
  const paginatedCategories = categoriesList.slice(
    categoryStart,
    categoryStart + CATEGORIES_PER_PAGE,
  );

  /* =========================================================
     Select Category
  ========================================================= */

  const handleSelectCategory = (catId: string) => {
    const newCategory = selectedCategory === catId ? null : catId;

    setSelectedCategory(newCategory);

    setCurrentPage(1);

    if (newCategory) {
      setSearchParams({
        category: newCategory,
      });
    } else {
      setSearchParams({});
    }
  };

  /* =========================================================
     Active Category Name
  ========================================================= */

  const activeCategoryName = selectedCategory
    ? categoriesList.find(
        (category) => String(category.CategoryID) === selectedCategory,
      )?.CategoryName || "หมวดหมู่"
    : "ทั้งหมด";

  /* =========================================================
     Reset Filters
  ========================================================= */

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setCurrentPage(1);
    setSearchParams({});
  };

return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans">
        {/* =====================================================
            Hero
        ===================================================== */}

        <section className="relative -mt-6 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading text-foreground">
                ระบบค้นหาหมวดหมู่สิ่งของ
              </h1>
            </div>
          </div>
        </section>

        {/* =====================================================
            Categories Carousel
        ===================================================== */}

        <section className="space-y-4">
          {/* Header */}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-bold tracking-tight text-foreground whitespace-nowrap">
                หมวดหมู่ทั้งหมด
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Clear Category */}

              {selectedCategory && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold mr-2"
                >
                  <X className="w-3.5 h-3.5" />
                  ล้างตัวกรอง
                </button>
              )}

              {/* Carousel Buttons */}

              {!isLoading && totalCategoryPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={categoryPage === 1}
                    aria-label="หมวดหมู่ก่อนหน้า"
                    className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCategoryPage((prev) =>
                        Math.min(prev + 1, totalCategoryPages),
                      )
                    }
                    disabled={categoryPage === totalCategoryPages}
                    aria-label="หมวดหมู่ถัดไป"
                    className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading */}

          {isLoading ? (
            <div className="grid grid-cols-5 grid-rows-2 gap-3.5">
              {Array.from({
                length: 10,
              }).map((_, index) => (
                <div
                  key={index}
                  className="w-full h-24 rounded-2xl bg-card border border-border/40 animate-pulse"
                />
              ))}
            </div>
          ) : categoriesList.length === 0 ? (
            /* No Categories */

            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/80">
              <p className="text-sm text-muted-foreground">ไม่พบหมวดหมู่</p>
            </div>
          ) : (
            /* Category Grid */

            <div className="grid grid-cols-5 grid-rows-2 gap-3.5">
              {paginatedCategories.map((category, index) => {
                const categoryId = String(category.CategoryID);

                const isSelected = selectedCategory === categoryId;

                const iconName = category.IconName || "Sparkles";

                const IconComponent =
                  (icons[iconName as keyof typeof icons] as LucideIcon) ||
                  Sparkles;

                /*
                 * ใช้ตำแหน่งจริงของหมวดหมู่
                 * เพื่อให้สีคงที่ทุกหน้า
                 */

                const globalIndex =
                  (categoryPage - 1) * CATEGORIES_PER_PAGE + index;

                const colorTheme =
                  CATEGORY_COLORS[globalIndex % CATEGORY_COLORS.length];

                return (
                  <button
                    key={`category-${categoryId}`}
                    type="button"
                    onClick={() => handleSelectCategory(categoryId)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3.5 h-24 min-w-0 group relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 shadow-sm"
                        : "bg-card border-border/50 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:border-border"
                    }`}
                  >
                    {/* Icon */}

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorTheme.bg} ${colorTheme.text}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Text */}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm tracking-tight truncate text-foreground">
                        {category.CategoryName}
                      </h3>

                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {category.ItemCount ?? 0} ไอเทม
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Carousel Indicator */}

          {!isLoading && totalCategoryPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {Array.from(
                {
                  length: totalCategoryPages,
                },
                (_, index) => index + 1,
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCategoryPage(page)}
                  aria-label={`ไปหน้าหมวดหมู่ ${page}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    categoryPage === page
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            Items Section
        ===================================================== */}

        <section className="space-y-4 pt-6 border-t border-border/40">
          {/* Header */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>
                รายการในหมวดหมู่:{" "}
                <span className="text-primary">{activeCategoryName}</span>
              </span>
            </h2>

            {/* Search */}

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาสิ่งของ..."
                className="w-full h-9 pl-9 pr-9 rounded-xl border border-border/50 bg-card text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="ล้างการค้นหา"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl overflow-hidden border border-border/40 animate-pulse h-72"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            /* No Items */

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
                onClick={clearFilters}
                className="rounded-xl text-xs"
              >
                ดูรายการทั้งหมด
              </Button>
            </div>
          ) : (
            <>
              {/* Items Grid */}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {paginatedItems.map((post) => (
                  <ItemCard key={post.id} post={post} />
                ))}
              </div>

              {/* Item Pagination */}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/40 mt-10">
                  {/* Previous */}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    aria-label="รายการก่อนหน้า"
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}

                  <div className="flex items-center gap-1.5">
                    {Array.from(
                      {
                        length: totalPages,
                      },
                      (_, index) => index + 1,
                    ).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        const isActive = currentPage === page;

                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[36px] h-9 rounded-xl text-xs font-medium border transition-all ${
                              isActive
                                ? "bg-slate-200 dark:bg-zinc-800 text-foreground font-semibold border-slate-300 dark:border-zinc-700 shadow-sm"
                                : "bg-card border-border/40 text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }

                      if (
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
                    })}
                  </div>

                  {/* Next */}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="รายการถัดไป"
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all"
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
  );}
