import jwt
import datetime
from flask import Blueprint, request, jsonify
from db import get_connection
from werkzeug.security import check_password_hash
from services.notification_service import notify_user

# สร้าง Blueprint กำหนดให้ API หมวดนี้ขึ้นต้นด้วย /api/login
login_bp = Blueprint("login", __name__, url_prefix="/api/login")

# กุญแจลับสำหรับสร้างและถอดรหัส JWT Token (ห้ามทำหลุดเด็ดขาด)
SECRET_KEY = "tradin_super_secret_key_2026_secure_long_key_for_jwt"

@login_bp.route("", methods=["POST"])
def login():
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

        # 1. ดึงข้อมูล Member พร้อมสถานะการระงับบัญชี
        cursor.execute("""
            SELECT
                MemberID, Email, DisplayName, ProfileImage, Password,
                MemberStatus, SuspendedUntil, SuspendReason
            FROM member
            WHERE Email=%s
        """, (email,))
        member = cursor.fetchone()

        if member:
            stored_password = member["Password"]
            if stored_password.startswith(("pbkdf2:", "scrypt:")):
                valid = check_password_hash(stored_password, password)
            else:
                valid = (stored_password == password)

            if not valid:
                return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

            # ======== ตรวจสอบสถานะบัญชีที่ถูกระงับ (Suspended) ========
            if member.get("MemberStatus") == "Suspended":
                reason = member.get("SuspendReason") or "ละเมิดเงื่อนไขของระบบ"
                
                # กรณีถูกแบนแบบมีกำหนดเวลา (ชั่วคราว)
                if member.get("SuspendedUntil"):
                    now = datetime.datetime.now()
                    if now < member["SuspendedUntil"]:
                        formatted_date = member["SuspendedUntil"].strftime('%d/%m/%Y เวลา %H:%M น.')
                        # ✅ เปลี่ยนมาส่งข้อมูลแบบแยกตัวแปร
                        return jsonify({
                            "success": False,
                            "reason": reason,
                            "suspended_until": formatted_date
                        }), 403
                    else:
                        # พ้นโทษแบนแล้ว ปลดแบนอัตโนมัติ
                        cursor.execute("""
                            UPDATE member 
                            SET MemberStatus = 'Active', SuspendedUntil = NULL, SuspendReason = NULL 
                            WHERE MemberID = %s
                        """, (member["MemberID"],))
                        conn.commit()
                else:
                    # กรณีถูกแบนแบบถาวร
                    return jsonify({
                        "success": False,
                        "reason": reason,
                        "suspended_until": "ถาวร (ไม่มีกำหนดปลดแบน)"
                    }), 403
            # =======================================================

            # สร้าง Token
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

        # 2. กรณีค้นหาใน Admin
        cursor.execute("SELECT AdminID, AdminName, Email, Password FROM admin WHERE Email=%s", (email,))
        admin = cursor.fetchone()

        if admin:
            stored_password = admin["Password"]
            if stored_password.startswith(("pbkdf2:", "scrypt:")):
                valid = check_password_hash(stored_password, password)
            else:
                valid = (stored_password == password)

            if not valid:
                return jsonify({"success": False, "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"}), 401

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
            
# ======================================
# 6. ระงับสิทธิ์ผู้ใช้งาน / แบน (PUT)
# ======================================
@login_bp.route("/users/<int:member_id>/suspend", methods=["PUT"])
def suspend_user(member_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    data = request.get_json(silent=True) or {}
    suspend_type = data.get("type", "permanent")  # 'temporary' หรือ 'permanent'
    days = data.get("days", 0)
    reason = data.get("reason", "ละเมิดเงื่อนไขข้อตกลงของระบบ")

    try:
        suspended_until = None
        if suspend_type == "temporary" and int(days) > 0:
            suspended_until = datetime.datetime.now() + datetime.timedelta(days=int(days))
            msg_detail = f"เป็นเวลา {days} วัน (ถึงวันที่ {suspended_until.strftime('%d/%m/%Y %H:%M น.')})"
        else:
            msg_detail = "อย่างถาวร"

        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Suspended', SuspendedUntil = %s, SuspendReason = %s 
            WHERE MemberID = %s
        """, (suspended_until, reason, member_id))
        conn.commit()

        # แจ้งเตือนผู้ใช้ผ่านอีเมลและระบบ
        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการระงับสิทธิ์ใช้งาน",
            message=f"บัญชีของคุณถูกระงับการใช้งาน {msg_detail} เนื่องจาก: {reason}",
            link="/contact"
        )

        return jsonify({
            "success": True, 
            "message": f"ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว ({msg_detail})"
        }), 200
    except Exception as e:
        conn.rollback()
        print(f"❌ Error suspending user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ======================================
# 7. คืนสิทธิ์ผู้ใช้งาน / ยกเลิกแบน (PUT)
# ======================================
@login_bp.route("/users/<int:member_id>/unsuspend", methods=["PUT"])
def unsuspend_user(member_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # เคลียร์สถานะกลับเป็น Active และล้างวัน/เหตุผลระงับ
        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Active', SuspendedUntil = NULL, SuspendReason = NULL 
            WHERE MemberID = %s
        """, (member_id,))
        conn.commit()

        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการคืนสิทธิ์ใช้งาน",
            message="บัญชีของคุณได้รับการคืนสิทธิ์การใช้งานแล้ว คุณสามารถเข้าใช้งานและแลกเปลี่ยนสิ่งของได้ตามปกติ",
            link="/"
        )

        return jsonify({"success": True, "message": "คืนสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        print(f"❌ Error unsuspending user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()