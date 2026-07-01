# D:\tradin_system\test-pythai\pythai_engine.py
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords

thai_stop_words = thai_stopwords()

def preprocess_thai_text(text):
    if not text:
        return []
    
    text = text.lower().strip()
    tokens = word_tokenize(text, engine='newmm')
    
    # กรองช่องว่างและ Stop words ออก
    return [t.strip() for t in tokens if t.strip() and t not in thai_stop_words]