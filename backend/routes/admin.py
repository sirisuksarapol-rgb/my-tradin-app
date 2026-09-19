import datetime
from flask import Blueprint, jsonify, request
from db import get_connection
from services.notification_service import notify_user

# ==========================================
# ADMIN BLUEPRINT CONFIGURATION
# ==========================================
admin_bp = Blueprint("admin", __name__)


# ==========================================
# HELPER FUNCTION: DATA FORMATTING & SERIALIZATION
# ==========================================
def format_cursor_data(cursor, data, is_single=False):
    """
    ฟังก์ชันตัวช่วย (Helper Function) สำหรับแปลงข้อมูลดิบ (Raw Data) ที่ได้จาก Database Cursor 
    ให้เป็นโครงสร้างข้อมูลประเภท Dictionary หรือ List of Dictionary ที่พร้อมสำหรับการแปลงเป็น JSON Response
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
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total FROM member")
    row = cursor.fetchone()
    total_users = row["total"] if isinstance(row, dict) else row[0]

    cursor.execute("SELECT COUNT(*) AS total FROM item")
    row = cursor.fetchone()
    total_items = row["total"] if isinstance(row, dict) else row[0]

    cursor.execute("SELECT COUNT(*) AS total FROM problem WHERE reportstatus = 'Pending'")
    row = cursor.fetchone()
    total_reports = row["total"] if isinstance(row, dict) else row[0]

    cursor.close()
    conn.close()

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
    คำอธิบาย: ดึงรายชื่อบัญชีผู้ใช้งานทั้งหมดในระบบเพื่อใช้ในหน้าบริหารจัดการสมาชิก
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # ใช้ AS "..." เพื่อคงรูปแบบพิมพ์ใหญ่-เล็กส่งกลับให้ Frontend
    cursor.execute("""
        SELECT
            m.memberid AS "MemberID",
            m.displayname AS "DisplayName",
            m.email AS "Email",
            m.profileimage AS "ProfileImage",
            m.registerdate AS "RegisterDate",
            m.memberstatus AS "MemberStatus",
            (
                SELECT COUNT(*)
                FROM item i
                WHERE i.memberid = m.memberid
            ) AS "PostCount"
        FROM member m
        ORDER BY m.registerdate DESC
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
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT
            i.itemid AS "ItemID",
            i.itemname AS "ItemName",
            i.itemdescription AS "ItemDescription",
            i.itemimage AS "ItemImage",
            i.itemstatus AS "ItemStatus",
            i.postdate AS "PostDate",
            m.memberid AS "MemberID",
            m.displayname AS "DisplayName",
            m.profileimage AS "ProfileImage",
            i.categoryid AS "CategoryID"
        FROM item i
        LEFT JOIN member m ON i.memberid = m.memberid
        ORDER BY i.postdate DESC
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
    คำอธิบาย: ดึงรายการแจ้งปัญหาทั้งหมดที่ผู้ใช้งานส่งเข้ามาในระบบ
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT
            p.problemid AS "ProblemID",
            p.reportstatus AS "ReportStatus",
            p.reportdate AS "ReportDate",
            p.problemtype AS "ProblemType",
            p.helpcenterdata AS "HelpCenterData",
            i.itemid AS "ItemID",
            i.itemname AS "ItemName",
            m.memberid AS "MemberID",
            m.displayname AS "DisplayName"
        FROM problem p
        LEFT JOIN item i ON p.itemid = i.itemid
        LEFT JOIN member m ON p.memberid = m.memberid
        ORDER BY p.reportdate DESC
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
    คำอธิบาย: อัปเดตสถานะของเคสรายงานปัญหาให้เป็น 'Resolved' พร้อมส่งแจ้งเตือนหาผู้ใช้
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # ใช้ตัวพิมพ์เล็กในคำสั่ง SQL เพื่อป้องกันปัญหากับ PostgreSQL
        cursor.execute("""
            SELECT memberid, problemtype 
            FROM problem 
            WHERE problemid = %s
        """, (problem_id,))
        report = cursor.fetchone()

        if not report:
            return jsonify({"success": False, "message": "ไม่พบข้อมูลรายงานปัญหานี้"}), 404

        update_sql = "UPDATE problem SET reportstatus = 'Resolved' WHERE problemid = %s"
        cursor.execute(update_sql, (problem_id,))
        conn.commit()

        # ดึงค่าจาก Dictionary เป็นตัวพิมพ์เล็ก
        if report.get("memberid"):
            member_id = report["memberid"]
            problem_type = report["problemtype"] or "ปัญหาที่คุณแจ้ง"
            
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
    data = request.json or {}
    suspend_type = data.get("type", "permanent")
    until_date_str = data.get("until_date")
    reason = data.get("reason", "ละเมิดเงื่อนไขข้อตกลงของระบบ")

    suspended_until = None
    if suspend_type == "temporary" and until_date_str:
        try:
            suspended_until = datetime.datetime.strptime(until_date_str, "%Y-%m-%d")
            suspended_until = suspended_until.replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            UPDATE member 
            SET memberstatus = 'Suspended', 
                suspendeduntil = %s, 
                suspendreason = %s 
            WHERE memberid = %s
        """, (suspended_until, reason, member_id))
        conn.commit()

        message = f"บัญชีของคุณถูกระงับเนื่องจาก: {reason}"
        if suspended_until:
            message += f"\nจะสามารถใช้งานได้อีกครั้งในวันที่ {suspended_until.strftime('%d/%m/%Y %H:%M น.')}"
        else:
            message += "\n(ระงับแบบถาวร)"

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
    คำอธิบาย: คืนสิทธิ์การใช้งาน (Unsuspend) ให้กับบัญชีผู้ใช้ที่เคยถูกระงับ
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            UPDATE member 
            SET memberstatus = 'Active', 
                suspendeduntil = NULL, 
                suspendreason = NULL 
            WHERE memberid = %s
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
        

# ==========================================
# 8. DELETE ITEM BY ADMIN API
# ==========================================
@admin_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item_by_admin(item_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        data = request.json or {}
        reason = data.get("reason", "ผิดเงื่อนไขการใช้งานของระบบ")

        cursor.execute("SELECT memberid, itemname FROM item WHERE itemid = %s", (item_id,))
        item = cursor.fetchone()

        if not item:
            return jsonify({"success": False, "message": "ไม่พบรายการโพสต์นี้"}), 404

        cursor.execute("DELETE FROM item WHERE itemid = %s", (item_id,))
        conn.commit()

        # อ่านค่าจากคีย์ตัวพิมพ์เล็ก
        if item.get("memberid"):
            notify_user(
                member_id=item["memberid"],
                title="แจ้งเตือนการลบโพสต์",
                message=f"โพสต์ '{item.get('itemname', 'สิ่งของของคุณ')}' ถูกลบโดยผู้ดูแลระบบ เนื่องจาก: {reason}",
            )

        return jsonify({"success": True, "message": "ลบโพสต์และส่งแจ้งเตือนเรียบร้อยแล้ว"}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error deleting item {item_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        
# ==========================================
# 9. GET USER STATS & REVIEWS API
# ==========================================
@admin_bp.route("/users/<int:member_id>/stats", methods=["GET"])
def get_user_stats(member_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT COUNT(*) AS total 
            FROM exchange 
            WHERE (memberid = %s OR targetmemberid = %s) 
              AND (exchangestatus = 'Completed' OR exchangeresult = 'Success')
        """, (member_id, member_id))
        success_row = cursor.fetchone()
        successful_exchanges = success_row["total"] if success_row else 0

        cursor.execute("""
            SELECT COUNT(*) AS total 
            FROM exchange 
            WHERE (memberid = %s OR targetmemberid = %s) 
              AND (exchangestatus = 'Cancelled' OR exchangeresult = 'Failed')
        """, (member_id, member_id))
        failed_row = cursor.fetchone()
        failed_exchanges = failed_row["total"] if failed_row else 0

        # ใช้ AS "..." ให้ Frontend ได้รับข้อมูลรูปแบบเดิม
        cursor.execute("""
            SELECT 
                e.exchangeid AS "ExchangeID",
                e.score AS "Score",
                e.comment AS "Comment",
                e.partnerscore AS "PartnerScore",
                e.partnercomment AS "PartnerComment",
                e.successdate AS "SuccessDate",
                e.startdate AS "StartDate",
                e.memberid AS "MemberID",
                e.targetmemberid AS "TargetMemberID",
                m1.displayname AS "SenderName",
                m2.displayname AS "TargetName"
            FROM exchange e
            LEFT JOIN member m1 ON e.memberid = m1.memberid
            LEFT JOIN member m2 ON e.targetmemberid = m2.memberid
            WHERE (e.memberid = %s OR e.targetmemberid = %s)
        """, (member_id, member_id))
        raw_reviews = cursor.fetchall()

        reviews = []
        total_score = 0
        score_count = 0

        for row in raw_reviews:
            is_member = (int(row["MemberID"]) == int(member_id))
            
            if is_member:
                comment = row.get("PartnerComment")
                score = row.get("PartnerScore")
                reviewer_name = row.get("TargetName") or "ผู้ใช้งานระบบ"
            else:
                comment = row.get("Comment")
                score = row.get("Score")
                reviewer_name = row.get("SenderName") or "ผู้ใช้งานระบบ"

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
        print(f"❌ Error fetching stats for user {member_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e), "data": {"successfulExchanges": 0, "failedExchanges": 0, "rating": 0.0, "reviews": []}}), 500
    finally:
        cursor.close()
        conn.close()