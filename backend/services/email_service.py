import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

# โหลดตัวแปรสภาพแวดล้อม (Environment Variables) จากไฟล์ .env
load_dotenv()

# ดึงข้อมูลบัญชีอีเมลและรหัสผ่านสำหรับส่งข้อความจากระบบ
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


# ==========================================
# 1. ฟังก์ชันกลางสำหรับส่งอีเมล (CORE EMAIL SENDING FUNCTION)
# ==========================================
def send_notification_email(to_email, subject, body_text):
    """
    ฟังก์ชันตัวช่วย (Helper Function): จัดการระบบส่งอีเมลกลางสำหรับแจ้งเตือนผู้ใช้งานทุกประเภทผ่าน SMTP Protocol
    
    รายละเอียดการทำงานเชิงลึก:
    - ตรวจสอบความถูกต้องว่ามีอีเมลผู้รับ (to_email) และอีเมลผู้ส่งในระบบ (EMAIL_USER) หรือไม่
    - สร้างโครงสร้างข้อความอีเมลด้วย MIMEText กำหนดชนิดเป็น plain text และเข้ารหัสภาษา UTF-8
    - กำหนดหัวข้ออีเมล (Subject), ผู้ส่ง (From) และผู้รับ (To)
    - เชื่อมต่อกับเซิร์ฟเวอร์ SMTP ของ Gmail ผ่านพอร์ตความปลอดภัย SSL (smtp.gmail.com:465)
    - ทำการยืนยันตัวตน (Login) ด้วยอีเมลและรหัสผ่านระบบ จากนั้นสั่งส่งข้อความผ่าน server.send_message(msg)
    - ดักจับข้อผิดพลาด (Exception Handling) เพื่อป้องกันระบบล่ม และพิมพ์ข้อความบันทึกข้อผิดพลาดใน Console หากส่งไม่สำเร็จ
    """
    if not to_email or not EMAIL_USER:
        return

    # สร้างโครงสร้างข้อความอีเมลรองรับการเข้ารหัส UTF-8
    msg = MIMEText(body_text, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    try:
        # เชื่อมต่อเซิร์ฟเวอร์ผ่านพอร์ต SSL และดำเนินการส่งอีเมล
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"❌ ไม่สามารถส่งอีเมลไปยัง {to_email} ได้เนื่องจาก: {str(e)}")


# ==========================================
# 2. ฟังก์ชันส่งอีเมลยืนยันการสมัครสมาชิก (VERIFICATION EMAIL)
# ==========================================
def send_verify_email(to_email, code):
    """
    ฟังก์ชันเฉพาะกิจ (Specific Service Function): ส่งรหัส OTP เพื่อยืนยันตัวตนในการสมัครสมาชิกใหม่
    
    รายละเอียดการทำงาน:
    - กำหนดหัวข้ออีเมล (Subject) เฉพาะสำหรับการสมัครสมาชิกของแพลตฟอร์ม Tradin
    - สร้างเนื้อหาข้อความ (Body) ที่ระบุรหัส OTP และกำหนดระยะเวลาหมดอายุชัดเจน (30 นาที)
    - เรียกใช้งานฟังก์ชันกลาง send_notification_email เพื่อส่งข้อความออกไปยังอีเมลของผู้ใช้งาน
    """
    subject = "[Tradin] รหัสยืนยันการสมัครสมาชิก"
    body = f"รหัส OTP สำหรับยืนยันอีเมลของคุณคือ: {code} (มีอายุ 30 นาที)"
    send_notification_email(to_email, subject, body)


# ==========================================
# 3. ฟังก์ชันส่งอีเมลรหัสความปลอดภัยการแลกเปลี่ยน (EXCHANGE VERIFY EMAIL)
# ==========================================
def send_exchange_verify_email(to_email, code):
    """
    ฟังก์ชันเฉพาะกิจ (Specific Service Function): ส่งรหัสความปลอดภัย (OTP) เพื่อเปิดดูข้อมูลการติดต่อ (เบอร์โทรศัพท์) ของคู่แลกเปลี่ยน
    
    รายละเอียดการทำงาน:
    - กำหนดหัวข้ออีเมล (Subject) สำหรับกระบวนการความปลอดภัยในการเข้าถึงข้อมูลการติดต่อ
    - สร้างเนื้อหาข้อความ (Body) ที่ระบุรหัสความปลอดภัยสำหรับยืนยันตัวตน
    - เรียกใช้งานฟังก์ชันกลาง send_notification_email เพื่อส่งข้อความออกไปยังอีเมลของผู้ใช้งาน
    """
    subject = "[Tradin] รหัสความปลอดภัยเพื่อเข้าถึงข้อมูลการติดต่อ"
    body = f"รหัสความปลอดภัย (OTP) สำหรับเปิดดูเบอร์โทรศัพท์คือ: {code}"
    send_notification_email(to_email, subject, body)