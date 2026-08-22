# backend/services/vector_engine.py
from services.pythai_engine import preprocess_thai_text
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from db import get_connection 

# แนะนำให้เปลี่ยนโมเดลถ้า Server ไหว: 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2' (แม่นกว่า MiniLM)
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

# เปลี่ยนพารามิเตอร์มารับ my_item ทั้ง dict แทนแค่ user_request เพื่อทำ Two-way match
def semantic_search(my_item, top_n=5):
    if not my_item or not my_item.get('DesiredItem'):
        return []

    items = get_all_active_items()
    if not items:
        return []
    
    my_desired_text = str(my_item['DesiredItem']).strip()
    my_item_text = f"{my_item.get('CategoryName') or ''} {my_item['ItemName']} {my_item['ItemDescription'] or ''}".strip()
    
    my_desired_tokens = set(preprocess_thai_text(my_desired_text))
    
    # สร้าง Corpus ฝั่งเป้าหมาย
    their_item_texts = [
        f"{item.get('CategoryName') or ''} {item['ItemName']} {item['ItemDescription'] or ''}".strip()
        for item in items
    ]
    their_desired_texts = [
        str(item.get('DesiredItem') or '').strip()
        for item in items
    ]
    
    # คำนวณ Vector 2 ทาง
    # 1. สิ่งที่เราอยากได้ -> ของที่เขามี
    their_item_embeddings = model.encode(their_item_texts)
    my_desired_embedding = model.encode([my_desired_text])
    score_we_want_them = cosine_similarity(my_desired_embedding, their_item_embeddings)[0]
    
    # 2. ของที่เรามี -> สิ่งที่เขาอยากได้
    their_desired_embeddings = model.encode(their_desired_texts)
    my_item_embedding = model.encode([my_item_text])
    score_they_want_us = cosine_similarity(my_item_embedding, their_desired_embeddings)[0]
    
    results = []
    
    for idx, item in enumerate(items):
        if str(item['ItemID']) == str(my_item['ItemID']):
            continue
            
        # เอาความต้องการทั้งสองฝั่งมาเฉลี่ยกัน (Mutual Score)
        v_score_1 = float(score_we_want_them[idx])
        v_score_2 = float(score_they_want_us[idx])
        
        # ให้น้ำหนัก "สิ่งที่เราอยากได้" มากกว่าหน่อย (เช่น 60/40) 
        avg_v_score = (v_score_1 * 0.6) + (v_score_2 * 0.4)
        
        # --- ปรับปรุง Exact & Token Match (ฝั่งสิ่งที่เราอยากได้) ---
        item_name_tokens = set(preprocess_thai_text(item['ItemName']))
        item_full_tokens = set(preprocess_thai_text(their_item_texts[idx]))
        
        # Token Bonus
        matched_tokens = my_desired_tokens.intersection(item_full_tokens)
        token_bonus = (len(matched_tokens) / len(my_desired_tokens) * 0.15) if my_desired_tokens else 0.0
        
        # Exact Match Bonus (แก้ False Positive โดยเช็กจาก Token Set แทน Substring)
        exact_bonus = 0.0
        has_exact_match = False
        meaningful_words = {q for q in my_desired_tokens if not q.isnumeric() and len(q) >= 2}
        
        # เช็กว่าคำสำคัญอยู่ใน "ชื่อสินค้า" จริงๆ (อิงจาก Token ที่ตัดมาแล้ว ไม่ใช่ Substring)
        if meaningful_words.intersection(item_name_tokens):
            exact_bonus = 0.25
            has_exact_match = True
                
        # คำนวณคะแนนสุดท้ายรวมให้ไม่เกิน 1.0 (Vector 60% + Token 15% + Exact 25%)
        hybrid_score = (avg_v_score * 0.6) + token_bonus + exact_bonus
        
        if hybrid_score > 0.35 or has_exact_match:
            res_item = item.copy()
            res_item['score'] = min(round(hybrid_score, 4), 0.99)
            res_item['v_score'] = round(avg_v_score, 4)
            results.append(res_item)
            
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    return results[:top_n]