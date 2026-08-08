import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Globe, Trash2, X, Package, LayoutGrid, AlignLeft, ArrowRightLeft, Sparkles, Loader2} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/categories_data";
import { createItem } from "@/api/api"; 

export default function CreatePost() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [wanted, setWanted] = useState("");
  const [location, setLocation] = useState("");
  const [mapLink, setMapLink] = useState("");
  const categories = CATEGORIES.filter(c => c !== "ทั้งหมด");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 6) {
      toast({ title: "จำกัดรูปภาพ", description: "สามารถอัปโหลดได้สูงสุด 6 รูปเท่านั้น", variant: "destructive" });
      return;
    }

    const newFilesArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFilesArray]);

    newFilesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => {
          const newImages = [...prev, reader.result as string];
          if (newImages.length >= 3 && errors.images) setErrors((curr) => ({ ...curr, images: "" }));
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (images.length < 3) newErrors.images = "กรุณาลงรูปสินค้าอย่างน้อย 3 รูป";
    if (!title.trim()) newErrors.title = "กรุณาระบุชื่อสิ่งของ";
    if (!category) newErrors.category = "กรุณาเลือกหมวดหมู่สิ่งของ";
    if (!description.trim()) newErrors.description = "กรุณาระบุรายละเอียดสิ่งของ";
    if (!wanted.trim()) newErrors.wanted = "กรุณาระบุสิ่งที่ต้องการแลก";
    if (!location.trim()) newErrors.location = "กรุณาระบุสถานที่นัดรับ";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ variant: "destructive", title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน" });
      return;
    }

    setIsLoading(true);

    try {
      const savedUser = localStorage.getItem("user");
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (!user) {
        toast({ variant: "destructive", title: "กรุณาเข้าสู่ระบบก่อนทำการโพสต์" });
        setIsLoading(false);
        return;
      }
      
      const currentMemberId = user.id || user.user_id || user.UserID || user.MemberID;

      const formData = new FormData();
      formData.append("item_name", title);
      formData.append("item_detail", description); 
      formData.append("wanted_item", wanted);
      formData.append("meeting_place", location);   
      formData.append("location_link", mapLink);   
      formData.append("category_id", "1"); 
      formData.append("member_id", String(currentMemberId)); 

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("images", file); 
        });
      }

      await createItem(formData);

      // 💡 แจ้งเตือนสำเร็จตามรูปแบบที่ต้องการ
      toast({ 
        title: "สำเร็จ", 
        description: "ลงประกาศแลกเปลี่ยนเรียบร้อย" 
      });

      navigate("/my-posts");
      
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ 
        variant: "destructive", 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถสร้างโพสต์ได้ กรุณาลองใหม่อีกครั้ง" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <section className="border-b border-border/50 bg-muted/30 w-screen relative left-1/2 -translate-x-1/2 -mt-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">สร้างโพสต์ใหม่</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">กรอกข้อมูลสิ่งของที่ต้องการนำมาแลกเปลี่ยน</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/feed")} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

              {/* Left: Images */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className={`text-sm font-bold ${errors.images ? "text-destructive" : ""}`}>
                    รูปสินค้า (3-6 รูป) <span className="text-destructive">*</span>
                  </Label>
                  <span className={`text-xs font-medium ${images.length < 3 ? 'text-warning' : 'text-success'}`}>
                    {images.length === 0 ? "ยังไม่มีรูปภาพ" : `${images.length}/6 รูป`}
                  </span>
                </div>

                <div className={`grid grid-cols-3 gap-3 p-3 rounded-2xl border ${errors.images ? "bg-destructive/5 border-destructive/20" : "border-border/50 bg-muted/20"}`}>
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
                      <img src={img} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-card/90 backdrop-blur-sm rounded-lg text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${errors.images ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40"}`}
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">เพิ่มรูป</span>
                    </button>
                  )}
                </div>
                {errors.images && <p className="text-xs text-destructive">{errors.images}</p>}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
              </div>

              {/* Right: Fields */}
              <div className="lg:col-span-3 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className={`text-sm font-bold ${errors.title ? "text-destructive" : ""}`}>
                    ชื่อสิ่งของ <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Package className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${errors.title ? "text-destructive" : "text-primary"}`} />
                    <Input id="title" placeholder="เช่น กล้องฟิล์ม Olympus Mju II" value={title}
                      onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors(prev => ({ ...prev, title: "" })); }}
                      className={`pl-10 h-11 ${errors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className={`text-sm font-bold ${errors.category ? "text-destructive" : ""}`}>
                    หมวดหมู่สิ่งของ <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={(val) => { setCategory(val); if (errors.category) setErrors(prev => ({ ...prev, category: "" })); }}>
                    <SelectTrigger className={`relative pl-10 h-11 ${errors.category ? "border-destructive" : ""}`}>
                      <LayoutGrid className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${errors.category ? "text-destructive" : "text-primary"}`} />
                      <SelectValue placeholder="เลือกประเภทสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== "ทั้งหมด").map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="desc" className={`text-sm font-bold ${errors.description ? "text-destructive" : ""}`}>
                    รายละเอียด <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <AlignLeft className={`absolute left-3 top-3 h-4 w-4 ${errors.description ? "text-destructive" : "text-primary"}`} />
                    <Textarea id="desc" placeholder="บอกรายละเอียด สภาพ หรือตำหนิสินค้าของคุณ..." value={description}
                      onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors(prev => ({ ...prev, description: "" })); }}
                      className={`pl-10 min-h-[120px] resize-none ${errors.description ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>

                {/* Wanted */}
                <div className="space-y-1.5">
                  <Label htmlFor="wanted" className={`text-sm font-bold ${errors.wanted ? "text-destructive" : ""}`}>
                    สิ่งที่ต้องการแลก <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <ArrowRightLeft className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${errors.wanted ? "text-destructive" : "text-primary"}`} />
                    <Input id="wanted" placeholder="ระบุของที่คุณสนใจอยากแลกด้วย" value={wanted}
                      onChange={(e) => { setWanted(e.target.value); if (errors.wanted) setErrors(prev => ({ ...prev, wanted: "" })); }}
                      className={`pl-10 h-11 ${errors.wanted ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.wanted && <p className="text-xs text-destructive">{errors.wanted}</p>}
                </div>

                {/* Location + Map */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="location" className={`text-sm font-bold ${errors.location ? "text-destructive" : ""}`}>
                      สถานที่นัดรับ <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${errors.location ? "text-destructive" : "text-primary"}`} />
                      <Input id="location" placeholder="เช่น เซ็นทรัล ลาดพร้าว" value={location}
                        onChange={(e) => { setLocation(e.target.value); if (errors.location) setErrors(prev => ({ ...prev, location: "" })); }}
                        className={`pl-10 h-11 ${errors.location ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                    {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="map-link" className="text-sm font-bold">ลิงก์ตำแหน่ง (Google Maps)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="map-link" placeholder="วางลิงก์จาก Google Maps" value={mapLink} onChange={(e) => setMapLink(e.target.value)} className="pl-10 h-11" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 h-12 text-base font-bold eco-gradient text-primary-foreground shadow-lg disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        กำลังโหลด...
                      </>
                    ) : (
                      "ลงประกาศแลกเปลี่ยน"
                    )}
                  </Button>
                  {/* 💡 ปรับปุ่มยกเลิกให้สูง h-12 และมีขนาดตัวหนังสือ text-base font-bold เท่ากับปุ่ม submit */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isLoading} 
                    className="h-12 text-base font-bold px-6 sm:w-auto" 
                    onClick={() => navigate("/feed")}
                  >
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