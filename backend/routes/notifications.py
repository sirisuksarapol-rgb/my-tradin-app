from flask import Blueprint, request, jsonify
from db import get_connection

# ==========================================
# NOTIFICATIONS BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับการแจ้งเตือนระบบ (Notifications)
notifications_bp = Blueprint('notifications', __name__)


# =========================================================================
# 1. API: ดึงรายการแจ้งเตือนทั้งหมดของสมาชิก (GET /api/notifications)
# =========================================================================
@notifications_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """
    API Endpoint: GET /api/notifications
    คำอธิบาย: ดึงประวัติและรายการแจ้งเตือนทั้งหมดของสมาชิกแต่ละราย
    
    รายละเอียดการทำงาน:
    - รับค่า member_id ผ่าน Query Parameter เพื่อระบุตัวตนผู้ใช้
    - ตรวจสอบความถูกต้องว่ามีการระบุ member_id มาหรือไม่ หากไม่มีจะคืนค่าสถานะ 400
    - เชื่อมต่อฐานข้อมูลและดึงข้อมูลจากตาราง notification เรียงตามวันที่สร้างล่าสุด (CreateDate DESC)
    - แปลงรูปแบบวันที่ (CreateDate) ให้เป็นสตริงมาตรฐาน (YYYY-MM-DD HH:MM:SS) เพื่อให้ฝั่ง Frontend นำไปใช้งานง่าย
    - คืนค่าผลลัพธ์ข้อมูลแจ้งเตือนทั้งหมดในรูปแบบ JSON พร้อมรหัสสถานะ 200 หรือ 500 หากเกิดข้อผิดพลาด
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ดึงข้อมูลการแจ้งเตือนทั้งหมดของสมาชิก เรียงจากใหม่ไปเก่า
        sql = "SELECT * FROM notification WHERE MemberID = %s ORDER BY CreateDate DESC"
        cursor.execute(sql, (member_id,))
        notifications = cursor.fetchall()
        
        # แปลงวัตถุวันที่/เวลาให้เป็นข้อความรูปแบบมาตรฐาน
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
    
    รายละเอียดการทำงาน:
    - รับค่า member_id ผ่าน Query Parameter
    - ตรวจสอบความถูกต้องของ member_id
    - ค้นหาและนับจำนวนแถวในตาราง notification ที่ตรงกับเงื่อนไข IsRead = 0
    - คืนค่าตัวเลขจำนวนที่ยังไม่ได้อ่านกลับไป
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # นับจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (IsRead = 0)
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


# =========================================================================
# 3. API: อัปเดตสถานะแจ้งเตือนเฉพาะรายการเป็น "อ่านแล้ว" (PUT /api/notifications/<id>/read)
# =========================================================================
@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """
    API Endpoint: PUT /api/notifications/<int:notification_id>/read
    คำอธิบาย: เปลี่ยนสถานะการแจ้งเตือนเฉพาะรายการให้เป็น "อ่านแล้ว" (IsRead = 1)
    
    รายละเอียดการทำงาน:
    - รับรหัสการแจ้งเตือน (notification_id) ผ่าน URL Path Parameter
    - อัปเดตค่าคอลัมน์ IsRead เป็น 1 ในตาราง notification ตามรหัสที่กำหนด
    - ทำการ commit ฐานข้อมูลและคืนค่าสถานะความสำเร็จ
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # อัปเดตสถานะการอ่านเป็น 1 (อ่านแล้ว)
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


# =========================================================================
# 4. ฟังก์ชันเสริม (HELPER FUNCTION): บันทึกการแจ้งเตือนใหม่ลงฐานข้อมูล
# =========================================================================
def send_notification(member_id, message_json_or_text, link):
    """
    ฟังก์ชันตัวช่วย (Helper Function): สำหรับสร้างและบันทึกข้อความแจ้งเตือนใหม่ให้กับสมาชิก
    
    รายละเอียดการทำงาน:
    - รับค่า member_id, ข้อความแจ้งเตือน (message_json_or_text) และลิงก์ปลายทาง (link)
    - ทำการ INSERT ข้อมูลลงในตาราง notification โดยกำหนดค่าเริ่มต้น IsRead = 0 (ยังไม่ได้อ่าน)
    - บันทึกเวลาปัจจุบันด้วยฟังก์ชัน NOW()
    - คืนค่า True หากสำเร็จ หรือ False หากเกิดข้อผิดพลาดในการทำงาน
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
        

# =========================================================================
# 5. API: อัปเดตสถานะแจ้งเตือนทั้งหมดของสมาชิกเป็น "อ่านแล้ว" (PUT /api/notifications/read-all)
# =========================================================================
@notifications_bp.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_as_read():
    """
    API Endpoint: PUT /api/notifications/read-all
    คำอธิบาย: เปลี่ยนสถานะการแจ้งเตือนทุกรายการที่ยังไม่ได้อ่านของสมาชิกให้เป็น "อ่านแล้ว" ทีเดียวทั้งหมด
    
    รายละเอียดการทำงาน:
    - รับข้อมูล member_id ผ่าน JSON Request Body
    - ตรวจสอบความถูกต้องว่ามีการระบุ member_id มาหรือไม่
    - อัปเดตค่า IsRead เป็น 1 สำหรับทุกแถวที่เป็นของสมาชิกคนนั้นและยังมีสถานะ IsRead = 0
    - ทำการ commit ฐานข้อมูลและส่งผลลัพธ์ความสำเร็จกลับไป
    """
    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        # อัปเดตการแจ้งเตือนทั้งหมดที่ยังไม่ได้อ่านของสมาชิกคนนี้ให้เป็นอ่านแล้ว
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