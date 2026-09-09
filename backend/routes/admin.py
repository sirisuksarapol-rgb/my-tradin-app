import datetime
from flask import Blueprint, jsonify, request
from db import get_connection
from services.notification_service import notify_user

# ==========================================
# ADMIN BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ทั้งหมดที่อยู่ภายใต้สิทธิ์ผู้ดูแลระบบ (Admin Panel)
# ช่วยให้สามารถจัดการ Route, Middleware หรือ Prefix ร่วมกันได้อย่างเป็นระบบ (เช่น /api/admin/...)
admin_bp = Blueprint("admin", __name__)


# ==========================================
# HELPER FUNCTION: DATA FORMATTING & SERIALIZATION
# ==========================================
def format_cursor_data(cursor, data, is_single=False):
    """
    ฟังก์ชันตัวช่วย (Helper Function) สำหรับแปลงข้อมูลดิบ (Raw Data) ที่ได้จาก Database Cursor 
    ให้เป็นโครงสร้างข้อมูลประเภท Dictionary หรือ List of Dictionary ที่พร้อมสำหรับการแปลงเป็น JSON Response
    
    หน้าที่หลัก:
    1. แม็ปปิ้งชื่อคอลัมน์จาก cursor.description เข้ากับข้อมูลแต่ละแถว (กรณีข้อมูลเป็น Tuple)
    2. แปลงวัตถุประเภทวันที่และเวลา (datetime.datetime, datetime.date) ให้เป็น ISO 8601 String 
       เพื่อป้องกันปัญหา TypeError เมื่อ Flask พยายามแปลงข้อมูลดังกล่าวเป็น JSON
    
    Parameters:
        cursor (pymysql.cursors.Cursor): Database cursor ที่ใช้รันคำสั่ง Query เพื่อดึงโครงสร้างคอลัมน์
        data (tuple | list | dict | None): ข้อมูลดิบที่ได้จากการ fetch ผ่านคำสั่ง fetchall() หรือ fetchone()
        is_single (bool): กำหนดเป็น True หากต้องการแปลงข้อมูลชุดเดี่ยว (fetchone) หรือ False สำหรับหลายรายการ (fetchall)
        
    Returns:
        dict | list | None: โครงสร้างข้อมูลที่ผ่านการแปลงรูปแบบและ serialize เรียบร้อยแล้ว
    """
    if not cursor.description or data is None:
        return data if not is_single else None
    
    # ดึงชื่อคอลัมน์ทั้งหมดจากคำอธิบายของ cursor เพื่อใช้เป็น Key ใน Dictionary
    columns = [col[0] for col in cursor.description]
    
    def serialize_item(val):
        # ตรวจสอบและแปลงประเภทข้อมูลทางเวลา (Datetime/Date) ให้เป็นรูปแบบมาตรฐาน ISO String
        if isinstance(val, (datetime.datetime, datetime.date)):
            return val.isoformat()
        return val

    # กรณีที่ต้องการข้อมูลชุดเดี่ยว (Single Record)
    if is_single:
        if isinstance(data, dict):
            return {k: serialize_item(v) for k, v in data.items()}
        return {columns[i]: serialize_item(data[i]) for i in range(len(columns))}
    
    # กรณีที่ต้องการข้อมูลหลายรายการ (Multiple Records / List of rows)
    else:
        results = []
        for row in data:
            if isinstance(row, dict):
                results.append({k: serialize_item(v) for k, v in row.items()})
            else:
                results.append({columns[i]: serialize_item(row[i]) for i in range(len(columns))})
        return results


