from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection
import os

users_bp = Blueprint("users", __name__)
UPLOAD_FOLDER = "uploads"

@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        display_name = request.form.get("DisplayName")
        old_password = request.form.get("OldPassword")
        new_password = request.form.get("NewPassword")
        profile_image = None

        # 1. ตรวจสอบข้อมูลผู้ใช้ในระบบ
        cursor.execute("SELECT * FROM member WHERE MemberID = %s", (user_id,))
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลผู้ใช้งานในระบบ"}), 404

        # 2. ตรวจสอบและจัดการเปลี่ยนรหัสผ่าน
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

            hashed_new_password = generate_password_hash(new_password)

        # 3. จัดการอัปโหลดรูปภาพโปรไฟล์
        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file.filename != "":
                filename = secure_filename(file.filename)
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                profile_image = filename

        # 4. อัปเดตข้อมูลลงฐานข้อมูล
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

        # 5. ดึงข้อมูลผู้ใช้งานที่อัปเดตแล้วส่งกลับไปยัง Frontend
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
        conn.rollback()
        print(f"❌ Update User Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()