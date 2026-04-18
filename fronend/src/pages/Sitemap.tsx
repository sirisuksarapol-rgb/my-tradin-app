import { Link, useNavigate } from "react-router-dom";
import { Map, Compass, Package, ArrowRightLeft, User, Info, ShieldCheck, ChevronRight, Leaf, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const sitemapData = [
   { title: "สำรวจและค้นหา", icon: Compass, links: [{ name: "หน้าแรก", path: "/" }, { name: "ฟีดสิ่งของ", path: "/feed" }, { name: "หมวดหมู่", path: "/categories" }] },
   { title: "จัดการสิ่งของ", icon: Package, links: [{ name: "สร้างโพสต์ใหม่", path: "/create-post" }, { name: "สิ่งของของฉัน", path: "/my-posts" }] },
   { title: "การแลกเปลี่ยน", icon: ArrowRightLeft, links: [{ name: "คำขอที่ได้รับ", path: "/incoming-requests" }, { name: "ประวัติ", path: "/exchange-history" }] },
   { title: "บัญชีผู้ใช้", icon: User, links: [{ name: "โปรไฟล์", path: "/profile" }, { name: "การแจ้งเตือน", path: "/notifications" }, { name: "เข้าสู่ระบบ", path: "/login" }] },
   { title: "เกี่ยวกับ Tradin", icon: Info, links: [{ name: "ภาพรวมระบบ", path: "/about" }, { name: "ศูนย์ช่วยเหลือ", path: "/help" }, { name: "แผนผังเว็บไซต์", path: "/sitemap" }] },
   { title: "ผู้ดูแลระบบ", icon: ShieldCheck, links: [{ name: "Admin Dashboard", path: "/admin" }] },
];

export default function Sitemap() {
   const navigate = useNavigate();
   return (
      <AppLayout>
         <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
            <div className="text-center space-y-4">
               <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Map className="h-8 w-8 text-primary" /></div>
               <h1 className="text-3xl sm:text-4xl font-extrabold">แผนผังเว็บไซต์ <span className="text-primary">.</span></h1>
               <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">รวบรวมเมนูและหน้าเว็บไซต์ทั้งหมดของ Tradin</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {sitemapData.map((section, index) => {
                  const Icon = section.icon;
                  return (
                     <Card key={index} className="border-border/50 hover:shadow-xl hover:border-primary/30 transition-all group">
                        <CardContent className="p-6">
                           <div className="flex items-center gap-3 mb-5 border-b border-border/60 pb-4">
                              <div className="bg-primary/10 p-2.5 rounded-xl text-primary group-hover:scale-110 transition-transform"><Icon className="h-5 w-5" /></div>
                              <h2 className="text-base sm:text-lg font-bold">{section.title}</h2>
                           </div>
                           <ul className="space-y-1.5">
                              {section.links.map((link, i) => (
                                 <li key={i}><Link to={link.path} className="flex items-center p-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><ChevronRight className="h-4 w-4 mr-2 text-primary/40" />{link.name}</Link></li>
                              ))}
                           </ul>
                        </CardContent>
                     </Card>
                  );
               })}
            </div>
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-dashed border-border/60 text-muted-foreground text-sm">
               <Leaf className="h-4 w-4 text-primary" /><span>ร่วมสร้างโลกที่ยั่งยืนไปด้วยกันกับ Tradin</span>
            </div>
         </div>
      </AppLayout>
   );
}
