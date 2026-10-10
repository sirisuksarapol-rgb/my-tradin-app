import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection

users_bp = Blueprint("users", __name__)
UPLOAD_FOLDER = "uploads"


@users_bp.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    conn = None
    cursor = None

    try:
        display_name = request.form.get("DisplayName")
        old_password = request.form.get("OldPassword")
        new_password = request.form.get("NewPassword")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM member WHERE MemberID = %s",
            (user_id,)
        )
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลผู้ใช้งานในระบบ"
            }), 404

        update_fields = []
        params = []

        if display_name:
            update_fields.append("DisplayName = %s")
            params.append(display_name)

        if new_password:
            if not old_password:
                return jsonify({
                    "success": False,
                    "message": "กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน"
                }), 400

            stored_password = current_user.get("Password", "")
            valid_password = (
                check_password_hash(stored_password, old_password)
                if stored_password.startswith(("pbkdf2:", "scrypt:"))
                else stored_password == old_password
            )

            if not valid_password:
                return jsonify({
                    "success": False,
                    "message": "รหัสผ่านเดิมไม่ถูกต้อง"
                }), 400

            update_fields.append("Password = %s")
            params.append(generate_password_hash(new_password))

        if "profile_image" in request.files:
            file = request.files["profile_image"]

            if file.filename:
                filename = secure_filename(file.filename)
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                file.save(os.path.join(UPLOAD_FOLDER, filename))

                update_fields.append("ProfileImage = %s")
                params.append(filename)

        if update_fields:
            params.append(user_id)

            cursor.execute(
                f"""
                UPDATE member
                SET {", ".join(update_fields)}
                WHERE MemberID = %s
                """,
                tuple(params)
            )
            conn.commit()

        cursor.execute(
            """
            SELECT MemberID, DisplayName, Email, ProfileImage, MemberStatus
            FROM member
            WHERE MemberID = %s
            """,
            (user_id,)
        )
        updated_user = cursor.fetchone()

        return jsonify({
            "success": True,
            "data": updated_user,
            "message": "อัปเดตข้อมูลสำเร็จ"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Update User Error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการอัปเดตข้อมูล"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@users_bp.route("/api/users/<int:user_id>/stats", methods=["GET"])
def get_user_stats(user_id):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                COUNT(
                    CASE
                        WHEN ExchangeStatus IN ('accepted', 'completed')
                        THEN 1
                    END
                ) AS successfulExchanges,
                COALESCE(
                    AVG(
                        CASE
                            WHEN MemberID = %s THEN PartnerScore
                            WHEN TargetMemberID = %s THEN Score
                        END
                    ),
                    0
                ) AS reviewScore
            FROM exchange
            WHERE (MemberID = %s OR TargetMemberID = %s)
              AND ExchangeStatus IN ('accepted', 'completed')
              AND (PartnerScore IS NOT NULL OR Score IS NOT NULL)
            """,
            (user_id, user_id, user_id, user_id)
        )
        stats = cursor.fetchone()

        cursor.execute(
            """
            SELECT
                e.ExchangeID,
                e.SuccessDate AS ReviewDate,
                CASE
                    WHEN e.MemberID = %s THEN e.PartnerScore
                    ELSE e.Score
                END AS Rating,
                CASE
                    WHEN e.MemberID = %s THEN e.PartnerComment
                    ELSE e.Comment
                END AS Comment,
                CASE
                    WHEN e.MemberID = %s
                    THEN COALESCE(target_member.DisplayName, 'ผู้ใช้งานทั่วไป')
                    ELSE COALESCE(requester_member.DisplayName, 'ผู้ใช้งานทั่วไป')
                END AS ReviewerName,
                CASE
                    WHEN e.MemberID = %s
                    THEN target_member.ProfileImage
                    ELSE requester_member.ProfileImage
                END AS ReviewerProfileImage
            FROM exchange e
            LEFT JOIN member requester_member
                ON e.MemberID = requester_member.MemberID
            LEFT JOIN member target_member
                ON e.TargetMemberID = target_member.MemberID
            WHERE (
                (e.MemberID = %s AND e.PartnerScore IS NOT NULL)
                OR
                (e.TargetMemberID = %s AND e.Score IS NOT NULL)
            )
              AND e.ExchangeStatus IN ('accepted', 'completed')
            ORDER BY e.SuccessDate DESC
            """,
            (
                user_id, user_id, user_id, user_id,
                user_id, user_id
            )
        )
        reviews = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": {
                "successfulExchanges": stats["successfulExchanges"] if stats else 0,
                "reviewScore": f"{float(stats['reviewScore']):.1f}" if stats and stats["reviewScore"] is not None else "0.0",
                "reviews": reviews
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get User Stats Error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดึงสถิติผู้ใช้งาน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()