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

        # แก้ไขโดยใส่เครื่องหมาย " " ครอบชื่อคอลัมน์ เพื่อรองรับตัวพิมพ์ใหญ่-เล็กใน PostgreSQL
        cursor.execute("""
            SELECT 
                c."CategoryID", 
                c."CategoryName", 
                c."IconName",
                COUNT(i."ItemID") AS ItemCount
            FROM category c
            LEFT JOIN item i ON c."CategoryID" = i."CategoryID"
            GROUP BY c."CategoryID", c."CategoryName", c."IconName"
            ORDER BY c."CategoryID"
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
    
    รายละเอียดการทำงาน:
    - รับข้อมูล JSON จาก Request Body เพื่อนำมาสร้างหมวดหมู่ใหม่
    - ตรวจสอบฟิลด์ชื่อหมวดหมู่ (รองรับทั้ง key 'name' และ 'CategoryName')
    - ตรวจสอบฟิลด์ไอคอน (รองรับ 'icon' หรือ 'IconName') หากไม่ระบุจะกำหนดค่าเริ่มต้นเป็น 'MoreHorizontal'
    - ตรวจสอบความถูกต้องว่ามีการระบุชื่อหมวดหมู่มาหรือไม่ หากไม่มีจะคืนค่าสถานะ 400
    - บันทึกข้อมูลลงในตาราง category ด้วยคำสั่ง INSERT และยืนยันการทำรายการ (commit)
    - ส่งข้อความตอบกลับสำเร็จพร้อมรหัสสถานะ 201
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
        
        # บันทึกข้อมูลหมวดหมู่ใหม่ลงฐานข้อมูล
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


# =========================================================================
# 3. ฟังก์ชันแก้ไขข้อมูลหมวดหมู่ (PUT /api/categories/<id>)
# =========================================================================
@category_bp.route("/api/categories/<int:id>", methods=["PUT"])
def update_category(id):
    """
    API Endpoint: PUT /api/categories/<id>
    คำอธิบาย: อัปเดตและแก้ไขชื่อหรือไอคอนของหมวดหมู่สินค้าตามรหัส ID ที่ระบุ
    
    รายละเอียดการทำงาน:
    - รับค่า ID ของหมวดหมู่ผ่าน URL Path Parameter และรับข้อมูลใหม่ผ่าน JSON Body
    - ตรวจสอบชื่อหมวดหมู่ใหม่ (รองรับทั้ง 'name' และ 'CategoryName') และชื่อไอคอน
    - ตรวจสอบว่ามีการระบุชื่อหมวดหมู่หรือไม่ หากว่างจะคืนค่า Error สถานะ 400
    - อัปเดตข้อมูล CategoryName และ IconName ในตาราง category ตาม CategoryID ที่ระบุ
    - บันทึกการเปลี่ยนแปลง (commit) และส่งผลลัพธ์สถานะความสำเร็จกลับไป
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

        # อัปเดตข้อมูลหมวดหมู่ในฐานข้อมูล
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


# =========================================================================
# 4. ฟังก์ชันลบหมวดหมู่ (DELETE /api/categories/<id>)
# =========================================================================
@category_bp.route("/api/categories/<int:id>", methods=["DELETE"])
def delete_category(id):
    """
    API Endpoint: DELETE /api/categories/<id>
    คำอธิบาย: ลบหมวดหมู่สินค้าออกจากระบบตามรหัส ID ที่ระบุ
    
    รายละเอียดการทำงาน:
    - รับรหัส CategoryID ผ่าน URL Path Parameter
    - ดำเนินการลบข้อมูลหมวดหมู่จากตาราง category ด้วยคำสั่ง DELETE ตาม ID ที่กำหนด
    - ตรวจสอบค่า cursor.rowcount เพื่อดูว่ามีการลบข้อมูลจริงหรือไม่
      หากไม่พบข้อมูล (rowcount == 0) จะคืนค่าสถานะ 404 (ไม่พบหมวดหมู่)
    - ยืนยันการลบข้อมูล (commit) และส่งข้อความยืนยันความสำเร็จกลับไป
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # ลบข้อมูลหมวดหมู่ตามรหัส ID
        cursor.execute("DELETE FROM category WHERE CategoryID = %s", (id,))
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