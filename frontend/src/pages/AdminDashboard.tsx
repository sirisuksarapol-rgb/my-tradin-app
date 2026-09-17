import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileWarning,
  Trash2,
  Ban,
  CheckCircle,
  Flag,
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  Search,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Menu,
  ChevronLeft,
  LogOut,
  LayoutDashboard,
  UserX,
  AlertCircle,
  CheckCircle2,
  LucideIcon,
  Layers,
  Settings,
  Star,
  Package,
  ArrowRightLeft,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/StatCard";
import {
  getAdminUsers,
  getAdminItems,
  getReports,
  resolveReport,
  suspendMember,
  unsuspendMember,
  adminDeleteItem,
  getUserStats,
  IMAGE_BASE_URL,
} from "@/api/api";
import { CategoryManagement } from "@/components/CategoryManagement";
import React from "react";

interface ApiUser {
  MemberID: string | number;
  DisplayName?: string;
  Email?: string;
  ProfileImage?: string;
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
  ItemImage?: string;
  ProfileImage?: string;
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

interface UserReview {
  id: string | number;
  comment: string;
  rating: number;
  reviewerName: string;
  date: string;
}

interface UserStatsData {
  successfulExchanges: number;
  failedExchanges: number;
  rating: number;
  reviews: UserReview[];
}

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  joinedAt: string;
  suspended: boolean;
  postCount: number;
  suspendDetails?: {
    type: "temporary" | "permanent";
    untilDate?: string;
    reason?: string;
  };
}

interface ManageUserModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  profileImage?: string;
  postCount: number;
  suspended: boolean;
  suspendDetails?: {
    type: "temporary" | "permanent";
    untilDate?: string;
    reason?: string;
  };
  isLoadingStats: boolean;
  stats: UserStatsData | null;
}

interface DashboardPost {
  id: string;
  title: string;
  category: string | number;
  createdAt: string;
  image?: string;
  author: {
    id: string | number;
    name: string;
    profileImage?: string;
  };
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

  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [manageModal, setManageModal] = useState<ManageUserModalState>({
    isOpen: false,
    userId: "",
    userName: "",
    userEmail: "",
    profileImage: undefined,
    postCount: 0,
    suspended: false,
    isLoadingStats: false,
    stats: null,
  });

  const [suspendModal, setSuspendModal] = useState({
    isOpen: false,
    userId: "",
    userName: "",
    reportIdToResolve: "",
  });
  const [unsuspendModal, setUnsuspendModal] = useState({
    isOpen: false,
    userId: "",
    userName: "",
  });
  const [suspendForm, setSuspendForm] = useState({
    type: "temporary",
    days: "7",
    reason: "",
  });
  const [unsuspendReason, setUnsuspendReason] = useState<string>("");

