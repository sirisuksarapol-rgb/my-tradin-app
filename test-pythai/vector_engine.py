from item import load_items_from_db
from pythai_engine import preprocess_thai_text # เหลือแค่ตัวนี้
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

print("⏳ กำลังโหลดโมเดล AI ภาษาไทย-อังกฤษ...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("✅ โมเดลพร้อมใช้งานแล้ว!")

def semantic_search(user_request, top_n=5):
    items = load_items_from_db()
    
    if not items:
        print("❌ ไม่พบข้อมูลสินค้าในฐานข้อมูล")
        return
    
    query_tokens = preprocess_thai_text(user_request)
    
    print(f"\n🔍 คำค้นหา: '{user_request}'")
    print("🧠 ระบบ Hybrid Search กำลังประมวลผล...")
    
    corpus_texts = [f"{item['ItemName']} {item['ItemDescription']}" for item in items]
    
    item_embeddings = model.encode(corpus_texts)
    query_embedding = model.encode([user_request]) # ส่งคำดิบๆ ของ user ให้ AI เลย
    vector_scores = cosine_similarity(query_embedding, item_embeddings)[0]
    
    results = []
    for idx, item in enumerate(items):
        item_name_lower = item['ItemName'].lower()
        v_score = float(vector_scores[idx])
        
        # คะแนนพิเศษจาก Keyword (Exact Match)
        exact_bonus = 0.0
        if user_request.lower().replace(" ", "") in item_name_lower.replace(" ", ""):
            exact_bonus += 0.40
            
        # คะแนนความเหมือนของกลุ่มคำ (Token Overlap)
        item_tokens = preprocess_thai_text(corpus_texts[idx])
        matched_tokens = set(query_tokens).intersection(set(item_tokens))
        token_bonus = (len(matched_tokens) / len(query_tokens)) * 0.20 if query_tokens else 0.0
        
        hybrid_score = v_score + exact_bonus + token_bonus
        
        # ปรับคะแนนขั้นต่ำลงมาหน่อยเป็น 0.42 (เพราะไม่มีการแปลงคำช่วยเพิ่มคะแนนแล้ว)
        if hybrid_score > 0.42:
            res_item = item.copy()
            res_item['score'] = round(hybrid_score, 4)
            res_item['v_score'] = round(v_score, 4)
            results.append(res_item)
            
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    
    print("=" * 60)
    
    if not results:
        print("❌ ไม่พบสินค้าที่ตรงหรือมีความหมายใกล้เคียงกับคำค้นหาของคุณ")
    else:
        for i, res in enumerate(results[:top_n], start=1):
            display_score = min(res['score'], 1.0000)
            print(f"{i}. [ID: {res['ItemID']}] {res['ItemName']}")
            print(f"   📝 รายละเอียด: {res['ItemDescription'][:60]}...")
            print(f"   🎯 คะแนนความแม่นยำรวม: {display_score} (AI Vector: {res['v_score']})")
            print("-" * 60)

if __name__ == "__main__":
    print("\n--- ระบบสืบค้นสิ่งของอัจฉริยะด้วย AI (Vector Search) ---")
    while True:
        user_input = input("ป้อนสิ่งของที่คุณต้องการ  ")
        if user_input.lower() == 'q':
            print("👋 ขอบคุณที่ใช้บริการ!")
            break
        semantic_search(user_input, top_n=5)