# ==========================================
# 1. DASHBOARD SUMMARY API
# ==========================================
@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """
    API Endpoint: GET /dashboard
    คำอธิบาย: รวบรวมและดึงข้อมูลสถิติภาพรวมระบบ (Metrics & Statistics) สำหรับแสดงผลบนหน้าจอ Dashboard ของผู้ดูแลระบบ
    
    กระบวนการทำงาน:
    1. เชื่อมต่อฐานข้อมูลและสร้าง Cursor
    2. รันคำสั่ง SQL นับจำนวนสมาชิกรวมทั้งหมดในตาราง member
    3. รันคำสั่ง SQL นับจำนวนโพสต์สิ่งของทั้งหมดในตาราง item
    4. รันคำสั่ง SQL นับจำนวนรายงานปัญหาที่มีสถานะค้างดำเนินการ ('Pending') ในตาราง problem
    5. ปิดการเชื่อมต่อและส่งคืนข้อมูลในรูปแบบ JSON Object
    """
    conn = get_connection()
    cursor = conn.cursor()

    # ดึงจำนวนสมาชิกทั้งหมดในระบบ
    cursor.execute("SELECT COUNT(*) total FROM member")
    row = cursor.fetchone()
    total_users = row["total"] if isinstance(row, dict) else row[0]

    # ดึงจำนวนสินค้าหรือโพสต์ทั้งหมดในระบบ
    cursor.execute("SELECT COUNT(*) total FROM item")
    row = cursor.fetchone()
    total_items = row["total"] if isinstance(row, dict) else row[0]

    # ดึงจำนวนรายงานปัญหาที่ยังอยู่ในสถานะรอดำเนินการ (Pending)
    cursor.execute("SELECT COUNT(*) total FROM problem WHERE ReportStatus='Pending'")
    row = cursor.fetchone()
    total_reports = row["total"] if isinstance(row, dict) else row[0]

    cursor.close()
    conn.close()

    # ส่งออกผลลัพธ์ข้อมูลสรุปเชิงสถิติกลับไปยัง Client
    return jsonify({
        "users": total_users,
        "items": total_items,
        "reports": total_reports
    })


# ==========================================
# 2. USER MANAGEMENT API (GET ALL USERS)
# ==========================================
@admin_bp.route("/users", methods=["GET"])
def users():
    """
    API Endpoint: GET /users
    คำอธิบาย: ดึงรายชื่อบัญชีผู้ใช้งานทั้งหมดในระบบเพื่อใช้ในหน้าบริหารจัดการสมาชิก (User Management)
    
    ฟีเจอร์เด่น:
    - ใช้ Subquery เพื่อคำนวณจำนวนโพสต์สินค้า (PostCount) ของสมาชิกแต่ละรายแบบเรียลไทม์
    - จัดเรียงข้อมูลตามวันที่สมัครสมาชิก (RegisterDate) จากใหม่ล่าสุดไปหาเก่าที่สุด (DESC)
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # ดึงข้อมูลโปรไฟล์ผู้ใช้ พร้อมทำ Subquery นับจำนวนโพสต์ของแต่ละ User
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


# ==========================================
# 3. ITEM MANAGEMENT API (GET ALL ITEMS)
# ==========================================
@admin_bp.route("/items", methods=["GET"])
def items():
    """
    API Endpoint: GET /items
    คำอธิบาย: ดึงรายการโพสต์สิ่งของทั้งหมดในระบบสำหรับการตรวจสอบและจัดการเนื้อหา (Item Management)
    
    กระบวนการทำงาน:
    - ทำการเชื่อมโยงข้อมูล (LEFT JOIN) ระหว่างตารางโพสต์สินค้า (item) และตารางสมาชิก (member) 
      เพื่อให้ทราบข้อมูลรายละเอียดของเจ้าของโพสต์
    - จัดเรียงลำดับตามวันที่โพสต์ (PostDate) ล่าสุดขึ้นก่อน
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # ดึงข้อมูลสินค้าพร้อมข้อมูลเจ้าของโพสต์
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


