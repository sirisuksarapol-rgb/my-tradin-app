import mysql.connector

# =========================================================================
# ส่วนจัดการการเชื่อมต่อฐานข้อมูล (Database Connection Module)
# =========================================================================

def get_connection():
    """
    ฟังก์ชันหลัก (Core Connection Function): สร้างและคืนค่าออบเจ็กต์การเชื่อมต่อ (Connection Object) ไปยังฐานข้อมูล MySQL
    
    รายละเอียดการทำงานเชิงลึก:
    - ใช้ไลบรารี mysql.connector เพื่อสร้างช่องทางการสื่อสารกับ MySQL Database Server
    - กำหนดค่าพารามิเตอร์พื้นฐานสำหรับการเชื่อมต่อประกอบด้วย:
      - host: ที่อยู่เซิร์ฟเวอร์ฐานข้อมูล ('localhost')
      - user: ชื่อผู้ใช้งานระบบฐานข้อมูล ('root')
      - password: รหัสผ่านสำหรับเข้าถึงระบบฐานข้อมูล (ค่าว่าง '')
      - database: ชื่อฐานข้อมูลเฉพาะที่ระบบใช้งาน ('tradin_db')
    - คืนค่า Connection Object กลับไปเพื่อให้ส่วนบริการอื่น ๆ ของแอปพลิเคชันนำไปสร้าง Cursor สำหรับประมวลผลคำสั่ง SQL ต่อไป
    """
    return mysql.connector.connect(
        host='localhost',                     
        user='root',
        password='',    
        database='tradin_db'
    )