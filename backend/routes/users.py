import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection

users_bp = Blueprint("users", __name__)
UPLOAD_FOLDER = "uploads"


@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """อัปเดตข้อมูลส่วนตัวของผู้ใช้งาน (ชื่อ, รหัสผ่าน, รูปโปรไฟล์)[cite: 13]"""
    conn = None
    cursor = None
    try:
        display_name = request.form.get("DisplayName")
        old_password = request.form.get("OldPassword")
        new_password = request.form.get("NewPassword")
        profile_image = None

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM member WHERE MemberID = %s", (user_id,))
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลผู้ใช้งานในระบบ"}), 404

        hashed_new_password = None
        if new_password:
            if not old_password:
                return jsonify({"success": False, "message": "กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน"}), 400

            stored_pw = current_user.get("Password", "")
            is_valid = check_password_hash(stored_pw, old_password) if stored_pw.startswith(("pbkdf2:", "scrypt:")) else (stored_pw == old_password)

            if not is_valid:
                return jsonify({"success": False, "message": "รหัสผ่านเดิมไม่ถูกต้อง"}), 400

            hashed_new_password = generate_password_hash(new_password)

        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file.filename != "":
                filename = secure_filename(file.filename)
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                profile_image = filename

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

        if update_fields:
            sql = f"UPDATE member SET {', '.join(update_fields)} WHERE MemberID = %s"
            params.append(user_id)
            cursor.execute(sql, tuple(params))
            conn.commit()

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
        if conn: conn.rollback()
        current_app.logger.error(f"Update User Error: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการอัปเดตข้อมูล"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
        

@users_bp.route('/api/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """ดึงข้อมูลสถิติการแลกเปลี่ยน คะแนนรีวิวเฉลี่ย และรายการรีวิวของผู้ใช้งาน[cite: 13]"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

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
        current_app.logger.error(f"Get User Stats Error: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการดึงสถิติผู้ใช้งาน"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()