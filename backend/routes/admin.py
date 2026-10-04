import datetime
from flask import Blueprint, jsonify, request, current_app
from db import get_connection
from services.notification_service import notify_user

admin_bp = Blueprint("admin", __name__)

def format_cursor_data(cursor, data, is_single=False):
    """
    แปลงข้อมูลดิบจาก Database Cursor ให้เป็น Dictionary หรือ List of Dictionary 
    พร้อมแปลงข้อมูลเวลา (Datetime/Date) เป็น ISO 8601 String
    """
    if not cursor.description or data is None:
        return data if not is_single else None
    
    columns = [col[0] for col in cursor.description]
    
    def serialize_item(val):
        if isinstance(val, (datetime.datetime, datetime.date)):
            return val.isoformat()
        return val

    if is_single:
        if isinstance(data, dict):
            return {k: serialize_item(v) for k, v in data.items()}
        return {columns[i]: serialize_item(data[i]) for i in range(len(columns))}
    
    results = []
    for row in data:
        if isinstance(row, dict):
            results.append({k: serialize_item(v) for k, v in row.items()})
        else:
            results.append({columns[i]: serialize_item(row[i]) for i in range(len(columns))})
    return results


@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """ดึงข้อมูลสถิติภาพรวมระบบ (Metrics & Statistics) สำหรับ Dashboard"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as total FROM member")
        total_users = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM item")
        total_items = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM problem WHERE ReportStatus='Pending'")
        total_reports = cursor.fetchone()["total"]

        return jsonify({
            "users": total_users,
            "items": total_items,
            "reports": total_reports
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({"error": "เกิดข้อผิดพลาดในการดึงข้อมูล"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/users", methods=["GET"])
def users():
    """ดึงรายชื่อบัญชีผู้ใช้งานทั้งหมดในระบบ พร้อมจำนวนโพสต์"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                m.MemberID, m.DisplayName, m.Email, m.ProfileImage,
                m.RegisterDate, m.MemberStatus,
                (SELECT COUNT(*) FROM item i WHERE i.MemberID = m.MemberID) AS PostCount
            FROM member m
            ORDER BY m.RegisterDate DESC
        """)
        return jsonify(format_cursor_data(cursor, cursor.fetchall())), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({"error": "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/items", methods=["GET"])
def items():
    """ดึงข้อมูลรายการโพสต์สิ่งของทั้งหมดในระบบ"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                i.ItemID, i.ItemName, i.ItemDescription, i.ItemImage,
                i.ItemStatus, i.PostDate, i.CategoryID,
                m.MemberID, m.DisplayName, m.ProfileImage
            FROM item i
            LEFT JOIN member m ON i.MemberID = m.MemberID
            ORDER BY i.PostDate DESC
        """)
        return jsonify(format_cursor_data(cursor, cursor.fetchall())), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching items: {str(e)}")
        return jsonify({"error": "เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/reports", methods=["GET"])
def reports():
    """ดึงรายการแจ้งปัญหาทั้งหมด พร้อมบริบทที่เกี่ยวข้องกับสินค้าและผู้แจ้ง"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                p.ProblemID, p.ReportStatus, p.ReportDate, p.ProblemType, p.HelpCenterData,
                i.ItemID, i.ItemName, m.MemberID, m.DisplayName
            FROM problem p
            LEFT JOIN item i ON p.ItemID = i.ItemID
            LEFT JOIN member m ON p.MemberID = m.MemberID
            ORDER BY p.ReportDate DESC
        """)
        return jsonify(format_cursor_data(cursor, cursor.fetchall())), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching reports: {str(e)}")
        return jsonify({"error": "เกิดข้อผิดพลาดในการดึงข้อมูลรายงานปัญหา"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/reports/<int:problem_id>", methods=["PUT"])
def resolve_report(problem_id):
    """แก้ไขสถานะรายงานปัญหาเป็น 'Resolved' และส่งแจ้งเตือนกลับไปยังผู้แจ้ง"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        resolution_msg = data.get("resolution_message", "").strip()

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT MemberID, ProblemType FROM problem WHERE ProblemID = %s", (problem_id,))
        report = cursor.fetchone()

        if not report:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลรายงานปัญหานี้"}), 404

        cursor.execute("UPDATE problem SET ReportStatus = 'Resolved' WHERE ProblemID = %s", (problem_id,))
        conn.commit()

        if report.get("MemberID"):
            problem_type = report["ProblemType"] or "ข้อเสนอแนะ/ปัญหาที่คุณแจ้ง"
            message = f"แอดมินได้ตรวจสอบและดำเนินการ: {resolution_msg} (เคส: {problem_type})" if resolution_msg else f"แอดมินได้ตรวจสอบและแก้ไข '{problem_type}' เรียบร้อยแล้ว ขอบคุณที่ช่วยส่งข้อเสนอแนะครับ!"
            
            notify_user(
                member_id=report["MemberID"], 
                title="อัปเดตสถานะการรายงาน", 
                message=message, 
                link="/notifications"
            )

        return jsonify({"success": True, "message": "ปิดเคสและส่งแจ้งเตือนไปยังผู้แจ้งเรียบร้อยแล้ว"}), 200
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error resolving report {problem_id}: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการดำเนินการ"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/users/<int:member_id>/suspend", methods=["PUT"])
def suspend_user(member_id):
    """ระงับสิทธิ์การใช้งานของสมาชิกตามระยะเวลาที่กำหนด พร้อมแจ้งเตือนผ่านระบบและอีเมล"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        suspend_type = data.get("type", "permanent")
        until_date_str = data.get("until_date")
        reason = data.get("reason", "ละเมิดเงื่อนไขข้อตกลงของระบบ")

        suspended_until = None
        if suspend_type == "temporary" and until_date_str:
            try:
                suspended_until = datetime.datetime.strptime(until_date_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            except ValueError:
                pass

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT Email, DisplayName FROM member WHERE MemberID = %s", (member_id,))
        user_info = cursor.fetchone()

        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Suspended', SuspendedUntil = %s, SuspendReason = %s 
            WHERE MemberID = %s
        """, (suspended_until, reason, member_id))
        conn.commit()

        message = f"บัญชีของคุณถูกระงับเนื่องจาก: {reason}"
        message += f"\nจะสามารถใช้งานได้อีกครั้งในวันที่ {suspended_until.strftime('%d/%m/%Y %H:%M น.')}" if suspended_until else "\n(ระงับแบบถาวร)"

        notify_user(member_id=member_id, title="แจ้งเตือนการระงับสิทธิ์ใช้งาน", message=message, link="/contact")

        if user_info and user_info.get("Email"):
            current_app.logger.info(f"📧 Sending suspension email to: {user_info['Email']} | Reason: {reason}")

        return jsonify({"success": True, "message": "ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"}), 200
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error suspending user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการระงับสิทธิ์"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/users/<int:member_id>/unsuspend", methods=["PUT"])
def unsuspend_user(member_id):
    """คืนสิทธิ์การใช้งานให้กับบัญชีที่ถูกระงับ"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            UPDATE member 
            SET MemberStatus = 'Active', SuspendedUntil = NULL, SuspendReason = NULL 
            WHERE MemberID = %s
        """, (member_id,))
        conn.commit()

        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการคืนสิทธิ์ใช้งาน",
            message="บัญชีของคุณได้รับการคืนสิทธิ์การใช้งานแล้ว คุณสามารถเข้าใช้งานได้ตามปกติ",
            link="/"
        )

        return jsonify({"success": True, "message": "คืนสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"}), 200
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error unsuspending user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการคืนสิทธิ์"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item_by_admin(item_id):
    """ลบโพสต์ออกจากระบบโดยสิทธิ์ผู้ดูแลระบบ และแจ้งเตือนเจ้าของโพสต์"""
    conn = None
    cursor = None
    try:
        data = request.json or {}
        reason = data.get("reason", "ผิดเงื่อนไขการใช้งานของระบบ")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT MemberID, ItemName FROM item WHERE ItemID = %s", (item_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify({"success": False, "message": "ไม่พบรายการโพสต์นี้"}), 404

        cursor.execute("DELETE FROM item WHERE ItemID = %s", (item_id,))
        conn.commit()

        if item.get("MemberID"):
            notify_user(
                member_id=item["MemberID"],
                title="แจ้งเตือนการลบโพสต์",
                message=f"โพสต์ '{item.get('ItemName', 'สิ่งของของคุณ')}' ถูกลบโดยผู้ดูแลระบบ เนื่องจาก: {reason}"
            )

        return jsonify({"success": True, "message": "ลบโพสต์เรียบร้อยแล้ว"}), 200
    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"Error deleting item {item_id}: {str(e)}")
        return jsonify({"success": False, "message": "เกิดข้อผิดพลาดในการลบโพสต์"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@admin_bp.route("/users/<int:member_id>/stats", methods=["GET"])
def get_user_stats(member_id):
    """ดึงสถิติการแลกเปลี่ยนและรีวิวของผู้ใช้งานเฉพาะราย"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT COUNT(*) AS total FROM exchange 
            WHERE (MemberID = %s OR TargetMemberID = %s) AND (ExchangeStatus = 'Completed' OR ExchangerResult = 'Success')
        """, (member_id, member_id))
        successful_exchanges = (cursor.fetchone() or {}).get("total", 0)

        cursor.execute("""
            SELECT COUNT(*) AS total FROM exchange 
            WHERE (MemberID = %s OR TargetMemberID = %s) AND (ExchangeStatus = 'Cancelled' OR ExchangerResult = 'Failed')
        """, (member_id, member_id))
        failed_exchanges = (cursor.fetchone() or {}).get("total", 0)

        cursor.execute("""
            SELECT 
                e.ExchangeID, e.Score, e.Comment, e.PartnerScore, e.PartnerComment, 
                e.SuccessDate, e.StartDate, e.MemberID, e.TargetMemberID,
                m1.DisplayName AS SenderName, m2.DisplayName AS TargetName
            FROM exchange e
            LEFT JOIN member m1 ON e.MemberID = m1.MemberID
            LEFT JOIN member m2 ON e.TargetMemberID = m2.MemberID
            WHERE e.MemberID = %s OR e.TargetMemberID = %s
        """, (member_id, member_id))
        raw_reviews = cursor.fetchall()

        reviews = []
        total_score = 0
        score_count = 0

        for row in raw_reviews:
            is_member = (int(row["MemberID"]) == int(member_id))
            comment = row.get("PartnerComment") if is_member else row.get("Comment")
            score = row.get("PartnerScore") if is_member else row.get("Score")
            reviewer_name = (row.get("TargetName") if is_member else row.get("SenderName")) or "ผู้ใช้งานระบบ"

            if score is not None:
                total_score += float(score)
                score_count += 1

            if comment or score is not None:
                rev_date = row.get("SuccessDate") or row.get("StartDate")
                reviews.append({
                    "id": row["ExchangeID"],
                    "comment": comment or "ไม่มีความคิดเห็น",
                    "rating": int(score or 0),
                    "reviewerName": reviewer_name,
                    "date": rev_date.strftime('%d/%m/%Y %H:%M') if isinstance(rev_date, datetime.datetime) else ""
                })

        average_rating = (total_score / score_count) if score_count > 0 else 0.0

        return jsonify({
            "success": True,
            "data": {
                "totalItems": 0,
                "successfulExchanges": successful_exchanges,
                "failedExchanges": failed_exchanges,
                "rating": round(average_rating, 1),
                "reviews": reviews
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching stats for user {member_id}: {str(e)}")
        return jsonify({
            "success": False, 
            "message": "เกิดข้อผิดพลาดในการดึงสถิติ", 
            "data": {"successfulExchanges": 0, "failedExchanges": 0, "rating": 0.0, "reviews": []}
        }), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()