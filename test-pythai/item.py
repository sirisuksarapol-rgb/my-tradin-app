import db

def load_items_from_db():
    try:
        conn = db.get_connection()
        # ใช้ dictionary=True เพื่อให้ข้อมูลคืนค่ามาเป็น Dict เช่น item['ItemName']
        cursor = conn.cursor(dictionary=True) 
        
        # ดึงข้อมูลจากตาราง item (อาจจะกรองเฉพาะของที่สถานะ Available ก็ได้)
        query = """
            SELECT ItemID, ItemName, ItemDescription, DesiredItem, MeetingLocation 
            FROM item 
            WHERE ItemStatus = 'Available'
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return items
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: {e}")
        return []