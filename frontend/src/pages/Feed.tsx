import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Search, LayoutGrid, Sparkles, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { 
  getCategories as fetchCategoriesAPI, 
  getItems as fetchItemsAPI, 
  IMAGE_BASE_URL 
} from "@/api/api";
import { CATEGORY_ICONS } from "@/lib/categories_data";

// 🌟 1. สร้าง Interface มาแทนที่ "any" เพื่อกำจัดเส้นแดง
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
}

interface FormattedPost {
  id: string | number;
  name: string;
  desired: string;
  catId: string | number;
  location: string;
  imgUrl: string;
}

// รับค่าเป็น type FormattedPost แทน any
const ItemCard = memo(({ post }: { post: FormattedPost }) => {
  const [imgSrc, setImgSrc] = useState(post.imgUrl);

  return (
    <Link to={`/post/${post.id}`} className="block h-full">
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full overflow-hidden border border-border/60">
        <div className="w-full aspect-square bg-muted relative">
          <img 
            src={imgSrc} 
            alt={post.name} 
            className="w-full h-full object-cover" 
            onError={() => { 
              if (imgSrc !== "/placeholder.jpg") {
                setImgSrc("/placeholder.jpg"); 
              }
            }}
          />
        </div>
        <CardContent className="p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm line-clamp-1">{post.name}</h3>
            <div className="text-xs text-primary mt-1 font-medium line-clamp-1">
              แลก: {post.desired}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0 text-primary/70" />
            <span>{post.location}</span>
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
  
  // 🌟 3. ใช้ Interface ที่สร้างไว้กับ useState (ลบ any ออก)
  const [itemsList, setItemsList] = useState<DBItem[]>([]);
  const [categoryList, setCategoryList] = useState<DBCategory[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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
      // 🌟 4. แก้ปัญหารูปไม่ขึ้นแบบสมบูรณ์ (รองรับชื่อไฟล์ที่คั่นด้วย comma)
      const rawImageStr = item.image_name || item.ItemImage || item.image_path;
      let imageUrl = "/placeholder.jpg";
      
      if (rawImageStr) {
        // แยกลูกน้ำ (,) แล้วดึงมาแค่รูปแรก เพื่อป้องกัน 404 Error
        const firstImage = rawImageStr.includes(',') 
          ? rawImageStr.split(',')[0].trim() 
          : rawImageStr.trim();

        if (firstImage.startsWith('http')) {
          imageUrl = firstImage;
        } else if (firstImage.startsWith('[')) {
          // เผื่ออนาคตเก็บเป็น JSON Array
          try {
            const parsed = JSON.parse(firstImage);
            imageUrl = parsed[0] || "/placeholder.jpg";
          } catch {
            // fallback to placeholder
          }
        } else {
          // ใช้ IMAGE_BASE_URL จาก api.js แทนการ fix localhost
          imageUrl = `${IMAGE_BASE_URL}/uploads/${firstImage}`;
        }
      }

      return {
        id: item.ItemID || item.item_id || `fallback-id-${index}`,
        name: item.ItemName || item.item_name || "ไม่ระบุชื่อ",
        desired: item.DesiredItem || item.desired_item || "ไม่ระบุ",
        catId: item.CategoryID || item.category_id || 0,
        location: item.MeetingLocation || item.meeting_location || "ไม่ระบุสถานที่",
        imgUrl: imageUrl 
      };
    });
  }, [itemsList]);

  const filtered = useMemo(() => {
    return itemsWithUrls.filter((p) => {
      const matchCat = selectedCategory === "ทั้งหมด" || String(p.catId) === String(selectedCategory);
      const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
      
      return matchCat && matchSearch;
    });
  }, [itemsWithUrls, selectedCategory, search]);

  return (
    <AppLayout>
      <div className="space-y-8 text-foreground">
        <section className="relative rounded-3xl bg-gradient-to-br from-primary/10 to-accent/5 p-8 sm:p-12 text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">ค้นหาสิ่งของที่คุณสนใจ</h1>
          <div className="relative w-full max-w-2xl mx-auto flex">
            <Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <input
              className="w-full h-14 pl-12 pr-28 rounded-2xl border bg-card shadow-sm outline-none"
              placeholder="ค้นหาสิ่งของ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
            />
            <Button className="absolute right-2 top-2 rounded-xl px-6" onClick={() => setSearch(searchInput)}>ค้นหา</Button>
          </div>
        </section>

        <section className="bg-card rounded-2xl border p-4">
          <div className="flex overflow-x-auto gap-4 scrollbar-hide" ref={scrollContainerRef}>
            {["ทั้งหมด", ...categoryList].map((catObj, index) => {
              const isAll = catObj === "ทั้งหมด";
              const catName = isAll ? "ทั้งหมด" : (catObj as DBCategory).CategoryName;
              const catId = isAll ? "ทั้งหมด" : (catObj as DBCategory).CategoryID;
              
              const Icon = isAll ? LayoutGrid : (CATEGORY_ICONS[catName as keyof typeof CATEGORY_ICONS] || Sparkles);
              const isActive = selectedCategory === String(catId);
              
              return (
                <div 
                  key={`cat-${catId}-${index}`} 
                  onClick={() => setSelectedCategory(String(catId))} 
                  className="cursor-pointer flex flex-col items-center gap-2 min-w-[80px]"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isActive ? "bg-primary/20" : "bg-muted hover:bg-muted/80"}`}>
                    <Icon className={isActive ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <span className="text-xs font-medium text-center line-clamp-1 w-20">{catName}</span>
                </div>
              );
            })}
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                ไม่พบสิ่งของที่กำลังประกาศแลกเปลี่ยนในขณะนี้
              </div>
            ) : (
              filtered.map((post) => (
                <ItemCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}