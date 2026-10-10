from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from db import get_connection

verify_bp = Blueprint("verify", __name__, url_prefix="/api/verify-email")


@verify_bp.route("", methods=["POST"])
def verify_email():
    conn = None
    cursor = None

    try:
        data = request.get_json(silent=True) or request.form
        email = data.get("email")
        code = data.get("code")

        if not email or not code:
            return jsonify({
                "success": False,
                "message": "ข้อมูลไม่ครบถ้วน กรุณากรอกอีเมลและรหัส OTP"
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        cursor.execute(
            """
            SELECT MemberID, VerifyCode, VerifyExpire
            FROM member
            WHERE Email = %s
            ORDER BY MemberID DESC
            """,
            (email,)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "ไม่พบอีเมลนี้ในระบบ"
            }), 404

        if str(user["VerifyCode"] or "").strip() != str(code).strip():
            return jsonify({
                "success": False,
                "message": "รหัส OTP ไม่ถูกต้อง"
            }), 400

        if user["VerifyExpire"] and datetime.now() > user["VerifyExpire"]:
            return jsonify({
                "success": False,
                "message": "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่"
            }), 400

        cursor.execute(
            """
            UPDATE member
            SET EmailVerified = 1,
                VerifyCode = NULL,
                VerifyExpire = NULL,
                MemberStatus = 'Active'
            WHERE MemberID = %s
            """,
            (user["MemberID"],)
        )
        conn.commit()

        return jsonify({
            "success": True,
            "message": "ยืนยันอีเมลสำเร็จ!"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Database Error (Verify): {str(e)}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดกับฐานข้อมูล"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()