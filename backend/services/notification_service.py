import threading
from db import get_connection
from services.email_service import send_notification_email

def notify_user(member_id, title, message, link="/notifications"):
    """
    ฟังก์ชันกลางสำหรับส่งแจ้งเตือนทั้งในเว็บ (DB) และส่งเข้า Email พร้อมกัน
    เรียกใช้ฟังก์ชันนี้จุดเดียวจบ ไม่ต้องเขียน Hardcode ซ้ำในแต่ละ Route
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. ค้นหาข้อมูลผู้รับ (Email และ DisplayName)
        cursor.execute("SELECT Email, DisplayName FROM member WHERE MemberID = %s", (member_id,))
        user = cursor.fetchone()

        # 2. บันทึกลงตาราง notification (In-app Notification)
        sql_notif = """
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
            VALUES (%s, %s, %s, 0, NOW())
        """
        cursor.execute(sql_notif, (member_id, message, link))
        conn.commit()

        # 3. ส่ง Email แบบ Background Thread (ไม่บล็อก API Response)
        if user and user.get('Email'):
            email_body = f"""สวัสดีครับคุณ {user.get('DisplayName', 'ผู้ใช้งาน')},

{message}

ท่านสามารถเข้าตรวจสอบรายละเอียดเพิ่มเติมได้ที่เว็บไซต์ Tradin

ขอบคุณที่ใช้บริการ Tradin สังคมแห่งการแบ่งปัน
"""
            # ใช้ Thread เพื่อให้การส่งอีเมลทำงานเบื้องหลัง API จะได้ตอบกลับทันที
            thread = threading.Thread(
                target=send_notification_email,
                args=(user['Email'], f"[Tradin] {title}", email_body)
            )
            thread.start()

        return True
    except Exception as e:
        print(f"❌ ระบบแจ้งเตือนขัดข้อง: {str(e)}")
        if conn: conn.rollback()
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()