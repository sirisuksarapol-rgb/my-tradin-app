import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.login import login_bp
from routes.verify import verify_bp
from routes.register import register_bp
from routes.category import category_bp # นำเข้า Blueprint ของ category
from routes.item import item_bp # นำเข้า Blueprint ของ item       
# app.py
app = Flask(__name__) # ไม่ต้องใส่ static_folder ในช่วง dev
CORS(app) 

# ==========================================
# 1. ตั้งค่าสำหรับเก็บไฟล์รูปภาพ (ต้องทำก่อนสร้าง Route)
# ==========================================
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# เช็คว่ามีโฟลเดอร์ uploads ในโปรเจกต์หรือยัง ถ้ายังไม่มีระบบจะสร้างให้ทันที
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# ==========================================
# 2. เปิดให้ React สามารถเข้าถึงรูปภาพได้
# ==========================================
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ==========================================
# 3. ลงทะเบียนระบบต่างๆ (Blueprints)
# ==========================================
app.register_blueprint(login_bp)
app.register_blueprint(verify_bp)
app.register_blueprint(register_bp)
app.register_blueprint(category_bp) # ลงทะเบียน Blueprint ของ category
app.register_blueprint(item_bp) # ลงทะเบียน Blueprint ของ item

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)