import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Categories from "./pages/Categories";
import Feed from "./pages/Feed";
import CreatePost from "./pages/CreatePost";
import MyPosts from "./pages/MyPosts";
import Matching from "./pages/Matching";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import PostDetail from "./pages/PostDetail";
import UserProfile from "./pages/UserProfile";
import ExchangePreview from "./pages/ExchangePreview";
import IncomingRequests from "./pages/IncomingRequests";
import ExchangeTracking from "./pages/ExchangeTracking";
import SecurityVerify from "./pages/SecurityVerify";
import ReviewExchange from "./pages/ReviewExchange";
import NotFound from "./pages/NotFound";
import EditPost from "./pages/EditPost";
import MatchResults from "./pages/MatchResults";
import AdminDashboard from "./pages/AdminDashboard";
import HelpCenter from "./pages/HelpCenter";
import ExchangeReview from "./pages/ExchangeReview";
import ExchangeHistory from "./pages/ExchangeHistory";
import ExchangeDetail from "./pages/ExchangeDetail";
import EditProfile from "./pages/EditProfile";
import { ThemeProvider } from "@/hooks/use-theme";

/**
 * สร้างอินสแตนซ์ของ QueryClient สำหรับจัดการสถานะ การแคช (Caching) 
 * และการซิงโครไนซ์ข้อมูลแบบ asynchronous ด้วย React Query
 */
const queryClient = new QueryClient();

// =========================================================================
// COMPONENT: App (คอมโพเนนต์หลักของแอปพลิเคชัน สำหรับกำหนดโครงสร้าง Providers และระบบเส้นทาง Router)
// =========================================================================
const App = () => (
  // จัดเตรียมระบบจัดการสถานะข้อมูล (React Query) ให้กับทุกคอมโพเนนต์ภายในแอปพลิเคชัน
  <QueryClientProvider client={queryClient}>
    {/* จัดการระบบธีม (Dark/Light Mode) สำหรับควบคุมการแสดงผลหน้าจอ */}
    <ThemeProvider>
      {/* จัดการการแสดงผล Tooltip ทั่วทั้งแอปพลิเคชัน */}
      <TooltipProvider>
        {/* คอมโพเนนต์แสดงผลการแจ้งเตือนแบบ Toast ทั่วไป */}
        <Toaster />
        {/* คอมโพเนนต์แสดงผลการแจ้งเตือนแบบ Sonner */}
        <Sonner />
        {/* ระบบจัดการเส้นทาง (Routing) ฝั่ง client-side */}
        <BrowserRouter>
          {/* กำหนดกลุ่มเส้นทาง (Routes) สำหรับจับคู่ URL Path กับหน้าจอ (Pages) ต่าง ๆ */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/matching" element={<Matching />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/exchange-preview/:matchId" element={<ExchangePreview />} />
            <Route path="/incoming-requests" element={<IncomingRequests />} />
            <Route path="/exchange-tracking/:matchId" element={<ExchangeTracking />} />
            <Route path="/security-verify/:matchId" element={<SecurityVerify />} />
            <Route path="/review/:matchId" element={<ReviewExchange />} />
            <Route path="/edit-post/:postId" element={<EditPost />} />
            <Route path="/match-results/:itemId" element={<MatchResults />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/exchange-review/:id" element={<ExchangeReview />} />
            <Route path="/exchange-history" element={<ExchangeHistory />} />
            <Route path="/exchange-detail/:id" element={<ExchangeDetail />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;