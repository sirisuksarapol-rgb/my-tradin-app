import datetime
import jwt
from flask import Blueprint, jsonify, request
from db import get_connection
from werkzeug.security import check_password_hash

# ==========================================
# LOGIN BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint กำหนดให้ API หมวดนี้ขึ้นต้นด้วย /api/login
login_bp = Blueprint("login", __name__, url_prefix="/api/login")

# กุญแจลับสำหรับสร้างและถอดรหัส JWT Token
SECRET_KEY = "tradin_super_secret_key_2026_secure_long_key_for_jwt"


# ==========================================
# 1. API: เข้าสู่ระบบ (LOGIN)
# ==========================================
@login_bp.route("", methods=["POST"])
def login():
    """
    API Endpoint: POST /api/login
    คำอธิบาย: จัดการกระบวนการเข้าสู่ระบบ (Authentication) สำหรับทั้งผู้ใช้งานทั่วไป (Member) และผู้ดูแลระบบ (Admin)
    
    รายละเอียดการทำงาน:
    1. รับข้อมูล JSON Request (อีเมลและรหัสผ่าน) และตรวจสอบความครบถ้วนเบื้องต้น
    2. ค้นหาข้อมูลในตาราง member หากพบจะตรวจสอบรหัสผ่าน (รองรับทั้งแบบ Hash และ Plain text)
    3. หากรหัสผ่านถูกต้อง จะสร้าง JWT Token (อายุการใช้งาน 24 ชั่วโมง) พร้อมกำหนดสิทธิ์ role เป็น 'member' และส่งคืนข้อมูลผู้ใช้
    4. หากไม่พบข้อมูลในตาราง member จะทำการค้นหาต่อในตาราง admin (ผู้ดูแลระบบ)
    5. หากพบในตาราง admin และรหัสผ่านถูกต้อง จะสร้าง JWT Token พร้อมกำหนดสิทธิ์ role เป็น 'admin' และส่งคืนข้อมูล
    6. หากไม่พบข้อมูลในทั้งสองตารางหรือรหัสผ่านไม่ถูกต้อง จะคืนค่าสถานะ 401
    7. จัดการข้อผิดพลาดของระบบด้วย Try-Except และปิดการเชื่อมต่อฐานข้อมูลในบล็อก Finally อย่างปลอดภัย
    """
    # 1. รับและตรวจสอบข้อมูลเบื้องต้นจาก Request Body
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "ไม่พบข้อมูล"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "กรุณากรอกอีเมลและรหัสผ่าน"
        }), 400

    conn = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # =====================================================
        # 2. ตรวจสอบข้อมูลในตาราง Member (ผู้ใช้งานทั่วไป)
        # =====================================================
        cursor.execute("""
            SELECT
                MemberID,
                Email,
                DisplayName,
                ProfileImage,
                Password,
                MemberStatus,
                SuspendedUntil,
                SuspendReason
            FROM member
            WHERE Email = %s
        """, (email,))

        member = cursor.fetchone()

        if member:
            if member.get("MemberStatus") == "Suspended":
                suspended_until = member.get("SuspendedUntil")
                reason = member.get("SuspendReason") or "ละเมิดเงื่อนไขการใช้งาน"
                
                # ตรวจสอบว่าพ้นกำหนดแบนชั่วคราวหรือยัง (กรณีระงับชั่วคราว)
                if suspended_until and datetime.datetime.now() > suspended_until:
                    # (ทางเลือก) สามารถเขียนโค้ดเคลียร์สถานะกลับเป็น Active ตรงนี้ได้ หรือให้แอดมินกดปลดแบน
                    pass
                else:
                    return jsonify({
                        "success": False,
                        "message": "บัญชีของคุณถูกระงับการใช้งาน",
                        "reason": reason,
                        "suspended_until": suspended_until.strftime('%d/%m/%Y %H:%M น.') if suspended_until else "ถาวร"
                    }), 403
                    
            stored_password = member["Password"]

            # ตรวจสอบรหัสผ่าน (รองรับทั้งแบบเข้ารหัส Hash และแบบข้อความธรรมดา)
            if stored_password.startswith(("pbkdf2:", "scrypt:")):
                valid = check_password_hash(stored_password, password)
            else:
                valid = (stored_password == password)

            if not valid:
                return jsonify({
                    "success": False,
                    "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                }), 401

            # สร้าง Payload สำหรับฝังใน Token (กำหนดอายุการใช้งาน 24 ชั่วโมง)
            payload = {
                "member_id": member["MemberID"],
                "role": "member",
                "email": member["Email"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }

            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            return jsonify({
                "success": True,
                "role": "member",
                "message": "เข้าสู่ระบบสำเร็จ",
                "token": token,
                "user": {
                    "MemberID": member["MemberID"],
                    "Email": member["Email"],
                    "DisplayName": member["DisplayName"],
                    "ProfileImage": member["ProfileImage"]
                }
            }), 200

        # =====================================================
        # 3. ตรวจสอบข้อมูลในตาราง Admin (ผู้ดูแลระบบ)
        # =====================================================
        cursor.execute("""
            SELECT
                AdminID,
                AdminName,
                Email,
                Password
            FROM admin
            WHERE Email = %s
        """, (email,))

        admin = cursor.fetchone()

        if admin:
            stored_password = admin["Password"]

            if stored_password.startswith(("pbkdf2:", "scrypt:")):
                valid = check_password_hash(stored_password, password)
            else:
                valid = (stored_password == password)

            if not valid:
                return jsonify({
                    "success": False,
                    "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                }), 401

            payload = {
                "admin_id": admin["AdminID"],
                "role": "admin",
                "email": admin["Email"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }

            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

            return jsonify({
                "success": True,
                "role": "admin",
                "message": "เข้าสู่ระบบผู้ดูแลสำเร็จ",
                "token": token,
                "user": {
                    "AdminID": admin["AdminID"],
                    "AdminName": admin["AdminName"],
                    "Email": admin["Email"]
                }
            }), 200

        # =====================================================
        # 4. กรณีไม่พบข้อมูลทั้งในตาราง Member และ Admin
        # =====================================================
        return jsonify({
            "success": False,
            "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        }), 401

    except Exception as e:
        print("Login Error:", e)
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์"
        }), 500

    finally:
        if conn:
            conn.close()