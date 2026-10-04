import datetime
import jwt
from flask import Blueprint, jsonify, request, current_app
from db import get_connection
from werkzeug.security import check_password_hash

login_bp = Blueprint("login", __name__, url_prefix="/api/login")
SECRET_KEY = "tradin_super_secret_key_2026_secure_long_key_for_jwt"

@login_bp.route("", methods=["POST"])
def login():
    """
    ตรวจสอบข้อมูลเข้าสู่ระบบสำหรับ Member และ Admin
    หากสำเร็จ จะส่งคืน JWT Token อายุ 24 ชั่วโมง
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "ไม่พบข้อมูล"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "กรุณากรอกอีเมลและรหัสผ่าน"}), 400

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT MemberID, Email, DisplayName, ProfileImage, Password, 
                   MemberStatus, SuspendedUntil, SuspendReason
            FROM member WHERE Email = %s
        """, (email,))
        member = cursor.fetchone()

        if member:
            if member.get("MemberStatus") == "Suspended":
                suspended_until = member.get("SuspendedUntil")
                reason = member.get("SuspendReason") or "ละเมิดเงื่อนไขการใช้งาน"
                
                if not (suspended_until and datetime.datetime.now() > suspended_until):
                    return jsonify({
                        "success": False,
                        "message": "บัญชีของคุณถูกระงับการใช้งาน",
                        "reason": reason,
                        "suspended_until": suspended_until.strftime('%d/%m/%Y %H:%M น.') if suspended_until else "ถาวร"
                    }), 403
                    
            stored_password = member["Password"]
            is_valid_pwd = check_password_hash(stored_password, password) if stored_password.startswith(("pbkdf2:", "scrypt:")) else (stored_password == password)

            if not is_valid_pwd:
                return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

            payload = {
                "member_id": member["MemberID"],
                "role": "member",
                "email": member["Email"],
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
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

        cursor.execute("SELECT AdminID, AdminName, Email, Password FROM admin WHERE Email = %s", (email,))
        admin = cursor.fetchone()

        if admin:
            stored_password = admin["Password"]
            is_valid_pwd = check_password_hash(stored_password, password) if stored_password.startswith(("pbkdf2:", "scrypt:")) else (stored_password == password)

            if not is_valid_pwd:
                return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

            payload = {
                "admin_id": admin["AdminID"],
                "role": "admin",
                "email": admin["Email"],
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
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

        return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

    except Exception as e:
        current_app.logger.error(f"Login Error: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์"}), 500
    finally:
        if conn:
            conn.close()