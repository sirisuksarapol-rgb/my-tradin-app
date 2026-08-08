from flask import Blueprint, request, jsonify
from db import get_connection

# Blueprint สำหรับจัดการ API รายงานปัญหา (Report System)
report_bp = Blueprint("report_bp", __name__)

# ========================================================
# 1. ส่งรายงานปัญหา (Create Report)
# ========================================================
@report_bp.route("/api/reports", methods=["POST"])
def create_report():
    try:
        data = request.get_json() or {}

        item_id = data.get("ItemID")
        member_id = data.get("MemberID")
        reported_member_id = data.get("ReportedMemberID")
        problem_type = data.get("ProblemType")
        help_center = data.get("HelpCenterData")

        # 1. ตรวจสอบข้อมูลผู้แจ้ง
        if not member_id:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลผู้แจ้ง กรุณาเข้าสู่ระบบก่อนทำรายการ"
            }), 400

        # 2. ตรวจสอบเนื้อหารายงาน
        if not help_center or not str(help_center).strip():
            return jsonify({
                "success": False,
                "message": "กรุณาระบุรายละเอียดปัญหาหรือข้อเสนอแนะ"
            }), 400

        # 3. Validation ตามประเภทปัญหา
        # ถ้าไม่ใช่ประเภทแจ้งปัญหาระบบ/ข้อเสนอแนะ ต้องระบุ Target (Item หรือ Member) อย่างใดอย่างหนึ่ง
        system_report_types = ["bug", "suggestion", "other", "แจ้งปัญหาระบบ", "ข้อเสนอแนะ", "อื่น ๆ"]
        if problem_type not in system_report_types and not item_id and not reported_member_id:
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

        # ปรับค่าให้อยู่ในรูปแบบ NULL ของ SQL หากไม่ได้ระบุไอดี
        clean_item_id = int(item_id) if item_id else None
        clean_reported_member_id = int(reported_member_id) if reported_member_id else None

        cursor.execute(sql, (
            clean_item_id,
            int(member_id),
            clean_reported_member_id,
            help_center.strip(),
            problem_type
        ))

        conn.commit()
        problem_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "ProblemID": problem_id,
            "message": "ส่งรายงานสำเร็จเรียบร้อยแล้ว"
        }), 201

    except Exception as e:
        print("Create Report Error:", e)
        return jsonify({
            "success": False,
            "message": f"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: {str(e)}"
        }), 500


# ========================================================
# 2. ดึงข้อมูลรายงานทั้งหมดสำหรับ Admin (Read All)
# ========================================================
@report_bp.route("/api/reports", methods=["GET"])
def get_reports():
    try:
        conn = get_connection()
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
        columns = [col[0] for col in cursor.description]
        reports = [dict(zip(columns, row)) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({"success": True, "data": reports}), 200

    except Exception as e:
        print("Get Reports Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ========================================================
# 3. ดูข้อมูลรายงานแบบเจาะจง (Read One)
# ========================================================
@report_bp.route("/api/reports/<int:id>", methods=["GET"])
def get_report(id):
    try:
        conn = get_connection()
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

        if row:
            columns = [col[0] for col in cursor.description]
            report = dict(zip(columns, row))
            cursor.close()
            conn.close()
            return jsonify({"success": True, "data": report}), 200

        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": "ไม่พบข้อมูลรายงานที่ต้องการ"}), 404

    except Exception as e:
        print("Get Report By ID Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ========================================================
# 4. อัปเดตสถานะการรายงาน (Update Report Status)
# ========================================================
@report_bp.route("/api/reports/<int:id>", methods=["PUT"])
def update_report(id):
    try:
        data = request.get_json() or {}
        status = data.get("ReportStatus")
        admin_id = data.get("AdminID")

        if not status or not admin_id:
            return jsonify({
                "success": False,
                "message": "ข้อมูลไม่ครบถ้วน (ระบุ ReportStatus และ AdminID)"
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

        return jsonify({"success": True, "message": "อัปเดตสถานะการจัดการเรียบร้อยแล้ว"}), 200

    except Exception as e:
        print("Update Report Error:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500