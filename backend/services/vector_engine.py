from services.pythai_engine import (
    preprocess_thai_text,
    extract_important_attributes,
)

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from db import get_connection


# ==========================================
# VECTOR ENGINE CONFIGURATION
# ==========================================

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

print("⏳ กำลังโหลดโมเดล AI ภาษาไทย-อังกฤษ...")

model = SentenceTransformer(MODEL_NAME)

print("✅ โมเดลพร้อมใช้งานแล้ว!")


# ==========================================
# MATCHING CONFIGURATION
# ==========================================

# จำนวน Candidate ที่จะนำไปคำนวณละเอียด
CANDIDATE_LIMIT = 20

# จำนวนผลลัพธ์สุดท้าย
DEFAULT_TOP_N = 5

# คะแนนขั้นต่ำที่ยอมรับ
MIN_SCORE = 0.35


# ==========================================
# 1. GET ACTIVE ITEMS
# ==========================================

def get_all_active_items():
    """
    ดึงรายการสินค้าที่พร้อมใช้งานจากฐานข้อมูล
    """
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
            LEFT JOIN category c
                ON i.CategoryID = c.CategoryID
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


# ==========================================
# 2. BUILD ITEM TEXT
# ==========================================

def build_item_text(item):
    """
    สร้างข้อความสำหรับใช้ Semantic Matching
    """
    category = item.get("CategoryName") or ""
    name = item.get("ItemName") or ""
    description = item.get("ItemDescription") or ""

    return f"{category} {name} {description}".strip()


# ==========================================
# 3. TOKEN MATCHING
# ==========================================

def calculate_token_score(query_tokens, item_tokens):
    """
    คำนวณสัดส่วนคำที่ตรงกัน

    เช่น:
    Query มี 4 คำ
    ตรงกัน 2 คำ

    Score = 0.50
    """
    if not query_tokens:
        return 0.0

    matched_tokens = query_tokens.intersection(item_tokens)

    return len(matched_tokens) / len(query_tokens)


# ==========================================
# 4. CATEGORY MATCHING
# ==========================================

def calculate_category_score(my_item, target_item):
    """
    ตรวจสอบ Category ของสินค้า
    """
    my_category = str(my_item.get("CategoryID") or "").strip()
    target_category = str(target_item.get("CategoryID") or "").strip()

    if not my_category or not target_category:
        return 0.0

    return 1.0 if my_category == target_category else 0.0


# ==========================================
# 5. IMPORTANT ATTRIBUTE MATCHING
# ==========================================

def calculate_attribute_score(query_text, item_text):
    """
    เปรียบเทียบข้อมูลสำคัญ เช่น รุ่น ความจุ ตัวเลข และรหัสสินค้า
    """
    query_attributes = extract_important_attributes(query_text)
    item_attributes = extract_important_attributes(item_text)

    if not query_attributes:
        return 0.0

    matched_attributes = query_attributes.intersection(item_attributes)

    return len(matched_attributes) / len(query_attributes)


# ==========================================
# 6. EXACT PRODUCT NAME MATCHING
# ==========================================

def calculate_name_score(query_text, item_name):
    """
    ตรวจสอบว่าคำสำคัญจากสิ่งที่ต้องการ
    ปรากฏอยู่ในชื่อสินค้าหรือไม่
    """
    query_tokens = set(preprocess_thai_text(query_text))
    item_name_tokens = set(preprocess_thai_text(item_name))

    if not query_tokens or not item_name_tokens:
        return 0.0

    matched_tokens = query_tokens.intersection(item_name_tokens)

    return len(matched_tokens) / len(query_tokens)


# ==========================================
# 7. SEMANTIC SCORE
# ==========================================

def calculate_semantic_scores(my_item, items):
    """
    คำนวณ Semantic Similarity สองทิศทาง

    Direction 1:
        เราต้องการสินค้าของเขา

    Direction 2:
        เขาต้องการสินค้าของเรา
    """
    my_desired_text = str(my_item.get("DesiredItem") or "").strip()
    my_item_text = build_item_text(my_item)

    their_item_texts = [
        build_item_text(item)
        for item in items
    ]

    their_desired_texts = [
        str(item.get("DesiredItem") or "").strip()
        for item in items
    ]

    my_desired_embedding = model.encode(
        [my_desired_text],
        normalize_embeddings=True,
    )

    their_item_embeddings = model.encode(
        their_item_texts,
        normalize_embeddings=True,
    )

    score_we_want_them = cosine_similarity(
        my_desired_embedding,
        their_item_embeddings,
    )[0]

    my_item_embedding = model.encode(
        [my_item_text],
        normalize_embeddings=True,
    )

    their_desired_embeddings = model.encode(
        their_desired_texts,
        normalize_embeddings=True,
    )

    score_they_want_us = cosine_similarity(
        my_item_embedding,
        their_desired_embeddings,
    )[0]

    return score_we_want_them, score_they_want_us


