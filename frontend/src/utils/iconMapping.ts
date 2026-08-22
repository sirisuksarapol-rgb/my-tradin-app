import {
  Cpu,
  Smartphone,
  PenTool,
  BookOpen,
  ShoppingBag,
  Home,
  Wrench,
  Dumbbell,
  Briefcase,
  Package,
  MoreHorizontal,
  LucideIcon,
  icons,
} from "lucide-react";

// 1. Map เก็บเฉพาะ Icon ที่แอดมินสามารถเลือกใช้ได้ (เอาไปทำ Dropdown ในหน้า Admin ได้เลย)
export const AVAILABLE_ICONS: Record<string, LucideIcon> = {
  Cpu,
  Smartphone,
  PenTool,
  BookOpen,
  ShoppingBag,
  Home,
  Wrench,
  Dumbbell,
  Briefcase,
  Package,
  MoreHorizontal
};

// Helper Function แปลง String จาก Database เป็น Icon Component แบบ Dynamic
export const getCategoryIcon = (iconName?: string): LucideIcon => {
  // ถ้าไม่มีชื่อส่งมา ให้คืนค่า MoreHorizontal เป็น Default
  if (!iconName) return MoreHorizontal;

  // ค้นหาไอคอนจาก lucide-react แบบ Dynamic
  const IconComponent = icons[iconName as keyof typeof icons] as LucideIcon;

  // ถ้ามีในระบบให้ส่งคืนไอคอนนั้น ถ้าไม่มีให้ส่ง MoreHorizontal แทน
  return IconComponent || MoreHorizontal;
};