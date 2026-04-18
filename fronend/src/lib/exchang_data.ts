import { mockPosts } from "@/lib/post_data";

export interface ExchangeItem {
  id: string;
  userId: string; // 👉 เพิ่มฟิลด์นี้เพื่อให้รู้ว่าประวัตินี้เป็นของใคร
  itemA: string;
  itemA_image: string; 
  itemB: string;
  itemB_image: string;
  itemA_owner: string;
  itemB_owner: string;
  partnerName: string;
  partnerAvatar?: string;
  status: "completed" | "cancelled" | "rejected";
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  reason?: string;
  category_id: string;
  wantedItem: string;
  postedAt: string;
  confirmedAt?: string;
  reviewText?: string;
  rating?: number;
}

export const Exchanges: ExchangeItem[] = [
  {
    id: "ex1",
    userId: "1", // ของผู้ใช้ ID 1
    itemA: "หนังสือ React",
    itemA_image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    itemB: "หูฟัง Bluetooth",
    itemB_image:
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400",
    itemA_owner: "คุณ",
    itemB_owner: "สมชาย",
    partnerName: "สมชาย",
    status: "completed",
    startedAt: "10/03/2026",
    completedAt: "12/03/2026",
    category_id: "หนังสือและสื่อการเรียนรู้",
    wantedItem: "หูฟังไร้สาย",
    postedAt: "08/03/2026",
    confirmedAt: "12/03/2026",
    reviewText: "แลกเปลี่ยนราบรื่นมาก ของตรงตามที่ตกลงกัน แนะนำเลย!",
    rating: 5,
  },
  {
    id: "ex2",
    userId: "1", // ของผู้ใช้ ID 1
    itemA: "จักรยานพับ",
    itemA_image:
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400",
    itemB: "ลำโพง JBL",
    itemB_image:
      "https://images.unsplash.com/photo-1606813909355-7d82c6c1b9a7?w=400",
    itemA_owner: "คุณ",
    itemB_owner: "ผู้ใช้ทดสอบ",
    partnerName: "ผู้ใช้ทดสอบ",
    status: "completed",
    startedAt: "01/03/2026",
    completedAt: "05/03/2026",
    category_id: "อุปกรณ์กีฬาและสันทนาการ",
    wantedItem: "ลำโพงพกพา",
    postedAt: "28/02/2026",
    confirmedAt: "05/03/2026",
    reviewText: "ของสภาพดีมาก ส่งตรงเวลา",
    rating: 4,
  },
  {
    id: "ex3",
    userId: "1", // ของผู้ใช้ ID 1
    itemA: "กล้องถ่ายรูป",
    itemA_image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    itemB: "แท็บเล็ต",
    itemB_image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    itemA_owner: "คุณ",
    itemB_owner: "มานะ",
    partnerName: "มานะ",
    status: "cancelled",
    startedAt: "15/02/2026",
    cancelledAt: "20/02/2026",
    reason: "ผู้ใช้ไม่ตอบกลับ",
    category_id: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    wantedItem: "แท็บเล็ต Samsung",
    postedAt: "10/02/2026",
  },
  {
    id: "ex4",
    userId: "1", // ของผู้ใช้ ID 1
    itemA: "iPad Gen 9",
    itemA_image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    itemB: "Laptop Gaming",
    itemB_image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
    itemA_owner: "คุณ",
    itemB_owner: "สมชาย",
    partnerName: "สมชาย",
    status: "rejected",
    startedAt: "18/02/2026",
    cancelledAt: "19/02/2026",
    reason: "สินค้ามีปัญหา",
    category_id: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    wantedItem: "Laptop",
    postedAt: "15/02/2026",
  },
  {
    id: "ex5",
    userId: "2", // 👉 จำลองให้เป็นของ User คนอื่น (สมชาย ID 2) เพื่อเทสว่ามันจะไม่โชว์ในหน้าของ ID 1
    itemA: "กล้อง Canon EOS M50",
    itemA_image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    itemB: "Macbook Air M1",
    itemB_image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    itemA_owner: "สมชาย",
    itemB_owner: "มานะ",
    partnerName: "มานะ",
    status: "completed",
    startedAt: "20/03/2026",
    completedAt: "22/03/2026",
    category_id: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    wantedItem: "Macbook",
    postedAt: "18/03/2026",
    confirmedAt: "22/03/2026",
    reviewText: "แลกเปลี่ยนสำเร็จ ของสภาพดีมาก ขอบคุณครับ",
    rating: 5,
  },
];