# ==========================================
# 4. REPORT MANAGEMENT API (GET ALL REPORTS)
# ==========================================
@admin_bp.route("/reports", methods=["GET"])
def reports():
    """
    API Endpoint: GET /reports
    คำอธิบาย: ดึงรายการแจ้งปัญหาทั้งหมดที่ผู้ใช้งานส่งเข้ามาในระบบ (Report Management)
    
    กระบวนการทำงาน:
    - เชื่อมโยงตารางรายงานปัญหา (problem) เข้ากับตารางสินค้า (item) และตารางสมาชิก (member) 
      เพื่อให้แอดมินเห็นบริบทว่าปัญหานั้นเกี่ยวข้องกับสินค้าชิ้นไหนและใครเป็นผู้แจ้ง
    - เรียงลำดับจากวันที่แจ้งล่าสุด (ReportDate DESC)
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # ดึงข้อมูลรายงานปัญหาพร้อมเชื่อมโยงข้อมูลสินค้าและผู้แจ้ง
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


# ==========================================
# 5. RESOLVE REPORT API
# ==========================================
@admin_bp.route("/reports/<int:problem_id>", methods=["PUT"])
def resolve_report(problem_id):
    """
    API Endpoint: PUT /reports/<problem_id>
    คำอธิบาย: อัปเดตสถานะของเคสรายงานปัญหาให้เป็น 'Resolved' (แก้ไข/ปิดเคสแล้ว) พร้อมส่งแจ้งเตือนหาผู้ใช้
    
    กระบวนการทำงาน:
    1. ตรวจสอบว่ามี ProblemID นี้อยู่จริงในระบบหรือไม่ พร้อมดึงข้อมูลเจ้าของปัญหาและประเภทปัญหา
    2. ทำการอัปเดตสถานะในตาราง problem เป็น 'Resolved' และบันทึกธุรกรรม (commit)
    3. ส่งระบบแจ้งเตือน (Notification) ไปยังสมาชิกเจ้าของปัญหา เพื่อแจ้งผลการตรวจสอบ
    4. มีระบบจัดการข้อผิดพลาด (Try-Except-Finally) พร้อม Rollback ข้อมูลหากเกิดความผิดพลาดระหว่างทาง
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ตรวจสอบความถูกต้องและค้นหาข้อมูลรายงานปัญหาก่อนดำเนินการ
        cursor.execute("""
            SELECT MemberID, ProblemType 
            FROM problem 
            WHERE ProblemID = %s
        """, (problem_id,))
        report = cursor.fetchone()

        if not report:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลรายงานปัญหานี้"}), 404

        # เปลี่ยนสถานะรายงานปัญหาเป็น Resolved
        update_sql = "UPDATE problem SET ReportStatus = 'Resolved' WHERE ProblemID = %s"
        cursor.execute(update_sql, (problem_id,))
        conn.commit()

        # ส่งการแจ้งเตือนหาผู้ใช้งาน หากเคสดังกล่าวมีระบุตัวตนผู้แจ้ง
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


