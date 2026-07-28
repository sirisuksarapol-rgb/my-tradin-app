from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from db import get_connection
import os

# สร้าง Blueprint สำหรับจัดการ API ที่เกี่ยวกับผู้ใช้งาน
users_bp = Blueprint("users", __name__)

UPLOAD_FOLDER = "uploads"

# ==========================================
# API: อัปเดตข้อมูลโปรไฟล์ผู้ใช้งาน (PUT)
# ==========================================
@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # รับข้อมูลจาก FormData (เพราะอาจมีการส่งไฟล์รูปภาพมาด้วย)
        display_name = request.form.get("DisplayName")
        profile_image = None

        # 1. จัดการอัปโหลดรูปภาพ (ถ้ามีการส่งมา)
        if "profile_image" in request.files:
            file = request.files["profile_image"]

            if file.filename != "":
                # กรองชื่อไฟล์ให้ปลอดภัย
                filename = secure_filename(file.filename)
                
                # ตรวจสอบและสร้างโฟลเดอร์ถ้ายังไม่มี
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)

                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)

                profile_image = filename

        # 2. แยกคำสั่ง SQL ตามกรณีว่ามีการเปลี่ยนรูปภาพหรือไม่
        if profile_image:
            sql = """
                UPDATE member
                SET
                    DisplayName = %s,
                    ProfileImage = %s
                WHERE MemberID = %s
            """
            cursor.execute(sql, (display_name, profile_image, user_id))
        else:
            sql = """
                UPDATE member
                SET DisplayName = %s
                WHERE MemberID = %s
            """
            cursor.execute(sql, (display_name, user_id))

        conn.commit()

        # 3. ดึงข้อมูลที่อัปเดตล่าสุดเพื่อส่งกลับไปให้ Frontend ไปแสดงผล
        cursor.execute(
            """
            SELECT *
            FROM member
            WHERE MemberID = %s
            """,
            (user_id,)
        )
        updated_user = cursor.fetchone()

        return jsonify({
            "success": True,
            "data": updated_user
        }), 200

    except Exception as e:
        # ยกเลิกคำสั่งทั้งหมดหากเกิดข้อผิดพลาด
        conn.rollback()
        print(f"❌ Update User Error: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        # คืนทรัพยากรการเชื่อมต่อฐานข้อมูลเสมอ
        cursor.close()
        conn.close()