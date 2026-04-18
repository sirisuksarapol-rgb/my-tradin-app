from flask import Blueprint, jsonify
from db import get_connection

category_bp = Blueprint("category", __name__)

@category_bp.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ แก้ไขชื่อคอลัมน์ให้ตรงกับฐานข้อมูล (ตัวพิมพ์ใหญ่) 
        # และใช้ AS แปลงเป็นตัวเล็กให้ React นำไปใช้งานต่อได้ง่ายๆ
        cursor.execute("""
            SELECT CategoryID AS category_id, 
                   CategoryName AS category_name
            FROM category
            ORDER BY CategoryID
        """)
        data = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(data)

    except Exception as e:
        print("❌ Error in get_categories:", e) 
        return jsonify({"error": str(e)}), 500