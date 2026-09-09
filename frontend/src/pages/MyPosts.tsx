import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Eye, Plus, Package, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { getItems, deleteItem, IMAGE_BASE_URL } from "@/api/api";

interface PostItem {
  ItemID?: string | number;
  item_id?: string | number;
  ItemName?: string;
  item_name?: string;
  DesiredItem?: string;
  desired_item?: string;
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

// =========================================================================
// COMPONENT: MyPosts (หน้าจอจัดการรายการสิ่งของของฉัน สำหรับดู แก้ไข และลบโพสต์)[cite: 6]
// =========================================================================
export default function MyPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  /**
   * EFFECT: ดึงข้อมูลรายการสิ่งของทั้งหมดจากระบบ API และทำการกรองเฉพาะโพสต์ที่เป็นของสมาชิกปัจจุบัน 
   * โดยอ้างอิงรหัสผู้ใช้จาก LocalStorage[cite: 6]
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const savedUser = localStorage.getItem("user");
        const user = savedUser ? JSON.parse(savedUser) : null;
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        const currentUserId = user.id !== undefined ? user.id : (user.user_id !== undefined ? user.user_id : (user.UserID !== undefined ? user.UserID : user.MemberID));

        const res = await getItems();
        const apiData = res && Array.isArray(res.data) ? res.data : [];

        const myPosts = apiData.filter((p: PostItem) => {
          const itemOwnerId = p.MemberID !== undefined ? p.MemberID : (p.member_id !== undefined ? p.member_id : (p.UserID !== undefined ? p.UserID : p.user_id));
          
          if (itemOwnerId === undefined || itemOwnerId === null) return false;

          return String(itemOwnerId).trim() === String(currentUserId).trim();
        });
        
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

  /**
   * ฟังก์ชัน: handleDelete
   * มีไว้สำหรับ: ส่งคำขอลบโพสต์สิ่งของไปยัง API ตามรหัสไอเทมที่ถูกกำหนดไว้ใน deleteTarget 
   * พร้อมทั้งอัปเดตสถานะรายการโพสต์ในหน้าจอและแสดงการแจ้งเตือน[cite: 6]
   */
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

  /**
   * ฟังก์ชัน: getCorrectImagePath
   * มีไว้สำหรับ: ตรวจสอบและจัดการรูปแบบพาธหรือ URL รูปภาพสินค้าให้ถูกต้องสมบูรณ์ 
   * รองรับทั้งรูปแบบสตริง JSON, รูปภาพหลายรูปที่คั่นด้วยคอมมา, หรือ URL ภายนอก พร้อมระบบสำรอง (Fallback)[cite: 6]
   */
  const getCorrectImagePath = (imageName: string | undefined) => {
    if (!imageName || imageName.trim() === "undefined" || imageName === "null") return "/placeholder.jpg";
    
    try {
      let cleanStr = imageName.trim();
      
      if (cleanStr.startsWith('[')) {
        const safeJsonStr = cleanStr.replace(/'/g, '"');
        const parsed = JSON.parse(safeJsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cleanStr = parsed[0].trim();
        }
      } else if (cleanStr.includes(',')) {
        cleanStr = cleanStr.split(',')[0].trim();
      }

      if (cleanStr.startsWith('http')) {
        return cleanStr;
      }
      
      return `${IMAGE_BASE_URL}/uploads/${cleanStr}`;
    } catch {
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
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                ของฉัน
              </h1>
              <p className="text-sm text-muted-foreground">
                จัดการโพสต์สิ่งของที่คุณนำมาแลกเปลี่ยน
              </p>
            </div>
            <Button
              className="eco-gradient text-primary-foreground gap-2"
              asChild
            >
              <Link to="/create-post">
                <Plus className="h-4 w-4" /> โพสต์ใหม่
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <p className="text-muted-foreground">
                กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...
              </p>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => {
                const id = String(post.ItemID || post.item_id || "");
                const title =
                  post.ItemName || post.item_name || "ไม่มีชื่อสิ่งของ";
                const desired =
                  post.DesiredItem ||
                  post.desired_item ||
                  "เปิดรับข้อเสนอทั้งหมด";

                const currentStatus = (
                  post.ItemStatus ||
                  post.status ||
                  "active"
                ).toLowerCase();
                const st =
                  statusMap[currentStatus as keyof typeof statusMap] ||
                  statusMap.active;

                const imageName = post.ItemImage || post.image_name;
                const imagePath = getCorrectImagePath(imageName);

                return (
                  <Card
                    key={id}
                    className="glass-card hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden border border-border/60"
                  >
                    <CardContent className="p-4 space-y-3.5 flex-1">
                      <div className="flex gap-3.5 items-start">
                        <img
                          src={imagePath}
                          alt={title}
                          className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover border border-border/50 bg-muted shrink-0 shadow-xs"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (
                              target.src !==
                              window.location.origin + "/placeholder.jpg"
                            ) {
                              target.src = "/placeholder.jpg";
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <h3 className="font-bold text-sm leading-snug line-clamp-2 text-foreground">
                            {title}
                          </h3>
                          <Badge
                            variant={st.variant}
                            className="text-[10px] font-semibold"
                          >
                            {st.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/40 border border-border/40 rounded-xl p-2.5 flex items-center gap-2">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="text-xs min-w-0 flex-1">
                          <span className="text-[10px] text-muted-foreground block font-medium">
                            อยากแลกกับ
                          </span>
                          <p className="font-medium text-foreground truncate text-[11px]">
                            {desired}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    <div className="px-3 py-2.5 border-t border-border/40 bg-muted/20 flex items-center justify-around gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-8 px-2 text-xs font-semibold text-foreground hover:bg-slate-200/80 dark:hover:bg-zinc-800 hover:text-foreground transition-all rounded-lg"
                        asChild
                      >
                        <Link
                          to={`/post/${id}`}
                          state={{ isOwnPostView: true }}
                          className="flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>ดู</span>
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-8 px-2 text-xs font-semibold text-foreground hover:bg-slate-200/80 dark:hover:bg-zinc-800 hover:text-foreground transition-all rounded-lg"
                        asChild
                      >
                        <Link
                          to={`/edit-post/${id}`}
                          className="flex items-center justify-center gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5 text-primary" />
                          <span>แก้ไข</span>
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-8 px-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 transition-all rounded-lg"
                        onClick={() => setDeleteTarget(id)}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>ลบ</span>
                        </span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-lg">
                คุณยังไม่มีโพสต์ในระบบ
              </p>
              <Button className="eco-gradient text-primary-foreground" asChild>
                <Link to="/create-post">สร้างโพสต์แรก</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-3xl p-6 shadow-2xl border border-border/50 bg-card backdrop-blur-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold">
              ยืนยันการลบโพสต์
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              คุณต้องการลบโพสต์นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2.5 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-2xl h-10 text-xs font-semibold border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1 rounded-2xl h-10 text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              ลบโพสต์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}