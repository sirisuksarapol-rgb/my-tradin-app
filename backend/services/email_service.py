import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# ========================================================
# 1. สำหรับส่ง OTP ยืนยันการสมัครสมาชิก (Sign Up / Register)
# ========================================================
def send_verify_email(to_email, code):
    subject = "[Tradin] รหัสยืนยันการสมัครสมาชิก"
    body = f"""
สวัสดีครับ/ค่ะ,

รหัส OTP สำหรับยืนยันอีเมลเพื่อสมัครเข้าใช้งานของคุณคือ: {code}

* รหัสนี้มีอายุการใช้งาน 30 นาที
* หากคุณไม่ได้เป็นผู้ขอรหัสสมัครสมาชิก กรุณาปล่อยผ่านอีเมลฉบับนี้

ขอบคุณที่ร่วมเป็นส่วนหนึ่งกับ Tradin สังคมแห่งการแบ่งปัน
"""
    _send_smtp_email(to_email, subject, body)


# ========================================================
# 2. สำหรับส่ง OTP รหัสความปลอดภัย เพื่อดูข้อมูลติดต่อคู่แลกเปลี่ยน
# ========================================================
def send_exchange_verify_email(to_email, code):
    subject = "[Tradin] รหัสความปลอดภัยเพื่อเข้าถึงข้อมูลการติดต่อ"
    body = f"""
สวัสดีครับ/ค่ะ,

คุณมีรายการแลกเปลี่ยนที่ได้รับการตอบรับเรียบร้อยแล้ว!
รหัสความปลอดภัย (OTP) สำหรับใช้ยืนยันเพื่อเปิดดูเบอร์โทรศัพท์และข้อมูลติดต่อคือ: {code}

* รหัสนี้มีอายุการใช้งาน 30 นาที
* เพื่อความปลอดภัยส่วนบุคคล กรุณาอย่าส่งต่อรหัสนี้ให้แก่ผู้อื่น

ขอให้มีความสุขกับการแลกเปลี่ยนสิ่งดีๆ ร่วมกันครับ/ค่ะ,
ทีมงาน Tradin
"""
    # หมายเหตุ: สามารถเปลี่ยนชื่อฟังก์ชันกลับเป็น send_verify_email_phon ได้ตามโครงสร้างเดิมของคุณ
    _send_smtp_email(to_email, subject, body)


# ========================================================
# ฟังก์ชันส่วนกลาง (Helper) สำหรับทำหน้าที่เชื่อมต่อ SMTP และส่งออก
# ========================================================
def _send_smtp_email(to_email, subject, body):
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"❌ ไม่สามารถส่งอีเมลไปยัง {to_email} ได้เนื่องจาก: {str(e)}")
        raise e