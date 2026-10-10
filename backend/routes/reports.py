from flask import Blueprint, request, jsonify, current_app
from db import get_connection


report_bp = Blueprint("report_bp", __name__)


@report_bp.route("/api/reports", methods=["POST"])
def create_report():
    conn = None
    cursor = None

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

        report_types = [
            "bug", "suggestion", "other",
            "แจ้งปัญหาระบบ", "ข้อเสนอแนะ", "อื่น ๆ"
        ]

        if problem_type not in report_types and not item_id and not reported_member_id:
            return jsonify({
                "success": False,
                "message": "กรุณาระบุสิ่งของหรือสมาชิกที่ต้องการรายงาน"
            }), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO problem (
                ItemID, MemberID, ReportedMemberID, ReportStatus,
                HelpCenterData, ReportDate, ProblemType
            )
            VALUES (%s, %s, %s, 'รอดำเนินการ', %s, NOW(), %s)
        """, (
            int(item_id) if item_id else None,
            int(member_id),
            int(reported_member_id) if reported_member_id else None,
            str(help_center).strip(),
            problem_type
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "ProblemID": cursor.lastrowid,
            "message": "ส่งรายงานสำเร็จเรียบร้อยแล้ว"
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Create Report Error: {e}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการส่งรายงาน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@report_bp.route("/api/reports", methods=["GET"])
def get_reports():
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
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
        """)

        return jsonify({
            "success": True,
            "data": cursor.fetchall()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get Reports Error: {e}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@report_bp.route("/api/reports/<int:id>", methods=["GET"])
def get_report(id):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.*,
                i.ItemName, i.ItemImage,
                reporter.DisplayName AS ReporterName,
                reported.DisplayName AS ReportedMemberName,
                a.AdminName
            FROM problem p
            LEFT JOIN item i ON p.ItemID = i.ItemID
            LEFT JOIN member reporter ON p.MemberID = reporter.MemberID
            LEFT JOIN member reported ON p.ReportedMemberID = reported.MemberID
            LEFT JOIN admin a ON p.AdminID = a.AdminID
            WHERE p.ProblemID = %s
        """, (id,))

        report = cursor.fetchone()

        if not report:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลรายงานที่ต้องการ"
            }), 404

        return jsonify({
            "success": True,
            "data": report
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get Report By ID Error: {e}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@report_bp.route("/api/reports/<int:id>", methods=["PUT"])
def update_report(id):
    conn = None
    cursor = None

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

        cursor.execute("""
            UPDATE problem
            SET ReportStatus = %s, ResolveDate = NOW(), AdminID = %s
            WHERE ProblemID = %s
        """, (status, admin_id, id))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "อัปเดตสถานะการจัดการเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Update Report Error: {e}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการอัปเดตสถานะ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()