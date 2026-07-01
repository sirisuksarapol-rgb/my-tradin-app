from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from db import get_connection
import os

users_bp = Blueprint("users", __name__)

UPLOAD_FOLDER = "uploads"

@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        display_name = request.form.get("DisplayName")

        profile_image = None

        if "profile_image" in request.files:
            file = request.files["profile_image"]

            if file.filename != "":
                filename = secure_filename(file.filename)

                os.makedirs(UPLOAD_FOLDER, exist_ok=True)

                filepath = os.path.join(
                    UPLOAD_FOLDER,
                    filename
                )

                file.save(filepath)

                profile_image = filename

        if profile_image:
            sql = """
            UPDATE member
            SET
                DisplayName=%s,
                ProfileImage=%s
            WHERE MemberID=%s
            """

            cursor.execute(
                sql,
                (
                    display_name,
                    profile_image,
                    user_id
                )
            )

        else:
            sql = """
            UPDATE member
            SET DisplayName=%s
            WHERE MemberID=%s
            """

            cursor.execute(
                sql,
                (
                    display_name,
                    user_id
                )
            )

        conn.commit()

        cursor.execute(
            """
            SELECT *
            FROM member
            WHERE MemberID=%s
            """,
            (user_id,)
        )

        updated_user = cursor.fetchone()

        return jsonify({
            "success": True,
            "data": updated_user
        })

    except Exception as e:
        conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()