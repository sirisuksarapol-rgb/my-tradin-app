import datetime

from flask import Blueprint, jsonify, request, current_app

from db import get_connection
from services.notification_service import notify_user


admin_bp = Blueprint("admin", __name__)


def format_cursor_data(data):
    """แปลงข้อมูลวันที่/เวลาให้เป็น ISO 8601"""
    for row in data:
        for key, value in row.items():
            if isinstance(value, (datetime.datetime, datetime.date)):
                row[key] = value.isoformat()

    return data


@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """ดึงข้อมูลสถิติภาพรวมระบบ"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) AS total FROM member")
        total_users = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM item")
        total_items = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM problem
            WHERE ReportStatus = 'Pending'
        """)
        total_reports = cursor.fetchone()["total"]

        return jsonify({
            "users": total_users,
            "items": total_items,
            "reports": total_reports
        }), 200

    except Exception as e:
        current_app.logger.error(
            f"Error fetching dashboard stats: {str(e)}"
        )

        return jsonify({
            "error": "เกิดข้อผิดพลาดในการดึงข้อมูล"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/users", methods=["GET"])
def users():
    """ดึงรายชื่อบัญชีผู้ใช้งานทั้งหมด พร้อมจำนวนโพสต์"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

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

        return jsonify(format_cursor_data(cursor.fetchall())), 200

    except Exception as e:
        current_app.logger.error(
            f"Error fetching users: {str(e)}"
        )

        return jsonify({
            "error": "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


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
                i.ItemID,
                i.ItemName,
                i.ItemDescription,
                i.ItemImage,
                i.ItemStatus,
                i.PostDate,
                i.CategoryID,
                m.MemberID,
                m.DisplayName,
                m.ProfileImage
            FROM item i
            LEFT JOIN member m
                ON i.MemberID = m.MemberID
            ORDER BY i.PostDate DESC
        """)

        return jsonify(format_cursor_data(cursor.fetchall())), 200

    except Exception as e:
        current_app.logger.error(
            f"Error fetching items: {str(e)}"
        )

        return jsonify({
            "error": "เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/reports", methods=["GET"])
def reports():
    """ดึงรายการแจ้งปัญหาทั้งหมด"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

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
            LEFT JOIN item i
                ON p.ItemID = i.ItemID
            LEFT JOIN member m
                ON p.MemberID = m.MemberID
            ORDER BY p.ReportDate DESC
        """)

        return jsonify(format_cursor_data(cursor.fetchall())), 200

    except Exception as e:
        current_app.logger.error(
            f"Error fetching reports: {str(e)}"
        )

        return jsonify({
            "error": "เกิดข้อผิดพลาดในการดึงข้อมูลรายงานปัญหา"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/reports/<int:problem_id>", methods=["PUT"])
def resolve_report(problem_id):
    """แก้ไขสถานะรายงานปัญหาและแจ้งเตือนผู้แจ้ง"""
    conn = None
    cursor = None

    try:
        data = request.json or {}
        resolution_msg = data.get("resolution_message", "").strip()

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT MemberID, ProblemType
            FROM problem
            WHERE ProblemID = %s
        """, (problem_id,))

        report = cursor.fetchone()

        if not report:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลรายงานปัญหานี้"
            }), 404

        cursor.execute("""
            UPDATE problem
            SET ReportStatus = 'Resolved'
            WHERE ProblemID = %s
        """, (problem_id,))

        conn.commit()

        if report.get("MemberID"):
            problem_type = (
                report["ProblemType"]
                or "ข้อเสนอแนะ/ปัญหาที่คุณแจ้ง"
            )

            if resolution_msg:
                message = (
                    f"แอดมินได้ตรวจสอบและดำเนินการ: "
                    f"{resolution_msg} (เคส: {problem_type})"
                )
            else:
                message = (
                    f"แอดมินได้ตรวจสอบและแก้ไข "
                    f"'{problem_type}' เรียบร้อยแล้ว "
                    f"ขอบคุณที่ช่วยส่งข้อเสนอแนะครับ!"
                )

            notify_user(
                member_id=report["MemberID"],
                title="อัปเดตสถานะการรายงาน",
                message=message,
                link="/notifications"
            )

        return jsonify({
            "success": True,
            "message": "ปิดเคสและส่งแจ้งเตือนไปยังผู้แจ้งเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error resolving report {problem_id}: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดำเนินการ"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/users/<int:member_id>/suspend", methods=["PUT"])
def suspend_user(member_id):
    """ระงับสิทธิ์การใช้งานของสมาชิก"""
    conn = None
    cursor = None

    try:
        data = request.json or {}

        suspend_type = data.get("type", "permanent")
        until_date = data.get("until_date")
        reason = data.get(
            "reason",
            "ละเมิดเงื่อนไขข้อตกลงของระบบ"
        )

        suspended_until = None

        if suspend_type == "temporary":
            if not until_date:
                return jsonify({
                    "success": False,
                    "message": "กรุณาระบุวันที่สิ้นสุดการระงับ"
                }), 400

            try:
                suspended_until = datetime.datetime.strptime(
                    until_date,
                    "%Y-%m-%d"
                ).replace(
                    hour=23,
                    minute=59,
                    second=59
                )
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "รูปแบบวันที่ไม่ถูกต้อง"
                }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT Email, DisplayName
            FROM member
            WHERE MemberID = %s
        """, (member_id,))

        user_info = cursor.fetchone()

        if not user_info:
            return jsonify({
                "success": False,
                "message": "ไม่พบผู้ใช้งาน"
            }), 404

        cursor.execute("""
            UPDATE member
            SET MemberStatus = 'Suspended',
                SuspendedUntil = %s,
                SuspendReason = %s
            WHERE MemberID = %s
        """, (
            suspended_until,
            reason,
            member_id
        ))

        conn.commit()

        message = f"บัญชีของคุณถูกระงับเนื่องจาก: {reason}"

        if suspended_until:
            message += (
                f"\nจะสามารถใช้งานได้อีกครั้งในวันที่ "
                f"{suspended_until.strftime('%d/%m/%Y %H:%M น.')}"
            )
        else:
            message += "\n(ระงับแบบถาวร)"

        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการระงับสิทธิ์ใช้งาน",
            message=message,
            link="/contact"
        )

        if user_info.get("Email"):
            current_app.logger.info(
                f"Suspension email target: {user_info['Email']}"
            )

        return jsonify({
            "success": True,
            "message": "ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error suspending user {member_id}: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการระงับสิทธิ์"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


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
            SET MemberStatus = 'Active',
                SuspendedUntil = NULL,
                SuspendReason = NULL
            WHERE MemberID = %s
        """, (member_id,))

        conn.commit()

        notify_user(
            member_id=member_id,
            title="แจ้งเตือนการคืนสิทธิ์ใช้งาน",
            message="บัญชีของคุณได้รับการคืนสิทธิ์การใช้งานแล้ว คุณสามารถเข้าใช้งานได้ตามปกติ",
            link="/"
        )

        return jsonify({
            "success": True,
            "message": "คืนสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error unsuspending user {member_id}: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการคืนสิทธิ์"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/items/<int:item_id>", methods=["DELETE"])
def delete_item_by_admin(item_id):
    """ลบโพสต์โดยผู้ดูแลระบบและแจ้งเตือนเจ้าของโพสต์"""
    conn = None
    cursor = None

    try:
        data = request.json or {}
        reason = data.get(
            "reason",
            "ผิดเงื่อนไขการใช้งานของระบบ"
        )

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT MemberID, ItemName
            FROM item
            WHERE ItemID = %s
        """, (item_id,))

        item = cursor.fetchone()

        if not item:
            return jsonify({
                "success": False,
                "message": "ไม่พบรายการโพสต์นี้"
            }), 404

        cursor.execute("""
            DELETE FROM item
            WHERE ItemID = %s
        """, (item_id,))

        conn.commit()

        if item.get("MemberID"):
            notify_user(
                member_id=item["MemberID"],
                title="แจ้งเตือนการลบโพสต์",
                message=(
                    f"โพสต์ '{item.get('ItemName', 'สิ่งของของคุณ')}' "
                    f"ถูกลบโดยผู้ดูแลระบบ เนื่องจาก: {reason}"
                )
            )

        return jsonify({
            "success": True,
            "message": "ลบโพสต์เรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error deleting item {item_id}: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการลบโพสต์"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/users/<int:member_id>/stats", methods=["GET"])
def get_user_stats(member_id):
    """ดึงสถิติการแลกเปลี่ยนและรีวิวของผู้ใช้งาน"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM exchange
            WHERE (MemberID = %s OR TargetMemberID = %s)
              AND (
                  ExchangeStatus = 'Completed'
                  OR ExchangerResult = 'Success'
              )
        """, (member_id, member_id))

        successful_exchanges = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM exchange
            WHERE (MemberID = %s OR TargetMemberID = %s)
              AND (
                  ExchangeStatus = 'Cancelled'
                  OR ExchangerResult = 'Failed'
              )
        """, (member_id, member_id))

        failed_exchanges = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT
                e.ExchangeID,
                e.Score,
                e.Comment,
                e.PartnerScore,
                e.PartnerComment,
                e.SuccessDate,
                e.StartDate,
                e.MemberID,
                e.TargetMemberID,
                sender.DisplayName AS SenderName,
                target.DisplayName AS TargetName
            FROM exchange e
            LEFT JOIN member sender
                ON e.MemberID = sender.MemberID
            LEFT JOIN member target
                ON e.TargetMemberID = target.MemberID
            WHERE e.MemberID = %s
               OR e.TargetMemberID = %s
        """, (member_id, member_id))

        rows = cursor.fetchall()

        reviews = []
        total_score = 0
        score_count = 0

        for row in rows:
            if row["MemberID"] == member_id:
                score = row["PartnerScore"]
                comment = row["PartnerComment"]
                reviewer_name = row["TargetName"]
            else:
                score = row["Score"]
                comment = row["Comment"]
                reviewer_name = row["SenderName"]

            if score is not None:
                total_score += float(score)
                score_count += 1

            if comment or score is not None:
                review_date = row["SuccessDate"] or row["StartDate"]

                reviews.append({
                    "id": row["ExchangeID"],
                    "comment": comment or "ไม่มีความคิดเห็น",
                    "rating": int(score or 0),
                    "reviewerName": reviewer_name or "ผู้ใช้งานระบบ",
                    "date": (
                        review_date.strftime("%d/%m/%Y %H:%M")
                        if isinstance(review_date, datetime.datetime)
                        else ""
                    )
                })

        rating = total_score / score_count if score_count else 0

        return jsonify({
            "success": True,
            "data": {
                "totalItems": 0,
                "successfulExchanges": successful_exchanges,
                "failedExchanges": failed_exchanges,
                "rating": round(rating, 1),
                "reviews": reviews
            }
        }), 200

    except Exception as e:
        current_app.logger.error(
            f"Error fetching stats for user {member_id}: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดึงสถิติ",
            "data": {
                "successfulExchanges": 0,
                "failedExchanges": 0,
                "rating": 0.0,
                "reviews": []
            }
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()


@admin_bp.route("/analytics", methods=["GET"])
def dashboard_analytics():
    """ข้อมูลสำหรับกราฟ Dashboard โดยไม่เปลี่ยน response ของ API เดิม"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        # สร้างช่วงเดือนย้อนหลัง 6 เดือน รวมเดือนปัจจุบัน
        today = datetime.date.today()
        month_keys = []

        for offset in reversed(range(6)):
            month_index = (
                today.year * 12 + (today.month - 1)
            ) - offset

            year = month_index // 12
            month = (month_index % 12) + 1

            month_keys.append(f"{year:04d}-{month:02d}")

        first_year, first_month = map(
            int, month_keys[0].split("-")
        )

        start_date = datetime.datetime(
            first_year, first_month, 1
        )

        next_month_index = today.year * 12 + today.month
        end_year = next_month_index // 12
        end_month = (next_month_index % 12) + 1

        end_date = datetime.datetime(
            end_year, end_month, 1
        )

        # เตรียมข้อมูล 6 เดือน แม้บางเดือนจะไม่มีข้อมูล
        monthly_map = {
            month_key: {
                "month": month_key,
                "users": 0,
                "posts": 0
            }
            for month_key in month_keys
        }

        # 1. จำนวนสมาชิกที่สมัครในแต่ละเดือน
        cursor.execute("""
            SELECT
                DATE_FORMAT(RegisterDate, '%Y-%m') AS month_key,
                COUNT(*) AS total
            FROM member
            WHERE RegisterDate >= %s
              AND RegisterDate < %s
            GROUP BY DATE_FORMAT(RegisterDate, '%Y-%m')
            ORDER BY month_key
        """, (start_date, end_date))

        for row in cursor.fetchall():
            month_key = row.get("month_key")

            if month_key in monthly_map:
                monthly_map[month_key]["users"] = int(
                    row.get("total") or 0
                )

        # 2. จำนวนโพสต์ในแต่ละเดือน
        cursor.execute("""
            SELECT
                DATE_FORMAT(PostDate, '%Y-%m') AS month_key,
                COUNT(*) AS total
            FROM item
            WHERE PostDate >= %s
              AND PostDate < %s
            GROUP BY DATE_FORMAT(PostDate, '%Y-%m')
            ORDER BY month_key
        """, (start_date, end_date))

        for row in cursor.fetchall():
            month_key = row.get("month_key")

            if month_key in monthly_map:
                monthly_map[month_key]["posts"] = int(
                    row.get("total") or 0
                )

        # 3. จำนวนรายการแลกเปลี่ยนตามสถานะ
        cursor.execute("""
            SELECT
                CASE LOWER(TRIM(COALESCE(ExchangeStatus, '')))
                    WHEN 'completed' THEN 'สำเร็จ'
                    WHEN 'pending' THEN 'รอดำเนินการ'
                    WHEN 'cancelled' THEN 'ยกเลิก/ไม่สำเร็จ'
                    WHEN 'failed' THEN 'ยกเลิก/ไม่สำเร็จ'
                    WHEN '' THEN 'ไม่ระบุ'
                    ELSE ExchangeStatus
                END AS status_label,
                COUNT(*) AS total
            FROM exchange
            GROUP BY status_label
            ORDER BY total DESC
        """)

        exchange_status = [
            {
                "status": row.get("status_label") or "ไม่ระบุ",
                "total": int(row.get("total") or 0)
            }
            for row in cursor.fetchall()
        ]

        # 4. จำนวนรายงานปัญหาตามสถานะ
        cursor.execute("""
            SELECT
                CASE
                    WHEN ReportStatus = 'Pending'
                        THEN 'รอตรวจสอบ'
                    WHEN ReportStatus = 'Resolved'
                        THEN 'ดำเนินการแล้ว'
                    WHEN ReportStatus IS NULL OR ReportStatus = ''
                        THEN 'ไม่ระบุ'
                    ELSE ReportStatus
                END AS status_label,
                COUNT(*) AS total
            FROM problem
            GROUP BY status_label
            ORDER BY total DESC, status_label ASC
        """)

        # ต้องอ่านผลลัพธ์ข้อ 4 ให้เสร็จก่อน execute ข้อ 5
        report_status = [
            {
                "status": row.get("status_label") or "ไม่ระบุ",
                "total": int(row.get("total") or 0)
            }
            for row in cursor.fetchall()
        ]

        # 5. จำนวนโพสต์ตามหมวดหมู่
        cursor.execute("""
            SELECT
                c.CategoryID,
                c.CategoryName AS category,
                COUNT(i.ItemID) AS total
            FROM category c
            LEFT JOIN item i
                ON c.CategoryID = i.CategoryID
            GROUP BY
                c.CategoryID,
                c.CategoryName
            ORDER BY
                total DESC,
                c.CategoryID ASC
        """)

        posts_by_category = [
            {
                "category": row.get("category") or "ไม่ระบุหมวดหมู่",
                "total": int(row.get("total") or 0)
            }
            for row in cursor.fetchall()
        ]

        # ส่งข้อมูลให้ Frontend โดยคงชื่อ response เดิม
        return jsonify({
            "monthlyActivity": list(monthly_map.values()),
            "exchangeStatus": exchange_status,
            "reportStatus": report_status,
            "postsByCategory": posts_by_category
        }), 200

    except Exception as e:
        current_app.logger.exception(
            "Error fetching dashboard analytics"
        )

        return jsonify({
            "error": "เกิดข้อผิดพลาดในการดึงข้อมูลกราฟ Dashboard"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()
