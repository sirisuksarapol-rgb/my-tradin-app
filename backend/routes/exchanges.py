import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db import get_connection
from services.notification_service import notify_user
from services.email_service import send_exchange_verify_email

# ==========================================
# EXCHANGES BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับการแลกเปลี่ยนสิ่งของ ระบบแจ้งเตือน และข้อมูลสถิติผู้ใช้งาน
exchanges_bp = Blueprint('exchanges', __name__)


# ==========================================
# 1. API: ดึงรายการการแลกเปลี่ยนทั้งหมด (GET)
# ==========================================
@exchanges_bp.route('/api/exchanges', methods=['GET'])
def get_exchanges():
    """
    API Endpoint: GET /api/exchanges
    คำอธิบาย: ดึงรายการประวัติและสถานะการแลกเปลี่ยนสิ่งของทั้งหมดของผู้ใช้งาน พร้อมสลับมุมมองข้อมูลฝั่งคู่สนทนาอัตโนมัติ
    
    รายละเอียดการทำงาน:
    - รับค่า member_id หรือ target_member_id ผ่าน Query Parameters เพื่อระบุตัวตนผู้ใช้งานปัจจุบัน
    - ตรวจสอบความถูกต้องว่ามีการระบุรหัสผู้ใช้งานมาหรือไม่ หากไม่มีจะคืนค่า Error 400
    - เชื่อมโยงข้อมูลตาราง exchange, item และ member เข้าด้วยกันผ่าน SQL แบบเงื่อนไข (CASE WHEN) 
      เพื่อให้สามารถแสดงข้อมูลฝั่งผู้ส่ง (Requester) หรือผู้รับ (Target) ได้อย่างถูกต้องตามมุมมองของผู้ใช้งานที่เรียกดู
    - จัดรูปแบบวันที่และตรวจสอบความสมบูรณ์ของรูปภาพและข้อมูลก่อนส่งผลลัพธ์กลับในรูปแบบ JSON
    """
    member_id = request.args.get('member_id') 
    target_member_id = request.args.get('target_member_id')
    current_user_id = member_id or target_member_id
    
    if not current_user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id หรือ target_member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    
    try:
        # กำหนดเงื่อนไข WHERE และจำนวนพารามิเตอร์ตามประเภทการค้นหา
        if target_member_id and not member_id:
            where_clause = "WHERE e.TargetMemberID = %s"
            query_params = (current_user_id,) * 12
        else:
            where_clause = "WHERE e.MemberID = %s OR e.TargetMemberID = %s"
            query_params = (current_user_id,) * 13

        # SQL Query สำหรับดึงรายละเอียดการแลกเปลี่ยนพร้อมสลับมุมมองข้อมูลฝั่งคู่สนทนาอัตโนมัติ
        sql = f"""
            SELECT 
                e.ExchangeID, e.ExchangeStatus, e.ExchangeLocation, 
                e.Score, IFNULL(e.MatchScore, 0) AS MatchScore, e.ExchangeType, e.MemberID, e.TargetMemberID,
                e.MyItemID, e.TargetItemID, e.PhoneNumber, e.TargetPhoneNumber,
                e.StartDate, e.SuccessDate, e.CancelDate, e.CancelReason,
                e.IsMemberVerified, e.IsTargetMemberVerified,  
                e.IsMemberReceived, e.IsTargetMemberReceived,
                e.PartnerScore, e.PartnerComment, e.Comment,
                
                CASE WHEN e.MemberID = %s THEN IFNULL(e.TargetPhoneNumber, 'รออีกฝ่ายระบุเบอร์') ELSE IFNULL(e.PhoneNumber, 'รออีกฝ่ายระบุเบอร์') END AS partnerPhone,
                CASE WHEN e.MemberID = %s THEN IFNULL(my_item.ItemImage, '') ELSE IFNULL(their_item.ItemImage, '') END AS myPostImage,
                CASE WHEN e.MemberID = %s THEN IFNULL(their_item.ItemImage, '') ELSE IFNULL(my_item.ItemImage, '') END AS theirPostImage,
                CASE WHEN e.MemberID = %s THEN IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ') ELSE IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ') END AS myPostTitle,
                CASE WHEN e.MemberID = %s THEN IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ') ELSE IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ') END AS theirPostTitle,
                IFNULL(CASE WHEN e.MemberID = %s THEN target_member.DisplayName ELSE requester_member.DisplayName END, 'ผู้ใช้งานระบบ') AS theirAuthorName,
                CASE WHEN e.MemberID = %s THEN target_member.ProfileImage ELSE requester_member.ProfileImage END AS theirProfileImage,
                CASE WHEN e.MemberID = %s THEN IFNULL(my_item.ItemDescription, '') ELSE IFNULL(their_item.ItemDescription, '') END AS myPostDescription,
                CASE WHEN e.MemberID = %s THEN IFNULL(their_item.ItemDescription, '') ELSE IFNULL(my_item.ItemDescription, '') END AS theirPostDescription,
                CASE WHEN e.MemberID = %s THEN IFNULL(my_item.MeetingLocation, '') ELSE IFNULL(their_item.MeetingLocation, '') END AS myMeetingLocation,
                CASE WHEN e.MemberID = %s THEN IFNULL(their_item.MeetingLocation, '') ELSE IFNULL(my_item.MeetingLocation, '') END AS theirMeetingLocation

            FROM exchange e
            LEFT JOIN item my_item ON e.MyItemID = my_item.ItemID
            LEFT JOIN item their_item ON e.TargetItemID = their_item.ItemID
            LEFT JOIN member requester_member ON e.MemberID = requester_member.MemberID
            LEFT JOIN member target_member ON e.TargetMemberID = target_member.MemberID
            {where_clause}
            ORDER BY e.ExchangeID DESC
        """
        
        cursor.execute(sql, query_params)
        exchanges = cursor.fetchall()
        
        # จัดรูปแบบข้อมูลผลลัพธ์ (แปลง Date เป็น String และปรับโครงสร้างไอดีสิ่งของตามมุมมองผู้ใช้)
        for ex in exchanges:
            if ex.get('StartDate'):
                ex['StartDate'] = ex['StartDate'].strftime('%Y-%m-%d %H:%M:%S')

            if str(ex['MemberID']) == str(current_user_id):
                ex['myItemID'] = ex['MyItemID']
                ex['theirItemID'] = ex['TargetItemID']
            else:
                ex['myItemID'] = ex['TargetItemID']
                ex['theirItemID'] = ex['MyItemID']
                
            if ex.get('myPostImage') in [None, 'null', 'undefined', 'None']:
                ex['myPostImage'] = ''
            if ex.get('theirPostImage') in [None, 'null', 'undefined', 'None']:
                ex['theirPostImage'] = ''
        
        return jsonify({"success": True, "data": exchanges}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 2. API: สร้างคำขอแลกเปลี่ยนใหม่ (POST)
# ==========================================
@exchanges_bp.route('/api/exchanges', methods=['POST'])
def create_exchange():
    """
    API Endpoint: POST /api/exchanges
    คำอธิบาย: สร้างคำเสนอขอแลกเปลี่ยนสิ่งของชิ้นใหม่ระหว่างผู้ใช้งานสองฝ่าย
    
    รายละเอียดการทำงาน:
    - รับค่าข้อมูลผ่าน JSON Body (member_id, target_member_id, my_item_id, their_item_id, location, phone_number, match_score)
    - ตรวจสอบความครบถ้วนของข้อมูลสำคัญ หากไม่ครบจะคืนค่า Error 400
    - แปลงข้อมูล ID และ Score ให้เป็นรูปแบบตัวเลข 
    - บันทึกข้อมูลคำขอลงในตาราง exchange ด้วยสถานะเริ่มต้นเป็น 'pending' พร้อมบันทึกคะแนนความเหมาะสม (MatchScore)
    - ดึงชื่อผู้ส่งและชื่อสิ่งของของทั้งสองฝ่ายเพื่อนำไปสร้างข้อความแจ้งเตือนที่ชัดเจน
    - เรียกใช้งานฟังก์ชัน `notify_user` เพื่อส่งการแจ้งเตือนไปยังผู้รับ (Target Member) ทันที
    """
    data = request.json or {}
    member_id = data.get('member_id')
    target_member_id = data.get('target_member_id')
    my_item_id = data.get('my_item_id')
    their_item_id = data.get('their_item_id')
    location = data.get('location') or 'นัดเจอตามตกลง'
    phone_number = data.get('phone_number') or ''
    match_score = data.get('match_score', 0) # 👈 รับค่า match_score จาก Frontend (ถ้าไม่มีให้เป็น 0)

    if not all([member_id, target_member_id, my_item_id, their_item_id]):
        return jsonify({"success": False, "message": "ข้อมูลไม่ครบถ้วน"}), 400

    try:
        member_id = int(member_id)
        target_member_id = int(target_member_id)
        my_item_id = int(my_item_id)
        their_item_id = int(their_item_id)
        match_score = float(match_score) # 👈 แปลงค่าเป็นตัวเลขทศนิยม
    except (ValueError, TypeError) as e:
        return jsonify({"success": False, "message": f"รูปแบบข้อมูลไม่ถูกต้อง: {str(e)}"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    exchange_type = data.get('exchange_type', 'manual') # รับค่า ถ้าไม่มีให้ default เป็น manual
    try:
        # 👈 แก้ไขคำสั่ง SQL เพื่อบันทึก MatchScore ลงฐานข้อมูล
        sql_exchange = """
    INSERT INTO exchange (
        ExchangeLocation, ExchangeStatus, MemberID, TargetMemberID, 
        MyItemID, TargetItemID, PhoneNumber, StartDate, MatchScore, ExchangeType
    )
    VALUES (%s, 'pending', %s, %s, %s, %s, %s, NOW(), %s, %s) 
"""
        # 👈 เพิ่มตัวแปร match_score ต่อท้ายในข้อมูลที่จะ Execute
        cursor.execute(sql_exchange, (location, member_id, target_member_id, my_item_id, their_item_id, phone_number, match_score, exchange_type))
        exchange_id = cursor.lastrowid

        # ดึงข้อมูลชื่อผู้ส่งและชื่อสิ่งของสำหรับใส่ในข้อความแจ้งเตือน
        sender_name, sender_item_name, receiver_item_name = "ผู้ใช้งานระบบ", "สิ่งของชิ้นใหม่", "สิ่งของของคุณ"
        cursor.execute("SELECT DisplayName FROM member WHERE MemberID = %s", (member_id,))
        m_res = cursor.fetchone()
        if m_res: sender_name = m_res['DisplayName']
        
        cursor.execute("SELECT ItemName FROM item WHERE ItemID = %s", (my_item_id,))
        i_res1 = cursor.fetchone()
        if i_res1: sender_item_name = i_res1['ItemName']
        
        cursor.execute("SELECT ItemName FROM item WHERE ItemID = %s", (their_item_id,))
        i_res2 = cursor.fetchone()
        if i_res2: receiver_item_name = i_res2['ItemName']

        conn.commit()

        # ส่งการแจ้งเตือนไปยังผู้รับ (Target Member) ว่ามีคำขอใหม่เข้ามา
        msg = f"คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก {sender_name} ต้องการแลก {sender_item_name} กับ {receiver_item_name}"
        notify_user(
            member_id=target_member_id,
            title="มีคำขอแลกเปลี่ยนใหม่เข้ามา!",
            message=msg,
            link=f"/incoming-requests?id={exchange_id}"
        )

        return jsonify({"success": True, "message": "ส่งคำขอแลกเปลี่ยนสำเร็จเรียบร้อยแล้ว!"}), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"ฐานข้อมูลขัดข้อง: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 3. API: ตอบรับ หรือ ปฏิเสธการแลกเปลี่ยน (PUT)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:exchange_id>', methods=['PUT'])
def update_exchange_status(exchange_id):
    """
    API Endpoint: PUT /api/exchanges/<exchange_id>
    คำอธิบาย: ตอบรับ (Accept) หรือ ปฏิเสธ (Reject) คำขอแลกเปลี่ยนสิ่งของจากผู้ใช้งานปลายทาง
    
    รายละเอียดการทำงาน:
    - รับค่า action ('accept' หรือ 'reject') และเบอร์โทรศัพท์ผ่าน JSON Body
    - ตรวจสอบความถูกต้องของ Action หากไม่ถูกต้องจะคืนค่า Error 400
    - ค้นหาข้อมูลรายการแลกเปลี่ยนตาม ExchangeID ในระบบ
    - กรณี 'accept': บันทึกสถานะเป็น 'accepted', บันทึกเวลา SuccessDate และบันทึกเบอร์โทรศัพท์ของผู้รับ (TargetPhoneNumber) พร้อมส่งแจ้งเตือนไปยังผู้ริเริ่มคำขอ (MemberID)
    - กรณี 'reject': เปลี่ยนสถานะเป็น 'rejected' และบันทึกเวลา CancelDate พร้อมส่งแจ้งเตือนการปฏิเสธคำขอ
    """
    data = request.json or {}
    action = data.get('action') 
    phone_number = data.get('phone_number')
    
    if action not in ['accept', 'reject']:
        return jsonify({"success": False, "message": "Action ไม่ถูกต้อง"}), 400
        
    new_status = 'accepted' if action == 'accept' else 'rejected'
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM exchange WHERE ExchangeID = %s", (exchange_id,))
        exchange = cursor.fetchone()
        if not exchange:
            return jsonify({"success": False, "message": "ไม่พบรายการแลกเปลี่ยนนี้"}), 404
            
        if new_status == 'accepted':
            if not phone_number:
                return jsonify({"success": False, "message": "กรุณาระบุเบอร์โทรศัพท์เพื่อยืนยัน"}), 400
            
            # 1. อัปเดตสถานะเป็นยอมรับการแลกเปลี่ยนสำหรับรายการปัจจุบัน
            sql_update = "UPDATE exchange SET ExchangeStatus = %s, SuccessDate = NOW(), TargetPhoneNumber = %s WHERE ExchangeID = %s"
            cursor.execute(sql_update, (new_status, phone_number, exchange_id))

            # =========================================================
            # 1. SELECT ก่อนเพื่อดูว่ามีใครใช้ไอเทมนี้บ้าง
            # =========================================================
            cursor.execute("""
                SELECT ExchangeID, MemberID, TargetMemberID FROM exchange 
                WHERE ExchangeID != %s
                  AND ExchangeStatus = 'pending'
                  AND (MyItemID IN (%s, %s) OR TargetItemID IN (%s, %s))
            """, (exchange_id, exchange['MyItemID'], exchange['TargetItemID'], exchange['MyItemID'], exchange['TargetItemID']))
            competing_requests = cursor.fetchall()

            # 2. ค่อย UPDATE คำขออื่นๆ ให้เป็น auto_cancelled
            if competing_requests:
                cursor.execute("""
                    UPDATE exchange 
                    SET ExchangeStatus = 'auto_cancelled', 
                        CancelDate = NOW(), 
                        CancelReason = 'สินค้าชิ้นนี้ถูกตอบรับการแลกเปลี่ยนในรายการอื่นไปแล้ว'
                    WHERE ExchangeID != %s
                      AND ExchangeStatus = 'pending'
                      AND (MyItemID IN (%s, %s) OR TargetItemID IN (%s, %s))
                """, (exchange_id, exchange['MyItemID'], exchange['TargetItemID'], exchange['MyItemID'], exchange['TargetItemID']))

            conn.commit()

            # แจ้งเตือนผู้ส่งคำขอเดิมที่ได้รับการตอบรับ
            notify_user(
                member_id=exchange['MemberID'],
                title="คำขอแลกเปลี่ยนได้รับการตอบรับ!",
                message="คำขอแลกเปลี่ยนของคุณได้รับการ 'ตอบรับ' แล้ว! 🎉 กรุณาเข้าสู่ระบบเพื่อยืนยันตัวตนแลกเปลี่ยนข้อมูลติดต่อ",
            )

            # 3. แจ้งเตือนผู้ใช้งานรายอื่นทั้ง 2 ฝ่าย ที่คำขอถูกยกเลิกอัตโนมัติ
            for comp in competing_requests:
                cancel_msg = "คำขอแลกเปลี่ยนถูกยกเลิกอัตโนมัติ เนื่องจากสินค้าดังกล่าวถูกตอบรับการแลกเปลี่ยนในรายการอื่นไปแล้ว"
                notify_user(member_id=comp['MemberID'], title="คำขอแลกเปลี่ยนถูกยกเลิก ❌", message=cancel_msg)
                notify_user(member_id=comp['TargetMemberID'], title="คำขอแลกเปลี่ยนถูกยกเลิก ❌", message=cancel_msg)
        
        else:
            # =========================================================
            # ส่วนของการปฏิเสธ (Reject)
            # =========================================================
            sql_update = "UPDATE exchange SET ExchangeStatus = %s, CancelDate = NOW() WHERE ExchangeID = %s"
            cursor.execute(sql_update, (new_status, exchange_id))
            conn.commit()

            # แจ้งเตือนผู้ส่งคำขอเดิมว่าถูกปฏิเสธ
            notify_user(
                member_id=exchange['MemberID'],
                title="คำขอแลกเปลี่ยนถูกปฏิเสธ",
                message="คำขอแลกเปลี่ยนของคุณถูก 'ปฏิเสธ' แล้ว ❌",
            )

        return jsonify({"success": True, "message": f"ทำการ {action} คำขอเรียบร้อยแล้ว"}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 4. API: ยกเลิกการแลกเปลี่ยน (PUT)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:exchange_id>/cancel', methods=['PUT'])
def cancel_exchange(exchange_id):
    """
    API Endpoint: PUT /api/exchanges/<exchange_id>/cancel
    คำอธิบาย: ยกเลิกรายการแลกเปลี่ยนที่กำลังดำเนินการอยู่
    
    รายละเอียดการทำงาน:
    - รับข้อมูลเหตุผล (reason) และรหัสผู้ใช้งาน (user_id) ผ่าน JSON Body
    - ค้นหาข้อมูลรายการแลกเปลี่ยนเพื่อระบุตัวตนคู่สนทนา
    - อัปเดตสถานะในตาราง exchange เป็น 'failed', บันทึกเวลา CancelDate และบันทึกเหตุผลการยกเลิก (CancelReason)
    - ส่งการแจ้งเตือนไปยังคู่แลกเปลี่ยน (Partner) ทันทีว่ารายการถูกยกเลิกพร้อมระบุเหตุผล
    """
    data = request.json or {}
    reason = data.get('reason', 'ไม่ระบุเหตุผล')
    user_id = data.get('user_id')

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT MemberID, TargetMemberID FROM exchange WHERE ExchangeID = %s", (exchange_id,))
        ex_data = cursor.fetchone()

        # อัปเดตสถานะเป็นล้มเหลว/ยกเลิก
        sql = "UPDATE exchange SET ExchangeStatus = 'failed', CancelDate = NOW(), CancelReason = %s WHERE ExchangeID = %s"
        cursor.execute(sql, (reason, exchange_id))
        conn.commit()

        # ส่งการแจ้งเตือนไปยังคู่แลกเปลี่ยนอีกฝ่าย
        if ex_data and user_id:
            partner_id = ex_data['TargetMemberID'] if str(user_id) == str(ex_data['MemberID']) else ex_data['MemberID']
            notify_user(
                member_id=partner_id,
                title="รายการแลกเปลี่ยนถูกยกเลิก",
                message=f"รายการแลกเปลี่ยนรหัส ถูกยกเลิกแล้ว เหตุผล: {reason}",
            )

        return jsonify({"success": True, "message": "ยกเลิกการแลกเปลี่ยนสำเร็จ"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 5. API: ยืนยันได้รับสิ่งของ (PUT)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:exchange_id>/complete', methods=['PUT'])
def complete_exchange(exchange_id):
    data = request.json or {}
    score = data.get('score')
    comment = data.get('comment', '')
    user_id = data.get('user_id') 

    if not user_id:
        return jsonify({"success": False, "message": "ไม่พบข้อมูลผู้ใช้งาน (กรุณาแนบ user_id)"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT MemberID, TargetMemberID, IsMemberReceived, IsTargetMemberReceived, MyItemID, TargetItemID FROM exchange WHERE ExchangeID = %s", (exchange_id,))
        ex_data = cursor.fetchone()
        if not ex_data:
            return jsonify({"success": False, "message": "ไม่พบรายการแลกเปลี่ยนนี้"}), 404
            
        # ตรวจสอบสิทธิ์และอัปเดตสถานะการรับของฝั่งที่กดเข้ามา
        if int(user_id) == ex_data['MemberID']:
            cursor.execute("UPDATE exchange SET IsMemberReceived = 1, Score = %s, Comment = %s WHERE ExchangeID = %s", (score, comment, exchange_id))
            is_member_rec = 1
            is_target_rec = ex_data['IsTargetMemberReceived']
            partner_id = ex_data['TargetMemberID']
        elif int(user_id) == ex_data['TargetMemberID']:
            cursor.execute("UPDATE exchange SET IsTargetMemberReceived = 1, PartnerScore = %s, PartnerComment = %s WHERE ExchangeID = %s", (score, comment, exchange_id))
            is_member_rec = ex_data['IsMemberReceived']
            is_target_rec = 1
            partner_id = ex_data['MemberID']
        else:
            return jsonify({"success": False, "message": "คุณไม่มีสิทธิ์ทำรายการนี้"}), 403

        # ตรวจสอบว่ากดยืนยันรับของครบทั้ง 2 ฝ่ายหรือยัง
        if is_member_rec == 1 and is_target_rec == 1:
            # 1. ปิดจ็อบการแลกเปลี่ยนเป็น completed
            cursor.execute("UPDATE exchange SET ExchangeStatus = 'completed', SuccessDate = NOW() WHERE ExchangeID = %s", (exchange_id,))
            
            # 2. ซ่อนสินค้าทั้งสองชิ้นจากฟีด
            cursor.execute("UPDATE item SET ItemStatus = 'exchanged' WHERE ItemID IN (%s, %s)", (ex_data['MyItemID'], ex_data['TargetItemID']))
            
            # 3. 🔍 ค้นหาคำขออื่นๆ ที่ค้างอยู่ (pending, accepted, in_progress) ที่พ่วงกับไอเทมคู่นี้ เพื่อเตรียมส่งแจ้งเตือน
            cursor.execute("""
                SELECT ExchangeID, MemberID, TargetMemberID FROM exchange 
                WHERE ExchangeID != %s
                  AND ExchangeStatus IN ('pending', 'accepted', 'in_progress')
                  AND (MyItemID IN (%s, %s) OR TargetItemID IN (%s, %s))
            """, (exchange_id, ex_data['MyItemID'], ex_data['TargetItemID'], ex_data['MyItemID'], ex_data['TargetItemID']))
            competing_requests = cursor.fetchall()

            # 4. 🧹 กวาดล้างคำขอเหล่านั้นให้กลายเป็น failed ทันที
            cursor.execute("""
                UPDATE exchange 
                SET ExchangeStatus = 'auto_cancelled', 
                    CancelDate = NOW(), 
                    CancelReason = 'สินค้าชิ้นนี้ถูกแลกเปลี่ยนสำเร็จในรายการอื่นไปแล้ว'
                WHERE ExchangeID != %s
                AND ExchangeStatus IN ('pending', 'accepted', 'in_progress')
                AND (MyItemID IN (%s, %s) OR TargetItemID IN (%s, %s))
            """, (
                exchange_id, 
                ex_data['MyItemID'], ex_data['TargetItemID'], 
                ex_data['MyItemID'], ex_data['TargetItemID']
            ))

            conn.commit()

            # 5. แจ้งเตือนผู้ใช้งานที่พลาดดีลทุกรายผ่านระบบ notification_service
            for comp in competing_requests:
                cancel_msg = f"คำขอแลกเปลี่ยนถูกยกเลิกอัตโนมัติ เนื่องจากเจ้าของสินค้าได้ทำการแลกเปลี่ยนสำเร็จกับผู้ใช้งานรายอื่นไปแล้ว"
                notify_user(member_id=comp['MemberID'], title="คำขอแลกเปลี่ยนถูกยกเลิก", message=cancel_msg, link="/matching")
                notify_user(member_id=comp['TargetMemberID'], title="คำขอแลกเปลี่ยนถูกยกเลิก", message=cancel_msg, link="/matching")

            # แจ้งเตือนคู่หลักที่แลกสำเร็จ
            success_msg = f"การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว! 🎉 ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ"
            notify_user(ex_data['MemberID'], "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", success_msg)
            notify_user(ex_data['TargetMemberID'], "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", success_msg)

            msg = "ทำรายการสำเร็จ! การแลกเปลี่ยนเสร็จสมบูรณ์และอัปเดตคำขออื่นๆ เป็นยกเลิกแล้ว"
        else:
            conn.commit()
            notify_user(
                member_id=partner_id,
                title="คู่แลกเปลี่ยนยืนยันได้รับของแล้ว 📦",
                message="คู่แลกเปลี่ยนของคุณได้กดยืนยันว่าได้รับสิ่งของแล้ว กรุณากดยืนยันการรับของเพื่อทำรายการให้เสร็จสมบูรณ์",
            )
            msg = "บันทึกรีวิวแล้ว! กรุณารอให้อีกฝ่ายกดยืนยันได้รับสิ่งของ"
            
        return jsonify({"success": True, "message": msg}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()
    """
    API Endpoint: PUT /api/exchanges/<exchange_id>/complete
    คำอธิบาย: ยืนยันการได้รับสิ่งของและบันทึกคะแนนรีวิวความคิดเห็นของผู้ใช้งานหลังทำรายการเสร็จสิ้น
    
    รายละเอียดการทำงาน:
    - รับค่าคะแนน (score), ความคิดเห็น (comment) และรหัสผู้ใช้งาน (user_id) ผ่าน JSON Body
    - ตรวจสอบว่าผู้ทำรายการเป็น MemberID หรือ TargetMemberID เพื่อบันทึกสถานะการรับของฝั่งนั้น พร้อมบันทึกคะแนนรีวิว
    - ตรวจสอบเงื่อนไขว่าทั้งสองฝ่ายกดยืนยันรับของครบทั้งคู่แล้วหรือยัง (IsMemberReceived == 1 และ IsTargetMemberReceived == 1)
    - หากครบทั้งสองฝ่าย: เปลี่ยนสถานะภาพรวมเป็น 'completed', อัปเดตสถานะสิ่งของทั้งคู่ในตาราง item เป็น 'exchanged' (เพื่อซ่อนจากฟีด) และส่งแจ้งเตือนความสำเร็จให้ทั้งคู่
    - หากยังไม่ครบทั้งสองฝ่าย: บันทึกข้อมูลและส่งการแจ้งเตือนให้อีกฝ่ายรับทราบว่าคู่สนทนากดยืนยันรับของแล้ว
    """
    data = request.json or {}
    score = data.get('score')
    comment = data.get('comment', '')
    user_id = data.get('user_id') 

    if not user_id:
        return jsonify({"success": False, "message": "ไม่พบข้อมูลผู้ใช้งาน (กรุณาแนบ user_id)"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT MemberID, TargetMemberID, IsMemberReceived, IsTargetMemberReceived, MyItemID, TargetItemID FROM exchange WHERE ExchangeID = %s", (exchange_id,))
        ex_data = cursor.fetchone()
        if not ex_data:
            return jsonify({"success": False, "message": "ไม่พบรายการแลกเปลี่ยนนี้"}), 404
            
        # ตรวจสอบสิทธิ์ว่าผู้ทำรายการคือฝั่งไหน และอัปเดตสถานะฝั่งนั้น
        if int(user_id) == ex_data['MemberID']:
            cursor.execute("UPDATE exchange SET IsMemberReceived = 1, Score = %s, Comment = %s WHERE ExchangeID = %s", (score, comment, exchange_id))
            is_member_rec = 1
            is_target_rec = ex_data['IsTargetMemberReceived']
            partner_id = ex_data['TargetMemberID']
        elif int(user_id) == ex_data['TargetMemberID']:
            cursor.execute("UPDATE exchange SET IsTargetMemberReceived = 1, PartnerScore = %s, PartnerComment = %s WHERE ExchangeID = %s", (score, comment, exchange_id))
            is_member_rec = ex_data['IsMemberReceived']
            is_target_rec = 1
            partner_id = ex_data['MemberID']
        else:
            return jsonify({"success": False, "message": "คุณไม่มีสิทธิ์ทำรายการนี้"}), 403

        # ตรวจสอบว่ากดยืนยันรับของครบทั้ง 2 ฝ่ายหรือยัง
        if is_member_rec == 1 and is_target_rec == 1:
            # ปิดจ็อบการแลกเปลี่ยนสำเร็จสมบูรณ์
            cursor.execute("UPDATE exchange SET ExchangeStatus = 'completed', SuccessDate = NOW() WHERE ExchangeID = %s", (exchange_id,))
            cursor.execute("UPDATE item SET ItemStatus = 'exchanged' WHERE ItemID IN (%s, %s)", (ex_data['MyItemID'], ex_data['TargetItemID']))
            conn.commit()

            # แจ้งเตือนทั้งสองฝ่ายว่าการแลกเปลี่ยนเสร็จสมบูรณ์
            success_msg = f"การแลกเปลี่ยนรหัส #{exchange_id} เสร็จสมบูรณ์แล้ว! ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ"
            notify_user(ex_data['MemberID'], "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", success_msg)
            notify_user(ex_data['TargetMemberID'], "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", success_msg)

            msg = "ทำรายการสำเร็จ! การแลกเปลี่ยนเสร็จสมบูรณ์และซ่อนสิ่งของจากหน้าฟีดแล้ว"
        else:
            conn.commit()

            # แจ้งเตือนคู่แลกเปลี่ยนให้อีกฝ่ายรับทราบว่าฝ่ายนี้กดรับของแล้ว
            notify_user(
                member_id=partner_id,
                title="คู่แลกเปลี่ยนยืนยันได้รับของแล้ว 📦",
                message="คู่แลกเปลี่ยนของคุณได้กดยืนยันว่าได้รับสิ่งของแล้ว กรุณากดยืนยันการรับของเพื่อทำรายการให้เสร็จสมบูรณ์",
            )

            msg = "บันทึกรีวิวแล้ว! กรุณารอให้อีกฝ่ายกดยืนยันได้รับสิ่งของ ระบบจึงจะเปลี่ยนสถานะเป็นสำเร็จ"
            
        return jsonify({"success": True, "message": msg}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 6. API: ขอรหัสผ่าน OTP เพื่อดูเบอร์โทร (POST)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:match_id>/request-code', methods=['POST'])
def request_exchange_code(match_id):
    """
    API Endpoint: POST /api/exchanges/<match_id>/request-code
    คำอธิบาย: ขอรหัสผ่านยืนยันตัวตนแบบ OTP เพื่อเปิดเผยข้อมูลเบอร์โทรศัพท์ติดต่อของคู่แลกเปลี่ยน
    
    รายละเอียดการทำงาน:
    - รับค่า user_id ผ่าน JSON Body
    - ตรวจสอบว่าทั้งคู่ได้ระบุเบอร์โทรศัพท์ไว้ในระบบหรือยัง
    - ตรวจสอบว่ามีรหัส OTP เดิมที่ยังไม่หมดอายุหรือไม่ หากมีสามารถใช้รหัสเดิมได้ทันที
    - หากไม่มี: ทำการสุ่มรหัส OTP 6 หลัก และกำหนดเวลาหมดอายุในอีก 10 นาทีข้างหน้า
    - อัปเดต VerifyCode และ VerifyExpire ลงในฐานข้อมูลตาราง member
    - ส่งอีเมลแจ้งรหัสผ่านผ่านฟังก์ชัน `send_exchange_verify_email` และส่ง App Notification แจ้งเตือน
    """
    data = request.json or {}
    user_id = data.get("user_id") 
    
    if not user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ user_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ตรวจสอบว่าทั้งสองฝ่ายมีเบอร์โทรศัพท์ในระบบหรือยัง
        cursor.execute("SELECT PhoneNumber, TargetPhoneNumber FROM exchange WHERE ExchangeID = %s", (match_id,))
        ex_data = cursor.fetchone()
        if not ex_data or not ex_data['PhoneNumber'] or not ex_data['TargetPhoneNumber']:
            return jsonify({"success": False, "message": "คู่แลกเปลี่ยนยังไม่ได้ระบุเบอร์โทรศัพท์"}), 400

        cursor.execute("SELECT Email, VerifyCode, VerifyExpire FROM member WHERE MemberID = %s", (user_id,))
        user = cursor.fetchone()
        if not user or not user['Email']:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลอีเมลผู้ใช้งาน"}), 404

        # หากมีรหัสเดิมและยังไม่หมดอายุ ให้ใช้รหัสเดิมได้ทันที
        if user['VerifyCode'] and user['VerifyExpire'] and datetime.now() < user['VerifyExpire']:
            return jsonify({"success": True, "message": "ใช้รหัสยืนยันเดิมที่ระบบส่งให้ก่อนหน้านี้ได้เลย"}), 200

        # สร้างรหัส OTP ใหม่
        code = str(random.randint(100000, 999999))
        expire_time =  None

        cursor.execute("UPDATE member SET VerifyCode = %s, VerifyExpire = %s WHERE MemberID = %s", (code, expire_time, user_id))
        conn.commit()

        # ส่งอีเมลรหัส OTP
        try:
            send_exchange_verify_email(user['Email'], code)
        except Exception as e:
            print(f"⚠️ ส่งอีเมล OTP ไม่สำเร็จ: {str(e)}")

        # ส่งแจ้งเตือนรหัส OTP ภายในแอปพลิเคชัน
        noti_message = f"รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: {code}"
        sql_notif = """
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
            VALUES (%s, %s, %s, 0, NOW())
        """
        cursor.execute(sql_notif, (user_id, noti_message, f"/exchange-tracking/{match_id}"))
        conn.commit()

        return jsonify({"success": True, "message": "ส่งรหัสยืนยันไปยังอีเมลและการแจ้งเตือนเรียบร้อยแล้ว"}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการส่งรหัส: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 7. API: ยืนยันรหัส OTP เพื่อดูเบอร์โทร (POST)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:match_id>/verify-code', methods=['POST'])
def verify_exchange_code(match_id):
    """
    API Endpoint: POST /api/exchanges/<match_id>/verify-code
    คำอธิบาย: ตรวจสอบความถูกต้องของรหัส OTP เพื่อปลดล็อกสิทธิ์ดูข้อมูลเบอร์โทรศัพท์ติดต่อ
    
    รายละเอียดการทำงาน:
    - รับค่า user_id และ code ที่ผู้ใช้กรอกเข้ามาผ่าน JSON Body
    - ตรวจสอบความถูกต้องของรหัส OTP และเช็กเวลาหมดอายุ (VerifyExpire)
    - อัปเดตสถานะการยืนยันตัวตนของผู้ใช้คนนั้นในตาราง exchange (ตั้งค่า IsMemberVerified หรือ IsTargetMemberVerified เป็น 1)
    - ตรวจสอบว่าทั้งสองฝ่ายยืนยันตัวตนครบทั้งคู่แล้วหรือไม่ หากครบให้เปลี่ยนสถานะภาพรวม ExchangeStatus เป็น 'in_progress'
    - ล้างข้อมูล VerifyCode และ VerifyExpire ทิ้งทันทีเมื่อใช้งานเสร็จสิ้นเพื่อความปลอดภัย
    """
    data = request.json or {}
    user_id = data.get("user_id") 
    submitted_code = data.get("code")

    if not user_id or not submitted_code:
        return jsonify({"success": False, "message": "กรุณาระบุรหัสผู้ใช้งานและรหัส OTP"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT VerifyCode, VerifyExpire FROM member WHERE MemberID = %s", (user_id,))
        user = cursor.fetchone()

        if not user or not user['VerifyCode']:
            return jsonify({"success": False, "message": "ไม่พบการขอรหัส OTP หรือรหัสถูกใช้ไปแล้ว"}), 400
            
        if user['VerifyCode'] != submitted_code:
            return jsonify({"success": False, "message": "รหัสยืนยันไม่ถูกต้อง"}), 400
            
        if user['VerifyExpire'] and datetime.now() > user['VerifyExpire']:
            return jsonify({"success": False, "message": "รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่"}), 400

        cursor.execute("SELECT MemberID, TargetMemberID, IsMemberVerified, IsTargetMemberVerified FROM exchange WHERE ExchangeID = %s", (match_id,))
        exchange_data = cursor.fetchone()
        if not exchange_data:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลการแลกเปลี่ยนนี้"}), 404

        is_member_verified = exchange_data['IsMemberVerified']
        is_target_verified = exchange_data['IsTargetMemberVerified']

        # บันทึกสถานะการยืนยันตัวตนของฝั่งที่ส่งคำขอเข้ามา
        if int(user_id) == exchange_data['MemberID']:
            cursor.execute("UPDATE exchange SET IsMemberVerified = 1 WHERE ExchangeID = %s", (match_id,))
            is_member_verified = 1
        elif int(user_id) == exchange_data['TargetMemberID']:
            cursor.execute("UPDATE exchange SET IsTargetMemberVerified = 1 WHERE ExchangeID = %s", (match_id,))
            is_target_verified = 1

        # หากทั้งสองฝ่ายยืนยันตัวตนครบแล้ว ปรับสถานะเป็นกำลังดำเนินการ (in_progress)
        if is_member_verified == 1 and is_target_verified == 1:
            cursor.execute("UPDATE exchange SET ExchangeStatus = 'in_progress' WHERE ExchangeID = %s AND ExchangeStatus = 'accepted'", (match_id,))
            return_msg = "ยืนยันรหัสสำเร็จ! ทั้งสองฝ่ายยืนยันครบแล้ว สามารถดูข้อมูลการติดต่อได้"
        else:
            return_msg = "ยืนยันรหัสสำเร็จ! กรุณารอให้อีกฝ่ายยืนยันตัวตนเพื่อเปิดเผยข้อมูลการติดต่อ"
        
        # เคลียร์ข้อมูล OTP ออกจากฐานข้อมูลเพื่อความปลอดภัย
        cursor.execute("UPDATE member SET VerifyCode = NULL, VerifyExpire = NULL WHERE MemberID = %s", (user_id,))
        conn.commit()
        
        return jsonify({"success": True, "message": return_msg}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการตรวจสอบรหัส: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ========================================================
# 8. API: ดึงรายการแจ้งเตือนทั้งหมด (GET)
# ========================================================
@exchanges_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """
    API Endpoint: GET /api/notifications
    คำอธิบาย: ดึงรายการแจ้งเตือนทั้งหมดของสมาชิกแต่ละราย
    
    รายละเอียดการทำงาน:
    - รับค่า member_id ผ่าน Query Parameters
    - ดึงข้อมูลจากตาราง notification เรียงตามวันที่สร้างล่าสุด (CreateDate DESC)
    - แปลงรูปแบบวันที่เป็น String รูปแบบมาตรฐานก่อนส่งคืนข้อมูลชุดผลลัพธ์
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM notification WHERE MemberID = %s ORDER BY CreateDate DESC"
        cursor.execute(sql, (member_id,))
        notifications = cursor.fetchall()
        
        for n in notifications:
            if n.get('CreateDate'):
                n['CreateDate'] = n['CreateDate'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({"success": True, "data": notifications}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ========================================================
# 9. API: นับจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (GET)
# ========================================================
@exchanges_bp.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_notification_count():
    """
    API Endpoint: GET /api/notifications/unread-count
    คำอธิบาย: นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน (IsRead = 0) ของผู้ใช้งาน เพื่อแสดง Badge แจ้งเตือนบน UI
    
    รายละเอียดการทำงาน:
    - รับค่า member_id ผ่าน Query Parameters
    - ทำการ Query นับจำนวนแถวที่ยังไม่ได้อ่านและส่งค่าตัวเลขผลลัพธ์กลับไป
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT COUNT(*) as unreadCount FROM notification WHERE MemberID = %s AND IsRead = 0"
        cursor.execute(sql, (member_id,))
        result = cursor.fetchone()
        return jsonify({"success": True, "count": result['unreadCount'] if result else 0}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ========================================================
# 10. API: อัปเดตแจ้งเตือนเป็น "อ่านแล้ว" (PUT)
# ========================================================
@exchanges_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """
    API Endpoint: PUT /api/notifications/<notification_id>/read
    คำอธิบาย: เปลี่ยนสถานะการแจ้งเตือนรายการที่ระบุให้เป็น "อ่านแล้ว" (IsRead = 1)
    
    รายละเอียดการทำงาน:
    - รับค่า notification_id ผ่าน URL Path Parameter
    - อัปเดตค่าคอลัมน์ IsRead เป็น 1 ตามรหัสการแจ้งเตือนที่กำหนดและบันทึกฐานข้อมูล
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE notification SET IsRead = 1 WHERE NotificationID = %s", (notification_id,))
        conn.commit()
        return jsonify({"success": True, "message": "อัปเดตสถานะการอ่านเรียบร้อยแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


