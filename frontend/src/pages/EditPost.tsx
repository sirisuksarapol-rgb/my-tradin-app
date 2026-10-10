
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, MapPin, Link2, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
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
}

interface DBCategory {
  CategoryID: number;
  CategoryName: string;
  IconName?: string;
  Color?: string;
  CategoryColor?: string;
  color?: string;
  icon_color?: string;
}

const DynamicIcon = ({
  name,
  className,
  style,
}: {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  if (!name) return null;

  if (name.startsWith("http") || name.startsWith("/")) {
    return <img src={name} alt="" className={className} style={style} />;
  }

  if (name.length <= 2) {
    return <span className={className} style={style}>{name}</span>;
  }

  const iconsMap = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  >;

  const IconComponent = iconsMap[name] || LucideIcons.Folder;
  return <IconComponent className={className} style={style} />;
};

export default function EditPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | string)[]>([]);
  const [categoriesList, setCategoriesList] = useState<DBCategory[]>([]);
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // โหลดหมวดหมู่
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const res = await getCategories();
        setCategoriesList(res.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategoriesData();
  }, []);

  const filteredCategories = categoriesList.filter(
    (cat) => cat.CategoryName !== "ทั้งหมด",
  );

  // โหลดข้อมูลโพสต์เดิม
  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);

        const res = await getItems();
        const items: DBItemDetail[] = res.data || [];
        const currentPost = items.find(
          (item) => String(item.ItemID) === String(postId),
        );

        if (!currentPost) return;

        setTitle(currentPost.ItemName || "");
        setDescription(currentPost.ItemDescription || "");
        setWantedItem(currentPost.DesiredItem || "");
        setLocation(currentPost.MeetingLocation || "");
        setLocationLink(currentPost.LocationLink || "");
        setCategoryId(currentPost.CategoryID || "");
        setMemberId(currentPost.MemberID || "");
        setCategory(currentPost.CategoryName || "");

        if (currentPost.ItemImage) {
          const imageNames = currentPost.ItemImage
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);

          setImages(
            imageNames.map((name) => `${IMAGE_BASE_URL}/uploads/${name}`),
          );
          setImageFiles(imageNames);
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

  // เลื่อนหน้าจอขึ้นด้านบนเมื่อเปิดหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ยกเลิก Blob URL เมื่อปิดหน้า
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.startsWith("blob:")) URL.revokeObjectURL(img);
      });
    };
  }, []);

  // ล้างข้อความ Error ของช่องที่แก้ไข
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // เพิ่มรูปภาพ โดยจำกัดไม่เกิน 6 รูป
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 6) {
      toast({
        title: "จำกัดรูปภาพ",
        description: "สามารถอัปโหลดได้สูงสุด 6 รูปเท่านั้น",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const newFiles = Array.from(files);
    const newImageUrls = newFiles.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...newImageUrls]);
    setImageFiles((prev) => [...prev, ...newFiles]);
    clearError("images");

    e.target.value = "";
  };

  // ลบรูปภาพ
  const removeImage = (index: number) => {
    const targetImage = images[index];

    if (targetImage?.startsWith("blob:")) {
      URL.revokeObjectURL(targetImage);
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ตรวจสอบข้อมูลก่อนเปิดหน้าต่างยืนยัน
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (images.length < 3) newErrors.images = "กรุณาลงรูปสินค้าอย่างน้อย 3 รูป";
    if (!title.trim()) newErrors.title = "กรุณาระบุชื่อสิ่งของ";
    if (!category) newErrors.category = "กรุณาเลือกหมวดหมู่สิ่งของ";
    if (!description.trim()) newErrors.description = "กรุณาระบุรายละเอียดสิ่งของ";
    if (!wantedItem.trim()) newErrors.wantedItem = "กรุณาระบุสิ่งที่ต้องการแลก";
    if (!location.trim()) newErrors.location = "กรุณาระบุสถานที่นัดรับ";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        variant: "destructive",
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  // บันทึกข้อมูลที่แก้ไข
  const confirmSubmit = async () => {
    setShowConfirmDialog(false);

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
        } else {
          existingImages.push(file);
        }
      });

      formData.append("existing_images", existingImages.join(","));

      if (!postId) return;

      await updateItem(Number(postId), formData);

      toast({
        title: "สำเร็จ",
        description: "บันทึกการแก้ไขเรียบร้อยแล้ว",
      });

      navigate("/my-posts");
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
        <div className="px-4 py-12 text-center text-muted-foreground animate-pulse">
          กำลังโหลดข้อมูลโพสต์...
        </div>
      </AppLayout>
    );
  }

  const currentCategory = categoriesList.find(
    (cat) => String(cat.CategoryID) === String(categoryId),
  );

  const getIconColor = (cat: DBCategory) =>
    cat.Color || cat.CategoryColor || cat.color || cat.icon_color;

  return (
    <AppLayout>
      <section className="w-screen relative left-1/2 -translate-x-1/2 -mt-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              แก้ไขโพสต์
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/my-posts")}
              className="rounded-full hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 text-foreground hover:text-foreground transition-all"
            >
              <X className="h-5 w-5 text-foreground" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              <div className="lg:col-span-2 space-y-3">
                <Label className={`text-sm font-semibold ${errors.images ? "text-red-500" : ""}`}>
                  รูปภาพ ({images.length}/6){" "}
                  <span className="text-red-500 font-normal">*ขั้นต่ำ 3 รูป</span>
                </Label>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />

                <div className={`grid grid-cols-3 gap-3 ${errors.images ? "p-2 bg-red-50 rounded-xl border border-red-200" : ""}`}>
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-muted group border border-border"
                    >
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
                      className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                        errors.images
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
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearError("title");
                    }}
                  />
                  {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label className={`font-semibold ${errors.category ? "text-red-500" : ""}`}>
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    value={categoryId ? String(categoryId) : ""}
                    onValueChange={(value) => {
                      setCategoryId(Number(value));

                      const selectedCategory = categoriesList.find(
                        (cat) => String(cat.CategoryID) === value,
                      );

                      if (selectedCategory) {
                        setCategory(selectedCategory.CategoryName);
                      }

                      clearError("category");
                    }}
                  >
                    <SelectTrigger className={`h-11 ${errors.category ? "border-red-500 ring-red-500" : ""}`}>
                      <SelectValue placeholder="เลือกหมวดหมู่">
                        {currentCategory ? (
                          <span className="inline-flex items-center gap-2">
                            <DynamicIcon
                              name={currentCategory.IconName}
                              className="w-4 h-4 shrink-0"
                              style={{ color: getIconColor(currentCategory) || undefined }}
                            />
                            <span>{currentCategory.CategoryName}</span>
                          </span>
                        ) : (
                          "เลือกหมวดหมู่"
                        )}
                      </SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectOption
                          key={cat.CategoryID}
                          value={String(cat.CategoryID)}
                          className="hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-black focus:bg-slate-200/60 dark:focus:bg-zinc-800/60 focus:text-black dark:focus:text-black cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2">
                            <DynamicIcon
                              name={cat.IconName}
                              className="w-4 h-4 shrink-0"
                              style={{ color: getIconColor(cat) || undefined }}
                            />
                            <span>{cat.CategoryName}</span>
                          </span>
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
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearError("description");
                    }}
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
                    onChange={(e) => {
                      setWantedItem(e.target.value);
                      clearError("wantedItem");
                    }}
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
                        onChange={(e) => {
                          setLocation(e.target.value);
                          clearError("location");
                        }}
                      />
                    </div>
                    {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationLink" className="font-semibold text-muted-foreground">
                      ลิงก์ตำแหน่ง (Google Maps)
                    </Label>
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

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="flex-1 h-12 text-base font-bold shadow-lg">
                    บันทึกการแก้ไข
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-center space-y-6 border border-border animate-in fade-in zoom-in-95 duration-200">
            <p className="text-lg font-bold text-foreground">แน่ใจนะว่าจะแก้ไข</p>
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 h-11 border border-border hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-black text-foreground transition-all"
              >
                ยกเลิก
              </Button>
              <Button type="button" onClick={confirmSubmit} className="flex-1 h-11">
                ยืนยัน
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}