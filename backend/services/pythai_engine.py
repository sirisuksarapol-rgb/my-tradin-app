import re
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords


# ==========================================
# MODULE CONFIGURATION
# ==========================================

thai_stop_words = thai_stopwords()


# ==========================================
# TEXT NORMALIZATION
# ==========================================

def normalize_text(text):
    """
    ทำความสะอาดข้อความพื้นฐาน

    - แปลงเป็น lowercase
    - รวม whitespace
    - ตัดช่องว่างหัวและท้าย
    """
    if not text:
        return ""

    text = str(text).lower().strip()
    text = re.sub(r"\s+", " ", text)

    return text


# ==========================================
# THAI TEXT PREPROCESSING
# ==========================================

def preprocess_thai_text(text):
    """
    ตัดคำภาษาไทยและกรอง Stop Words

    คืนค่าเป็น List ของ Token
    """
    text = normalize_text(text)

    if not text:
        return []

    tokens = word_tokenize(text, engine="newmm")

    return [
        token.strip()
        for token in tokens
        if token.strip() and token.strip() not in thai_stop_words
    ]


# ==========================================
# IMPORTANT ATTRIBUTE EXTRACTION
# ==========================================

def extract_important_attributes(text):
    """
    ดึงข้อมูลที่มีความสำคัญต่อการ Matching สินค้า

    เช่น:
    - ตัวเลข
    - รุ่น
    - ความจุ
    - ขนาด
    - รหัสสินค้า
    - ตัวอักษร+ตัวเลข เช่น S24, A55, 128GB
    """
    text = normalize_text(text)

    if not text:
        return set()

    attributes = set()

    # ตัวเลขและค่าที่มีหน่วย เช่น 128GB, 6.7, 256 gb
    number_patterns = re.findall(
        r"\b\d+(?:\.\d+)?\s?(?:gb|tb|mb|inch|นิ้ว|ปี|kg|g|cm|mm|v|w|mah)?\b",
        text,
        flags=re.IGNORECASE,
    )

    for value in number_patterns:
        attributes.add(value.replace(" ", ""))

    # รหัส/รุ่นที่มีทั้งตัวอักษรและตัวเลข เช่น S24, A55, iPhone15
    model_patterns = re.findall(
        r"\b[a-z]+\d+[a-z0-9-]*\b|\b\d+[a-z]+\b",
        text,
        flags=re.IGNORECASE,
    )

    for value in model_patterns:
        attributes.add(value)

    return attributes

