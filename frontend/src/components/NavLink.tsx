import { forwardRef } from "react";
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

// =========================================================================
// INTERFACE: โครงสร้างข้อมูล Props สำหรับคอมโพเนนต์ NavLink ที่รองรับคลาสสถานะ
// =========================================================================
/**
 * กำหนดประเภทของ Props สำหรับ NavLinkCompat โดยสืบทอดคุณสมบัติมาจาก NavLinkProps[cite: 31]
 * พร้อมเพิ่มคุณสมบัติเสริมสำหรับการจัดการคลาส CSS ตามสถานะ active และ pending[cite: 31]
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

// =========================================================================
// COMPONENT: NavLink (คอมโพเนนต์ลิงก์นำทางอัจฉริยะที่รองรับสถานะการทำงาน)
// =========================================================================
/**
 * คอมโพเนนต์ NavLink ที่ห่อหุ้ม RouterNavLink เพื่อรองรับการกำหนด CSS Class[cite: 31]
 * ตามสถานะการใช้งาน (Active หรือ Pending) ได้อย่างสะดวกยิ่งขึ้น[cite: 31]
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // ตรวจสอบสถานะ isActive และ isPending เพื่อรวมคลาส CSS เข้าด้วยกันผ่านฟังก์ชัน utilidad cn[cite: 31]
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

// กำหนดชื่อแสดงผลของคอมโพเนนต์สำหรับเครื่องมือ React DevTools เพื่อให้ง่ายต่อการตรวจสอบข้อผิดพลาด[cite: 31]
NavLink.displayName = "NavLink";

// ส่งออกคอมโพเนนต์ NavLink เพื่อนำไปใช้งานในระบบเส้นทาง (Routing) ของโปรเจกต์[cite: 31]
export { NavLink };