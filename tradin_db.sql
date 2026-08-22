-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 17, 2026 at 06:53 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tradin_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `AdminID` int(11) NOT NULL COMMENT 'รหัสผู้ดูแลระบบ',
  `AdminName` varchar(100) DEFAULT NULL COMMENT 'ชื่อผู้ดูแลระบบ',
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) DEFAULT NULL COMMENT 'รหัสผ่าน'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`AdminID`, `AdminName`, `Email`, `Password`) VALUES
(1, 'SuperAdmin', 'SuperAdmin@tradin.com', 'superadmin1'),
(2, 'SupportAdmin', 'SupportAdmin@tradin.com', 'superadmin2');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `CategoryID` int(11) NOT NULL COMMENT 'รหัสหมวดหมู่',
  `CategoryName` varchar(100) DEFAULT NULL COMMENT 'ชื่อหมวดหมู่',
  `IconName` varchar(50) DEFAULT 'MoreHorizontal'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`CategoryID`, `CategoryName`, `IconName`) VALUES
(1, 'อุปกรณ์อิเล็กทรอนิกส์และไอที', 'Cpu'),
(2, 'อุปกรณ์เสริมโทรศัพท์และคอมพิวเตอร์', 'Smartphone'),
(3, 'อุปกรณ์สํานักงานและการเรียน', 'PenTool'),
(4, 'หนังสือและสื่อการเรียนรู้', 'BookOpen'),
(5, 'ของใช้ในชีวิตประจําวัน', 'ShoppingBag'),
(6, 'ของใช้ภายในบ้าน', 'House'),
(7, 'เครื่องมือและอุปกรณ์ช่างขนาดเล็ก', 'Wrench'),
(8, 'อุปกรณ์กีฬาและสันทนาการ', 'Dumbbell'),
(9, 'อุปกรณ์เดินทางและของพกพา', 'Briefcase'),
(10, 'ของเบ็ดเตล็ดทั่วไป', 'Package'),
(11, 'แว่นตา', 'Flame'),
(12, 'ผลไม้', 'Apple');

-- --------------------------------------------------------

--
-- Table structure for table `exchange`
--

