import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightLeft, CheckCircle, XCircle, Clock,
  Sparkles, Inbox, Package, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { mockPosts } from "@/lib/post_data";
import { mockMatches } from "@/lib/match_data";

const statusConfig = {
  pending: { label: "รอตอบรับ", icon: Clock, className: "bg-warning/10 text-warning" },
  accepted: { label: "ตอบรับแล้ว", icon: CheckCircle, className: "bg-success/10 text-success" },
  rejected: { label: "ปฏิเสธ", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  in_progress: { label: "ดำเนินการ", icon: ArrowRightLeft, className: "bg-info/10 text-info" },
  completed: { label: "สำเร็จ", icon: CheckCircle, className: "bg-success/10 text-success" },
  failed: { label: "ไม่สำเร็จ", icon: XCircle, className: "bg-destructive/10 text-destructive" }
};

type StatusFilterType = "all" | "pending" | "accepted" | "in_progress" | "completed" | "rejected" | "failed";

export default function Matching() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"items" | "status">("items");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUserId(String(user.id));
    }
  }, []);

  const displayItems = mockPosts.filter((post) => String(post.author.id) === currentUserId);
  const myPostIds = displayItems.map(post => String(post.id));
  const userMatches = mockMatches.filter(match => myPostIds.includes(String(match.myPost.id)));
  const sortedMatches = [...userMatches].sort((a, b) => b.score - a.score);
  const filteredMatches = sortedMatches.filter((match) => statusFilter === "all" ? true : match.status === statusFilter);

  return (
    <AppLayout>
      {/* Header */}
      <section className="border-b border-border/50 bg-muted/30 w-screen relative left-1/2 -translate-x-1/2 -mt-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">Smart Match</h1>
              </div>
              <p className="text-sm text-muted-foreground">ระบบแนะนำคู่แลกเปลี่ยนที่เหมาะสมสำหรับคุณ</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/incoming-requests")} className="gap-2 rounded-full shadow-sm">
              <Inbox className="h-4 w-4" /> คำขอที่ได้รับ
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Tabs */}
          <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50 max-w-md">
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === "items" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Package className="h-4 w-4" /> เริ่มหาคู่แมตช์
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === "status" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ArrowRightLeft className="h-4 w-4" /> สถานะการแมตช์
            </button>
          </div>

          {/* Items Tab */}
          {activeTab === "items" ? (
            <div className="space-y-4 animate-slide-up">
              <p className="text-sm font-semibold font-heading">เลือกสิ่งของเพื่อค้นหาคู่แมตช์</p>
              {displayItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayItems.map((post) => (
                    <Card key={post.id} className="glass-card hover:border-primary/30 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <img src={post.images[0]} alt={post.title} className="w-20 h-20 rounded-xl object-cover shadow-sm" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-bold truncate">{post.title}</p>
                          <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                          <p className="text-xs text-muted-foreground truncate">
                            ต้องการแลก: <span className="font-medium text-foreground">{post.wantedItem}</span>
                          </p>
                          <Button size="sm" className="w-full h-8" onClick={() => navigate(`/match-results/${post.id}`)}>
                            ค้นหาคู่แมตช์
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 space-y-3 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">คุณยังไม่ได้ลงของสำหรับแลกเปลี่ยน</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              {/* Status Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: "all", label: "ทั้งหมด", icon: null },
                  { id: "pending", label: "รอตอบรับ", icon: Clock },
                  { id: "accepted", label: "ตอบรับแล้ว", icon: CheckCircle },
                  { id: "in_progress", label: "ดำเนินการ", icon: ArrowRightLeft },
                  { id: "completed", label: "สำเร็จ", icon: CheckCircle },
                  { id: "failed", label: "ไม่สำเร็จ", icon: XCircle },
                ].map((tab) => (
                  <Badge
                    key={tab.id}
                    variant={statusFilter === tab.id ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-full flex items-center"
                    onClick={() => setStatusFilter(tab.id as StatusFilterType)}
                  >
                    {tab.icon && <tab.icon className="h-3 w-3 mr-1.5" />}
                    {tab.label}
                  </Badge>
                ))}
              </div>

              {/* Match Cards */}
              {filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredMatches.map((match) => {
                    const config = statusConfig[match.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <Card
                        key={match.id}
                        className="glass-card cursor-pointer hover:shadow-md transition-all"
                        onClick={() => navigate(`/exchange-tracking/${match.id}`)}
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className={`${config.className} border-0 font-semibold`}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />{config.label}
                            </Badge>
                            <span className="rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                              เหมาะสม {match.score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 text-center space-y-2">
                              <img src={match.myPost.images[0]} className="w-20 h-20 rounded-xl object-cover mx-auto shadow-sm" />
                              <p className="text-xs font-bold line-clamp-1">{match.myPost.title}</p>
                              <p className="text-[10px] text-muted-foreground">ของของคุณ</p>
                            </div>
                            <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 text-center space-y-2">
                              <img src={match.theirPost.images[0]} className="w-20 h-20 rounded-xl object-cover mx-auto shadow-sm" />
                              <p className="text-xs font-bold line-clamp-1">{match.theirPost.title}</p>
                              <p className="text-[10px] text-muted-foreground">โดย {match.theirPost.author.name}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 space-y-3">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">ไม่มีรายการในสถานะนี้</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
