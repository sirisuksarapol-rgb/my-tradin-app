from flask import Blueprint, jsonify, request
from db import get_connection

# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับหมวดหมู่สินค้า (Category)
category_bp = Blueprint("category", __name__)


# =========================================================================
# 1. ฟังก์ชันดึงข้อมูลหมวดหมู่ทั้งหมดพร้อมนับจำนวนสินค้า (GET /api/categories)
# =========================================================================
@category_bp.route("/api/categories", methods=["GET"])
def get_categories():
    """
    API Endpoint: GET /api/categories
    คำอธิบาย: ดึงข้อมูลหมวดหมู่สินค้าทั้งหมดพร้อมทั้งคำนวณจำนวนสินค้าที่อยู่ในแต่ละหมวดหมู่
    """
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # แก้ไข: เรียกคอลัมน์ด้วยตัวพิมพ์เล็กทั้งหมด แต่ใช้ AS "..." คืนค่าตัวพิมพ์ใหญ่ให้ Frontend
        cursor.execute("""
            SELECT 
                c.categoryid AS "CategoryID", 
                c.categoryname AS "CategoryName", 
                c.iconname AS "IconName",
                COUNT(i.itemid) AS "ItemCount"
            FROM category c
            LEFT JOIN item i ON c.categoryid = i.categoryid
            GROUP BY c.categoryid, c.categoryname, c.iconname
            ORDER BY c.categoryid
        """)
        data = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(data), 200

    except Exception as e:
        print("❌ Error in get_categories:", e) 
        return jsonify({"error": str(e)}), 500

# =========================================================================
# 2. ฟังก์ชันเพิ่มหมวดหมู่ใหม่ (POST /api/categories)
# =========================================================================
@category_bp.route("/api/categories", methods=["POST"])
def add_category():
    """
    API Endpoint: POST /api/categories
    คำอธิบาย: เพิ่มหมวดหมู่สินค้าใหม่เข้าสู่ระบบ
    """
    try:
        data = request.json or {}
        cat_name = data.get('name') or data.get('CategoryName')
        icon_name = data.get('icon') or data.get('IconName') or 'MoreHorizontal'

        # ตรวจสอบการกรอกชื่อหมวดหมู่
        if not cat_name:
            return jsonify({"success": False, "message": "กรุณาระบุชื่อหมวดหมู่"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        
        # บันทึกข้อมูลหมวดหมู่ใหม่ลงฐานข้อมูล (ใช้ตัวพิมพ์เล็ก)
        cursor.execute(
            "INSERT INTO category (categoryname, iconname) VALUES (%s, %s)", 
            (cat_name, icon_name)
        )
        conn.commit()
        
        cursor.close()  
        conn.close()
        return jsonify({"success": True, "message": "เพิ่มหมวดหมู่สำเร็จ"}), 201

    except Exception as e:
        print("❌ Error in add_category:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# =========================================================================
# 3. ฟังก์ชันแก้ไขข้อมูลหมวดหมู่ (PUT /api/categories/<id>)
# =========================================================================
@category_bp.route("/api/categories/<int:id>", methods=["PUT"])
def update_category(id):
    """
    API Endpoint: PUT /api/categories/<id>
    คำอธิบาย: อัปเดตและแก้ไขชื่อหรือไอคอนของหมวดหมู่สินค้าตามรหัส ID ที่ระบุ
    """
    try:
        data = request.json or {}
        cat_name = data.get('name') or data.get('CategoryName')
        icon_name = data.get('icon') or data.get('IconName') or 'MoreHorizontal'

        # ตรวจสอบการกรอกชื่อหมวดหมู่
        if not cat_name:
            return jsonify({"success": False, "message": "กรุณาระบุชื่อหมวดหมู่"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # อัปเดตข้อมูลหมวดหมู่ในฐานข้อมูล (ใช้ตัวพิมพ์เล็ก)
        cursor.execute(
            "UPDATE category SET categoryname = %s, iconname = %s WHERE categoryid = %s",
            (cat_name, icon_name, id)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "อัปเดตหมวดหมู่สำเร็จ"}), 200

    except Exception as e:
        print("❌ Error in update_category:", e)
        return jsonify({"success": False, "error": str(e)}), 500


# =========================================================================
# 4. ฟังก์ชันลบหมวดหมู่ (DELETE /api/categories/<id>)
# =========================================================================
@category_bp.route("/api/categories/<int:id>", methods=["DELETE"])
def delete_category(id):
    """
    API Endpoint: DELETE /api/categories/<id>
    คำอธิบาย: ลบหมวดหมู่สินค้าออกจากระบบตามรหัส ID ที่ระบุ
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # ลบข้อมูลหมวดหมู่ตามรหัส ID (ใช้ตัวพิมพ์เล็ก)
        cursor.execute("DELETE FROM category WHERE categoryid = %s", (id,))
        conn.commit()
        
        # ตรวจสอบว่ามีแถวข้อมูลถูกลบไปจริงหรือไม่
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