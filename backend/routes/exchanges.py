import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db import get_connection
from services.notification_service import notify_user
from services.email_service import send_exchange_verify_email

# ==========================================
# EXCHANGES BLUEPRINT CONFIGURATION
# ==========================================
exchanges_bp = Blueprint('exchanges', __name__)


# ==========================================
# 1. API: ดึงรายการการแลกเปลี่ยนทั้งหมด (GET)
# ==========================================
@exchanges_bp.route('/api/exchanges', methods=['GET'])
def get_exchanges():
    """
    API Endpoint: GET /api/exchanges
    คำอธิบาย: ดึงรายการประวัติและสถานะการแลกเปลี่ยนสิ่งของทั้งหมดของผู้ใช้งาน พร้อมสลับมุมมองข้อมูลฝั่งคู่สนทนาอัตโนมัติ
    """
    member_id = request.args.get('member_id') 
    target_member_id = request.args.get('target_member_id')
    current_user_id = member_id or target_member_id
    
    if not current_user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id หรือ target_member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    
    try:
        if target_member_id and not member_id:
            where_clause = "WHERE e.targetmemberid = %s"
            query_params = (current_user_id,) * 12
        else:
            where_clause = "WHERE e.memberid = %s OR e.targetmemberid = %s"
            query_params = (current_user_id,) * 13

        # เปลี่ยน IFNULL เป็น COALESCE สำหรับ PostgreSQL และใช้ AS "..." ส่งค่ากลับไป Frontend
        sql = f"""
            SELECT 
                e.exchangeid AS "ExchangeID", e.exchangestatus AS "ExchangeStatus", e.exchangelocation AS "ExchangeLocation", 
                e.score AS "Score", COALESCE(e.matchscore, 0) AS "MatchScore", e.exchangetype AS "ExchangeType", 
                e.memberid AS "MemberID", e.targetmemberid AS "TargetMemberID",
                e.myitemid AS "MyItemID", e.targetitemid AS "TargetItemID", 
                e.phonenumber AS "PhoneNumber", e.targetphonenumber AS "TargetPhoneNumber",
                e.startdate AS "StartDate", e.successdate AS "SuccessDate", e.canceldate AS "CancelDate", e.cancelreason AS "CancelReason",
                e.ismemberverified AS "IsMemberVerified", e.istargetmemberverified AS "IsTargetMemberVerified",  
                e.ismemberreceived AS "IsMemberReceived", e.istargetmemberreceived AS "IsTargetMemberReceived",
                e.partnerscore AS "PartnerScore", e.partnercomment AS "PartnerComment", e.comment AS "Comment",
                
                CASE WHEN e.memberid = %s THEN COALESCE(e.targetphonenumber, 'รออีกฝ่ายระบุเบอร์') ELSE COALESCE(e.phonenumber, 'รออีกฝ่ายระบุเบอร์') END AS "partnerPhone",
                CASE WHEN e.memberid = %s THEN COALESCE(my_item.itemimage, '') ELSE COALESCE(their_item.itemimage, '') END AS "myPostImage",
                CASE WHEN e.memberid = %s THEN COALESCE(their_item.itemimage, '') ELSE COALESCE(my_item.itemimage, '') END AS "theirPostImage",
                CASE WHEN e.memberid = %s THEN COALESCE(my_item.itemname, 'ไม่มีชื่อสิ่งของ') ELSE COALESCE(their_item.itemname, 'ไม่มีชื่อสิ่งของ') END AS "myPostTitle",
                CASE WHEN e.memberid = %s THEN COALESCE(their_item.itemname, 'ไม่มีชื่อสิ่งของ') ELSE COALESCE(my_item.itemname, 'ไม่มีชื่อสิ่งของ') END AS "theirPostTitle",
                COALESCE(CASE WHEN e.memberid = %s THEN target_member.displayname ELSE requester_member.displayname END, 'ผู้ใช้งานระบบ') AS "theirAuthorName",
                CASE WHEN e.memberid = %s THEN target_member.profileimage ELSE requester_member.profileimage END AS "theirProfileImage",
                CASE WHEN e.memberid = %s THEN COALESCE(my_item.itemdescription, '') ELSE COALESCE(their_item.itemdescription, '') END AS "myPostDescription",
                CASE WHEN e.memberid = %s THEN COALESCE(their_item.itemdescription, '') ELSE COALESCE(my_item.itemdescription, '') END AS "theirPostDescription",
                CASE WHEN e.memberid = %s THEN COALESCE(my_item.meetinglocation, '') ELSE COALESCE(their_item.meetinglocation, '') END AS "myMeetingLocation",
                CASE WHEN e.memberid = %s THEN COALESCE(their_item.meetinglocation, '') ELSE COALESCE(my_item.meetinglocation, '') END AS "theirMeetingLocation"

            FROM exchange e
            LEFT JOIN item my_item ON e.myitemid = my_item.itemid
            LEFT JOIN item their_item ON e.targetitemid = their_item.itemid
            LEFT JOIN member requester_member ON e.memberid = requester_member.memberid
            LEFT JOIN member target_member ON e.targetmemberid = target_member.memberid
            {where_clause}
            ORDER BY e.exchangeid DESC
        """
        
        cursor.execute(sql, query_params)
        exchanges = cursor.fetchall()
        
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
    """
    data = request.json or {}
    member_id = data.get('member_id')
    target_member_id = data.get('target_member_id')
    my_item_id = data.get('my_item_id')
    their_item_id = data.get('their_item_id')
    location = data.get('location') or 'นัดเจอตามตกลง'
    phone_number = data.get('phone_number') or ''
    match_score = data.get('match_score', 0) 

    if not all([member_id, target_member_id, my_item_id, their_item_id]):
        return jsonify({"success": False, "message": "ข้อมูลไม่ครบถ้วน"}), 400

    try:
        member_id = int(member_id)
        target_member_id = int(target_member_id)
        my_item_id = int(my_item_id)
        their_item_id = int(their_item_id)
        match_score = float(match_score) 
    except (ValueError, TypeError) as e:
        return jsonify({"success": False, "message": f"รูปแบบข้อมูลไม่ถูกต้อง: {str(e)}"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    exchange_type = data.get('exchange_type', 'manual') 
    
    try:
        # ใช้ RETURNING เพื่อดึง ID ล่าสุดกลับมาให้ชัวร์ (รองรับ PostgreSQL)
        sql_exchange = """
            INSERT INTO exchange (
                exchangelocation, exchangestatus, memberid, targetmemberid, 
                myitemid, targetitemid, phonenumber, startdate, matchscore, exchangetype
            )
            VALUES (%s, 'pending', %s, %s, %s, %s, %s, NOW(), %s, %s)
            RETURNING exchangeid
        """
        cursor.execute(sql_exchange, (location, member_id, target_member_id, my_item_id, their_item_id, phone_number, match_score, exchange_type))
        inserted_row = cursor.fetchone()
        exchange_id = inserted_row['exchangeid'] if inserted_row else cursor.lastrowid

        sender_name, sender_item_name, receiver_item_name = "ผู้ใช้งานระบบ", "สิ่งของชิ้นใหม่", "สิ่งของของคุณ"
        
        cursor.execute("SELECT displayname FROM member WHERE memberid = %s", (member_id,))
        m_res = cursor.fetchone()
        if m_res: sender_name = m_res['displayname']
        
        cursor.execute("SELECT itemname FROM item WHERE itemid = %s", (my_item_id,))
        i_res1 = cursor.fetchone()
        if i_res1: sender_item_name = i_res1['itemname']
        
        cursor.execute("SELECT itemname FROM item WHERE itemid = %s", (their_item_id,))
        i_res2 = cursor.fetchone()
        if i_res2: receiver_item_name = i_res2['itemname']

        conn.commit()

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
        cursor.execute("SELECT * FROM exchange WHERE exchangeid = %s", (exchange_id,))
        exchange = cursor.fetchone()
        if not exchange:
            return jsonify({"success": False, "message": "ไม่พบรายการแลกเปลี่ยนนี้"}), 404
            
        if new_status == 'accepted':
            if not phone_number:
                return jsonify({"success": False, "message": "กรุณาระบุเบอร์โทรศัพท์เพื่อยืนยัน"}), 400
            
            sql_update = "UPDATE exchange SET exchangestatus = %s, successdate = NOW(), targetphonenumber = %s WHERE exchangeid = %s"
            cursor.execute(sql_update, (new_status, phone_number, exchange_id))

            cursor.execute("""
                SELECT exchangeid, memberid, targetmemberid FROM exchange 
                WHERE exchangeid != %s
                  AND exchangestatus = 'pending'
                  AND (myitemid IN (%s, %s) OR targetitemid IN (%s, %s))
            """, (exchange_id, exchange['myitemid'], exchange['targetitemid'], exchange['myitemid'], exchange['targetitemid']))
            competing_requests = cursor.fetchall()

            if competing_requests:
                cursor.execute("""
                    UPDATE exchange 
                    SET exchangestatus = 'auto_cancelled', 
                        canceldate = NOW(), 
                        cancelreason = 'สินค้าชิ้นนี้ถูกตอบรับการแลกเปลี่ยนในรายการอื่นไปแล้ว'
                    WHERE exchangeid != %s
                      AND exchangestatus = 'pending'
                      AND (myitemid IN (%s, %s) OR targetitemid IN (%s, %s))
                """, (exchange_id, exchange['myitemid'], exchange['targetitemid'], exchange['myitemid'], exchange['targetitemid']))

            conn.commit()

            notify_user(
                member_id=exchange['memberid'],
                title="คำขอแลกเปลี่ยนได้รับการตอบรับ!",
                message="คำขอแลกเปลี่ยนของคุณได้รับการ 'ตอบรับ' แล้ว! 🎉 กรุณาเข้าสู่ระบบเพื่อยืนยันตัวตนแลกเปลี่ยนข้อมูลติดต่อ",
            )

            for comp in competing_requests:
                cancel_msg = "คำขอแลกเปลี่ยนถูกยกเลิกอัตโนมัติ เนื่องจากสินค้าดังกล่าวถูกตอบรับการแลกเปลี่ยนในรายการอื่นไปแล้ว"
                notify_user(member_id=comp['memberid'], title="คำขอแลกเปลี่ยนถูกยกเลิก ❌", message=cancel_msg)
                notify_user(member_id=comp['targetmemberid'], title="คำขอแลกเปลี่ยนถูกยกเลิก ❌", message=cancel_msg)
        
        else:
            sql_update = "UPDATE exchange SET exchangestatus = %s, canceldate = NOW() WHERE exchangeid = %s"
            cursor.execute(sql_update, (new_status, exchange_id))
            conn.commit()

            notify_user(
                member_id=exchange['memberid'],
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
    """
    data = request.json or {}
    reason = data.get('reason', 'ไม่ระบุเหตุผล')
    user_id = data.get('user_id')

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT memberid, targetmemberid FROM exchange WHERE exchangeid = %s", (exchange_id,))
        ex_data = cursor.fetchone()

        sql = "UPDATE exchange SET exchangestatus = 'failed', canceldate = NOW(), cancelreason = %s WHERE exchangeid = %s"
        cursor.execute(sql, (reason, exchange_id))
        conn.commit()

        if ex_data and user_id:
            partner_id = ex_data['targetmemberid'] if str(user_id) == str(ex_data['memberid']) else ex_data['memberid']
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
    """
    API Endpoint: PUT /api/exchanges/<exchange_id>/complete
    คำอธิบาย: ยืนยันการได้รับสิ่งของและบันทึกคะแนนรีวิวความคิดเห็นของผู้ใช้งานหลังทำรายการเสร็จสิ้น
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
        cursor.execute("SELECT memberid, targetmemberid, ismemberreceived, istargetmemberreceived, myitemid, targetitemid FROM exchange WHERE exchangeid = %s", (exchange_id,))
        ex_data = cursor.fetchone()
        if not ex_data:
            return jsonify({"success": False, "message": "ไม่พบรายการแลกเปลี่ยนนี้"}), 404
            
        if int(user_id) == ex_data['memberid']:
            cursor.execute("UPDATE exchange SET ismemberreceived = 1, score = %s, comment = %s WHERE exchangeid = %s", (score, comment, exchange_id))
            is_member_rec = 1
            is_target_rec = ex_data['istargetmemberreceived']
            partner_id = ex_data['targetmemberid']
        elif int(user_id) == ex_data['targetmemberid']:
            cursor.execute("UPDATE exchange SET istargetmemberreceived = 1, partnerscore = %s, partnercomment = %s WHERE exchangeid = %s", (score, comment, exchange_id))
            is_member_rec = ex_data['ismemberreceived']
            is_target_rec = 1
            partner_id = ex_data['memberid']
        else:
            return jsonify({"success": False, "message": "คุณไม่มีสิทธิ์ทำรายการนี้"}), 403

        if is_member_rec == 1 and is_target_rec == 1:
            cursor.execute("UPDATE exchange SET exchangestatus = 'completed', successdate = NOW() WHERE exchangeid = %s", (exchange_id,))
            cursor.execute("UPDATE item SET itemstatus = 'exchanged' WHERE itemid IN (%s, %s)", (ex_data['myitemid'], ex_data['targetitemid']))
            
            cursor.execute("""
                SELECT exchangeid, memberid, targetmemberid FROM exchange 
                WHERE exchangeid != %s
                  AND exchangestatus IN ('pending', 'accepted', 'in_progress')
                  AND (myitemid IN (%s, %s) OR targetitemid IN (%s, %s))
            """, (exchange_id, ex_data['myitemid'], ex_data['targetitemid'], ex_data['myitemid'], ex_data['targetitemid']))
            competing_requests = cursor.fetchall()

            cursor.execute("""
                UPDATE exchange 
                SET exchangestatus = 'auto_cancelled', 
                    canceldate = NOW(), 
                    cancelreason = 'สินค้าชิ้นนี้ถูกแลกเปลี่ยนสำเร็จในรายการอื่นไปแล้ว'
                WHERE exchangeid != %s
                AND exchangestatus IN ('pending', 'accepted', 'in_progress')
                AND (myitemid IN (%s, %s) OR targetitemid IN (%s, %s))
            """, (exchange_id, ex_data['myitemid'], ex_data['targetitemid'], ex_data['myitemid'], ex_data['targetitemid']))

            conn.commit()

            for comp in competing_requests:
                cancel_msg = f"คำขอแลกเปลี่ยนถูกยกเลิกอัตโนมัติ เนื่องจากเจ้าของสินค้าได้ทำการแลกเปลี่ยนสำเร็จกับผู้ใช้งานรายอื่นไปแล้ว"
                notify_user(member_id=comp['memberid'], title="คำขอแลกเปลี่ยนถูกยกเลิก", message=cancel_msg, link="/matching")
                notify_user(member_id=comp['targetmemberid'], title="คำขอแลกเปลี่ยนถูกยกเลิก", message=cancel_msg, link="/matching")

            success_msg = f"การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว! 🎉 ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ"
            notify_user(ex_data['memberid'], "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", success_msg)
            notify_user(ex_data['targetmemberid'], "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉", success_msg)

            msg = "ทำรายการสำเร็จ! การแลกเปลี่ยนเสร็จสมบูรณ์และซ่อนสิ่งของจากหน้าฟีดแล้ว"
        else:
            conn.commit()
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
    """
    data = request.json or {}
    user_id = data.get("user_id") 
    
    if not user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ user_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT phonenumber, targetphonenumber FROM exchange WHERE exchangeid = %s", (match_id,))
        ex_data = cursor.fetchone()
        if not ex_data or not ex_data['phonenumber'] or not ex_data['targetphonenumber']:
            return jsonify({"success": False, "message": "คู่แลกเปลี่ยนยังไม่ได้ระบุเบอร์โทรศัพท์"}), 400

        cursor.execute("SELECT email, verifycode, verifyexpire FROM member WHERE memberid = %s", (user_id,))
        user = cursor.fetchone()
        if not user or not user['email']:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลอีเมลผู้ใช้งาน"}), 404

        if user['verifycode'] and user['verifyexpire'] and datetime.now() < user['verifyexpire']:
            return jsonify({"success": True, "message": "ใช้รหัสยืนยันเดิมที่ระบบส่งให้ก่อนหน้านี้ได้เลย"}), 200

        code = str(random.randint(100000, 999999))
        expire_time =  None

        cursor.execute("UPDATE member SET verifycode = %s, verifyexpire = %s WHERE memberid = %s", (code, expire_time, user_id))
        conn.commit()

        try:
            send_exchange_verify_email(user['email'], code)
        except Exception as e:
            print(f"⚠️ ส่งอีเมล OTP ไม่สำเร็จ: {str(e)}")

        noti_message = f"รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: {code}"
        sql_notif = """
            INSERT INTO notification (memberid, message, link, isread, createdate)
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
    """
    data = request.json or {}
    user_id = data.get("user_id") 
    submitted_code = data.get("code")

    if not user_id or not submitted_code:
        return jsonify({"success": False, "message": "กรุณาระบุรหัสผู้ใช้งานและรหัส OTP"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT verifycode, verifyexpire FROM member WHERE memberid = %s", (user_id,))
        user = cursor.fetchone()

        if not user or not user['verifycode']:
            return jsonify({"success": False, "message": "ไม่พบการขอรหัส OTP หรือรหัสถูกใช้ไปแล้ว"}), 400
            
        if user['verifycode'] != submitted_code:
            return jsonify({"success": False, "message": "รหัสยืนยันไม่ถูกต้อง"}), 400
            
        if user['verifyexpire'] and datetime.now() > user['verifyexpire']:
            return jsonify({"success": False, "message": "รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่"}), 400

        cursor.execute("SELECT memberid, targetmemberid, ismemberverified, istargetmemberverified FROM exchange WHERE exchangeid = %s", (match_id,))
        exchange_data = cursor.fetchone()
        if not exchange_data:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลการแลกเปลี่ยนนี้"}), 404

        is_member_verified = exchange_data['ismemberverified']
        is_target_verified = exchange_data['istargetmemberverified']

        if int(user_id) == exchange_data['memberid']:
            cursor.execute("UPDATE exchange SET ismemberverified = 1 WHERE exchangeid = %s", (match_id,))
            is_member_verified = 1
        elif int(user_id) == exchange_data['targetmemberid']:
            cursor.execute("UPDATE exchange SET istargetmemberverified = 1 WHERE exchangeid = %s", (match_id,))
            is_target_verified = 1

        if is_member_verified == 1 and is_target_verified == 1:
            cursor.execute("UPDATE exchange SET exchangestatus = 'in_progress' WHERE exchangeid = %s AND exchangestatus = 'accepted'", (match_id,))
            return_msg = "ยืนยันรหัสสำเร็จ! ทั้งสองฝ่ายยืนยันครบแล้ว สามารถดูข้อมูลการติดต่อได้"
        else:
            return_msg = "ยืนยันรหัสสำเร็จ! กรุณารอให้อีกฝ่ายยืนยันตัวตนเพื่อเปิดเผยข้อมูลการติดต่อ"
        
        cursor.execute("UPDATE member SET verifycode = NULL, verifyexpire = NULL WHERE memberid = %s", (user_id,))
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
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # ใช้ AS "..." เพื่อส่ง Key ที่ถูกต้องกลับไปให้ Frontend
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
    คำอธิบาย: นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน (IsRead = 0)
    """
    member_id = request.args.get('member_id')
    if not member_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = 'SELECT COUNT(*) as "unreadCount" FROM notification WHERE memberid = %s AND isread = 0'
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
    คำอธิบาย: เปลี่ยนสถานะการแจ้งเตือนรายการที่ระบุให้เป็น "อ่านแล้ว"
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE notification SET isread = 1 WHERE notificationid = %s", (notification_id,))
        conn.commit()
        return jsonify({"success": True, "message": "อัปเดตสถานะการอ่านเรียบร้อยแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()