  const [deletePostModal, setDeletePostModal] = useState({
    isOpen: false,
    postId: "",
    postTitle: "",
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSuccessModal, setDeleteSuccessModal] = useState({
    isOpen: false,
    reason: "",
  });

  const handleOpenManageModal = async (user: DashboardUser): Promise<void> => {
    setManageModal({
      isOpen: true,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      profileImage: user.profileImage,
      postCount: user.postCount,
      suspended: user.suspended,
      suspendDetails: user.suspendDetails,
      isLoadingStats: true,
      stats: null,
    });

    try {
      const response = await getUserStats(user.id);
      const responseObj = response as {
        data?: {
          successfulExchanges?: number;
          failedExchanges?: number;
          rating?: number;
          reviews?: UserReview[];
        };
      };
      const rawData = responseObj?.data || response;
      const record = rawData as {
        successfulExchanges?: number;
        failedExchanges?: number;
        rating?: number;
        reviews?: UserReview[];
      };

      const reviewsList = Array.isArray(record?.reviews)
        ? record.reviews.map(
            (rev): UserReview => ({
              id: String(rev.id || ""),
              comment: String(rev.comment || "ไม่มีความคิดเห็น"),
              rating: Number(rev.rating || 0),
              reviewerName: String(rev.reviewerName || "ผู้ใช้งานระบบ"),
              date: String(rev.date || ""),
            }),
          )
        : [];

      const statsData: UserStatsData = {
        successfulExchanges: Number(record?.successfulExchanges ?? 0),
        failedExchanges: Number(record?.failedExchanges ?? 0),
        rating: Number(record?.rating ?? 0),
        reviews: reviewsList,
      };

      setManageModal((prev) => ({
        ...prev,
        isLoadingStats: false,
        stats: statsData,
      }));
    } catch (error: unknown) {
      console.error("Error fetching user stats:", error);
      setManageModal((prev) => ({
        ...prev,
        isLoadingStats: false,
        stats: {
          successfulExchanges: 0,
          failedExchanges: 0,
          rating: 0,
          reviews: [],
        },
      }));
    }
  };

  const handleConfirmSuspend = async (): Promise<void> => {
    try {
      const daysNum = Number(suspendForm.days) || 7;
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + daysNum);

      const payload = {
        type: suspendForm.type,
        until_date:
          suspendForm.type === "temporary"
            ? untilDate.toISOString().split("T")[0]
            : undefined,
        reason: suspendForm.reason,
      };

      await suspendMember(suspendModal.userId, payload);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === suspendModal.userId
            ? {
                ...u,
                suspended: true,
                suspendDetails: {
                  type: suspendForm.type as "temporary" | "permanent",
                  untilDate:
                    suspendForm.type === "temporary"
                      ? untilDate.toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : undefined,
                  reason: suspendForm.reason,
                },
              }
            : u,
        ),
      );

      if (suspendModal.reportIdToResolve) {
        await handleResolveUserReport(suspendModal.reportIdToResolve);
      }

      toast({
        title: "ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว",
        description: `เหตุผล: ${suspendForm.reason}`,
        variant: "destructive",
      });

