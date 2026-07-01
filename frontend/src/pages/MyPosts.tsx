import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Eye, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
// นำเข้าฟังก์ชันจากไฟล์ api.js
import { getItems, deleteItem, IMAGE_BASE_URL } from "@/api/api"; 

interface PostItem {
  ItemID?: string | number;
  item_id?: string | number;
  ItemName?: string;
  item_name?: string;
  MemberID?: string | number;
  member_id?: string | number;
  UserID?: string | number;
  user_id?: string | number;
  ItemStatus?: string;
  status?: string;
  ItemImage?: string;
  image_name?: string;
}

const statusMap = {
  active: { label: "กำลังโพสต์", variant: "default" as const },
  matched: { label: "จับคู่แล้ว", variant: "secondary" as const },
  completed: { label: "สำเร็จ", variant: "outline" as const },
  cancelled: { label: "ยกเลิก", variant: "destructive" as const },
};

export default function MyPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedUser = localStorage.getItem("user");
        const user = savedUser ? JSON.parse(savedUser) : null;
        
        if (!user) {
          console.log("❌ ไม่พบข้อมูลผู้ใช้ใน localStorage");
          setIsLoading(false);
          return;
        }

        // ดึง ID คนล็อกอิน
        const currentUserId = user.id !== undefined ? user.id : (user.user_id !== undefined ? user.user_id : (user.UserID !== undefined ? user.UserID : user.MemberID));
        console.log("👤 [LocalStorage] ID ผู้ใช้งานปัจจุบัน:", currentUserId);

        const res = await getItems();
        const apiData = res && Array.isArray(res.data) ? res.data : [];
        console.log("📦 [API] ข้อมูลดิบทั้งหมดจาก Server (ยังไม่กรอง):", apiData);

        // กรองข้อมูลเฉพาะที่เป็น MemberID ของผู้ใช้ที่กำลังล็อกอิน
        const myPosts = apiData.filter((p: PostItem) => {
          const itemOwnerId = p.MemberID !== undefined ? p.MemberID : (p.member_id !== undefined ? p.member_id : (p.UserID !== undefined ? p.UserID : p.user_id));
          
          if (itemOwnerId === undefined || itemOwnerId === null) return false;

          return String(itemOwnerId).trim() === String(currentUserId).trim();
        });
        
        console.log("🎯 [Filtered] รายการโพสต์ที่ผ่านการกรอง (ของฉัน):", myPosts);
        setPosts(myPosts);
      } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        setPosts([]); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget);
      setPosts(posts.filter((p) => String(p.ItemID || p.item_id) !== String(deleteTarget)));
      setDeleteTarget(null);
      toast({ title: "ลบโพสต์เรียบร้อย" });
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบโพสต์ได้", variant: "destructive" });
    }
  };

  // 🌟 ฟังก์ชันจัดการ URL รูปภาพให้ถูกต้อง (แยกคอมมา ดึงรูปแรก และป้องกันภาพพัง)
  const getCorrectImagePath = (imageName: string | undefined) => {
    if (!imageName || imageName.trim() === "undefined" || imageName === "null") return "/placeholder.jpg";
    
    try {
      let cleanStr = imageName.trim();
      
      // 1. ถ้ารูปถูกส่งมาเป็นรูปแบบ Array String เช่น ['img1.jpg', 'img2.jpg']
      if (cleanStr.startsWith('[')) {
        const safeJsonStr = cleanStr.replace(/'/g, '"');
        const parsed = JSON.parse(safeJsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cleanStr = parsed[0].trim();
        }
      } else if (cleanStr.includes(',')) {
        // 2. ถ้ารูปถูกเก็บคั่นด้วยคอมมาดิบ ๆ (เช่น "file1.jpg, file2.jpg") ให้ตัดเอาเฉพาะรูปแรกสุด
        cleanStr = cleanStr.split(',')[0].trim();
      }

      if (cleanStr.startsWith('http')) {
        return cleanStr;
      }
      
      return `${IMAGE_BASE_URL}/uploads/${cleanStr}`;
    } catch {
      // Fallback ล้างสัญลักษณ์แปลกปลอม
      const fallback = imageName.replace(/\[|\]|"|'/g, '').split(',')[0].trim();
      if (fallback) {
        return fallback.startsWith('http') ? fallback : `${IMAGE_BASE_URL}/uploads/${fallback}`;
      }
    }
    return "/placeholder.jpg";
  };

  return (
    <AppLayout>
      <section className="border-b border-border/50 bg-muted/30 w-screen relative left-1/2 -translate-x-1/2 -mt-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">ของฉัน</h1>
              <p className="text-sm text-muted-foreground">จัดการโพสต์สิ่งของที่คุณนำมาแลกเปลี่ยน</p>
            </div>
            <Button className="eco-gradient text-primary-foreground gap-2" asChild>
              <Link to="/create-post"><Plus className="h-4 w-4" /> โพสต์ใหม่</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <p className="text-muted-foreground">กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => {
                const id = String(post.ItemID || post.item_id || "");
                const title = post.ItemName || post.item_name || "ไม่มีชื่อสิ่งของ";
                
                const currentStatus = (post.ItemStatus || post.status || "active").toLowerCase();
                const st = statusMap[currentStatus as keyof typeof statusMap] || statusMap.active;
                
                // 🌟 เรียกใช้ฟังก์ชันแปลง URL รูปภาพที่เพิ่มมาใหม่
                const imageName = post.ItemImage || post.image_name;
                const imagePath = getCorrectImagePath(imageName);

                return (
                  <Card
                    key={id}
                    className="glass-card hover:shadow-md transition-all group"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={imagePath}
                          alt={title}
                          className="w-24 h-24 rounded-xl object-cover border bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // 💡 ดักทางไว้: ถ้าเปลี่ยนเป็น /placeholder.jpg แล้วยังพังอีก ให้หยุดทำงานทันที (ป้องกันลูปกระพริบ)
                            if (
                              target.src !==
                              window.location.origin + "/placeholder.jpg"
                            ) {
                              target.src = "/placeholder.jpg";
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="font-bold text-sm truncate">
                            {title}
                          </h3>
                          <Badge variant={st.variant} className="text-[10px]">
                            {st.label}
                          </Badge>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              asChild
                            >
                              <Link
                                to={`/post/${id}`}
                                state={{ isOwnPostView: true }}
                              >
                                <Eye className="h-3 w-3 mr-1" /> ดู
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-primary"
                              asChild
                            >
                              <Link to={`/edit-post/${id}`}>
                                <Edit className="h-3 w-3 mr-1" /> แก้ไข
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive"
                              onClick={() => setDeleteTarget(id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> ลบ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-lg">คุณยังไม่มีโพสต์ในระบบ</p>
              <Button className="eco-gradient text-primary-foreground" asChild>
                <Link to="/create-post">สร้างโพสต์แรก</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>คุณต้องการลบโพสต์นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}