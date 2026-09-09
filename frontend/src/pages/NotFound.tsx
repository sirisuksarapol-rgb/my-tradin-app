import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// =========================================================================
// COMPONENT: NotFound (หน้าจอแสดงข้อผิดพลาด 404 เมื่อผู้ใช้เข้าถึงเส้นทางที่ไม่พบในระบบ)
// =========================================================================
const NotFound = () => {
  // ดึงข้อมูลตำแหน่งเส้นทาง (Pathname) ปัจจุบันจาก React Router เพื่อตรวจสอบเส้นทางที่มีปัญหา
  const location = useLocation();

  /**
   * ฟังก์ชัน: useEffect สำหรับบันทึกข้อความแจ้งเตือนข้อผิดพลาด 404 ลงในคอนโซล (Console)
   * ทุกครั้งที่เส้นทาง (Route) ที่ผู้ใช้งานพยายามเข้าถึงมีการเปลี่ยนแปลงหรือไม่มีอยู่จริง
   */
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    // โครงสร้างหลักสำหรับจัดกึ่งกลางหน้าจอพร้อมพื้นหลังสีเทาอ่อน (Muted)
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        {/* แสดงรหัสข้อผิดพลาด 404 ขนาดใหญ่ */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* แสดงข้อความอธิบายว่าไม่พบหน้าที่ต้องการ */}
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/* ลิงก์สำหรับพาผู้ใช้นำทางกลับไปยังหน้าแรกของเว็บไซต์ */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;