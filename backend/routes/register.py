import os
import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
from db import get_connection
from services.email_service import send_verify_email

register_bp = Blueprint("register", __name__, url_prefix="/api/register")

# =========================================================================
# API 1: ขอรหัส OTP (บันทึกแค่อีเมลและ OTP ลงตาราง member ไว้ก่อน โดยสถานะเป็นยังไม่ยืนยัน)
# =========================================================================
@register_bp.route("/request-otp", methods=["POST"])
def request_otp():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"success": False, "message": "กรุณาระบุอีเมล"}), 400

    conn = get_connection()
    cursor = conn.cursor(buffered=True)

    try:
        # ตรวจสอบว่ามีอีเมลนี้ในตาราง member หรือยัง
        cursor.execute("SELECT MemberID, EmailVerified FROM member WHERE Email = %s", (email,))
        user = cursor.fetchone()

        verify_code = str(random.randint(100000, 999999))
        expire = datetime.now() + timedelta(minutes=10) # ให้เวลา 10 นาที

        if user:
            member_id, email_verified = user
            if email_verified == 1:
                return jsonify({"success": False, "message": "อีเมลนี้มีผู้ใช้งานในระบบแล้ว"}), 400
            
            # ถ้าเคยขอ OTP ไว้แล้วแต่ยังไม่ยืนยัน ให้อัปเดตรหัส OTP ใหม่
            cursor.execute("""
                UPDATE member 
                SET VerifyCode = %s, VerifyExpire = %s 
                WHERE MemberID = %s
            """, (verify_code, expire, member_id))
        else:
            # ถ้ายังไม่มีอีเมลในระบบเลย ให้บันทึกแค่อีเมลและ OTP ไปก่อน (คอลัมน์อื่นปล่อย NULL ได้)
            cursor.execute("""
                INSERT INTO member (Email, VerifyCode, VerifyExpire, EmailVerified, MemberStatus, RegisterDate)
                VALUES (%s, %s, %s, 0, 'Pending', %s)
            """, (email, verify_code, expire, datetime.now()))
        
        conn.commit()
    except Exception as e:
        print("❌ DB Error:", str(e))
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดกับฐานข้อมูล"}), 500
    finally:
        cursor.close()
        conn.close()

    try:
        send_verify_email(email, verify_code)
    except Exception as e:
        print("❌ Email Error:", str(e))
        return jsonify({"success": False, "message": "ส่งอีเมลไม่สำเร็จ"}), 500

    return jsonify({"success": True, "message": "ส่งรหัสยืนยันสำเร็จ"})


# =========================================================================
# API 2: ยืนยัน OTP และบันทึกข้อมูลที่เหลือ (รหัสผ่าน, ชื่อ, รูปภาพ)
# =========================================================================
@register_bp.route("/confirm", methods=["POST"])
def confirm_register():
    email = request.form.get("email")
    otp = request.form.get("otp")
    password = request.form.get("password")
    display_name = request.form.get("display_name")
    file = request.files.get("profile_image")

    if not all([email, otp, password, display_name]):
        return jsonify({"success": False, "message": "ข้อมูลไม่ครบถ้วน"}), 400

    conn = get_connection()
    cursor = conn.cursor(buffered=True)

    try:
        # 1. ดึง OTP ปัจจุบันของอีเมลนี้จากตาราง member
        cursor.execute("SELECT MemberID, VerifyCode, VerifyExpire FROM member WHERE Email = %s AND EmailVerified = 0", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"success": False, "message": "ไม่พบการขอรหัส OTP หรือบัญชีนี้ยืนยันไปแล้ว"}), 400
        
        member_id, db_otp, expire_time = user
        
        # 2. ตรวจสอบว่า OTP ตรงไหม และหมดอายุหรือยัง
        if db_otp != otp or datetime.now() > expire_time:
            return jsonify({"success": False, "message": "รหัส OTP ไม่ถูกต้องหรือหมดอายุ"}), 400

        # 3. ถ้า OTP ถูกต้อง ค่อย Hash รหัสผ่าน และจัดการไฟล์รูปภาพ
        password_hash = generate_password_hash(password)
        filename = "default.png"
        if file and file.filename != "":
            filename = secure_filename(file.filename)
            upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            file.save(upload_path)

        # 4. อัปเดตข้อมูลที่เหลือลงในเรคคอร์ดเดิม พร้อมเปลี่ยนสถานะเป็นยืนยันแล้ว
        cursor.execute("""
            UPDATE member 
            SET Password = %s, DisplayName = %s, ProfileImage = %s, 
                EmailVerified = 1, MemberStatus = 'Active', VerifyCode = NULL
            WHERE MemberID = %s
        """, (password_hash, display_name, filename, member_id))
        
        conn.commit()
        return jsonify({"success": True, "message": "สมัครสมาชิกสำเร็จ"})
        
    except Exception as e:
        print("❌ Register Error:", str(e))
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()