import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightLeft, CheckCircle, XCircle, Clock,
  Sparkles, Inbox, Package, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";

// เรียกฟังก์ชันจาก API ไฟล์ตั้งค่าหลัก
import { getItems as fetchItemsAPI, IMAGE_BASE_URL, getExchanges } from "@/api/api"; 

const statusConfig = {
  pending: { label: "รอตอบรับ", icon: Clock, className: "bg-warning/10 text-warning" },
  accepted: { label: "ตอบรับแล้ว", icon: CheckCircle, className: "bg-success/10 text-success" },
  rejected: { label: "ปฏิเสธ", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  in_progress: { label: "ดำเนินการ", icon: ArrowRightLeft, className: "bg-info/10 text-info" },
  completed: { label: "สำเร็จ", icon: CheckCircle, className: "bg-success/10 text-success" },
  failed: { label: "ไม่สำเร็จ", icon: XCircle, className: "bg-destructive/10 text-destructive" }
};

type StatusFilterType = "all" | "pending" | "accepted" | "in_progress" | "completed" | "rejected" | "failed";

interface DBItem {
  ItemID: string | number;
  ItemName: string;
  CategoryName?: string;
  WantedItem?: string;
  ItemImage?: string;
  MemberID: string | number;
}

interface DBExchange {
  ExchangeID: number;
  ExchangeLocation?: string;
  ExchangeStatus: string; 
  Score?: number;        
  SenderID?: number | string;   
  ReceiverID?: number | string; 
  TargetMemberID?: number | string; // รองรับโครงสร้างทั้งสองฝั่ง
  MemberID: number | string;
  myPostTitle?: string;
  myPostImage?: string;
  theirPostTitle?: string;
  theirPostImage?: string;
  theirAuthorName?: string;
}

export default function Matching() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"items" | "status">("items");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [items, setItems] = useState<DBItem[]>([]);
  const [exchanges, setExchanges] = useState<DBExchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ดึงข้อมูลจากฐานข้อมูลหลัก
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const itemsRes = await fetchItemsAPI();
      if (itemsRes && Array.isArray(itemsRes.data)) {
        setItems(itemsRes.data);
      }

      if (typeof getExchanges === "function") {
        const exchangeRes = await getExchanges();
        if (exchangeRes && Array.isArray(exchangeRes.data)) {
          setExchanges(exchangeRes.data);
        }
      }
    } catch (error) {
      console.error("Error loading matching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const uid = String(user.id ?? user.user_id ?? user.UserID ?? user.MemberID);
      setCurrentUserId(uid);
    }
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "status") {
      loadData();
    }
  }, [activeTab, loadData]);

  // 2. จัดการแปลง Path รูปภาพแบบปลอดภัย
  const getCorrectImagePath = (imageName: string | undefined) => {
    if (!imageName || imageName.trim() === "undefined" || imageName === "null") return "/placeholder.jpg";
    try {
      let cleanStr = imageName.trim();
      if (cleanStr.startsWith('[')) {
        const safeJsonStr = cleanStr.replace(/'/g, '"');
        const parsed = JSON.parse(safeJsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) cleanStr = parsed[0].trim();
      } else if (cleanStr.includes(',')) {
        cleanStr = cleanStr.split(',')[0].trim();
      }
      if (cleanStr.startsWith('http')) return cleanStr;
      return `${IMAGE_BASE_URL}/uploads/${cleanStr}`;
    } catch {
      const fallback = imageName.replace(/\[|\]|"|'/g, '').split(',')[0].trim();
      return fallback.startsWith('http') ? fallback : `${IMAGE_BASE_URL}/uploads/${fallback}`;
    }
  };

  const displayItems = useMemo(() => {
    if (!currentUserId) return [];
    return items.filter((item) => String(item.MemberID) === currentUserId);
  }, [items, currentUserId]);

  // ✨ นับคำขอแจ้งเตือนสีแดง (นับเฉพาะคำขอที่มีคนส่งมาหาเรา และสถานะยังเป็น pending)
  const incomingCount = useMemo(() => {
    if (!currentUserId) return 0;
    return exchanges.filter((exch) => {
      const isReceiver = exch.ReceiverID 
        ? String(exch.ReceiverID) === currentUserId 
        : String(exch.TargetMemberID) === currentUserId;
      const isPending = (exch.ExchangeStatus || "").toLowerCase() === "pending";
      return isReceiver && isPending;
    }).length;
  }, [exchanges, currentUserId]);

  // 3. กรองรายการที่เราส่งไปหาคนอื่น
  const filteredMatches = useMemo(() => {
    if (!currentUserId) return [];
    
    const mySentExchanges = exchanges.filter((exch) => {
      const isSender = exch.SenderID ? String(exch.SenderID) === currentUserId : String(exch.MemberID) === currentUserId;
      const isReceiver = exch.ReceiverID ? String(exch.ReceiverID) === currentUserId : false;
      return isSender && !isReceiver;
    });

    const sorted = [...mySentExchanges].sort((a, b) => (b.Score || 0) - (a.Score || 0));

    return sorted.filter((match) => {
      const status = (match.ExchangeStatus || "pending").toLowerCase();
      return statusFilter === "all" ? true : status === statusFilter;
    });
  }, [exchanges, currentUserId, statusFilter]);

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
            
            {/* ปุ่มคำขอที่ได้รับ พร้อม Notification Badge แจ้งเตือน */}
            <Button 
              variant="outline" 
              onClick={() => navigate("/incoming-requests")} 
              className="gap-2 rounded-full shadow-sm relative overflow-visible"
            >
              <Inbox className="h-4 w-4" /> 
              <span>คำขอที่ได้รับ</span>
              {incomingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {incomingCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Tabs สลับโหมดทำงาน */}
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

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">กำลังเรียกข้อมูลจากระบบฐานข้อมูลแลกเปลี่ยน...</div>
          ) : activeTab === "items" ? (
            /* Items Tab */
            <div className="space-y-4 animate-slide-up">
              <p className="text-sm font-semibold font-heading">เลือกสิ่งของเพื่อค้นหาคู่แมตช์</p>
              {displayItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayItems.map((post) => (
                    <Card key={post.ItemID} className="glass-card hover:border-primary/30 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <img 
                          src={getCorrectImagePath(post.ItemImage)} 
                          alt={post.ItemName} 
                          className="w-20 h-20 rounded-xl object-cover shadow-sm bg-muted" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                          }}
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-bold truncate">{post.ItemName}</p>
                          <Badge variant="secondary" className="text-[10px]">{post.CategoryName || "ทั่วไป"}</Badge>
                          <p className="text-xs text-muted-foreground truncate">
                            ต้องการแลก: <span className="font-medium text-foreground">{post.WantedItem || "อะไรก็ได้"}</span>
                          </p>
                          <Button size="sm" className="w-full h-8" onClick={() => navigate(`/match-results/${post.ItemID}`)}>
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
            /* Status Tab */
            <div className="space-y-6 animate-slide-up">
              {/* ตัวกรองสถานะ */}
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

              {/* รายการแสดงข้อมูลผลการแมตช์ที่คุณเป็นคนร้องขอ */}
              {filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredMatches.map((match) => {
                    const currentStatus = (match.ExchangeStatus || "pending").toLowerCase();
                    const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <Card
                        key={match.ExchangeID}
                        className="glass-card cursor-pointer hover:shadow-md transition-all"
                        onClick={() => navigate(`/exchange-tracking/${match.ExchangeID}`)}
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className={`${config.className} border-0 font-semibold`}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />{config.label}
                            </Badge>
                            <span className="rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                              เหมาะสม {match.Score ?? 95}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 text-center space-y-2 min-w-0">
                              <img 
                                src={getCorrectImagePath(match.myPostImage)} 
                                className="w-20 h-20 rounded-xl object-cover mx-auto shadow-sm bg-muted" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                                }}
                              />
                              <p className="text-xs font-bold line-clamp-1">{match.myPostTitle || "สิ่งของของคุณ"}</p>
                              <p className="text-[10px] text-muted-foreground">ของของคุณ</p>
                            </div>
                            <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 text-center space-y-2 min-w-0">
                              <img 
                                src={getCorrectImagePath(match.theirPostImage)} 
                                className="w-20 h-20 rounded-xl object-cover mx-auto shadow-sm bg-muted" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== window.location.origin + "/placeholder.jpg") target.src = "/placeholder.jpg";
                                }}
                              />
                              <p className="text-xs font-bold line-clamp-1">{match.theirPostTitle || "ของที่สนใจแลก"}</p>
                              <p className="text-[10px] text-muted-foreground">โดย {match.theirAuthorName || "ผู้ใช้งานอื่น"}</p>
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