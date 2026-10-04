from flask import Blueprint, jsonify, current_app
from services.vector_engine import semantic_search
from db import get_connection

match_bp = Blueprint('match', __name__)

def get_item_with_details(item_id):
    """ดึงข้อมูลสิ่งของพร้อมรายละเอียดทั้งหมดจากฐานข้อมูลตามรหัสสินค้าที่ระบุ"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM item WHERE ItemID = %s", (item_id,))
        return cursor.fetchone()
    except Exception as e:
        current_app.logger.error(f"Error in get_item_with_details: {str(e)}")
        return None
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


@match_bp.route('/api/matches/<int:item_id>', methods=['GET'])
def get_matches(item_id):
    """ค้นหาและแนะนำรายการจับคู่สิ่งของสำหรับการแลกเปลี่ยนด้วยระบบ Semantic Search"""
    try:
        my_item = get_item_with_details(item_id)
        
        if not my_item:
            return jsonify({"status": "error", "message": "ไม่พบข้อมูลสิ่งของ"}), 404
            
        desired_text = my_item.get('DesiredItem')
        if not desired_text or not desired_text.strip():
            return jsonify({
                "status": "success",
                "myItem": my_item,
                "matches": [],
                "message": "โปรดระบุสิ่งของที่ต้องการแลกเปลี่ยน (DesiredItem) เพื่อให้ระบบแนะนำรายการที่เหมาะสม"
            }), 200
            
        matches = semantic_search(my_item, top_n=10)
        filtered_matches = [m for m in matches if m.get('MemberID') != my_item['MemberID']]
        
        return jsonify({
            "status": "success",
            "myItem": my_item,
            "matches": filtered_matches[:6]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_matches: {str(e)}")
        return jsonify({"status": "error", "message": "เกิดข้อผิดพลาดในการค้นหารายการจับคู่"}), 500