export interface PostItem {
  id: string;
  title: string;
  category: string;
  images: string[];
  description: string;
  wantedItem: string;
  location: string;
  mapLink?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    exchanges: number;
  };
  createdAt: string;
  status: "active" | "matched" | "completed" | "cancelled" | "failed";
}

export const mockPosts: PostItem[] = [
  // 1. อุปกรณ์อิเล็กทรอนิกส์และไอที
  {
    id: "1",
    title: "กล้อง Canon EOS M50",
    category: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=400",
      "https://images.unsplash.com/photo-1519183071298-a2962eadc3c1?w=400",
    ],
    description: "กล้อง Mirrorless สภาพดี ใช้งานปกติ ถ่ายวิดีโอ 4K ได้",
    wantedItem: "iPad หรือ Tablet อื่นๆ", // แมทช์กับโพสต์ 19 (iPad)
    location: "เซ็นทรัล ลาดพร้าว / BTS ห้าแยกลาดพร้าว",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-02-01",
    status: "active",
  },
  {
    id: "2",
    title: "Macbook Air M1",
    category: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    ],
    description: "Macbook Air M1 RAM8GB SSD256GB แบตเตอรี่ยังอึด",
    wantedItem: "Keyboard หรือ กีตาร์", // แมทช์กับโพสต์ 3 (Keyboard) และ 18 (กีตาร์)
    location: "เชียงใหม่",
    author: { id: "2", name: "มานะ", avatar: "", rating: 4.7, exchanges: 8 },
    createdAt: "2025-02-02",
    status: "active",
  },

  // 2. อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์
  {
    id: "3",
    title: "Mechanical Keyboard Keychron",
    category: "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์",
    images: [
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400",
      "https://images.unsplash.com/photo-1601445638532-3c6f6c3aa831?w=400",
      "https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?w=400",
    ],
    description: "คีย์บอร์ดบลูทูธ สวิตช์ Brown พิมพ์สนุกมาก",
    wantedItem: "Macbook หรือ เมาส์ไร้สาย", // แมทช์กับโพสต์ 2 (Macbook)
    location: "ชลบุรี",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-02-05",
    status: "active",
  },
  {
    id: "4",
    title: "AirPods Pro Gen 1",
    category: "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์",
    images: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400",
      "https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400",
      "https://images.unsplash.com/photo-1610438235354-a6ae5528385c?w=400",
    ],
    description: "หูฟัง AirPods Pro ของแท้ กล่องครบ",
    wantedItem: "Kindle หรือ ลำโพง Bluetooth", // แมทช์กับโพสต์ 8 (Kindle)
    location: "ขอนแก่น",
    author: { id: "2", name: "มานะ", avatar: "", rating: 4.7, exchanges: 8 },
    createdAt: "2025-02-10",
    status: "active",
  },

  // 3. อุปกรณ์สำนักงานและการเรียน
  {
    id: "5",
    title: "เครื่องคิดเลขวิทยาศาสตร์ Casio",
    category: "อุปกรณ์สำนักงานและการเรียน",
    images: [
      "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=400",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
      "https://images.unsplash.com/photo-1611078713437-02e0932c0d5d?w=400",
    ],
    description: "ใช้งานไปเทอมเดียว สภาพใหม่เอี่ยม",
    wantedItem: "แฟ้มเอกสาร หรือ ชุดเครื่องเขียน", // แมทช์กับโพสต์ 6 (ชุดเครื่องเขียน)
    location: "กรุงเทพ",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-02-12",
    status: "active",
  },
  {
    id: "6",
    title: "ชุดเครื่องเขียนและแฟ้มเอกสาร",
    category: "อุปกรณ์สำนักงานและการเรียน",
    images: [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400",
      "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=400",
      "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400",
    ],
    description: "ปากกาสี สมุด ปากกาเน้นข้อความ ของใหม่ยังไม่แกะ",
    wantedItem: "เครื่องคิดเลข หรือ หนังสือจิตวิทยา", // แมทช์กับโพสต์ 5 (เครื่องคิดเลข)
    location: "สงขลา",
    author: { id: "2", name: "มานะ", avatar: "", rating: 4.7, exchanges: 8 },
    createdAt: "2025-02-15",
    status: "active",
  },

  // 4. หนังสือและสื่อการเรียนรู้
  {
    id: "7",
    title: "หนังสือคู่มือเขียนโปรแกรม React",
    category: "หนังสือและสื่อการเรียนรู้",
    images: [
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
      "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400",
    ],
    description: "หนังสือเรียนรู้การสร้างเว็บเบื้องต้น สภาพ 99%",
    wantedItem: "ไขควง หรือ อุปกรณ์ช่าง", // แมทช์กับโพสต์ 14 (ชุดไขควง)
    location: "กรุงเทพ",
    author: {
      id: "admin1",
      name: "Admin",
      avatar: "",
      rating: 5.0,
      exchanges: 20,
    },
    createdAt: "2025-02-20",
    status: "active",
  },
  {
    id: "8",
    title: "Kindle Paperwhite",
    category: "หนังสือและสื่อการเรียนรู้",
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
      "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400",
    ],
    description: "เครื่องอ่าน E-book ถนอมสายตา",
    wantedItem: "AirPods หรือ หูฟังไร้สาย", // แมทช์กับโพสต์ 4 (AirPods)
    location: "เชียงใหม่",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-02-22",
    status: "active",
  },

  // 5. ของใช้ในชีวิตประจำวัน
  {
    id: "9",
    title: "กระบอกน้ำเก็บอุณหภูมิ YETI",
    category: "ของใช้ในชีวิตประจำวัน",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400",
      "https://images.unsplash.com/photo-1558227691-41ea78d1f631?w=400",
    ],
    description: "เก็บความเย็นได้ข้ามวัน ซื้อมาซ้ำครับ",
    wantedItem: "เครื่องชงกาแฟ หรือ ปิ่นโต", // แมทช์กับโพสต์ 11 (เครื่องชงกาแฟ)
    location: "กรุงเทพ",
    author: { id: "4", name: "สมหญิง", avatar: "", rating: 4.9, exchanges: 5 },
    createdAt: "2025-02-25",
    status: "active",
  },
  {
    id: "10",
    title: "ร่มพับกัน UV",
    category: "ของใช้ในชีวิตประจำวัน",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400",
      "https://images.unsplash.com/photo-1531518326125-91b369f9e51c?w=400",
    ],
    description: "ร่มพกพาขนาดเล็ก น้ำหนักเบา กันแดด 100%",
    wantedItem: "พัดลม หรือ หมวกแก๊ป", // แมทช์กับโพสต์ 12 (พัดลม)
    location: "ภูเก็ต",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-02-28",
    status: "active",
  },

  // 6. ของใช้ภายในบ้าน
  {
    id: "11",
    title: "เครื่องชงกาแฟแคปซูล Nespresso",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400",
      "https://images.unsplash.com/photo-1520262454473-a1a82276a574?w=400",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    ],
    description: "เครื่องชงกาแฟ ใช้งานน้อย แถมแคปซูลให้ 1 กล่อง",
    wantedItem: "กระบอกน้ำ หรือ เตาไมโครเวฟ", // แมทช์กับโพสต์ 9 (กระบอกน้ำ)
    location: "กรุงเทพ",
    author: { id: "4", name: "สมหญิง", avatar: "", rating: 4.9, exchanges: 5 },
    createdAt: "2025-03-01",
    status: "active",
  },
  {
    id: "12",
    title: "พัดลมตั้งโต๊ะมินิมอล",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1565151443657-3f3366c8277a?w=400",
      "https://images.unsplash.com/photo-1618349271166-0dcb18cd6ee3?w=400",
      "https://images.unsplash.com/photo-1598516087537-831dd0edfbcd?w=400",
    ],
    description: "พัดลมสไตล์มินิมอล ปรับแรงลมได้ 3 ระดับ",
    wantedItem: "ร่มพับ หรือ โคมไฟอ่านหนังสือ", // แมทช์กับโพสต์ 10 (ร่มพับ)
    location: "เชียงใหม่",
    author: {
      id: "5",
      name: "John Doe",
      avatar: "",
      rating: 4.5,
      exchanges: 2,
    },
    createdAt: "2025-03-05",
    status: "active",
  },

  // 7. เครื่องมือและอุปกรณ์ช่างขนาดเล็ก
  {
    id: "13",
    title: "ชุดสว่านไร้สาย",
    category: "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400",
      "https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?w=400",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400",
    ],
    description: "สว่านแบตเตอรี่ พร้อมดอกสว่านครบชุด",
    wantedItem: "จักรยาน หรือ กล่องใส่เครื่องมือช่าง", // แมทช์กับโพสต์ 16 (จักรยาน)
    location: "ระยอง",
    author: { id: "2", name: "มานะ", avatar: "", rating: 4.7, exchanges: 8 },
    createdAt: "2025-03-10",
    status: "active",
  },
  {
    id: "14",
    title: "ชุดไขควงอเนกประสงค์",
    category: "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก",
    images: [
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400",
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400",
    ],
    description: "ไขควงเปลี่ยนหัวได้ 24 แบบ สำหรับซ่อมอุปกรณ์เล็กๆ",
    wantedItem: "หนังสือ React หรือ ไฟฉาย LED", // แมทช์กับโพสต์ 7 (หนังสือ React)
    location: "กรุงเทพ",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-03-12",
    status: "active",
  },

  // 8. อุปกรณ์กีฬาและสันทนาการ
  {
    id: "15",
    title: "ดัมเบล 10kg",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
      "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400",
      "https://images.unsplash.com/photo-1594737625785-c6c1d8c7a3b4?w=400",
    ],
    description: "ดัมเบลหุ้มยาง 1 คู่",
    wantedItem: "เก้าอี้แคมป์ปิ้ง หรือ เสื่อโยคะ", // แมทช์กับโพสต์ 17 (เก้าอี้แคมป์ปิ้ง)
    location: "นครราชสีมา",
    author: {
      id: "3",
      name: "ผู้ใช้ทดสอบ",
      avatar: "",
      rating: 5.0,
      exchanges: 1,
    },
    createdAt: "2025-03-15",
    status: "active",
  },
  {
    id: "16",
    title: "จักรยานเสือภูเขา",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400",
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400",
      "https://images.unsplash.com/photo-1508973379-d09a1d37d7c5?w=400",
    ],
    description: "จักรยาน MTB สภาพพร้อมปั่น",
    wantedItem: "สว่าน หรือ สเก็ตบอร์ด", // แมทช์กับโพสต์ 13 (สว่าน)
    location: "เชียงใหม่",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-03-18",
    status: "active",
  },
  {
    id: "17",
    title: "เก้าอี้แคมป์ปิ้งพับได้",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400",
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400",
      "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400",
    ],
    description: "เก้าอี้แคมป์ปิ้งน้ำหนักเบา พกพาสะดวก",
    wantedItem: "ดัมเบล หรือ เต็นท์", // แมทช์กับโพสต์ 15 (ดัมเบล)
    location: "กรุงเทพ",
    author: {
      id: "u1",
      name: "Greenloop User",
      avatar: "",
      rating: 4.2,
      exchanges: 3,
    },
    createdAt: "2025-03-19",
    status: "active",
  },
  {
    id: "18",
    title: "กีตาร์โปร่ง Yamaha",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1550227289-4b2a8f89d4bd?w=400",
      "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400",
      "https://images.unsplash.com/photo-1525201548942-d8732f512e4d?w=400",
    ],
    description: "กีตาร์โปร่งเสียงดี เปลี่ยนสายใหม่แล้ว",
    wantedItem: "Macbook หรือ ขาตั้งกีตาร์", // แมทช์กับโพสต์ 2 (Macbook)
    location: "เชียงใหม่",
    author: {
      id: "5",
      name: "John Doe",
      avatar: "",
      rating: 4.5,
      exchanges: 2,
    },
    createdAt: "2025-03-21",
    status: "active",
  },
  {
    id: "19",
    title: "iPad Air 5 WiFi 64GB",
    category: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
      "https://images.unsplash.com/photo-1588702545922-e6ca51f3fa14?w=400",
      "https://images.unsplash.com/photo-1554672408-72b14144cc79?w=400",
    ],
    description: "iPad Air 5 สภาพนางฟ้า ไม่ค่อยได้ใช้งาน",
    wantedItem: "กล้อง Canon หรือ เลนส์", // แมทช์กับโพสต์ 1 (กล้อง Canon)
    location: "กรุงเทพ",
    author: { id: "6", name: "วิชัย", avatar: "", rating: 4.9, exchanges: 4 },
    createdAt: "2025-03-22",
    status: "active",
  },
  // --- โพสต์ที่เพิ่มใหม่ 30 รายการ ---

  // หมวด: อุปกรณ์อิเล็กทรอนิกส์และไอที
  {
    id: "20",
    title: "ไมโครเวฟ Sharp 20 ลิตร",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1585223108342-a87114b304cc?w=400",
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400",
    ],
    description: "ไมโครเวฟสภาพดี ใช้งานอุ่นอาหารปกติ เพิ่งซื้อมาได้ 6 เดือน",
    wantedItem: "เครื่องปั่นน้ำผลไม้ หรือ หม้อทอดไร้น้ำมัน",
    location: "นนทบุรี",
    author: { id: "7", name: "กฤษณะ", avatar: "", rating: 4.6, exchanges: 3 },
    createdAt: "2025-03-23",
    status: "active",
  },
  {
    id: "21",
    title: "จอคอมพิวเตอร์ Dell 24 นิ้ว",
    category: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    images: [
      "https://images.unsplash.com/photo-1527443154391-40739b13251e?w=400",
      "https://images.unsplash.com/photo-1542744094-24638ea0b3b5?w=400",
    ],
    description: "จอ IPS สีตรง เหมาะสำหรับทำงานกราฟิก ขาตั้งปรับสูงต่ำได้",
    wantedItem: "เก้าอี้เพื่อสุขภาพ หรือ คีย์บอร์ด",
    location: "กรุงเทพ",
    author: {
      id: "8",
      name: "วุฒิชัย",
      avatar: "",
      rating: 4.9,
      exchanges: 15,
    },
    createdAt: "2025-03-24",
    status: "active",
  },
  {
    id: "22",
    title: "Nintendo Switch OLED",
    category: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    images: [
      "https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=400",
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400",
    ],
    description: "เครื่องสี Neon ติดฟิล์มกระจกแล้ว แถมเคสใสและกระเป๋า",
    wantedItem: "iPad หรือ ลำโพง Marshall",
    location: "เชียงใหม่",
    author: { id: "9", name: "ตั้ม", avatar: "", rating: 5.0, exchanges: 7 },
    createdAt: "2025-03-25",
    status: "active",
  },
  {
    id: "23",
    title: "ลำโพง Marshall Emberton",
    category: "อุปกรณ์อิเล็กทรอนิกส์และไอที",
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400",
    ],
    description: "ลำโพงบลูทูธพกพา เสียงนุ่ม เบสแน่น แบตอึดมาก",
    wantedItem: "Nintendo Switch หรือ หูฟังไร้สาย",
    location: "ภูเก็ต",
    author: { id: "10", name: "เจน", avatar: "", rating: 4.8, exchanges: 9 },
    createdAt: "2025-03-26",
    status: "active",
  },

  // หมวด: อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์
  {
    id: "24",
    title: "เมาส์ไร้สาย Logitech MX Master 3S",
    category: "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400",
    ],
    description: "เมาส์ทำงานตัวจบ จับถนัดมือ ลดอาการปวดข้อมือ",
    wantedItem: "หูฟังครอบหู หรือ จอคอมพิวเตอร์",
    location: "ขอนแก่น",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-03-27",
    status: "active",
  },
  {
    id: "25",
    title: "สายชาร์จและหัวชาร์จเร็ว Baseus 65W",
    category: "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400",
      "https://images.unsplash.com/photo-1620189507195-683091e4c4bd?w=400",
    ],
    description: "ชาร์จได้ทั้งโน้ตบุ๊กและมือถือพร้อมกัน 3 พอร์ต",
    wantedItem: "Power Bank หรือ เคสโทรศัพท์",
    location: "กรุงเทพ",
    author: { id: "4", name: "สมหญิง", avatar: "", rating: 4.9, exchanges: 5 },
    createdAt: "2025-03-28",
    status: "active",
  },
  {
    id: "26",
    title: "Power Bank Anker 20000mAh",
    category: "อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์",
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
    ],
    description: "แบตสำรองความจุสูง รองรับ PD Fast Charge",
    wantedItem: "สายชาร์จ หรือ กระเป๋าเป้",
    location: "ชลบุรี",
    author: { id: "11", name: "บอย", avatar: "", rating: 4.7, exchanges: 2 },
    createdAt: "2025-03-29",
    status: "active",
  },

  // หมวด: อุปกรณ์สำนักงานและการเรียน
  {
    id: "27",
    title: "เก้าอี้เพื่อสุขภาพ (Ergonomic Chair)",
    category: "อุปกรณ์สำนักงานและการเรียน",
    images: [
      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=400",
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400",
    ],
    description: "เก้าอี้ตาข่าย นั่งทำงานนานๆ ไม่ปวดหลัง มีที่รองคอ",
    wantedItem: "จอคอมพิวเตอร์ หรือ โต๊ะปรับระดับ",
    location: "กรุงเทพ",
    author: { id: "12", name: "อารยา", avatar: "", rating: 5.0, exchanges: 4 },
    createdAt: "2025-03-30",
    status: "active",
  },
  {
    id: "28",
    title: "เครื่องพิมพ์ Printer HP DeskJet",
    category: "อุปกรณ์สำนักงานและการเรียน",
    images: [
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400",
    ],
    description: "ปริ้นเตอร์สี/ขาวดำ แถมหมึกพิมพ์ใหม่ยังไม่ได้แกะ",
    wantedItem: "กระดาษ A4 1 ลัง หรือ แฟ้มเอกสาร",
    location: "นครปฐม",
    author: { id: "2", name: "มานะ", avatar: "", rating: 4.7, exchanges: 8 },
    createdAt: "2025-04-01",
    status: "active",
  },

  // หมวด: หนังสือและสื่อการเรียนรู้
  {
    id: "29",
    title: "หนังสือ Atomic Habits",
    category: "หนังสือและสื่อการเรียนรู้",
    images: [
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
    ],
    description: "หนังสือพัฒนาตัวเอง เปลี่ยนนิสัยเพื่อความสำเร็จ สภาพ 95%",
    wantedItem: "หนังสือนิยาย หรือ หนังสือจิตวิทยา",
    location: "กรุงเทพ",
    author: {
      id: "5",
      name: "John Doe",
      avatar: "",
      rating: 4.5,
      exchanges: 2,
    },
    createdAt: "2025-04-02",
    status: "active",
  },
  {
    id: "30",
    title: "นิยายสืบสวน เชอร์ล็อก โฮล์มส์ (ครบชุด)",
    category: "หนังสือและสื่อการเรียนรู้",
    images: [
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    ],
    description: "เซ็ตนิยายสืบสวนคลาสสิก ปกแข็ง สภาพสะสม",
    wantedItem: "มังงะ One Piece หรือ โคมไฟอ่านหนังสือ",
    location: "เชียงใหม่",
    author: { id: "13", name: "ฟ้าใส", avatar: "", rating: 4.9, exchanges: 11 },
    createdAt: "2025-04-03",
    status: "active",
  },
  {
    id: "31",
    title: "มังงะ One Piece เล่ม 1-20",
    category: "หนังสือและสื่อการเรียนรู้",
    images: [
      "https://images.unsplash.com/photo-1601850494422-3fb182cb1bc9?w=400",
      "https://images.unsplash.com/photo-1613336026275-d6d473084e85?w=400",
    ],
    description: "หนังสือการ์ตูนวันพีซช่วงแรก สภาพบ้าน กระดาษเหลืองตามกาลเวลา",
    wantedItem: "โมเดลฟิกเกอร์ หรือ นิยาย",
    location: "กรุงเทพ",
    author: { id: "14", name: "โอ๊ต", avatar: "", rating: 4.6, exchanges: 6 },
    createdAt: "2025-04-04",
    status: "active",
  },
  {
    id: "32",
    title: "นิตยสารบ้านและสวน (10 เล่ม)",
    category: "หนังสือและสื่อการเรียนรู้",
    images: ["https://images.unsplash.com/photo-1555448248-2571daf6344b?w=400"],
    description: "ไอเดียแต่งบ้าน จัดสวน เหมาะสำหรับคนชอบรีโนเวท",
    wantedItem: "ต้นไม้ประดับ หรือ กระถางต้นไม้",
    location: "ระยอง",
    author: { id: "4", name: "สมหญิง", avatar: "", rating: 4.9, exchanges: 5 },
    createdAt: "2025-04-05",
    status: "active",
  },

  // หมวด: ของใช้ในชีวิตประจำวัน
  {
    id: "33",
    title: "กล่องใส่อาหารพลาสติก LocknLock",
    category: "ของใช้ในชีวิตประจำวัน",
    images: [
      "https://images.unsplash.com/photo-1590502593747-422987994667?w=400",
      "https://images.unsplash.com/photo-1622484211148-52b31e08dbff?w=400",
    ],
    description: "เซ็ต 5 ชิ้น เข้าไมโครเวฟได้ ซีลยางแน่นหนา",
    wantedItem: "กระบอกน้ำเก็บอุณหภูมิ หรือ ปิ่นโต",
    location: "กรุงเทพ",
    author: { id: "15", name: "ดาว", avatar: "", rating: 4.7, exchanges: 3 },
    createdAt: "2025-04-06",
    status: "active",
  },
  {
    id: "34",
    title: "กระเป๋าผ้า Canvas หนาพิเศษ",
    category: "ของใช้ในชีวิตประจำวัน",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400",
    ],
    description: "กระเป๋าทรง Tote จุของได้เยอะ ทนทาน ซักได้",
    wantedItem: "ร่ม หรือ แว่นตากันแดด",
    location: "เชียงใหม่",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-04-07",
    status: "active",
  },
  {
    id: "35",
    title: "แว่นตากันแดดวินเทจ",
    category: "ของใช้ในชีวิตประจำวัน",
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400",
      "https://images.unsplash.com/photo-1577803645773-f96470509666?w=400",
    ],
    description: "แว่นกัน UV กรอบโลหะ ทรงหยดน้ำ ใส่ขับรถหรือไปเที่ยวทะเล",
    wantedItem: "หมวก หรือ กระเป๋าสตางค์",
    location: "ภูเก็ต",
    author: { id: "6", name: "วิชัย", avatar: "", rating: 4.9, exchanges: 4 },
    createdAt: "2025-04-08",
    status: "active",
  },
  {
    id: "36",
    title: "กระเป๋าสตางค์หนังแท้",
    category: "ของใช้ในชีวิตประจำวัน",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    ],
    description: "หนังวัวแท้ ยิ่งใช้ยิ่งสวย มีช่องใส่บัตรเยอะ",
    wantedItem: "นาฬิกาข้อมือ หรือ เข็มขัดหนัง",
    location: "สงขลา",
    author: { id: "16", name: "พีท", avatar: "", rating: 5.0, exchanges: 8 },
    createdAt: "2025-04-09",
    status: "active",
  },

  // หมวด: ของใช้ภายในบ้าน
  {
    id: "37",
    title: "โคมไฟตั้งโต๊ะ LED",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e9d15?w=400",
    ],
    description: "โคมไฟปรับแสงสว่างและโทนสีได้ ถนอมสายตา",
    wantedItem: "พัดลมตั้งโต๊ะ หรือ นาฬิกาปลุก",
    location: "กรุงเทพ",
    author: {
      id: "3",
      name: "ผู้ใช้ทดสอบ",
      avatar: "",
      rating: 5.0,
      exchanges: 1,
    },
    createdAt: "2025-04-10",
    status: "active",
  },
  {
    id: "38",
    title: "เครื่องดูดฝุ่น Xiaomi",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400",
    ],
    description: "เครื่องดูดฝุ่นไร้สาย แรงดูดดี แบตเตอรี่ยังปกติ",
    wantedItem: "เตารีดไอน้ำ หรือ เครื่องฟอกอากาศ",
    location: "นนทบุรี",
    author: { id: "17", name: "นิว", avatar: "", rating: 4.8, exchanges: 10 },
    createdAt: "2025-04-11",
    status: "active",
  },
  {
    id: "39",
    title: "หม้อหุงข้าว 1 ลิตร",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1622484211148-52b31e08dbff?w=400", // placeholder for generic kitchenware
    ],
    description: "หม้อหุงข้าวเคลือบเทฟลอน ข้าวไม่ติดหม้อ ล้างง่าย",
    wantedItem: "จานชามเซรามิค หรือ กระทะไฟฟ้า",
    location: "ขอนแก่น",
    author: {
      id: "8",
      name: "วุฒิชัย",
      avatar: "",
      rating: 4.9,
      exchanges: 15,
    },
    createdAt: "2025-04-12",
    status: "active",
  },
  {
    id: "40",
    title: "เตารีดไอน้ำ Philips",
    category: "ของใช้ภายในบ้าน",
    images: [
      "https://images.unsplash.com/photo-1626245000527-dfc9a6a81577?w=400", // placeholder
    ],
    description: "รีดเรียบเร็ว มีระบบพ่นไอน้ำอัตโนมัติ สภาพ 90%",
    wantedItem: "ราวตากผ้า หรือ เครื่องดูดฝุ่น",
    location: "ปทุมธานี",
    author: { id: "2", name: "มานะ", avatar: "", rating: 4.7, exchanges: 8 },
    createdAt: "2025-04-13",
    status: "active",
  },

  // หมวด: เครื่องมือและอุปกรณ์ช่างขนาดเล็ก
  {
    id: "41",
    title: "ชุดประแจ 12 ชิ้น",
    category: "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก",
    images: [
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400",
    ],
    description: "ประแจแหวนข้างปากตาย วัสดุเหล็ก CR-V แข็งแรงมาก",
    wantedItem: "สว่าน หรือ กล่องเครื่องมือ",
    location: "สมุทรปราการ",
    author: {
      id: "18",
      name: "ช่างเอก",
      avatar: "",
      rating: 5.0,
      exchanges: 22,
    },
    createdAt: "2025-04-14",
    status: "active",
  },
  {
    id: "42",
    title: "ตลับเมตร 5 เมตร",
    category: "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400",
    ],
    description: "ตลับเมตรพกพา ล็อกสายวัดได้แน่นหนา",
    wantedItem: "ค้อน หรือ ไขควง",
    location: "กรุงเทพ",
    author: { id: "19", name: "ปุ๊ก", avatar: "", rating: 4.5, exchanges: 1 },
    createdAt: "2025-04-15",
    status: "active",
  },
  {
    id: "43",
    title: "ปืนกาวร้อน",
    category: "เครื่องมือและอุปกรณ์ช่างขนาดเล็ก",
    images: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400",
    ],
    description: "ปืนยิงกาวแท่ง แถมกาวให้ 10 แท่ง ใช้ทำงานประดิษฐ์",
    wantedItem: "อุปกรณ์ทำงานฝีมือ หรือ สีอะคริลิค",
    location: "เชียงใหม่",
    author: { id: "10", name: "เจน", avatar: "", rating: 4.8, exchanges: 9 },
    createdAt: "2025-04-16",
    status: "active",
  },

  // หมวด: อุปกรณ์กีฬาและสันทนาการ
  {
    id: "44",
    title: "เสื่อโยคะ ความหนา 10mm",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",
      "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400",
    ],
    description: "เสื่อโยคะนุ่มซับแรงกระแทกได้ดี มาพร้อมสายรัดสะพาย",
    wantedItem: "ดัมเบล หรือ เชือกกระโดด",
    location: "กรุงเทพ",
    author: { id: "4", name: "สมหญิง", avatar: "", rating: 4.9, exchanges: 5 },
    createdAt: "2025-04-17",
    status: "active",
  },
  {
    id: "45",
    title: "ไม้แบดมินตัน Yonex",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1613918431703-93165313f8c8?w=400",
      "https://images.unsplash.com/photo-1622599511051-16f55a1234d0?w=400",
    ],
    description: "ไม้แบดสภาพ 80% เอ็นยังตึงดี แถมลูกแบดพลาสติก 3 ลูก",
    wantedItem: "ลูกบาสเกตบอล หรือ รองเท้ากีฬา",
    location: "นนทบุรี",
    author: { id: "20", name: "โจ", avatar: "", rating: 4.4, exchanges: 3 },
    createdAt: "2025-04-18",
    status: "active",
  },
  {
    id: "46",
    title: "เต็นท์แคมป์ปิ้ง 2 คน",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1504280741562-60234ea0bf14?w=400",
      "https://images.unsplash.com/photo-1537565266751-341cd9f15033?w=400",
    ],
    description: "เต็นท์กางอัตโนมัติ กันน้ำค้างได้ดี น้ำหนักเบา",
    wantedItem: "เก้าอี้แคมป์ปิ้ง หรือ ถุงนอน",
    location: "นครราชสีมา",
    author: { id: "1", name: "สมชาย", avatar: "", rating: 4.8, exchanges: 12 },
    createdAt: "2025-04-19",
    status: "active",
  },
  {
    id: "47",
    title: "รองเท้าวิ่ง Nike ไซส์ 42",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400",
    ],
    description: "รองเท้าใส่วิ่งบนลู่ ซักทำความสะอาดเรียบร้อยแล้ว",
    wantedItem: "กระเป๋าเป้ หรือ ไม้แบดมินตัน",
    location: "กรุงเทพ",
    author: { id: "21", name: "เคน", avatar: "", rating: 5.0, exchanges: 7 },
    createdAt: "2025-04-20",
    status: "active",
  },
  {
    id: "48",
    title: "สเก็ตบอร์ด (Skateboard)",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=400",
      "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=400",
    ],
    description: "บอร์ดประกอบเอง ล้อไหลลื่น มีรอยถลอกจากการเล่นนิดหน่อย",
    wantedItem: "จักรยาน หรือ ลำโพงบลูทูธ",
    location: "ชลบุรี",
    author: { id: "9", name: "ตั้ม", avatar: "", rating: 5.0, exchanges: 7 },
    createdAt: "2025-04-21",
    status: "active",
  },
  {
    id: "49",
    title: "ถุงนอน (Sleeping Bag)",
    category: "อุปกรณ์กีฬาและสันทนาการ",
    images: [
      "https://images.unsplash.com/photo-1582095914589-322197fb1fbc?w=400",
      "https://images.unsplash.com/photo-1620023647309-848f02f90a88?w=400",
    ],
    description: "ถุงนอนหนานุ่ม สำหรับเดินป่าหน้าหนาว พับเก็บง่าย",
    wantedItem: "เต็นท์ หรือ เตาแก๊สปิกนิก",
    location: "เชียงใหม่",
    author: { id: "13", name: "ฟ้าใส", avatar: "", rating: 4.9, exchanges: 11 },
    createdAt: "2025-04-22",
    status: "active",
  },
];

export type PostReport = {
  id: string;
  targetTitle: string;
  reason: string;
  reporter: string;
  createdAt: string;
  status: "pending" | "resolved";
};

export const mockReports = [
  {
    id: "r1",
    reporter: "Greenloop User",
    postId: "p4",
    postTitle: "iPhone 11 มือสอง",
    reason: "โพสต์ไม่ตรงกับสินค้า",
    date: "2026-03-10",
  },
  {
    id: "r2",
    reporter: "Somchai",
    postId: "p7",
    postTitle: "เสื้อ Nike",
    reason: "สินค้าปลอม",
    date: "2026-03-11",
  },
  {
    id: "r3",
    reporter: "มานะ",
    postId: "p12",
    postTitle: "PS4",
    reason: "เนื้อหาไม่เหมาะสม",
    date: "2026-03-12",
  },
];
