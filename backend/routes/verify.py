from flask import Blueprint, request, jsonify
from db import get_connection
from datetime import datetime

# สร้าง Blueprint กำหนดให้ API หมวดนี้ขึ้นต้นด้วย /api/verify-email
verify_bp = Blueprint(
    "verify",
    __name__,
    url_prefix="/api/verify-email"
)

# ==========================================
# API: ยืนยันตัวตนด้วยอีเมลและรหัส OTP (POST)
# ==========================================
@verify_bp.route("", methods=["POST"])
def verify_email():
    # 1. รับค่า (ใช้ get_json แบบ silent ป้องกัน error กรณี header พลาด)
    data = request.get_json(silent=True) or request.form
    email = data.get("email")
    code = data.get("code")

    # พิมพ์ค่าที่รับมาจาก React เพื่อเช็คว่าได้ค่าครบไหม
    print(f"🔍 [DEBUG] รับค่าจาก React - Email: {email}, Code: {code}")

    if not email or not code:
        print("❌ [DEBUG] ข้อมูลไม่ครบถ้วน")
        return jsonify({
            "success": False, 
            "message": "ข้อมูลไม่ครบถ้วน"
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True, buffered=True) #[cite: 6]

    try:
        # 2. ค้นหาข้อมูลจาก Email (เพิ่ม ORDER BY DESC เพื่อเอาอันที่เพิ่งสมัครล่าสุดเสมอ)
        cursor.execute("""
            SELECT MemberID, VerifyCode, VerifyExpire 
            FROM member 
            WHERE Email = %s
            ORDER BY MemberID DESC 
        """, (email,))
        
        user = cursor.fetchone() #[cite: 6]

        # ตรวจสอบว่าเจอผู้ใช้ไหม
        if not user:
            print("❌ [DEBUG] ไม่พบอีเมลนี้ในระบบ")
            return jsonify({
                "success": False, 
                "message": "ไม่พบอีเมลนี้ในระบบ"
            }), 404

        print(f"🔍 [DEBUG] ข้อมูลใน DB - VerifyCode: {user['VerifyCode']}, Expire: {user['VerifyExpire']}")

        # 3. คลีนข้อมูลก่อนเทียบ: ลบช่องว่างซ้ายขวาด้วย .strip() และแปลงเป็น String
        db_code = str(user["VerifyCode"]).strip() if user["VerifyCode"] else ""
        req_code = str(code).strip()

        # ตรวจสอบว่า OTP ตรงกันไหม
        if db_code != req_code: 
            print(f"❌ [DEBUG] รหัสไม่ตรง! DB: '{db_code}' vs React: '{req_code}'")
            return jsonify({
                "success": False, 
                "message": "รหัส OTP ไม่ถูกต้อง"
            }), 400

        # ตรวจสอบว่า OTP หมดอายุหรือยัง
        if user["VerifyExpire"] and datetime.now() > user["VerifyExpire"]: #[cite: 6]
            print("❌ [DEBUG] รหัสหมดอายุ")
            return jsonify({
                "success": False, 
                "message": "รหัส OTP หมดอายุแล้ว"
            }), 400

        # 4. ถ้าถูกต้องทั้งหมด ให้อัปเดตสถานะการยืนยันตัวตน
        cursor.execute("""
            UPDATE member 
            SET 
                EmailVerified = 1, 
                VerifyCode = NULL, 
                VerifyExpire = NULL,
                MemberStatus = 'Active'
            WHERE MemberID = %s
        """, (user["MemberID"],))
        
        conn.commit() #[cite: 6]
        
        print("✅ [DEBUG] ยืนยันอีเมลสำเร็จ!")
        return jsonify({
            "success": True, 
            "message": "ยืนยันอีเมลสำเร็จ!"
        }), 200

    except Exception as e:
        conn.rollback() #[cite: 6]
        print(f"❌ [DEBUG] Database Error (Verify): {str(e)}") #[cite: 6]
        return jsonify({
            "success": False, 
            "message": "เกิดข้อผิดพลาดกับฐานข้อมูล"
        }), 500
        
    finally:
        cursor.close() #[cite: 6]
        conn.close() #[cite: 6]
        
