import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Eye, X, Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";
import { mockPosts, PostItem } from "@/lib/post_data";
import { useToast } from "@/hooks/use-toast";

const statusMap = {
  active: { label: "กำลังโพสต์", variant: "default" as const },
  matched: { label: "จับคู่แล้ว", variant: "secondary" as const },
  completed: { label: "สำเร็จ", variant: "outline" as const },
  cancelled: { label: "ยกเลิก", variant: "destructive" as const },
};

export default function MyPosts() {
  const { toast } = useToast();

  const [posts, setPosts] = useState<PostItem[]>(() => {
    const savedUser = localStorage.getItem("user");
    let user = savedUser ? JSON.parse(savedUser) : null;
    if (!user || !user.id) {
      user = { id: "1" };
    }
    return mockPosts.filter((post) => String(post.author.id) === String(user.id));
  });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, status: "cancelled" as const } : p));
    toast({ title: "ยกเลิกโพสต์แล้ว" });
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setPosts(posts.filter(p => p.id !== deleteTarget));
      setDeleteTarget(null);
      toast({ title: "ลบโพสต์แล้ว" });
    }
  };

  return (
    <AppLayout>
      {/* Header */}
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

      {/* Content */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => {
                const st = statusMap[post.status as keyof typeof statusMap] || statusMap.active;
                return (
                  <Card key={post.id} className="glass-card hover:shadow-md transition-all group">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={post.images[0]} alt={post.title}
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0 group-hover:shadow-md transition-shadow"
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm truncate">{post.title}</h3>
                            <Badge variant={st.variant} className="text-[10px] shrink-0">{st.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{post.createdAt}</p>
                          <p className="text-xs text-muted-foreground truncate">{post.category}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                              <Link to={`/post/${post.id}`} state={{ isOwnPostView: true }}>
                                <Eye className="h-3 w-3 mr-1" /> ดู
                              </Link>
                            </Button>
                            {post.status === "active" && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
                                <Link to={`/edit-post/${post.id}`}>
                                  <Edit className="h-3 w-3 mr-1" /> แก้ไข
                                </Link>
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => setDeleteTarget(post.id)}>
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
              <p className="text-muted-foreground text-lg">คุณยังไม่มีโพสต์</p>
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
