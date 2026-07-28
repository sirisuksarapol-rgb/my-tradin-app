import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, MapPin, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem as SelectOption, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { getItems, updateItem, getCategories, IMAGE_BASE_URL } from "@/api/api";

interface DBItemDetail {
  ItemID?: number;
  ItemName?: string;
  ItemDescription?: string;
  DesiredItem?: string;
  MeetingLocation?: string;
  LocationLink?: string;
  CategoryID?: number;
  MemberID?: number;
  CategoryName?: string;
  ItemImage?: string;
  image_paths?: string[];
  image_name?: string;
}

interface Category {
  CategoryID: number;
  CategoryName: string;
}

export default function EditPost() {
  const { postId } = useParams<{ postId: string }>(); 
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States สำหรับเก็บข้อมูลฟอร์ม
  const [images, setImages] = useState<string[]>([]); 
  const [imageFiles, setImageFiles] = useState<(File | string)[]>([]); 
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [wantedItem, setWantedItem] = useState("");
  const [location, setLocation] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [categoryId, setCategoryId] = useState<number | string>("");
  const [memberId, setMemberId] = useState<number | string>("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
 
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const res = await getCategories(); 
        // เซ็ตข้อมูลลง State (สมมติว่า API ส่งข้อมูลกลับมาในรูปแบบ Array ผ่าน res.data)
        setCategoriesList(res.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    fetchCategoriesData();
  }, []);
  // กรอง "ทั้งหมด" ออกเหมือนเดิม
  const filteredCategories = categoriesList.filter(
  (cat) => cat.CategoryName !== "ทั้งหมด"
);
  
  useEffect(() => {
  const fetchCategoriesData = async () => {
    try {
      const res = await getCategories(); 
      // 💡 เปิด F12 ดูในหน้าเว็บว่าอันนี้แสดงผลออกมาเป็นแบบไหน
      console.log("โครงสร้างข้อมูล Categories จากหลังบ้าน:", res.data); 
      setCategoriesList(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  fetchCategoriesData();
}, []);

  // 1. ดึงข้อมูลโพสต์เดิมมาจัดใส่ฟอร์ม
  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const res = await getItems();
        const items: DBItemDetail[] = res.data || [];
        
        // ค้นหาโพสต์ที่รหัสตรงกันโดยระบุประเภทข้อมูลชัดเจนแทน any
        const currentPost = items.find((p: DBItemDetail) => String(p.ItemID) === String(postId));

        if (currentPost) {
          setTitle(currentPost.ItemName || "");
          setDescription(currentPost.ItemDescription || "");
          setWantedItem(currentPost.DesiredItem || "");
          setLocation(currentPost.MeetingLocation || "");
          setLocationLink(currentPost.LocationLink || "");
          setCategoryId(currentPost.CategoryID || "");
          setMemberId(currentPost.MemberID || "");
          setCategory(currentPost.CategoryName || "");

          // 💡 แก้ไข: ใช้ ItemImage สร้าง URL รูปภาพเองเลย เพราะ Backend อาจส่ง image_paths มาเป็น Array ว่าง
          if (currentPost.ItemImage) {
            // แยกชื่อไฟล์ดิบ (เช่น "รูป1.jpg", "รูป2.jpg")
            const rawNames = currentPost.ItemImage
              .split(",")
              .map((name: string) => name.trim())
              .filter((name: string) => name !== "");
            
            // นำชื่อไฟล์มาต่อกับ BASE URL เพื่อให้ Frontend แสดงรูปตัวอย่างได้ทันที
            const imageUrls = rawNames.map((name: string) => `${IMAGE_BASE_URL}/uploads/${name}`);
            
            setImages(imageUrls);     // เอาไว้แสดงรูปพรีวิวบนหน้าจอ
            setImageFiles(rawNames);  // เอาไว้เก็บชื่อไฟล์ดิบ เพื่อส่งยืนยันให้ Backend ว่าเรายังเก็บรูปเดิมไว้
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        toast({
          variant: "destructive",
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลโพสต์จากเซิร์ฟเวอร์ได้",
        });
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostDetail();
    }
  }, [postId, toast]);

  // Clean up Blob URLs 
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.startsWith("blob:")) URL.revokeObjectURL(img);
      });
    };
  }, [images]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 6) {
      toast({
        title: "จำกัดรูปภาพ",
        description: "สามารถอัปโหลดได้สูงสุด 6 รูปเท่านั้น",
        variant: "destructive",
      });
      return;
    }

    const remainingSlots = 6 - images.length;
    const filesArray = Array.from(files).slice(0, remainingSlots);
    const newImageUrls = filesArray.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newImageUrls]);
    setImageFiles(prev => [...prev, ...filesArray]); 

    if (errors.images) setErrors(curr => ({ ...curr, images: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const targetImage = images[index];
    if (targetImage.startsWith("blob:")) {
      URL.revokeObjectURL(targetImage);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 2. ฟังก์ชันส่งข้อมูลอัปเดตไปที่ API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (images.length < 3) newErrors.images = "กรุณาลงรูปสินค้าอย่างน้อย 3 รูป";
    if (!title.trim()) newErrors.title = "กรุณาระบุชื่อสิ่งของ";
    if (!category) newErrors.category = "กรุณาเลือกหมวดหมู่สิ่งของ";
    if (!description.trim()) newErrors.description = "กรุณาระบุรายละเอียดสิ่งของ";
    if (!wantedItem.trim()) newErrors.wantedItem = "กรุณาระบุสิ่งที่ต้องการแลก";
    if (!location.trim()) newErrors.location = "กรุณาระบุสถานที่นัดรับ";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        variant: "destructive",
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("item_name", title);
      formData.append("item_detail", description);
      formData.append("wanted_item", wantedItem);
      formData.append("meeting_place", location);
      formData.append("location_link", locationLink);
      formData.append("category_id", String(categoryId || 1));
      formData.append("member_id", String(memberId));

      const existingImages: string[] = [];
      imageFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("images", file);
        } else if (typeof file === "string") {
          existingImages.push(file);
        }
      });
      
      formData.append("existing_images", existingImages.join(","));

      // 💡 เรียกใช้ฟังก์ชันอัปเดตผ่าน api.js
      if (postId) {
        await updateItem(Number(postId), formData);
        toast({ title: "บันทึกการแก้ไขเรียบร้อยแล้ว!" });
        navigate("/my-posts");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลไปยังเซิร์ฟเวอร์ได้",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center text-muted-foreground animate-pulse">กำลังโหลดข้อมูลโพสต์...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Hero */}
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">แก้ไขโพสต์</h1>
          <p className="text-sm text-muted-foreground mt-1">แก้ไขข้อมูลสิ่งของที่ต้องการแลกเปลี่ยน</p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

              {/* Left: Images */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className={`text-sm font-semibold ${errors.images ? "text-red-500" : ""}`}>
                    รูปภาพ ({images.length}/6) <span className="text-red-500 font-normal">*ขั้นต่ำ 3 รูป</span>
                  </Label>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />

                <div className={`grid grid-cols-3 gap-3 ${errors.images ? "p-2 bg-red-50 rounded-xl border border-red-200" : ""}`}>
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-muted group border border-border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 bg-black/40 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[9px] text-primary-foreground text-center py-1 font-bold uppercase">
                          รูปหลัก
                        </div>
                      )}
                    </div>
                  ))}

                  {images.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all
                        ${errors.images
                          ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
                        }`}
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] font-medium">เพิ่มรูปภาพ</span>
                    </button>
                  )}
                </div>
                {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
              </div>

              {/* Right: Form fields */}
              <div className="lg:col-span-3 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className={`font-semibold ${errors.title ? "text-red-500" : ""}`}>
                    ชื่อสิ่งของ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="ระบุชื่อสิ่งของของคุณ"
                    className={`h-11 ${errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors(prev => ({ ...prev, title: "" })); }}
                  />
                  {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
  <Label className={`font-semibold ${errors.category ? "text-red-500" : ""}`}>
    หมวดหมู่ <span className="text-red-500">*</span>
  </Label>
  
  <Select 
    // 💡 ใช้ category_id ในการคุมค่าเปิด-ปิด และแปลงเป็น String เสมอ
    value={categoryId ? String(categoryId) : ""} 
    onValueChange={(val) => { 
      setCategoryId(Number(val)); // แปลงกลับเป็น Number ตอนเซ็ตค่ากลับเข้า State
      if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
    }}
  >
    <SelectTrigger className={`h-11 ${errors.category ? "border-red-500 ring-red-500" : ""}`}>
      <SelectValue placeholder="เลือกหมวดหมู่" />
    </SelectTrigger>
    <SelectContent>
      {filteredCategories.map((cat) => (
        // 💡 เปลี่ยนมาใช้ cat.CategoryID และ cat.CategoryName ตัวพิมพ์เล็กตาม API เป๊ะๆ
        <SelectOption key={cat.CategoryID} value={String(cat.CategoryID)}>
          {cat.CategoryName}
        </SelectOption>
      ))}
    </SelectContent>
  </Select>
  
  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
</div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className={`font-semibold ${errors.description ? "text-red-500" : ""}`}>
                    รายละเอียดสินค้า <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="desc"
                    placeholder="อธิบายสภาพสินค้า เช่น ปีที่ซื้อ ตำหนิ หรือสาเหตุที่อยากแลก"
                    className={`min-h-[120px] ${errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors(prev => ({ ...prev, description: "" })); }}
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wanted" className={`font-semibold ${errors.wantedItem ? "text-red-500" : ""}`}>
                    สิ่งของที่ต้องการแลก <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="wanted"
                    placeholder="เช่น กล้องฟิล์ม, ลำโพงบลูทูธ"
                    className={`h-11 ${errors.wantedItem ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    value={wantedItem}
                    onChange={(e) => { setWantedItem(e.target.value); if (errors.wantedItem) setErrors(prev => ({ ...prev, wantedItem: "" })); }}
                  />
                  {errors.wantedItem && <p className="text-xs text-red-500">{errors.wantedItem}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className={`font-semibold ${errors.location ? "text-red-500" : ""}`}>
                      สถานที่นัดรับ <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 ${errors.location ? "text-red-500" : "text-primary"}`} />
                      <Input
                        id="location"
                        placeholder="ระบุสถานที่นัดรับ"
                        className={`h-11 pl-10 ${errors.location ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        value={location}
                        onChange={(e) => { setLocation(e.target.value); if (errors.location) setErrors(prev => ({ ...prev, location: "" })); }}
                      />
                    </div>
                    {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationLink" className="font-semibold text-muted-foreground">ลิงก์ตำแหน่ง (Google Maps)</Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="locationLink"
                        className="h-11 pl-10"
                        value={locationLink}
                        onChange={(e) => setLocationLink(e.target.value)}
                        type="url"
                        placeholder="http://maps.google.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="flex-1 h-12 text-base font-bold shadow-lg">
                    บันทึกการแก้ไข
                  </Button>
                  <Button type="button" variant="secondary" className="sm:w-auto hover:bg-orange-500/85 hover:text-white" onClick={() => navigate(-1)}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}