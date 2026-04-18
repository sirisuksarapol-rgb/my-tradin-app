export type Feedback = {
  id: string;
  title: string;
  description: string;
  category: "bug" | "suggestion" | "other";
  reporter: string;
  createdAt: string;
  status: "pending" | "resolved";
};

export const mockFeedbacks: Feedback[] = [
  {
    id: "f1",
    title: "ระบบค้นหาไม่ทำงาน",
    description: "พิมพ์ค้นหาแล้วไม่แสดงผล",
    category: "bug",
    reporter: "สมชาย", // เปลี่ยนให้สมจริง
    createdAt: "2026-03-11",
    status: "pending",
  },
  {
    id: "f2",
    title: "อยากให้เพิ่มหมวดหมู่สินค้า",
    description: "จะได้ค้นหาง่ายขึ้น",
    category: "suggestion",
    reporter: "มานะ", // เปลี่ยนให้สมจริง
    createdAt: "2026-03-09",
    status: "resolved",
  },
];
