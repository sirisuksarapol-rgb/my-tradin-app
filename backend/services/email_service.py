import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_verify_email(to_email, code):
    body = f"""
รหัสยืนยันอีเมลของคุณคือ: {code}

รหัสมีอายุ 30 นาที
หากคุณไม่ได้สมัคร กรุณาไม่ต้องดำเนินการใด ๆ
"""

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = "ยืนยันอีเมล"
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
