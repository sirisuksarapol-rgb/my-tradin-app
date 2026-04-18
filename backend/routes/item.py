from flask import Blueprint, jsonify, request
from db import get_connection
from werkzeug.utils import secure_filename
import os

item_bp = Blueprint("item", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
# ตรวจสอบและสร้างโฟลเดอร์ uploads หากยังไม่มี
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===================== สร้าง Item + อัปโหลดรูป =====================
@item_bp.route("/api/items", methods=["POST"])
def create_item():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        item_name = request.form.get("item_name")
        item_detail = request.form.get("item_detail")
        wanted_item = request.form.get("wanted_item")
        meeting_place = request.form.get("meeting_place")
        location_link = request.form.get("location_link")
        category_id = request.form.get("category_id")
        member_id = request.form.get("member_id")

        # จัดการรูปภาพ (เนื่องจาก DB มีคอลัมน์ ItemImage แค่คอลัมน์เดียว จะรับแค่รูปแรก)
        filename = None
        files = request.files.getlist("images")
        if files and files[0].filename:
            file = files[0]
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

        # ✅ แก้ไขเป็น 'active'
        cursor.execute("""
            INSERT INTO item
            (ItemName, ItemDescription, DesiredItem, MeetingLocation,
             LocationLink, CategoryID, MemberID, ItemImage, ItemStatus)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active') 
        """, (
            item_name, item_detail, wanted_item,
            meeting_place, location_link,
            category_id, member_id, filename
        ))

        conn.commit()
        conn.close()

        return {"message": "Item created successfully"}, 201

    except Exception as e:
        print("❌ Error in create_item:", e)
        return jsonify({"error": str(e)}), 500


# ===================== ดึงรายการทั้งหมด (สำหรับหน้า Feed) =====================
@item_bp.route("/api/items", methods=["GET"])
def get_items():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ แก้ไขเป็น 'active' และดึง meeting_location
        cursor.execute("""
            SELECT i.ItemID AS item_id,
                   i.ItemName AS item_name,
                   i.DesiredItem AS wanted_item,
                   c.CategoryName AS category_name,
                   i.ItemImage AS image_path,
                   i.MemberID AS member_id,
                   i.MeetingLocation AS meeting_location 
            FROM item i
            LEFT JOIN category c ON i.CategoryID = c.CategoryID
            WHERE i.ItemStatus = 'active'
            ORDER BY i.PostDate DESC
        """)

        items = cursor.fetchall()
        conn.close()

        return jsonify(items)

    except Exception as e:
        print("❌ Error in get_items:", e) 
        return jsonify({"error": str(e)}), 500


# ===================== ดึงรายละเอียดตาม ID (สำหรับหน้าดูโพสต์รายตัว) =====================
@item_bp.route("/api/items/<int:item_id>", methods=["GET"])
def get_item_detail(item_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ กู้คืนคำสั่ง SQL ให้ดึงข้อมูลเฉพาะ 1 โพสต์ และ JOIN ผู้ใช้งาน (member)
        cursor.execute("""
            SELECT i.ItemID,
                   i.ItemName,
                   i.ItemDescription,
                   i.DesiredItem,
                   i.MeetingLocation,
                   i.LocationLink,
                   i.MemberID,
                   i.ItemImage,
                   m.display_name,
                   m.email,
                   m.profile_image
            FROM item i
            JOIN member m ON i.MemberID = m.member_id
            WHERE i.ItemID = %s
        """, (item_id,))

        item_data = cursor.fetchone()
        conn.close()

        if not item_data:
            return jsonify({"error": "Item not found"}), 404

        # จัดรูปแบบ JSON Response ให้ตรงกับที่ Frontend โค้ดเดิมคาดหวัง
        return jsonify({
            "item": {
                "item_id": item_data["ItemID"],
                "item_name": item_data["ItemName"],
                "item_detail": item_data["ItemDescription"],
                "wanted_item": item_data["DesiredItem"],
                "meeting_place": item_data["MeetingLocation"],
                "location_link": item_data["LocationLink"],
                "member_id": item_data["MemberID"]
            },
            "images": [{"image_path": item_data["ItemImage"]}] if item_data["ItemImage"] else [],
            "owner": {
                "member_id": item_data["MemberID"],
                "display_name": item_data["display_name"],
                "profile_image": item_data["profile_image"],
                "email": item_data["email"]
            }
        })

    except Exception as e:
        print("❌ Error in get_item_detail:", e) 
        return jsonify({"error": str(e)}), 500