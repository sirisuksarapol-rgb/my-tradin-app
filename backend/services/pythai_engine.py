import re
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords

# ==================================================
# 1. ตั้งค่า Stop Words
# ==================================================
THAI_STOP_WORDS = {
    word.strip().lower()
    for word in thai_stopwords()
    if word and word.strip()
}


# ==================================================
# 2. ทำความสะอาดข้อความ
# ==================================================

def normalize_text(text) -> str:
    """แปลงข้อความให้เป็นรูปแบบมาตรฐานก่อนนำไปประมวลผล"""
    
    if text is None:
        return ""
    return re.sub(r"\s+", " ", str(text).lower().strip())


# ==================================================
# 3. ตัดคำภาษาไทยและกรอง Stop Words
# ==================================================

def preprocess_thai_text(text) -> list[str]:
    """ตัดข้อความเป็นคำและลบคำที่ไม่จำเป็นออก"""

    text = normalize_text(text)

    if not text:
        return []

    # ใช้ PyThaiNLP และอัลกอริทึม newmm ในการตัดคำ
    # จากนั้นตัดช่องว่างของแต่ละคำและแปลงเป็นตัวพิมพ์เล็ก
    return [
        token
        for word in word_tokenize(text, engine="newmm")
        if (token := word.strip().lower())

        and token not in THAI_STOP_WORDS
    ]


# ==================================================
# 4. รูปแบบสำหรับค้นหาตัวเลขและหน่วย
# ==================================================

NUMBER_PATTERN = re.compile(
    r"(?<![a-z0-9])"            
    r"\d+(?:\.\d+)?"             
    r"\s?"                       
    r"(?:gb|tb|mb|mah|inch|นิ้ว|ปี|kg|cm|mm|v|w|g)?"
    r"(?![a-z0-9])",             
    re.IGNORECASE,               
)

MODEL_PATTERN = re.compile(
    r"(?<![a-z0-9])"
    r"(?:[a-z]+\d+[a-z0-9-]*|\d+[a-z]+[a-z0-9-]*)"
    r"(?![a-z0-9])",
    re.IGNORECASE,
)


# ==================================================
# 5. ดึงคุณลักษณะสำคัญของสิ่งของ
# ==================================================

def extract_important_attributes(text) -> set[str]:
    """ดึงตัวเลข หน่วย และรหัสรุ่นที่อาจช่วยแยกสิ่งของ"""

    text = normalize_text(text)

    if not text:
        return set()

    # ค้นหาตัวเลขและหน่วยตามรูปแบบที่กำหนด
    numbers = {
        re.sub(r"\s+", "", value)
        for value in NUMBER_PATTERN.findall(text)
    }

    # ค้นหารหัสรุ่นที่มีทั้งตัวอักษรและตัวเลข
    models = {
        value.lower()
        for value in MODEL_PATTERN.findall(text)
    }
    
    return numbers | models
