from flask import Blueprint, request, jsonify, current_app
from db import get_connection
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
import os
import random

from services.email_service import send_verify_email

register_bp = Blueprint(
    "register",
    __name__,
    url_prefix="/api/register"
)

@register_bp.route("", methods=["POST"])
def register():
    # =========================
    # 1. รับข้อมูลจาก FormData
    # =========================
    email = request.form.get("email")
    password = request.form.get("password")
    display_name = request.form.get("display_name")
    file = request.files.get("profile_image")

    if not email or not password or not display_name:
        return jsonify({
            "success": False,
            "message": "กรอกข้อมูลไม่ครบ"
        }), 400

    # =========================
    # 2. Hash Password (Werkzeug)
    # =========================
    password_hash = generate_password_hash(password)

    # =========================
    # 3. จัดการรูปโปรไฟล์
    # =========================
    filename = "default.png"

    if file and file.filename != "":
        filename = secure_filename(file.filename)
        upload_path = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            filename
        )
        file.save(upload_path)

    # =========================
    # 4. สร้างรหัสยืนยัน
    # =========================
    verify_code = str(random.randint(100000, 999999))
    expire = datetime.now() + timedelta(minutes=30)

    # =========================
    # 5. บันทึกลง Database
    # =========================
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # แก้ชื่อคอลัมน์ตรงนี้ให้ตรงกับ Database ของคุณเป๊ะๆ
        cursor.execute("""
            INSERT INTO member
            (Email, Password, DisplayName, ProfileImage,
             VerifyCode, VerifyExpire, EmailVerified)
            VALUES (%s,%s,%s,%s,%s,%s,0)
        """, (
            email,
            password_hash,
            display_name,
            filename,
            verify_code,
            expire
        ))
        conn.commit()
    except Exception as e:
        print("❌ Database Error:", str(e))
        return jsonify({
            "success": False,
            "message": "อีเมลซ้ำหรือเกิดข้อผิดพลาดกับฐานข้อมูล"
        }), 400
    finally:
        # ปิดการเชื่อมต่อฐานข้อมูลเสมอเพื่อป้องกันเซิร์ฟเวอร์ค้าง
        cursor.close()
        conn.close()

    # =========================
    # 6. ส่งอีเมลยืนยัน
    # =========================
    try:
        send_verify_email(email, verify_code)
    except Exception as e:
        print("❌ Email Error:", str(e)) # ถ้าส่งเมลไม่ผ่าน จะได้ไม่พา Database พังไปด้วย

    return jsonify({"success": True}), 200