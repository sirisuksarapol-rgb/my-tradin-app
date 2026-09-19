from datetime import datetime
from flask import Blueprint, jsonify, request
from db import get_connection

# ==========================================
# VERIFY EMAIL BLUEPRINT CONFIGURATION
# ==========================================
verify_bp = Blueprint(
    "verify",
    __name__,
    url_prefix="/api/verify-email"
)


# =========================================================================
# 1. API: ยืนยันตัวตนด้วยอีเมลและรหัส OTP (POST /api/verify-email)
# =========================================================================
@verify_bp.route("", methods=["POST"])
def verify_email():
    """
    API Endpoint: POST /api/verify-email
    คำอธิบาย: ตรวจสอบและยืนยันตัวตนผู้ใช้งานด้วยรหัส OTP ผ่านทางอีเมล พร้อมเปิดใช้งานบัญชีผู้ใช้
    """
    data = request.get_json(silent=True) or request.form
    email = data.get("email")
    code = data.get("code")

    print(f"🔍 [DEBUG] รับค่าจาก Client - Email: {email}, Code: {code}")

    if not email or not code:
        print("❌ [DEBUG] ข้อมูลไม่ครบถ้วน")
        return jsonify({
            "success": False, 
            "message": "ข้อมูลไม่ครบถ้วน กรุณากรอกอีเมลและรหัส OTP"
        }), 400

    conn = get_connection()
    # ❌ เอาคำสั่ง buffered=True ออก เพื่อให้ใช้งานกับ PostgreSQL (psycopg2) ได้โดยไม่เกิด Error
    cursor = conn.cursor(dictionary=True)

    try:
        # ใช้ AS "..." เพื่อรักษารูปแบบคีย์ใหญ่-เล็ก ให้โค้ดเดิมด้านล่างยังคงอ่านค่าผ่าน Dictionary ได้
        cursor.execute("""
            SELECT 
                memberid AS "MemberID", 
                verifycode AS "VerifyCode", 
                verifyexpire AS "VerifyExpire" 
            FROM member 
            WHERE email = %s
            ORDER BY memberid DESC 
        """, (email,))
        
        user = cursor.fetchone()

        if not user:
            print("❌ [DEBUG] ไม่พบอีเมลนี้ในระบบ")
            return jsonify({
                "success": False, 
                "message": "ไม่พบอีเมลนี้ในระบบ"
            }), 404

        print(f"🔍 [DEBUG] ข้อมูลใน DB - VerifyCode: {user['VerifyCode']}, Expire: {user['VerifyExpire']}")

        db_code = str(user["VerifyCode"]).strip() if user["VerifyCode"] else ""
        req_code = str(code).strip()

        if db_code != req_code: 
            print(f"❌ [DEBUG] รหัสไม่ตรงกัน! DB: '{db_code}' vs Client: '{req_code}'")
            return jsonify({
                "success": False, 
                "message": "รหัส OTP ไม่ถูกต้อง"
            }), 400

        if user["VerifyExpire"] and datetime.now() > user["VerifyExpire"]:
            print("❌ [DEBUG] รหัส OTP หมดอายุแล้ว")
            return jsonify({
                "success": False, 
                "message": "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่"
            }), 400

        # ใช้ตัวพิมพ์เล็กในคำสั่ง UPDATE
        cursor.execute("""
            UPDATE member 
            SET 
                emailverified = 1, 
                verifycode = NULL, 
                verifyexpire = NULL,
                memberstatus = 'Active'
            WHERE memberid = %s
        """, (user["MemberID"],))
        
        conn.commit()
        
        print("✅ [DEBUG] ยืนยันอีเมลสำเร็จ!")
        return jsonify({
            "success": True, 
            "message": "ยืนยันอีเมลสำเร็จ!"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"❌ [DEBUG] Database Error (Verify): {str(e)}")
        return jsonify({
            "success": False, 
            "message": "เกิดข้อผิดพลาดกับฐานข้อมูล"
        }), 500
        
    finally:
        cursor.close()
        conn.close()