
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, LayoutGrid, List, AlertTriangle, Eye, Sparkles, Layers, icons, HelpCircle, type LucideIcon } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/api/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface Category {
  CategoryID: number;
  CategoryName: string;
  IconName: string;
  ItemCount?: number;
}

interface DynamicIconProps {
  name: string;
  className?: string;
}

const ALL_ICON_KEYS = Object.keys(icons);

function DynamicIcon({ name, className = "h-5 w-5" }: DynamicIconProps) {
  const Icon = (icons[name as keyof typeof icons] as LucideIcon) || HelpCircle;
  return <Icon className={className} />;
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [formName, setFormName] = useState("");
  const [formIconName, setFormIconName] = useState("Package");
  const [iconSearchTerm, setIconSearchTerm] = useState("");

  const fetchCategoriesData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getCategories();
      setCategories(response?.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลหมวดหมู่จากฐานข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesData();
  }, [fetchCategoriesData]);

  const filteredCategories = categories.filter((category) =>
    category.CategoryName.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const filteredIcons = useMemo(() => {
    const search = iconSearchTerm.trim().toLowerCase();

    return ALL_ICON_KEYS
      .filter((name) => name.toLowerCase().includes(search))
      .slice(0, 120);
  }, [iconSearchTerm]);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormIconName("Package");
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.CategoryName);
    setFormIconName(category.IconName || "Package");
    setIsFormOpen(true);
  };

  const handleSaveCategory = async () => {
    const categoryName = formName.trim();

    if (!categoryName) {
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
          name: categoryName,
          icon: formIconName,
        });

        toast({
          title: "อัปเดตสำเร็จ",
          description: `แก้ไขหมวดหมู่ "${categoryName}" เรียบร้อยแล้ว`,
        });
      } else {
        await createCategory({
          name: categoryName,
          icon: formIconName,
        });

        toast({
          title: "เพิ่มหมวดหมู่สำเร็จ",
          description: `เพิ่มหมวดหมู่ "${categoryName}" เข้าสู่ระบบแล้ว`,
        });
      }

      setIsFormOpen(false);
      await fetchCategoriesData();
    } catch (error) {
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCategory(deleteTarget.CategoryID);

      toast({
        title: "ลบหมวดหมู่สำเร็จ",
        description: `ลบหมวดหมู่ "${deleteTarget.CategoryName}" ออกจากระบบแล้ว`,
      });

      setDeleteTarget(null);
      await fetchCategoriesData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Layers className="h-5 w-5" />
          </div>

          <h3 className="text-lg font-bold text-foreground">
            จัดการหมวดหมู่สินค้า
          </h3>

          <Badge
            variant="outline"
            className="rounded-full border-black bg-white px-2.5 text-xs font-bold text-black dark:border-white dark:bg-zinc-950 dark:text-white"
          >
            {categories.length} หมวดหมู่
          </Badge>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="h-10 gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          เพิ่มหมวดหมู่ใหม่
        </Button>
      </div>

      {/* Search and View Mode */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อหมวดหมู่..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-xl border-border/60 bg-card pl-9 text-xs focus-visible:ring-primary"
          />
        </div>

        <div className="flex self-end items-center gap-1 rounded-xl border border-border/60 bg-card p-1 shadow-sm sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`h-8 gap-1.5 rounded-lg px-3 text-xs font-bold transition-none ${
              viewMode === "grid"
                ? "bg-primary text-white hover:bg-primary hover:text-white"
                : "bg-transparent text-muted-foreground hover:bg-slate-200/60 hover:text-muted-foreground dark:hover:bg-zinc-800"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={`h-8 gap-1.5 rounded-lg px-3 text-xs font-bold transition-none ${
              viewMode === "table"
                ? "bg-primary text-white hover:bg-primary hover:text-white"
                : "bg-transparent text-muted-foreground hover:bg-slate-200/60 hover:text-muted-foreground dark:hover:bg-zinc-800"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Table
          </Button>
        </div>
      </div>

      {/* Category List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/30 p-12 text-center">
          <Layers className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">
            ไม่พบข้อมูลหมวดหมู่ในระบบ
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category) => (
            <Card
              key={category.CategoryID}
              className="group rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-transform group-hover:scale-105">
                      <DynamicIcon name={category.IconName} className="h-6 w-6" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-foreground">
                    {category.CategoryName}
                  </h4>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Icon: {category.IconName}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="rounded-lg border border-black bg-white px-2.5 py-1 text-xs font-bold text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                    {category.ItemCount ?? 0} รายการ
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="แก้ไขหมวดหมู่"
                      onClick={() => handleOpenEditModal(category)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="ลบหมวดหมู่"
                      onClick={() => setDeleteTarget(category)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/50 bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">หมวดหมู่</th>
                  <th className="px-5 py-3.5">ชื่อไอคอน</th>
                  <th className="px-5 py-3.5 text-center">จำนวนสิ่งของ</th>
                  <th className="px-5 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/40 font-medium">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.CategoryID}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="px-5 py-3 font-mono text-muted-foreground">
                      {category.CategoryID}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <DynamicIcon name={category.IconName} className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {category.CategoryName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3 font-mono text-muted-foreground">
                      {category.IconName}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <Badge className="rounded-md bg-primary text-[11px] font-bold text-white hover:bg-primary">
                        {category.ItemCount ?? 0} รายการ
                      </Badge>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="แก้ไขหมวดหมู่"
                          onClick={() => handleOpenEditModal(category)}
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="ลบหมวดหมู่"
                          onClick={() => setDeleteTarget(category)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Category */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-border/80 p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                {editingCategory ? (
                  <Edit2 className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </div>
              {editingCategory ? "แก้ไขหมวดหมู่สินค้า" : "เพิ่มหมวดหมู่สินค้าใหม่"}
            </DialogTitle>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="space-y-4 md:col-span-7">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  ชื่อหมวดหมู่ <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  className="h-10 rounded-xl border-border/60 text-xs font-medium focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  ไอคอนหมวดหมู่
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 text-primary">
                    <DynamicIcon name={formIconName} className="h-5 w-5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIconSearchTerm("");
                      setIsIconPickerOpen(true);
                    }}
                    className="flex h-10 flex-1 cursor-pointer items-center justify-between rounded-xl border border-border/60 px-4 text-xs font-bold text-foreground transition-none"
                  >
                    <span className="flex items-center gap-2">
                      <DynamicIcon name={formIconName} className="h-3.5 w-3.5 text-primary" />
                      {formIconName}
                    </span>
                    <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] text-white">
                      เปลี่ยนไอคอน
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/50 bg-muted/30 p-4 md:col-span-5">
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  ตัวอย่างการแสดงผล
                </div>

                <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 text-primary">
                    <DynamicIcon name={formIconName} className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="truncate text-xs font-bold text-foreground">
                      {formName || "ชื่อหมวดหมู่..."}
                    </h5>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {formIconName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
              className="h-10 rounded-xl px-5 text-xs font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={isSubmitting}
              className="h-10 rounded-xl bg-primary px-6 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Icon Picker */}
      <Dialog open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-border/80 p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="h-4 w-4 text-primary" />
              เลือกไอคอนหมวดหมู่ ({ALL_ICON_KEYS.length.toLocaleString()} ตัว)
            </DialogTitle>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาไอคอน เช่น shirt, car, phone, game, tv..."
              value={iconSearchTerm}
              onChange={(event) => setIconSearchTerm(event.target.value)}
              className="h-10 rounded-xl border-border/60 pl-9 text-xs"
              autoFocus
            />
          </div>

          <div className="custom-scrollbar grid max-h-72 grid-cols-4 gap-2 overflow-y-auto p-1 sm:grid-cols-6">
            {filteredIcons.map((name) => {
              const isSelected = formIconName === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setFormIconName(name);
                    setIsIconPickerOpen(false);
                  }}
                  title={name}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/15 text-primary shadow-sm ring-2 ring-primary/20"
                      : "border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <DynamicIcon name={name} className="h-5 w-5" />
                  <span className="mt-1 max-w-full truncate text-center text-[9px] font-medium">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
            <span>พิมพ์ค้นหาเพื่อหาไอคอนที่ต้องการ</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIconPickerOpen(false)}
              className="h-8 rounded-xl text-xs font-bold"
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="ปิดหน้าต่างยืนยันการลบ"
            className="absolute inset-0 bg-background/80 animate-in fade-in duration-200"
            onClick={() => setDeleteTarget(null)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="relative w-full max-w-sm space-y-4 rounded-3xl border border-border/80 bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-inner">
                <AlertTriangle className="h-7 w-7" />
              </div>

              <div>
                <h4 id="delete-title" className="text-base font-bold text-foreground">
                  ยืนยันการลบหมวดหมู่?
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  คุณกำลังจะลบหมวดหมู่{" "}
                  <strong className="text-foreground">
                    "{deleteTarget.CategoryName}"
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="h-10 flex-1 rounded-xl text-xs font-bold"
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="h-10 flex-1 rounded-xl text-xs font-bold shadow-md shadow-rose-500/20"
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