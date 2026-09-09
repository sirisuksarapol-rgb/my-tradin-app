import os
import uuid
from flask import Blueprint, jsonify, request, send_from_directory, url_for
from db import get_connection

# ==========================================
# ITEM BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับสิ่งของ/โพสต์ (Item Management)
item_bp = Blueprint("item", __name__)

# กำหนดเส้นทางโฟลเดอร์สำหรับจัดเก็บไฟล์ภาพอัปโหลดในระบบ (Directory Path)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================================
# 1. ฟังก์ชันให้บริการไฟล์รูปภาพ (SERVE UPLOADED FILES)
# =========================================================================
@item_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    """
    API Endpoint: GET /uploads/<filename>
    คำอธิบาย: ให้บริการและส่งออกไฟล์รูปภาพที่จัดเก็บอยู่บนเซิร์ฟเวอร์เพื่อให้ Client สามารถเข้าถึงผ่าน URL ได้
    
    รายละเอียดการทำงาน:
    - รับชื่อไฟล์ (filename) ผ่าน URL Path Parameter
    - ส่งไฟล์ภาพที่จัดเก็บอยู่ใน UPLOAD_FOLDER กลับไปยังผู้ใช้งานผ่านฟังก์ชัน send_from_directory
    """
    return send_from_directory(UPLOAD_FOLDER, filename)


