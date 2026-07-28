import os
import uuid
from flask import Blueprint, jsonify, request, send_from_directory, url_for
from db import get_connection

item_bp = Blueprint("item", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ======================================
# ให้บริการไฟล์รูปภาพ (Serve Files)
# ======================================
@item_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ======================================
# สร้าง Item ใหม่ (Create)
# ======================================
@item_bp.route("/api/items", methods=["POST"])
def create_item():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        data = request.form
        files = request.files.getlist("images") 
        filenames = []
        
        for file in files:
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                fname = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, fname))
                filenames.append(fname)

        db_filenames = ",".join(filenames) if filenames else None

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
        if conn: conn.rollback()
        print("Backend Create Item Error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

# ======================================
# ดึงข้อมูล Item ทั้งหมด (Read)
# ======================================
@item_bp.route("/api/items", methods=["GET"])
def get_items():
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
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
        if conn: conn.close()

# ======================================
# ลบ Item (Delete)
# ======================================
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

# ======================================
# แก้ไข/อัปเดต Item (Update)
# ======================================
@item_bp.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT ItemImage FROM item WHERE ItemID = %s", (item_id,))
        current_item = cursor.fetchone()
        if not current_item:
            return jsonify({"error": "Item not found"}), 404
            
        data = request.form
        
        files = request.files.getlist("images")
        new_filenames = []
        for file in files:
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                fname = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, fname))
                new_filenames.append(fname)
                
        existing_images_str = data.get("existing_images", "")
        existing_images = [img.strip() for img in existing_images_str.split(",") if img.strip()]
        
        if current_item.get("ItemImage"):
            old_images = [img.strip() for img in current_item["ItemImage"].split(",") if img.strip()]
            for old_img in old_images:
                if old_img not in existing_images:
                    file_path = os.path.join(UPLOAD_FOLDER, old_img)
                    if os.path.exists(file_path):
                        os.remove(file_path)

        final_images = existing_images + new_filenames
        db_filenames = ",".join(final_images) if final_images else None

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