import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# โหลดตัวแปรสภาพแวดล้อม (Environment Variables) จากไฟล์ .env เพื่อความปลอดภัยและความยืดหยุ่นในการตั้งค่าระบบ
load_dotenv()

# นำเข้า Blueprint ของแต่ละโมดูลเส้นทาง API ภายในระบบ เพื่อแยกการจัดการสถาปัตยกรรมแบบ Modular
from routes.login import login_bp
from routes.verify import verify_bp
from routes.register import register_bp
from routes.category import category_bp
from routes.item import item_bp
from routes.exchanges import exchanges_bp 
from routes.notifications import notifications_bp
from routes.users import users_bp
from routes.reports import report_bp 
from routes.matches import match_bp
from routes.admin import admin_bp 

# สร้างและกำหนดค่าเริ่มต้นสำหรับแอปพลิเคชันหลัก Flask
app = Flask(__name__)
CORS(app) # เปิดใช้งาน Cross-Origin Resource Sharing เพื่ออนุญาตให้ Frontend (ต่างโดเมนหรือพอร์ต) สามารถเรียกใช้งาน API ได้อย่างอิสระ

# ดึงค่าคอนฟิกูเรชันฐานข้อมูลจาก Environment Variable
database_url = os.environ.get("DATABASE_URL")
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url

# กำหนด Secret Key สำหรับความปลอดภัย การเข้ารหัส และการสร้าง JWT Token
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'supersecret123')

# กำหนดเส้นทางโฟลเดอร์สำหรับจัดเก็บไฟล์ที่อัปโหลด (Uploads Directory) ภายในเซิร์ฟเวอร์
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ตรวจสอบและสร้างโฟลเดอร์ uploads โดยอัตโนมัติหากยังไม่มีอยู่จริงในระบบไฟล์
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# =========================================================================
# ฟังก์ชัน: ให้บริการไฟล์รูปภาพและไฟล์แนบ (Serve Static Files)
# =========================================================================
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """
    API Endpoint / Static File Server: GET /uploads/<path:filename>
    คำอธิบาย: ให้บริการและแสดงผลไฟล์ที่ผู้ใช้อัปโหลดขึ้นระบบ (เช่น รูปโปรไฟล์, รูปสินค้า)
    
    รายละเอียดการทำงาน:
    - รับค่าชื่อไฟล์หรือพาธย่อย (filename) ผ่าน URL Path Parameter
    - ใช้ฟังก์ชัน send_from_directory เพื่อดึงและส่งไฟล์จากโฟลเดอร์ UPLOAD_FOLDER กลับไปยัง Client อย่างปลอดภัย
    """
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# =========================================================================
# ลงทะเบียน Blueprint (Registering Blueprints) เข้ากับแอปพลิเคชันหลัก
# =========================================================================
# ผูกกลุ่มเส้นทาง API แต่ละโมดูลเข้ากับ Flask Application หลัก เพื่อจัดระเบียบโครงสร้างโค้ดให้เป็นระเบียบและดูแลรักษาง่าย
app.register_blueprint(login_bp)
app.register_blueprint(verify_bp)
app.register_blueprint(register_bp)
app.register_blueprint(category_bp)
app.register_blueprint(item_bp) 
app.register_blueprint(notifications_bp)
app.register_blueprint(users_bp)
app.register_blueprint(exchanges_bp) 
app.register_blueprint(report_bp) 
app.register_blueprint(admin_bp, url_prefix='/api/admin') # กำหนด URL Prefix พิเศษสำหรับกลุ่ม API ของผู้ดูแลระบบ (Admin Panel)
app.register_blueprint(match_bp)


# =========================================================================
# จุดเริ่มต้นการรันเซิร์ฟเวอร์แอปพลิเคชัน (Application Entry Point)
# =========================================================================
if __name__ == '__main__':
    # ดึงค่า Port จาก Render ถ้าไม่มี (รันในเครื่อง) ให้ใช้ 5000
    port = int(os.environ.get("PORT", 5000))
    
    # บังคับ host='0.0.0.0' เพื่อให้ระบบภายนอกหรือ Cloud สามารถชี้เข้ามาได้
    app.run(host='0.0.0.0', port=port, debug=False)