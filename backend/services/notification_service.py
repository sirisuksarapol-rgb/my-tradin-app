import threading
from db import get_connection
from services.email_service import send_notification_email


# ==========================================
# NOTIFICATION SERVICE MODULE
# ==========================================
# ฟังก์ชันสำหรับส่งการแจ้งเตือนผู้ใช้งานแบบบูรณาการ (In-app Notification & Email)
def notify_user(member_id, title, message, link="/notifications"):
    """
    ฟังก์ชันกลางสำหรับส่งแจ้งเตือนทั้งในระบบเว็บ (บันทึกลงฐานข้อมูล) และส่งอีเมล (Email) ไปพร้อมกัน
    ช่วยลดความซ้ำซ้อนในการเขียนโค้ด (Hardcode) ซ้ำซ้อนในแต่ละ Route
    
    Parameters:
        member_id (int): รหัสประจำตัวสมาชิกผู้รับการแจ้งเตือน
        title (str): หัวข้อของการแจ้งเตือน
        message (str): เนื้อหาหรือรายละเอียดข้อความแจ้งเตือน
        link (str): ลิงก์ปลายทางเมื่อผู้ใช้คลิกดูการแจ้งเตือน (ค่าเริ่มต้นคือ '/notifications')
        
    Returns:
        bool: คืนค่า True หากดำเนินการสำเร็จ หรือ False หากเกิดข้อผิดพลาด
    """
    # เปิดการเชื่อมต่อฐานข้อมูลและสร้าง Cursor แบบ Dictionary
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. ค้นหาข้อมูลผู้รับ (อีเมลและชื่อที่แสดง) จากตาราง member
        cursor.execute("SELECT Email, DisplayName FROM member WHERE MemberID = %s", (member_id,))
        user = cursor.fetchone()

        # 2. บันทึกข้อมูลการแจ้งเตือนลงในตาราง notification สำหรับแสดงผลในแอปพลิเคชัน (In-app Notification)
        sql_notif = """
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
            VALUES (%s, %s, %s, 0, NOW())
        """
        cursor.execute(sql_notif, (member_id, message, link))
        conn.commit()

        # 3. ส่ง Email แบบ Background Thread เพื่อไม่ให้กระบวนการส่งอีเมลบล็อกการตอบกลับของ API
        if user and user.get('Email'):
            email_body = f"""สวัสดีครับคุณ {user.get('DisplayName', 'ผู้ใช้งาน')},

            {message}

            ท่านสามารถเข้าตรวจสอบรายละเอียดเพิ่มเติมได้ที่เว็บไซต์ Tradin

            ขอบคุณที่ใช้บริการ Tradin สังคมแห่งการแบ่งปัน
            """
            # ใช้ Thread แยกการทำงาน เพื่อให้ API สามารถส่ง Response กลับหาผู้ใช้ได้ทันทีไม่ต้องรอส่งเมลเสร็จ
            thread = threading.Thread(
                target=send_notification_email,
                args=(user['Email'], f"[Tradin] {title}", email_body)
            )
            thread.start()

        return True
        
    except Exception as e:
        # จัดการข้อผิดพลาดและทำการ Rollback ข้อมูลหากเกิดปัญหาในระบบฐานข้อมูล
        print(f"❌ ระบบแจ้งเตือนขัดข้อง: {str(e)}")
        if conn: 
            conn.rollback()
        return False
        
    finally:
        # ปิด Cursor และการเชื่อมต่อฐานข้อมูลทุกครั้งเพื่อคืนทรัพยากรระบบ
        if cursor: 
            cursor.close()
        if conn: 
            conn.close()