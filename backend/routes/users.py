import os
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import cloudinary
import cloudinary.uploader
from db import get_connection

# ==========================================
# USERS BLUEPRINT CONFIGURATION
# ==========================================
users_bp = Blueprint("users", __name__)

# ตั้งค่า Cloudinary โดยดึงค่าจาก Environment Variables บน Render
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


# =========================================================================
# 1. API: อัปเดตข้อมูลผู้ใช้งาน (PUT /api/users/<user_id>)
# =========================================================================
@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    API Endpoint: PUT /api/users/<int:user_id>
    คำอธิบาย: อัปเดตข้อมูลส่วนตัวของผู้ใช้งานในระบบ พร้อมรองรับการอัปโหลดรูปโปรไฟล์ขึ้น Cloudinary
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        display_name = request.form.get("DisplayName")
        old_password = request.form.get("OldPassword")
        new_password = request.form.get("NewPassword")
        profile_image = None

        cursor.execute("SELECT * FROM member WHERE memberid = %s", (user_id,))
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลผู้ใช้งานในระบบ"}), 404

        hashed_new_password = None
        if new_password:
            if not old_password:
                return jsonify({"success": False, "message": "กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน"}), 400

            # ดึงค่าจากคีย์ตัวพิมพ์เล็ก เพราะใช้ SELECT * ใน PostgreSQL[cite: 18]
            stored_pw = current_user.get("password", "")
            
            is_valid = False
            if stored_pw.startswith("pbkdf2:") or stored_pw.startswith("scrypt:"):
                is_valid = check_password_hash(stored_pw, old_password)
            else:
                is_valid = (stored_pw == old_password)

            if not is_valid:
                return jsonify({"success": False, "message": "รหัสผ่านเดิมไม่ถูกต้อง"}), 400

            hashed_new_password = generate_password_hash(new_password)

        # เปลี่ยนจากการบันทึกไฟล์ลงเซิร์ฟเวอร์ เป็นอัปโหลดขึ้น Cloudinary
        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file.filename != "":
                try:
                    upload_result = cloudinary.uploader.upload(file)
                    profile_image = upload_result.get("secure_url")
                except Exception as e:
                    print(f"❌ Cloudinary Upload Error: {str(e)}")

        # อัปเดตเป็นตัวพิมพ์เล็กในฐานข้อมูล[cite: 18]
        update_fields = []
        params = []

        if display_name:
            update_fields.append("displayname = %s")
            params.append(display_name)

        if profile_image:
            update_fields.append("profileimage = %s")
            params.append(profile_image)

        if hashed_new_password:
            update_fields.append("password = %s")
            params.append(hashed_new_password)

        if update_fields:
            sql = f"UPDATE member SET {', '.join(update_fields)} WHERE memberid = %s"
            params.append(user_id)
            cursor.execute(sql, tuple(params))
            conn.commit()

        # ดึงข้อมูลกลับโดยใช้ AS เพื่อคงโครงสร้างคีย์ตัวพิมพ์ใหญ่-เล็ก ให้ Frontend ใช้งานได้ต่อ[cite: 18]
        cursor.execute(
            """
            SELECT 
                memberid AS "MemberID", 
                displayname AS "DisplayName", 
                email AS "Email", 
                profileimage AS "ProfileImage", 
                memberstatus AS "MemberStatus" 
            FROM member WHERE memberid = %s
            """,
            (user_id,)
        )
        updated_user = cursor.fetchone()

        return jsonify({
            "success": True,
            "data": updated_user,
            "message": "อัปเดตข้อมูลสำเร็จ"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"❌ Update User Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
        
# =========================================================================
# 2. API: ดึงสถิติและรีวิวของผู้ใช้งาน (GET /api/users/<user_id>/stats)
# =========================================================================
@users_bp.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """
    API Endpoint: GET /api/users/<int:user_id>/stats
    คำอธิบาย: ดึงข้อมูลสถิติการแลกเปลี่ยนสำเร็จ, คะแนนรีวิวเฉลี่ย และรายการรีวิวพร้อมรูปโปรไฟล์ผู้รีวิว[cite: 18]
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        sql_stats = """
            SELECT 
                COUNT(CASE WHEN exchangestatus IN ('accepted', 'completed') THEN 1 END) AS "successfulExchanges",
                COALESCE(AVG(
                    CASE 
                        WHEN memberid = %s THEN partnerscore 
                        WHEN targetmemberid = %s THEN score 
                    END
                ), 0) AS "reviewScore"
            FROM exchange
            WHERE (memberid = %s OR targetmemberid = %s) 
              AND exchangestatus IN ('accepted', 'completed')
              AND (partnerscore IS NOT NULL OR score IS NOT NULL)
        """
        cursor.execute(sql_stats, (user_id, user_id, user_id, user_id))
        stats = cursor.fetchone()

        successful_exchanges = stats['successfulExchanges'] if stats else 0
        review_score = float(stats['reviewScore']) if stats and stats['reviewScore'] is not None else 0.0

        sql_reviews = """
            SELECT
                e.exchangeid AS "ExchangeID",
                e.successdate AS "ReviewDate",
                CASE WHEN e.memberid = %s THEN e.partnerscore ELSE e.score END AS "Rating",
                CASE WHEN e.memberid = %s THEN e.partnercomment ELSE e.comment END AS "Comment",
                CASE 
                    WHEN e.memberid = %s THEN COALESCE(target_member.displayname, 'ผู้ใช้งานทั่วไป')
                    ELSE COALESCE(requester_member.displayname, 'ผู้ใช้งานทั่วไป')
                END AS "ReviewerName",
                CASE 
                    WHEN e.memberid = %s THEN target_member.profileimage
                    ELSE requester_member.profileimage
                END AS "ReviewerProfileImage"
            FROM exchange e
            LEFT JOIN member requester_member ON e.memberid = requester_member.memberid
            LEFT JOIN member target_member ON e.targetmemberid = target_member.memberid
            WHERE ((e.memberid = %s AND e.partnerscore IS NOT NULL) OR (e.targetmemberid = %s AND e.score IS NOT NULL))
              AND e.exchangestatus IN ('accepted', 'completed')
            ORDER BY e.successdate DESC
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