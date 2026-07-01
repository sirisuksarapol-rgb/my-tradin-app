import os
import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename

from db import get_connection
from services.email_service import send_verify_email

register_bp = Blueprint(
    "register",
    __name__,
    url_prefix="/api/register"
)

@register_bp.route("", methods=["POST"])
def register():
    # ==========================================
    # 1. รับข้อมูลจาก FormData
    # ==========================================
    email = request.form.get("email")
    password = request.form.get("password")
    display_name = request.form.get("display_name")
    file = request.files.get("profile_image")

    if not email or not password or not display_name:
        return jsonify({
            "success": False,
            "message": "กรอกข้อมูลไม่ครบ"
        }), 400

    # ==========================================
    # 2. Hash Password (ความปลอดภัย)
    # ==========================================
    password_hash = generate_password_hash(password)

    # ==========================================
    # 3. จัดการรูปโปรไฟล์
    # ==========================================
    filename = "default.png"
    if file and file.filename != "":
        filename = secure_filename(file.filename)
        upload_path = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            filename
        )
        file.save(upload_path)

    # ==========================================
    # 4. สร้างรหัสยืนยัน (OTP) และเวลาปัจจุบัน
    # ==========================================
    verify_code = str(random.randint(100000, 999999))
    expire = datetime.now() + timedelta(minutes=30)
    current_time = datetime.now()

    # ==========================================
    # 5. บันทึกลง Database (MySQL)
    # ==========================================
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO member (
                Email, Password, DisplayName, ProfileImage,
                VerifyCode, VerifyExpire, EmailVerified, RegisterDate, MemberStatus
            )
            VALUES (%s, %s, %s, %s, %s, %s, 0, %s, 'Pending')
        """, (
            email,
            password_hash,
            display_name,
            filename,
            verify_code,
            expire,
            current_time
        ))
        conn.commit()
    except Exception as e:
        print("❌ Database Error:", str(e))
        return jsonify({
            "success": False,
            "message": "อีเมลซ้ำหรือเกิดข้อผิดพลาดกับฐานข้อมูล"
        }), 400
    finally:
        cursor.close()
        conn.close()

    # ==========================================
    # 6. ส่งอีเมลยืนยันตัวตน
    # ==========================================
    try:
        send_verify_email(email, verify_code)
    except Exception as e:
        print("❌ Email Error:", str(e))

    return jsonify({
        "success": True,
        "message": "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบรหัส OTP ในอีเมลของคุณ"
    }), 200