from flask import Blueprint, request, jsonify
from db import get_connection

# ==========================================
# REPORT SYSTEM BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับการรายงานปัญหาและข้อเสนอแนะ (Report Management)
report_bp = Blueprint("report_bp", __name__)


# =========================================================================
# 1. API: ส่งรายงานปัญหาใหม่ (POST /api/reports)
# =========================================================================
@report_bp.route("/api/reports", methods=["POST"])
def create_report():
    """
    API Endpoint: POST /api/reports
    คำอธิบาย: บันทึกรายงานปัญหา ข้อเสนอแนะ หรือการแจ้งเบาะแสใหม่เข้าสู่ระบบ
    
    รายละเอียดการทำงาน:
    1. รับข้อมูล JSON Request Body (ItemID, MemberID, ReportedMemberID, ProblemType, HelpCenterData)
    2. ตรวจสอบข้อมูลผู้แจ้ง (MemberID) หากไม่พบจะคืนค่าข้อผิดพลาดสถานะ 400
    3. ตรวจสอบเนื้อหารายงาน (HelpCenterData) ว่ามีการระบุรายละเอียดหรือไม่
    4. ตรวจสอบเงื่อนไขตามประเภทปัญหา (Validation) หากไม่ใช่ประเภทระบบหรือข้อเสนอแนะทั่วไป จะต้องระบุไอเทมหรือสมาชิกที่ถูกรายงานด้วย
    5. เชื่อมต่อฐานข้อมูลและบันทึกข้อมูลลงในตาราง problem โดยกำหนดสถานะเริ่มต้นเป็น 'รอดำเนินการ' และบันทึกเวลาปัจจุบัน (NOW())
    6. ทำการ commit ข้อมูลและคืนค่า ProblemID พร้อมข้อความสำเร็จกลับไปในรูปแบบ JSON (สถานะ 201)
    """
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
        # หากไม่ใช่ประเภทแจ้งปัญหาระบบหรือข้อเสนอแนะ จะต้องระบุ Target (Item หรือ Member) อย่างใดอย่างหนึ่ง
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

        # แปลงค่าไอดีให้อยู่ในรูปแบบ Integer หรือ None สำหรับ MySQL
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


# =========================================================================
# 2. API: ดึงข้อมูลรายงานปัญหาทั้งหมดสำหรับผู้ดูแลระบบ (GET /api/reports)
# =========================================================================
@report_bp.route("/api/reports", methods=["GET"])
def get_reports():
    """
    API Endpoint: GET /api/reports
    คำอธิบาย: ดึงรายการรายงานปัญหาและข้อเสนอแนะทั้งหมดในระบบสำหรับหน้าจอจัดการของผู้ดูแลระบบ (Admin)
    
    รายละเอียดการทำงาน:
    1. เชื่อมต่อฐานข้อมูลและสร้าง Cursor แบบปกติ
    2. ดึงข้อมูลจากตาราง problem พร้อมทำ LEFT JOIN กับตาราง item, member (ทั้งผู้แจ้งและผู้ถูกรายงาน) และตาราง admin
    3. จัดเรียงลำดับรายการจากวันที่รายงานล่าสุดไปหาเก่าที่สุด (ReportDate DESC)
    4. แปลงข้อมูลผลลัพธ์ให้อยู่ในรูปแบบ List ของ Dictionary และส่งคืนในรูปแบบ JSON (สถานะ 200)
    """
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


# =========================================================================
# 3. API: ดึงข้อมูลรายงานปัญหาแบบเจาะจงตามรหัส (GET /api/reports/<id>)
# =========================================================================
@report_bp.route("/api/reports/<int:id>", methods=["GET"])
def get_report(id):
    """
    API Endpoint: GET /api/reports/<int:id>
    คำอธิบาย: ดึงข้อมูลรายละเอียดเชิงลึกของรายงานปัญหาเฉพาะเจาะจงตามรหัส ProblemID
    
    รายละเอียดการทำงาน:
    1. รับค่ารหัสปัญหา (id) ผ่าน URL Path Parameter
    2. ค้นหาข้อมูลในตาราง problem พร้อมเชื่อมโยงข้อมูลรายละเอียดสินค้า สมาชิก และแอดมินที่เกี่ยวข้อง
    3. ตรวจสอบว่าพบข้อมูลหรือไม่ หากพบจะแปลงเป็น Dictionary แล้วส่งคืนในรูปแบบ JSON (สถานะ 200)
    4. หากไม่พบข้อมูลจะคืนค่าข้อผิดพลาดสถานะ 404
    """
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


# =========================================================================
# 4. API: อัปเดตสถานะการจัดการรายงานปัญหา (PUT /api/reports/<id>)
# =========================================================================
@report_bp.route("/api/reports/<int:id>", methods=["PUT"])
def update_report(id):
    """
    API Endpoint: PUT /api/reports/<int:id>
    คำอธิบาย: อัปเดตสถานะการจัดการรายงานปัญหา (เช่น เปลี่ยนเป็น 'กำลังดำเนินการ', 'แก้ไขแล้ว' ฯลฯ) โดยผู้ดูแลระบบ
    
    รายละเอียดการทำงาน:
    1. รับรหัสรายงาน (id) ผ่าน URL Path Parameter และรับข้อมูล ReportStatus กับ AdminID ผ่าน JSON Request Body
    2. ตรวจสอบความครบถ้วนของข้อมูล หากไม่ครบจะคืนค่าสถานะ 400
    3. ทำการอัปเดตสถานะ ReportStatus, บันทึกเวลาที่แก้ไขเสร็จ (ResolveDate เป็น NOW()) และบันทึกรหัสแอดมินผู้จัดการ (AdminID)
    4. ทำการ commit ฐานข้อมูลและส่งข้อความแจ้งความสำเร็จกลับไปในรูปแบบ JSON (สถานะ 200)
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