from flask import Blueprint, jsonify, request, current_app
from db import get_connection

category_bp = Blueprint("category", __name__)

@category_bp.route("/api/categories", methods=["GET"])
def get_categories():
    """ดึงข้อมูลหมวดหมู่ทั้งหมดพร้อมคำนวณจำนวนสินค้าในแต่ละหมวดหมู่"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                c.CategoryID, 
                c.CategoryName, 
                c.IconName,
                COUNT(i.ItemID) AS ItemCount
            FROM category c
            LEFT JOIN item i ON c.CategoryID = i.CategoryID
            GROUP BY c.CategoryID, c.CategoryName, c.IconName
            ORDER BY c.CategoryID
        """)
        return jsonify(cursor.fetchall()), 200
    except Exception as e:
        current_app.logger.error(f"Error in get_categories: {str(e)}") 
        return jsonify({"error": "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@category_bp.route("/api/categories", methods=["POST"])
def add_category():
    """เพิ่มหมวดหมู่สินค้าใหม่เข้าสู่ระบบ"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        cat_name = data.get('name') or data.get('CategoryName')
        icon_name = data.get('icon') or data.get('IconName') or 'MoreHorizontal'

        if not cat_name:
            return jsonify({"success": False, "message": "กรุณาระบุชื่อหมวดหมู่"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO category (CategoryName, IconName) VALUES (%s, %s)", 
            (cat_name, icon_name)
        )
        conn.commit()
        return jsonify({"success": True, "message": "เพิ่มหมวดหมู่สำเร็จ"}), 201
    except Exception as e:
        current_app.logger.error(f"Error in add_category: {str(e)}")
        return jsonify({"success": False, "error": "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@category_bp.route("/api/categories/<int:id>", methods=["PUT"])
def update_category(id):
    """อัปเดตและแก้ไขชื่อหรือไอคอนของหมวดหมู่สินค้า"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        cat_name = data.get('name') or data.get('CategoryName')
        icon_name = data.get('icon') or data.get('IconName') or 'MoreHorizontal'

        if not cat_name:
            return jsonify({"success": False, "message": "กรุณาระบุชื่อหมวดหมู่"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE category SET CategoryName = %s, IconName = %s WHERE CategoryID = %s",
            (cat_name, icon_name, id)
        )
        conn.commit()
        return jsonify({"success": True, "message": "อัปเดตหมวดหมู่สำเร็จ"}), 200
    except Exception as e:
        current_app.logger.error(f"Error in update_category: {str(e)}")
        return jsonify({"success": False, "error": "เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@category_bp.route("/api/categories/<int:id>", methods=["DELETE"])
def delete_category(id):
    """ลบหมวดหมู่สินค้าออกจากระบบ"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM category WHERE CategoryID = %s", (id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "ไม่พบหมวดหมู่ที่ต้องการลบ"}), 404
            
        return jsonify({"success": True, "message": "ลบหมวดหมู่สำเร็จ"}), 200
    except Exception as e:
        current_app.logger.error(f"Error in delete_category: {str(e)}")
        return jsonify({"success": False, "error": "เกิดข้อผิดพลาดในการลบหมวดหมู่"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()