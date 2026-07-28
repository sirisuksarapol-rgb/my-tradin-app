from flask import Blueprint, request, jsonify
from db import get_connection

notifications_bp = Blueprint('notifications', __name__)

# ========================================================
# 1. API: ดึงรายการแจ้งเตือนทั้งหมดของสมาชิกคนนั้น (GET) - ปลอดภัย ไม่พังชัวร์
# ========================================================
@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ใช้ SQL ดั้งเดิมที่ไม่มีการ LEFT JOIN เพื่อตัดปัญหา Error
        sql = "SELECT * FROM notification WHERE MemberID = %s ORDER BY CreateDate DESC"
        cursor.execute(sql, (member_id,))
        notifications = cursor.fetchall()
        
        for n in notifications:
            if n.get('CreateDate'):
                n['CreateDate'] = n['CreateDate'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({
            "success": True,
            "data": notifications
        }), 200
    except Exception as e:
        print(f"❌ Error fetching notifications: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ========================================================
# 2. API: นับจำนวนแจ้งเตือนที่ "ยังไม่ได้อ่าน" ไปแสดงบนตัวเลขกระดิ่ง (GET)
# ========================================================
@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_notification_count():
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        sql = "SELECT COUNT(*) as unreadCount FROM notification WHERE MemberID = %s AND IsRead = 0"
        cursor.execute(sql, (member_id,))
        result = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "count": result['unreadCount'] if result else 0
        }), 200
    except Exception as e:
        print(f"❌ Error counting unread notifications: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ========================================================
# 3. API: อัปเดตสถานะแจ้งเตือนชิ้นนั้นๆ เป็น "อ่านแล้ว" (PUT)
# ========================================================
@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        sql = "UPDATE notification SET IsRead = 1 WHERE NotificationID = %s"
        cursor.execute(sql, (notification_id,))
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "อัปเดตสถานะการอ่านเรียบร้อยแล้ว"
        }), 200
    except Exception as e:
        conn.rollback()
        print(f"❌ Error updating notification status: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

def send_notification(member_id, message_json_or_text, link):
    """
    ฟังก์ชันสำหรับบันทึกการแจ้งเตือนลงตาราง notification
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate) 
            VALUES (%s, %s, %s, 0, NOW())
        """
        cursor.execute(sql, (member_id, message_json_or_text, link))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to send notification: {str(e)}")
        return False
    finally:
        cursor.close()
        conn.close()
        
@notifications_bp.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_as_read():
    member_id = request.json.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        sql = "UPDATE notification SET IsRead = 1 WHERE MemberID = %s AND IsRead = 0"
        cursor.execute(sql, (member_id,))
        conn.commit()
        return jsonify({"success": True, "message": "อ่านการแจ้งเตือนทั้งหมดแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()