# ==========================================
# 6. SUSPEND USER API (BAN USER)
# ==========================================
@admin_bp.route("/users/<int:member_id>/suspend", methods=["PUT"])
def suspend_user(member_id):
    """
    API Endpoint: PUT /users/<member_id>/suspend
    คำอธิบาย: ระงับสิทธิ์การใช้งานบัญชีผู้ใช้ (Account Suspension) 
             รองรับทั้งการแบนแบบชั่วคราว (กำหนดจำนวนวัน) และแบบถาวร พร้อมระบุเหตุผล
    
    กระบวนการทำงาน:
    1. รับค่าพารามิเตอร์ประเภทการแบน (type), จำนวนวัน (days), และเหตุผล (reason) จาก Request Body
    2. คำนวณวันเวลาสิ้นสุดการแบน (SuspendedUntil) หากเป็นการระงับชั่วคราว
    3. อัปเดตสถานะสมาชิกในตาราง member เป็น 'Suspended' พร้อมบันทึกข้อมูลเวลาสิ้นสุดและเหตุผล
    4. ส่งข้อความแจ้งเตือนรายละเอียดการระงับสิทธิ์ไปยังผู้ใช้งานผ่านระบบ Notification
    """
    data = request.json or {}
    suspend_type = data.get("type", "permanent")
    days = data.get("days", 0)
    reason = data.get("reason", "ละเมิดเงื่อนไขข้อตกลงของระบบ")

    # คำนวณวันสิ้นสุดการแบนกรณีเลือกแบบชั่วคราว (Temporary Suspension)
    suspended_until = None
    if suspend_type == "temporary" and days:
        suspended_until = datetime.datetime.now() + datetime.timedelta(days=int(days))

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # อัปเดตสถานะบัญชีผู้ใช้เป็นถูกระงับสิทธิ์
        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Suspended', 
                SuspendedUntil = %s, 
                SuspendReason = %s 
            WHERE MemberID = %s
        """, (suspended_until, reason, member_id))
        conn.commit()

        # จัดเตรียมข้อความอธิบายเหตุผลและกำหนดการแบนสำหรับแจ้งเตือนผู้ใช้
        message = f"บัญชีของคุณถูกระงับเนื่องจาก: {reason}"
        if suspended_until:
            message += f"\nจะสามารถใช้งานได้อีกครั้งในวันที่ {suspended_until.strftime('%d/%m/%Y %H:%M น.')}"
        else:
            message += "\n(ระงับแบบถาวร)"

        # ส่งการแจ้งเตือนไปยังผู้ใช้
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


# ==========================================
# 7. UNSUSPEND USER API (RESTORE USER)
# ==========================================
@admin_bp.route("/users/<int:member_id>/unsuspend", methods=["PUT"])
def unsuspend_user(member_id):
    """
    API Endpoint: PUT /users/<member_id>/unsuspend
    คำอธิบาย: คืนสิทธิ์การใช้งาน (Unsuspend) ให้กับบัญชีผู้ใช้ที่เคยถูกระงับ เพื่อให้กลับมาใช้งานระบบได้ตามปกติ
    
    กระบวนการทำงาน:
    1. ปรับสถานะ MemberStatus ในตาราง member กลับเป็น 'Active'
    2. ล้างข้อมูลระยะเวลาและเหตุผลการแบน (ตั้งค่า SuspendedUntil และ SuspendReason เป็น NULL)
    3. บันทึกฐานข้อมูลและส่งการแจ้งเตือนคืนสิทธิ์ไปยังผู้ใช้งาน
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # รีเซ็ตสถานะผู้ใช้กลับเป็นปกติ
        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Active', 
                SuspendedUntil = NULL, 
                SuspendReason = NULL 
            WHERE MemberID = %s
        """, (member_id,))
        conn.commit()

        # ส่งข้อความแจ้งเตือนว่าบัญชีได้รับการปลดแบนแล้ว
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
        

# ==========================================
# 8. DELETE ITEM BY ADMIN API
# ==========================================
@admin_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item_by_admin(item_id):
    """
    API Endpoint: DELETE /items/<item_id>
    คำอธิบาย: ลบโพสต์สินค้าออกจากระบบโดยอำนาจของผู้ดูแลระบบ (กรณีโพสต์ละเมิดกฎระเบียบ)
    
    กระบวนการทำงาน:
    1. ตรวจสอบว่ามีโพสต์สินค้านี้อยู่จริง พร้อมดึงข้อมูลรหัสเจ้าของโพสต์ (MemberID) และชื่อสินค้า (ItemName)
    2. ดำเนินการลบข้อมูลสินค้าออกจากตาราง item
    3. ส่งการแจ้งเตือนไปยังเจ้าของโพสต์ เพื่อแจ้งให้ทราบว่าโพสต์ดังกล่าวถูกลบเนื่องจากเหตุผลใด
    4. จัดการ Transaction Commit/Rollback และปิด Connection ให้อัตโนมัติ
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ตรวจสอบการมีอยู่ของโพสต์และดึงข้อมูลเจ้าของเพื่อส่งแจ้งเตือนภายหลัง
        cursor.execute("SELECT MemberID, ItemName FROM item WHERE ItemID = %s", (item_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify({"success": False, "message": "ไม่พบรายการโพสต์นี้"}), 404

        # ลบโพสต์ออกจากฐานข้อมูล
        cursor.execute("DELETE FROM item WHERE ItemID = %s", (item_id,))
        conn.commit()

        # ส่งข้อความแจ้งเตือนเหตุผลการลบโพสต์หาเจ้าของสินค้า
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