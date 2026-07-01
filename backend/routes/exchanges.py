from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_connection

exchanges_bp = Blueprint('exchanges', __name__)

# ==========================================
# 1. API: ดึงรายการการแลกเปลี่ยนทั้งหมด (GET)
# ==========================================
@exchanges_bp.route('/api/exchanges', methods=['GET'])
def get_exchanges():
    # รองรับการส่งทั้งสองแบบจาก Frontend เพื่อความยืดหยุ่น
    member_id = request.args.get('member_id') 
    target_member_id = request.args.get('target_member_id')
    
    # ดึง ID ของผู้ใช้งานปัจจุบันที่เปิดหน้านั้นๆ อยู่มาเป็น Context หลักในการสลับข้อมูลฝั่ง "ฉัน/เขา"
    current_user_id = member_id or target_member_id
    
    if not current_user_id:
        return jsonify({"success": False, "message": "กรุณาระบุ member_id หรือ target_member_id ใน Query Parameter"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) 
    
    try:
        # ปรับตรรกะ SQL dynamically:
        if target_member_id and not member_id:
            where_clause = "WHERE e.TargetMemberID = %s"
            query_params = (current_user_id, current_user_id, current_user_id, current_user_id, current_user_id, current_user_id)
        else:
            where_clause = "WHERE e.MemberID = %s OR e.TargetMemberID = %s"
            query_params = (current_user_id, current_user_id, current_user_id, current_user_id, current_user_id, current_user_id, current_user_id)

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
                e.StartDate,
                
                -- สลับฝั่งชื่อสิ่งของตามมุมมองของ User ที่ Request เข้ามา
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                    ELSE IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                END AS myPostTitle,
                
                -- สลับฝั่งรูปภาพ
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(my_item.ItemImage, '')
                    ELSE IFNULL(their_item.ItemImage, '')
                END AS myPostImage,
                
                -- สิ่งของของฝั่งตรงข้าม
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                    ELSE IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                END AS theirPostTitle,
                
                CASE 
                    WHEN e.MemberID = %s THEN IFNULL(their_item.ItemImage, '')
                    ELSE IFNULL(my_item.ItemImage, '')
                END AS theirPostImage,

                -- ชื่อผู้ใช้งานของฝั่งตรงข้าม
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
            # แปลงพวกฟิลด์ Datetime เป็น String ป้องกัน JSON Error
            if ex.get('StartDate'):
                ex['StartDate'] = ex['StartDate'].strftime('%Y-%m-%d %H:%M:%S')

            if str(ex['MemberID']) == str(current_user_id):
                ex['myItemID'] = ex['MyItemID']
                ex['theirItemID'] = ex['TargetItemID']
            else:
                ex['myItemID'] = ex['TargetItemID']
                ex['theirItemID'] = ex['MyItemID']
                
            if ex['myPostImage'] in [None, 'null', 'undefined', 'None']:
                ex['myPostImage'] = ''
            if ex['theirPostImage'] in [None, 'null', 'undefined', 'None']:
                ex['theirPostImage'] = ''
        
        return jsonify({
            "success": True, 
            "data": exchanges
        }), 200
        
    except Exception as e:
        print(f"Error fetching exchanges: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 2. API: กดสร้างคำขอแลกเปลี่ยนใหม่ (POST)
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
            "message": f"ข้อมูลไม่ครบถ้วน (ได้รับ -> member_id: {member_id}, target: {target_member_id}, my_item: {my_item_id}, their_item: {their_item_id})"
        }), 400

    try:
        member_id = int(member_id)
        target_member_id = int(target_member_id)
        my_item_id = int(my_item_id)
        their_item_id = int(their_item_id)
    except (ValueError, TypeError) as e:
        return jsonify({
            "success": False, 
            "message": f"รูปแบบ ID ของสมาชิกหรือสิ่งของต้องเป็นตัวเลขเท่านั้น: {str(e)}"
        }), 400
        
    conn = get_connection()
    # 💡 ใช้ dictionary=True เพื่อให้เรียกใช้ชื่อคอลัมน์ตอนดึงข้อความมาต่อประโยคได้ง่าย
    cursor = conn.cursor(dictionary=True) 
    
    try:
        # 1. บันทึกข้อมูลการแลกเปลี่ยนลงตาราง exchange ก่อน
        sql_exchange = """
            INSERT INTO exchange (
                ExchangeLocation, ExchangeStatus, MemberID, TargetMemberID, MyItemID, TargetItemID, PhoneNumber, StartDate
            )
            VALUES (%s, 'pending', %s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(sql_exchange, (location, member_id, target_member_id, my_item_id, their_item_id, phone_number))
        
        # ดึงค่า ID ล่าสุดของการแลกเปลี่ยนเพื่อเอาไปห้อยท้ายลิงก์แจ้งเตือน
        exchange_id = cursor.lastrowid

        # 2. 🔥 [ADDED LOGIC] ดึงชื่อข้อมูลต่างๆ มาประกอบทำประโยคแจ้งเตือนแบบยาว
        sender_name = "ผู้ใช้งานระบบ"
        sender_item_name = "สิ่งของชิ้นใหม่"
        receiver_item_name = "สิ่งของของคุณ"
        
        try:
            # ดึงชื่อคนเสนอแลก (ผู้ใช้งานคนปัจจุบัน)
            cursor.execute("SELECT DisplayName FROM member WHERE MemberID = %s", (member_id,))
            m_res = cursor.fetchone()
            if m_res: sender_name = m_res['DisplayName']
            
            # ดึงชื่อสิ่งของที่เขาเสนอมา (ของของเขา)
            cursor.execute("SELECT ItemName FROM item WHERE ItemID = %s", (my_item_id,))
            i_res1 = cursor.fetchone()
            if i_res1: sender_item_name = i_res1['ItemName']
            
            # ดึงชื่อสิ่งของที่เขาอยากได้ (ของของเรา)
            cursor.execute("SELECT ItemName FROM item WHERE ItemID = %s", (their_item_id,))
            i_res2 = cursor.fetchone()
            if i_res2: receiver_item_name = i_res2['ItemName']
            
        except Exception as fetch_err:
            print(f"⚠️ ดึงข้อมูลมาต่อประโยคแจ้งเตือนไม่สำเร็จ (ใช้ค่า Default): {str(fetch_err)}")

        # 3. 💡 ร้อยเรียงต่อประโยคยาวตามที่คุณต้องการพิมพ์เป๊ะๆ
        custom_message = f"คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! จาก {sender_name} ต้องการแลก {sender_item_name} กับ {receiver_item_name}"
        
        # 4. สั่งบันทึกตัวแจ้งเตือนพร้อมแนบลิงก์ที่ระบุเลข ExchangeID ชัดเจน
        try:
            sql_notif = """
                INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate)
                VALUES (%s, %s, %s, 0, NOW())
            """
            # ลิงก์ห้อยท้ายด้วยรหัสไอดีดีล เช่น /incoming-requests หรือแนะให้เปลี่ยนหน้าไปหน้ารายละเอียดสัญญาแลกเปลี่ยนจริง
            target_link = f"/incoming-requests?id={exchange_id}" 
            cursor.execute(sql_notif, (target_member_id, custom_message, target_link))
        except Exception as err:
            print(f"❌ Notification Insert Error (POST): {str(err)}")
        
        conn.commit()
        return jsonify({
            "success": True, 
            "message": "ส่งคำขอแลกเปลี่ยนสำเร็จเรียบร้อยแล้ว!"
        }), 201
        
    except Exception as e:
        conn.rollback()
        print(f"Error Database INSERT: {str(e)}")
        return jsonify({"success": False, "message": f"ฐานข้อมูลขัดข้อง: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# 3. API: อัปเดตสถานะการแลกเปลี่ยน (PUT) - ตอบรับ หรือ ปฏิเสธ
# ==========================================
@exchanges_bp.route('/api/exchanges/<int:exchange_id>', methods=['PUT'])
def update_exchange_status(exchange_id):
    data = request.json or {}
    action = data.get('action') 
    
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
            sql_update = "UPDATE exchange SET ExchangeStatus = %s, SuccessDate = NOW() WHERE ExchangeID = %s"
        else:
            sql_update = "UPDATE exchange SET ExchangeStatus = %s, CancelDate = NOW() WHERE ExchangeID = %s"
            
        # 🔥 [CRITICAL FIX]: เปลี่ยนจากการยิงคำสั่งผิดตัว (ของเก่าเรียก sql_exchange ค้างไว้) มาเรียกใช้ sql_update จริงๆ
        cursor.execute(sql_update, (new_status, exchange_id))
        
        # 🔥 [FIXED] เพิ่มฟิลด์ Link ปลายทางและเปิดพิมพ์ตรวจสอบ ErrorLog
        try:
            msg = "คำขอแลกเปลี่ยนของคุณได้รับการ 'ตอบรับ' แล้ว! 🎉" if action == 'accept' else "คำขอแลกเปลี่ยนของคุณถูก 'ปฏิเสธ' แล้ว ❌"
            sql_notif = """
                INSERT INTO notification (MemberID, Message, Link, IsRead, CreateDate) 
                VALUES (%s, %s, '/notifications', 0, NOW())
            """
            cursor.execute(sql_notif, (exchange['MemberID'], msg))
        except Exception as err:
            print(f"❌ Notification Insert Error (PUT): {str(err)}")
            
        conn.commit()
        return jsonify({"success": True, "message": f"ทำการ {action} คำขอเรียบร้อยแล้ว"}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error Updating Exchange Status: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ========================================================
# 4. 🔥 [ADDED NEW] API: ดึงรายการแจ้งเตือนทั้งหมด (GET)
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

        return jsonify({
            "success": True,
            "data": notifications
        }), 200
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ========================================================
# 5. 🔥 [ADDED NEW] API: นับจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (GET)
# ========================================================
@exchanges_bp.route('/api/notifications/unread-count', methods=['GET'])
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
        print(f"Error counting unread notifications: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ========================================================
# 6. 🔥 [ADDED NEW] API: อัปเดตแจ้งเตือนเป็น "อ่านแล้ว" (PUT)
# ========================================================
@exchanges_bp.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
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
        print(f"Error updating notification status: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()
    
# ========================================================
# 7. API: ดึงสถิติและข้อมูลรีวิวของผู้ใช้งานจากตาราง exchange
# ========================================================
@exchanges_bp.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. นับจำนวนการแลกเปลี่ยนที่สำเร็จ (นับแถวที่ผู้ใช้เป็นทั้งคนขอ หรือคนรับ และสถานะเป็น 'accepted')
        sql_count = """

