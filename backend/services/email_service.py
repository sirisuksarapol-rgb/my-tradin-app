import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_notification_email(to_email, subject, body_text):
    """ฟังก์ชันกลางสำหรับส่งอีเมลแจ้งเตือนทุกสถานะ"""
    if not to_email or not EMAIL_USER:
        return

    msg = MIMEText(body_text, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        print(f"❌ ไม่สามารถส่งอีเมลไปยัง {to_email} ได้เนื่องจาก: {str(e)}")

def send_verify_email(to_email, code):
    subject = "[Tradin] รหัสยืนยันการสมัครสมาชิก"
    body = f"รหัส OTP สำหรับยืนยันอีเมลของคุณคือ: {code} (มีอายุ 30 นาที)"
    send_notification_email(to_email, subject, body)

def send_exchange_verify_email(to_email, code):
    subject = "[Tradin] รหัสความปลอดภัยเพื่อเข้าถึงข้อมูลการติดต่อ"
    body = f"รหัสความปลอดภัย (OTP) สำหรับเปิดดูเบอร์โทรศัพท์คือ: {code} "
    send_notification_email(to_email, subject, body)