# =========================================================================
# 2. ฟังก์ชันสร้างรายการสิ่งของหรือโพสต์ใหม่ (CREATE ITEM)
# =========================================================================
@item_bp.route("/api/items", methods=["POST"])
def create_item():
    """
    API Endpoint: POST /api/items
    คำอธิบาย: สร้างโพสต์รายการสิ่งของหรือสินค้าใหม่เข้าสู่ระบบ พร้อมรองรับการอัปโหลดไฟล์รูปภาพหลายไฟล์
    
    รายละเอียดการทำงาน:
    - รับข้อมูลฟอร์ม (request.form) และไฟล์รูปภาพ (request.files.getlist)
    - วนลูปตรวจสอบไฟล์ภาพ เปลี่ยนชื่อไฟล์ด้วย UUID เพื่อป้องกันชื่อไฟล์ซ้ำกันบนเซิร์ฟเวอร์ และบันทึกลง UPLOAD_FOLDER
    - รวมชื่อไฟล์ทั้งหมดคั่นด้วยเครื่องหมายจุลภาค (Comma-separated) เพื่อเก็บลงฐานข้อมูล
    - บันทึกข้อมูลสินค้าใหม่ลงในตาราง item พร้อมกำหนดสถานะเป็น 'active' และบันทึกเวลาปัจจุบัน (NOW())
    - จัดการ Transaction ด้วย commit() เมื่อสำเร็จ หรือ rollback() หากเกิดข้อผิดพลาด
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        data = request.form
        files = request.files.getlist("images") 
        filenames = []
        
        # วนลูปจัดการบันทึกไฟล์รูปภาพทีละไฟล์
        for file in files:
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                fname = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, fname))
                filenames.append(fname)

        # แปลงชื่อไฟล์ทั้งหมดเป็นสตริงคั่นด้วยคอมมา
        db_filenames = ",".join(filenames) if filenames else None

        # คำสั่ง SQL สำหรับเพิ่มข้อมูลโพสต์สินค้าลงในฐานข้อมูล
        cursor.execute("""
            INSERT INTO item (
                ItemName, ItemDescription, DesiredItem, MeetingLocation, 
                LocationLink, CategoryID, MemberID, ItemImage, ItemStatus, PostDate
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', NOW())
        """, (
            data.get("item_name"), data.get("item_detail"), data.get("wanted_item"), 
            data.get("meeting_place"), data.get("location_link"), data.get("category_id"), 
            data.get("member_id"), db_filenames
        ))
        
        conn.commit()
        return jsonify({"message": "Success"}), 201

    except Exception as e:
        if conn: 
            conn.rollback()
        print("Backend Create Item Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: 
            conn.close()


# =========================================================================
# 3. ฟังก์ชันดึงข้อมูลรายการสิ่งของทั้งหมด (GET ALL ITEMS)
# =========================================================================
@item_bp.route("/api/items", methods=["GET"])
def get_items():
    """
    API Endpoint: GET /api/items
    คำอธิบาย: ดึงรายการโพสต์สิ่งของทั้งหมดในระบบสำหรับการแสดงผลหน้าฟีด พร้อมเชื่อมโยงข้อมูลเจ้าของและหมวดหมู่
    
    รายละเอียดการทำงาน:
    - ดึงข้อมูลสินค้าทั้งหมดจากตาราง item พร้อมทำ LEFT JOIN กับตาราง member และ category
    - กรองเฉพาะสินค้าที่มีสถานะ 'active' หรือ 'Available' และเรียงลำดับจากรหัสสินค้าล่าสุด (ItemID DESC)
    - แปลงชื่อไฟล์รูปภาพในฐานข้อมูลให้ออกมาเป็นโครงสร้าง URL เต็ม (Full URL paths) เพื่อให้ Client นำไปใช้งานต่อได้ทันที
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # คำสั่ง SQL สำหรับดึงข้อมูลสินค้าพร้อมข้อมูลเจ้าของและหมวดหมู่
        query = """
        SELECT
            i.*,
            i.ItemImage AS image_name,
            c.CategoryName,
            m.DisplayName,
            m.Email,
            m.ProfileImage
        FROM item i
        LEFT JOIN member m ON i.MemberID = m.MemberID
        LEFT JOIN category c ON i.CategoryID = c.CategoryID
        WHERE i.ItemStatus IN ('active', 'Available')
        ORDER BY i.ItemID DESC
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        # แปลงชื่อไฟล์รูปภาพให้เป็น URL เต็มสำหรับแต่ละโพสต์
        for item in items:
            if item.get('image_name'):
                image_names = [img.strip() for img in item['image_name'].split(',') if img.strip()]
                item['image_paths'] = [url_for('item.uploaded_file', filename=img, _external=True) for img in image_names]
                item['image_path'] = item['image_paths'][0] if item['image_paths'] else None
            else:
                item['image_paths'] = []
                item['image_path'] = None
        
        return jsonify(items), 200
        
    except Exception as e:
        print("Backend Get Items Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: 
            conn.close()


# =========================================================================
# 4. ฟังก์ชันลบรายการสิ่งของ (DELETE ITEM)
# =========================================================================
@item_bp.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    """
    API Endpoint: DELETE /api/items/<item_id>
    คำอธิบาย: ลบโพสต์สินค้าออกจากระบบตามรหัส ID ที่ระบุ พร้อมทำความสะอาดไฟล์รูปภาพที่เกี่ยวข้องบนเซิร์ฟเวอร์
    
    รายละเอียดการทำงาน:
    - รับรหัสสินค้า (item_id) ผ่าน URL Path Parameter
    - ค้นหาข้อมูลชื่อไฟล์รูปภาพที่ผูกกับสินค้า เพื่อเตรียมลบไฟล์ทางกายภาพออกจากเครื่องเซิร์ฟเวอร์
    - ดำเนินการลบข้อมูลเรคอร์ดสินค้าออกจากฐานข้อมูลตาราง item
    - ลบไฟล์รูปภาพจริงทั้งหมดออกจากโฟลเดอร์ UPLOAD_FOLDER บนเครื่องเซิร์ฟเวอร์เพื่อไม่ให้เปลืองพื้นที่
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # ดึงชื่อไฟล์รูปภาพเพื่อเตรียมลบไฟล์ออกจาก Server
        cursor.execute("SELECT ItemImage FROM item WHERE ItemID = %s", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({"error": "Item not found"}), 404
            
        # ลบข้อมูลสินค้าออกจากฐานข้อมูล
        cursor.execute("DELETE FROM item WHERE ItemID = %s", (item_id,))
        conn.commit()
        
        # ลบไฟล์รูปภาพจริงออกจากโฟลเดอร์ uploads
        if item.get("ItemImage"):
            image_names = item["ItemImage"].split(',')
            for img in image_names:
                file_path = os.path.join(UPLOAD_FOLDER, img.strip())
                if os.path.exists(file_path):
                    os.remove(file_path)

        return jsonify({"message": "Item deleted successfully"}), 200

    except Exception as e:
        if conn: 
            conn.rollback()
        print("Backend Delete Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: 
            conn.close()


# =========================================================================
# 5. ฟังก์ชันแก้ไข/อัปเดตข้อมูลสิ่งของ (UPDATE ITEM)
# =========================================================================
@item_bp.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    """
    API Endpoint: PUT /api/items/<int:item_id>
    คำอธิบาย: แก้ไขและอัปเดตรายละเอียดข้อมูลสินค้า พร้อมจัดการเพิ่มรูปภาพใหม่หรือลบรูปภาพเก่าที่ไม่ใช้งานออก
    
    รายละเอียดการทำงาน:
    - ตรวจสอบว่ามีสินค้าที่ต้องการแก้ไขรหัส item_id นี้อยู่จริงในระบบหรือไม่
    - รับข้อมูลฟอร์มที่แก้ไขและจัดการอัปโหลดไฟล์รูปภาพใหม่ที่ถูกส่งเพิ่มเข้ามา
    - ตรวจสอบรายชื่อภาพเดิมที่ผู้ใช้ยังต้องการเก็บรักษาไว้ (existing_images)
    - เปรียบเทียบรูปภาพเก่ากับรูปภาพที่เหลืออยู่ เพื่อลบไฟล์รูปภาพที่ไม่ต้องการใช้ออกจากเซิร์ฟเวอร์จริง
    - รวมรายชื่อไฟล์ภาพเก่าที่ยังอยู่กับไฟล์ภาพใหม่เข้าด้วยกันเป็นชุดข้อมูลภาพชุดใหม่
    - อัปเดตข้อมูลรายละเอียดสินค้าและชุดรูปภาพลงในฐานข้อมูล
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # ตรวจสอบข้อมูลสินค้าเดิมในระบบ
        cursor.execute("SELECT ItemImage FROM item WHERE ItemID = %s", (item_id,))
        current_item = cursor.fetchone()
        if not current_item:
            return jsonify({"error": "Item not found"}), 404
            
        data = request.form
        
        # จัดเก็บไฟล์รูปภาพใหม่ที่ถูกส่งเข้ามาอัปโหลดเพิ่ม
        files = request.files.getlist("images")
        new_filenames = []
        for file in files:
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                fname = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, fname))
                new_filenames.append(fname)
                
        # ตรวจสอบรายชื่อภาพเดิมที่ผู้ใช้ยังต้องการเก็บรักษาไว้
        existing_images_str = data.get("existing_images", "")
        existing_images = [img.strip() for img in existing_images_str.split(",") if img.strip()]
        
        # ตรวจสอบและลบรูปภาพเก่าที่ถูกผู้ใช้กดลบออกจากการแก้ไขบนหน้าเว็บ
        if current_item.get("ItemImage"):
            old_images = [img.strip() for img in current_item["ItemImage"].split(",") if img.strip()]
            for old_img in old_images:
                if old_img not in existing_images:
                    file_path = os.path.join(UPLOAD_FOLDER, old_img)
                    if os.path.exists(file_path):
                        os.remove(file_path)

        # รวมรายชื่อรูปภาพเดิมที่เหลืออยู่กับรูปภาพใหม่ที่อัปโหลดเข้ามา
        final_images = existing_images + new_filenames
        db_filenames = ",".join(final_images) if final_images else None

        # คำสั่ง SQL สำหรับอัปเดตข้อมูลสินค้าในฐานข้อมูล
        query = """
            UPDATE item 
            SET ItemName = %s, 
                ItemDescription = %s, 
                DesiredItem = %s, 
                MeetingLocation = %s, 
                LocationLink = %s, 
                CategoryID = %s, 
                ItemImage = %s
            WHERE ItemID = %s
        """
        cursor.execute(query, (
            data.get("item_name"), 
            data.get("item_detail"), 
            data.get("wanted_item"), 
            data.get("meeting_place"), 
            data.get("location_link"), 
            data.get("category_id"), 
            db_filenames,
            item_id
        ))
        
        conn.commit()
        return jsonify({"message": "Update Success", "image_path": db_filenames}), 200
        
    except Exception as e:
        if conn: 
            conn.rollback()
        print("Backend Update Item Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: 
            conn.close()