      setSuspendModal((prev) => ({ ...prev, isOpen: false }));
      setManageModal((prev) => ({ ...prev, isOpen: false }));
    } catch (error: unknown) {
      console.error("Error suspending user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถระงับสิทธิ์ได้",
        variant: "destructive",
      });
    }
  };

  const confirmDeletePost = (post: DashboardPost) => {
    setDeletePostModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title,
    });
    setDeleteReason(""); // ล้างค่าเหตุผลเก่า
  };

  // ✅ ดำเนินการลบจริง
  const executeDeletePost = async (): Promise<void> => {
    try {
      const finalReason = deleteReason.trim() || "ผิดกฎระเบียบของระบบ (ไม่ระบุเหตุผลย่อย)";
      
      // ส่ง ID และเหตุผลไปยัง API
      await adminDeleteItem(deletePostModal.postId, finalReason);

      // นำโพสต์ออกจาก State
      setPosts((prev) => prev.filter((p) => p.id !== deletePostModal.postId));

      // ปิด Pop-up ยืนยัน แล้วเปิด Pop-up สำเร็จ
      setDeletePostModal({ isOpen: false, postId: "", postTitle: "" });
      setDeleteSuccessModal({
        isOpen: true,
        reason: finalReason,
      });
      setDeleteReason(""); // ล้างค่าเหตุผล
      
    } catch (error: unknown) {
      console.error("Error deleting post:", error);
      
      // ตรวจสอบ Type ของ error อย่างปลอดภัยโดยไม่ใช้ any
      let errorMessage = "ไม่สามารถลบโพสต์ได้";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "response" in error) {
        // กรณีเป็น Axios Error
        errorMessage = "เซิร์ฟเวอร์ปฏิเสธการลบโพสต์";
      }

      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleConfirmUnsuspend = async (): Promise<void> => {
    try {
      await unsuspendMember(unsuspendModal.userId);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === unsuspendModal.userId
            ? { ...u, suspended: false, suspendDetails: undefined }
            : u,
        ),
      );

      toast({
        title: "คืนสิทธิ์การใช้งานเรียบร้อยแล้ว",
        description: `ปลดการระงับสำเร็จ: ${unsuspendReason || "ไม่มีระบุ"}`,
      });

      setUnsuspendModal({ isOpen: false, userId: "", userName: "" });
      setUnsuspendReason("");
      setManageModal((prev) => ({ ...prev, isOpen: false }));
    } catch (error: unknown) {
      console.error("Error unsuspending user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกระงับสิทธิ์ได้",
        variant: "destructive",
      });
    }
  };

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
        usersData.map(
          (u: ApiUser): DashboardUser => ({
            id: String(u.MemberID),
            name: u.DisplayName || "ไม่ระบุชื่อ",
            email: u.Email || "",
            profileImage: u.ProfileImage,
            joinedAt: u.RegisterDate
              ? new Date(u.RegisterDate).toLocaleDateString("th-TH")
              : "ไม่ระบุ",
            suspended: (u.MemberStatus || "").toLowerCase() === "suspended",
            postCount: u.PostCount || 0,
          }),
        ),
      );

      setPosts(
        itemsData.map(
          (p: ApiItem): DashboardPost => ({
            id: String(p.ItemID),
            title: p.ItemName || "ไม่พบชื่อโพสต์",
            category: p.CategoryID || "ทั่วไป",
            createdAt: p.PostDate
              ? new Date(p.PostDate).toLocaleDateString("th-TH")
              : "ไม่ระบุ",
            image: p.ItemImage,
            author: {
              id: String(p.MemberID),
              name: p.DisplayName || "ไม่ระบุชื่อ",
              profileImage: p.ProfileImage,
            },
          }),
        ),
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

  const pendingReports = reports.filter((r) => r.status === "pending");
  const pendingUserReports = userReports.filter((r) => r.status === "pending");
  const pendingFeedbacks = feedbacks.filter((f) => f.status === "pending");
  const totalIssues = pendingReports.length + pendingUserReports.length;

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
        description: "ระบบได้บันทึกการตรวจสอบเรียบร้อยแล้ว",
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

  const handleSearch = (): void => {
    setSearchTerm(searchInput.toLowerCase());
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem("user");
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
    { id: "categories", label: "จัดการหมวดหมู่", icon: Layers },
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
      {/* ================= SIDEBAR ================= */}
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
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

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-sm border-b border-border/50 z-10">
          <h2 className="text-lg font-semibold text-foreground capitalize flex items-center gap-2">
            {menuItems.find((m) => m.id === activeMenu)?.label}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Dashboard View */}
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        สถานะระบบภาพรวม
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        สรุปข้อมูลผู้ใช้งานและรายงานที่รอการตรวจสอบ
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col justify-center p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            บัญชีปกติ
                          </span>
                        </div>
                        <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                          {users.filter((u) => !u.suspended).length}{" "}
                          <span className="text-xs font-medium opacity-70">
                            ราย
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                            ถูกระงับ
                          </span>
                        </div>
                        <div className="text-xl font-black text-rose-700 dark:text-rose-400">
                          {users.filter((u) => u.suspended).length}{" "}
                          <span className="text-xs font-medium opacity-70">
                            ราย
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors ${totalIssues > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/30 border-border/50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full shrink-0 ${totalIssues > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"}`}
                        >
                          {totalIssues > 0 ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold ${totalIssues > 0 ? "text-amber-700 dark:text-amber-500" : "text-foreground"}`}
                          >
                            {totalIssues > 0
                              ? "มีรายการรอตรวจสอบ"
                              : "ไม่มีรายงานปัญหาใหม่"}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${totalIssues > 0 ? "text-amber-600/80 dark:text-amber-400/80" : "text-muted-foreground"}`}
                          >
                            {totalIssues > 0
                              ? "พบพฤติกรรมหรือโพสต์ที่ต้องตรวจสอบในเมนูรายงาน"
                              : "ระบบทำงานปกติ ไม่มีรายงานที่ต้องดำเนินการ"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-0 ml-11 sm:ml-0 flex items-end gap-1.5 shrink-0">
                        <span
                          className={`text-2xl font-black leading-none ${totalIssues > 0 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"}`}
                        >
                          {totalIssues}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground mb-0.5">
                          รายการ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Management */}
            {activeMenu === "categories" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CategoryManagement />
              </div>
            )}

            {/* Search Bar */}
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

            {/* Users Management */}
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
                                {user.profileImage &&
                                user.profileImage.trim() !== "undefined" &&
                                user.profileImage.trim() !== "null" &&
                                user.profileImage.trim() !== "" ? (
                                  <img
                                    src={
                                      user.profileImage
                                        .trim()
                                        .startsWith("http")
                                        ? user.profileImage.trim()
                                        : `${IMAGE_BASE_URL}/uploads/${user.profileImage.trim()}`
                                    }
                                    alt={user.name}
                                    className="w-9 h-9 rounded-full object-cover border border-border shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${user.suspended ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}
                                  >
                                    {user.name.charAt(0)}
                                  </div>
                                )}

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
                              {user.suspended ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <Badge
                                    variant="destructive"
                                    className="px-2 py-0 text-[10px]"
                                  >
                                    ถูกระงับ
                                  </Badge>
                                  <span className="text-[10px] text-destructive/80 font-medium">
                                    {user.suspendDetails?.type === "permanent"
                                      ? "ถาวร"
                                      : user.suspendDetails?.untilDate
                                        ? `ถึง ${user.suspendDetails.untilDate}`
                                        : "ระงับชั่วคราว"}
                                  </span>
                                </div>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/10 text-primary border-0"
                                >
                                  ปกติ
                                </Badge>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors"
                                onClick={() => handleOpenManageModal(user)}
                                title="จัดการผู้ใช้งาน"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Posts Management */}
            {activeMenu === "posts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {filteredPosts.length === 0 ? (
                  <EmptyState icon={FileText} message="ไม่มีโพสต์ในระบบ" />
                ) : (
                  filteredPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="border-border/40 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group overflow-hidden flex flex-col"
                    >
                      {/* ✅ เปลี่ยนจาก h-[130px] เป็น min-h-[130px] เพื่อไม่ให้บีบปุ่มจนกดไม่ได้ */}
                      <div className="flex h-full min-h-[130px]">
                        {/* รูปภาพด้านซ้าย */}
                        <div 
                          className="w-2/5 shrink-0 cursor-pointer overflow-hidden bg-muted relative"
                          onClick={() => navigate(`/post/${post.id}`, { state: { fromAdmin: true } })}
                        >
                          <img
                            src={
                              post.image
                                ? post.image.split(',')[0].startsWith("http")
                                  ? post.image.split(',')[0]
                                  : `${IMAGE_BASE_URL}/uploads/${post.image.split(',')[0]}`
                                : "/placeholder.jpg"
                            }
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.src = "/placeholder.jpg" }}
                          />
                        </div>

                        {/* รายละเอียดด้านขวา */}
                        <CardContent className="p-4 flex flex-col justify-between w-3/5 min-w-0">
                          <div>
                            <h4
                              className="font-semibold text-foreground line-clamp-2 leading-tight transition-colors cursor-pointer text-sm"
                              onClick={() => navigate(`/post/${post.id}`, { state: { fromAdmin: true } })}
                            >
                              {post.title}
                            </h4>
                          </div>
                          
                          {/* โปรไฟล์ & ปุ่มลบ */}
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
                            <div className="flex items-center gap-2 min-w-0">
                              {post.author.profileImage && post.author.profileImage !== "null" && post.author.profileImage !== "undefined" ? (
                                <img 
                                  src={
                                    post.author.profileImage.startsWith("http") 
                                      ? post.author.profileImage 
                                      : `${IMAGE_BASE_URL}/uploads/${post.author.profileImage}`
                                  }
                                  alt={post.author.name}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-border/50"
                                  onError={(e) => { 
                                    e.currentTarget.style.display = 'none'; 
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden'); 
                                  }}
                                />
                              ) : null}
                              <div className={`w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 ${post.author.profileImage && post.author.profileImage !== "null" && post.author.profileImage !== "undefined" ? "hidden" : ""}`}>
                                {post.author.name.charAt(0)}
                              </div>
                              <span className="text-xs text-muted-foreground truncate">{post.author.name}</span>
                            </div>
                            
                            {/* ✅ แก้ปุ่มลบ โดยเพิ่ม relative z-10 และ stopPropagation */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors shrink-0 relative z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // ป้องกันไม่ให้คลิกทะลุ
                                confirmDeletePost(post);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Reports Management */}
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
                                แจงโดย: {report.reporter} • {report.createdAt}
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
                          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex-1 min-w-0 w-full">
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

                            <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
                              {report.status === "pending" && (
                                <>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSuspendModal({
                                        isOpen: true,
                                        userId: report.reportedUserId,
                                        userName: report.reportedUserName,
                                        reportIdToResolve: report.id,
                                      });
                                      setSuspendForm({
                                        type: "temporary",
                                        days: "7",
                                        reason: "",
                                      });
                                    }}
                                  >
                                    <Ban className="w-4 h-4 mr-2" /> ระงับบัญชี
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

            {/* Feedback Management */}
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

      {/* ===================================================================== */}
      {/* 📊 MODAL: หน้าต่างจัดการข้อมูลผู้ใช้และสถิติเชิงลึก (Manage User Dialog)    */}
      {/* ===================================================================== */}
      <Dialog
        open={manageModal.isOpen}
        onOpenChange={(open) =>
          !open && setManageModal((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-border/80 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-primary/10 p-6 flex items-center gap-4 border-b border-primary/10">
            {manageModal.profileImage &&
            manageModal.profileImage.trim() !== "undefined" &&
            manageModal.profileImage.trim() !== "null" &&
            manageModal.profileImage.trim() !== "" ? (
              <img
                src={
                  manageModal.profileImage.trim().startsWith("http")
                    ? manageModal.profileImage.trim()
                    : `${IMAGE_BASE_URL}/uploads/${manageModal.profileImage.trim()}`
                }
                alt={manageModal.userName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
                {manageModal.userName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-foreground truncate">
                  {manageModal.userName}
                </DialogTitle>
                {manageModal.suspended ? (
                  <Badge variant="destructive" className="text-[10px]">
                    ถูกระงับ
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]"
                  >
                    ปกติ
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                {manageModal.userEmail} (ID: {manageModal.userId})
              </DialogDescription>
            </div>
          </div>

          {/* Content Scrollable */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {manageModal.isLoadingStats ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-muted-foreground font-medium">
                  กำลังโหลดข้อมูลสถิติ...
                </p>
              </div>
            ) : (
              <>
                {/* สถิติ 4 ช่อง */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/30 border border-border/60 rounded-2xl p-3 flex flex-col items-center text-center">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary mb-1.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      สิ่งของทั้งหมด
                    </span>
                    <span className="text-lg font-black text-foreground mt-0.5">
                      {manageModal.postCount}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ชิ้น
                      </span>
                    </span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex flex-col items-center text-center">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1.5">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      แลกเปลี่ยนสำเร็จ
                    </span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {manageModal.stats?.successfulExchanges ?? 0}{" "}
                      <span className="text-[10px] font-normal opacity-80">
                        ครั้ง
                      </span>
                    </span>
                  </div>

                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex flex-col items-center text-center">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 mb-1.5">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                      แลกเปลี่ยนไม่สำเร็จ
                    </span>
                    <span className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5">
                      {manageModal.stats?.failedExchanges ?? 0}{" "}
                      <span className="text-[10px] font-normal opacity-80">
                        ครั้ง
                      </span>
                    </span>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center text-center">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-1.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      คะแนนรีวิว
                    </span>
                    <span className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
                      {manageModal.stats?.rating
                        ? manageModal.stats.rating.toFixed(1)
                        : "0.0"}{" "}
                      <span className="text-[10px] font-normal opacity-80">
                        / 5.0
                      </span>
                    </span>
                  </div>
                </div>

                {/* ส่วนแสดงความคิดเห็นและรีวิว */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />{" "}
                    คำวิจารณ์และรีวิวจากผู้ใช้งานจริง (
                    {manageModal.stats?.reviews.length ?? 0})
                  </h4>

                  {manageModal.stats?.reviews.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10 text-muted-foreground">
                      <Star className="h-8 w-8 mx-auto mb-2 opacity-25 text-yellow-500" />
                      <p className="text-sm">
                        ผู้ใช้งานรายนี้ยังไม่ได้รับคำรีวิวความคิดเห็นในระบบ
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                      {manageModal.stats?.reviews.map((rev) => (
                        <Card
                          key={rev.id}
                          className="bg-card/50 border shadow-sm rounded-2xl"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                                  {rev.reviewerName
                                    ? rev.reviewerName.charAt(0).toUpperCase()
                                    : "U"}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {rev.reviewerName || "ผู้ใช้งานทั่วไป"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {rev.date || "ไม่มีระบุวันที่"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-0.5 bg-yellow-500/10 px-2 py-0.5 rounded-full text-yellow-600 text-xs font-semibold">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {Number(rev.rating || 0).toFixed(1)}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground pl-10 italic">
                              "{rev.comment}"
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* ปุ่มระงับ/คืนสิทธิ์ */}
            <div className="space-y-2 pt-1">
              {!manageModal.suspended ? (
                <Button
                  variant="destructive"
                  className="w-full justify-start rounded-xl h-10 text-xs font-semibold shadow-sm"
                  onClick={() => {
                    setSuspendModal({
                      isOpen: true,
                      userId: manageModal.userId,
                      userName: manageModal.userName,
                      reportIdToResolve: "",
                    });
                    setSuspendForm({
                      type: "temporary",
                      days: "7",
                      reason: "",
                    });
                  }}
                >
                  <Ban className="w-4 h-4 mr-2" /> ระงับสิทธิ์บัญชีผู้ใช้นี้
                </Button>
              ) : (
                <Button
                  className="w-full justify-start rounded-xl h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => {
                    setUnsuspendModal({
                      isOpen: true,
                      userId: manageModal.userId,
                      userName: manageModal.userName,
                    });
                    setUnsuspendReason("");
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />{" "}
                  คืนสิทธิ์การใช้งานบัญชี
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= LOGOUT CONFIRM MODAL ================= */}
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

      {/* ================= SUSPEND MEMBER DIALOG (ปรับเป็นปุ่มเลือกจำนวนวันแบบติกเลือก มืออาชีพ) ================= */}
      <Dialog
        open={suspendModal.isOpen}
        onOpenChange={(open) =>
          !open && setSuspendModal((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden border-border/80">
          <div className="bg-destructive/10 p-6 flex flex-col items-center text-center border-b border-destructive/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-destructive shadow-sm mb-3">
              <Ban className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-destructive">
              ระงับสิทธิ์ใช้งานบัญชี
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              กำลังดำเนินการระงับบัญชีของ{" "}
              <span className="font-bold text-foreground">
                {suspendModal.userName}
              </span>
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                ประเภทการระงับ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSuspendForm((prev) => ({ ...prev, type: "temporary" }))
                  }
                  className={`flex items-center justify-center h-10 rounded-xl text-xs font-bold transition-all border ${
                    suspendForm.type === "temporary"
                      ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                      : "bg-background text-foreground border-input hover:bg-muted/50"
                  }`}
                >
                  ชั่วคราว (กำหนดวัน)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSuspendForm((prev) => ({ ...prev, type: "permanent" }))
                  }
                  className={`flex items-center justify-center h-10 rounded-xl text-xs font-bold transition-all border ${
                    suspendForm.type === "permanent"
                      ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                      : "bg-background text-foreground border-input hover:bg-muted/50"
                  }`}
                >
                  ถาวร (ตลอดชีพ)
                </button>
              </div>
            </div>

            {suspendForm.type === "temporary" && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-foreground">
                  เลือกจำนวนวันระงับ
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["3", "7", "15", "30"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setSuspendForm((prev) => ({ ...prev, days: d }))
                      }
                      className={`flex items-center justify-center h-10 rounded-xl text-xs font-bold transition-all border ${
                        suspendForm.days === d
                          ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                          : "bg-background text-foreground border-input hover:bg-muted/50"
                      }`}
                    >
                      {d} วัน
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-destructive">
                เหตุผลที่ระงับ *
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-muted/30 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
                placeholder="ระบุเหตุผลในการระงับสิทธิ์ (ผู้ใช้จะได้รับการแจ้งเตือนนี้)"
                value={suspendForm.reason}
                onChange={(e) =>
                  setSuspendForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-10 text-xs font-bold"
                onClick={() =>
                  setSuspendModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-10 text-xs font-bold shadow-md shadow-destructive/20"
                disabled={!suspendForm.reason.trim()}
                onClick={handleConfirmSuspend}
              >
                ยืนยันการระงับสิทธิ์
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= UNSUSPEND MEMBER DIALOG (โค้ดเดิมของคุณ) ================= */}
      <Dialog
        open={unsuspendModal.isOpen}
        onOpenChange={(open) =>
          !open &&
          setUnsuspendModal({ isOpen: false, userId: "", userName: "" })
        }
      >
      </Dialog>
      {/* ================= DELETE POST DIALOG (ยืนยันและระบุเหตุผล) ================= */}
      <Dialog
        open={deletePostModal.isOpen}
        onOpenChange={(open) =>
          !open && setDeletePostModal({ isOpen: false, postId: "", postTitle: "" })
        }
      >
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden border-border/80">
          <div className="bg-destructive/10 p-6 flex flex-col items-center text-center border-b border-destructive/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-destructive shadow-sm mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-destructive">
              ยืนยันการลบโพสต์
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์: <span className="font-bold text-foreground">{deletePostModal.postTitle}</span> ?
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                เหตุผลในการลบ (แสดงในแจ้งเตือนให้ผู้ใช้งานทราบ)
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-muted/30 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-destructive resize-none"
                placeholder="เช่น ผิดหมวดหมู่, โพสต์ซ้ำ, ละเมิดกฎ..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-10 text-xs font-bold shadow-md shadow-destructive/20"
                onClick={executeDeletePost}
              >
                ยืนยันการลบ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE SUCCESS DIALOG ================= */}
      <Dialog
        open={deleteSuccessModal.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteSuccessModal({ isOpen: false, reason: "" })
        }
      >
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-6 flex flex-col items-center text-center border-border/80">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mb-2">
            ลบโพสต์สำเร็จ
          </DialogTitle>
          <div className="bg-muted/50 rounded-xl p-4 w-full mb-4">
            <p className="text-sm font-semibold text-foreground mb-1">เหตุผลที่ลบ:</p>
            <p className="text-xs text-muted-foreground">{deleteSuccessModal.reason}</p>
          </div>
          <Button
            className="w-full rounded-xl h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
            onClick={() => setDeleteSuccessModal({ isOpen: false, reason: "" })}
          >
            ตกลง
          </Button>
        </DialogContent>
      </Dialog>
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
