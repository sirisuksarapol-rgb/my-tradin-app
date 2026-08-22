import datetime
from flask import Blueprint, jsonify, request
from db import get_connection
from services.notification_service import notify_user

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
            return val.isoformat()  # แปลง datetime เป็น string รูปแบบ ISO
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
# 1. Dashboard Summary
# ======================================
@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) total FROM member")
    row = cursor.fetchone()
    total_users = row["total"] if isinstance(row, dict) else row[0]

    cursor.execute("SELECT COUNT(*) total FROM item")
    row = cursor.fetchone()
    total_items = row["total"] if isinstance(row, dict) else row[0]

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
# 2. รายชื่อสมาชิกทั้งหมด
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
# 3. รายการโพสต์ทั้งหมด
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
# 4. รายงานปัญหาทั้งหมด
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

# ======================================
# 5. อัปเดตสถานะรายงานปัญหา และแจ้งเตือนผู้ใช้งาน (PUT)
# ======================================
@admin_bp.route("/reports/<int:problem_id>", methods=["PUT"])
def resolve_report(problem_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT MemberID, ProblemType 
            FROM problem 
            WHERE ProblemID = %s
        """, (problem_id,))
        report = cursor.fetchone()

        if not report:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลรายงานปัญหานี้"}), 404

        update_sql = "UPDATE problem SET ReportStatus = 'Resolved' WHERE ProblemID = %s"
        cursor.execute(update_sql, (problem_id,))
        conn.commit()

        if report.get("MemberID"):
            member_id = report["MemberID"]
            problem_type = report["ProblemType"] or "ปัญหาที่คุณแจ้ง"
            
            title = "อัปเดตสถานะการรายงานปัญหา"
            message = f"แอดมินได้ตรวจสอบและแก้ไข '{problem_type}' เรียบร้อยแล้ว ขอบคุณที่ช่วยทำให้ชุมชน Tradin ของเราน่าอยู่ขึ้นครับ!"
            
            notify_user(
                member_id=member_id, 
                title=title, 
                message=message, 
                link="/notifications"
            )

        return jsonify({
            "success": True, 
            "message": "ปิดเคสและส่งแจ้งเตือนไปยังผู้แจ้งเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"❌ Error resolving report {problem_id}: {str(e)}")
        return jsonify({"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# ======================================
# 6. ระงับสิทธิ์ผู้ใช้งาน / แบน (PUT)
# ======================================
@admin_bp.route("/users/<int:member_id>/suspend", methods=["PUT"])
def suspend_user(member_id):
    data = request.json or {}
    suspend_type = data.get("type", "permanent")
    days = data.get("days", 0)
    reason = data.get("reason", "ละเมิดเงื่อนไขข้อตกลงของระบบ")

    # คำนวณเวลาสิ้นสุดการแบน
    suspended_until = None
    if suspend_type == "temporary" and days:
        suspended_until = datetime.datetime.now() + datetime.timedelta(days=int(days))

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # อัปเดตสถานะและข้อมูลการแบนลงฐานข้อมูล
        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Suspended', 
                SuspendedUntil = %s, 
                SuspendReason = %s 
            WHERE MemberID = %s
        """, (suspended_until, reason, member_id))
        conn.commit()

        # สร้างข้อความแจ้งเตือนที่ชัดเจน
        message = f"บัญชีของคุณถูกระงับเนื่องจาก: {reason}"
        if suspended_until:
            message += f"\nจะสามารถใช้งานได้อีกครั้งในวันที่ {suspended_until.strftime('%d/%m/%Y %H:%M น.')}"
        else:
            message += "\n(ระงับแบบถาวร)"

        # แจ้งเตือนผู้ใช้
        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการระงับสิทธิ์ใช้งาน",
            message=message,
            link="/contact"
        )

        return jsonify({"success": True, "message": "ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        print(f"❌ Error suspending user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ======================================
# 7. คืนสิทธิ์ผู้ใช้งาน / ยกเลิกแบน (PUT)
# ======================================
@admin_bp.route("/users/<int:member_id>/unsuspend", methods=["PUT"])
def unsuspend_user(member_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # ปรับสถานะเป็น Active และล้างข้อมูลการแบนทิ้ง
        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Active', 
                SuspendedUntil = NULL, 
                SuspendReason = NULL 
            WHERE MemberID = %s
        """, (member_id,))
        conn.commit()

        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการคืนสิทธิ์ใช้งาน",
            message="บัญชีของคุณได้รับการคืนสิทธิ์การใช้งานแล้ว คุณสามารถเข้าใช้งานและแลกเปลี่ยนสิ่งของได้ตามปกติ",
            link="/"
        )

        return jsonify({"success": True, "message": "คืนสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        print(f"❌ Error unsuspending user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        
# ======================================
# 8. ลบโพสต์โดยแอดมิน (DELETE)
# ======================================
@admin_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item_by_admin(item_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # ดึงข้อมูลเพื่อดูว่าใครเป็นเจ้าของโพสต์ และชื่อสิ่งของคืออะไร
        cursor.execute("SELECT MemberID, ItemName FROM item WHERE ItemID = %s", (item_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify({"success": False, "message": "ไม่พบรายการโพสต์นี้"}), 404

        # ลบโพสต์ออกจากตาราง item
        cursor.execute("DELETE FROM item WHERE ItemID = %s", (item_id,))
        conn.commit()

        # แจ้งเตือนเจ้าของโพสต์
        if item.get("MemberID"):
            notify_user(
                member_id=item["MemberID"],
                title="แจ้งเตือนการลบโพสต์",
                message=f"โพสต์เรื่อง '{item.get('ItemName', 'สิ่งของของคุณ')}' ถูกลบโดยผู้ดูแลระบบ เนื่องจากไม่ตรงตามเงื่อนไขการใช้งาน",
                link="/my-items"
            )

        return jsonify({"success": True, "message": "ลบโพสต์เรียบร้อยแล้ว"}), 200
    except Exception as e:
        conn.rollback()
        print(f"❌ Error deleting item {item_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()