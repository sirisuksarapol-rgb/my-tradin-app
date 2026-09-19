from flask import Blueprint, jsonify
from services.vector_engine import semantic_search
from db import get_connection

# ==========================================
# MATCHES BLUEPRINT CONFIGURATION
# ==========================================
# สร้าง Blueprint สำหรับจัดกลุ่มเส้นทาง API ที่เกี่ยวข้องกับการจับคู่สิ่งของ
match_bp = Blueprint('match', __name__)


# =========================================================================
# 1. ฟังก์ชันช่วยดึงข้อมูลสิ่งของพร้อมรายละเอียดจากฐานข้อมูล (HELPER FUNCTION)
# =========================================================================
def get_item_with_details(item_id):
    """
    ฟังก์ชันตัวช่วย (Helper Function): ดึงข้อมูลสิ่งของพร้อมรายละเอียดทั้งหมดจากฐานข้อมูลตามรหัสสินค้าที่ระบุ
    """
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        
        # แก้ไข: ระบุคอลัมน์ด้วยพิมพ์เล็กและใช้ AS เพื่อคงคีย์พิมพ์ใหญ่-เล็กให้ Python นำไปใช้ต่อได้
        query = """
            SELECT 
                itemid AS "ItemID", 
                itemname AS "ItemName", 
                itemdescription AS "ItemDescription", 
                desireditem AS "DesiredItem", 
                itemimage AS "ItemImage", 
                itemstatus AS "ItemStatus", 
                postdate AS "PostDate", 
                canceldate AS "CancelDate", 
                meetinglocation AS "MeetingLocation", 
                locationlink AS "LocationLink", 
                categoryid AS "CategoryID", 
                memberid AS "MemberID"
            FROM item 
            WHERE itemid = %s
        """
        cursor.execute(query, (item_id,))
        item = cursor.fetchone()
        
        cursor.close()
        connection.close()
        return item
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดใน get_item_with_details: {e}")
        return None


# =========================================================================
# 2. ฟังก์ชัน API ค้นหาและแนะนำรายการจับคู่สิ่งของ (GET /api/matches/<item_id>)
# =========================================================================
@match_bp.route('/api/matches/<int:item_id>', methods=['GET'])
def get_matches(item_id):
    """
    API Endpoint: GET /api/matches/<int:item_id>
    คำอธิบาย: ค้นหาและแนะนำรายการจับคู่สิ่งของสำหรับการแลกเปลี่ยนโดยอาศัยระบบค้นหาเชิงความหมาย (Semantic Search)
    """
    try:
        # 1. ดึงข้อมูล my_item ออกมาเป็น Dictionary
        my_item = get_item_with_details(item_id)
        
        if not my_item:
            return jsonify({"status": "error", "message": "ไม่พบข้อมูลสิ่งของ"}), 404
            
        desired_text = my_item.get('DesiredItem')
        
        # 2. ตรวจสอบหากผู้ใช้ไม่ได้ระบุสิ่งของที่ต้องการแลกเปลี่ยน
        if not desired_text or not desired_text.strip():
            return jsonify({
                "status": "success",
                "myItem": my_item,
                "matches": [],
                "message": "โปรดระบุสิ่งของที่ต้องการแลกเปลี่ยน (DesiredItem) เพื่อให้ระบบแนะนำรายการที่เหมาะสม"
            }), 200
            
        current_member_id = my_item['MemberID']
        
        # 3. โยน my_item เข้าไปทั้งก้อนเพื่อค้นหาความเหมือนเชิงความหมาย (Semantic Search)
        matches = semantic_search(my_item, top_n=10)
        
        # 4. กรองรายการที่เป็นของตนเองออก
        filtered_matches = [m for m in matches if m.get('MemberID') != current_member_id]
        
        return jsonify({
            "status": "success",
            "myItem": my_item,
            "matches": filtered_matches[:6]
        }), 200
        
    except Exception as e:
        # บันทึกข้อผิดพลาดลง console ของ backend เพื่อตรวจสอบ
        print(f"❌ Error in get_matches: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500