# backend/routes/matches.py
from flask import Blueprint, jsonify
from services.vector_engine import semantic_search
from db import get_connection

match_bp = Blueprint('match', __name__)

def get_item_with_details(item_id):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = "SELECT * FROM item WHERE ItemID = %s"
        cursor.execute(query, (item_id,))
        item = cursor.fetchone()
        
        cursor.close()
        connection.close()
        return item
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดใน get_item_with_details: {e}")
        return None

@match_bp.route('/api/matches/<int:item_id>', methods=['GET'])
def get_matches(item_id):
    try:
        my_item = get_item_with_details(item_id)
        
        if not my_item:
            return jsonify({"status": "error", "message": "ไม่พบข้อมูลสิ่งของ"}), 404
            
        desired_text = my_item.get('DesiredItem')
        
        # ตรวจสอบหากผู้ใช้ไม่ได้ระบุสิ่งของที่ต้องการแลกเปลี่ยน
        if not desired_text or not desired_text.strip():
            return jsonify({
                "status": "success",
                "myItem": my_item,
                "matches": [],
                "message": "โปรดระบุสิ่งของที่ต้องการแลกเปลี่ยน (DesiredItem) เพื่อให้ระบบแนะนำรายการที่เหมาะสม"
            }), 200
            
        current_member_id = my_item['MemberID']
        
        # ดึงผลลัพธ์จาก AI
        matches = semantic_search(desired_text, current_item_id=item_id, top_n=10)
        
        # กรองรายการที่เป็นของตนเองออก
        filtered_matches = [m for m in matches if m.get('MemberID') != current_member_id]
        
        return jsonify({
            "status": "success",
            "myItem": my_item,
            "matches": filtered_matches[:6]
        }), 200
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500