CREATE TABLE `exchange` (
  `ExchangeID` int(11) NOT NULL COMMENT 'รหัสการแลกเปลี่ยน',
  `ExchangeLocation` varchar(255) DEFAULT NULL COMMENT 'สถานที่แลกเปลี่ยน',
  `PartnerScore` int(11) DEFAULT NULL COMMENT 'คะแนนที่คู่แลกเปลี่ยนให้',
  `ExchangeResult` varchar(100) DEFAULT NULL COMMENT 'ผลการแลกเปลี่ยน',
  `StartDate` datetime DEFAULT NULL COMMENT 'วันที่เริ่มแลก',
  `SuccessDate` datetime DEFAULT NULL COMMENT 'วันที่แลกสำเร็จ',
  `CancelDate` datetime DEFAULT NULL COMMENT 'วันที่ยกเลิกแลกเปลี่ยน',
  `RatingDate` datetime DEFAULT NULL COMMENT 'วันที่ให้คะแนน',
  `PhoneNumber` varchar(20) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  `TargetPhoneNumber` varchar(20) DEFAULT NULL,
  `CancelReason` text DEFAULT NULL COMMENT 'เหตุผลการยกเลิกแลกเปลี่ยน',
  `ExchangeStatus` varchar(50) DEFAULT NULL COMMENT 'สถานะการแลกเปลี่ยน',
  `Comment` text DEFAULT NULL COMMENT 'ความคิดเห็น',
  `Score` int(11) DEFAULT NULL COMMENT 'คะแนน',
  `PartnerComment` text DEFAULT NULL COMMENT 'ความคิดเห็นของคู่แลกเปลี่ยน (อีกฝั่ง)',
  `MemberID` int(11) DEFAULT NULL COMMENT 'รหัสสมาชิก',
  `TargetMemberID` int(11) DEFAULT NULL COMMENT 'รหัสเจ้าของโพสต์ที่ต้องการไปแลกด้วย',
  `MyItemID` int(11) DEFAULT NULL COMMENT 'รหัสสิ่งของของเราที่เอาไปเสนอแลก',
  `TargetItemID` int(11) DEFAULT NULL COMMENT 'รหัสสิ่งของของเขาที่เราอยากได้',
  `IsMemberVerified` tinyint(1) NOT NULL DEFAULT 0,
  `IsTargetMemberVerified` tinyint(1) NOT NULL DEFAULT 0,
  `IsMemberReceived` tinyint(1) DEFAULT 0,
  `IsTargetMemberReceived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `exchange`
--

INSERT INTO `exchange` (`ExchangeID`, `ExchangeLocation`, `PartnerScore`, `ExchangeResult`, `StartDate`, `SuccessDate`, `CancelDate`, `RatingDate`, `PhoneNumber`, `TargetPhoneNumber`, `CancelReason`, `ExchangeStatus`, `Comment`, `Score`, `PartnerComment`, `MemberID`, `TargetMemberID`, `MyItemID`, `TargetItemID`, `IsMemberVerified`, `IsTargetMemberVerified`, `IsMemberReceived`, `IsTargetMemberReceived`) VALUES
(2, 'ICONSIAM (ไอคอนสยาม)', NULL, NULL, '2026-07-18 16:20:43', '2026-07-18 17:31:38', NULL, NULL, '0640123532', '0934479146', NULL, 'completed', 'คุยง่าย', 5, NULL, 7, 3, 30, 13, 1, 1, 1, 1),
(3, 'ตึกสาทรธานี', 5, NULL, '2026-07-18 17:53:22', '2026-07-30 19:23:37', NULL, NULL, '0640123532', '1111111111', NULL, 'completed', 'สุดยอด', 5, 'งานดีนะ', 4, 7, 9, 31, 1, 1, 1, 1),
(4, 'เซ็นทรัล ลาดพร้าว หรือตามแนว BTS จตุจักร', NULL, NULL, '2026-07-24 01:01:39', '2026-07-24 01:04:21', NULL, NULL, '111111111111', '2222222222', NULL, 'completed', 'จากหนุงหนิง', 3, NULL, 7, 12, 29, 38, 1, 1, 1, 1),
(5, 'ม.จุฬา', NULL, NULL, '2026-07-24 10:09:44', '2026-07-24 10:20:38', NULL, NULL, '111111111111', '2222222222', NULL, 'completed', 'จาก kloppo', 4, NULL, 7, 12, 39, 41, 1, 1, 1, 1),
(6, 'โลตัส พระราม 9 (ของมีน้ำหนักมาก แนะนำให้นำรถยนต์มาใส่ครับ)', NULL, NULL, '2026-07-27 16:05:41', NULL, NULL, NULL, '111111111111', NULL, NULL, 'pending', NULL, NULL, NULL, 12, 7, 37, 42, 0, 0, 0, 0),
(7, 'ม.จุฬา', NULL, NULL, '2026-07-28 01:29:12', NULL, '2026-07-28 01:32:35', NULL, '111111111111', NULL, NULL, 'rejected', NULL, NULL, NULL, 12, 7, 44, 42, 0, 0, 0, 0),
(8, 'ม.จุฬา', NULL, NULL, '2026-07-28 01:35:05', NULL, '2026-07-28 01:38:00', NULL, '111111111111', NULL, NULL, 'rejected', NULL, NULL, NULL, 12, 7, 44, 42, 0, 0, 0, 0),
(9, 'เซ็นทรัล ลาดพร้าว / BTS ห้าแยกลาดพร้าว', NULL, NULL, '2026-07-28 01:38:57', NULL, '2026-07-28 01:39:26', NULL, '222222222222', NULL, NULL, 'rejected', NULL, NULL, NULL, 7, 12, 42, 44, 0, 0, 0, 0),
(10, 'เซ็นทรัล ลาดพร้าว / BTS ห้าแยกลาดพร้าว', NULL, NULL, '2026-07-28 01:40:51', NULL, NULL, NULL, '111111111111', NULL, NULL, 'pending', NULL, NULL, NULL, 7, 12, 42, 44, 0, 0, 0, 0),
(11, 'ม.จุฬา', 3, NULL, '2026-07-28 18:21:36', '2026-07-28 18:23:56', NULL, NULL, '111111111111', '2222222222', NULL, 'completed', 'คุยง่าย', 5, 'แย่มาก', 12, 7, 44, 42, 1, 1, 1, 1),
(12, 'โลตัส พระราม 9 (ของมีน้ำหนักมาก แนะนำให้นำรถยนต์มาใส่ครับ)', NULL, NULL, '2026-07-28 23:12:42', '2026-07-29 00:00:29', NULL, NULL, '0640123532', '2222222222', NULL, 'in_progress', NULL, NULL, NULL, 12, 2, 37, 17, 1, 1, 0, 0),
(13, 'โลตัส พระราม 9 (ของมีน้ำหนักมาก แนะนำให้นำรถยนต์มาใส่ครับ)', NULL, NULL, '2026-07-29 22:35:12', NULL, NULL, NULL, '111111111111', NULL, NULL, 'pending', NULL, NULL, NULL, 12, 7, 37, 45, 0, 0, 0, 0),
(14, 'โลตัส พระราม 9 (ของมีน้ำหนักมาก แนะนำให้นำรถยนต์มาใส่ครับ)', NULL, NULL, '2026-07-29 22:35:35', NULL, NULL, NULL, '111111111111', NULL, NULL, 'pending', NULL, NULL, NULL, 12, 2, 37, 17, 0, 0, 0, 0),
(15, 'ไทวัสดุ รังสิต', 4, NULL, '2026-07-30 19:25:02', '2026-07-30 19:28:50', NULL, NULL, '0640123532', '0934479146', NULL, 'completed', 'ขอดีแต่ไม่ตรงปก', 2, 'คุยดีแลกสองรอบแล้ว', 7, 4, 68, 14, 1, 1, 1, 1),
(16, 'สวนลุมพินี', 3, NULL, '2026-07-31 09:18:14', '2026-07-31 09:22:42', NULL, NULL, '0640123532', '0934479146', NULL, 'completed', 'ดีมากกกกกก', 4, 'พอใช้ได้พูดคุยดี', 12, 1, 71, 16, 1, 1, 1, 1),
(17, 'เซ็นทรัล ลาดพร้าว / BTS ห้าแยกลาดพร้าว', 5, NULL, '2026-08-04 18:34:00', '2026-08-04 18:39:42', NULL, NULL, '0640123532', '0647405870', NULL, 'completed', 'พูดดีมากกกก', 4, 'สวยมากครับเจ้าของสิ่งของ', 7, 12, 45, 76, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE `item` (
  `ItemID` int(11) NOT NULL COMMENT 'รหัสสิ่งของ',
  `ItemName` varchar(255) DEFAULT NULL COMMENT 'ชื่อสิ่งของ',
  `ItemDescription` text DEFAULT NULL COMMENT 'รายละเอียดสิ่งของ',
  `DesiredItem` varchar(255) DEFAULT NULL COMMENT 'สิ่งที่ต้องการแลก',
  `ItemImage` varchar(255) DEFAULT NULL COMMENT 'รูปภาพ',
  `ItemStatus` varchar(50) DEFAULT NULL COMMENT 'สถานะสิ่งของ',
  `PostDate` datetime DEFAULT NULL COMMENT 'วันที่โพสต์',
  `CancelDate` datetime DEFAULT NULL COMMENT 'วันที่ยกเลิก',
  `MeetingLocation` varchar(255) DEFAULT NULL COMMENT 'สถานที่นัดรับ',
  `LocationLink` varchar(255) DEFAULT NULL COMMENT 'ลิงก์โลเคชั่น',
  `CategoryID` int(11) DEFAULT NULL COMMENT 'รหัสหมวดหมู่',
  `MemberID` int(11) DEFAULT NULL COMMENT 'รหัสสมาชิก'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`ItemID`, `ItemName`, `ItemDescription`, `DesiredItem`, `ItemImage`, `ItemStatus`, `PostDate`, `CancelDate`, `MeetingLocation`, `LocationLink`, `CategoryID`, `MemberID`) VALUES
(2, 'จอมอนิเตอร์ Dell 24 นิ้ว', 'จอ IPS สภาพนางฟ้า ใช้งานปกติ', 'คีย์บอร์ด Mechanical', 'b763e22f-159e-457e-b93b-04c5dd8d72a3.jpg,b8b89059-b6ce-4e2b-93b2-bfc8e5602499.jpg,eedf8070-3f85-4a4c-ba53-755df76bf5e9.jpg', 'Available', '2023-06-02 11:00:00', NULL, 'MRT พระราม 9', '', 1, 2),
(3, 'คีย์บอร์ด Keychron K2', 'สวิตช์ Brown สภาพใหม่มาก', 'หูฟังไร้สาย', 'bb3be24f-d721-402b-a0a8-eb02491e662c.webp,8a9c4954-4d48-4057-97a5-947c97df1e36.webp,12a24799-2b35-40ef-9f65-4765dfac8f50.webp', 'Available', '2023-06-03 12:00:00', NULL, 'ม.เกษตร', '', 2, 3),
(4, 'เคส iPhone 13 Pro', 'เคสใสกันกระแทก แบรนด์ดัง', 'สายชาร์จแท้', '1c6e21de-c6ec-4cba-a2d2-6f842079dcf2.jpg,daeeace9-c04d-4e45-bcd8-23e788774c63.jpg,3e72765e-e60f-4d8e-b0da-e685ac6e2f37.webp', 'Available', '2023-06-04 13:00:00', NULL, 'เซ็นทรัลลาดพร้าว', '', 2, 4),
(5, 'ปากกา Lamy สีดำด้าน', 'หมึกยังเต็ม ไม่ค่อยได้ใช้', 'สมุดโน้ต Moleskine', '625bb124-954c-4891-9760-469ed3d1231a.jpg,1a649948-7091-4119-b4f0-10bc89342359.jpg,e00b4379-f716-40e7-91c6-57e08fad81cb.jpg', 'Available', '2023-06-05 14:00:00', NULL, 'สยามสแควร์', '', 3, 5),
(6, 'เครื่องคิดเลขวิทยาศาสตร์ Casio', 'ใช้ตอนเรียนมหาลัย สภาพ 80%', 'กระเป๋าดินสอ', '36cdab1f-6e8b-420b-9b55-07a77893da63.jpg,4755daa9-1170-46fb-b3ab-c88ecb619064.jpg,c880d673-2b7e-49b7-bb95-4db5a4bd8837.jpg', 'Available', '2023-06-06 15:00:00', NULL, 'ม.จุฬา', 'https://maps.app.goo.gl/iuvvMvFn2RGN1vWX6', 1, 1),
(7, 'หนังสือ แคลคูลัส 1', 'มีรอยขีดเขียนด้วยดินสอ ลบได้', 'หนังสือ ฟิสิกส์ 1', '5f798250-5167-4876-89d2-e5bf6d74e8b0.jpg,ef80d0dc-fd27-485a-bce6-9f4faa2d26b1.jpg,e5b83fce-91a3-441b-bb7a-50308f0bb283.webp', 'Available', '2023-06-07 16:00:00', NULL, 'หน้า ม.ธรรมศาสตร์', '', 4, 2),
(8, 'นิยาย แฮร์รี่ พอตเตอร์ เล่ม 1', 'ปกแข็ง สภาพสะสม', 'นิยายสืบสวน', '696306cd-37ac-46d1-9990-a8014ac99825.jpg,d5984a52-06d8-4696-ba10-e7eb184326ad.jpg,7111dc83-86d9-4e6a-b7e1-1f0a36eeaa31.jpg', 'Available', '2023-06-08 17:00:00', NULL, 'BTS อโศก', '', 4, 3),
(9, 'กระติกน้ำ Yeti 30 oz', 'ของแท้ เก็บความเย็นดีเยี่ยม', 'กล่องข้าว Bento', 'a9fc654a-6bb1-44ba-8912-d39cb754af81.webp,27a24a27-3182-425f-a90f-9cdb3ae6a9f4.avif,a8a0e9ee-37ad-484c-b347-e298a142cd95.webp', 'exchanged', '2023-06-09 09:00:00', NULL, 'ตึกสาทรธานี', '', 5, 4),
(10, 'ร่มพับ 3 ตอน ป้องกัน UV', 'กางไป 2 ครั้ง สภาพเหมือนใหม่', 'แว่นกันแดด', '8c0fd675-5de7-41e4-8e70-9fba37852e6d.jpg,9d6329ed-4493-4bc3-bc9a-647580be88dd.jpg,ccebe060-e456-4251-9c31-bd7c6f74f843.jpg', 'Available', '2023-06-10 10:00:00', NULL, 'MRT สีลม', '', 5, 5),
(11, 'โคมไฟอ่านหนังสือ Xiaomi', 'ไฟ LED ปรับแสงได้', 'นาฬิกาปลุกดิจิตอล', 'd86b23fb-7458-494b-ad4b-b9e22bc6d49f.jpg,39d8fdcd-cc01-4954-98a7-43ef8d13c276.jpg,dc454b8e-b381-4fbd-8b44-aa79cc2372e7.jpg', 'Available', '2023-06-11 11:00:00', NULL, 'เดอะมอลล์บางกะปิ', '', 6, 1),
(12, 'เครื่องปั่นน้ำผลไม้พกพา', 'ชาร์จ USB ได้ ใช้งานปกติ', 'เครื่องชงกาแฟดริป', '807c69b8-d7d4-453b-9201-28c6fb3cc7bc.jpg,8b6d7831-001e-4d9d-9b28-361264c5e16b.jpg,2f8dba91-c99c-46e4-b32d-a94ee4515295.jpg', 'Available', '2023-06-12 12:00:00', NULL, 'แฟชั่นไอส์แลนด์', '', 6, 2),
(13, 'ชุดไขควงอเนกประสงค์ 24 in 1', 'กล่องอะลูมิเนียม สภาพดี', 'ตลับเมตร 5 เมตร', '341f9622-ae85-472f-89e6-b0117088738b.jpg,6e821682-3ac9-45bf-a9ef-d38220874066.jpg,7878a4f2-9555-45e4-a465-98b80228e776.webp', 'exchanged', '2023-06-13 13:00:00', NULL, 'โฮมโปร รังสิต', '', 7, 3),
(14, 'สว่านไร้สายขนาดเล็ก', 'แบตเตอรี่ยังทน', 'คีมตัดลวด', 'd659adf2-f57f-4e9d-b491-69690594f1e7.jpg,08a3aa5c-2167-4eda-9893-729a9e23cea4.jpg,efbd1da9-6210-43c1-87b9-c2ab1df71d96.jpg', 'exchanged', '2023-06-14 14:00:00', NULL, 'เมกาบางนา', '', 7, 4),
(15, 'ไม้แบดมินตัน Yonex', 'มีรอยถลอกตรงขอบนิดหน่อย', 'ลูกแบด 1 หลอด', 'a6b337af-8d2d-4139-8314-d90cfdcf6788.jpg,adb224df-e52f-4022-b1bc-19c2a372914e.jpg,ff1737ce-4364-4835-a2d7-1c3014841086.jpg', 'Available', '2023-06-15 15:00:00', NULL, 'สนามกีฬาหัวหมาก', '', 8, 5),
(16, 'ลูกบาสเกตบอล Spalding', 'สูบลมแล้ว พร้อมเล่น', 'รองเท้าผ้าใบเบอร์ 42', 'a05858f4-5a01-4cd3-8590-490719087ec7.jpg,c855fefe-1cf4-450b-9f3a-d6fbce93ef69.jpg,bf6cf320-6a7d-4fd0-8ee7-467f3c0ff508.jpg', 'exchanged', '2023-06-16 16:00:00', NULL, 'สวนลุมพินี', '', 8, 1),
(17, 'กระเป๋าเดินทาง 20 นิ้ว', 'ล้อลื่น ซิปไม่แตก', 'กระเป๋าเป้แบคแพค', '0bfdd6f1-5609-46d9-a82e-a7cf6995d12e.jpg,278e1b38-f245-4dc1-9524-e5f4adbcd3b2.jpg,99485f1f-146d-4434-87ec-55fe11039093.jpg', 'Available', '2023-06-17 17:00:00', NULL, 'ดอนเมือง', '', 9, 2),
(18, 'หมอนรองคอ Memory Foam', 'นุ่มมาก ถอดซักได้', 'ที่อุดหูและผ้าปิดตา', 'e8d6b5b3-6cd0-46b8-8d54-6f148c34176c.jpg,08f4063f-a86b-483e-9a4c-8186c472878f.jpg,671dc802-c180-49cb-b1ae-5c6706faad0d.jpg', 'Available', '2023-06-18 09:00:00', NULL, 'BTS หมอชิต', '', 9, 3),
(19, 'พวงกุญแจตุ๊กตาหมี', 'ของขวัญจับฉลาก ไม่เคยใช้', 'อะไรก็ได้เสนอมา', 'bfa169b9-2bd7-446c-bcd6-7bcc289738d2.jpg,1b9a8938-48a5-4058-b7e1-ff356ac90577.jpg,f79f9b08-2fa6-4aad-82ca-6055bba0f98d.jpg', 'Available', '2023-06-19 10:00:00', NULL, 'อนุสาวรีย์ชัยฯ', '', 10, 4),
(20, 'กล่องพลาสติกใส่อาหาร 3 ช่อง', 'BPA Free เข้าไมโครเวฟได้', 'ขวดน้ำ 1 ลิตร', 'b2c8325c-29de-40e0-a5d2-94ae9db93822.avif,f4fa6709-5d03-4c4f-bb40-cfc35818066b.avif,d5ce1950-c1cc-4434-9fa8-a85031a102ad.avif', 'Available', '2023-06-20 11:00:00', NULL, 'Central Westgate', '', 10, 5),
(29, 'กล้องฟิล์ม Olympus Mju II สภาพดี', 'กล้องใช้งานได้เต็มระบบ เลนส์ใสไม่มีฝาหรือรา มีรอยขีดข่วนตามร่างกายเล็กน้อยตามการใช้งาน แฟลชติด ช่องมองภาพชัดเจน แถมสายคล้องมือให้ด้วยครับ', 'กล้องทอยกันน้ำ หรือ เลนส์กล้อง Mirrorless ค่าย Sony (ส่วนต่างคุยกันได้)', '49ffb558-eb9f-4322-b1b1-df0021e82070.jpg,304a3d94-7bac-4744-acda-691d3a39f291.jpg,523644b2-ac2f-4d1f-975d-f2d5d795d778.jpg', 'exchanged', NULL, NULL, 'เซ็นทรัล ลาดพร้าว หรือตามแนว BTS จตุจักร', '', 1, 7),
(30, 'เสื้อเชิ้ต H&M สี Oversized สีขาว ไซส์ L', 'ซื้อมาจากช็อป H&M สภาพใหม่มาก 95% ใส่ไปแค่ครั้งเดียวผ้ายังแข็งทรงสวย ไม่มีตำหนิหรือคราบเหลือง ซักแห้งเก็บอย่างดีครับ', 'เสื้อยืดลายกราฟิก ไซส์ L สภาพใกล้เคียงกัน หรือกางเกงสแล็กสีดำ เอว 32', 'c2ce00b5-a982-4f7b-8d3c-b2e162dd9835.jpg,4a71228f-8423-46de-aae7-d0413cf96626.jpg,986efcf9-4e60-46e1-a3d0-1a8eec2ca361.jpg', 'exchanged', NULL, NULL, 'ICONSIAM (ไอคอนสยาม)', '', 1, 7),
(31, 'จอยคอนโทรลเลอร์ DualSense (PS5) สีขาว', 'จอยแท้มากับเครื่อง อนาล็อกไม่ดริฟต์ ปุ่มกดเด้งรับปกติทุกปุ่ม แบตเตอรี่ยังอึด มีรอยขนแมวตามการใช้งานทั่วไป ไม่มีกล่องแยกให้นะครับ', 'แผ่นเกม PS5 (ลองเสนอแนว Action / RPG มาคุยกันก่อนได้ครับ) หรือโค้ดเติมเงินเกม', '59ab43e1-4fa2-4dc4-aecc-c401db065109.jpg,ec8548ba-2357-4531-865d-1a4f776d7cac.jpg,4794d32b-dc7c-4528-a343-1d2ec026f976.jpg', 'exchanged', NULL, NULL, 'สยามพารากอน หรือ ตึก Digital Gateway สยาม', '', 10, 7),
(33, 'กล้อง Sony ZV-1', 'สภาพ 95% ใช้งานได้ปกติทุกฟังก์ชัน มีรอยขนแมวเล็กน้อยบริเวณฐาน อุปกรณ์ครบกล่อง แถมแบตเตอรี่แท้ให้อีก 1 ก้อน', 'iPad Gen 9 หรือแท็บเล็ตรุ่นอื่นที่มีสเปกใกล้เคียงกัน', '987903ec-9347-44b3-b03c-547b4d36aa41.jpg,cd54a8e8-6eb2-4a9f-b4bd-bb484fe56f12.jpg,fcda7449-e7fe-4adf-be60-7d26c4711264.jpg', 'active', NULL, NULL, 'สยามพารากอน', '', 1, 12),
(34, 'นาฬิกา G-Shock รุ่น GA-2100 (สีดำ)', 'ของแท้ สภาพเหมือนใหม่ ซื้อมาใส่ไปแค่ 2 ครั้ง ไม่มีรอยขีดข่วนหรือตำหนิ มีกล่องเหล็กและใบรับประกันครบถ้วน', 'Apple Watch', '2379597f-07da-4132-b1f4-c1b352a60053.jpg,d042ffcf-9c73-411f-b5ca-a6b08a0b2913.jpg,132dedac-13ad-4c92-afc1-6f65d34e3478.jpg', 'active', NULL, NULL, 'เซ็นทรัล ลาดพร้าว', '', 1, 12),
(35, 'หนังสือนิยาย Harry Potter ฉบับปกแข็ง ครบเซ็ต 7 เล่มภาษาไทย', 'สภาพสะสมดีมาก กระดาษด้านในไม่เหลือง ขอบมุมหนังสือไม่ยับ เก็บรักษาในตู้กระจกอย่างดี ไม่โดนแดด', 'เครื่องชงกาแฟแคปซูล Nespresso หรือเตาอบไฟฟ้าขนาดเล็ก', 'e2a6be72-14ea-4d4e-8854-42449fe8a7ff.jpg,5d7ae957-5547-4a53-8996-4196e8f7df78.jpg,5464610c-a7be-4794-8335-1d4941084b04.jpeg', 'active', NULL, NULL, 'เมกาบางนา', '', 1, 12),
(36, 'หม้อทอดไร้น้ำมัน Philips รุ่น HD9220', 'สภาพ 90% ใช้งานได้ปกติ ทำความร้อนได้ดีเยี่ยม ล้างทำความสะอาดตระแกรงแล้วเรียบร้อย มีรอยถลอกเล็กน้อยที่ด้ามจับด้านนอก (หมดประกันแล้ว)', 'เครื่องฟอกอากาศขนาดเล็กสำหรับห้องนอน หรือ ไมโครเวฟสภาพพร้อมใช้งาน', 'bd051a30-e458-482f-bea5-708d23491279.jpg,f4ab4e52-7634-4047-a632-e81a1e40882e.jpg,d2dd7305-b679-49dd-b25f-d9b8dfe2705b.jpg', 'active', NULL, NULL, 'ฟิวเจอร์พาร์ค รังสิต', '', 1, 12),
(37, 'ดัมเบลปรับน้ำหนักได้ 24 kg (จำนวน 1 คู่)', 'ดัมเบลปรับน้ำหนักได้ตั้งแต่ 2.5 - 24 กิโลกรัม สภาพเหล็กยังดีมาก กลไกปรับน้ำหนักใช้งานได้ลื่นไหล ฐานรองพลาสติกมีรอยร้าวเล็กน้อย 1 จุดแต่ไม่มีผลต่อการวางหรือการใช้งาน', 'ลู่วิ่งแบบเดิน (Walking Pad) พับได้ หรือ เก้าอี้ทำงานเพื่อสุขภาพ (Ergonomic Chair)', '9afd9024-ce8b-4551-b992-172bafe54f14.jpg,24547426-a7c0-4173-838d-f898f40b8dea.jpg,82a4d731-e244-41a7-a207-b8bb248a7b17.jpg', 'active', NULL, NULL, 'โลตัส พระราม 9 (ของมีน้ำหนักมาก แนะนำให้นำรถยนต์มาใส่ครับ)', '', 1, 12),
(38, 'กล่องสุ่ม Pop Mart - Skullpanda City of Night Series (ตัว Dancer)', 'สินค้ามือหนึ่ง แกะกล่องเพื่อเช็คการ์ดอย่างเดียว ตัวโมเดลฟิกเกอร์ยังอยู่ในซองซีลพลาสติก ไม่เคยแกะออกมาตั้งโชว์ อุปกรณ์ กล่อง และการ์ดอยู่ครบสภาพสมบูรณ์ 100%', 'โมเดล Crybaby หรือ Labubu ในซีรีส์อื่นๆ (เสนอมาพูดคุยกันก่อนได้ครับ)', 'd5a66362-828f-4e92-879f-04ffa4074106.jpg,ac11ca8d-04b0-4771-9bfc-3f83b6b6d9da.jpg,8f9417e0-733a-47bc-b3aa-d4842b1da452.jpg,6b4a4df0-0f94-403d-abf0-3c8b06511d0b.jpg', 'exchanged', NULL, NULL, 'เซ็นทรัลเวิลด์ หรือตามแนวสถานีรถไฟฟ้า BTS', '', 1, 12),
(39, 'โน๊ตบุ๊ค Lenovo LOQ Essential 15IRX11-83SC003GTA Gray', 'Lenovo LOQ Essential 15 โน้ตบุ๊กเกมมิ่งสุดแกร่ง อัดแน่นด้วยสเปกระดับเทพ ขับเคลื่อนด้วยขุมพลัง Intel Core i5-13450HX จับคู่กับกราฟิกการ์ดเกมมิ่งใหม่ล่าสุด NVIDIA GeForce RTX 5050 Laptop ที่พร้อมระเบิดพลังกราฟิกทุกเกมบนหน้าจอ 15.6 นิ้ว เป็นเจ้าของเกมมิ่งที่ทั้งแรง ทั้งคุ้มค่า', 'iPad Air รุ่น 11 นิ้ว', '8ceae447-7c0e-4862-b97a-c7267f9c382e.webp,e1a43362-2828-42e0-98ba-9d8324453a88.webp,4ea87a9a-ffa7-4da8-a019-627680fa606e.webp', 'exchanged', NULL, NULL, 'ม.จุฬา', '', 1, 7),
(41, 'iPad Air รุ่น 11 นิ้ว', 'iPad Air รุ่น 11 นิ้ว วันนี้อัดฉีดพลังแรงโดยชิป Apple M4 บอกเลยว่าทั้งมากความสามารถและเป็นเจ้าของได้ง่ายๆ นอกจากนี้ยังมาพร้อมจอภาพ Liquid Retina ที่สวยสดงดงาม กล้องหน้า Center Stage 12MP เพื่อวิดีโอคอลที่ยอดเยี่ยม iPadOS รวมถึง Wi-Fi 7ที่เร็วสุดแรง ทั้งยังสามารถใช้งานร่วมกับ Apple Pencil Pro Magic Keyboard สำหรับ iPad Air และอีกมากมาย คุณจึงทำนั่นทำนี่แบบมัลติทาสก์ เรียนรู้ ทำงาน เล่นสนุก และสร้างสรรค์ได้ง่ายๆ', 'โน๊ตบุ๊ค', '38d7cb6d-8fcd-4d7d-b42d-ebd16f69d70c.webp,3363890b-c2fe-4b92-bb2a-592818747cc5.webp,0d8ceb05-cfec-42a4-becc-1528f24e08ca.webp', 'exchanged', NULL, NULL, 'มกฉกส', '', 1, 12),
(42, 'Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026)', 'iPad Air รุ่น 11 นิ้ว วันนี้อัดฉีดพลังแรงโดยชิป Apple M4 บอกเลยว่าทั้งมากความสามารถและเป็นเจ้าของได้ง่ายๆ นอกจากนี้ยังมาพร้อมจอภาพ Liquid Retina ที่สวยสดงดงาม กล้องหน้า Center Stage 12MP เพื่อวิดีโอคอลที่ยอดเยี่ยม iPadOS รวมถึง Wi-Fi 7ที่เร็วสุดแรง ', 'โน้ตบุ๊ค', '10e40995-aabc-4f32-aa33-f76342c8356e.webp,b15cc3c3-fb3e-4b33-8d14-809948137a31.webp,c2467538-001e-43dc-a474-d21740baeecb.webp', 'exchanged', NULL, NULL, 'เซ็นทรัล ลาดพร้าว / BTS ห้าแยกลาดพร้าว', '', 1, 7),
(44, 'NOTEBOOK (โน้ตบุ๊ค) HP 15-FC0897AU (NATURAL SILVER)', 'Brands	HP\r\nProcessors	AMD Ryzen™ 7 7730U Processor\r\nProcessor Speed	2.0GHz up to 4.5GHz, 4MB L2 Cache / 16MB L3 Cache\r\nVideo Graphics	AMD Radeon Graphics (Integrated Graphics)\r\nScreen Size	15.6\"\r\nDisplay	FHD (1920x1080), IPS, micro-edge, anti-glare, 300 nits, 45% NTSC\r\nMemory	8GB (8GB x1) DDR4 3200MHz SO-DIMM\r\nMemory Slots	2x DDR4 3200MHz SO-DIMM Slots\r\nMax Memory	Up to 32GB\r\nStorage	256GB PCIe NVMe M.2 SSD\r\nStorage Slots	1 x M.2 SSD slots (Occupied)\r\nOperating System	Windows 11 Home\r\nCamera	HP True Vision 720p HD camera with temporal noise reduction and integrated dual array digital microphones\r\nKeyboard	Full-size Backlit , soft gray keyboard with numeric keypad\r\nConnection port	\r\n1 x USB Type-C 5Gbps signaling rate (supports data transfer only and does not support charging or external monitors)\r\n2 x USB Type-A 5Gbps signaling rate\r\n1 x AC smart pin\r\n1 x HDMI™ 1.4b\r\n1 x Headphone/Microphone Combo\r\nWi-Fi/ Bluetooth	Wi-Fi 6 (802.11ax)+Bluetooth 5.4\r\nBattery	3-Cell Li-ion Battery, 41WHr\r\nColor	Natural Silver\r\nDimensions	359.8 x 236 x 18.6 mm.\r\nWeight	1.59 kg\r\nWarranty	2 Years', 'iPad Air ', 'd41d160a-8f08-4047-8800-383e4f32ef83.jpg,929ccbcb-e245-40a7-83ec-0d072dc6a762.jpg,f53e641d-0725-45b1-97ad-26a2214d348b.jpg', 'exchanged', NULL, NULL, 'ม.จุฬา', '', 1, 12),
(45, 'กล้อง Canon EOS M50', 'กล้อง Mirrorless สภาพดี ใช้งานปกติ ถ่ายวิดีโอ 4K ได้', 'iPad หรือ Tablet อื่นๆ', 'f3959e88-0aa9-42af-8e08-465c21148406.jpg,139144bd-2e97-449e-aa4a-42adea11021e.jpg,6e37645b-15bf-4188-a1ad-1edcb3cd886b.jpg', 'exchanged', NULL, NULL, 'เซ็นทรัล ลาดพร้าว / BTS ห้าแยกลาดพร้าว', 'https://maps.app.goo.gl/xxxxxx', 1, 7),
(46, 'หูฟัง Sony WH-1000XM4', 'สีดำ สภาพ 90% แบตยังอึดมาก มีรอยขนแมวนิดหน่อยที่ก้าน ใช้งานระบบตัดเสียงรบกวนได้ปกติ', 'หูฟัง In-ear แบรนด์ Apple หรือ Bose (เสนอมาได้)', '3829484b-029c-44e4-b71f-0f2901eedbd6.jpg,e3840275-700f-4195-89c5-b787867c9ed3.jpg,ca993521-05b0-4e1f-b554-9a598996ba33.jpg', 'active', '2026-07-30 10:00:00', NULL, 'BTS อโศก', '', 1, 1),
(47, 'เมาส์ไร้สาย Logitech MX Master 3', 'สีเทา ใช้งานปกติ คลิกนุ่ม สกรอลง่าย มีกล่องและสายชาร์จครบ', 'คีย์บอร์ด Mechanical ขนาด 75%', '17c8d5fb-e4db-4a20-8e52-0a491d0469e7.webp,25f74a62-4e8b-4737-8fb4-cc362dc9f9ed.jpg,5e3aa928-fe4f-4566-9999-09a72a9f236d.jpg', 'active', '2026-07-30 10:30:00', NULL, 'MRT พระราม 9', '', 2, 2),
(48, 'เก้าอี้เพื่อสุขภาพ Ergotrend', 'รุ่น Dual Back นั่งสบาย ไม่ปวดหลัง ตำหนิพนักพิงมีรอยถลอกนิดหน่อยตามการใช้งาน ซื้อมาปีที่แล้ว', 'โต๊ะปรับระดับไฟฟ้า', '12ce5848-b9fc-4a19-81dd-4d1ec8719676.webp,679d3c7d-889f-4a8a-a0ee-4f280d46a772.jpg,c9b18f45-2628-47d6-8756-2e640bb21126.jpg', 'active', '2026-07-30 11:00:00', NULL, 'เซ็นทรัล พระราม 2 (ต้องเอารถมาขนเอง)', '', 3, 3),
(49, 'หนังสือ Atomic Habits ฉบับแปลไทย', 'อ่านจบแล้ว สภาพ 99% ไม่มีรอยพับหรือขีดเขียน ห่อปกพลาสติกใสเรียบร้อย', 'หนังสือจิตวิทยาเล่มอื่นๆ หรือหนังสือนิยายสืบสวน', 'd934d281-3b28-449f-88a6-46cb27247f13.jpg,4c960b3d-61a0-4bdd-9083-6b3b7066a961.jpg,4a56d256-f4d1-4759-a54a-eba15a81ac5b.jpg', 'active', '2026-07-30 11:30:00', NULL, 'สยามสแควร์', '', 4, 4),
(50, 'แก้วสแตนเลส Stanley 40oz สีชมพู', 'ของแท้ ซื้อจากช็อป เก็บความเย็นได้ข้ามวัน มีรอยบุบที่ก้นแก้วเล็กน้อย', 'กระเป๋าเป้สะพายหลัง', 'a8507d99-5202-435c-aba9-8a50930b1086.jpg,067f556f-04f6-4b42-a14a-282e4ff2e6fa.jpg,d5a37a41-810c-492c-8760-209d45122ce0.jpg', 'active', '2026-07-30 12:00:00', NULL, 'เมกาบางนา', '', 5, 5),
(51, 'เครื่องดูดฝุ่น Dyson V12 Detect Slim', 'สภาพดี ใช้งานน้อย อุปกรณ์หัวดูดครบทุกชิ้น แบตเตอรี่ยังใช้งานได้นานตามสเปก', 'เครื่องฟอกอากาศ Dyson หรือ เครื่องชงกาแฟอัตโนมัติ', 'c45010c2-4967-4331-aadb-c10450701286.jpg,a9ed6350-b8b5-4051-a66d-679147c03931.jpg,7f1b1aaf-dc8d-412c-85e1-e2f72b5e91f6.jpg', 'active', '2026-07-30 13:00:00', NULL, 'ICONSIAM', '', 6, 7),
(52, 'ชุดประแจและไขควงอเนกประสงค์', 'กล่องเหล็กทนทาน มีหลายหัว ครบชุด ไม่เคยใช้งานเลย เก็บไว้ในห้องเก็บของ', 'สว่านไร้สายขนาดเล็ก หรือ เครื่องเจียร', 'ccb7b55c-2711-4268-a84d-cb9fcee37cad.jpg,8f0b2f2d-fad4-4bb3-aac9-4f1454efc9fe.jpg,872b894c-b11f-420a-9322-c9b0f76059b1.jpg', 'active', '2026-07-30 13:30:00', NULL, 'ฟิวเจอร์พาร์ค รังสิต', '', 7, 11),
(53, 'เสื่อโยคะ Lululemon 5mm', 'สีม่วง หนึบมาก กันลื่นดีเยี่ยม สภาพใหม่ เช็ดทำความสะอาดตลอดหลังใช้งาน', 'ดัมเบล 5kg 1 คู่ หรือ อุปกรณ์ฟิตเนสอื่นๆ', 'b67c991e-edad-47ed-bd59-facc96b7c23b.jpg,e0805fa2-1fcd-461b-bcf0-615d9485a2a7.jpg,1931aac2-6508-4b4c-b10d-c400aaa837be.jpg', 'active', '2026-07-30 14:00:00', NULL, 'เซ็นทรัล ลาดพร้าว', '', 8, 12),
(54, 'เต็นท์นอน 2 คน Naturehike Cloud Up 2', 'น้ำหนักเบา กางง่าย เหมาะกับสายเดินป่า ไม่มีรอยขาด อุปกรณ์สมอบกครบ', 'เตาแก๊สปิกนิก หรือ เก้าอี้แคมป์ปิ้งแบบพับได้', 'e2a1fdad-7dec-4a60-a712-5bfd67127a6d.jpg,b50f5c6f-191b-4de3-a039-c4de0fad7ecb.webp,9be09c3a-a4fa-4bea-a323-4bd03b12bf41.webp', 'active', '2026-07-30 14:30:00', NULL, 'ม.เกษตร', '', 9, 1),
(55, 'คีย์แคป (Keycap) ลายมินิมอล PBT', 'ครบเซ็ต 104 ปุ่ม ไม่ลอก ไม่มัน ใช้งานไปแค่ 1 เดือน', 'เมาส์มาโคร หรือ แผ่นรองเมาส์ผืนใหญ่ (Deskmat)', '0c2fd969-d640-4b39-a159-01c59a53edcf.webp,1a1b9d26-5657-47b7-92ce-9c9013d964ef.webp,7d392157-9cc7-4a5c-8577-bbd4f160b4a7.webp', 'active', '2026-07-30 15:00:00', NULL, 'BTS หมอชิต', '', 2, 2),
(56, 'Apple Watch Series 7 (45mm)', 'ตัวเรือนอะลูมิเนียม สี Midnight แบต 85% มีรอยขนแมวบนจอเล็กน้อย สายชาร์จแท้', 'Garmin Forerunner หรือ สมาร์ทวอทช์สายวิ่ง', '33788d1a-52ee-4336-a572-78842251cf96.png,e055f3a2-76c2-4016-90f7-ad1c0096e475.jpg,296a5070-c97d-4f36-9dc3-5a2d3248c2a5.jpg', 'Available', '2026-07-30 15:30:00', NULL, 'สยามพารากอน', '', 1, 3),
(57, 'External SSD Samsung T7 1TB', 'สีน้ำเงิน ความเร็วปกติ ไม่ค่อยได้ใช้งาน เอาไว้แบคอัพงานอย่างเดียว', 'SSD M.2 NVMe 1TB หรือ 2TB (ส่วนต่างคุยกัน)', '6bd6f7bb-96d6-4fc7-9fbc-f0783e657597.jpg,3ba8ae9f-bd37-49b8-a070-82f9e02604d0.avif,a12ad872-d5d7-403a-a86b-2b2e296b2d45.jpeg', 'Available', '2026-07-30 15:45:00', NULL, 'BTS อโศก', '', 1, 4),
(58, 'ขาตั้งจอคอมพิวเตอร์ Ergotron LX', 'แขนจับจอมอนิเตอร์ แข็งแรงมาก รับน้ำหนักจอ 34 นิ้วได้สบาย สภาพ 95%', 'คีย์บอร์ด Mechanical ไซส์ 65%', 'a07622bf-e0cf-4a32-b643-41196addde5b.webp,dca165e3-60c3-4656-9f97-66999403bc8d.webp,be83a1fc-969b-4364-804e-6442141ab650.jpg', 'Available', '2026-07-30 16:00:00', NULL, 'เซ็นทรัลเวิลด์', '', 2, 5),
(59, 'เมาส์แนวตั้ง Logitech MX Vertical', 'ช่วยลดอาการออฟฟิศซินโดรม แบตอึดมาก มีกล่องครบ', 'เมาส์เกมมิ่งไร้สาย', 'e5193a00-c978-4b14-8fd8-90675cef262e.jpg,ea8e424d-2021-4704-b678-7c86d0bc3d8c.jpg,c3d2e1c0-5f62-4d64-8a8d-7a212bf9b179.jpg', 'Available', '2026-07-30 16:15:00', NULL, 'MRT พระราม 9', '', 2, 7),
(60, 'โคมไฟตั้งโต๊ะ Xiaomi Mi Smart LED', 'ปรับแสง ขาว/ส้ม ได้ ควบคุมผ่านแอปได้ สภาพนางฟ้า', 'ชั้นวางเอกสาร หรือ กล่องเก็บของมินิมอล', 'f17e6ae0-d208-461c-bbe5-8d5eee43d7ef.webp,a5441bde-1d52-4d51-be62-f90325194a18.webp,b4f9d482-f891-48ac-aa17-0d3b41fa8808.webp', 'Available', '2026-07-30 16:30:00', NULL, 'ไอคอนสยาม', '', 3, 9),
(61, 'เครื่องพิมพ์ Brother เลเซอร์ขาวดำ', 'พิมพ์เร็ว หมึกยังเหลือเยอะ เหมาะกับสายเอกสาร', 'เครื่องทำลายเอกสารขนาดเล็ก', 'b38b6ee2-99b9-49d0-b3c2-26d92533f7c5.jpg,80660d27-2a11-4826-a587-3672e92341db.jpg,214ab314-6d48-40c4-93af-fd20821b0529.jpg', 'Available', '2026-07-30 16:45:00', NULL, 'โลตัส ลาดพร้าว', '', 3, 11),
(62, 'เซ็ตหนังสือนิยายสืบสวน คินดะอิจิ', 'จำนวน 5 เล่ม สภาพสะสม อ่านรอบเดียวเก็บเข้าตู้', 'นิยายแปลญี่ปุ่นแนวอื่นๆ หรือ หนังสือจิตวิทยา', 'ed2f74e7-f3a8-401f-95fc-701984cffaec.jpg,cc6d0cb0-0401-4ea8-911b-f8e5617adb83.jpg,2cf5d4a3-d660-42ec-800a-f7b87cb3b5aa.jpg', 'Available', '2026-07-30 17:00:00', NULL, 'ม.เกษตรศาสตร์', '', 4, 12),
(63, 'หนังสือเตรียมสอบ TOEIC 2026', 'มีรอยขีดเขียนด้วยดินสอนิดหน่อย ลบออกให้แล้ว แผ่น CD ครบ', 'หนังสือเตรียมสอบ IELTS', 'f9bb0933-4e98-49b2-8bf6-9269ede4e190.jpg,41f805e3-b700-4b3c-b635-b97186252010.jpg,c1bfa01b-070d-41d2-a9a1-7d96db28d374.jpg', 'Available', '2026-07-30 17:15:00', NULL, 'ม.จุฬา', '', 4, 1),
(64, 'น้ำหอม Zara 100ml', 'กลิ่น Vibrant Leather ฉีดไปไม่กี่ครั้ง รู้สึกไม่เข้ากับตัวเอง', 'น้ำหอมผู้ชายแบรนด์อื่น หรือ สกินแคร์ผู้ชาย', 'e813714e-70c1-4778-85c6-f5a1a55275b3.jpg,a9bc2a72-26f0-464b-b73a-4afa85ce26c3.jpg,f937db0d-07e8-4bf2-a5d4-ea7dc1a11038.jpg', 'Available', '2026-07-30 17:30:00', NULL, 'เมกาบางนา', '', 5, 2),
(65, 'แว่นกันแดด Ray-Ban Aviator', 'ของแท้ กรอบสีทอง เลนส์เขียวคลาสสิก มีกล่องและผ้าเช็ดแว่น', 'กระเป๋าสตางค์หนังแท้', '4615af9b-8ae1-4efb-a610-e271d5416f66.jpg,c94aad57-dfc8-4bb9-962e-bcb7e75fc2b9.jpg,67203ad1-1690-41ed-988f-9db14dc0dc9a.webp', 'Available', '2026-07-30 17:45:00', NULL, 'เซ็นทรัล ลาดพร้าว', '', 5, 3),
(66, 'เครื่องฟอกอากาศ Xiaomi Purifier 4 Compact', 'ตัวเล็กกะทัดรัด ไส้กรองเพิ่งเปลี่ยนไป 2 เดือน', 'พัดลมทาวเวอร์ หรือ เครื่องทำความชื้น', 'b192d53a-a711-4eee-90fe-a2ea3e76a150.webp,5309e528-2dd2-47c2-9fae-fef2cd044173.jpg,588579d8-7f43-4b7f-89a3-7e3fe21ac80c.jpg', 'Available', '2026-07-30 18:00:00', NULL, 'แฟชั่นไอส์แลนด์', '', 6, 4),
(67, 'หุ่นยนต์ดูดฝุ่น Roborock รุ่นเก่า', 'ยังทำงานได้ดี แบตเก็บไฟได้ประมาณ 40 นาที เหมาะกับห้องคอนโด', 'เครื่องดูดฝุ่นไร้สายแบบด้ามจับ', '6d29bc85-f18d-45ee-8ae7-d2c35775251a.jpg,d91c7442-d98c-45db-b088-937c025abc1b.jpg,34107702-b380-4dbc-ab3f-cc9633e2b559.webp', 'Available', '2026-07-30 18:15:00', NULL, 'เดอะมอลล์ บางกะปิ', '', 6, 5),
(68, 'เครื่องเจียรไฟฟ้า (ลูกหมู) Bosch', 'ใช้งานหนักได้ดี สายไฟไม่ขาด แถมแผ่นตัดให้ 3 แผ่น', 'สว่านโรตารี่', 'bf23eb6c-bed1-475e-a3cd-5b44320ca89b.webp,501eb5ae-e22e-4d6b-9188-da3ad04320bf.jpg,d580e586-e58e-4559-bd45-4169f6e673e5.jpg', 'exchanged', '2026-07-30 18:30:00', NULL, 'ไทวัสดุ รังสิต', '', 7, 7),
(69, 'ชุดบล็อก ประแจก๊อกแก๊ก 46 ชิ้น', 'ครบเซ็ต ซื้อมาประกอบเฟอร์นิเจอร์ครั้งเดียวแล้วเก็บยาว', 'ตลับเมตรเลเซอร์', 'efeb8fd7-7e3b-4cf4-b859-492932c26fa8.jpg,62c48e59-495c-4d6a-92c7-20bd8ca8d049.jpg,b54223ac-f9bf-4c2f-ab7a-e80eca3000c6.jpg', 'Available', '2026-07-30 18:45:00', NULL, 'โฮมโปร พระราม 9', '', 7, 9),
(70, 'ไม้เทนนิส Wilson Pro Staff', 'เอ็นเพิ่งขึ้นใหม่ กริปมีรอยลอกนิดหน่อยตามอายุการใช้งาน', 'ลูกเทนนิส 2 กระป๋อง + เป้กีฬา', '8a6f5362-3dcc-4346-9940-ad28d5351d2c.jpg,04f85e5c-526b-453b-bf8c-6b7356d78850.jpg,1ffe0983-e93c-4b7d-b859-85137f0aa9e2.jpg,c4ae22fb-7a3e-4899-b6b4-036547b85173.jpg,8c86b64e-3755-4135-a0bd-935d2fc96b2a.jpg', 'Available', '2026-07-30 19:00:00', NULL, 'สนามกีฬาหัวหมาก', '', 8, 11),
(71, 'รองเท้าสตั๊ด Nike ไซส์ 42', 'ใส่เตะหญ้าเทียมไป 3 แมตช์ คับไปนิดนึง สภาพ 95%', 'รองเท้าสตั๊ดไซส์ 43 หรือ อุปกรณ์กีฬาอื่นๆ', '39b24792-e469-4e93-80ad-5f394af96f3f.jpg,e41b0c15-97be-4644-b116-42694814c132.jpg,671551c0-4df3-470a-acc2-0905c96429f0.jpg', 'exchanged', '2026-07-30 19:15:00', NULL, 'สวนลุมพินี', '', 8, 12),
(72, 'เป้แบคแพค Osprey 40L', 'สีดำ เหมาะสำหรับเดินทาง 3-5 วัน แผ่นซัพพอร์ตหลังดีมาก', 'กระเป๋าเดินทางล้อลาก 24 นิ้ว', 'f1bb5160-7d83-4416-a366-af52bf4e1fe5.jpg,d045059c-119a-4eea-90aa-0878c0401ce6.jpg,76f61aa1-7792-4c6a-b4c7-e3c5c3cd20fc.jpg', 'Available', '2026-07-30 19:30:00', NULL, 'BTS หมอชิต', '', 9, 1),
(73, 'เตาแก๊สพกพา Fire-Maple', 'แถมแก๊สกระป๋องซาลาเปาให้ 1 กระป๋อง ไฟแรง พับเก็บเล็กมาก', 'เก้าอี้แคมป์ปิ้ง', 'aa051056-ac88-4567-8922-b5641b0ae07d.jpg,5d135422-7e8b-4186-a279-2c0f37aaf87d.jpg,9724ff9a-7458-4f51-bc90-8951d95bdab1.jpg', 'Available', '2026-07-30 19:45:00', NULL, 'ดอนเมือง', '', 9, 2),
(74, 'บอร์ดเกม Catan กล่องภาษาไทย', 'อุปกรณ์ครบถ้วน การ์ดใส่ซองไว้ทุกใบ ไม่มีขาดไม่มีหาย', 'บอร์ดเกม Splendor หรือ เกมอื่นๆ เสนอมาได้', '43c7c73d-d1eb-4538-99b0-6a2b71c083d9.jpg,0892209d-d28d-4a74-9b84-13a5a058382d.jpg,be153154-1838-4d74-b0b0-72aa315f38ce.jpg,b27f780e-da49-4a4e-908f-af5f45e318de.jpg', 'Available', '2026-07-30 20:00:00', NULL, 'เซ็นทรัล ปิ่นเกล้า', '', 10, 3),
(75, 'ฟิกเกอร์ Nendoroid อนิเมะ', 'ของแท้ กล่องคมกริบ ไม่เคยแกะซีล ซื้อมาซ้ำกับเพื่อน', 'โมเดลวันพีช หรือ ของสะสมอื่นๆ', 'f26f3f9e-f043-4e18-9f8d-6828ef45a144.jpg,6d6034b7-26b8-4204-95c8-777937e41d67.jpg,8859bf26-ca98-4677-b5e0-52ce34b9c58d.jpg', 'Available', '2026-07-30 20:15:00', NULL, 'อนุสาวรีย์ชัยฯ', '', 10, 4),
(76, 'ipad', '\r\niPad รุ่น 11 นิ้ว วันนี้มากความสามารถยิ่งกว่าที่เคยด้วยชิป A16 ที่เร็วสุดแรง, จอภาพ Liquid Retina', 'iPad ', '3d8906c9-56f4-4425-8588-913cadfcd071.jpg,8f118061-4a6e-46b1-8a91-23789ee6e6b8.webp,19e0aa5c-05eb-4c8a-a73a-e77c9ecffb5e.webp', 'exchanged', '2026-07-31 10:27:50', NULL, 'ม.จุฬา', '', 1, 12),
(77, 'iPad Wi-Fi (11th Gen)', 'iPad รุ่น 11 นิ้ว , Wi-Fi 6 และ 5G ที่รวดเร็ว, ช่องต่อ USB-C และ 4 สีสันสวยสะดุดตา บอกเลยว่า iPad คือวิธีอันทรงพลังที่จะช่วยให้คุณสร้างสรรค์ ต่อติดกับทุกเรื่องเสมอ และทำนู่นทำนี่ให้เสร็จได้ ซึ่งทั้งหมดนี้มาในราคาที่เป็นเจ้าของได้ง่ายๆ จนคุณต้องแปลกใจ\r\n\r\nสินค้าภายในกล่อง : iPad,สายชาร์จ USB‑C (1 เมตร),อะแดปเตอร์แปลงไฟ USB‑C ขนาด 20 วัตต์', 'iPad ', 'b1e0a8db-63d2-4d8c-90bc-b7b2fd683449.png,cc5f141a-2815-4d33-9908-9521ed17b049.jpg,2337f220-9690-4109-97e9-b3f8604540af.webp', 'active', '2026-07-31 10:29:32', NULL, 'มกฉกส', '', 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `MemberID` int(11) NOT NULL COMMENT 'รหัสสมาชิก',
  `DisplayName` varchar(100) DEFAULT NULL COMMENT 'ชื่อที่แสดง',
  `Email` varchar(100) DEFAULT NULL COMMENT 'อีเมล',
  `Password` varchar(500) DEFAULT NULL COMMENT 'รหัสผ่าน',
  `ProfileImage` varchar(255) DEFAULT NULL COMMENT 'รูปโปรไฟล์',
  `RegisterDate` datetime DEFAULT NULL COMMENT 'วันที่สมัครสมาชิก',
  `MemberStatus` varchar(50) DEFAULT NULL COMMENT 'สถานะสมาชิก',
  `VerifyCode` varchar(50) DEFAULT NULL COMMENT 'รหัสยืนยันตัวตน',
  `VerifyExpire` datetime DEFAULT NULL COMMENT 'เวลาที่รหัส OTP จะหมดอายุ',
  `EmailVerified` tinyint(1) DEFAULT 0 COMMENT 'สถานะยืนยันอีเมล (0=ยังไม่ยืนยัน, 1=ยืนยันแล้ว)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`MemberID`, `DisplayName`, `Email`, `Password`, `ProfileImage`, `RegisterDate`, `MemberStatus`, `VerifyCode`, `VerifyExpire`, `EmailVerified`) VALUES
(1, 'สมชาย ใจดี', 'somchai@email.com', 'pass1234', 'images_69.jpg', '2023-01-10 09:00:00', 'Active', NULL, NULL, 0),
(2, 'สมหญิง รักเรียน', 'somying@email.com', 'pass1234', 'images_97.jpg', '2023-02-15 10:30:00', 'Active', NULL, NULL, 0),
(3, 'นพดล คนเก่ง', 'nopadol@email.com', 'pass1234', 'images_81.jpg', '2023-03-20 14:15:00', 'Active', NULL, NULL, 0),
(4, 'มาลี สวยมาก', 'malee@email.com', 'pass1234', 'images_73.jpg', '2023-04-05 16:45:00', 'Active', NULL, NULL, 0),
(5, 'ธนา พารวย', 'thana@email.com', 'pass1234', 'images_-_2026-07-30T155331.217.jpg', '2023-05-12 11:20:00', 'Active', '861990', '2026-07-12 20:13:11', 0),
(7, 'หนุงหนิง', 'sirisuksarapol@gmail.com', 'scrypt:32768:8:1$YYwow8TqiGg1LhfG$95687e6edd822bcfeef490394341e7e1bbad4943c5a74b08a53005f6ed0e977b25c895230cc61ed893beee532bef8c00014516df38d8e8ecd9719d8f52625c10', '488621113_18017968958699735_4135535295783346322_n.jpg', '2026-06-17 19:55:18', 'Active', NULL, NULL, 1),
(9, 'โอ๋', 'sirisuksarapol2@gmail.com', 'scrypt:32768:8:1$hPSUpp7fiG1E17Dz$10f3975b19e6aac589ebf3bd625585cbdf37c82856636fe613ce1d180d5e8eebf814bd783d0505099caae5f4472fbcd9ef90fa33480ad0f28acc7439c77453ab', 'DQPF0780.JPG', '2026-07-10 12:23:48', 'Pending', '105257', '2026-07-10 12:53:48', 0),
(11, 'อจ.', 'siriporntubtim@gmail.com', 'scrypt:32768:8:1$QJUV0w5a8oaHIdxu$929f603cdc5b98483208c24308be017afee9d42b09f1d592cf24547df09a6c2fa174660e340bce06ba4c0c1efbd741264b4f0ae5551480349b48e065f06b0853', 'default.png', '2026-07-10 12:26:49', 'Active', NULL, NULL, 1),
(12, 'kloppo', 'sirisak.sar@ku.th', 'scrypt:32768:8:1$vZySdqIztHy2LKJe$9527b38ca95452ebaa68b06841dc5c1a883ab55f5823030adf59a466e8b8c8347cfc1d2671ab2c39e67f83f71803ddeefa50f2852b136e155edcb09db702ecd9', 'images_97.jpg', '2026-07-23 22:43:52', 'Active', NULL, NULL, 1),
(14, 'บรรจง', 'sirisuksarapol2@gmail.com', 'scrypt:32768:8:1$gKRHd7ibS7hoRrOk$7248eb1e787bdb400491e1ff4db82334fcf31da53a056f5fa4f53a993022c9137a764b8258369fd42fdc52588fb7e9352d3bfe1fd05f0a40d99bf4f4331e996e', 'images_97.jpg', '2026-08-10 00:09:16', 'Pending', '605379', '2026-08-10 00:39:16', 0),
(15, 'บรรจง', 'sirisuksarapol2@gmail.com', 'scrypt:32768:8:1$EiG3nAZkkLa322PN$da876e4c8563d604be8a3974b3c3836e6e180c32376505eeaaa04ae7f187ed1646e22ae180b294a23a2357cbd2856112044a98a34b1aaa800c30226bedfe61c2', 'images_97.jpg', '2026-08-10 00:12:34', 'Pending', '302277', '2026-08-10 00:42:34', 0),
(16, 'อิ๋ง', 'wannisa212003@gmail.com', 'scrypt:32768:8:1$nPMEczSR2pyJl8VF$1acdf13110459f777dfd8b310a91fecde0c4d1b41382efa87bfdf73489607ac40d472f3b5c44f3d638ae5b0fd620ece5dcbf3b3d99bf544c40d259c6f79fc0b7', 'images_-_2026-07-30T155331.217.jpg', '2026-08-10 00:19:44', 'Active', NULL, NULL, 1),
(17, 'อองตอง', 'sirisuksarapol@gmail.com', 'scrypt:32768:8:1$ye3BBFnnzU472Qwc$9f77e1cc594137e90457ced118a018e63e236dd21b260430d1ef331867150d79fdcd2fa84379988a6e0acd7e3c3676c76c4b56327b610905b25391df861bb91c', 'IMG_9713.jpeg', '2026-08-10 19:30:27', 'Pending', '454148', '2026-08-10 20:00:27', 0);

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `NotificationID` int(11) NOT NULL,
  `MemberID` int(11) NOT NULL COMMENT 'ID ของผู้รับแจ้งเตือน',
  `Message` varchar(255) NOT NULL COMMENT 'ข้อความแจ้งเตือน',
  `Link` varchar(150) DEFAULT '/incoming-requests' COMMENT 'ลิงก์ที่กดแล้วจะให้เด้งไป',
  `IsRead` tinyint(1) DEFAULT 0 COMMENT '0 = ยังไม่อ่าน, 1 = อ่านแล้ว',
  `CreateDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`NotificationID`, `MemberID`, `Message`, `Link`, `IsRead`, `CreateDate`) VALUES
