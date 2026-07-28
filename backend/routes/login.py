import jwt
import datetime
from flask import Blueprint, request, jsonify
from db import get_connection
from werkzeug.security import check_password_hash

# สร้าง Blueprint กำหนดให้ API หมวดนี้ขึ้นต้นด้วย /api/login
login_bp = Blueprint("login", __name__, url_prefix="/api/login")

# กุญแจลับสำหรับสร้างและถอดรหัส JWT Token (ห้ามทำหลุดเด็ดขาด)
SECRET_KEY = "tradin_super_secret_key_2026_secure_long_key_for_jwt"

@login_bp.route("", methods=["POST"])
def login():
    # 1. รับและตรวจสอบข้อมูลเบื้องต้น
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
                Password
            FROM member
            WHERE Email=%s
        """, (email,))

        member = cursor.fetchone()

        if member:
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

            # สร้าง Payload ข้อมูลที่จะฝังไปใน Token (หมดอายุใน 24 ชั่วโมง)
            payload = {
                "member_id": member["MemberID"],
                "role": "member",
                "email": member["Email"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }

            # สร้าง JWT Token
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
        # โค้ดจะทำงานมาถึงตรงนี้ได้ แปลว่าหาอีเมลในตาราง member ไม่เจอ
        cursor.execute("""
            SELECT
                AdminID,
                AdminName,
                Email,
                Password
            FROM admin
            WHERE Email=%s
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
        # 4. กรณีหาไม่เจอทั้ง Member และ Admin
        # =====================================================
        return jsonify({
            "success": False,
            "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        }), 401

    except Exception as e:
        print("Login Error :", e)
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์"
        }), 500

    finally:
        if conn:
            conn.close()