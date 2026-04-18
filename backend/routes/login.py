import jwt
import datetime
from flask import Blueprint, request, jsonify
from db import get_connection
from werkzeug.security import check_password_hash

login_bp = Blueprint("login", __name__, url_prefix="/api/login")

# 1. แก้ไข SECRET_KEY ให้ยาวขึ้น (เกิน 32 ตัวอักษร) เพื่อแก้คำเตือน InsecureKeyLength
SECRET_KEY = "tradin_super_secret_key_2026_secure_long_key_for_jwt" 

@login_bp.route("", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"success": False, "message": "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน"}), 400

    email = data.get("email")
    password = data.get("password")
    conn = None 

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 2. เพิ่ม ProfileImage เข้าไปในคำสั่ง SELECT ตรงนี้ครับ
        cursor.execute("""
            SELECT MemberID, Email, DisplayName, ProfileImage, Password 
            FROM member
            WHERE Email = %s
        """, (email,))
        user = cursor.fetchone()
        cursor.close()

        if not user:
            return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

        stored_password = user["Password"]
        is_valid_password = False

        if stored_password.startswith(("pbkdf2:", "scrypt:")):
            is_valid_password = check_password_hash(stored_password, password)
        else:
            is_valid_password = (stored_password == password)

        if not is_valid_password:
            return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

        # สร้าง JWT Token
        payload = {
            "member_id": user["MemberID"],
            "email": user["Email"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24) 
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        # 3. ตอนนี้ user["ProfileImage"] จะมีค่าแล้ว เพราะเรา SELECT มาแล้วครับ
        return jsonify({
            "success": True,
            "message": "เข้าสู่ระบบสำเร็จ",
            "token": token, # อย่าลืมส่ง token กลับไปด้วยถ้า React ต้องใช้
            "user": {
                "MemberID": user["MemberID"],
                "Email": user["Email"],
                "DisplayName": user["DisplayName"],
                "ProfileImage": user["ProfileImage"] 
            }
        }), 200

    except Exception as e:
        print("Backend Login Error:", str(e))
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์"}), 500
        
    finally:
        if conn:
            conn.close()