(4, 3, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก เสื้อเชิ้ต H&M สี Oversized สีขาว ไซส์ L กับ ชุดไขควงอเนกประสงค์ 24 in 1', '/incoming-requests?id=2', 1, '2026-07-18 09:20:43'),
(5, 7, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 1, '2026-07-18 09:22:04'),
(6, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 725994 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/2', 1, '2026-07-18 09:22:10'),
(7, 3, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 768662 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/2', 1, '2026-07-18 09:22:15'),
(8, 7, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก มาลี สวยงาม ต้องการแลก กระติกน้ำ Yeti 30 oz กับ จอยคอนโทรลเลอร์ DualSense (PS5) สีขาว', '/incoming-requests?id=3', 1, '2026-07-18 10:53:22'),
(9, 4, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 1, '2026-07-18 10:53:58'),
(10, 4, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 768722 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/3', 1, '2026-07-18 10:54:04'),
(11, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 687326 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/3', 1, '2026-07-18 10:54:08'),
(12, 12, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก กล้องฟิล์ม Olympus Mju II สภาพดี กับ กล่องสุ่ม Pop Mart - Skullpanda City of Night Series (ตัว Dancer)', '/incoming-requests?id=4', 1, '2026-07-23 18:01:39'),
(13, 7, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 1, '2026-07-23 18:02:01'),
(14, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 992393 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/4', 1, '2026-07-23 18:02:08'),
(15, 12, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 931228 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/4', 1, '2026-07-23 18:02:17'),
(16, 12, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก โน๊ตบุ๊ค Lenovo LOQ Essential 15IRX11-83SC003GTA Gray กับ iPad Air รุ่น 11 นิ้ว', '/incoming-requests?id=5', 1, '2026-07-24 03:09:44'),
(17, 7, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 0, '2026-07-24 03:12:24'),
(18, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 848106 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/5', 1, '2026-07-24 03:12:31'),
(19, 12, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 567126 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/5', 1, '2026-07-24 03:12:36'),
(20, 7, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก ดัมเบลปรับน้ำหนักได้ 24 kg (จำนวน 1 คู่) กับ Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026)', '/incoming-requests?id=6', 0, '2026-07-27 09:05:41'),
(21, 7, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก NOTEBOOK (โน้ตบุ๊ค) HP 15-FC0897AU (NATURAL SILVER) กับ Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026)', '/incoming-requests?id=7', 1, '2026-07-27 18:29:12'),
(22, 12, 'คำขอแลกเปลี่ยนของคุณถูก \'ปฏิเสธ\' แล้ว ❌', '/notifications', 1, '2026-07-27 18:32:35'),
(23, 7, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก NOTEBOOK (โน้ตบุ๊ค) HP 15-FC0897AU (NATURAL SILVER) กับ Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026)', '/incoming-requests?id=8', 1, '2026-07-27 18:35:05'),
(24, 12, 'คำขอแลกเปลี่ยนของคุณถูก \'ปฏิเสธ\' แล้ว ❌', '/notifications', 0, '2026-07-27 18:38:00'),
(25, 12, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026) กับ NOTEBOOK (โน้ตบุ๊ค) HP 15-FC0897AU (NATURAL SILVER)', '/incoming-requests?id=9', 1, '2026-07-27 18:38:57'),
(26, 7, 'คำขอแลกเปลี่ยนของคุณถูก \'ปฏิเสธ\' แล้ว ❌', '/notifications', 1, '2026-07-27 18:39:26'),
(27, 12, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026) กับ NOTEBOOK (โน้ตบุ๊ค) HP 15-FC0897AU (NATURAL SILVER)', '/incoming-requests?id=10', 0, '2026-07-27 18:40:51'),
(28, 7, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก NOTEBOOK (โน้ตบุ๊ค) HP 15-FC0897AU (NATURAL SILVER) กับ Apple iPad Air 11-inch (M4) Wi-Fi 128GB Blue (2026)', '/incoming-requests?id=11', 0, '2026-07-28 11:21:36'),
(29, 12, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 0, '2026-07-28 11:22:22'),
(30, 12, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 173664 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/11', 1, '2026-07-28 11:22:28'),
(31, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 600998 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/11', 1, '2026-07-28 11:22:33'),
(32, 2, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก ดัมเบลปรับน้ำหนักได้ 24 kg (จำนวน 1 คู่) กับ กระเป๋าเดินทาง 20 นิ้ว', '/incoming-requests?id=12', 0, '2026-07-28 16:12:42'),
(33, 12, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 0, '2026-07-28 17:00:29'),
(34, 12, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 222521 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/12', 0, '2026-07-28 17:00:36'),
(35, 2, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 390708 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/12', 0, '2026-07-28 17:00:41'),
(36, 7, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก ดัมเบลปรับน้ำหนักได้ 24 kg (จำนวน 1 คู่) กับ กล้อง Canon EOS M50', '/incoming-requests?id=13', 0, '2026-07-29 15:35:13'),
(37, 2, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก ดัมเบลปรับน้ำหนักได้ 24 kg (จำนวน 1 คู่) กับ กระเป๋าเดินทาง 20 นิ้ว', '/incoming-requests?id=14', 0, '2026-07-29 15:35:35'),
(38, 4, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก เครื่องเจียรไฟฟ้า (ลูกหมู) Bosch กับ สว่านไร้สายขนาดเล็ก', '/incoming-requests?id=15', 0, '2026-07-30 12:25:02'),
(39, 7, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 0, '2026-07-30 12:25:46'),
(40, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 289249 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/15', 0, '2026-07-30 12:25:51'),
(41, 4, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 457282 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/15', 0, '2026-07-30 12:25:56'),
(42, 1, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก kloppo ต้องการแลก รองเท้าสตั๊ด Nike ไซส์ 42 กับ ลูกบาสเกตบอล Spalding', '/incoming-requests?id=16', 0, '2026-07-31 02:18:14'),
(43, 12, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉', '/notifications', 0, '2026-07-31 02:19:08'),
(44, 12, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 820743 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/16', 0, '2026-07-31 02:19:14'),
(45, 1, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 107048 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/16', 0, '2026-07-31 02:19:19'),
(46, 12, 'คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก หนุงหนิง ต้องการแลก กล้อง Canon EOS M50 กับ ipad', '/incoming-requests?id=17', 0, '2026-08-04 11:34:00'),
(47, 7, 'คำขอแลกเปลี่ยนของคุณได้รับการ \'ตอบรับ\' แล้ว! 🎉 กรุณาเข้าสู่ระบบเพื่อยืนยันตัวตนแลกเปลี่ยนข้อมูลติดต่อ', '/notifications', 0, '2026-08-04 11:35:31'),
(48, 7, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 793173 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/17', 0, '2026-08-04 11:35:37'),
(49, 12, 'รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: 675799 (รหัสมีอายุ 10 นาที)', '/exchange-tracking/17', 0, '2026-08-04 11:35:44'),
(50, 12, 'คู่แลกเปลี่ยนของคุณได้กดยืนยันว่าได้รับสิ่งของแล้ว กรุณากดยืนยันการรับของเพื่อทำรายการให้เสร็จสมบูรณ์', '/exchange-tracking/17', 0, '2026-08-04 11:37:20'),
(51, 7, 'การแลกเปลี่ยนรหัส #17 เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ', '/notifications', 0, '2026-08-04 11:38:00'),
(52, 12, 'การแลกเปลี่ยนรหัส #17 เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ', '/notifications', 0, '2026-08-04 11:38:00'),
(53, 7, 'การแลกเปลี่ยนรหัส #17 เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ', '/notifications', 1, '2026-08-04 11:38:49'),
(54, 12, 'การแลกเปลี่ยนรหัส #17 เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ', '/notifications', 0, '2026-08-04 11:38:49'),
(55, 7, 'การแลกเปลี่ยนรหัส #17 เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ', '/notifications', 0, '2026-08-04 11:39:42'),
(56, 12, 'การแลกเปลี่ยนรหัส #17 เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ', '/notifications', 0, '2026-08-04 11:39:42'),
(57, 11, 'โพสต์เรื่อง \'ดินสอ\' ถูกลบโดยผู้ดูแลระบบ เนื่องจากไม่ตรงตามเงื่อนไขการใช้งาน', '/my-items', 0, '2026-08-07 11:39:58'),
(58, 7, 'แอดมินได้ตรวจสอบและแก้ไข \'รายงานโพสต์\' เรียบร้อยแล้ว ขอบคุณที่ช่วยทำให้ชุมชน Tradin ของเราน่าอยู่ขึ้นครับ!', '/notifications', 0, '2026-08-07 11:48:12'),
(59, 7, 'แอดมินได้ตรวจสอบและแก้ไข \'รายงานผู้ใช้งาน\' เรียบร้อยแล้ว ขอบคุณที่ช่วยทำให้ชุมชน Tradin ของเราน่าอยู่ขึ้นครับ!', '/notifications', 0, '2026-08-07 11:49:09');

-- --------------------------------------------------------

--
-- Table structure for table `problem`
--

CREATE TABLE `problem` (
  `ProblemID` int(11) NOT NULL COMMENT 'รหัสปัญหา',
  `ItemID` int(11) DEFAULT NULL,
  `ReportStatus` varchar(50) DEFAULT NULL COMMENT 'สถานะการรายงาน',
  `HelpCenterData` text DEFAULT NULL COMMENT 'ข้อมูลศูนย์ความช่วยเหลือ',
  `ReportDate` datetime DEFAULT NULL COMMENT 'วันที่รายงาน',
  `ProblemType` varchar(100) DEFAULT NULL COMMENT 'ประเภทปัญหา',
  `ResolveDate` datetime DEFAULT NULL COMMENT 'วันที่จัดการปัญหา',
  `MemberID` int(11) DEFAULT NULL COMMENT 'รหัสสมาชิก',
  `ReportedMemberID` int(11) DEFAULT NULL,
  `AdminID` int(11) DEFAULT NULL COMMENT 'รหัสผู้ดูแลระบบ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `problem`
--

INSERT INTO `problem` (`ProblemID`, `ItemID`, `ReportStatus`, `HelpCenterData`, `ReportDate`, `ProblemType`, `ResolveDate`, `MemberID`, `ReportedMemberID`, `AdminID`) VALUES
(1, NULL, 'Resolved', 'ตรวจสอบและแบนผู้ใช้ที่ละเมิดกฎ', '2023-06-10 09:00:00', 'ของไม่ตรงตามภาพ', '2023-06-11 10:00:00', 1, NULL, 1),
(2, NULL, 'Pending', 'รอติดต่อกลับผู้รายงานเพื่อขอหลักฐานเพิ่ม', '2023-06-15 14:30:00', 'ติดต่อคู่แลกเปลี่ยนไม่ได้', NULL, 2, NULL, 2),
(3, NULL, 'Resolved', 'คืนสิทธิ์การโพสต์เรียบร้อยแล้ว', '2023-06-18 11:15:00', 'ระบบขัดข้อง โพสต์ของไม่ได้', '2023-06-18 15:00:00', 3, NULL, 1),
(4, NULL, 'In Progress', 'กำลังตรวจสอบประวัติแชท', '2023-06-20 16:45:00', 'โดนใช้คำพูดไม่สุภาพ', NULL, 4, NULL, 2),
(5, NULL, 'Resolved', 'แก้ไขลิงก์สถานที่นัดรับเรียบร้อย', '2023-06-25 08:20:00', 'แผนที่พิกัดบั๊ก', '2023-06-25 09:30:00', 5, NULL, 1),
(6, 2, 'Resolved', 'แค่อยากรายงาน', '2026-07-02 14:56:48', 'รายงานโพสต์', NULL, 7, NULL, NULL),
(7, NULL, 'Resolved', 'ใช้คำพูดไม่ดี', '2026-07-05 21:57:58', 'รายงานผู้ใช้งาน', NULL, 7, 2, NULL),
(8, NULL, 'รอดำเนินการ', 'เว็บโหลดช้า', '2026-07-06 22:32:16', 'bug', NULL, 1, 1, NULL),
(9, NULL, 'รอดำเนินการ', 'ดีแล้ว', '2026-07-06 22:34:22', 'suggestion', NULL, 7, 7, NULL),
(10, NULL, 'รอดำเนินการ', 'ทำดีแล้วทำต่อไป', '2026-07-06 22:34:34', 'other', NULL, 7, 7, NULL),
(11, 64, 'รอดำเนินการ', '[หัวข้อ: สแปม / โฆษณาซ้ำซ้อน]', '2026-08-04 20:31:52', 'รายงานโพสต์', NULL, 12, NULL, NULL),
(12, NULL, 'รอดำเนินการ', 'หลุดบ่อย', '2026-08-04 20:32:05', 'bug', NULL, 12, NULL, NULL),
(13, NULL, 'รอดำเนินการ', 'โหลดาพให้เรนน็วกว่านี้', '2026-08-04 20:32:23', 'suggestion', NULL, 12, NULL, NULL),
(14, NULL, 'รอดำเนินการ', 'แหแหแ', '2026-08-04 20:34:00', 'other', NULL, 12, NULL, NULL),
(15, NULL, 'รอดำเนินการ', '[หัวข้อ: โปรไฟล์ปลอม / แอบอ้างผู้อื่น]', '2026-08-04 20:34:17', 'รายงานผู้ใช้งาน', NULL, 12, 3, NULL),
(16, 7, 'รอดำเนินการ', '[หัวข้อ: สแปม / โฆษณาซ้ำซ้อน]', '2026-08-07 18:38:07', 'รายงานโพสต์', NULL, 4, NULL, NULL),
(17, NULL, 'รอดำเนินการ', '[หัวข้อ: ใช้วาจาไม่สุภาพ / คุกคาม]', '2026-08-07 18:38:12', 'รายงานผู้ใช้งาน', NULL, 4, 2, NULL),
(18, NULL, 'รอดำเนินการ', 'wdw', '2026-08-07 18:38:21', 'bug', NULL, 4, NULL, NULL),
(19, NULL, 'รอดำเนินการ', 'dwdwd', '2026-08-07 18:38:26', 'suggestion', NULL, 4, NULL, NULL),
(20, NULL, 'รอดำเนินการ', 'dwdwd', '2026-08-07 18:38:35', 'other', NULL, 4, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`AdminID`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`CategoryID`);

--
-- Indexes for table `exchange`
--
ALTER TABLE `exchange`
  ADD PRIMARY KEY (`ExchangeID`),
  ADD KEY `TargetMemberID` (`TargetMemberID`) USING BTREE,
  ADD KEY `MemberID` (`MemberID`) USING BTREE,
  ADD KEY `TargetItemID` (`TargetItemID`) USING BTREE,
  ADD KEY `MyItemID` (`MyItemID`) USING BTREE;

--
-- Indexes for table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`ItemID`),
  ADD KEY `CategoryID` (`CategoryID`),
  ADD KEY `MemberID` (`MemberID`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`MemberID`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `MemberID` (`MemberID`),
  ADD KEY `idx_notification_member` (`MemberID`);

--
-- Indexes for table `problem`
--
ALTER TABLE `problem`
  ADD PRIMARY KEY (`ProblemID`),
  ADD KEY `MemberID` (`MemberID`),
  ADD KEY `AdminID` (`AdminID`),
  ADD KEY `ReportedMemberID` (`ReportedMemberID`) USING BTREE,
  ADD KEY `ItemID` (`ItemID`) USING BTREE;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `AdminID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสผู้ดูแลระบบ', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `CategoryID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสหมวดหมู่', AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `exchange`
--
ALTER TABLE `exchange`
  MODIFY `ExchangeID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสการแลกเปลี่ยน', AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสสิ่งของ', AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `member`
--
ALTER TABLE `member`
  MODIFY `MemberID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสสมาชิก', AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `problem`
--
ALTER TABLE `problem`
  MODIFY `ProblemID` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสปัญหา', AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `exchange`
--
ALTER TABLE `exchange`
  ADD CONSTRAINT `exchange_ibfk_1` FOREIGN KEY (`MemberID`) REFERENCES `member` (`MemberID`),
  ADD CONSTRAINT `fk_exchange_member` FOREIGN KEY (`MemberID`) REFERENCES `member` (`MemberID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_exchange_my_item` FOREIGN KEY (`MyItemID`) REFERENCES `item` (`ItemID`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_exchange_target_item` FOREIGN KEY (`TargetItemID`) REFERENCES `item` (`ItemID`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_exchange_target_member` FOREIGN KEY (`TargetMemberID`) REFERENCES `member` (`MemberID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item`
--
ALTER TABLE `item`
  ADD CONSTRAINT `item_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`),
  ADD CONSTRAINT `item_ibfk_2` FOREIGN KEY (`MemberID`) REFERENCES `member` (`MemberID`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notification_member` FOREIGN KEY (`MemberID`) REFERENCES `member` (`MemberID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `problem`
--
ALTER TABLE `problem`
  ADD CONSTRAINT `fk_problem_item` FOREIGN KEY (`ItemID`) REFERENCES `item` (`ItemID`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_problem_reported_member` FOREIGN KEY (`ReportedMemberID`) REFERENCES `member` (`MemberID`),
  ADD CONSTRAINT `problem_ibfk_1` FOREIGN KEY (`MemberID`) REFERENCES `member` (`MemberID`),
  ADD CONSTRAINT `problem_ibfk_2` FOREIGN KEY (`AdminID`) REFERENCES `admin` (`AdminID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
