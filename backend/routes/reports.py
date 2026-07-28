from flask import Blueprint, request, jsonify
from db import get_connection

# สร้าง Blueprint สำหรับจัดการ API ที่เกี่ยวกับการรายงานปัญหา (Report)
report_bp = Blueprint("report_bp", __name__)

# ===========================
# 1. ส่งรายงานปัญหา (Create)
# ===========================
@report_bp.route("/api/reports", methods=["POST"])
def create_report():
    try:
        data = request.get_json()

        item_id = data.get("ItemID")
        member_id = data.get("MemberID")
        reported_member_id = data.get("ReportedMemberID")
        problem_type = data.get("ProblemType")
        help_center = data.get("HelpCenterData")

        # ตรวจสอบว่ามีผู้แจ้งรายงานหรือไม่
        if not member_id:
            return jsonify({
                "success": False,
                "message": "ไม่พบ MemberID"
            }), 400

        # ต้องมีอย่างน้อยอย่างใดอย่างหนึ่ง (รายงานสิ่งของ หรือ รายงานบุคคล)
        if not item_id and not reported_member_id:
            return jsonify({
                "success": False,
                "message": "กรุณาระบุสิ่งของหรือสมาชิกที่ต้องการรายงาน"
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        sql = """
            INSERT INTO problem (
                ItemID,
                MemberID,
                ReportedMemberID,
                ReportStatus,
                HelpCenterData,
                ReportDate,
                ProblemType
            )
            VALUES (%s, %s, %s, 'รอดำเนินการ', %s, NOW(), %s)
        """

        cursor.execute(sql, (
            item_id,
            member_id,
            reported_member_id,
            help_center,
            problem_type
        ))

        conn.commit()
        problem_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "ProblemID": problem_id,
            "message": "ส่งรายงานสำเร็จ"
        }), 201

    except Exception as e:
        print("Create Report Error:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ===========================
# 2. ดึงข้อมูลรายงานทั้งหมด (Read All)
# ===========================
@report_bp.route("/api/reports", methods=["GET"])
def get_reports():
    conn = get_connection()
    
    # 🟢 1. เอา dictionary=True ออก เพื่อจัดการชื่อคอลัมน์ด้วยตัวเอง
    cursor = conn.cursor()

    sql = """
        SELECT
            p.ProblemID, p.ItemID, p.MemberID, p.ReportedMemberID,
            p.ReportStatus, p.ReportDate, p.ResolveDate, p.ProblemType, p.HelpCenterData,
            i.ItemName, i.ItemImage,
            reporter.DisplayName AS ReporterName,
            reported.DisplayName AS ReportedMemberName,
            a.AdminName
        FROM problem p
        LEFT JOIN item i ON p.ItemID = i.ItemID
        LEFT JOIN member reporter ON p.MemberID = reporter.MemberID
        LEFT JOIN member reported ON p.ReportedMemberID = reported.MemberID
        LEFT JOIN admin a ON p.AdminID = a.AdminID
        ORDER BY p.ReportDate DESC
    """

    cursor.execute(sql)

    # 🟢 2. ใช้ zip เพื่อบังคับให้ Python จับคู่ชื่อคอลัมน์ (AS) ให้ถูกต้อง
    columns = [col[0] for col in cursor.description]
    reports = [dict(zip(columns, row)) for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return jsonify(reports), 200


# ===========================
# 3. ดูข้อมูลรายงานแบบเจาะจง (Read One)
# ===========================
@report_bp.route("/api/reports/<int:id>", methods=["GET"])
def get_report(id):
    conn = get_connection()
    
    # 🟢 1. ใช้ Cursor ธรรมดา
    cursor = conn.cursor()

    sql = """
        SELECT
            p.*,
            i.ItemName,
            i.ItemImage,
            reporter.DisplayName AS ReporterName,
            reported.DisplayName AS ReportedMemberName,
            a.AdminName
        FROM problem p
        LEFT JOIN item i ON p.ItemID = i.ItemID
        LEFT JOIN member reporter ON p.MemberID = reporter.MemberID
        LEFT JOIN member reported ON p.ReportedMemberID = reported.MemberID
        LEFT JOIN admin a ON p.AdminID = a.AdminID
        WHERE p.ProblemID = %s
    """

    cursor.execute(sql, (id,))
    row = cursor.fetchone()

    # 🟢 2. แปลงข้อมูลแบบเดียวกับด้านบน
    if row:
        columns = [col[0] for col in cursor.description]
        report = dict(zip(columns, row))
    else:
        report = None

    cursor.close()
    conn.close()

    # ถ้าไม่พบข้อมูลให้แจ้งกลับเป็น 404
    if report is None:
        return jsonify({"message": "ไม่พบข้อมูลรายงาน"}), 404

    return jsonify(report), 200


# ===========================
# 4. อัปเดตสถานะการรายงาน (Update)
# ===========================
@report_bp.route("/api/reports/<int:id>", methods=["PUT"])
def update_report(id):
    try:
        data = request.get_json()
        status = data.get("ReportStatus")
        admin_id = data.get("AdminID")

        if not status or not admin_id:
            return jsonify({
                "success": False,
                "message": "ข้อมูลไม่ครบถ้วน (ต้องการ ReportStatus และ AdminID)"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()

        sql = """
            UPDATE problem
            SET
                ReportStatus = %s,
                ResolveDate = NOW(),
                AdminID = %s
            WHERE ProblemID = %s
        """

        cursor.execute(sql, (status, admin_id, id))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"success": True}), 200

    except Exception as e:
        print("Update Report Error:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500