from flask import Blueprint, request, jsonify
from db import get_connection

notifications_bp = Blueprint('notifications', __name__)

# ========================================================
# 1. API: ดึงรายการแจ้งเตือนทั้งหมด พร้อมข้อมูลการเสนอแลกเปลี่ยน (GET)
# ========================================================
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
        # 💡 ถอยกลับมาใช้คำสั่ง SQL ดั้งเดิมที่ไม่มีการ LEFT JOIN เพื่อตัดปัญหาชื่อคอลัมน์ไม่ตรงในตารางอื่น
        sql = "SELECT * FROM notification WHERE MemberID = %s ORDER BY CreateDate DESC"
        cursor.execute(sql, (member_id,))
        notifications = cursor.fetchall()
        
        # แปลงข้อมูลประเภท Datetime เป็น String ป้องกันปัญหา JSON Serialize Error
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

# ส่วนของ API unread-count และ mark_notification_as_read คงเดิมไว้ได้เลยครับ...
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 💡 ปรับ SQL คิวรีใหม่ให้ทำการ LEFT JOIN ดึงข้อมูลคนเสนอ, ไอเทมเขา และไอเทมเรามาด้วย
        # โดยการดึงเลข ID จากฟังก์ชัน SUBSTRING_INDEX เพื่อสกัดเอาเลขที่ต่อท้าย ลิงก์ "/matching/ID"
        sql = """
            SELECT 
                n.*,
                m.DisplayName AS SenderName,
                sender_item.ItemName AS SenderItemName,
                my_item.ItemName AS MyItemName
            FROM notification n
            -- 1. ลิงก์เข้าสู่ตารางแลกเปลี่ยน (แกะเอา ID ออกมาจากข้อความลิงก์ เช่น /matching/5)
            LEFT JOIN exchange e ON (
                n.Link LIKE '/matching/%' 
                AND SUBSTRING_INDEX(n.Link, '/', -1) REGEXP '^[0-9]+$'
                AND CAST(SUBSTRING_INDEX(n.Link, '/', -1) AS UNSIGNED) = e.ExchangeID
            )
            -- 2. ดึงข้อมูลสมาชิกที่เป็นฝ่ายเสนอเข้ามา (Sender)
            LEFT JOIN member m ON e.SenderID = m.MemberID
            -- 3. ดึงชื่อไอเทมของฝ่ายที่เสนอเข้ามา
            LEFT JOIN item sender_item ON e.SenderItemID = sender_item.ItemID
            -- 4. ดึงชื่อไอเทมของตัวเราเองที่เขาอยากได้
            LEFT JOIN item my_item ON e.ReceiverItemID = my_item.ItemID
            WHERE n.MemberID = %s 
            ORDER BY n.CreateDate DESC
        """
        
        cursor.execute(sql, (member_id,))
        notifications = cursor.fetchall()
        
        # แปลงข้อมูลประเภท Datetime เป็น String ป้องกันปัญหา JSON Serialize Error
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