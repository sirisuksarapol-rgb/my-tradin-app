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
    
    รายละเอียดการทำงาน:
    - เชื่อมต่อฐานข้อมูลและสร้าง Cursor แบบ Dictionary เพื่อให้สามารถเข้าถึงข้อมูลด้วยชื่อคอลัมน์ได้
    - ค้นหาข้อมูลในตาราง item ตาม ItemID ที่รับเข้ามา
    - ปิดการเชื่อมต่อฐานข้อมูลและส่งคืนข้อมูลสินค้า (Dictionary) หรือ None หากเกิดข้อผิดพลาด
    """
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


# =========================================================================
# 2. ฟังก์ชัน API ค้นหาและแนะนำรายการจับคู่สิ่งของ (GET /api/matches/<item_id>)
# =========================================================================
@match_bp.route('/api/matches/<int:item_id>', methods=['GET'])
def get_matches(item_id):
    """
    API Endpoint: GET /api/matches/<int:item_id>
    คำอธิบาย: ค้นหาและแนะนำรายการจับคู่สิ่งของสำหรับการแลกเปลี่ยนโดยอาศัยระบบค้นหาเชิงความหมาย (Semantic Search)
    
    รายละเอียดการทำงาน:
    1. รับรหัสสินค้า (item_id) ผ่าน URL Path Parameter
    2. เรียกฟังก์ชัน get_item_with_details เพื่อดึงข้อมูลสินค้าของตนเอง (my_item) ออกมา
    3. ตรวจสอบว่ามีข้อมูลสินค้าหรือไม่ หากไม่พบจะคืนค่าสถานะ 404
    4. ตรวจสอบว่ามีการระบุสิ่งของที่ต้องการแลกเปลี่ยน (DesiredItem) หรือไม่ หากไม่มีจะคืนค่ารายการว่างพร้อมคำแนะนำ
    5. นำข้อมูลสินค้าของตนเองส่งเข้าสู่ระบบ semantic_search เพื่อหาไอเทมที่เหมาะสม
    6. กรองรายการที่เป็นของเจ้าของเดียวกันออก เพื่อป้องกันไม่ให้แนะนำสินค้าของตัวเอง
    7. ส่งผลลัพธ์ข้อมูลสินค้าของตนเองและรายการแนะนำที่คัดกรองแล้ว (จำกัดไม่เกิน 6 รายการ) กลับไปในรูปแบบ JSON
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