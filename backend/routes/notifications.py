from flask import Blueprint, request, jsonify
from db import get_connection

# ==========================================
# NOTIFICATIONS BLUEPRINT CONFIGURATION
# ==========================================
notifications_bp = Blueprint('notifications', __name__)


# =========================================================================
# 1. API: ดึงรายการแจ้งเตือนทั้งหมดของสมาชิก (GET /api/notifications)
# =========================================================================
@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """
    API Endpoint: GET /api/notifications
    คำอธิบาย: ดึงประวัติและรายการแจ้งเตือนทั้งหมดของสมาชิกแต่ละราย
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ใช้คอลัมน์ตัวพิมพ์เล็กใน SQL แต่ใช้ AS เพื่อคงคีย์พิมพ์ใหญ่-เล็กส่งกลับให้ Frontend
        sql = """
            SELECT 
                notificationid AS "NotificationID", 
                memberid AS "MemberID", 
                message AS "Message", 
                link AS "Link", 
                isread AS "IsRead", 
                createdate AS "CreateDate" 
            FROM notification 
            WHERE memberid = %s 
            ORDER BY createdate DESC
        """
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


# =========================================================================
# 2. API: นับจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (GET /api/notifications/unread-count)
# =========================================================================
@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_notification_count():
    """
    API Endpoint: GET /api/notifications/unread-count
    คำอธิบาย: นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน (IsRead = 0) ของผู้ใช้งาน เพื่อแสดงผล Badge บน UI
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ใช้ AS "unreadCount" เพื่อคงชื่อคีย์เดิมที่ Frontend ดึงค่าไปใช้
        sql = 'SELECT COUNT(*) AS "unreadCount" FROM notification WHERE memberid = %s AND isread = 0'
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


# =========================================================================
# 3. API: อัปเดตสถานะแจ้งเตือนเฉพาะรายการเป็น "อ่านแล้ว" (PUT /api/notifications/<id>/read)
# =========================================================================
@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """
    API Endpoint: PUT /api/notifications/<int:notification_id>/read
    คำอธิบาย: เปลี่ยนสถานะการแจ้งเตือนเฉพาะรายการให้เป็น "อ่านแล้ว" (IsRead = 1)
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        sql = "UPDATE notification SET isread = 1 WHERE notificationid = %s"
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


# =========================================================================
# 4. ฟังก์ชันเสริม (HELPER FUNCTION): บันทึกการแจ้งเตือนใหม่ลงฐานข้อมูล
# =========================================================================
def send_notification(member_id, message_json_or_text, link):
    """
    ฟังก์ชันตัวช่วย (Helper Function): สำหรับสร้างและบันทึกข้อความแจ้งเตือนใหม่ให้กับสมาชิก
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        sql = """
            INSERT INTO notification (memberid, message, link, isread, createdate) 
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
        

# =========================================================================
# 5. API: อัปเดตสถานะแจ้งเตือนทั้งหมดของสมาชิกเป็น "อ่านแล้ว" (PUT /api/notifications/read-all)
# =========================================================================
@notifications_bp.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_as_read():
    """
    API Endpoint: PUT /api/notifications/read-all
    คำอธิบาย: เปลี่ยนสถานะการแจ้งเตือนทุกรายการที่ยังไม่ได้อ่านของสมาชิกให้เป็น "อ่านแล้ว" ทีเดียวทั้งหมด
    """
    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        sql = "UPDATE notification SET isread = 1 WHERE memberid = %s AND isread = 0"
        cursor.execute(sql, (member_id,))
        conn.commit()
        return jsonify({"success": True, "message": "อ่านการแจ้งเตือนทั้งหมดแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()