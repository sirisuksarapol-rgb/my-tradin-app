from flask import Blueprint, request, jsonify, current_app
from db import get_connection

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """ดึงประวัติและรายการแจ้งเตือนทั้งหมดของสมาชิกแต่ละราย"""
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM notification WHERE MemberID = %s ORDER BY CreateDate DESC", (member_id,))
        notifications = cursor.fetchall()
        
        for n in notifications:
            if n.get('CreateDate'):
                n['CreateDate'] = n['CreateDate'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({"success": True, "data": notifications}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_notification_count():
    """นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน (IsRead = 0) ของผู้ใช้งาน"""
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT COUNT(*) as unreadCount FROM notification WHERE MemberID = %s AND IsRead = 0", (member_id,))
        result = cursor.fetchone()
        
        return jsonify({"success": True, "count": result['unreadCount'] if result else 0}), 200
    except Exception as e:
        current_app.logger.error(f"Error counting unread notifications: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการนับจำนวนการแจ้งเตือน"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """เปลี่ยนสถานะการแจ้งเตือนเฉพาะรายการให้เป็น อ่านแล้ว (IsRead = 1)"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE notification SET IsRead = 1 WHERE NotificationID = %s", (notification_id,))
        conn.commit()
        
        return jsonify({"success": True, "message": "อัปเดตสถานะการอ่านเรียบร้อยแล้ว"}), 200
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error updating notification status: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


def send_notification(member_id, message_json_or_text, link):
    """สร้างและบันทึกข้อความแจ้งเตือนใหม่ให้กับสมาชิก"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate) 
            VALUES (%s, %s, %s, 0, NOW())
        """, (member_id, message_json_or_text, link))
        conn.commit()
        return True
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Failed to send notification: {str(e)}")
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@notifications_bp.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_as_read():
    """เปลี่ยนสถานะการแจ้งเตือนทุกรายการที่ยังไม่ได้อ่านของสมาชิกให้เป็น อ่านแล้ว ทั้งหมด"""
    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE notification SET IsRead = 1 WHERE MemberID = %s AND IsRead = 0", (member_id,))
        conn.commit()
        return jsonify({"success": True, "message": "อ่านการแจ้งเตือนทั้งหมดแล้ว"}), 200
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการอัปเดตสถานะ"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()