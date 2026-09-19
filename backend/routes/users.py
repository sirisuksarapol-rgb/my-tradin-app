import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection

# ==========================================
# USERS BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับการจัดการข้อมูลส่วนตัวผู้ใช้งาน (User Management)
users_bp = Blueprint("users", __name__)

# กำหนดเส้นทางโฟลเดอร์สำหรับจัดเก็บไฟล์รูปโปรไฟล์ที่ผู้ใช้อัปโหลดเข้ามาในระบบ
UPLOAD_FOLDER = "uploads"


# =========================================================================
# 1. API: อัปเดตข้อมูลผู้ใช้งาน (PUT /api/users/<user_id>)
# =========================================================================
@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    API Endpoint: PUT /api/users/<int:user_id>
    คำอธิบาย: อัปเดตข้อมูลส่วนตัวของผู้ใช้งานในระบบ (รองรับการแก้ไขชื่อที่แสดง, เปลี่ยนรหัสผ่าน, และอัปโหลดรูปโปรไฟล์ใหม่)
    
    รายละเอียดการทำงานเชิงลึก:
    1. ดึงข้อมูลฟอร์ม (FormData) ได้แก่ DisplayName, OldPassword, NewPassword และไฟล์รูปภาพ profile_image
    2. ตรวจสอบความถูกต้องว่ามีรหัสผู้ใช้งาน (user_id) นี้อยู่ในฐานข้อมูลจริงหรือไม่ หากไม่พบจะส่งค่าสถานะ 404 กลับไป
    3. ตรวจสอบและประมวลผลกรณีที่มีการขอเปลี่ยนรหัสผ่านใหม่:
       - ตรวจสอบว่ามีการกรอกรหัสผ่านเดิม (OldPassword) มาด้วยหรือไม่
       - ตรวจสอบความถูกต้องของรหัสผ่านเดิมกับค่าที่จัดเก็บไว้ในฐานข้อมูล (รองรับทั้งแบบ Hash และ Plain text)
       - ทำการเข้ารหัสรหัสผ่านใหม่ (Password Hashing) ด้วย werkzeug.security เพื่อความปลอดภัยสูงสุด
    4. ตรวจสอบและจัดการไฟล์รูปโปรไฟล์ใหม่:
       - หากมีการแนบไฟล์มา จะใช้ฟังก์ชัน secure_filename เพื่อความปลอดภัยของชื่อไฟล์
       - ตรวจสอบและสร้างโฟลเดอร์ UPLOAD_FOLDER หากยังไม่มี และบันทึกไฟล์ลงเซิร์ฟเวอร์
    5. สร้างชุดคำสั่ง SQL แบบ Dynamic เพื่ออัปเดตเฉพาะฟิลด์ที่มีการเปลี่ยนแปลงจริงลงในตาราง member
    6. ทำการ commit ข้อมูลลงฐานข้อมูล MySQL และดึงข้อมูลล่าสุดของผู้ใช้ที่ถูกอัปเดตแล้วส่งกลับในรูปแบบ JSON (สถานะ 200)
    7. จัดการบล็อก Exception ด้วยการ Rollback ข้อมูลเมื่อเกิดข้อผิดพลาด และปิดการเชื่อมต่อฐานข้อมูลในบล็อก Finally เสมอ
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # ขั้นตอนที่ 1: ดึงข้อมูลฟอร์มที่ส่งมาจาก Client
        display_name = request.form.get("DisplayName")
        old_password = request.form.get("OldPassword")
        new_password = request.form.get("NewPassword")
        profile_image = None

        # ขั้นตอนที่ 2: ตรวจสอบข้อมูลผู้ใช้เดิมในฐานข้อมูล
        cursor.execute("SELECT * FROM member WHERE MemberID = %s", (user_id,))
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลผู้ใช้งานในระบบ"}), 404

        # ขั้นตอนที่ 3: ตรวจสอบและจัดการกระบวนการเปลี่ยนรหัสผ่านใหม่
        hashed_new_password = None
        if new_password:
            if not old_password:
                return jsonify({"success": False, "message": "กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน"}), 400

            stored_pw = current_user.get("Password", "")
            
            # ตรวจสอบรหัสผ่านเดิม (รองรับทั้งแฮช pbkdf2/scrypt หรือข้อความธรรมดา)
            is_valid = False
            if stored_pw.startswith("pbkdf2:") or stored_pw.startswith("scrypt:"):
                is_valid = check_password_hash(stored_pw, old_password)
            else:
                is_valid = (stored_pw == old_password)

            if not is_valid:
                return jsonify({"success": False, "message": "รหัสผ่านเดิมไม่ถูกต้อง"}), 400

            # เข้ารหัสรหัสผ่านใหม่ก่อนบันทึกลงฐานข้อมูล
            hashed_new_password = generate_password_hash(new_password)

        # ขั้นตอนที่ 4: จัดการอัปโหลดและบันทึกไฟล์รูปภาพโปรไฟล์ใหม่
        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file.filename != "":
                filename = secure_filename(file.filename)
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                profile_image = filename

        # ขั้นตอนที่ 5: รวบรวมฟิลด์ที่ต้องการอัปเดตลงฐานข้อมูลแบบ Dynamic
        update_fields = []
        params = []

        if display_name:
            update_fields.append("DisplayName = %s")
            params.append(display_name)

        if profile_image:
            update_fields.append("ProfileImage = %s")
            params.append(profile_image)

        if hashed_new_password:
            update_fields.append("Password = %s")
            params.append(hashed_new_password)

        # หากมีรายการที่ต้องอัปเดต ให้ประมวลผลคำสั่ง SQL
        if update_fields:
            sql = f"UPDATE member SET {', '.join(update_fields)} WHERE MemberID = %s"
            params.append(user_id)
            cursor.execute(sql, tuple(params))
            conn.commit()

        # ขั้นตอนที่ 6: ดึงข้อมูลผู้ใช้งานล่าสุดที่อัปเดตแล้วส่งกลับไปยัง Frontend
        cursor.execute(
            "SELECT MemberID, DisplayName, Email, ProfileImage, MemberStatus FROM member WHERE MemberID = %s",
            (user_id,)
        )
        updated_user = cursor.fetchone()

        return jsonify({
            "success": True,
            "data": updated_user,
            "message": "อัปเดตข้อมูลสำเร็จ"
        }), 200

    except Exception as e:
        # ยกเลิกการเปลี่ยนแปลงทั้งหมด (Rollback) หากเกิดข้อผิดพลาด
        conn.rollback()
        print(f"❌ Update User Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        # ปิด Cursor และการเชื่อมต่อฐานข้อมูลเพื่อความปลอดภัยของระบบ
        cursor.close()
        conn.close()
        
# =========================================================================
# 2. API: ดึงสถิติและรีวิวของผู้ใช้งาน (GET /api/users/<user_id>/stats)
# =========================================================================
@users_bp.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """
    API Endpoint: GET /api/users/<int:user_id>/stats
    คำอธิบาย: ดึงข้อมูลสถิติการแลกเปลี่ยนสำเร็จ, คะแนนรีวิวเฉลี่ย และรายการรีวิวพร้อมรูปโปรไฟล์ผู้รีวิว
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. คำนวณจำนวนการแลกเปลี่ยนสำเร็จ และคะแนนรีวิวเฉลี่ย
        sql_stats = """
            SELECT 
                COUNT(CASE WHEN ExchangeStatus IN ('accepted', 'completed') THEN 1 END) AS successfulExchanges,
                COALESCE(AVG(
                    CASE 
                        WHEN MemberID = %s THEN PartnerScore 
                        WHEN TargetMemberID = %s THEN Score 
                    END
                ), 0) AS reviewScore
            FROM exchange
            WHERE (MemberID = %s OR TargetMemberID = %s) 
              AND ExchangeStatus IN ('accepted', 'completed')
              AND (PartnerScore IS NOT NULL OR Score IS NOT NULL)
        """
        cursor.execute(sql_stats, (user_id, user_id, user_id, user_id))
        stats = cursor.fetchone()

        successful_exchanges = stats['successfulExchanges'] if stats else 0
        review_score = float(stats['reviewScore']) if stats and stats['reviewScore'] is not None else 0.0

        # 2. ดึงรายการรีวิวและความคิดเห็น พร้อมรูปโปรไฟล์และชื่อของผู้รีวิว
        sql_reviews = """
            SELECT
                e.ExchangeID,
                e.SuccessDate AS ReviewDate,
                CASE WHEN e.MemberID = %s THEN e.PartnerScore ELSE e.Score END AS Rating,
                CASE WHEN e.MemberID = %s THEN e.PartnerComment ELSE e.Comment END AS Comment,
                CASE 
                    WHEN e.MemberID = %s THEN COALESCE(target_member.DisplayName, 'ผู้ใช้งานทั่วไป')
                    ELSE COALESCE(requester_member.DisplayName, 'ผู้ใช้งานทั่วไป')
                END AS ReviewerName,
                CASE 
                    WHEN e.MemberID = %s THEN target_member.ProfileImage
                    ELSE requester_member.ProfileImage
                END AS ReviewerProfileImage
            FROM exchange e
            LEFT JOIN member requester_member ON e.MemberID = requester_member.MemberID
            LEFT JOIN member target_member ON e.TargetMemberID = target_member.MemberID
            WHERE ((e.MemberID = %s AND e.PartnerScore IS NOT NULL) OR (e.TargetMemberID = %s AND e.Score IS NOT NULL))
              AND e.ExchangeStatus IN ('accepted', 'completed')
            ORDER BY e.SuccessDate DESC
        """
        cursor.execute(sql_reviews, (user_id, user_id, user_id, user_id, user_id, user_id))
        reviews = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": {
                "successfulExchanges": successful_exchanges,
                "reviewScore": f"{review_score:.1f}",
                "reviews": reviews
            }
        }), 200

    except Exception as e:
        print(f"❌ Get User Stats Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()