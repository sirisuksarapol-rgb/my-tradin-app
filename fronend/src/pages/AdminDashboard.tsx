import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   Users, FileWarning, Trash2, Ban, CheckCircle,
   Flag, MessageSquare, Bug, Lightbulb, HelpCircle, Search,
   Calendar, ExternalLink, FileText, AlertTriangle, ShieldAlert,
   Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AdminNavbar } from "@/components/AdminNavbar";
import { StatCard } from "@/components/StatCard";
import { MOCK_USERS, mockUserReports, type User, type UserReport } from "@/lib/user_data";
import { mockPosts, mockReports, type PostItem, type PostReport } from "@/lib/post_data";
import { mockFeedbacks, type Feedback } from "@/lib/report_data";
import Footer from "@/components/Footer";

const feedbackCategoryIcon: Record<string, React.ReactNode> = {
   bug: <Bug className="w-4 h-4 text-destructive" />,
   suggestion: <Lightbulb className="w-4 h-4 text-warning" />,
   other: <HelpCircle className="w-4 h-4 text-muted-foreground" />,
};

const feedbackCategoryLabel: Record<string, string> = {
   bug: "แจ้งบั๊ก/ปัญหา",
   suggestion: "ข้อเสนอแนะ",
   other: "อื่นๆ",
};

