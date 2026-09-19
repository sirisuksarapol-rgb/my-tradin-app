import os
import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import cloudinary
import cloudinary.uploader

from db import get_connection
from services.email_service import send_verify_email

# ==========================================
# REGISTER BLUEPRINT CONFIGURATION
# ==========================================
register_bp = Blueprint(
    "register",
    __name__,
    url_prefix="/api/register"
)

# ตั้งค่า Cloudinary โดยดึงค่าจาก Environment Variables บน Render
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


# =========================================================================
# 1. API: สมัครสมาชิกใหม่ (POST /api/register)
# =========================================================================
@register_bp.route("", methods=["POST"])
def register():
    email = request.form.get("email")
    password = request.form.get("password")
    display_name = request.form.get("display_name")
    file = request.files.get("profile_image")

    if not email or not password or not display_name:
        return jsonify({
            "success": False,
            "message": "กรอกข้อมูลไม่ครบถ้วน กรุณากรอกอีเมล รหัสผ่าน และชื่อที่แสดง"
        }), 400

    password_hash = generate_password_hash(password)

    # เปลี่ยนจากการเซฟไฟล์ลงเครื่อง มาอัปโหลดขึ้น Cloudinary แทน
    profile_image_url = "default.png"
    if file and file.filename != "":
        try:
            upload_result = cloudinary.uploader.upload(file)
            profile_image_url = upload_result.get("secure_url", "default.png")
        except Exception as e:
            print("❌ Cloudinary Upload Error:", str(e))

    verify_code = str(random.randint(100000, 999999))
    expire = datetime.now() + timedelta(minutes=30)
    current_time = datetime.now()

    conn = get_connection()
    cursor = conn.cursor() 

    try:
        cursor.execute("SELECT memberid, emailverified FROM member WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            member_id, email_verified = existing_user

            if email_verified == 1:
                return jsonify({
                    "success": False,
                    "message": "อีเมลนี้ถูกใช้งานและยืนยันตัวตนในระบบแล้ว"
                }), 400
            
            cursor.execute("""
                UPDATE member 
                SET password = %s, displayname = %s, profileimage = %s, 
                    verifycode = %s, verifyexpire = %s, registerdate = %s
                WHERE memberid = %s
            """, (
                password_hash,
                display_name,
                profile_image_url,
                verify_code,
                expire,
                current_time,
                member_id
            ))
        else:
            cursor.execute("""
                INSERT INTO member (
                    email, password, displayname, profileimage,
                    verifycode, verifyexpire, emailverified, registerdate, memberstatus
                )
                VALUES (%s, %s, %s, %s, %s, %s, 0, %s, 'Pending')
            """, (
                email,
                password_hash,
                display_name,
                profile_image_url,
                verify_code,
                expire,
                current_time
            ))
            
        conn.commit()
    except Exception as e:
        print("❌ Database Error:", str(e))
        return jsonify({
            "success": False,
            "message": f"เกิดข้อผิดพลาดกับฐานข้อมูล: {str(e)}"
        }), 400
    finally:
        cursor.close()
        conn.close()

    try:
        send_verify_email(email, verify_code)
    except Exception as e:
        print("❌ Email Error:", str(e))

    return jsonify({
        "success": True,
        "message": "ส่งรหัสยืนยันสำเร็จ กรุณาตรวจสอบรหัส OTP ในอีเมลของคุณ"
    }), 200