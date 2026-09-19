from flask import Blueprint, request, jsonify
from db import get_connection

# ==========================================
# REPORT SYSTEM BLUEPRINT CONFIGURATION
# ==========================================
report_bp = Blueprint("report_bp", __name__)


# =========================================================================
# 1. API: ส่งรายงานปัญหาใหม่ (POST /api/reports)
# =========================================================================
@report_bp.route("/api/reports", methods=["POST"])
def create_report():
    """
    API Endpoint: POST /api/reports
    คำอธิบาย: บันทึกรายงานปัญหา ข้อเสนอแนะ หรือการแจ้งเบาะแสใหม่เข้าสู่ระบบ
    """
    try:
        data = request.get_json() or {}

        item_id = data.get("ItemID")
        member_id = data.get("MemberID")
        reported_member_id = data.get("ReportedMemberID")
        problem_type = data.get("ProblemType")
        help_center = data.get("HelpCenterData")

        if not member_id:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลผู้แจ้ง กรุณาเข้าสู่ระบบก่อนทำรายการ"
            }), 400

        if not help_center or not str(help_center).strip():
            return jsonify({
                "success": False,
                "message": "กรุณาระบุรายละเอียดปัญหาหรือข้อเสนอแนะ"
            }), 400

        system_report_types = ["bug", "suggestion", "other", "แจ้งปัญหาระบบ", "ข้อเสนอแนะ", "อื่น ๆ"]
        if problem_type not in system_report_types and not item_id and not reported_member_id:
            return jsonify({
                "success": False,
                "message": "กรุณาระบุสิ่งของหรือสมาชิกที่ต้องการรายงาน"
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ใช้ตัวพิมพ์เล็กในชื่อตารางและคอลัมน์ และใช้ RETURNING สำหรับดึง ID ล่าสุด (PostgreSQL)
        sql = """
            INSERT INTO problem (
                itemid,
                memberid,
                reportedmemberid,
                reportstatus,
                helpcenterdata,
                reportdate,
                problemtype
            )
            VALUES (%s, %s, %s, 'รอดำเนินการ', %s, NOW(), %s)
            RETURNING problemid
        """

        clean_item_id = int(item_id) if item_id else None
        clean_reported_member_id = int(reported_member_id) if reported_member_id else None

        cursor.execute(sql, (
            clean_item_id,
            int(member_id),
            clean_reported_member_id,
            help_center.strip(),
            problem_type
        ))
        
        inserted_row = cursor.fetchone()
        problem_id = inserted_row['problemid'] if inserted_row else cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "ProblemID": problem_id,
            "message": "ส่งรายงานสำเร็จเรียบร้อยแล้ว"
        }), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        print("Create Report Error:", e)
        return jsonify({
            "success": False,
            "message": f"เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: {str(e)}"
        }), 500


# =========================================================================
# 2. API: ดึงข้อมูลรายงานปัญหาทั้งหมดสำหรับผู้ดูแลระบบ (GET /api/reports)
# =========================================================================
@report_bp.route("/api/reports", methods=["GET"])
def get_reports():
    """
    API Endpoint: GET /api/reports
    คำอธิบาย: ดึงรายการรายงานปัญหาและข้อเสนอแนะทั้งหมดในระบบสำหรับหน้าจอจัดการของผู้ดูแลระบบ (Admin)
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # ใช้ตัวพิมพ์เล็กและกำหนด AS เพื่อคงรูปแบบพิมพ์ใหญ่-เล็กส่งกลับให้ Frontend
        sql = """
            SELECT
                p.problemid AS "ProblemID", 
                p.itemid AS "ItemID", 
                p.memberid AS "MemberID", 
                p.reportedmemberid AS "ReportedMemberID",
                p.reportstatus AS "ReportStatus", 
                p.reportdate AS "ReportDate", 
                p.resolvedate AS "ResolveDate", 
                p.problemtype AS "ProblemType", 
                p.helpcenterdata AS "HelpCenterData",
                i.itemname AS "ItemName", 
                i.itemimage AS "ItemImage",
                reporter.displayname AS "ReporterName",
                reported.displayname AS "ReportedMemberName",
                a.adminname AS "AdminName"
            FROM problem p
            LEFT JOIN item i ON p.itemid = i.itemid
            LEFT JOIN member reporter ON p.memberid = reporter.memberid
            LEFT JOIN member reported ON p.reportedmemberid = reported.memberid
            LEFT JOIN admin a ON p.adminid = a.adminid
            ORDER BY p.reportdate DESC
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


# =========================================================================
# 3. API: ดึงข้อมูลรายงานปัญหาแบบเจาะจงตามรหัส (GET /api/reports/<id>)
# =========================================================================
@report_bp.route("/api/reports/<int:id>", methods=["GET"])
def get_report(id):
    """
    API Endpoint: GET /api/reports/<int:id>
    คำอธิบาย: ดึงข้อมูลรายละเอียดเชิงลึกของรายงานปัญหาเฉพาะเจาะจงตามรหัส ProblemID
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # ใช้ตัวพิมพ์เล็กและกำหนด AS เพื่อคงรูปแบบพิมพ์ใหญ่-เล็กส่งกลับให้ Frontend
        sql = """
            SELECT
                p.problemid AS "ProblemID", 
                p.itemid AS "ItemID", 
                p.memberid AS "MemberID", 
                p.reportedmemberid AS "ReportedMemberID",
                p.reportstatus AS "ReportStatus", 
                p.reportdate AS "ReportDate", 
                p.resolvedate AS "ResolveDate", 
                p.problemtype AS "ProblemType", 
                p.helpcenterdata AS "HelpCenterData",
                i.itemname AS "ItemName", 
                i.itemimage AS "ItemImage",
                reporter.displayname AS "ReporterName",
                reported.displayname AS "ReportedMemberName",
                a.adminname AS "AdminName"
            FROM problem p
            LEFT JOIN item i ON p.itemid = i.itemid
            LEFT JOIN member reporter ON p.memberid = reporter.memberid
            LEFT JOIN member reported ON p.reportedmemberid = reported.memberid
            LEFT JOIN admin a ON p.adminid = a.adminid
            WHERE p.problemid = %s
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


# =========================================================================
# 4. API: อัปเดตสถานะการจัดการรายงานปัญหา (PUT /api/reports/<id>)
# =========================================================================
@report_bp.route("/api/reports/<int:id>", methods=["PUT"])
def update_report(id):
    """
    API Endpoint: PUT /api/reports/<int:id>
    คำอธิบาย: อัปเดตสถานะการจัดการรายงานปัญหา
    """
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
                reportstatus = %s,
                resolvedate = NOW(),
                adminid = %s
            WHERE problemid = %s
        """

        cursor.execute(sql, (status, admin_id, id))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "อัปเดตสถานะการจัดการเรียบร้อยแล้ว"}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        print("Update Report Error:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500