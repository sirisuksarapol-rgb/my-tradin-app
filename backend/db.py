import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# โหลดตัวแปรจากไฟล์ .env (สำหรับรันบนเครื่อง Local)
load_dotenv()

class PostgresConnectionWrapper:
    """
    Class จำลองตัวเชื่อมต่อ เพื่อให้สามารถใช้คำสั่ง cursor(dictionary=True) 
    แบบเดิมของ MySQL บน PostgreSQL ได้โดยไม่ต้องแก้โค้ดใน Route อื่นๆ
    """
    def __init__(self, conn):
        self._conn = conn

    def cursor(self, dictionary=False, **kwargs):
        if dictionary:
            return self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return self._conn.cursor(**kwargs)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

def get_connection():
    """
    ฟังก์ชันเชื่อมต่อฐานข้อมูล:
    - ถ้ารันบน Local จะอ่านค่า DATABASE_URL จากไฟล์ .env
    - ถ้ารันบน Render จะอ่านค่า DATABASE_URL จาก Environment Variable ของ Render โดยอัตโนมัติ
    """
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        raise ValueError("❌ ไม่พบตัวแปร DATABASE_URL กรุณาตรวจสอบไฟล์ .env หรือ Environment Variables บน Render")

    # เชื่อมต่อ PostgreSQL พร้อมเปิดใช้งาน SSL (จำเป็นสำหรับ Render)
    raw_conn = psycopg2.connect(
        database_url,
        sslmode='require'
    )
    return PostgresConnectionWrapper(raw_conn)