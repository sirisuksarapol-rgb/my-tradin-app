from datetime import datetime
from flask import Blueprint, jsonify, request
from db import get_connection

# ==========================================
# VERIFY EMAIL BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับการยืนยันอีเมลด้วยรหัส OTP
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
    
    รายละเอียดการทำงานเชิงลึก:
    1. รับข้อมูล JSON หรือ Form Data (อีเมลและรหัส OTP) ที่ส่งมาจากฝั่งไคลเอนต์
    2. ตรวจสอบความครบถ้วนของข้อมูลสำคัญ หากไม่มีอีเมลหรือรหัส OTP จะคืนค่าสถานะ 400
    3. เชื่อมต่อฐานข้อมูล MySQL และค้นหาข้อมูลสมาชิกจากอีเมล (เรียงลำดับตาม MemberID ล่าสุด)
    4. ตรวจสอบว่าพบอีเมลในระบบหรือไม่ หากไม่พบจะคืนค่าสถานะ 404
    5. ทำความสะอาดสตริงของรหัส OTP ทั้งจากฐานข้อมูลและที่ผู้ใช้กรอกด้วย .strip() แล้วนำมาเปรียบเทียบกัน
    6. ตรวจสอบเวลาหมดอายุของรหัส OTP (VerifyExpire) ว่าเกินเวลาปัจจุบันหรือไม่ หากหมดอายุจะคืนค่าสถานะ 400
    7. หากข้อมูลถูกต้องทั้งหมด ทำการอัปเดตสถานะในฐานข้อมูล:
       - เปลี่ยน EmailVerified เป็น 1 (ยืนยันตัวตนสำเร็จ)
       - ล้างค่า VerifyCode และ VerifyExpire เป็น NULL
       - เปลี่ยน MemberStatus เป็น 'Active' (เปิดใช้งานบัญชีผู้ใช้)
    8. บันทึกข้อมูล (commit) และคืนค่าข้อความสำเร็จในรูปแบบ JSON (สถานะ 200)
    9. จัดการข้อผิดพลาด (Exception) ด้วยการ rollback และปิดการเชื่อมต่อฐานข้อมูลในบล็อก finally อย่างปลอดภัย
    """
    
    # 1. รับค่าข้อมูลจาก Request (รองรับทั้ง JSON และ Form Data)
    data = request.get_json(silent=True) or request.form
    email = data.get("email")
    code = data.get("code")

    print(f"🔍 [DEBUG] รับค่าจาก Client - Email: {email}, Code: {code}")

    # ตรวจสอบความครบถ้วนของข้อมูลสำคัญ
    if not email or not code:
        print("❌ [DEBUG] ข้อมูลไม่ครบถ้วน")
        return jsonify({
            "success": False, 
            "message": "ข้อมูลไม่ครบถ้วน กรุณากรอกอีเมลและรหัส OTP"
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)

    try:
        # 2. ค้นหาข้อมูลผู้ใช้จาก Email (เลือกรายการล่าสุดด้วย ORDER BY MemberID DESC)
        cursor.execute("""
            SELECT MemberID, VerifyCode, VerifyExpire 
            FROM member 
            WHERE Email = %s
            ORDER BY MemberID DESC 
        """, (email,))
        
        user = cursor.fetchone()

        # ตรวจสอบว่ามีอีเมลนี้อยู่ในระบบหรือไม่
        if not user:
            print("❌ [DEBUG] ไม่พบอีเมลนี้ในระบบ")
            return jsonify({
                "success": False, 
                "message": "ไม่พบอีเมลนี้ในระบบ"
            }), 404

        print(f"🔍 [DEBUG] ข้อมูลใน DB - VerifyCode: {user['VerifyCode']}, Expire: {user['VerifyExpire']}")

        # 3. ทำความสะอาดข้อมูลรหัส OTP ก่อนทำการเปรียบเทียบ (ลบช่องว่างซ้ายขวาและแปลงเป็น String)
        db_code = str(user["VerifyCode"]).strip() if user["VerifyCode"] else ""
        req_code = str(code).strip()

        # ตรวจสอบว่ารหัส OTP ตรงกันหรือไม่
        if db_code != req_code: 
            print(f"❌ [DEBUG] รหัสไม่ตรงกัน! DB: '{db_code}' vs Client: '{req_code}'")
            return jsonify({
                "success": False, 
                "message": "รหัส OTP ไม่ถูกต้อง"
            }), 400

        # ตรวจสอบว่ารหัส OTP หมดอายุแล้วหรือยัง
        if user["VerifyExpire"] and datetime.now() > user["VerifyExpire"]:
            print("❌ [DEBUG] รหัส OTP หมดอายุแล้ว")
            return jsonify({
                "success": False, 
                "message": "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่"
            }), 400

        # 4. หากข้อมูลถูกต้องทั้งหมด ทำการอัปเดตสถานะการยืนยันตัวตนในฐานข้อมูล
        cursor.execute("""
            UPDATE member 
            SET 
                EmailVerified = 1, 
                VerifyCode = NULL, 
                VerifyExpire = NULL,
                MemberStatus = 'Active'
            WHERE MemberID = %s
        """, (user["MemberID"],))
        
        conn.commit()
        
        print("✅ [DEBUG] ยืนยันอีเมลสำเร็จ!")
        return jsonify({
            "success": True, 
            "message": "ยืนยันอีเมลสำเร็จ!"
        }), 200

    except Exception as e:
        # ยกเลิกการเปลี่ยนแปลงทั้งหมดในฐานข้อมูลหากเกิดข้อผิดพลาด
        conn.rollback()
        print(f"❌ [DEBUG] Database Error (Verify): {str(e)}")
        return jsonify({
            "success": False, 
            "message": "เกิดข้อผิดพลาดกับฐานข้อมูล"
        }), 500
        
    finally:
        # ปิด Cursor และการเชื่อมต่อฐานข้อมูลทุกครั้งเพื่อความปลอดภัยและคืนทรัพยากร
        cursor.close()
        conn.close()