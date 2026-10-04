import threading
from db import get_connection
from services.email_service import send_notification_email


def notify_user(member_id, title, message, link="/notifications"):
    """
    ฟังก์ชันกลางสำหรับส่งแจ้งเตือนทั้งในระบบเว็บและอีเมลไปพร้อมกัน
    ช่วยลดความซ้ำซ้อนในการเขียนโค้ดในแต่ละ Route
    
    Parameters:
        member_id (int): รหัสประจำตัวสมาชิกผู้รับการแจ้งเตือน
        title (str): หัวข้อของการแจ้งเตือน
        message (str): เนื้อหาข้อความแจ้งเตือน
        link (str): ลิงก์ปลายทาง (ค่าเริ่มต้นคือ '/notifications')
        
    Returns:
        bool: คืนค่า True หากสำเร็จ หรือ False หากเกิดข้อผิดพลาด
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. ค้นหาข้อมูลผู้รับจากตาราง member
        cursor.execute("SELECT Email, DisplayName FROM member WHERE MemberID = %s", (member_id,))
        user = cursor.fetchone()

        # 2. บันทึกข้อมูลการแจ้งเตือนลงในตาราง notification สำหรับแสดงผลในระบบ
        sql_notif = """
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
            VALUES (%s, %s, %s, 0, NOW())
        """
        cursor.execute(sql_notif, (member_id, message, link))
        conn.commit()

        # 3. ส่ง Email แบบ Background Thread เพื่อไม่ให้บล็อกการตอบกลับของ API
        if user and user.get('Email'):
            email_body = f"""สวัสดีครับคุณ {user.get('DisplayName', 'ผู้ใช้งาน')},

{message}

ท่านสามารถเข้าตรวจสอบรายละเอียดเพิ่มเติมได้ที่เว็บไซต์ Tradin

ขอบคุณที่ใช้บริการ Tradin สังคมแห่งการแบ่งปัน
"""
            thread = threading.Thread(
                target=send_notification_email,
                args=(user['Email'], f"[Tradin] {title}", email_body)
            )
            thread.start()

        return True
        
    except Exception as e:
        print(f"❌ ระบบแจ้งเตือนขัดข้อง: {str(e)}")
        if conn: 
            conn.rollback()
        return False
        
    finally:
        if cursor: 
            cursor.close()
        if conn: 
            conn.close()