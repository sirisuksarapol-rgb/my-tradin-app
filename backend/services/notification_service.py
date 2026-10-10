import threading

from db import get_connection
from services.email_service import send_notification_email


def notify_user(member_id, title, message, link="/notifications"):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT Email, DisplayName FROM member WHERE MemberID = %s",
            (member_id,)
        )
        user = cursor.fetchone()

        cursor.execute(
            """
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
            VALUES (%s, %s, %s, 0, NOW())
            """,
            (member_id, message, link)
        )
        conn.commit()

        if user and user.get("Email"):
            email_body = f"""สวัสดีครับคุณ {user.get("DisplayName", "ผู้ใช้งาน")},

{message}

ท่านสามารถเข้าตรวจสอบรายละเอียดเพิ่มเติมได้ที่เว็บไซต์ Tradin

ขอบคุณที่ใช้บริการ Tradin สังคมแห่งการแบ่งปัน
"""

            threading.Thread(
                target=send_notification_email,
                args=(user["Email"], f"[Tradin] {title}", email_body)
            ).start()

        return True

    except Exception as e:
        if conn:
            conn.rollback()

        print(f"❌ ระบบแจ้งเตือนขัดข้อง: {str(e)}")
        return False

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()