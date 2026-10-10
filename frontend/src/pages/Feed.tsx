
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
  MeetingLocation?: string;
  meeting_location?: string;
  image_path?: string;
  image_name?: string;
  ItemImage?: string;
}

interface FormattedPost {
  id: string | number;
  name: string;
  desired: string;
  location: string;
  imgUrl: string;
}

const ITEMS_PER_PAGE = 40;
const PLACEHOLDER_IMAGE = "/placeholder.jpg";

function getImageUrl(imageName?: string) {
  if (!imageName) return PLACEHOLDER_IMAGE;

  let image = imageName.trim();

  if (!image || image === "undefined" || image === "null") {
    return PLACEHOLDER_IMAGE;
  }

  if (image.startsWith("[")) {
    try {
      const images = JSON.parse(image.split("'").join('"'));
      image = Array.isArray(images) ? String(images[0] || "").trim() : "";
    } catch {
      image = image
        .split("[").join("")
        .split("]").join("")
        .split('"').join("")
        .split("'").join("")
        .split(",")[0]?.trim() || "";
    }
  } else {
    image = image.split(",")[0].trim();
  }

  if (!image || image === "undefined" || image === "null") {
    return PLACEHOLDER_IMAGE;
  }

  return image.startsWith("http")
    ? image
    : `${IMAGE_BASE_URL}/uploads/${image}`;
}

const ItemCard = memo(function ItemCard({ post }: { post: FormattedPost }) {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block h-full outline-none group">
      <Card className="relative h-full flex flex-col overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm transition-all duration-500 ease-out hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 cursor-pointer">
        <div className="w-full aspect-[4/3] bg-muted/20 relative overflow-hidden">
          <img
            src={imgSrc}
            alt={post.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={() => {
              if (imgSrc !== PLACEHOLDER_IMAGE) {
                setImgSrc(PLACEHOLDER_IMAGE);
              }
            }}
          />
        </div>

        <CardContent className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-3.5">
            <h3 className="font-bold text-sm sm:text-base leading-tight text-foreground line-clamp-2 transition-colors duration-300">
              {post.name}
            </h3>

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
    const handleGlobalSearch = (event: Event) => {
      const searchEvent = event as CustomEvent<string>;
      setSearch(searchEvent.detail || "");
    };

    window.addEventListener("globalSearch", handleGlobalSearch);

    return () => {
      window.removeEventListener("globalSearch", handleGlobalSearch);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchItemsAPI();
        setItemsList(Array.isArray(response.data) ? response.data : []);
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
    return itemsList.map((item, index) => ({
      id: item.ItemID || item.item_id || `fallback-id-${index}`,
      name: item.ItemName || item.item_name || "ไม่ระบุชื่อสิ่งของ",
      desired: item.DesiredItem || item.desired_item || "เปิดรับข้อเสนอทั้งหมด",
      location: item.MeetingLocation || item.meeting_location || "นัดรับตามตกลง",
      imgUrl: getImageUrl(item.image_name || item.ItemImage || item.image_path),
    }));
  }, [itemsList]);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return itemsWithUrls.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.desired.toLowerCase().includes(keyword),
    );
  }, [itemsWithUrls, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const scrollToItems = () => {
    itemsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    scrollToItems();
  };

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/40 mt-10">
              <button
                onClick={() => changePage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="ก่อนหน้า"
                aria-label="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {pageNumbers.map((page) => {
                  const isVisible =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  const showEllipsis =
                    page === currentPage - 2 ||
                    page === currentPage + 2;

                  if (isVisible) {
                    const isActive = currentPage === page;

                    return (
                      <button
                        key={page}
                        onClick={() => changePage(page)}
                        aria-current={isActive ? "page" : undefined}
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

                  if (showEllipsis) {
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

              <button
                onClick={() =>
                  changePage(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="ถัดไป"
                aria-label="หน้าถัดไป"
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