export default function AdminDashboard() {
   const navigate = useNavigate();
   const currentDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

   const [users, setUsers] = useState<User[]>(MOCK_USERS || []);
   const [posts, setPosts] = useState<PostItem[]>(mockPosts || []);

   const formattedReports = (mockReports || []).map((r: any) => {
      const targetPostId = r.postId || r.post_id || r.targetId || r.target_id || r.id;
      const targetPost = posts.find((p) => String(p.id) === String(targetPostId));
      return {
         id: String(r.id || Math.random()),
         targetId: String(targetPostId),
         targetTitle: targetPost?.title || r.targetTitle || "ไม่พบชื่อโพสต์",
         reason: r.reason || "ไม่ระบุเหตุผล",
         reporter: r.reporter || "ไม่ระบุชื่อผู้แจ้ง",
         createdAt: r.createdAt || "ไม่ระบุวันที่",
         status: (r.status || "pending") as "pending" | "resolved"
      };
   }) as (PostReport & { targetId: string })[];

   const [reports, setReports] = useState(formattedReports);
   const [userReports, setUserReports] = useState<UserReport[]>(mockUserReports || []);
   const [feedbacks, setFeedbacks] = useState<Feedback[]>(mockFeedbacks || []);
   const [activeTab, setActiveTab] = useState("users");
   const [searchInput, setSearchInput] = useState("");
   const [searchTerm, setSearchTerm] = useState("");

   const pendingReports = reports.filter((r) => r.status === "pending");
   const pendingUserReports = userReports.filter((r) => r.status === "pending");
   const pendingFeedbacks = feedbacks.filter((f) => f.status === "pending");
   const hasNotifications = pendingReports.length > 0 || pendingUserReports.length > 0;

   const resolveReport = (id: string) => {
      setReports(reports.map((r) => (r.id === id ? { ...r, status: "resolved" as const } : r)));
      toast({ title: "จัดการรายงานเรียบร้อย", description: "ระบบได้บันทึกสถานะเรียบร้อยแล้ว" });
   };
   const resolveUserReport = (id: string) => {
      setUserReports(userReports.map((r) => (r.id === id ? { ...r, status: "resolved" as const } : r)));
      toast({ title: "จัดการรายงานเรียบร้อย", description: "ปิดเคสรายงานผู้ใช้แล้ว" });
   };
   const resolveFeedback = (id: string) => {
      setFeedbacks(feedbacks.map((f) => (f.id === id ? { ...f, status: "resolved" as const } : f)));
      toast({ title: "ตรวจสอบแล้ว", description: "บันทึกสถานะข้อเสนอแนะเรียบร้อย" });
   };
   const deletePost = (id: string) => {
      setPosts(posts.filter((p) => p.id !== id));
      toast({ title: "ลบโพสต์สำเร็จ", description: "โพสต์ถูกลบออกจากระบบแล้ว", variant: "destructive" });
   };
   const suspendUser = (id: string) => {
      setUsers(users.map((u) => (u.id === id ? { ...u, suspended: true } : u)));
      toast({ title: "ระงับผู้ใช้แล้ว", description: "บัญชีถูกระงับเรียบร้อย", variant: "destructive" });
   };
   const unsuspendUser = (id: string) => {
      setUsers(users.map((u) => (u.id === id ? { ...u, suspended: false } : u)));
      toast({ title: "ยกเลิกระงับแล้ว", description: "บัญชีใช้งานได้ตามปกติ" });
   };
   const handleSearch = () => { setSearchTerm(searchInput.toLowerCase()); };
   const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };

   const filteredUsers = users.filter(u => !searchTerm || (u.name && u.name.toLowerCase().includes(searchTerm)) || (u.email && u.email.toLowerCase().includes(searchTerm)));
   const filteredPosts = posts.filter(p => !searchTerm || (p.title && p.title.toLowerCase().includes(searchTerm)) || (p.author?.name && p.author.name.toLowerCase().includes(searchTerm)));

   const getSearchPlaceholder = () => {
      switch (activeTab) {
         case "users": return "ค้นหาชื่อ หรือ อีเมล...";
         case "posts": return "ค้นหาโพสต์ หรือ ผู้เขียน...";
         default: return "ค้นหา...";
      }
   };

   useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

   return (
      <div className="min-h-screen flex flex-col bg-background/50">
         <AdminNavbar onLogout={handleLogout} />
         <main className="flex-1 container px-4 sm:px-6 py-6 md:py-8 space-y-6 md:space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
               <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                     <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                     ภาพรวมระบบผู้ดูแล
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">จัดการผู้ใช้ โพสต์ รายงาน และข้อเสนอแนะทั้งหมดในที่เดียว</p>
               </div>
               <div className="text-left sm:text-right bg-secondary/30 p-2 md:p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] text-muted-foreground">รายงานข้อมูล ณ วันที่</p>
                  <p className="text-xs md:text-sm font-medium">{currentDate}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
               <StatCard value={users.length} label="ผู้ใช้ทั้งหมด" icon={<Users className="w-5 h-5 text-primary" />} colorClass="bg-primary/10" />
               <StatCard value={posts.length} label="โพสต์ทั้งหมด" icon={<FileText className="w-5 h-5 text-primary" />} colorClass="bg-primary/10" />
               <StatCard value={pendingReports.length + pendingUserReports.length} label="รายงานรอดำเนินการ" icon={<AlertTriangle className="w-5 h-5 text-warning" />} colorClass="bg-warning/10" />
               <StatCard value={pendingFeedbacks.length} label="ข้อเสนอแนะใหม่" icon={<MessageSquare className="w-5 h-5 text-primary" />} colorClass="bg-primary/10" />
            </div>

            <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
               <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between bg-card p-3 rounded-xl border border-border/50 shadow-sm mb-6">
                  <TabsList className="bg-transparent h-auto flex flex-row flex-wrap lg:flex-nowrap justify-start gap-1 p-0 w-full lg:w-auto">
                     <TabsTrigger value="users" className="flex-1 lg:flex-none whitespace-nowrap text-xs sm:text-sm gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2.5 h-auto">
                        <Users className="w-4 h-4 hidden sm:block" /> ผู้ใช้งาน
                     </TabsTrigger>
                     <TabsTrigger value="posts" className="flex-1 lg:flex-none whitespace-nowrap text-xs sm:text-sm gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2.5 h-auto">
                        <FileText className="w-4 h-4 hidden sm:block" /> โพสต์
                     </TabsTrigger>
                     <TabsTrigger value="reports" className="flex-1 lg:flex-none whitespace-nowrap text-xs sm:text-sm gap-2 relative data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2.5 h-auto">
                        <Flag className="w-4 h-4 hidden sm:block" /> ปัญหา
                        {hasNotifications && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />}
                     </TabsTrigger>
                     <TabsTrigger value="feedback" className="flex-1 lg:flex-none whitespace-nowrap text-xs sm:text-sm gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-3 py-2.5 h-auto">
                        <MessageSquare className="w-4 h-4 hidden sm:block" /> เสนอแนะ
                     </TabsTrigger>
                  </TabsList>
                  {(activeTab === "users" || activeTab === "posts") && (
                     <div className="relative w-full lg:w-72 mt-2 lg:mt-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder={getSearchPlaceholder()} className="pl-9 h-10 w-full" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }} />
                     </div>
                  )}
               </div>

               {/* Users */}
               <TabsContent value="users" className="space-y-3 m-0">
                  {filteredUsers.length === 0 ? (
                     <EmptyState icon={Users} message="ไม่พบผู้ใช้ที่ค้นหา" />
                  ) : (
                     <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left whitespace-nowrap">
                              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border/50">
                                 <tr>
                                    <th className="px-4 md:px-5 py-3 md:py-4 font-semibold">ชื่อผู้ใช้งาน</th>
                                    <th className="px-4 md:px-5 py-3 md:py-4 font-semibold hidden lg:table-cell">อีเมล</th>
                                    <th className="px-4 md:px-5 py-3 md:py-4 font-semibold text-center hidden sm:table-cell">วันที่สมัคร</th>
                                    <th className="px-4 md:px-5 py-3 md:py-4 font-semibold text-right">โพสต์</th>
                                    <th className="px-4 md:px-5 py-3 md:py-4 font-semibold text-center">สถานะ</th>
                                    <th className="px-4 md:px-5 py-3 md:py-4 font-semibold text-center">จัดการ</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                 {filteredUsers.map((user) => {
                                    const userPostCount = posts.filter(p => p.author?.id === user.id).length;
                                    return (
                                       <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                          <td className="px-4 md:px-5 py-3">
                                             <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${user.suspended ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                                   {user.name ? user.name.charAt(0) : "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                   <p className="font-semibold text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => navigate(`/user/${user.id}`, { state: { fromAdmin: true } })}>
                                                      {user.name || "ไม่ระบุชื่อ"}
                                                   </p>
                                                   <span className="text-[10px] text-muted-foreground lg:hidden">{user.email}</span>
                                                </div>
                                             </div>
                                          </td>
                                          <td className="px-4 md:px-5 py-3 text-muted-foreground hidden lg:table-cell">{user.email}</td>
                                          <td className="px-4 md:px-5 py-3 text-center text-muted-foreground hidden sm:table-cell">{user.joinedAt}</td>
                                          <td className="px-4 md:px-5 py-3 text-right font-medium">{userPostCount}</td>
                                          <td className="px-4 md:px-5 py-3 text-center">
                                             {user.suspended ? (
                                                <Badge variant="destructive" className="text-[10px]">ระงับ</Badge>
                                             ) : (
                                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/5">ปกติ</Badge>
                                             )}
                                          </td>
                                          <td className="px-4 md:px-5 py-3 text-center">
                                             <Dialog>
                                                <DialogTrigger asChild>
                                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                      <Settings className="w-4 h-4" />
                                                   </Button>
                                                </DialogTrigger>
                                                <DialogContent className="w-[95vw] sm:max-w-md rounded-xl">
                                                   <DialogHeader>
                                                      <DialogTitle>จัดการผู้ใช้งาน</DialogTitle>
                                                      <DialogDescription>รายละเอียดบัญชีและประวัติการใช้งานระบบ</DialogDescription>
                                                   </DialogHeader>
                                                   <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
                                                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary uppercase shrink-0">
                                                         {user.name ? user.name.charAt(0) : "U"}
                                                      </div>
                                                      <div className="min-w-0">
                                                         <p className="text-lg font-semibold text-foreground truncate">{user.name}</p>
                                                         <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                                         <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <Badge variant="secondary" className="text-[10px]">เข้าร่วม: {user.joinedAt}</Badge>
                                                            <Badge variant="secondary" className="text-[10px]">โพสต์: {userPostCount}</Badge>
                                                         </div>
                                                      </div>
                                                   </div>
                                                   <Separator />
                                                   <div className="pt-3 flex flex-col gap-2">
                                                      <Button variant="outline" className="w-full" onClick={() => navigate(`/user/${user.id}`, { state: { fromAdmin: true } })}>ดูหน้าโปรไฟล์แบบเต็ม</Button>
                                                      {!user.suspended ? (
                                                         <Button variant="destructive" className="w-full" onClick={() => suspendUser(user.id)}>
                                                            <Ban className="w-4 h-4 mr-2" /> ระงับสิทธิ์บัญชี
                                                         </Button>
                                                      ) : (
                                                         <Button variant="outline" className="w-full text-primary border-primary/30 hover:bg-primary/10" onClick={() => unsuspendUser(user.id)}>
                                                            <CheckCircle className="w-4 h-4 mr-2" /> คืนสิทธิ์การใช้งาน
                                                         </Button>
                                                      )}
                                                   </div>
                                                </DialogContent>
                                             </Dialog>
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </TabsContent>

               {/* Posts */}
               <TabsContent value="posts" className="space-y-3 m-0">
                  {filteredPosts.length === 0 ? (
                     <EmptyState icon={FileText} message="ไม่มีโพสต์ในระบบ" />
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPosts.map((post) => (
                           <Card key={post.id} className="border-border/50 shadow-sm hover:border-primary/20 transition-all">
                              <CardContent className="p-4 flex items-start justify-between gap-3">
                                 <div className="min-w-0 flex-1">
                                    <Badge variant="secondary" className="text-[9px] mb-1.5">{post.category}</Badge>
                                    <p className="text-sm font-semibold line-clamp-2 cursor-pointer hover:text-primary hover:underline" onClick={() => navigate(`/post/${post.id}`)}>
                                       {post.title} <ExternalLink className="inline w-3 h-3 text-muted-foreground ml-1" />
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                       <span>{post.author?.name}</span><span>•</span>
                                       <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.createdAt}</span>
                                    </div>
                                 </div>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => deletePost(post.id)}>
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </CardContent>
                           </Card>
                        ))}
                     </div>
                  )}
               </TabsContent>

               {/* Reports */}
               <TabsContent value="reports" className="space-y-8 m-0">
                  <div className="space-y-3">
                     <div className="flex items-center gap-2 px-1">
                        <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center"><FileWarning className="w-4 h-4 text-destructive" /></div>
                        <h3 className="text-sm md:text-base font-semibold">รายงานโพสต์ที่ไม่เหมาะสม</h3>
                        {pendingReports.length > 0 && <Badge variant="destructive" className="ml-2 text-[10px] rounded-full">{pendingReports.length} ใหม่</Badge>}
                     </div>
                     {reports.length === 0 ? <EmptyState icon={CheckCircle} message="ไม่มีรายงานโพสต์" /> : (
                        <div className="grid grid-cols-1 gap-3">
                           {reports.map((report) => (
                              <Card key={report.id} className={`border-border/50 shadow-sm ${report.status === 'pending' ? 'border-l-4 border-l-warning' : 'opacity-70'}`}>
                                 <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                       <div className="flex flex-wrap items-center gap-2">
                                          <Badge className={`text-[9px] ${report.status === "pending" ? "bg-warning/15 text-warning-foreground border-0" : "bg-transparent text-muted-foreground"}`}>
                                             {report.status === "pending" ? "รอดำเนินการ" : "ปิดเคสแล้ว"}
                                          </Badge>
                                          <p className="text-sm font-semibold cursor-pointer hover:text-primary hover:underline" onClick={() => navigate(`/post/${report.targetId}`)}>
                                             {report.targetTitle}
                                          </p>
                                       </div>
                                       <div className="bg-muted/50 p-2.5 rounded-md"><p className="text-xs"><span className="text-muted-foreground">เหตุผล:</span> {report.reason}</p></div>
                                       <p className="text-xs text-muted-foreground">แจ้งโดย: <span className="font-medium">{report.reporter}</span> • {report.createdAt}</p>
                                    </div>
                                    {report.status === "pending" && (
                                       <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0" onClick={() => resolveReport(report.id)}>
                                          <CheckCircle className="w-3.5 h-3.5" /> จัดการแล้ว
                                       </Button>
                                    )}
                                 </CardContent>
                              </Card>
                           ))}
                        </div>
                     )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                     <div className="flex items-center gap-2 px-1">
                        <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center"><Flag className="w-4 h-4 text-warning" /></div>
                        <h3 className="text-sm md:text-base font-semibold">รายงานพฤติกรรมผู้ใช้</h3>
                        {pendingUserReports.length > 0 && <Badge className="ml-2 text-[10px] rounded-full bg-warning text-warning-foreground">{pendingUserReports.length} ใหม่</Badge>}
                     </div>
                     {userReports.length === 0 ? <EmptyState icon={CheckCircle} message="ไม่มีรายงานผู้ใช้" /> : (
                        <div className="grid grid-cols-1 gap-3">
                           {userReports.map((report) => (
                              <Card key={report.id} className={`border-border/50 shadow-sm ${report.status === 'pending' ? 'border-l-4 border-l-destructive' : 'opacity-70'}`}>
                                 <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-2">
                                       <div className="flex flex-wrap items-center gap-2">
                                          <Badge className={`text-[9px] ${report.status === "pending" ? "bg-destructive/15 text-destructive border-0" : "bg-transparent text-muted-foreground"}`}>
                                             {report.status === "pending" ? "รอตรวจสอบ" : "จัดการแล้ว"}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">ผู้ถูกรายงาน:</span>
                                          <span className="text-sm font-bold text-destructive cursor-pointer hover:underline" onClick={() => navigate(`/user/${report.reportedUserId}`, { state: { fromAdmin: true } })}>
                                             {report.reportedUserName}
                                          </span>
                                       </div>
                                       <div className="bg-destructive/5 border border-destructive/10 p-3 rounded-md space-y-1">
                                          <p className="text-xs font-semibold">{report.reason}</p>
                                          <p className="text-xs text-muted-foreground">{report.details}</p>
                                       </div>
                                       <p className="text-xs text-muted-foreground">แจ้งโดย: <span className="font-medium">{report.reporter}</span> • {report.createdAt}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                                       {report.status === "pending" && (
                                          <>
                                             <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={() => suspendUser(report.reportedUserId)}>
                                                <Ban className="w-3.5 h-3.5" /> ระงับบัญชี
                                             </Button>
                                             <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => resolveUserReport(report.id)}>
                                                <CheckCircle className="w-3.5 h-3.5" /> ปิดเคส
                                             </Button>
                                          </>
                                       )}
                                    </div>
                                 </CardContent>
                              </Card>
                           ))}
                        </div>
                     )}
                  </div>
               </TabsContent>

               {/* Feedback */}
               <TabsContent value="feedback" className="space-y-3 m-0">
                  {feedbacks.length === 0 ? <EmptyState icon={MessageSquare} message="ไม่มีข้อเสนอแนะใหม่" /> : (
                     <div className="grid grid-cols-1 gap-3">
                        {feedbacks.map((fb) => (
                           <Card key={fb.id} className={`border-border/50 shadow-sm ${fb.status === 'pending' ? 'border-l-4 border-l-primary/60' : 'opacity-70'}`}>
                              <CardContent className="p-4">
                                 <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/50 hidden sm:flex">
                                       {feedbackCategoryIcon[fb.category] || <HelpCircle className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-2.5 w-full">
                                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                             <p className="text-sm font-semibold">{fb.title}</p>
                                             <Badge variant="secondary" className="text-[9px] mt-1">{feedbackCategoryLabel[fb.category]}</Badge>
                                          </div>
                                          {fb.status === "pending" && (
                                             <Button variant="outline" size="sm" className="w-full sm:w-auto h-8 text-xs gap-1.5" onClick={() => resolveFeedback(fb.id)}>
                                                <CheckCircle className="w-3.5 h-3.5" /> รับทราบ
                                             </Button>
                                          )}
                                       </div>
                                       <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
                                          <p className="text-xs text-muted-foreground">{fb.description}</p>
                                       </div>
                                       <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                          <Users className="w-3 h-3" /> {fb.reporter} • <Calendar className="w-3 h-3" /> {fb.createdAt}
                                       </p>
                                    </div>
                                 </div>
                              </CardContent>
                           </Card>
                        ))}
                     </div>
                  )}
               </TabsContent>
            </Tabs>

            {/* Summary */}
            <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 shadow-sm">
               <h3 className="text-sm md:text-base font-bold text-primary flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5" /> สรุปผลการดำเนินการ
               </h3>
               <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  📌 <strong>ภาพรวมระบบ:</strong> มีผู้ใช้งานปกติ {users.filter(u => !u.suspended).length} ราย (ถูกระงับ {users.filter(u => u.suspended).length} ราย) และสิ่งของหมุนเวียน {posts.length} รายการ
                  <br />⚠️ <strong>ข้อเสนอแนะ:</strong> มีรายงานรอตรวจสอบ {pendingReports.length + pendingUserReports.length} รายการ
                  {pendingReports.length + pendingUserReports.length > 0 ? " แนะนำให้เร่งดำเนินการ" : " ระบบอยู่ในสถานะปกติ"}
               </p>
            </div>
         </main>
         <Footer />
      </div>
   );
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
   return (
      <Card className="border-dashed border-2 border-border/60 bg-transparent shadow-none">
         <CardContent className="flex flex-col items-center justify-center p-12 text-center opacity-70">
            <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-muted-foreground">
               <Icon className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{message}</p>
         </CardContent>
      </Card>
   );
}
