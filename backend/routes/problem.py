from flask import Blueprint, jsonify, request
from db import get_connection

problem_bp = Blueprint("problem", __name__)

@problem_bp.route("/api/reports", methods=["POST"])
def create_report():
    try:
        # 1. รับข้อมูล JSON จาก Frontend (Axios)
        data = request.get_json()
        
        item_id = data.get("itemId")
        reason = data.get("reason")          # ข้อความเหตุผลจาก Textarea
        problem_type = data.get("problemType") # "โพสต์ไม่เหมาะสม"
        member_id = data.get("memberId")

        # 2. ตรวจสอบว่าส่งข้อมูลมาครบไหม
        if not all([item_id, reason, problem_type, member_id]):
            return jsonify({"error": "กรุณากรอกข้อมูลให้ครบถ้วน"}), 400

        # 3. เชื่อมต่อฐานข้อมูล tradin_db
        conn = get_connection()
        cursor = conn.cursor()

        # 4. คำสั่ง SQL INSERT เข้าตาราง problem ตามโครงสร้างจริงของคุณ
        # - HelpCenterData: ใช้เก็บรายละเอียดเหตุผล (reason) ที่ผู้ใช้พิมพ์เข้ามา
        # - ReportStatus: กำหนดค่าเริ่มต้นเป็น 'pending' (รอตรวจสอบ)
        # - ReportDate: ใช้ฟังก์ชัน NOW() ของ MySQL บันทึกเวลาปัจจุบัน
        query = """
            INSERT INTO problem (ItemID, ProblemType, HelpCenterData, MemberID, ReportStatus, ReportDate)
            VALUES (%s, %s, %s, %s, 'pending', NOW())
        """
        cursor.execute(query, (item_id, problem_type, reason, member_id))

        conn.commit()
        conn.close()

        # 5. ส่ง Response กลับไปบอก Frontend ว่าสำเร็จ
        return jsonify({"message": "ส่งรายงานเรียบร้อยแล้ว"}), 201

    except Exception as e:
        print("❌ Error in create_report:", e)
        return jsonify({"error": str(e)}), 500