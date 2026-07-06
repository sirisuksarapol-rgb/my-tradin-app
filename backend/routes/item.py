from flask import Blueprint, jsonify, request, send_from_directory, url_for
from db import get_connection
from werkzeug.utils import secure_filename
import os
import uuid

item_bp = Blueprint("item", __name__)
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@item_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@item_bp.route("/api/items", methods=["POST"])
def create_item():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        data = request.form
        
        # 💡 เปลี่ยนเป็น getlist() เพื่อรับไฟล์ทั้งหมดที่ส่งเข้ามา
        files = request.files.getlist("images") 
        filenames = []
        
        # วนลูปเซฟทุกไฟล์ที่ถูกอัปโหลดมา
        for file in files:
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                fname = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, fname))
                filenames.append(fname)

        # นำชื่อไฟล์มารวมกันด้วยเครื่องหมายลูกน้ำ (,) เพื่อเก็บใน DB ช่องเดียว
        db_filenames = ",".join(filenames) if filenames else None

        cursor.execute("""
            INSERT INTO item (ItemName, ItemDescription, DesiredItem, MeetingLocation, LocationLink, CategoryID, MemberID, ItemImage, ItemStatus)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active')
        """, (data.get("item_name"), data.get("item_detail"), data.get("wanted_item"), 
              data.get("meeting_place"), data.get("location_link"), data.get("category_id"), 
              data.get("member_id"), db_filenames))
        
        conn.commit()
        return jsonify({"message": "Success"}), 201
    except Exception as e:
        if conn: conn.rollback()
        print("Backend Create Item Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@item_bp.route("/api/items", methods=["GET"])
def get_items():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 💡 ใช้ LEFT JOIN ดึงข้อมูลจากตาราง item และตาราง member มารวมกันใน Query เดียว
        # ดึงมาทั้งข้อมูลสิ่งของ ชื่อสมาชิก (DisplayName) อีเมล (Email) และรูปโปรไฟล์ (ProfileImage)
        query = """
        SELECT
            i.*,
            i.ItemImage AS image_name,
            c.CategoryName,
            m.DisplayName,
            m.Email,
            m.ProfileImage
        FROM item i
        LEFT JOIN member m
            ON i.MemberID = m.MemberID
        LEFT JOIN category c
            ON i.CategoryID = c.CategoryID
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        # 💡 จัดการแปลงข้อมูลรูปภาพของสิ่งของ และส่งกลับเป็น List/URL
        for item in items:
            if item.get('image_name'):
                image_names = item['image_name'].split(',')
                # สร้างเป็น Array ของ URL รูปภาพทั้งหมด
                item['image_paths'] = [url_for('item.uploaded_file', filename=img.strip(), _external=True) for img in image_names]
                # เผื่อไว้ให้ image_path ตัวแรก สำหรับ Frontend ส่วนที่แสดงรูปเดียว
                item['image_path'] = item['image_paths'][0] if item['image_paths'] else None
            else:
                item['image_paths'] = []
                item['image_path'] = None
        
        # ส่งข้อมูลกลับไปที่ Frontend (มีครบทั้งรายละเอียดโพสต์ และโปรไฟล์ผู้ใช้)
        return jsonify(items)
        
    except Exception as e:
        print("Backend Get Items Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

# ===================== ลบ Item =====================
@item_bp.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT ItemImage FROM item WHERE ItemID = %s", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({"error": "Item not found"}), 404
            
        cursor.execute("DELETE FROM item WHERE ItemID = %s", (item_id,))
        conn.commit()
        
        # 💡 ลบไฟล์รูปภาพทั้งหมดที่เชื่อมกับไอเทมนี้
        if item.get("ItemImage"):
            image_names = item["ItemImage"].split(',')
            for img in image_names:
                file_path = os.path.join(UPLOAD_FOLDER, img.strip())
                if os.path.exists(file_path):
                    os.remove(file_path)

        return jsonify({"message": "Item deleted successfully"}), 200

    except Exception as e:
        if conn: conn.rollback()
        print("Backend Delete Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()
        
# ===================== แก้ไขอัปเดต Item =====================
@item_bp.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # ตรวจสอบก่อนว่ามีไอเทมนี้อยู่จริงไหม
        cursor.execute("SELECT ItemImage FROM item WHERE ItemID = %s", (item_id,))
        current_item = cursor.fetchone()
        if not current_item:
            return jsonify({"error": "Item not found"}), 404
            
        data = request.form
        
        # 1. จัดการรูปภาพใหม่ที่อัปโหลดเข้ามา (ถ้ามี)
        files = request.files.getlist("images")
        new_filenames = []
        for file in files:
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                fname = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, fname))
                new_filenames.append(fname)
                
        # 2. จัดการรูปภาพเดิมที่ฝั่ง Frontend ส่งกลับมาบอกว่ายังเก็บไว้
        existing_images_str = data.get("existing_images", "")
        existing_images = [img.strip() for img in existing_images_str.split(",") if img.strip()]
        
        # ถ้ารูปเก่าหายไปจากรายการที่ส่งมา ให้ลบไฟล์จริงออกจาก Folder อัปโหลดด้วย
        if current_item.get("ItemImage"):
            old_images = [img.strip() for img in current_item["ItemImage"].split(",") if img.strip()]
            for old_img in old_images:
                if old_img not in existing_images:
                    file_path = os.path.join(UPLOAD_FOLDER, old_img)
                    if os.path.exists(file_path):
                        os.remove(file_path)

        # รวมชื่อรูปภาพทั้งหมด (รูปเก่าที่ยังเหลืออยู่ + รูปใหม่ที่เพิ่งอัปเพิ่ม)
        final_images = existing_images + new_filenames
        db_filenames = ",".join(final_images) if final_images else None

        # 3. สั่งอัปเดตข้อมูลใหม่ลงฐานข้อมูล
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
        if conn: conn.rollback()
        print("Backend Update Item Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()