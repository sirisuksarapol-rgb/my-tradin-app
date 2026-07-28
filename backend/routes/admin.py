import datetime
from flask import Blueprint, jsonify
from db import get_connection

# สร้าง Blueprint สำหรับจัดกลุ่ม API ที่เกี่ยวกับ Admin
admin_bp = Blueprint("admin", __name__)

# ======================================
# ฟังก์ชันช่วยจัดฟอร์แมตข้อมูลดิกชันนารี
# ======================================
def format_cursor_data(cursor, data, is_single=False):
    if not cursor.description or data is None:
        return data if not is_single else None
    
    columns = [col[0] for col in cursor.description]
    
    def serialize_item(val):
        # จัดการปัญหา Date/Datetime แปลงเป็น JSON ไม่ได้
        if isinstance(val, (datetime.datetime, datetime.date)):
            return val.isoformat()  # แปลง datetime เป็น string รูปแบบ ISO (เช่น 2026-07-02T16:30:00)
        return val

    if is_single:
        if isinstance(data, dict):
            return {k: serialize_item(v) for k, v in data.items()}
        return {columns[i]: serialize_item(data[i]) for i in range(len(columns))}
    else:
        results = []
        for row in data:
            if isinstance(row, dict):
                results.append({k: serialize_item(v) for k, v in row.items()})
            else:
                results.append({columns[i]: serialize_item(row[i]) for i in range(len(columns))})
        return results

# ======================================
# Dashboard Summary
# ======================================
@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. นับจำนวนสมาชิกทั้งหมด
    cursor.execute("SELECT COUNT(*) total FROM member")
    row = cursor.fetchone()
    total_users = row["total"] if isinstance(row, dict) else row[0]

    # 2. นับจำนวนโพสต์ทั้งหมด
    cursor.execute("SELECT COUNT(*) total FROM item")
    row = cursor.fetchone()
    total_items = row["total"] if isinstance(row, dict) else row[0]

    # 3. นับจำนวนรายงานปัญหาที่ยังรอดำเนินการ (Pending)
    cursor.execute("SELECT COUNT(*) total FROM problem WHERE ReportStatus='Pending'")
    row = cursor.fetchone()
    total_reports = row["total"] if isinstance(row, dict) else row[0]

    cursor.close()
    conn.close()

    return jsonify({
        "users": total_users,
        "items": total_items,
        "reports": total_reports
    })

# ======================================
# สมาชิกทั้งหมด
# ======================================
@admin_bp.route("/users", methods=["GET"])
def users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            m.MemberID,
            m.DisplayName,
            m.Email,
            m.ProfileImage,
            m.RegisterDate,
            m.MemberStatus,
            (
                SELECT COUNT(*)
                FROM item i
                WHERE i.MemberID = m.MemberID
            ) AS PostCount
        FROM member m
        ORDER BY m.RegisterDate DESC
    """)
    raw_data = cursor.fetchall()
    data = format_cursor_data(cursor, raw_data)

    cursor.close()
    conn.close()
    return jsonify(data)

# ======================================
# โพสต์ทั้งหมด
# ======================================
@admin_bp.route("/items", methods=["GET"])
def items():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            i.ItemID,
            i.ItemName,
            i.ItemDescription,
            i.ItemImage,
            i.ItemStatus,
            i.PostDate,
            m.MemberID,
            m.DisplayName,
            i.CategoryID
        FROM item i
        LEFT JOIN member m ON i.MemberID = m.MemberID
        ORDER BY i.PostDate DESC
    """)
    raw_data = cursor.fetchall()
    data = format_cursor_data(cursor, raw_data)

    cursor.close()
    conn.close()
    return jsonify(data)

# ======================================
# รายงานทั้งหมด
# ======================================
@admin_bp.route("/reports", methods=["GET"])
def reports():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            p.ProblemID,
            p.ReportStatus,
            p.ReportDate,
            p.ProblemType,
            p.HelpCenterData,
            i.ItemID,
            i.ItemName,
            m.MemberID,
            m.DisplayName
        FROM problem p
        LEFT JOIN item i ON p.ItemID = i.ItemID
        LEFT JOIN member m ON p.MemberID = m.MemberID
        ORDER BY p.ReportDate DESC
    """)
    raw_data = cursor.fetchall()
    data = format_cursor_data(cursor, raw_data)

    cursor.close()
    conn.close()
    return jsonify(data)