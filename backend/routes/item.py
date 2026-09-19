import os
import uuid
from flask import Blueprint, jsonify, request
import cloudinary
import cloudinary.uploader
from db import get_connection

# ==========================================
# ITEM BLUEPRINT CONFIGURATION
# ==========================================
item_bp = Blueprint("item", __name__)

# ตั้งค่า Cloudinary โดยดึงค่าจาก Environment Variables บน Render
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


# =========================================================================
# 1. ฟังก์ชันสร้างรายการสิ่งของหรือโพสต์ใหม่ (CREATE ITEM)
# =========================================================================
@item_bp.route("/api/items", methods=["POST"])
def create_item():
    """
    API Endpoint: POST /api/items
    คำอธิบาย: สร้างโพสต์รายการสิ่งของใหม่เข้าสู่ระบบ พร้อมอัปโหลดไฟล์ภาพขึ้น Cloudinary
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        data = request.form
        files = request.files.getlist("images")
        image_urls = []
        
        for file in files:
            if file and file.filename:
                try:
                    upload_result = cloudinary.uploader.upload(file)
                    secure_url = upload_result.get("secure_url")
                    if secure_url:
                        image_urls.append(secure_url)
                except Exception as e:
                    print("❌ Cloudinary Upload Error:", str(e))

        db_filenames = ",".join(image_urls) if image_urls else None

        # ใช้ตัวพิมพ์เล็กทั้งหมดใน SQL
        cursor.execute("""
            INSERT INTO item (
                itemname, itemdescription, desireditem, meetinglocation, 
                locationlink, categoryid, memberid, itemimage, itemstatus, postdate
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
# 2. ฟังก์ชันดึงข้อมูลรายการสิ่งของทั้งหมด (GET ALL ITEMS)
# =========================================================================
@item_bp.route("/api/items", methods=["GET"])
def get_items():
    """
    API Endpoint: GET /api/items
    คำอธิบาย: ดึงรายการโพสต์สิ่งของทั้งหมดสำหรับการแสดงผลหน้าฟีด พร้อมลิงก์รูปภาพจาก Cloudinary
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # ใช้ AS "..." เพื่อคงโครงสร้างคีย์ JSON ตัวพิมพ์ใหญ่-เล็กให้ Frontend ทำงานได้ปกติ
        query = """
        SELECT
            i.itemid AS "ItemID",
            i.itemname AS "ItemName",
            i.itemdescription AS "ItemDescription",
            i.desireditem AS "DesiredItem",
            i.itemimage AS "ItemImage",
            i.itemstatus AS "ItemStatus",
            i.postdate AS "PostDate",
            i.canceldate AS "CancelDate",
            i.meetinglocation AS "MeetingLocation",
            i.locationlink AS "LocationLink",
            i.categoryid AS "CategoryID",
            i.memberid AS "MemberID",
            
            i.itemimage AS image_name,
            c.categoryname AS "CategoryName",
            m.displayname AS "DisplayName",
            m.email AS "Email",
            m.profileimage AS "ProfileImage"
        FROM item i
        LEFT JOIN member m ON i.memberid = m.memberid
        LEFT JOIN category c ON i.categoryid = c.categoryid
        WHERE i.itemstatus IN ('active', 'Available')
        ORDER BY i.itemid DESC
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        for item in items:
            # แปลงวันที่เป็น String
            if item.get("PostDate"):
                item["PostDate"] = item["PostDate"].strftime('%Y-%m-%d %H:%M:%S')
            if item.get("CancelDate"):
                item["CancelDate"] = item["CancelDate"].strftime('%Y-%m-%d %H:%M:%S')

            if item.get('image_name'):
                image_urls = [img.strip() for img in item['image_name'].split(',') if img.strip()]
                item['image_paths'] = image_urls
                item['image_path'] = image_urls[0] if image_urls else None
            else:
                item['image_paths'] = []
                item['image_path'] = None
                
            # ลบคีย์ image_name ออกเพื่อความสะอาดของ JSON คืนค่า
            if 'image_name' in item:
                del item['image_name']
        
        return jsonify(items), 200
        
    except Exception as e:
        print("Backend Get Items Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: 
            conn.close()


# =========================================================================
# 3. ฟังก์ชันลบรายการสิ่งของ (DELETE ITEM)
# =========================================================================
@item_bp.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    """
    API Endpoint: DELETE /api/items/<item_id>
    คำอธิบาย: ลบโพสต์สินค้าออกจากระบบตามรหัส ID
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT itemimage FROM item WHERE itemid = %s", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({"error": "Item not found"}), 404
            
        cursor.execute("DELETE FROM item WHERE itemid = %s", (item_id,))
        conn.commit()

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
# 4. ฟังก์ชันแก้ไข/อัปเดตข้อมูลสิ่งของ (UPDATE ITEM)
# =========================================================================
@item_bp.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    """
    API Endpoint: PUT /api/items/<int:item_id>
    คำอธิบาย: แก้ไขรายละเอียดสินค้าและอัปเดตรูปภาพขึ้น Cloudinary
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT itemimage FROM item WHERE itemid = %s", (item_id,))
        current_item = cursor.fetchone()
        if not current_item:
            return jsonify({"error": "Item not found"}), 404
            
        data = request.form
        
        files = request.files.getlist("images")
        new_image_urls = []
        for file in files:
            if file and file.filename:
                try:
                    upload_result = cloudinary.uploader.upload(file)
                    secure_url = upload_result.get("secure_url")
                    if secure_url:
                        new_image_urls.append(secure_url)
                except Exception as e:
                    print(f"❌ Cloudinary Upload Error: {str(e)}")
                
        existing_images_str = data.get("existing_images", "")
        existing_images = [img.strip() for img in existing_images_str.split(",") if img.strip()]
        
        final_images = existing_images + new_image_urls
        db_filenames = ",".join(final_images) if final_images else None

        query = """
            UPDATE item 
            SET itemname = %s, 
                itemdescription = %s, 
                desireditem = %s, 
                meetinglocation = %s, 
                locationlink = %s, 
                categoryid = %s, 
                itemimage = %s
            WHERE itemid = %s
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