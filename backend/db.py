import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# โหลดค่าจากไฟล์ .env
load_dotenv()

def get_connection():
    # ดึง URL สำหรับต่อฐานข้อมูล (รองรับทั้งตอนทำในเครื่อง และตอนขึ้น Render)
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        print("Warning: DATABASE_URL is not set in environment variables.")
        return None
    
    try:
        # ทำการเชื่อมต่อ
        conn = psycopg2.connect(database_url)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None