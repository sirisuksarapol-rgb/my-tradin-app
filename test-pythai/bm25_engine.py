from item import load_items_from_db
from pythai_engine import preprocess_thai_text
from rank_bm25 import BM25Okapi

def search_and_match(user_request, top_n=5):
    
    items = load_items_from_db()
    
    if not items:
        return "ไม่พบข้อมูลสินค้าในฐานข้อมูล"
    
    corpus_texts = [f"{item['ItemName']} {item['ItemDescription']}" 
                    for item in items]
    
    tokenized_corpus = [preprocess_thai_text(text) for text in corpus_texts]
    
    bm25 = BM25Okapi(tokenized_corpus)
    
    doc_scores = bm25.get_scores(preprocess_thai_text(user_request))
    
    results = []
    for idx, score in enumerate(doc_scores):
        if score > 0:
            item = items[idx]
            item['score'] = score
            results.append(item)
            
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    
    print(f"🔍 คำค้นหาของผู้ใช้: '{user_request}'")
    print(f"📌 คำที่ระบบตีความได้ (Tokens): {preprocess_thai_text(user_request)}")
    print("=" * 60)
    
    if not results:
        print("ไม่พบสินค้าที่ตรงกับคำค้นหา")
    else:
        for i, res in enumerate(results[:5], start=1):
            print(f"{i}. [ID: {res['ItemID']}] {res['ItemName']}")
            print(f"   📝 รายละเอียด: {res['ItemDescription'][:60]}...")
            print(f"   🔄 สิ่งที่เจ้าของอยากได้เพื่อแลกกัน: {res['DesiredItem']}")
            print(f"   📍 สถานที่นัดเจอ: {res['MeetingLocation']}")
            print(f"   🎯 คะแนนความใกล้เคียง: {res['score']}")
            print("-" * 60)

if __name__ == "__main__":
    # --- ทดสอบระบบค้นหา ---
    # สมมติมีคนพิมพ์ว่าอยากได้ "คอมพิวเตอร์พกพาหรือคีย์บอร์ดไร้สาย"
    # ระบบจะไปแมตช์เจอ Macbook Air M1 (ID: 2) และ Mechanical Keyboard (ID: 3) ให้โดยอัตโนมัติ
    while True:
        search_and_match(input("ป้อนคำค้นหา: "), top_n=5)
        
      