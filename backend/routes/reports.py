from flask import Blueprint, request, jsonify
from db import get_connection

report_bp = Blueprint("report_bp", __name__)


# ===========================
# ส่งรายงาน
# ===========================
@report_bp.route("/api/reports", methods=["POST"])
def create_report():

    try:

        data = request.get_json()

        item_id = data.get("ItemID")
        member_id = data.get("MemberID")
        problem_type = data.get("ProblemType")
        help_center = data.get("HelpCenterData")

        if not item_id:
            return jsonify({
                "success": False,
                "message": "ไม่พบ ItemID"
            }), 400

        if not member_id:
            return jsonify({
                "success": False,
                "message": "ไม่พบ MemberID"
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        sql = """
        INSERT INTO problem
        (
            ItemID,
            MemberID,
            ReportStatus,
            HelpCenterData,
            ReportDate,
            ProblemType
        )
        VALUES
        (
            %s,
            %s,
            'รอดำเนินการ',
            %s,
            NOW(),
            %s
        )
        """

        cursor.execute(
            sql,
            (
                item_id,
                member_id,
                help_center,
                problem_type
            )
        )

        conn.commit()

        problem_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "ProblemID": problem_id,
            "message": "ส่งรายงานสำเร็จ"
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "message": str(e)
        }),500


# ===========================
# รายงานทั้งหมด
# ===========================
@report_bp.route("/api/reports", methods=["GET"])
def get_reports():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
    SELECT

        p.ProblemID,
        p.ReportStatus,
        p.ReportDate,
        p.ProblemType,
        p.HelpCenterData,

        i.ItemID,
        i.ItemName,
        i.ItemImage,

        m.MemberID,
        m.DisplayName

    FROM problem p

    LEFT JOIN item i
    ON p.ItemID=i.ItemID

    LEFT JOIN member m
    ON p.MemberID=m.MemberID

    ORDER BY p.ReportDate DESC
    """

    cursor.execute(sql)

    reports = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(reports)


# ===========================
# ดูรายงานเดียว
# ===========================
@report_bp.route("/api/reports/<int:id>", methods=["GET"])
def get_report(id):

    conn = get_connection()

    cursor = conn.cursor(dictionary=True)

    sql = """
    SELECT

        p.*,

        i.ItemName,
        i.ItemImage,

        m.DisplayName

    FROM problem p

    LEFT JOIN item i
    ON p.ItemID=i.ItemID

    LEFT JOIN member m
    ON p.MemberID=m.MemberID

    WHERE p.ProblemID=%s
    """

    cursor.execute(sql,(id,))

    report = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(report)


# ===========================
# เปลี่ยนสถานะ
# ===========================
@report_bp.route("/api/reports/<int:id>", methods=["PUT"])
def update_report(id):

    data = request.get_json()

    status = data.get("ReportStatus")

    admin_id = data.get("AdminID")

    conn = get_connection()

    cursor = conn.cursor()

    sql = """
    UPDATE problem

    SET

    ReportStatus=%s,
    ResolveDate=NOW(),
    AdminID=%s

    WHERE ProblemID=%s
    """

    cursor.execute(

        sql,

        (
            status,
            admin_id,
            id
        )

    )

    conn.commit()

    cursor.close()

    conn.close()

    return jsonify({

        "success":True

    })