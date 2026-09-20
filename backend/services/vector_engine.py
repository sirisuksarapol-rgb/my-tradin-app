from services.pythai_engine import preprocess_thai_text
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from db import get_connection 

# ==========================================
# VECTOR ENGINE CONFIGURATION & MODEL INITIALIZATION
# ==========================================
print("⏳ กำลังโหลดโมเดล AI ภาษาไทย-อังกฤษ...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("✅ โมเดลพร้อมใช้งานแล้ว!")


# =========================================================================
# 1. ฟังก์ชันดึงข้อมูลสิ่งของที่พร้อมใช้งานทั้งหมดจากฐานข้อมูล (GET ACTIVE ITEMS)
# =========================================================================
def get_all_active_items():
    """ดึงรายการสินค้าทั้งหมดที่มีสถานะเปิดใช้งานจากฐานข้อมูล"""
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


# =========================================================================
# 2. ฟังก์ชันค้นหาและจับคู่สินค้าเชิงความหมายแบบสองทาง (SEMANTIC SEARCH / TWO-WAY MATCH)
# =========================================================================
def semantic_search(my_item, top_n=5):
    """ระบบค้นหาและแนะนำสินค้าด้วย AI แบบสองทาง พร้อมสูตร Hybrid Scaling ที่เป็นธรรมชาติ[cite: 2]"""
    if not my_item or not my_item.get('DesiredItem'):
        return []

    items = get_all_active_items()
    if not items:
        return []
    
    my_desired_text = str(my_item['DesiredItem']).strip()
    my_item_text = f"{my_item.get('CategoryName') or ''} {my_item['ItemName']} {my_item['ItemDescription'] or ''}".strip()
    
    my_desired_tokens = set(preprocess_thai_text(my_desired_text))
    
    their_item_texts = [
        f"{item.get('CategoryName') or ''} {item['ItemName']} {item['ItemDescription'] or ''}".strip()
        for item in items
    ]
    their_desired_texts = [
        str(item.get('DesiredItem') or '').strip()
        for item in items
    ]
    
    # คำนวณ Vector Embedding และ Cosine Similarity[cite: 2]
    their_item_embeddings = model.encode(their_item_texts)
    my_desired_embedding = model.encode([my_desired_text])
    score_we_want_them = cosine_similarity(my_desired_embedding, their_item_embeddings)[0]
    
    their_desired_embeddings = model.encode(their_desired_texts)
    my_item_embedding = model.encode([my_item_text])
    score_they_want_us = cosine_similarity(my_item_embedding, their_desired_embeddings)[0]
    
    results = []
    
    for idx, item in enumerate(items):
        if str(item['ItemID']) == str(my_item['ItemID']):
            continue
            
        v_score_1 = float(score_we_want_them[idx])
        v_score_2 = float(score_they_want_us[idx])
        
        # ให้น้ำหนักฝั่ง "สิ่งที่เราอยากได้" 80% และฝั่ง "สิ่งที่เขาอยากได้จากเรา" 20%[cite: 2]
        avg_v_score = (v_score_1 * 0.8) + (v_score_2 * 0.2)
        
        item_name_tokens = set(preprocess_thai_text(item['ItemName']))
        item_full_tokens = set(preprocess_thai_text(their_item_texts[idx]))
        
        # คำนวณ Token Bonus และ Exact Match
        matched_tokens = my_desired_tokens.intersection(item_full_tokens)
        token_bonus = (len(matched_tokens) / len(my_desired_tokens) * 0.20) if my_desired_tokens else 0.0
        
        exact_bonus = 0.0
        has_exact_match = False
        meaningful_words = {q for q in my_desired_tokens if not q.isnumeric() and len(q) >= 2}
        
        if meaningful_words.intersection(item_name_tokens):
            exact_bonus = 0.30
            has_exact_match = True
                
        # --- สูตร Dynamic Hybrid Scaling (ธรรมชาติและสะท้อนความจริง) ---
        # ปรับฐาน Vector ให้ยืดหยุ่นขึ้น (ปรับตัวคูณเป็น 0.5 และรวมโบนัสเข้าด้วยกันแบบสัดส่วนจริง)
        raw_score = (avg_v_score * 0.5) + token_bonus + exact_bonus
        
        # หากมี Exact Match และความหมายสอดคล้องสูง ให้ระบบ Scaled คะแนนพุ่งเข้าหา 1.0 โดยธรรมชาติ
        if has_exact_match and avg_v_score >= 0.70:
            # ใช้สูตรขยายสัดส่วนคะแนน (Normalization Scale) ให้เต็มเพดาน 1.0 เมื่อเข้าใกล้เคสที่สมบูรณ์
            hybrid_score = min(1.0, raw_score * 1.12)
        else:
            hybrid_score = min(1.0, raw_score)
        
        if hybrid_score > 0.35 or has_exact_match:
            res_item = item.copy()
            res_item['score'] = round(hybrid_score, 4)
            res_item['v_score'] = round(avg_v_score, 4)
            results.append(res_item)
            
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    return results[:top_n]