SELECT COUNT(*) AS total_success

FROM exchange

WHERE (MemberID = %s OR TargetMemberID = %s)

AND ExchangeStatus IN ('accepted', 'Completed')

"""
        cursor.execute(sql_count, (user_id, user_id))
        count_res = cursor.fetchone()
        successful_exchanges = count_res['total_success'] if count_res else 0

        # 2. ดึงข้อมูลรีวิว (ปรับปรุงใหม่: ให้ดึงได้ทั้งตอนเป็นคนส่งขอ หรือคนรับ และดึงชื่อคู่กรณีผู้รีวิวให้ถูกต้อง)
        sql_reviews = """

SELECT

e.ExchangeID,

e.SuccessDate AS ReviewDate,

e.Comment,

e.Score AS Rating,

CASE

WHEN e.MemberID = %s

THEN COALESCE(target_member.DisplayName, 'ผู้ใช้งานทั่วไป')

ELSE COALESCE(requester_member.DisplayName, 'ผู้ใช้งานทั่วไป')

END AS ReviewerName

FROM exchange e

LEFT JOIN member requester_member

ON e.MemberID = requester_member.MemberID

LEFT JOIN member target_member

ON e.TargetMemberID = target_member.MemberID

WHERE (e.MemberID = %s OR e.TargetMemberID = %s)