# ==========================================
# 8. CALCULATE FINAL SCORE
# ==========================================

def calculate_final_score(
    semantic_score,
    reverse_score,
    token_score,
    category_score,
    attribute_score,
    name_score,
):
    """
    คำนวณคะแนน Matching สุดท้าย

    น้ำหนัก:

    Semantic       50%
    Reverse        15%
    Token          15%
    Attribute      10%
    Category       5%
    Name           5%
    """

    final_score = (
        semantic_score * 0.50
        + reverse_score * 0.15
        + token_score * 0.15
        + attribute_score * 0.10
        + category_score * 0.05
        + name_score * 0.05
    )

    return min(1.0, final_score)


# ==========================================
# 9. SEMANTIC SEARCH / HYBRID MATCHING
# ==========================================

def semantic_search(my_item, top_n=DEFAULT_TOP_N):
    """
    ค้นหาและจัดอันดับสินค้าที่เหมาะสม

    ขั้นตอน:

    1. หา Candidate จาก Semantic Similarity
    2. นำ Candidate มาคำนวณ Matching แบบละเอียด
    3. Rerank
    4. คืนผลลัพธ์ Top N
    """

    if not my_item or not my_item.get("DesiredItem"):
        return []

    items = get_all_active_items()

    if not items:
        return []

    # --------------------------------------
    # Remove current user's own item
    # --------------------------------------

    items = [
        item
        for item in items
        if str(item.get("ItemID")) != str(my_item.get("ItemID"))
    ]

    if not items:
        return []

    my_desired_text = str(
        my_item.get("DesiredItem") or ""
    ).strip()

    my_desired_tokens = set(
        preprocess_thai_text(my_desired_text)
    )

    # --------------------------------------
    # Stage 1: Semantic Candidate Search
    # --------------------------------------

    score_we_want_them, score_they_want_us = calculate_semantic_scores(
        my_item,
        items,
    )

    candidates = []

    for index, item in enumerate(items):
        semantic_score = float(score_we_want_them[index])

        reverse_score = float(score_they_want_us[index])

        candidates.append(
            {
                "item": item,
                "semantic_score": semantic_score,
                "reverse_score": reverse_score,
            }
        )

    candidates.sort(
        key=lambda candidate: candidate["semantic_score"],
        reverse=True,
    )

    candidates = candidates[:CANDIDATE_LIMIT]

    # --------------------------------------
    # Stage 2: Detailed Reranking
    # --------------------------------------

    results = []

    for candidate in candidates:
        item = candidate["item"]

        semantic_score = candidate["semantic_score"]
        reverse_score = candidate["reverse_score"]

        item_text = build_item_text(item)

        item_tokens = set(
            preprocess_thai_text(item_text)
        )

        item_name = str(
            item.get("ItemName") or ""
        )

        token_score = calculate_token_score(
            my_desired_tokens,
            item_tokens,
        )

        name_score = calculate_name_score(
            my_desired_text,
            item_name,
        )

        category_score = calculate_category_score(
            my_item,
            item,
        )

        attribute_score = calculate_attribute_score(
            my_desired_text,
            item_text,
        )

        # ----------------------------------
        # Prevent one-sided matches
        # ----------------------------------

        reciprocal_score = min(
            semantic_score,
            reverse_score,
        )

        final_score = calculate_final_score(
            semantic_score=semantic_score,
            reverse_score=reciprocal_score,
            token_score=token_score,
            category_score=category_score,
            attribute_score=attribute_score,
            name_score=name_score,
        )

        # ----------------------------------
        # Keep only useful matches
        # ----------------------------------

        if final_score < MIN_SCORE:
            continue

        result_item = item.copy()

        result_item["score"] = round(final_score, 4)
        result_item["semantic_score"] = round(
            semantic_score,
            4,
        )
        result_item["reverse_score"] = round(
            reverse_score,
            4,
        )
        result_item["token_score"] = round(
            token_score,
            4,
        )
        result_item["attribute_score"] = round(
            attribute_score,
            4,
        )
        result_item["category_score"] = round(
            category_score,
            4,
        )
        result_item["name_score"] = round(
            name_score,
            4,
        )

        results.append(result_item)

    # --------------------------------------
    # Final Sorting
    # --------------------------------------

    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return results[:top_n]

