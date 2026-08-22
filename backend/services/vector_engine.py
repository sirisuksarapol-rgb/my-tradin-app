# backend/services/vector_engine.py
from services.pythai_engine import preprocess_thai_text
from db import get_connection 

# โหลดโมเดล AI แบบปลอดภัย ป้องกันแรมเต็ม (Out of memory) บนเซิร์ฟเวอร์ฟรี
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    import torch
    
    print("⏳ กำลังโหลดโมเดล AI ภาษาไทย-อังกฤษ...")
    model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    AI_AVAILABLE = True
    print("✅ โมเดลพร้อมใช้งานแล้ว!")
except Exception as e:
    AI_AVAILABLE = False
    model = None
    print(f"⚠️ ข้ามการโหลดโมเดล AI (โหมดประหยัดแรมบนคลาวด์): {e}")

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

def semantic_search(my_item, top_n=5):
    if not my_item or not my_item.get('DesiredItem'):
        return []

    items = get_all_active_items()
    if not items:
        return []
    
    my_desired_text = str(my_item['DesiredItem']).strip()
    my_desired_tokens = set(preprocess_thai_text(my_desired_text))
    
    results = []
    
    # 1. กรณี AI พร้อมใช้งาน (เครื่องส่วนตัวที่มีแรมพอ)
    if AI_AVAILABLE and model is not None:
        try:
            my_item_text = f"{my_item.get('CategoryName') or ''} {my_item['ItemName']} {my_item['ItemDescription'] or ''}".strip()
            their_item_texts = [
                f"{item.get('CategoryName') or ''} {item['ItemName']} {item['ItemDescription'] or ''}".strip()
                for item in items
            ]
            their_desired_texts = [
                str(item.get('DesiredItem') or '').strip()
                for item in items
            ]
            
            their_item_embeddings = model.encode(their_item_texts)
            my_desired_embedding = model.encode([my_desired_text])
            score_we_want_them = cosine_similarity(my_desired_embedding, their_item_embeddings)[0]
            
            their_desired_embeddings = model.encode(their_desired_texts)
            my_item_embedding = model.encode([my_item_text])
            score_they_want_us = cosine_similarity(my_item_embedding, their_desired_embeddings)[0]
            
            for idx, item in enumerate(items):
                if str(item['ItemID']) == str(my_item['ItemID']):
                    continue
                    
                v_score_1 = float(score_we_want_them[idx])
                v_score_2 = float(score_they_want_us[idx])
                avg_v_score = (v_score_1 * 0.6) + (v_score_2 * 0.4)
                
                item_name_tokens = set(preprocess_thai_text(item['ItemName']))
                item_full_tokens = set(preprocess_thai_text(their_item_texts[idx]))
                
                matched_tokens = my_desired_tokens.intersection(item_full_tokens)
                token_bonus = (len(matched_tokens) / len(my_desired_tokens) * 0.15) if my_desired_tokens else 0.0
                
                exact_bonus = 0.0
                has_exact_match = False
                meaningful_words = {q for q in my_desired_tokens if not q.isnumeric() and len(q) >= 2}
                
                if meaningful_words.intersection(item_name_tokens):
                    exact_bonus = 0.25
                    has_exact_match = True
                    
                hybrid_score = (avg_v_score * 0.6) + token_bonus + exact_bonus
                
                if hybrid_score > 0.35 or has_exact_match:
                    res_item = item.copy()
                    res_item['score'] = min(round(hybrid_score, 4), 0.99)
                    res_item['v_score'] = round(avg_v_score, 4)
                    results.append(res_item)
            
            results = sorted(results, key=lambda x: x['score'], reverse=True)
            return results[:top_n]
        except Exception as e:
            print(f"⚠️ Vector search error, falling back: {e}")

    # 2. กรณีโหมดประหยัดแรมบน Render (ใช้ Token & Keyword Match จาก pythainlp)
    for item in items:
        if str(item['ItemID']) == str(my_item['ItemID']):
            continue
            
        item_text = f"{item.get('CategoryName') or ''} {item['ItemName']} {item['ItemDescription'] or ''}".strip()
        item_full_tokens = set(preprocess_thai_text(item_text))
        item_name_tokens = set(preprocess_thai_text(item['ItemName']))
        
        matched_tokens = my_desired_tokens.intersection(item_full_tokens)
        token_score = (len(matched_tokens) / len(my_desired_tokens)) if my_desired_tokens else 0.0
        
        has_exact_match = False
        meaningful_words = {q for q in my_desired_tokens if not q.isnumeric() and len(q) >= 2}
        if meaningful_words.intersection(item_name_tokens):
            has_exact_match = True
            token_score += 0.4
            
        if token_score > 0.1 or has_exact_match:
            res_item = item.copy()
            res_item['score'] = min(round(token_score, 4), 0.99)
            res_item['v_score'] = 0.0
            results.append(res_item)
            
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    return results[:top_n]