AND e.ExchangeStatus IN ('accepted', 'Completed')

AND e.Comment IS NOT NULL

AND e.Comment != ''

ORDER BY e.SuccessDate DESC

"""
        # ⚠️ ส่ง user_id ไป 3 ตัวแปรให้ตรงกับเครื่องหมาย %s ทั้ง 3 จุดใน SQL ด้านบน
        cursor.execute(sql_reviews, (user_id, user_id, user_id))
        reviews_raw = cursor.fetchall()

        total_score = 0
        valid_reviews = []
        
        # 3. จัด Format วันที่ และรวมคะแนนเพื่อหาค่าเฉลี่ย
        for rev in reviews_raw:
            if rev['ReviewDate']:
                rev['ReviewDate'] = rev['ReviewDate'].strftime('%d/%m/%Y %H:%M')
            else:
                rev['ReviewDate'] = 'ไม่มีระบุวันที่'
                
            if rev['Rating'] is not None:
                total_score += float(rev['Rating'])
                valid_reviews.append({
                    "ExchangeID": rev['ExchangeID'],
                    "ReviewDate": rev['ReviewDate'],
                    "Comment": rev['Comment'],
                    "Rating": rev['Rating'],
                    "ReviewerName": rev['ReviewerName']
                })

        # คำนวณคะแนนเฉลี่ยรีวิว (Score) เป็นทศนิยม 1 ตำแหน่ง
        review_score = "0.0"
        if len(valid_reviews) > 0:
            review_score = f"{(total_score / len(valid_reviews)):.1f}"

        # ส่งข้อมูลกลับในรูปแบบ JSON (คีย์ตรงกับ Interface หน้าบ้านเป๊ะ)
        return jsonify({
            "success": True,
            "data": {
                "successfulExchanges": successful_exchanges,
                "reviewScore": review_score,
                "reviews": valid_reviews
            }
        }), 200

    except Exception as e:
        print("❌ Backend Error:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()