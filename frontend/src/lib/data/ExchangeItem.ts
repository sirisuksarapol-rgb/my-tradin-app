export type ExchangeStatus = "completed" | "cancelled" | "rejected";

export interface ExchangeItem {
  id: string;
  itemA: string; // ของของคุณ
  itemB: string; // ของที่ได้รับ
  partnerName: string;
  partnerAvatar: string;
  status: ExchangeStatus;
  startedAt: string; // วันเริ่มแลก
  completedAt?: string; // วันที่แลกเปลี่ยนสำเร็จ (มีเฉพาะ completed)
  cancelledAt?: string; // วันที่ยกเลิก (มีเฉพาะ cancelled/rejected)
  reason?: string; // เหตุผลกรณีไม่สำเร็จ
  rating?: number; // คะแนน (ถ้ามี)
  review?: string; // ข้อความรีวิว (ถ้ามี)
}

export const Exchanges: ExchangeItem[] = [
  {
    id: "ex1",
    itemA: "กล้อง Canon EOS M50",
    itemB: "iPad Gen 9",
    partnerName: "สมชาย",
    partnerAvatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100",
    status: "completed",
    startedAt: "2026-03-10 09:30",
    completedAt: "2026-03-12 14:20",
    rating: 5,
    review: "แลกเปลี่ยนราบรื่นมากครับ ของสภาพดีตามที่ตกลงกันไว้",
  },
  {
    id: "ex2",
    itemA: "Nintendo Switch",
    itemB: "PS4 Slim",
    partnerName: "มานะ",
    partnerAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
    status: "completed",
    startedAt: "2026-03-11 10:00",
    completedAt: "2026-03-13 16:45",
    rating: 4,
  },
  {
    id: "ex3",
    itemA: "AirPods Pro",
    itemB: "Sony WH-1000XM4",
    partnerName: "วรรณา",
    partnerAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    status: "cancelled",
    startedAt: "2026-03-14 08:00",
    cancelledAt: "2026-03-14 11:30",
    reason: "ผู้ใช้ยกเลิกเนื่องจากสถานที่นัดพบไม่สะดวก",
  },
  {
    id: "ex4",
    itemA: "คีย์บอร์ด Akko",
    itemB: "เมาส์ Logitech G Pro",
    partnerName: "กมล",
    partnerAvatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100",
    status: "rejected",
    startedAt: "2026-03-12 13:00",
    cancelledAt: "2026-03-12 15:00",
    reason: "สภาพสินค้าจริงไม่ตรงตามรูปภาพในโพสต์",
  },
];