export interface ExchangeTrackingItem {
  matchId: string;
  userId: string; // 👉 เพิ่มฟิลด์นี้สำหรับหน้า Tracking
  status: "pending" | "accepted" | "in_progress" | "completed" | "failed";
  myItem: { title: string; image: string };
  theirItem: { title: string; image: string };
  securityCode?: string;
  reasonOptions?: string[];
  selectedReason?: string;
  partnerPhone?: string;
}

export const mockExchangeTracking: ExchangeTrackingItem[] = [
  {
    matchId: "m1",
    userId: "1",
    status: "pending",
    myItem: {
      title: mockPosts[0]?.title || "Item A",
      image: mockPosts[0]?.images[0] || "",
    },
    theirItem: {
      title: mockPosts[1]?.title || "Item B",
      image: mockPosts[1]?.images[0] || "",
    },
  },
  {
    matchId: "m2",
    userId: "2",
    status: "accepted",
    myItem: {
      title: mockPosts[9]?.title || "Item A",
      image: mockPosts[9]?.images[0] || "",
    },
    theirItem: {
      title: mockPosts[10]?.title || "Item B",
      image: mockPosts[10]?.images[0] || "",
    },
    securityCode: "5291",
  },
  {
    matchId: "m3",
    userId: "1",
    status: "in_progress",
    myItem: {
      title: mockPosts[3]?.title || "Item A",
      image: mockPosts[3]?.images[0] || "",
    },
    theirItem: {
      title: mockPosts[0]?.title || "Item B",
      image: mockPosts[0]?.images[0] || "",
    },
  },
  {
    matchId: "m4",
    userId: "1",
    status: "completed",
    myItem: {
      title: mockPosts[4]?.title || "Item A",
      image: mockPosts[4]?.images[0] || "",
    },
    theirItem: {
      title: mockPosts[2]?.title || "Item B",
      image: mockPosts[2]?.images[0] || "",
    },
  },
  {
    matchId: "m5",
    userId: "2", // สมมติให้เป็นของคนอื่น
    status: "failed",
    reasonOptions: [
      "ผู้ใช้ไม่ตอบกลับ",
      "ผู้ใช้ไม่ส่งของ",
      "สินค้ามีปัญหา",
      "เหตุผลอื่นๆ",
    ],
    myItem: {
      title: mockPosts[5]?.title || "Item A",
      image: mockPosts[5]?.images[0] || "",
    },
    theirItem: {
      title: mockPosts[6]?.title || "Item B",
      image: mockPosts[6]?.images[0] || "",
    },
  },
];

export const mockExchanges = [
  {
    id: "ex1",
    userId: "1", // 👉 เพิ่ม userId ด้วย
    itemA: "หนังสือ React",
    itemB: "หูฟัง Bluetooth",
    partnerName: "สมชาย",
    rating: 5,
    review: "แลกเปลี่ยนราบรื่น ของตรงตามที่ตกลง",
    completedAt: "12/03/2026",
    status: "completed",
  },
  {
    id: "ex2",
    userId: "1",
    itemA: "จักรยาน",
    itemB: "ลำโพง",
    partnerName: "ผู้ใช้ทดสอบ",
    rating: 4,
    review: "ของสภาพดีมาก",
    completedAt: "05/03/2026",
    status: "completed",
  },
  {
    id: "ex3",
    userId: "1",
    status: "failed",
    reasonOptions: [
      "ผู้ใช้ไม่ตอบกลับ",
      "ผู้ใช้ไม่ส่งของ",
      "สินค้ามีปัญหา",
      "เหตุผลอื่นๆ",
    ],
    score: 85,
    myPost: {
      id: "p1",
      title: "กล้องถ่ายรูป",
      images: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
      ],
    },
    theirPost: {
      id: "p10",
      title: "แท็บเล็ต",
      images: [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
      ],
      author: {
        name: "มานะ",
      },
    },
    completedAt: "20/02/2026",
  },
];


