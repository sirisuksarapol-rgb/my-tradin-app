import os
import uuid

from flask import Blueprint, jsonify, request, send_from_directory, url_for, current_app
from db import get_connection


item_bp = Blueprint("item", __name__)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@item_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@item_bp.route("/api/items", methods=["POST"])
def create_item():
    """สร้างรายการสิ่งของใหม่"""
    conn = None
    cursor = None

    try:
        data = request.form
        filenames = []

        for file in request.files.getlist("images"):
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                filename = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                filenames.append(filename)

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO item (
                ItemName, ItemDescription, DesiredItem, MeetingLocation,
                LocationLink, CategoryID, MemberID, ItemImage, ItemStatus, PostDate
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', NOW())
        """, (
            data.get("item_name"),
            data.get("item_detail"),
            data.get("wanted_item"),
            data.get("meeting_place"),
            data.get("location_link"),
            data.get("category_id"),
            data.get("member_id"),
            ",".join(filenames) if filenames else None
        ))

        conn.commit()
        return jsonify({"message": "Success"}), 201

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Create Item Error: {e}")
        return jsonify({
            "error": "เกิดข้อผิดพลาดในการสร้างรายการสิ่งของ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@item_bp.route("/api/items", methods=["GET"])
def get_items():
    """ดึงรายการสิ่งของที่ยังเปิดใช้งาน"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                i.*, i.ItemImage AS image_name,
                c.CategoryName,
                m.DisplayName, m.Email, m.ProfileImage
            FROM item i
            LEFT JOIN member m ON i.MemberID = m.MemberID
            LEFT JOIN category c ON i.CategoryID = c.CategoryID
            WHERE i.ItemStatus IN ('active', 'Available')
            ORDER BY i.ItemID DESC
        """)

        items = cursor.fetchall()

        for item in items:
            item["image_paths"] = []
            item["image_path"] = None

            if item.get("image_name"):
                images = [
                    image.strip()
                    for image in item["image_name"].split(",")
                    if image.strip()
                ]

                item["image_paths"] = [
                    url_for(
                        "item.uploaded_file",
                        filename=image,
                        _external=True
                    )
                    for image in images
                ]

                if item["image_paths"]:
                    item["image_path"] = item["image_paths"][0]

        return jsonify(items), 200

    except Exception as e:
        current_app.logger.error(f"Get Items Error: {e}")
        return jsonify({
            "error": "เกิดข้อผิดพลาดในการดึงข้อมูลรายการสิ่งของ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@item_bp.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    """ลบรายการสิ่งของและรูปภาพที่เกี่ยวข้อง"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT ItemImage FROM item WHERE ItemID = %s",
            (item_id,)
        )
        item = cursor.fetchone()

        if not item:
            return jsonify({
                "error": "ไม่พบรายการสิ่งของที่ต้องการลบ"
            }), 404

        cursor.execute(
            "DELETE FROM item WHERE ItemID = %s",
            (item_id,)
        )

        conn.commit()

        if item.get("ItemImage"):
            for image in item["ItemImage"].split(","):
                image = image.strip()
                file_path = os.path.join(UPLOAD_FOLDER, image)

                if os.path.exists(file_path):
                    os.remove(file_path)

        return jsonify({
            "message": "Item deleted successfully"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Delete Item Error: {e}")
        return jsonify({
            "error": "เกิดข้อผิดพลาดในการลบรายการสิ่งของ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@item_bp.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    """แก้ไขข้อมูลรายการและรูปภาพ"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT ItemImage FROM item WHERE ItemID = %s",
            (item_id,)
        )
        current_item = cursor.fetchone()

        if not current_item:
            return jsonify({
                "error": "ไม่พบรายการสิ่งของที่ต้องการแก้ไข"
            }), 404

        data = request.form
        new_filenames = []

        for file in request.files.getlist("images"):
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1]
                filename = f"{uuid.uuid4()}{ext}"
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                new_filenames.append(filename)

        existing_images = [
            image.strip()
            for image in data.get("existing_images", "").split(",")
            if image.strip()
        ]

        if current_item.get("ItemImage"):
            old_images = [
                image.strip()
                for image in current_item["ItemImage"].split(",")
                if image.strip()
            ]

            for image in old_images:
                if image not in existing_images:
                    file_path = os.path.join(UPLOAD_FOLDER, image)

                    if os.path.exists(file_path):
                        os.remove(file_path)

        final_images = existing_images + new_filenames
        db_filenames = ",".join(final_images) if final_images else None

        cursor.execute("""
            UPDATE item
            SET ItemName = %s,
                ItemDescription = %s,
                DesiredItem = %s,
                MeetingLocation = %s,
                LocationLink = %s,
                CategoryID = %s,
                ItemImage = %s
            WHERE ItemID = %s
        """, (
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

        return jsonify({
            "message": "Update Success",
            "image_path": db_filenames
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Update Item Error: {e}")
        return jsonify({
            "error": "เกิดข้อผิดพลาดในการแก้ไขรายการสิ่งของ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

