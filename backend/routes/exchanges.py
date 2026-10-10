import random
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app

from db import get_connection
from services.notification_service import notify_user
from services.email_service import send_exchange_verify_email


exchanges_bp = Blueprint("exchanges", __name__)


@exchanges_bp.route("/api/exchanges", methods=["GET"])
def get_exchanges():
    """ดึงประวัติและสถานะการแลกเปลี่ยนของผู้ใช้งาน"""
    member_id = request.args.get("member_id")
    target_member_id = request.args.get("target_member_id")
    current_user_id = member_id or target_member_id

    if not current_user_id:
        return jsonify({
            "success": False,
            "message": "กรุณาระบุ member_id หรือ target_member_id"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        if target_member_id and not member_id:
            where_clause = "WHERE e.TargetMemberID = %s"
            params = (current_user_id,) * 13
        else:
            where_clause = """
                WHERE e.MemberID = %s
                   OR e.TargetMemberID = %s
            """
            params = (current_user_id,) * 14

        sql = f"""
            SELECT
                e.ExchangeID,
                e.ExchangeStatus,
                e.ExchangeLocation,
                e.Score,
                IFNULL(e.MatchScore, 0) AS MatchScore,
                e.ExchangeType,
                e.MemberID,
                e.TargetMemberID,
                e.MyItemID,
                e.TargetItemID,
                e.PhoneNumber,
                e.TargetPhoneNumber,
                e.StartDate,
                e.SuccessDate,
                e.CancelDate,
                e.CancelReason,
                e.IsMemberVerified,
                e.IsTargetMemberVerified,
                e.IsMemberReceived,
                e.IsTargetMemberReceived,
                e.PartnerScore,
                e.PartnerComment,
                e.Comment,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(e.TargetPhoneNumber, 'รออีกฝ่ายระบุเบอร์')
                    ELSE IFNULL(e.PhoneNumber, 'รออีกฝ่ายระบุเบอร์')
                END AS partnerPhone,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(my_item.ItemImage, '')
                    ELSE IFNULL(their_item.ItemImage, '')
                END AS myPostImage,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(their_item.ItemImage, '')
                    ELSE IFNULL(my_item.ItemImage, '')
                END AS theirPostImage,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                    ELSE IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                END AS myPostTitle,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(their_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                    ELSE IFNULL(my_item.ItemName, 'ไม่มีชื่อสิ่งของ')
                END AS theirPostTitle,

                IFNULL(
                    CASE
                        WHEN e.MemberID = %s
                        THEN target_member.DisplayName
                        ELSE requester_member.DisplayName
                    END,
                    'ผู้ใช้งานระบบ'
                ) AS theirAuthorName,

                IFNULL(
                    CASE
                        WHEN e.MemberID = %s
                        THEN requester_member.DisplayName
                        ELSE target_member.DisplayName
                    END,
                    'ตัวคุณ'
                ) AS myAuthorName,

                CASE
                    WHEN e.MemberID = %s
                    THEN target_member.ProfileImage
                    ELSE requester_member.ProfileImage
                END AS theirProfileImage,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(my_item.ItemDescription, '')
                    ELSE IFNULL(their_item.ItemDescription, '')
                END AS myPostDescription,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(their_item.ItemDescription, '')
                    ELSE IFNULL(my_item.ItemDescription, '')
                END AS theirPostDescription,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(my_item.MeetingLocation, '')
                    ELSE IFNULL(their_item.MeetingLocation, '')
                END AS myMeetingLocation,

                CASE
                    WHEN e.MemberID = %s
                    THEN IFNULL(their_item.MeetingLocation, '')
                    ELSE IFNULL(my_item.MeetingLocation, '')
                END AS theirMeetingLocation

            FROM exchange e

            LEFT JOIN item my_item
                ON e.MyItemID = my_item.ItemID

            LEFT JOIN item their_item
                ON e.TargetItemID = their_item.ItemID

            LEFT JOIN member requester_member
                ON e.MemberID = requester_member.MemberID

            LEFT JOIN member target_member
                ON e.TargetMemberID = target_member.MemberID

            {where_clause}

            ORDER BY e.ExchangeID DESC
        """

        cursor.execute(sql, params)
        exchanges = cursor.fetchall()

        for exchange in exchanges:
            if exchange.get("StartDate"):
                exchange["StartDate"] = exchange["StartDate"].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

            if str(exchange["MemberID"]) == str(current_user_id):
                exchange["myItemID"] = exchange["MyItemID"]
                exchange["theirItemID"] = exchange["TargetItemID"]
            else:
                exchange["myItemID"] = exchange["TargetItemID"]
                exchange["theirItemID"] = exchange["MyItemID"]

            if exchange.get("myPostImage") in [None, "null", "undefined", "None"]:
                exchange["myPostImage"] = ""

            if exchange.get("theirPostImage") in [None, "null", "undefined", "None"]:
                exchange["theirPostImage"] = ""

        return jsonify({
            "success": True,
            "data": exchanges
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in get_exchanges: {e}")
        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดึงข้อมูลการแลกเปลี่ยน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/exchanges", methods=["POST"])
def create_exchange():
    """สร้างคำขอแลกเปลี่ยนสิ่งของ"""
    data = request.get_json() or {}

    member_id = data.get("member_id")
    target_member_id = data.get("target_member_id")
    my_item_id = data.get("my_item_id")
    their_item_id = data.get("their_item_id")

    location = data.get("location") or "นัดเจอตามตกลง"
    phone_number = data.get("phone_number") or ""
    match_score = data.get("match_score", 0)
    exchange_type = data.get("exchange_type", "manual")

    if not all([member_id, target_member_id, my_item_id, their_item_id]):
        return jsonify({
            "success": False,
            "message": "ข้อมูลไม่ครบถ้วน"
        }), 400

    try:
        member_id = int(member_id)
        target_member_id = int(target_member_id)
        my_item_id = int(my_item_id)
        their_item_id = int(their_item_id)
        match_score = float(match_score)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "รูปแบบข้อมูลไม่ถูกต้อง"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            INSERT INTO exchange (
                ExchangeLocation,
                ExchangeStatus,
                MemberID,
                TargetMemberID,
                MyItemID,
                TargetItemID,
                PhoneNumber,
                StartDate,
                MatchScore,
                ExchangeType
            )
            VALUES (%s, 'pending', %s, %s, %s, %s, %s, NOW(), %s, %s)
        """, (
            location,
            member_id,
            target_member_id,
            my_item_id,
            their_item_id,
            phone_number,
            match_score,
            exchange_type
        ))

        exchange_id = cursor.lastrowid

        sender_name = "ผู้ใช้งานระบบ"
        sender_item_name = "สิ่งของชิ้นใหม่"
        receiver_item_name = "สิ่งของของคุณ"

        cursor.execute(
            "SELECT DisplayName FROM member WHERE MemberID = %s",
            (member_id,)
        )
        member = cursor.fetchone()

        if member:
            sender_name = member["DisplayName"]

        cursor.execute(
            "SELECT ItemName FROM item WHERE ItemID = %s",
            (my_item_id,)
        )
        my_item = cursor.fetchone()

        if my_item:
            sender_item_name = my_item["ItemName"]

        cursor.execute(
            "SELECT ItemName FROM item WHERE ItemID = %s",
            (their_item_id,)
        )
        target_item = cursor.fetchone()

        if target_item:
            receiver_item_name = target_item["ItemName"]

        conn.commit()

        notify_user(
            member_id=target_member_id,
            title="มีคำขอแลกเปลี่ยนใหม่เข้ามา!",
            message=(
                f"คุณได้รับคำเสนอแลกเปลี่ยนสิ่งของชิ้นใหม่! "
                f"จาก {sender_name} ต้องการแลก "
                f"{sender_item_name} กับ {receiver_item_name}"
            ),
            link=f"/incoming-requests?id={exchange_id}"
        )

        return jsonify({
            "success": True,
            "message": "ส่งคำขอแลกเปลี่ยนสำเร็จเรียบร้อยแล้ว!"
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Error in create_exchange: {e}")

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการสร้างคำขอแลกเปลี่ยน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/exchanges/<int:exchange_id>", methods=["PUT"])
def update_exchange_status(exchange_id):
    """ตอบรับหรือปฏิเสธคำขอแลกเปลี่ยน"""
    data = request.get_json() or {}

    action = data.get("action")
    phone_number = data.get("phone_number")

    if action not in ["accept", "reject"]:
        return jsonify({
            "success": False,
            "message": "Action ไม่ถูกต้อง"
        }), 400

    new_status = "accepted" if action == "accept" else "rejected"

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM exchange WHERE ExchangeID = %s",
            (exchange_id,)
        )
        exchange = cursor.fetchone()

        if not exchange:
            return jsonify({
                "success": False,
                "message": "ไม่พบรายการแลกเปลี่ยนนี้"
            }), 404

        if new_status == "accepted":
            if not phone_number:
                return jsonify({
                    "success": False,
                    "message": "กรุณาระบุเบอร์โทรศัพท์เพื่อยืนยัน"
                }), 400

            cursor.execute("""
                UPDATE exchange
                SET ExchangeStatus = %s,
                    SuccessDate = NOW(),
                    TargetPhoneNumber = %s
                WHERE ExchangeID = %s
            """, (new_status, phone_number, exchange_id))

            cursor.execute("""
                SELECT ExchangeID, MemberID, TargetMemberID
                FROM exchange
                WHERE ExchangeID != %s
                  AND ExchangeStatus = 'pending'
                  AND (
                      MyItemID IN (%s, %s)
                      OR TargetItemID IN (%s, %s)
                  )
            """, (
                exchange_id,
                exchange["MyItemID"],
                exchange["TargetItemID"],
                exchange["MyItemID"],
                exchange["TargetItemID"]
            ))

            competing_requests = cursor.fetchall()

            if competing_requests:
                cursor.execute("""
                    UPDATE exchange
                    SET ExchangeStatus = 'auto_cancelled',
                        CancelDate = NOW(),
                        CancelReason =
                            'สินค้าชิ้นนี้ถูกตอบรับการแลกเปลี่ยนในรายการอื่นไปแล้ว'
                    WHERE ExchangeID != %s
                      AND ExchangeStatus = 'pending'
                      AND (
                          MyItemID IN (%s, %s)
                          OR TargetItemID IN (%s, %s)
                      )
                """, (
                    exchange_id,
                    exchange["MyItemID"],
                    exchange["TargetItemID"],
                    exchange["MyItemID"],
                    exchange["TargetItemID"]
                ))

            conn.commit()

            notify_user(
                member_id=exchange["MemberID"],
                title="คำขอแลกเปลี่ยนได้รับการตอบรับ!",
                message=(
                    "คำขอแลกเปลี่ยนของคุณได้รับการ 'ตอบรับ' แล้ว! 🎉 "
                    "กรุณาเข้าสู่ระบบเพื่อยืนยันตัวตนแลกเปลี่ยนข้อมูลติดต่อ"
                )
            )

            cancel_msg = (
                "คำขอแลกเปลี่ยนถูกยกเลิกอัตโนมัติ "
                "เนื่องจากสินค้าดังกล่าวถูกตอบรับการแลกเปลี่ยนในรายการอื่นไปแล้ว"
            )

            for request_data in competing_requests:
                notify_user(
                    member_id=request_data["MemberID"],
                    title="คำขอแลกเปลี่ยนถูกยกเลิก ❌",
                    message=cancel_msg
                )

                notify_user(
                    member_id=request_data["TargetMemberID"],
                    title="คำขอแลกเปลี่ยนถูกยกเลิก ❌",
                    message=cancel_msg
                )

        else:
            cursor.execute("""
                UPDATE exchange
                SET ExchangeStatus = %s,
                    CancelDate = NOW()
                WHERE ExchangeID = %s
            """, (new_status, exchange_id))

            conn.commit()

            notify_user(
                member_id=exchange["MemberID"],
                title="คำขอแลกเปลี่ยนถูกปฏิเสธ",
                message="คำขอแลกเปลี่ยนของคุณถูก 'ปฏิเสธ' แล้ว ❌"
            )

        return jsonify({
            "success": True,
            "message": f"ทำการ {action} คำขอเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Error in update_exchange_status: {e}")

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการอัปเดตสถานะ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/exchanges/<int:exchange_id>/cancel", methods=["PUT"])
def cancel_exchange(exchange_id):
    """ยกเลิกรายการแลกเปลี่ยน"""
    data = request.get_json() or {}

    reason = data.get("reason", "ไม่ระบุเหตุผล")
    user_id = data.get("user_id")

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT MemberID, TargetMemberID
            FROM exchange
            WHERE ExchangeID = %s
        """, (exchange_id,))

        exchange = cursor.fetchone()

        cursor.execute("""
            UPDATE exchange
            SET ExchangeStatus = 'failed',
                CancelDate = NOW(),
                CancelReason = %s
            WHERE ExchangeID = %s
        """, (reason, exchange_id))

        conn.commit()

        if exchange and user_id:
            if str(user_id) == str(exchange["MemberID"]):
                partner_id = exchange["TargetMemberID"]
            else:
                partner_id = exchange["MemberID"]

            notify_user(
                member_id=partner_id,
                title="รายการแลกเปลี่ยนถูกยกเลิก",
                message=f"รายการแลกเปลี่ยนรหัส ถูกยกเลิกแล้ว เหตุผล: {reason}"
            )

        return jsonify({
            "success": True,
            "message": "ยกเลิกการแลกเปลี่ยนสำเร็จ"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Error in cancel_exchange: {e}")

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการยกเลิกรายการ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/exchanges/<int:exchange_id>/complete", methods=["PUT"])
def complete_exchange(exchange_id):
    """ยืนยันการได้รับสิ่งของและบันทึกคะแนน"""
    data = request.get_json() or {}

    score = data.get("score")
    comment = data.get("comment", "")
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "ไม่พบข้อมูลผู้ใช้งาน (กรุณาแนบ user_id)"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                MemberID,
                TargetMemberID,
                IsMemberReceived,
                IsTargetMemberReceived,
                MyItemID,
                TargetItemID
            FROM exchange
            WHERE ExchangeID = %s
        """, (exchange_id,))

        exchange = cursor.fetchone()

        if not exchange:
            return jsonify({
                "success": False,
                "message": "ไม่พบรายการแลกเปลี่ยนนี้"
            }), 404

        if int(user_id) == exchange["MemberID"]:
            cursor.execute("""
                UPDATE exchange
                SET IsMemberReceived = 1,
                    Score = %s,
                    Comment = %s
                WHERE ExchangeID = %s
            """, (score, comment, exchange_id))

            member_received = 1
            target_received = exchange["IsTargetMemberReceived"]
            partner_id = exchange["TargetMemberID"]

        elif int(user_id) == exchange["TargetMemberID"]:
            cursor.execute("""
                UPDATE exchange
                SET IsTargetMemberReceived = 1,
                    PartnerScore = %s,
                    PartnerComment = %s
                WHERE ExchangeID = %s
            """, (score, comment, exchange_id))

            member_received = exchange["IsMemberReceived"]
            target_received = 1
            partner_id = exchange["MemberID"]

        else:
            return jsonify({
                "success": False,
                "message": "คุณไม่มีสิทธิ์ทำรายการนี้"
            }), 403

        if member_received == 1 and target_received == 1:
            cursor.execute("""
                UPDATE exchange
                SET ExchangeStatus = 'completed',
                    SuccessDate = NOW()
                WHERE ExchangeID = %s
            """, (exchange_id,))

            cursor.execute("""
                UPDATE item
                SET ItemStatus = 'exchanged'
                WHERE ItemID IN (%s, %s)
            """, (
                exchange["MyItemID"],
                exchange["TargetItemID"]
            ))

            cursor.execute("""
                SELECT ExchangeID, MemberID, TargetMemberID
                FROM exchange
                WHERE ExchangeID != %s
                  AND ExchangeStatus IN ('pending', 'accepted', 'in_progress')
                  AND (
                      MyItemID IN (%s, %s)
                      OR TargetItemID IN (%s, %s)
                  )
            """, (
                exchange_id,
                exchange["MyItemID"],
                exchange["TargetItemID"],
                exchange["MyItemID"],
                exchange["TargetItemID"]
            ))

            competing_requests = cursor.fetchall()

            cursor.execute("""
                UPDATE exchange
                SET ExchangeStatus = 'auto_cancelled',
                    CancelDate = NOW(),
                    CancelReason =
                        'สินค้าชิ้นนี้ถูกแลกเปลี่ยนสำเร็จในรายการอื่นไปแล้ว'
                WHERE ExchangeID != %s
                  AND ExchangeStatus IN ('pending', 'accepted', 'in_progress')
                  AND (
                      MyItemID IN (%s, %s)
                      OR TargetItemID IN (%s, %s)
                  )
            """, (
                exchange_id,
                exchange["MyItemID"],
                exchange["TargetItemID"],
                exchange["MyItemID"],
                exchange["TargetItemID"]
            ))

            conn.commit()

            cancel_msg = (
                "คำขอแลกเปลี่ยนถูกยกเลิกอัตโนมัติ "
                "เนื่องจากเจ้าของสินค้าได้ทำการแลกเปลี่ยนสำเร็จ "
                "กับผู้ใช้งานรายอื่นไปแล้ว"
            )

            for request_data in competing_requests:
                notify_user(
                    member_id=request_data["MemberID"],
                    title="คำขอแลกเปลี่ยนถูกยกเลิก",
                    message=cancel_msg,
                    link="/matching"
                )

                notify_user(
                    member_id=request_data["TargetMemberID"],
                    title="คำขอแลกเปลี่ยนถูกยกเลิก",
                    message=cancel_msg,
                    link="/matching"
                )

            success_msg = (
                "การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว! 🎉 "
                "ขอบคุณที่ร่วมแลกเปลี่ยนสิ่งของ"
            )

            notify_user(
                exchange["MemberID"],
                "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉",
                success_msg
            )

            notify_user(
                exchange["TargetMemberID"],
                "การแลกเปลี่ยนเสร็จสมบูรณ์! 🎉",
                success_msg
            )

            message = (
                "ทำรายการสำเร็จ! การแลกเปลี่ยนเสร็จสมบูรณ์ "
                "และอัปเดตคำขออื่นๆ เป็นยกเลิกแล้ว"
            )

        else:
            conn.commit()

            notify_user(
                member_id=partner_id,
                title="คู่แลกเปลี่ยนยืนยันได้รับของแล้ว 📦",
                message=(
                    "คู่แลกเปลี่ยนของคุณได้กดยืนยันว่าได้รับสิ่งของแล้ว "
                    "กรุณากดยืนยันการรับของเพื่อทำรายการให้เสร็จสมบูรณ์"
                )
            )

            message = (
                "บันทึกรีวิวแล้ว! "
                "กรุณารอให้อีกฝ่ายกดยืนยันได้รับสิ่งของ"
            )

        return jsonify({
            "success": True,
            "message": message
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(f"Error in complete_exchange: {e}")

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/exchanges/<int:match_id>/request-code", methods=["POST"])
def request_exchange_code(match_id):
    """ขอรหัส OTP เพื่อเปิดเผยข้อมูลเบอร์โทรศัพท์"""
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "กรุณาระบุ user_id"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT PhoneNumber, TargetPhoneNumber
            FROM exchange
            WHERE ExchangeID = %s
        """, (match_id,))

        exchange = cursor.fetchone()

        if (
            not exchange
            or not exchange["PhoneNumber"]
            or not exchange["TargetPhoneNumber"]
        ):
            return jsonify({
                "success": False,
                "message": "คู่แลกเปลี่ยนยังไม่ได้ระบุเบอร์โทรศัพท์"
            }), 400

        cursor.execute("""
            SELECT Email, VerifyCode, VerifyExpire
            FROM member
            WHERE MemberID = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user or not user["Email"]:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลอีเมลผู้ใช้งาน"
            }), 404

        if (
            user["VerifyCode"]
            and user["VerifyExpire"]
            and datetime.now() < user["VerifyExpire"]
        ):
            return jsonify({
                "success": True,
                "message": "ใช้รหัสยืนยันเดิมที่ระบบส่งให้ก่อนหน้านี้ได้เลย"
            }), 200

        code = str(random.randint(100000, 999999))
        expire_time = None

        cursor.execute("""
            UPDATE member
            SET VerifyCode = %s,
                VerifyExpire = %s
            WHERE MemberID = %s
        """, (code, expire_time, user_id))

        conn.commit()

        try:
            send_exchange_verify_email(user["Email"], code)
        except Exception as e:
            current_app.logger.error(
                f"OTP Email sending failed: {e}"
            )

        message = f"รหัสยืนยันความปลอดภัยเพื่อดูข้อมูลการติดต่อคือ: {code}"

        cursor.execute("""
            INSERT INTO notification (
                MemberID,
                Message,
                Link,
                IsRead,
                CreateDate
            )
            VALUES (%s, %s, %s, 0, NOW())
        """, (
            user_id,
            message,
            f"/exchange-tracking/{match_id}"
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "ส่งรหัสยืนยันไปยังอีเมลและการแจ้งเตือนเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error in request_exchange_code: {e}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการส่งรหัส"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/exchanges/<int:match_id>/verify-code", methods=["POST"])
def verify_exchange_code(match_id):
    """ตรวจสอบ OTP เพื่อยืนยันตัวตน"""
    data = request.get_json() or {}

    user_id = data.get("user_id")
    submitted_code = data.get("code")

    if not user_id or not submitted_code:
        return jsonify({
            "success": False,
            "message": "กรุณาระบุรหัสผู้ใช้งานและรหัส OTP"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT VerifyCode, VerifyExpire
            FROM member
            WHERE MemberID = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user or not user["VerifyCode"]:
            return jsonify({
                "success": False,
                "message": "ไม่พบการขอรหัส OTP หรือรหัสถูกใช้ไปแล้ว"
            }), 400

        if user["VerifyCode"] != submitted_code:
            return jsonify({
                "success": False,
                "message": "รหัสยืนยันไม่ถูกต้อง"
            }), 400

        if user["VerifyExpire"] and datetime.now() > user["VerifyExpire"]:
            return jsonify({
                "success": False,
                "message": "รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่"
            }), 400

        cursor.execute("""
            SELECT
                MemberID,
                TargetMemberID,
                IsMemberVerified,
                IsTargetMemberVerified
            FROM exchange
            WHERE ExchangeID = %s
        """, (match_id,))

        exchange = cursor.fetchone()

        if not exchange:
            return jsonify({
                "success": False,
                "message": "ไม่พบข้อมูลการแลกเปลี่ยนนี้"
            }), 404

        member_verified = exchange["IsMemberVerified"]
        target_verified = exchange["IsTargetMemberVerified"]

        if int(user_id) == exchange["MemberID"]:
            cursor.execute("""
                UPDATE exchange
                SET IsMemberVerified = 1
                WHERE ExchangeID = %s
            """, (match_id,))

            member_verified = 1

        elif int(user_id) == exchange["TargetMemberID"]:
            cursor.execute("""
                UPDATE exchange
                SET IsTargetMemberVerified = 1
                WHERE ExchangeID = %s
            """, (match_id,))

            target_verified = 1

        if member_verified == 1 and target_verified == 1:
            cursor.execute("""
                UPDATE exchange
                SET ExchangeStatus = 'in_progress'
                WHERE ExchangeID = %s
                  AND ExchangeStatus = 'accepted'
            """, (match_id,))

            message = (
                "ยืนยันรหัสสำเร็จ! ทั้งสองฝ่ายยืนยันครบแล้ว "
                "สามารถดูข้อมูลการติดต่อได้"
            )
        else:
            message = (
                "ยืนยันรหัสสำเร็จ! กรุณารอให้อีกฝ่ายยืนยันตัวตน "
                "เพื่อเปิดเผยข้อมูลการติดต่อ"
            )

        cursor.execute("""
            UPDATE member
            SET VerifyCode = NULL,
                VerifyExpire = NULL
            WHERE MemberID = %s
        """, (user_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": message
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error in verify_exchange_code: {e}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการตรวจสอบรหัส"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    """ดึงรายการแจ้งเตือนของสมาชิก"""
    member_id = request.args.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "กรุณาระบุ member_id ใน Query Parameter"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT *
            FROM notification
            WHERE MemberID = %s
            ORDER BY CreateDate DESC
        """, (member_id,))

        notifications = cursor.fetchall()

        for notification in notifications:
            if notification.get("CreateDate"):
                notification["CreateDate"] = notification["CreateDate"].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        return jsonify({
            "success": True,
            "data": notifications
        }), 200

    except Exception as e:
        current_app.logger.error(
            f"Error in get_notifications: {e}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการดึงการแจ้งเตือน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/notifications/unread-count", methods=["GET"])
def get_unread_notification_count():
    """นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน"""
    member_id = request.args.get("member_id")

    if not member_id:
        return jsonify({
            "success": False,
            "message": "กรุณาระบุ member_id"
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT COUNT(*) AS unreadCount
            FROM notification
            WHERE MemberID = %s
              AND IsRead = 0
        """, (member_id,))

        result = cursor.fetchone()

        return jsonify({
            "success": True,
            "count": result["unreadCount"] if result else 0
        }), 200

    except Exception as e:
        current_app.logger.error(
            f"Error in get_unread_notification_count: {e}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการนับจำนวนการแจ้งเตือน"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@exchanges_bp.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_notification_as_read(notification_id):
    """เปลี่ยนสถานะแจ้งเตือนเป็นอ่านแล้ว"""
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE notification
            SET IsRead = 1
            WHERE NotificationID = %s
        """, (notification_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "อัปเดตสถานะการอ่านเรียบร้อยแล้ว"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        current_app.logger.error(
            f"Error in mark_notification_as_read: {e}"
        )

        return jsonify({
            "success": False,
            "message": "เกิดข้อผิดพลาดในการอัปเดตสถานะ"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

