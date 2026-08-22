import React, { useEffect, useState, useMemo } from "react";
import { 
  Search, Plus, Edit2, Trash2, LayoutGrid, List, 
  CheckCircle2, AlertTriangle, Eye, Sparkles, Layers, 
  icons, HelpCircle, LucideIcon 
} from "lucide-react";
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// --- Interface ข้อมูลหมวดหมู่จาก Database ---
interface Category {
  CategoryID: number;
  CategoryName: string;
  IconName: string;
  ItemCount?: number;
}

// --- Type-Safe Dynamic Icon Component ---
interface DynamicIconProps {
  name: string;
  className?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = "w-5 h-5" }) => {
  const IconComponent = (icons[name as keyof typeof icons] as LucideIcon) || HelpCircle;
  return <IconComponent className={className} />;
};

// 🌟 ดึงรายชื่อไอคอนทั้งหมดที่มีใน lucide-react (1,000+ ไอคอน!)
const ALL_ICON_KEYS = Object.keys(icons);

export function CategoryManagement() {
  // State ข้อมูลจาก DB จริง
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State ควบคุม UI
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // State สำหรับ Dialogs
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // State ฟอร์ม
  const [formName, setFormName] = useState<string>("");
  const [formIconName, setFormIconName] = useState<string>("Package");
  const [iconSearchTerm, setIconSearchTerm] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- ดึงข้อมูลจาก Database ผ่าน API ---
  const fetchCategoriesData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await getCategories();
      if (response && response.data) {
        setCategories(response.data);
      }
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลหมวดหมู่จากฐานข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  // เปิด Modal เพิ่มหมวดหมู่
  const handleOpenAddModal = (): void => {
    setEditingCategory(null);
    setFormName("");
    setFormIconName("Package");
    setIsFormOpen(true);
  };

  // เปิด Modal แก้ไขหมวดหมู่
  const handleOpenEditModal = (cat: Category): void => {
    setEditingCategory(cat);
    setFormName(cat.CategoryName);
    setFormIconName(cat.IconName || "Package");
    setIsFormOpen(true);
  };

  // บันทึกข้อมูล (เพิ่มใหม่ / แก้ไข)
  const handleSaveCategory = async (): Promise<void> => {
    if (!formName.trim()) {
      toast({
        title: "กรุณาระบุชื่อหมวดหมู่",
        description: "ชื่อหมวดหมู่ไม่สามารถเว้นว่างได้",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.CategoryID, {
          name: formName,
          icon: formIconName,
        });
        toast({
          title: "อัปเดตสำเร็จ",
          description: `แก้ไขหมวดหมู่ "${formName}" เรียบร้อยแล้ว`,
        });
      } else {
        await createCategory({
          name: formName,
          icon: formIconName,
        });
        toast({
          title: "เพิ่มหมวดหมู่สำเร็จ",
          description: `เพิ่มหมวดหมู่ "${formName}" เข้าสู่ระบบแล้ว`,
        });
      }
      setIsFormOpen(false);
      await fetchCategoriesData();
    } catch (error: unknown) {
      console.error("Error saving category:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ยืนยันการลบหมวดหมู่
  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;

    try {
      await deleteCategory(deleteTarget.CategoryID);
      toast({
        title: "ลบหมวดหมู่สำเร็จ",
        description: `ลบหมวดหมู่ "${deleteTarget.CategoryName}" ออกจากระบบแล้ว`,
      });
      setDeleteTarget(null);
      await fetchCategoriesData();
    } catch (error: unknown) {
      console.error("Error deleting category:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive",
      });
    }
  };

  // กรองรายการหมวดหมู่ตามคำค้นหา
  const filteredCategories = categories.filter((cat) =>
    cat.CategoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔍 กรองไอคอนทั้งหมดแบบ Fast Search (แสดงผลครั้งละไม่เกิน 120 ไอคอนเพื่อความลื่นไหล)
  const filteredIcons = useMemo(() => {
    if (!iconSearchTerm.trim()) {
      return ALL_ICON_KEYS.slice(0, 120);
    }
    return ALL_ICON_KEYS.filter((keyName) =>
      keyName.toLowerCase().includes(iconSearchTerm.toLowerCase())
    ).slice(0, 120);
  }, [iconSearchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* 📊 Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">จัดการหมวดหมู่สินค้า</h3>
            <Badge variant="secondary" className="rounded-full text-xs font-bold px-2.5 bg-secondary/60">
              {categories.length} หมวดหมู่
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ดึงข้อมูลและจัดการหมวดหมู่สินค้าจากฐานข้อมูลระบบ Realtime
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold text-xs h-10 px-4 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </Button>
      </div>

      {/* 🔍 Search and View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อหมวดหมู่..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border/60 rounded-xl focus-visible:ring-primary h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border/60 shadow-sm self-end sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-3 text-xs rounded-lg gap-1.5 font-bold"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-3 text-xs rounded-lg gap-1.5 font-bold"
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </Button>
        </div>
      </div>

      {/* 🎴 GRID VIEW */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent" />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/60 rounded-2xl bg-card/30">
              <Layers className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">ไม่พบข้อมูลหมวดหมู่ในระบบ</p>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <Card
                key={cat.CategoryID}
                className="border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 group rounded-2xl bg-card"
              >
                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                        <DynamicIcon name={cat.IconName} className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold rounded-full px-2.5 py-0.5 border bg-emerald-500/10 text-emerald-600 border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ปกติ
                      </Badge>
                    </div>

                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {cat.CategoryName}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                      Icon: {cat.IconName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                      {cat.ItemCount ?? 0} รายการ
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(cat)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(cat)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* 📋 TABLE VIEW */
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">หมวดหมู่</th>
                  <th className="px-5 py-3.5">ชื่อไอคอน</th>
                  <th className="px-5 py-3.5 text-center">จำนวนสิ่งของ</th>
                  <th className="px-5 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {filteredCategories.map((cat) => (
                  <tr key={cat.CategoryID} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground font-mono">{cat.CategoryID}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                          <DynamicIcon name={cat.IconName} className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-foreground text-xs">{cat.CategoryName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono">{cat.IconName}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant="outline" className="font-bold text-[11px] rounded-md">
                        {cat.ItemCount ?? 0} รายการ
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(cat)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(cat)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🎨 MODAL: เพิ่ม / แก้ไข หมวดหมู่ */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 border-border/80 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {editingCategory ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              {editingCategory ? "แก้ไขหมวดหมู่สินค้า" : "เพิ่มหมวดหมู่สินค้าใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              กรอกชื่อหมวดหมู่และเลือกไอคอนที่จะแสดงในแอปพลิเคชัน
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  ชื่อหมวดหมู่ <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์"
                  value={formName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                  className="rounded-xl border-border/60 focus-visible:ring-primary h-10 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">ไอคอนหมวดหมู่</label>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <DynamicIcon name={formIconName} className="w-5 h-5" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIconSearchTerm("");
                      setIsIconPickerOpen(true);
                    }}
                    className="flex-1 justify-between rounded-xl h-10 border-border/60 hover:bg-muted/50 text-xs font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {formIconName}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">เปลี่ยนไอคอน</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 👁️ REALTIME LIVE PREVIEW */}
            <div className="md:col-span-5 flex flex-col justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-3">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>ตัวอย่างการแสดงผล</span>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <DynamicIcon name={formIconName} className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-foreground truncate">
                      {formName || "ชื่อหมวดหมู่..."}
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      {formIconName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl h-10 px-5 text-xs font-bold"
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={isSubmitting}
              className="rounded-xl h-10 px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔍 MODAL: ICON PICKER GRID (ดึงไอคอน 1,000+ ตัวพร้อมระบบค้นหา) */}
      <Dialog open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 border-border/80 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>เลือกไอคอนหมวดหมู่ ({ALL_ICON_KEYS.length.toLocaleString()} ตัว)</span>
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาไอคอน (ภาษาอังกฤษ เช่น shirt, car, phone, game, tv)..."
              value={iconSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIconSearchTerm(e.target.value)}
              className="pl-9 rounded-xl border-border/60 text-xs h-10"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto p-1 custom-scrollbar">
            {filteredIcons.map((keyName) => {
              const isSelected = formIconName === keyName;
              return (
                <button
                  key={keyName}
                  type="button"
                  onClick={() => {
                    setFormIconName(keyName);
                    setIsIconPickerOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-150 ${
                    isSelected
                      ? "bg-primary/15 border-primary text-primary shadow-sm ring-2 ring-primary/20"
                      : "bg-card border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40"
                  }`}
                  title={keyName}
                >
                  <DynamicIcon name={keyName} className="w-5 h-5" />
                  <span className="text-[9px] font-medium mt-1 truncate max-w-full text-center">
                    {keyName}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
            <span>พิมพ์ค้นหาเพื่อหาไอคอนที่ต้องการ</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIconPickerOpen(false)}
              className="rounded-xl text-xs font-bold h-8"
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ⚠️ MODAL: ยืนยันการลบ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-background rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-border/80 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-inner">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">ยืนยันการลบหมวดหมู่?</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  คุณกำลังจะลบหมวดหมู่ <strong className="text-foreground">"{deleteTarget.CategoryName}"</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-10 text-xs font-bold"
                onClick={() => setDeleteTarget(null)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-10 text-xs font-bold shadow-md shadow-rose-500/20"
                onClick={handleConfirmDelete}
              >
                ยืนยันการลบ
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}