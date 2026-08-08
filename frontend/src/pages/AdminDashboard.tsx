import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileWarning, Trash2, Ban, CheckCircle, Flag, MessageSquare, Bug, Lightbulb, HelpCircle, Search, ExternalLink, FileText, AlertTriangle, ShieldAlert, Settings, Menu, ChevronLeft, LogOut, LayoutDashboard, UserX, AlertCircle, CheckCircle2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/StatCard";
import { getAdminUsers, getAdminItems, getReports, resolveReport, suspendMember, unsuspendMember, adminDeleteItem } from "@/api/api";
import { LucideIcon } from "lucide-react";
import React from "react";

// --- Interfaces ---
interface ApiUser {
  MemberID: string | number;
  DisplayName?: string;
  Email?: string;
  RegisterDate?: string;
  MemberStatus?: string;
  PostCount?: number;
}
interface ApiItem {
  ItemID: string | number;
  ItemName?: string;
  CategoryID?: string | number;
  PostDate?: string;
  MemberID: string | number;
  DisplayName?: string;
}
interface ApiReport {
  ProblemID: string | number;
  ProblemType?: string;
  ReporterName?: string;
  ReportDate?: string;
  ReportStatus?: string;
  ItemID?: string | number;
  ItemName?: string;
  ReportedMemberID?: string | number;
  ReportedMemberName?: string;
  HelpCenterData?: string;
}

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  suspended: boolean;
  postCount: number;
}
interface DashboardPost {
  id: string;
  title: string;
  category: string | number;
  createdAt: string;
  author: { id: string | number; name: string };
}
interface BaseReport {
  id: string;
  reason: string;
  reporter: string;
  createdAt: string;
  status: "pending" | "resolved";
}
interface PostReport extends BaseReport {
  targetId: string;
  targetTitle: string;
}
interface UserReport extends BaseReport {
  reportedUserId: string;
  reportedUserName: string;
  details: string;
}
interface FeedbackReport extends BaseReport {
  category: string;
  title: string;
  description: string;
}

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
  const currentDate = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // States ข้อมูล
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  // States ควบคุม UI
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // --- ดึงข้อมูลเข้า Dashboard ---
  const fetchDashboardData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [usersRes, itemsRes, reportsRes] = await Promise.all([
        getAdminUsers(),
        getAdminItems(),
        getReports(),
      ]);

      const usersData: ApiUser[] = usersRes.data || [];
      const itemsData: ApiItem[] = itemsRes.data || [];
      const allReportsData: ApiReport[] = reportsRes.data || [];

      setUsers(
        usersData.map((u: ApiUser) => ({
          id: String(u.MemberID),
          name: u.DisplayName || "ไม่ระบุชื่อ",
          email: u.Email || "",
          joinedAt: u.RegisterDate
            ? new Date(u.RegisterDate).toLocaleDateString("th-TH")
            : "ไม่ระบุ",
          suspended: (u.MemberStatus || "").toLowerCase() === "suspended",
          postCount: u.PostCount || 0,
        })),
      );

      setPosts(
        itemsData.map((p: ApiItem) => ({
          id: String(p.ItemID),
          title: p.ItemName || "ไม่พบชื่อโพสต์",
          category: p.CategoryID || "ทั่วไป",
          createdAt: p.PostDate
            ? new Date(p.PostDate).toLocaleDateString("th-TH")
            : "ไม่ระบุ",
          author: {
            id: String(p.MemberID),
            name: p.DisplayName || "ไม่ระบุชื่อ",
          },
        })),
      );

      const formattedReports: PostReport[] = [];
      const formattedUserReports: UserReport[] = [];
      const formattedFeedbacks: FeedbackReport[] = [];

      allReportsData.forEach((r: ApiReport) => {
        const hasItem =
          r.ItemID !== null && r.ItemID !== undefined && r.ItemID !== "";
        const hasReportedUser =
          r.ReportedMemberID !== null &&
          r.ReportedMemberID !== undefined &&
          r.ReportedMemberID !== "";
        const rawStatus = (r.ReportStatus || "").toLowerCase().trim();
        const isPending =
          rawStatus === "pending" ||
          rawStatus === "รอดำเนินการ" ||
          rawStatus === "in progress";

        const reportObj: BaseReport = {
          id: String(r.ProblemID),
          reason: r.ProblemType || "ไม่ระบุเหตุผล",
          reporter: r.ReporterName || "ไม่ระบุผู้แจ้ง",
          createdAt: r.ReportDate
            ? new Date(r.ReportDate).toLocaleDateString("th-TH")
            : "ไม่ระบุวันที่",
          status: isPending ? "pending" : "resolved",
        };

        const probTypeLow = (r.ProblemType || "").toLowerCase().trim();
        const isHelpCenter =
          ["bug", "suggestion", "other"].includes(probTypeLow) ||
          probTypeLow.includes("บั๊ก") ||
          probTypeLow.includes("เสนอแนะ");

        if (isHelpCenter) {
          let categoryType = "other";
          if (
            probTypeLow.includes("bug") ||
            probTypeLow.includes("บั๊ก") ||
            probTypeLow.includes("ขัดข้อง")
          )
            categoryType = "bug";
          else if (
            probTypeLow.includes("feedback") ||
            probTypeLow.includes("เสนอแนะ") ||
            probTypeLow === "suggestion"
          )
            categoryType = "suggestion";

          formattedFeedbacks.push({
            ...reportObj,
            category: categoryType,
            title: r.ProblemType || "รายงานระบบ",
            description: r.HelpCenterData || "",
          });
        } else if (hasItem) {
          formattedReports.push({
            ...reportObj,
            targetId: String(r.ItemID),
            targetTitle: r.ItemName || "ไม่พบชื่อโพสต์",
            reason: r.HelpCenterData || r.ProblemType || "ไม่มีรายละเอียด",
          });
        } else if (hasReportedUser) {
          formattedUserReports.push({
            ...reportObj,
            reportedUserId: String(r.ReportedMemberID),
            reportedUserName:
              r.ReportedMemberName || `ผู้ใช้ (ID: ${r.ReportedMemberID})`,
            details: r.HelpCenterData || "",
          });
        }
      });

      setReports(formattedReports);
      setUserReports(formattedUserReports);
      setFeedbacks(formattedFeedbacks);
    } catch (error: unknown) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลระบบได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- Variables & Handlers ---
  const pendingReports = reports.filter((r) => r.status === "pending");
  const pendingUserReports = userReports.filter((r) => r.status === "pending");
  const pendingFeedbacks = feedbacks.filter((f) => f.status === "pending");
  const totalIssues = pendingReports.length + pendingUserReports.length;

  // ปิดเคสรายงานโพสต์
  const handleResolveReport = async (id: string): Promise<void> => {
    try {
      await resolveReport(id);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "resolved" as const } : r,
        ),
      );
      toast({
        title: "จัดการรายงานเรียบร้อย",
        description: "ระบบได้ส่งแจ้งเตือนและอีเมลไปยังผู้แจ้งปัญหาแล้ว",
      });
    } catch (error: unknown) {
      console.error("Error resolving report:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสถานะรายงานได้",
        variant: "destructive",
      });
    }
  };

  // ปิดเคสรายงานผู้ใช้งาน
  const handleResolveUserReport = async (id: string): Promise<void> => {
    try {
      await resolveReport(id);
      setUserReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "resolved" as const } : r,
        ),
      );
      toast({ title: "ปิดเคสรายงานผู้ใช้แล้ว" });
    } catch (error: unknown) {
      console.error("Error resolving user report:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปิดเคสได้",
        variant: "destructive",
      });
    }
  };

  // ปิดเคสข้อเสนอแนะ
  const handleResolveFeedback = async (id: string): Promise<void> => {
    try {
      await resolveReport(id);
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "resolved" as const } : f,
        ),
      );
      toast({ title: "บันทึกสถานะเรียบร้อย" });
    } catch (error: unknown) {
      console.error("Error resolving feedback:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกสถานะได้",
        variant: "destructive",
      });
    }
  };

  // ลบโพสต์
  const handleDeletePost = async (id: string): Promise<void> => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?")) return;
    try {
      await adminDeleteItem(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "ลบโพสต์สำเร็จ", variant: "destructive" });
    } catch (error: unknown) {
      console.error("Error deleting post:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบโพสต์ได้",
        variant: "destructive",
      });
    }
  };

  // ระงับผู้ใช้งาน (แบน)
  const handleSuspendUser = async (id: string): Promise<void> => {
    try {
      await suspendMember(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, suspended: true } : u)),
      );
      toast({ title: "ระงับสิทธิ์ผู้ใช้งานแล้ว", variant: "destructive" });
    } catch (error: unknown) {
      console.error("Error suspending user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถระงับสิทธิ์ได้",
        variant: "destructive",
      });
    }
  };

  // คืนสิทธิ์ผู้ใช้งาน (ยกเลิกแบน)
  const handleUnsuspendUser = async (id: string): Promise<void> => {
    try {
      await unsuspendMember(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, suspended: false } : u)),
      );
      toast({ title: "ยกเลิกระงับสิทธิ์เรียบร้อย" });
    } catch (error: unknown) {
      console.error("Error unsuspending user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกระงับสิทธิ์ได้",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (): void => {
    setSearchTerm(searchInput.toLowerCase());
  };
  const handleLogout = (): void => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredUsers = users.filter(
    (u) =>
      !searchTerm ||
      (u.name && u.name.toLowerCase().includes(searchTerm)) ||
      (u.email && u.email.toLowerCase().includes(searchTerm)),
  );
  const filteredPosts = posts.filter(
    (p) =>
      !searchTerm ||
      (p.title && p.title.toLowerCase().includes(searchTerm)) ||
      (p.author?.name && p.author.name.toLowerCase().includes(searchTerm)),
  );

  const menuItems = [
    { id: "dashboard", label: "ภาพรวมระบบ", icon: LayoutDashboard },
    { id: "users", label: "จัดการผู้ใช้งาน", icon: Users },
    { id: "posts", label: "จัดการโพสต์", icon: FileText },
    {
      id: "reports",
      label: "รายงานปัญหา",
      icon: Flag,
      badge: totalIssues > 0 ? totalIssues : null,
    },
    {
      id: "feedback",
      label: "ข้อเสนอแนะ",
      icon: MessageSquare,
      badge: pendingFeedbacks.length > 0 ? pendingFeedbacks.length : null,
    },
  ];

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary/20 overflow-hidden font-sans">
      {/* 🗂️ 1. Sidebar */}
      <aside
        className={`relative flex flex-col bg-card border-r border-border/50 shadow-sm transition-all duration-300 ease-in-out z-20 ${isSidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          <div
            className={`flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}
          >
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">
              Admin<span className="text-primary">Panel</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"}`}
                title={!isSidebarOpen ? item.label : ""}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"}`}
                  />
                  {isSidebarOpen && (
                    <span className="font-medium text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className={`px-1.5 py-0 text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full transition-all ${!isSidebarOpen ? "absolute right-2 top-2" : ""} ${isActive ? "bg-background text-primary" : ""}`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group ${!isSidebarOpen ? "justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            {isSidebarOpen && (
              <span className="font-medium text-sm">ออกจากระบบ</span>
            )}
          </button>
        </div>
      </aside>

      {/* 📝 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-sm border-b border-border/50 z-10">
          <h2 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
            {menuItems.find((m) => m.id === activeMenu)?.label}
          </h2>

        </header>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-6">
            {activeMenu === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    value={users.length}
                    label="ผู้ใช้ทั้งหมด"
                    icon={<Users className="w-5 h-5 text-primary" />}
                    colorClass="bg-primary/10"
                  />
                  <StatCard
                    value={posts.length}
                    label="โพสต์ทั้งหมด"
                    icon={<FileText className="w-5 h-5 text-primary" />}
                    colorClass="bg-primary/10"
                  />
                  <StatCard
                    value={totalIssues}
                    label="ปัญหาที่ต้องแก้ไข"
                    icon={<AlertTriangle className="w-5 h-5 text-warning" />}
                    colorClass="bg-warning/10"
                  />
                  <StatCard
                    value={pendingFeedbacks.length}
                    label="ข้อเสนอแนะใหม่"
                    icon={<MessageSquare className="w-5 h-5 text-primary" />}
                    colorClass="bg-primary/10"
                  />
                </div>
                <div className="bg-background relative overflow-hidden p-6 rounded-2xl border border-border/60 shadow-sm">
  {/* Header */}
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
      <ShieldAlert className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-base font-bold text-foreground">สถานะระบบภาพรวม</h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        สรุปข้อมูลผู้ใช้งานและรายงานที่รอการตรวจสอบ
      </p>
    </div>
  </div>

  {/* Content Grid */}
  <div className="space-y-4">
    {/* สถิติผู้ใช้งาน */}
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col justify-center p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">บัญชีปกติ</span>
        </div>
        <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
          {users.filter((u) => !u.suspended).length} <span className="text-xs font-medium opacity-70">ราย</span>
        </div>
      </div>

      <div className="flex flex-col justify-center p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
        <div className="flex items-center gap-2 mb-1.5">
          <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">ถูกระงับ</span>
        </div>
        <div className="text-xl font-black text-rose-700 dark:text-rose-400">
          {users.filter((u) => u.suspended).length} <span className="text-xs font-medium opacity-70">ราย</span>
        </div>
      </div>
    </div>

    {/* กล่องแจ้งเตือน */}
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${
      totalIssues > 0 
        ? "bg-amber-500/10 border-amber-500/20" 
        : "bg-muted/30 border-border/50"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full shrink-0 ${
          totalIssues > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"
        }`}>
          {totalIssues > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        </div>
        <div>
          <p className={`text-sm font-bold ${
            totalIssues > 0 ? "text-amber-700 dark:text-amber-500" : "text-foreground"
          }`}>
            {totalIssues > 0 ? "มีรายการรอตรวจสอบ" : "ไม่มีรายงานปัญหาใหม่"}
          </p>
          <p className={`text-xs mt-0.5 ${
            totalIssues > 0 ? "text-amber-600/80 dark:text-amber-400/80" : "text-muted-foreground"
          }`}>
            {totalIssues > 0 
              ? "พบพฤติกรรมหรือโพสต์ที่ต้องตรวจสอบในเมนูรายงาน" 
              : "ระบบทำงานปกติ ไม่มีรายงานที่ต้องดำเนินการ"}
          </p>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-0 ml-11 sm:ml-0 flex items-end gap-1.5 shrink-0">
        <span className={`text-2xl font-black leading-none ${
          totalIssues > 0 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
        }`}>
          {totalIssues}
        </span>
        <span className="text-xs font-medium text-muted-foreground mb-0.5">รายการ</span>
      </div>
    </div>
  </div>
</div>
              </div>
            )}

            {(activeMenu === "users" || activeMenu === "posts") && (
              <div className="flex items-center gap-3 bg-card p-2 rounded-xl shadow-sm border border-border/50 animate-in fade-in duration-300">
                <Search className="w-5 h-5 text-muted-foreground ml-2" />
                <Input
                  placeholder={
                    activeMenu === "users"
                      ? "ค้นหาชื่อ หรือ อีเมลผู้ใช้..."
                      : "ค้นหาชื่อโพสต์ หรือ ผู้เขียน..."
                  }
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Button onClick={handleSearch} size="sm" className="rounded-lg">
                  ค้นหา
                </Button>
              </div>
            )}

            {activeMenu === "users" && (
              <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                {filteredUsers.length === 0 ? (
                  <EmptyState icon={Users} message="ไม่พบผู้ใช้ที่ค้นหา" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-5 py-4">ผู้ใช้งาน</th>
                          <th className="px-5 py-4 hidden lg:table-cell">
                            อีเมล
                          </th>
                          <th className="px-5 py-4 text-center">วันที่สมัคร</th>
                          <th className="px-5 py-4 text-center">สถานะ</th>
                          <th className="px-5 py-4 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${user.suspended ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}
                                >
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground lg:hidden">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">
                              {user.email}
                            </td>
                            <td className="px-5 py-3 text-center text-muted-foreground">
                              {user.joinedAt}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <Badge
                                variant={
                                  user.suspended ? "destructive" : "secondary"
                                }
                                className={
                                  !user.suspended
                                    ? "bg-primary/10 text-primary hover:bg-primary/20 border-0"
                                    : ""
                                }
                              >
                                {user.suspended ? "ระงับ" : "ปกติ"}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Settings className="w-4 h-4 mr-2" /> จัดการ
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      จัดการผู้ใช้งาน: {user.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                      ตั้งค่าสิทธิ์และตรวจสอบประวัติ
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Separator className="my-2" />
                                  <div className="space-y-3">
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() =>
                                        navigate(`/user/${user.id}`, {
                                          state: { fromAdmin: true },
                                        })
                                      }
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />{" "}
                                      ดูโปรไฟล์เต็ม
                                    </Button>
                                    {!user.suspended ? (
                                      <Button
                                        variant="destructive"
                                        className="w-full justify-start"
                                        onClick={() =>
                                          handleSuspendUser(user.id)
                                        }
                                      >
                                        <Ban className="w-4 h-4 mr-2" />{" "}
                                        ระงับสิทธิ์บัญชี
                                      </Button>
                                    ) : (
                                      <Button
                                        className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={() =>
                                          handleUnsuspendUser(user.id)
                                        }
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />{" "}
                                        คืนสิทธิ์การใช้งาน
                                      </Button>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeMenu === "posts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {filteredPosts.length === 0 ? (
                  <EmptyState icon={FileText} message="ไม่มีโพสต์ในระบบ" />
                ) : (
                  filteredPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="border-border/40 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                        <div>
                          <Badge
                            variant="secondary"
                            className="mb-3 text-[10px] bg-secondary/50"
                          >
                            {post.category}
                          </Badge>
                          <h4
                            className="font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            {post.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-[10px]">
                              {post.author?.name?.charAt(0)}
                            </div>
                            <span>{post.author?.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeMenu === "reports" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <section>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileWarning className="w-5 h-5 text-destructive" />{" "}
                    รายงานโพสต์
                  </h3>
                  {reports.length === 0 ? (
                    <EmptyState icon={CheckCircle} message="ไม่มีรายงานโพสต์" />
                  ) : (
                    <div className="grid gap-3">
                      {reports.map((report) => (
                        <Card
                          key={report.id}
                          className={`border-l-4 ${report.status === "pending" ? "border-l-warning shadow-sm" : "border-l-muted opacity-60"}`}
                        >
                          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex gap-2 mb-1">
                                <Badge
                                  className={
                                    report.status === "pending"
                                      ? "bg-warning/20 text-warning border-0"
                                      : "bg-muted text-muted-foreground border-0"
                                  }
                                >
                                  {report.status === "pending"
                                    ? "รอตรวจสอบ"
                                    : "ปิดเคส"}
                                </Badge>
                                <span
                                  className="font-semibold hover:underline cursor-pointer truncate"
                                  onClick={() =>
                                    navigate(`/post/${report.targetId}`)
                                  }
                                >
                                  {report.targetTitle}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md my-2">
                                เหตุผล: {report.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                แจ้งโดย: {report.reporter} • {report.createdAt}
                              </p>
                            </div>
                            {report.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveReport(report.id)}
                                className="w-full sm:w-auto hover:bg-success/10 hover:text-success hover:border-success"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />{" "}
                                ยืนยันตรวจสอบ
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                <Separator />

                <section>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-destructive" />{" "}
                    รายงานผู้ใช้งาน
                  </h3>
                  {userReports.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle}
                      message="ไม่มีรายงานผู้ใช้"
                    />
                  ) : (
                    <div className="grid gap-3">
                      {userReports.map((report) => (
                        <Card
                          key={report.id}
                          className={`border-l-4 ${report.status === "pending" ? "border-l-destructive shadow-sm" : "border-l-muted opacity-60"}`}
                        >
                          <CardContent className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-destructive mb-2">
                                เป้าหมาย: {report.reportedUserName}
                              </p>
                              <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/10 mb-2">
                                <p className="font-semibold text-sm">
                                  {report.reason}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {report.details}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                แจ้งโดย: {report.reporter} • {report.createdAt}
                              </p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              {report.status === "pending" && (
                                <>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleSuspendUser(report.reportedUserId)
                                    }
                                  >
                                    <Ban className="w-4 h-4 mr-2" /> แบนผู้ใช้
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleResolveUserReport(report.id)
                                    }
                                  >
                                    ข้าม
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeMenu === "feedback" && (
              <div className="grid gap-4 animate-in fade-in duration-300">
                {feedbacks.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    message="ไม่มีข้อเสนอแนะใหม่"
                  />
                ) : (
                  feedbacks.map((fb) => (
                    <Card
                      key={fb.id}
                      className={`transition-all ${fb.status === "pending" ? "border-primary/40 shadow-sm" : "opacity-60 bg-muted/10"}`}
                    >
                      <CardContent className="p-5 flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                          {feedbackCategoryIcon[fb.category] || (
                            <HelpCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{fb.title}</h4>
                              <Badge
                                variant="outline"
                                className="text-[10px] mt-1 bg-background"
                              >
                                {feedbackCategoryLabel[fb.category]}
                              </Badge>
                            </div>
                            {fb.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleResolveFeedback(fb.id)}
                                className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                              >
                                รับทราบ
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-xl leading-relaxed">
                            {fb.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-3 flex gap-2">
                            <Users className="w-3 h-3" /> {fb.reporter} •{" "}
                            {fb.createdAt}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      {/* 📌 Modal ยืนยันการออกจากระบบสำหรับหน้า AdminDashboard */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border/80 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground whitespace-nowrap">
                  ยืนยันการออกจากระบบ?
                </h3>
                <p className="text-xs text-muted-foreground">
                  คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งาน
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 w-full">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-10 text-xs font-bold whitespace-nowrap"
                onClick={() => setShowLogoutConfirm(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 rounded-2xl h-11 text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                onClick={handleLogout}
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon | React.ElementType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-card/30">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
