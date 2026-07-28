# backend/services/vector_engine.py
from services.pythai_engine import preprocess_thai_text
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from db import get_connection 

print("⏳ กำลังโหลดโมเดล AI ภาษาไทย-อังกฤษ...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("✅ โมเดลพร้อมใช้งานแล้ว!")

def get_all_active_items():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT 
                i.ItemID, 
                i.ItemName, 
                i.ItemDescription, 
                i.DesiredItem,
                i.ItemImage, 
                i.CategoryID, 
                i.MemberID,
                c.CategoryName
            FROM item i
            LEFT JOIN category c ON i.CategoryID = c.CategoryID
            WHERE i.ItemStatus IN ('Available', 'active')
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        cursor.close()
        connection.close()
        return items
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการดึงข้อมูลสิ่งของจาก DB: {e}")
        return []

def semantic_search(user_request, current_item_id=None, top_n=5):
    # ป้องกันกรณี DesiredItem เป็น None หรือข้อความว่างเปล่า
    if not user_request or not str(user_request).strip():
        return []

    items = get_all_active_items()
    if not items:
        return []
    
    query_tokens = set(preprocess_thai_text(user_request))
    
    # เพิ่ม CategoryName เข้าไปในข้อความสร้าง Vector เพื่อขอบเขตความหมายที่ชัดขึ้น
    corpus_texts = [
        f"{item.get('CategoryName') or ''} {item['ItemName']} {item['ItemDescription'] or ''}".strip()
        for item in items
    ]
    
    item_embeddings = model.encode(corpus_texts)
    query_embedding = model.encode([user_request])
    vector_scores = cosine_similarity(query_embedding, item_embeddings)[0]
    
    results = []
    
    for idx, item in enumerate(items):
        # ข้ามถ้าเป็นของชิ้นเดียวกัน
        if current_item_id and str(item['ItemID']) == str(current_item_id):
            continue
            
        v_score = float(vector_scores[idx])
        
        # 1. ตัดคำฝั่ง Item ทั้งชื่อและรายละเอียด
        item_full_text = f"{item['ItemName']} {item['ItemDescription'] or ''}"
        item_tokens = set(preprocess_thai_text(item_full_text))
        
        # 2. Token Bonus: คำนวณสัดส่วนคำที่ตรงกัน
        matched_tokens = query_tokens.intersection(item_tokens)
        token_bonus = 0.0
        if query_tokens:
            overlap_ratio = len(matched_tokens) / len(query_tokens)
            token_bonus = overlap_ratio * 0.25
        
        # 3. Exact Bonus: เช็กว่ามีคำสำคัญตรงกันใน "ชื่อสินค้า" หรือไม่
        name_tokens = set(preprocess_thai_text(item['ItemName']))
        
        # กรองตัวเลขเดี่ยวๆ ออกจากการเช็ก Exact Match (ป้องกันการแมตช์แค่เลข เช่น 9 ตรงกับ 9)
        meaningful_query = {t for t in query_tokens if not t.isnumeric()} 
        
        # 3. Exact Bonus (ปรับปรุงใหม่ให้ทนทานต่อการตัดคำ)
        exact_bonus = 0.0
        has_exact_match = False
        name_lower = item['ItemName'].lower()
        
        # คัดเฉพาะคำค้นหาที่ยาวตั้งแต่ 3 ตัวอักษรขึ้นไป และไม่ใช่แค่ตัวเลข
        meaningful_words = [q for q in query_tokens if not q.isnumeric() and len(q) >= 3]
        
        # ตรวจสอบว่าคำสำคัญ (เช่น 'ipad') ซ่อนอยู่ในชื่อสินค้า (name_lower) หรือไม่
        for word in meaningful_words:
            if word in name_lower:
                exact_bonus = 0.40
                has_exact_match = True
                break  # เจอคำเดียวที่ตรง ถือว่าตรงเป๊ะทันที
                
        # รวมคะแนน: ลดน้ำหนัก AI ลงเหลือ 40%
        hybrid_score = (v_score * 0.4) + token_bonus + exact_bonus
        
        # 4. บังคับผ่าน Threshold
        if hybrid_score > 0.30 or has_exact_match:
            res_item = item.copy()
            res_item['score'] = min(round(hybrid_score, 4), 0.99)
            res_item['v_score'] = round(v_score, 4)
            results.append(res_item)
            
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    return results[:top_n]