from flask import Blueprint, jsonify, request
from db import get_connection

category_bp = Blueprint("category", __name__)

# ==========================================
# 1. ดึงข้อมูลหมวดหมู่ทั้งหมดพร้อมจำนวนรายการ (GET)
# ==========================================
@category_bp.route("/api/categories", methods=["GET"])
def get_categories():
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
        data = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(data), 200

    except Exception as e:
        print("❌ Error in get_categories:", e) 
        return jsonify({"error": str(e)}), 500

# ==========================================
# 2. เพิ่มหมวดหมู่ใหม่ (POST)
# ==========================================
@category_bp.route("/api/categories", methods=["POST"])
def add_category():
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
        
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "เพิ่มหมวดหมู่สำเร็จ"}), 201

    except Exception as e:
        print("❌ Error in add_category:", e)
        return jsonify({"success": False, "error": str(e)}), 500

# ==========================================
# 3. แก้ไขหมวดหมู่ (PUT) 
# ==========================================
@category_bp.route("/api/categories/<int:id>", methods=["PUT"])
def update_category(id):
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

        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "อัปเดตหมวดหมู่สำเร็จ"}), 200

    except Exception as e:
        print("❌ Error in update_category:", e)
        return jsonify({"success": False, "error": str(e)}), 500

# ==========================================
# 4. ลบหมวดหมู่ (DELETE)
# ==========================================
@category_bp.route("/api/categories/<int:id>", methods=["DELETE"])
def delete_category(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM category WHERE CategoryID = %s", (id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "ไม่พบหมวดหมู่ที่ต้องการลบ"}), 404
            
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "ลบหมวดหมู่สำเร็จ"}), 200

    except Exception as e:
        print("❌ Error in delete_category:", e)
        return jsonify({"success": False, "error": str(e)}), 500