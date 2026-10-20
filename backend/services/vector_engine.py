
from typing import Any
import unicodedata

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from db import get_connection
from services.pythai_engine import preprocess_thai_text

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# ==================================================
# 1. ตั้งค่าระบบ Matching
# ==================================================

ENCODE_BATCH_SIZE = 64
MIN_SCORE = 0.35

WEIGHTS = {
    "reciprocal": 0.50,  # ความเข้ากันได้ของทั้งสองฝ่าย 50%
    "semantic": 0.35,    # ความคล้ายคลึงเชิงความหมาย 35%
    "token": 0.15,       # ความตรงกันของคำสำคัญ 15%
}

print("กำลังโหลดโมเดล AI...")
model = SentenceTransformer(
    MODEL_NAME,
    local_files_only=True,
)
print("โมเดล Matching พร้อมใช้งาน!")


# ==================================================
# 2. ดึงรายการสิ่งของจากฐานข้อมูล
# ==================================================

def get_all_active_items() -> list[dict[str, Any]]:
    """ดึงสิ่งของที่ยังเปิดให้จับคู่ พร้อมชื่อหมวดหมู่"""

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
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
        """)

        return cursor.fetchall()

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None:
            connection.close()


# ==================================================
# 3. ฟังก์ชันจัดการข้อความและคะแนน
# ==================================================

def build_item_text(item: dict[str, Any]) -> str:
    """รวมหมวดหมู่ ชื่อ และรายละเอียดของสิ่งของ"""

    parts = [
        item.get("CategoryName"),
        item.get("ItemName"),
        item.get("ItemDescription"),
    ]

    return " ".join(
        str(part).strip()
        for part in parts
        if part and str(part).strip()
    )


def normalize_match_text(text: str) -> str:
    """ปรับข้อความก่อนตรวจว่าตรงกันโดยตรงหรือไม่"""

    text = unicodedata.normalize("NFKC", text)
    return " ".join(text.casefold().split())


def clamp_score(score: float) -> float:
    """จำกัดคะแนนให้อยู่ในช่วง 0 ถึง 1"""

    return max(0.0, min(1.0, float(score)))


def get_tokens(text: str) -> set[str]:
    """แปลงข้อความเป็นชุดคำสำคัญ"""

    tokens = preprocess_thai_text(text)

    if tokens is None:
        return set()

    # กรณีฟังก์ชันคืนค่าเป็นข้อความที่แบ่งคำด้วยช่องว่าง
    if isinstance(tokens, str):
        tokens = tokens.split()

    return {
        str(token).strip().casefold()
        for token in tokens
        if str(token).strip()
    }


def calculate_token_score(
    query_tokens: set[str],
    item_tokens: set[str],
) -> float:
    """คำนวณสัดส่วนคำสำคัญที่ตรงกัน"""

    if not query_tokens:
        return 0.0

    return len(query_tokens & item_tokens) / len(query_tokens)


def calculate_final_score(
    semantic: float,
    reciprocal: float,
    token: float,
) -> float:
    """รวมคะแนนตามน้ำหนัก 50% / 35% / 15%"""

    score = (
        reciprocal * WEIGHTS["reciprocal"]
        + semantic * WEIGHTS["semantic"]
        + token * WEIGHTS["token"]
    )

    return clamp_score(score)


# ==================================================
# 4. คำนวณคะแนนความคล้ายคลึงด้วย AI
# ==================================================

def calculate_semantic_scores(
    my_desired_text: str,
    my_item_text: str,
    item_texts: list[str],
    desired_texts: list[str],
) -> tuple[list[float], list[float]]:
    """
    คำนวณความคล้ายคลึงของข้อความทั้งสองทิศทาง

    ทิศทางแรก:
    สิ่งที่เราต้องการ เทียบกับข้อความสิ่งของของอีกฝ่าย

    ทิศทางกลับ:
    สิ่งของของเรา เทียบกับสิ่งที่อีกฝ่ายต้องการ
    """

    my_embeddings = model.encode(
        [my_desired_text, my_item_text],
        normalize_embeddings=True,
        batch_size=ENCODE_BATCH_SIZE,
        convert_to_numpy=True,
    )

    item_embeddings = model.encode(
        item_texts,
        normalize_embeddings=True,
        batch_size=ENCODE_BATCH_SIZE,
        convert_to_numpy=True,
    )

    desired_embeddings = model.encode(
        desired_texts,
        normalize_embeddings=True,
        batch_size=ENCODE_BATCH_SIZE,
        convert_to_numpy=True,
    )

    # สิ่งที่เราต้องการ เทียบกับสิ่งของของอีกฝ่าย
    forward_scores = cosine_similarity(
        my_embeddings[0:1],
        item_embeddings,
    )[0]

    # สิ่งของของเรา เทียบกับสิ่งที่อีกฝ่ายต้องการ
    reverse_scores = cosine_similarity(
        my_embeddings[1:2],
        desired_embeddings,
    )[0]

    return (
        [clamp_score(score) for score in forward_scores],
        [clamp_score(score) for score in reverse_scores],
    )


def calculate_reciprocal_scores(
    my_desired_text: str,
    my_item_name: str,
    item_names: list[str],
    desired_texts: list[str],
) -> tuple[list[float], list[float]]:
    """
    ตรวจความตรงกันของสิ่งที่ทั้งสองฝ่ายต้องการ

    หากข้อความตรงกันหลังปรับรูปแบบ จะได้ 1.0
    หากไม่ตรงกัน จะใช้ Cosine Similarity จากชื่อสิ่งของ
    """

    my_embeddings = model.encode(
        [my_desired_text, my_item_name],
        normalize_embeddings=True,
        batch_size=ENCODE_BATCH_SIZE,
        convert_to_numpy=True,
    )

    item_name_embeddings = model.encode(
        item_names,
        normalize_embeddings=True,
        batch_size=ENCODE_BATCH_SIZE,
        convert_to_numpy=True,
    )

    desired_embeddings = model.encode(
        desired_texts,
        normalize_embeddings=True,
        batch_size=ENCODE_BATCH_SIZE,
        convert_to_numpy=True,
    )

    # เปรียบเทียบความต้องการของเรากับชื่อสิ่งของของอีกฝ่าย
    forward_scores = cosine_similarity(
        my_embeddings[0:1],
        item_name_embeddings,
    )[0]

    # เปรียบเทียบชื่อสิ่งของของเรากับความต้องการของอีกฝ่าย
    reverse_scores = cosine_similarity(
        my_embeddings[1:2],
        desired_embeddings,
    )[0]

    normalized_my_desired = normalize_match_text(my_desired_text)
    normalized_my_item = normalize_match_text(my_item_name)

    result_forward = []
    result_reverse = []

    for item_name, desired_text, forward, reverse in zip(
        item_names,
        desired_texts,
        forward_scores,
        reverse_scores,
    ):
        # ทิศทางแรก: ของที่เราต้องการตรงกับชื่อของอีกฝ่ายหรือไม่
        if normalized_my_desired == normalize_match_text(item_name):
            result_forward.append(1.0)
        else:
            result_forward.append(clamp_score(forward))

        # ทิศทางกลับ: ของที่เรามีตรงกับความต้องการของอีกฝ่ายหรือไม่
        if normalized_my_item == normalize_match_text(desired_text):
            result_reverse.append(1.0)
        else:
            result_reverse.append(clamp_score(reverse))

    return result_forward, result_reverse


# ==================================================
# 5. ค้นหาและจัดอันดับสิ่งของ
# ==================================================

def semantic_search(
    my_item: dict[str, Any],
) -> list[dict[str, Any]]:
    """ค้นหาและจัดอันดับรายการที่เหมาะสมสำหรับแลกเปลี่ยน"""

    my_desired_text = str(
        my_item.get("DesiredItem") or ""
    ).strip()

    my_item_name = str(
        my_item.get("ItemName") or ""
    ).strip()

    if not my_desired_text or not my_item_name:
        return []

    # STEP 1: ดึงรายการที่ยังเปิดให้จับคู่
    all_items = get_all_active_items()

    my_item_id = my_item.get("ItemID")
    my_member_id = my_item.get("MemberID")

    candidates = []

    for item in all_items:
        # ไม่จับคู่กับโพสต์ของตัวเอง
        if item.get("ItemID") == my_item_id:
            continue

        # ไม่จับคู่กับสมาชิกคนเดิม
        if item.get("MemberID") == my_member_id:
            continue

        desired_text = str(
            item.get("DesiredItem") or ""
        ).strip()

        item_name = str(
            item.get("ItemName") or ""
        ).strip()

        if not desired_text or not item_name:
            continue

        candidates.append((item, desired_text))

    if not candidates:
        return []

    items = [item for item, _ in candidates]
    desired_texts = [desired for _, desired in candidates]
    item_names = [
        str(item.get("ItemName") or "")
        for item in items
    ]

    # STEP 2: เตรียมข้อความ
    my_item_text = build_item_text(my_item)
    item_texts = [
        build_item_text(item)
        for item in items
    ]

    # STEP 3: เตรียมคำสำคัญ
    my_desired_tokens = get_tokens(my_desired_text)
    my_item_tokens = get_tokens(my_item_text)

    candidate_item_tokens = [
        get_tokens(item_text)
        for item_text in item_texts
    ]

    candidate_desired_tokens = [
        get_tokens(desired_text)
        for desired_text in desired_texts
    ]

    # STEP 4: คำนวณคะแนน Semantic ทั้งสองทิศทาง
    semantic_forward, semantic_reverse = calculate_semantic_scores(
        my_desired_text=my_desired_text,
        my_item_text=my_item_text,
        item_texts=item_texts,
        desired_texts=desired_texts,
    )

    # STEP 5: คำนวณคะแนน Reciprocal ทั้งสองทิศทาง
    reciprocal_forward, reciprocal_reverse = (
        calculate_reciprocal_scores(
            my_desired_text=my_desired_text,
            my_item_name=my_item_name,
            item_names=item_names,
            desired_texts=desired_texts,
        )
    )

    results = []

    # STEP 6: คำนวณคะแนนรวม
    for (
        item,
        item_tokens,
        desired_tokens,
        semantic_f,
        semantic_r,
        reciprocal_f,
        reciprocal_r,
    ) in zip(
        items,
        candidate_item_tokens,
        candidate_desired_tokens,
        semantic_forward,
        semantic_reverse,
        reciprocal_forward,
        reciprocal_reverse,
    ):
        # Reciprocal ใช้ด้านที่ได้คะแนนต่ำกว่า
        reciprocal = min(reciprocal_f, reciprocal_r)

        # Semantic ใช้ค่าเฉลี่ยทั้งสองทิศทาง
        semantic = (semantic_f + semantic_r) / 2

        # Token ทิศทางแรก:
        # สิ่งที่เราต้องการ เทียบกับข้อความสิ่งของของอีกฝ่าย
        token_forward = calculate_token_score(
            my_desired_tokens,
            item_tokens,
        )

        # Token ทิศทางกลับ:
        # สิ่งที่อีกฝ่ายต้องการ เทียบกับข้อความสิ่งของของเรา
        token_reverse = calculate_token_score(
            desired_tokens,
            my_item_tokens,
        )

        token = (token_forward + token_reverse) / 2

        final_score = calculate_final_score(
            semantic=semantic,
            reciprocal=reciprocal,
            token=token,
        )

        if final_score < MIN_SCORE:
            continue

        results.append({
            **item,
            "score": round(final_score, 4),

            # คะแนนย่อยสำหรับตรวจสอบ
            "reciprocal_score": round(reciprocal, 4),
            "reciprocal_forward_score": round(reciprocal_f, 4),
            "reciprocal_reverse_score": round(reciprocal_r, 4),

            "semantic_score": round(semantic, 4),
            "semantic_forward_score": round(semantic_f, 4),
            "semantic_reverse_score": round(semantic_r, 4),

            "token_score": round(token, 4),
            "token_forward_score": round(token_forward, 4),
            "token_reverse_score": round(token_reverse, 4),
        })

    # STEP 7: เรียงจากคะแนนสูงไปต่ำ
    results.sort(
        key=lambda result: result["score"],
        reverse=True,
    )

    return results
