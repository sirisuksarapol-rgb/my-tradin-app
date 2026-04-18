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
  ArrowLeft,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  "อุปกรณ์อิเล็กทรอนิกส์และไอที",
  "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์",
  "อุปกรณ์สำนักงานและการเรียน",
  "หนังสือและสื่อการเรียนรู้",
  "ของใช้ในชีวิตประจำวัน",
  "ของใช้ภายในบ้าน",
  "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก",
  "อุปกรณ์กีฬาและสันทนาการ",
];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  อุปกรณ์อิเล็กทรอนิกส์และไอที: Cpu,
  อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์: Smartphone,
  อุปกรณ์สำนักงานและการเรียน: PenTool,
  หนังสือและสื่อการเรียนรู้: BookOpen,
  ของใช้ในชีวิตประจำวัน: ShoppingBag,
  ของใช้ภายในบ้าน: Home,
  เครื่องมือและอุปกรณ์ช่างขนาดเล็ก: Wrench,
  อุปกรณ์กีฬาและสันทนาการ: Dumbbell,
  อุปกรณ์เดินทางและของพกพา: Briefcase,
  และของเบ็ดเตล็ดทั่วไป: Package,
};

export const CATEGORY_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-green-100 text-green-600",
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-red-100 text-red-600",
  "bg-indigo-100 text-indigo-600",
  "bg-slate-100 text-slate-600",
];

export const MOCK_POSTS = [
  { id: 1, category: "อุปกรณ์อิเล็กทรอนิกส์และไอที" },
  { id: 2, category: "อุปกรณ์อิเล็กทรอนิกส์และไอที" },
  { id: 3, category: "หนังสือและสื่อการเรียนรู้" },
];
