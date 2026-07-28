import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db import get_connection
from services.email_service import send_exchange_verify_email

exchanges_bp = Blueprint('exchanges', __name__)

# ==========================================
# 1. API: ดึงรายการการแลกเปลี่ยนทั้งหมด (GET)
# ==========================================
@exchanges_bp.route('/api/exchanges', methods=['GET'])
def get_exchanges():
    member_id = request.args.get('member_id') 
    target_member_id = request.args.get('target_member_id')
    current_user_id = member_id or target_member_id
    
    if not current_user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id หรือ target_member_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    
    try:
        if target_member_id and not member_id:
            where_clause = "WHERE e.TargetMemberID = %s"
            query_params = (current_user_id,) * 7 
        else:
            where_clause = "WHERE e.MemberID = %s OR e.TargetMemberID = %s"
            query_params = (current_user_id,) * 8 

        sql = f"""
            SELECT 
                e.ExchangeID, 
                e.ExchangeStatus, 
                e.ExchangeLocation, 
                IFNULL(e.Score, 95) AS Score, 
                e.MemberID,
                e.TargetMemberID,
                e.MyItemID,
                e.TargetItemID,
                e.PhoneNumber,
                e.TargetPhoneNumber,
                e.StartDate,
                e.IsMemberVerified,        
                e.IsTargetMemberVerified,  
                
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(e.TargetPhoneNumber, 'รออีกฝ่ายระบุเบอร์')
                    ELSE IFNULL(e.PhoneNumber, 'รออีกฝ่ายระบุเบอร์')
                END AS partnerPhone,
                
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(my_item.ItemImage, '')
                    ELSE IFNULL(their_item.ItemImage, '')
                END AS myPostImage,

                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(their_item.ItemImage, '')
                    ELSE IFNULL(my_item.ItemImage, '')
                END AS theirPostImage,
                
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                    ELSE IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                END AS myPostTitle,
                
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                    ELSE IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                END AS theirPostTitle,

                IFNULL(
                    CASE 
                        WHEN e.MemberID = %s THEN target_member.DisplayName
                        ELSE requester_member.DisplayName
                    END, 'ผู้ใช้งานระบบ'
                ) AS theirAuthorName

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
        print(f"Error fetching exchanges: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 2. API: สร้างคำขอแลกเปลี่ยนใหม่ (POST)
# ==========================================
@exchanges_bp.route('/api/exchanges', methods=['POST'])
def create_exchange():
    data = request.json or {}
    
    member_id = data.get('member_id')
    target_member_id = data.get('target_member_id')
    my_item_id = data.get('my_item_id')
    their_item_id = data.get('their_item_id')
    location = data.get('location') or 'นัดเจอตามตกลง'
    phone_number = data.get('phone_number') or ''

    if not all([member_id, target_member_id, my_item_id, their_item_id]):
        return jsonify({
            "success": False, 
            "message": "ข้อมูลไม่ครบถ้วน (ต้องการ member_id, target_member_id, my_item_id, their_item_id)"
        }), 400

    try:
        member_id = int(member_id)
        target_member_id = int(target_member_id)
        my_item_id = int(my_item_id)
        their_item_id = int(their_item_id)
    except (ValueError, TypeError) as e:
        return jsonify({"success": False, "message": f"ID ต้องเป็นตัวเลขเท่านั้น: {str(e)}"}), 400
        
    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    
    try:
        sql_exchange = """
            INSERT INTO exchange (
                ExchangeLocation, ExchangeStatus, MemberID, TargetMemberID, 
                MyItemID, TargetItemID, PhoneNumber, StartDate
            )
            VALUES (%s, 'pending', %s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(sql_exchange, (location, member_id, target_member_id, my_item_id, their_item_id, phone_number))
        exchange_id = cursor.lastrowid

        sender_name, sender_item_name, receiver_item_name = "ผู้ใช้งานระบบ", "สิ่งของชิ้นใหม่", "สิ่งของของคุณ"
        try:
            cursor.execute("SELECT DisplayName FROM member WHERE MemberID = %s", (member_id,))
            m_res = cursor.fetchone()
            if m_res: sender_name = m_res['DisplayName']
            
            cursor.execute("SELECT ItemName FROM item WHERE ItemID = %s", (my_item_id,))
            i_res1 = cursor.fetchone()
            if i_res1: sender_item_name = i_res1['ItemName']
            
            cursor.execute("SELECT ItemName FROM item WHERE ItemID = %s", (their_item_id,))
            i_res2 = cursor.fetchone()
            if i_res2: receiver_item_name = i_res2['ItemName']
        except Exception as fetch_err:
            print(f"⚠️ ดึงข้อมูลมาต่อประโยคแจ้งเตือนไม่สำเร็จ: {str(fetch_err)}")

        custom_message = f"คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก {sender_name} ต้องการแลก {sender_item_name} กับ {receiver_item_name}"
        
        try:
            sql_notif = """
                INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
                VALUES (%s, %s, %s, 0, NOW())
            """
            target_link = f"/incoming-requests?id={exchange_id}" 
            cursor.execute(sql_notif, (target_member_id, custom_message, target_link))
        except Exception as err:
            print(f"❌ Notification Insert Error: {str(err)}")
        
        conn.commit()
        return jsonify({"success": True, "message": "ส่งคำขอแลกเปลี่ยนสำเร็จเรียบร้อยแล้ว!"}), 201
        
    except Exception as e:
        conn.rollback()
        print(f"Error Database INSERT: {str(e)}")
        return jsonify({"success": False, "message": f"ฐานข้อมูลขัดข้อง: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 3. API: ตอบรับ หรือ ปฏิเสธการแลกเปลี่ยน (PUT)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:exchange_id>', methods=['PUT'])
def update_exchange_status(exchange_id):
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
                return jsonify({"success": False, "message": "กรุณาระบุเบอร์โทรศัพท์ของคุณเพื่อยืนยันการตอบรับ"}), 400
            
            sql_update = "UPDATE exchange SET ExchangeStatus = %s, SuccessDate = NOW(), TargetPhoneNumber = %s WHERE ExchangeID = %s"
            cursor.execute(sql_update, (new_status, phone_number, exchange_id))
        else:
            sql_update = "UPDATE exchange SET ExchangeStatus = %s, CancelDate = NOW() WHERE ExchangeID = %s"
            cursor.execute(sql_update, (new_status, exchange_id))
        
        msg = "คำขอแลกเปลี่ยนของคุณได้รับการ 'ตอบรับ' แล้ว! 🎉" if action == 'accept' else "คำขอแลกเปลี่ยนของคุณถูก 'ปฏิเสธ' แล้ว ❌"
        cursor.execute("""
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate) 
            VALUES (%s, %s, '/notifications', 0, NOW())
        """, (exchange['MemberID'], msg))
            
        conn.commit()
        return jsonify({"success": True, "message": f"ทำการ {action} คำขอเรียบร้อยแล้ว"}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ========================================================
# 4. API: ดึงรายการแจ้งเตือนทั้งหมด (GET)
# ========================================================
@exchanges_bp.route('/api/notifications', methods=['GET'])
def get_notifications():
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
# 5. API: นับจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (GET)
# ========================================================
@exchanges_bp.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_notification_count():
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
# 6. API: อัปเดตแจ้งเตือนเป็น "อ่านแล้ว" (PUT)
# ========================================================
@exchanges_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
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

# ========================================================
# 7. API: ดึงสถิติและรีวิวผู้ใช้งาน (GET)
# ========================================================
@exchanges_bp.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql_count = """
            SELECT COUNT(*) AS total_success
            FROM exchange
            WHERE (MemberID = %s OR TargetMemberID = %s)
            AND ExchangeStatus IN ('accepted', 'completed')
        """
        cursor.execute(sql_count, (user_id, user_id))
        count_res = cursor.fetchone()
        successful_exchanges = count_res['total_success'] if count_res else 0

        sql_reviews = """
            SELECT
                e.ExchangeID,
                e.SuccessDate AS ReviewDate,
                CASE WHEN e.MemberID = %s THEN e.PartnerScore ELSE e.Score END AS Rating,
                CASE WHEN e.MemberID = %s THEN e.PartnerComment ELSE e.Comment END AS Comment,
                CASE 
                    WHEN e.MemberID = %s THEN COALESCE(target_member.DisplayName, 'ผู้ใช้งานทั่วไป')
                    ELSE COALESCE(requester_member.DisplayName, 'ผู้ใช้งานทั่วไป')
                END AS ReviewerName
            FROM exchange e
            LEFT JOIN member requester_member ON e.MemberID = requester_member.MemberID
            LEFT JOIN member target_member ON e.TargetMemberID = target_member.MemberID
            WHERE ((e.MemberID = %s AND e.PartnerScore IS NOT NULL) OR (e.TargetMemberID = %s AND e.Score IS NOT NULL))
              AND e.ExchangeStatus IN ('accepted', 'completed')
            ORDER BY e.SuccessDate DESC
        """
        cursor.execute(sql_reviews, (user_id, user_id, user_id, user_id, user_id))
        reviews_raw = cursor.fetchall()

        total_score = 0
        valid_reviews = []
        for rev in reviews_raw:
            rev['ReviewDate'] = rev['ReviewDate'].strftime('%d/%m/%Y %H:%M') if rev['ReviewDate'] else 'ไม่มีระบุวันที่'
            if rev['Rating'] is not None:
                total_score += float(rev['Rating'])
                valid_reviews.append(rev)

        review_score = f"{(total_score / len(valid_reviews)):.1f}" if valid_reviews else "0.0"

        return jsonify({
            "success": True,
            "data": {
                "successfulExchanges": successful_exchanges,
                "reviewScore": review_score,
                "reviews": valid_reviews
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 8. API: ขอรหัสผ่าน OTP เพื่อดูเบอร์โทร (POST)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:match_id>/request-code', methods=['POST'])
def request_exchange_code(match_id):
    data = request.json or {}
    user_id = data.get("user_id") 
    
    if not user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ user_id"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT PhoneNumber, TargetPhoneNumber FROM exchange WHERE ExchangeID = %s", (match_id,))
        ex_data = cursor.fetchone()
        if not ex_data or not ex_data['PhoneNumber'] or not ex_data['TargetPhoneNumber']:
            return jsonify({"success": False, "message": "คู่แลกเปลี่ยนยังไม่ได้ระบุเบอร์โทรศัพท์"}), 400

        cursor.execute("SELECT Email, VerifyCode, VerifyExpire FROM member WHERE MemberID = %s", (user_id,))
        user = cursor.fetchone()
        if not user or not user['Email']:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลอีเมลผู้ใช้งาน"}), 404

        if user['VerifyCode'] and user['VerifyExpire'] and datetime.now() < user['VerifyExpire']:
            return jsonify({"success": True, "message": "ใช้รหัสยืนยันเดิมที่ระบบส่งให้ก่อนหน้านี้ได้เลย"}), 200

        code = str(random.randint(100000, 999999))
        expire_time = datetime.now() + timedelta(minutes=10)

        cursor.execute("UPDATE member SET VerifyCode = %s, VerifyExpire = %s WHERE MemberID = %s", (code, expire_time, user_id))
        
        try:
            send_exchange_verify_email(user['Email'], code)
        except Exception as e:
            print(f"⚠️ ส่งอีเมลไม่สำเร็จ: {str(e)}")

        noti_message = f"รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: {code} (รหัสมีอายุ 10 นาที)"
        noti_link = f"/exchange-tracking/{match_id}"
        cursor.execute("""
            INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
            VALUES (%s, %s, %s, 0, NOW())
        """, (user_id, noti_message, noti_link))

        conn.commit()
        return jsonify({"success": True, "message": "ส่งรหัสยืนยันไปยังอีเมลและการแจ้งเตือนเรียบร้อยแล้ว"}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการส่งรหัส: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 9. API: ยืนยันรหัส OTP เพื่อดูเบอร์โทร (POST)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:match_id>/verify-code', methods=['POST'])
def verify_exchange_code(match_id):
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

        if int(user_id) == exchange_data['MemberID']:
            cursor.execute("UPDATE exchange SET IsMemberVerified = 1 WHERE ExchangeID = %s", (match_id,))
            is_member_verified = 1
        elif int(user_id) == exchange_data['TargetMemberID']:
            cursor.execute("UPDATE exchange SET IsTargetMemberVerified = 1 WHERE ExchangeID = %s", (match_id,))
            is_target_verified = 1

        if is_member_verified == 1 and is_target_verified == 1:
            cursor.execute("UPDATE exchange SET ExchangeStatus = 'in_progress' WHERE ExchangeID = %s AND ExchangeStatus = 'accepted'", (match_id,))
            return_msg = "ยืนยันรหัสสำเร็จ! ทั้งสองฝ่ายยืนยันครบแล้ว สามารถดูข้อมูลการติดต่อได้"
        else:
            return_msg = "ยืนยันรหัสสำเร็จ! กรุณารอให้อีกฝ่ายยืนยันตัวตนเพื่อเปิดเผยข้อมูลการติดต่อ"
        
        cursor.execute("UPDATE member SET VerifyCode = NULL, VerifyExpire = NULL WHERE MemberID = %s", (user_id,))
        conn.commit()
        return jsonify({"success": True, "message": return_msg}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการตรวจสอบรหัส: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 10. API: ยกเลิกการแลกเปลี่ยน (PUT)
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:exchange_id>/cancel', methods=['PUT'])
def cancel_exchange(exchange_id):
    data = request.json or {}
    reason = data.get('reason')

    conn = get_connection()
    cursor = conn.cursor()
    try:
        sql = "UPDATE exchange SET ExchangeStatus = 'failed', CancelDate = NOW(), CancelReason = %s WHERE ExchangeID = %s"
        cursor.execute(sql, (reason, exchange_id))
        conn.commit()
        return jsonify({"success": True, "message": "ยกเลิกการแลกเปลี่ยนสำเร็จ"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ==========================================
# 11. API: ยืนยันได้รับสิ่งของและบันทึกรีวิว (PUT)
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
            
        if int(user_id) == ex_data['MemberID']:
            cursor.execute("UPDATE exchange SET IsMemberReceived = 1, Score = %s, Comment = %s WHERE ExchangeID = %s", (score, comment, exchange_id))
            is_member_rec = 1
            is_target_rec = ex_data['IsTargetMemberReceived']
        elif int(user_id) == ex_data['TargetMemberID']:
            cursor.execute("UPDATE exchange SET IsTargetMemberReceived = 1, PartnerScore = %s, PartnerComment = %s WHERE ExchangeID = %s", (score, comment, exchange_id))
            is_member_rec = ex_data['IsMemberReceived']
            is_target_rec = 1
        else:
            return jsonify({"success": False, "message": "คุณไม่มีสิทธิ์ทำรายการนี้"}), 403

        if is_member_rec == 1 and is_target_rec == 1:
            cursor.execute("UPDATE exchange SET ExchangeStatus = 'completed', SuccessDate = NOW() WHERE ExchangeID = %s", (exchange_id,))
            cursor.execute("UPDATE item SET ItemStatus = 'exchanged' WHERE ItemID IN (%s, %s)", (ex_data['MyItemID'], ex_data['TargetItemID']))
            msg = "ทำรายการสำเร็จ! การแลกเปลี่ยนเสร็จสมบูรณ์และซ่อนสิ่งของจากหน้าฟีดแล้ว"
        else:
            msg = "บันทึกรีวิวแล้ว! กรุณารอให้อีกฝ่ายกดยืนยันได้รับสิ่งของ ระบบจึงจะเปลี่ยนสถานะเป็นสำเร็จ"
            
        conn.commit()
        return jsonify({"success": True, "message": msg}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()