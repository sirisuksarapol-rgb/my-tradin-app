import { PostItem, mockPosts } from "./post_data";

// 👉 1. เพิ่มฟิลด์เสริมเข้ามาใน Interface
export interface MatchItem {
  id: string;
  myPost: PostItem;
  theirPost: PostItem;
  score: number;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "in_progress"
    | "completed"
    | "failed";
  completedAt?: string; // วันที่ทำรายการสำเร็จ/ยกเลิก
  rating?: number; // คะแนน (1-5)
  review?: string; // ข้อความรีวิว
  reason?: string; // เหตุผลที่ยกเลิก/ล้มเหลว
}

export const mockMatches: MatchItem[] = [
  {
    id: "m1",
    myPost: mockPosts[0],
    theirPost: mockPosts[1],
    score: 92,
    status: "pending",
  },
  {
    id: "m2",
    myPost: mockPosts[9],
    theirPost: mockPosts[10],
    score: 85,
    status: "accepted",
  },
  {
    id: "m3",
    myPost: mockPosts[11],
    theirPost: mockPosts[12],
    score: 78,
    status: "in_progress",
  },
  {
    id: "m4",
    myPost: mockPosts[4],
    theirPost: mockPosts[2],
    score: 95,
    status: "completed",
    // 👉 2. เติมข้อมูลสำหรับรายการที่สำเร็จ
    completedAt: "12/03/2026",
    rating: 5,
    review: "แลกเปลี่ยนราบรื่นมาก ของสภาพดีตรงตามที่คุยกันไว้ครับ แนะนำเลย",
  },
  {
    id: "m5",
    myPost: mockPosts[5],
    theirPost: mockPosts[6],
    score: 60,
    status: "failed",
    // 👉 3. เติมข้อมูลสำหรับรายการที่ล้มเหลว/ยกเลิก
    completedAt: "10/03/2026",
    reason: "ผู้ใช้ไม่สามารถมาตามนัดหมายได้ และไม่สามารถติดต่อได้",
  },
  {
    id: "m6",
    myPost: mockPosts[4], // สมมติ mockPosts[4] คือ เครื่องคิดเลข ของสมชาย
    theirPost: mockPosts[12],
    score: 75,
    status: "in_progress",
  },
  {
    id: "m7",
    myPost: mockPosts[13], // 👈 แก้เป็น 13 (จะได้โพสต์ id "14" ของสมชาย)
    theirPost: mockPosts[11], // แลกกับพัดลม (Index 11 คือ id "12")
    score: 75,
    status: "completed",
    // 👉 4. เติมข้อมูลให้สมชายสำหรับเทสประวัติการแลกสำเร็จ
    completedAt: "20/03/2026",
    rating: 4,
    review: "พัดลมใช้งานได้ดีครับ นัดรับตรงเวลา ขอบคุณสำหรับการแลกเปลี่ยน",
  },
  {
    id: "m8",
    myPost: mockPosts[15], // 👈 แก้เป็น 15 (จะได้โพสต์ id "16" ของสมชาย)
    theirPost: mockPosts[14], // แลกกับดัมเบล (Index 14 คือ id "15")
    score: 75,
    status: "failed",
    // 👉 5. เติมข้อมูลให้สมชายสำหรับเทสประวัติการแลกไม่สำเร็จ
    completedAt: "18/03/2026",
    reason: "สภาพของไม่ตรงปก มีสนิมเกาะเยอะกว่าในรูป เลยขอยกเลิกครับ",
  },
];

export const addMockMatch = (
  myPost: PostItem,
  theirPost: PostItem,
  score: number,
) => {
  const newMatch: MatchItem = {
    id: `m-${Date.now()}`, // สร้าง ID แบบสุ่มจากเวลา
    myPost,
    theirPost,
    score,
    status: "pending", // ค่าเริ่มต้นเมื่อเริ่มขอแลก
  };

  mockMatches.unshift(newMatch); // แทรกไว้บนสุด
  return newMatch;
};
