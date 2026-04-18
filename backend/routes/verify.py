from flask import Blueprint, request, jsonify
from db import get_connection
from datetime import datetime

verify_bp = Blueprint(
    "verify",
    __name__,
    url_prefix="/api/verify-email"
)

@verify_bp.route("", methods=["POST"])
def verify_email():
    # 1. รับค่า email และ code (OTP) ที่ React ส่งมาในรูปแบบ JSON
    data = request.json
    email = data.get("email")
    code = data.get("code")

    if not email or not code:
        return jsonify({"success": False, "message": "ข้อมูลไม่ครบถ้วน"}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True) # ใช้ dictionary=True เพื่อให้อ่านชื่อคอลัมน์ง่ายขึ้น

    try:
        # 2. ค้นหาข้อมูลจาก Email (ใช้ชื่อคอลัมน์ให้ตรงกับ DB คือ Email, MemberID, VerifyCode, VerifyExpire)
        cursor.execute("""
            SELECT MemberID, VerifyCode, VerifyExpire 
            FROM member 
            WHERE Email = %s
        """, (email,))
        
        user = cursor.fetchone()

        # ตรวจสอบว่าเจอผู้ใช้ไหม
        if not user:
            return jsonify({"success": False, "message": "ไม่พบอีเมลนี้ในระบบ"}), 404

        # ตรวจสอบว่า OTP ตรงกันไหม
        if user["VerifyCode"] != code:
            return jsonify({"success": False, "message": "รหัส OTP ไม่ถูกต้อง"}), 400

        # ตรวจสอบว่า OTP หมดอายุหรือยัง
        if user["VerifyExpire"] and datetime.now() > user["VerifyExpire"]:
            return jsonify({"success": False, "message": "รหัส OTP หมดอายุแล้ว"}), 400

        # 3. ถ้าถูกต้องทั้งหมด ให้อัปเดตสถานะการยืนยันตัวตน
        cursor.execute("""
            UPDATE member 
            SET EmailVerified = 1, 
                VerifyCode = NULL, 
                VerifyExpire = NULL,
                MemberStatus = 'Active'
            WHERE MemberID = %s
        """, (user["MemberID"],))
        
        conn.commit()
        
        return jsonify({"success": True, "message": "ยืนยันอีเมลสำเร็จ!"}), 200

    except Exception as e:
        print("❌ Database Error (Verify):", str(e))
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดกับฐานข้อมูล"}), 500
    finally:
        cursor.close()
        conn.close()