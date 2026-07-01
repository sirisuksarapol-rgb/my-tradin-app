export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  joinedAt?: string;
  suspended?: boolean;
};

export const MOCK_USERS: User[] = [
  {
    id: "admin1",
    name: "Admin",
    email: "admin@greenloop.com",
    password: "12345678",
    role: "admin",
    suspended: false,
    joinedAt: "2025-01-10",
  },
  {
    id: "u1",
    name: "Greenloop User",
    email: "user@greenloop.com",
    password: "123456",
    role: "user",
    suspended: false,
    joinedAt: "2025-01-15",
  },
  {
    id: "1",
    name: "สมชาย",
    email: "somchai@gmail.com",
    password: "12345678",
    role: "user",
    joinedAt: "2025-02-01",
  },
  {
    id: "2",
    name: "มานะ",
    email: "mana@gmail.com",
    password: "12345678",
    role: "user",
    joinedAt: "2025-02-10",
  },
  {
    id: "3",
    name: "ผู้ใช้ทดสอบ",
    email: "test@gmail.com",
    password: "12345678",
    role: "user",
    joinedAt: "2025-03-01",
  },
  // --- เพิ่มผู้ใช้งานใหม่ ---
  {
    id: "4",
    name: "สมหญิง",
    email: "somying@gmail.com",
    password: "12345678",
    role: "user",
    joinedAt: "2025-03-15",
  },
  {
    id: "5",
    name: "John Doe",
    email: "john@greenloop.com",
    password: "12345678",
    role: "user",
    joinedAt: "2025-03-20",
  },
];

export type UserReport = {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  details: string;
  reporter: string;
  createdAt: string;
  status: "pending" | "resolved";
};

export const mockUserReports: UserReport[] = [
  {
    id: "ur1",
    reportedUserId: "2",
    reportedUserName: "มานะ",
    reason: "พฤติกรรมไม่เหมาะสม",
    details: "ใช้คำพูดไม่สุภาพในการแชท",
    reporter: "Somchai",
    createdAt: "2026-03-12",
    status: "pending",
  },
];
