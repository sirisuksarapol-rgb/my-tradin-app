import os
import requests
from dotenv import load_dotenv

# โหลดตัวแปรสภาพแวดล้อม (Environment Variables) จากไฟล์ .env (กรณีรันโลคอล)
load_dotenv()


# ==========================================
# 1. ฟังก์ชันกลางสำหรับส่งอีเมลผ่าน Brevo API
# ==========================================
def send_notification_email(to_email, subject, body_text, custom_html=None):
    """
    ฟังก์ชันตัวช่วย: ส่งอีเมลผ่าน Brevo REST API (ผ่าน HTTP Request ป้องกันโดน Render บล็อกพอร์ต)
    """
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("EMAIL_USER", "sirisuksarapol@gmail.com")  # อีเมลผู้ส่งที่คุณยืนยันใน Brevo
    sender_name = os.getenv("SENDER_NAME", "Tradin System")
    
    if not to_email or not api_key:
        print("⚠️ ขาดข้อมูลตั้งค่า BREVO_API_KEY หรือไม่ได้ระบุอีเมลผู้รับ")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    html_content = custom_html if custom_html else f"<p>{body_text.replace(chr(10), '<br>')}</p>"

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201, 202]:
            print(f"✅ ส่งอีเมลผ่าน Brevo API สำเร็จไปยัง {to_email}")
            return True
        else:
            print(f"❌ เกิดข้อผิดพลาดจาก Brevo API ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Brevo API: {str(e)}")
        return False


# ==========================================
# 2. ฟังก์ชันส่งอีเมลยืนยันการสมัครสมาชิก (VERIFICATION EMAIL)
# ==========================================
def send_verify_email(to_email, code):
    subject = "[Tradin] รหัสยืนยันการสมัครสมาชิก"
    body = f"เรียน ผู้ใช้งาน,\n\nยินดีต้อนรับสู่ Tradin! รหัส OTP สำหรับยืนยันอีเมลของคุณคือ {code}"
    
    custom_html = f"""
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; color: #2c3e50; }}
            .email-container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
            .email-header {{ background: #ffffff; padding: 28px 30px; text-align: center; border-bottom: 1px solid #edf2f7; }}
            .email-body {{ padding: 40px 35px; font-size: 16px; line-height: 1.8; color: #34495e; text-align: center; }}
            .otp-box {{ background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #10b981; border-radius: 12px; padding: 20px; margin: 30px auto; max-width: 280px; }}
            .otp-code {{ font-size: 36px; font-weight: 700; color: #065f46; letter-spacing: 6px; }}
            .email-footer {{ background-color: #f8fafc; padding: 24px 30px; text-align: center; color: #8c9ba5; font-size: 13px; border-top: 1px solid #edf2f7; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h2 style="color: #10b981; margin: 0;">Tradin System</h2>
            </div>
            <div class="email-body">
                <h2 style="color: #1f2937; margin-top: 0;">ยืนยันอีเมลสมัครสมาชิก</h2>
                <p>เรียน ผู้ใช้งาน,<br>ขอบคุณที่สมัครสมาชิกกับ Tradin กรุณาใช้รหัส OTP ด้านล่างนี้เพื่อยืนยันตัวตนของคุณ (รหัสมีอายุ 30 นาที):</p>
                <div class="otp-box">
                    <div class="otp-code">{code}</div>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">หากคุณไม่ได้ทำการสมัครสมาชิก สามารถเพิกเฉยต่ออีเมลนี้ได้</p>
            </div>
            <div class="email-footer">
                <p style="margin: 0;">© 2026 <strong>Tradin</strong> — สังคมแห่งการแบ่งปันสิ่งของ</p>
            </div>
        </div>
    </body>
    </html>
    """
    send_notification_email(to_email, subject, body, custom_html=custom_html)


# ==========================================
# 3. ฟังก์ชันส่งอีเมลรหัสความปลอดภัยการแลกเปลี่ยน (EXCHANGE VERIFY EMAIL)
# ==========================================
def send_exchange_verify_email(to_email, code):
    subject = "[Tradin] รหัสความปลอดภัยเพื่อเข้าถึงข้อมูลการติดต่อ"
    body = f"รหัสความปลอดภัย (OTP) สำหรับเปิดดูเบอร์โทรศัพท์คือ: {code}"
    
    custom_html = f"""
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; color: #2c3e50; }}
            .email-container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
            .email-header {{ background: #ffffff; padding: 28px 30px; text-align: center; border-bottom: 1px solid #edf2f7; }}
            .email-body {{ padding: 40px 35px; font-size: 16px; line-height: 1.8; color: #34495e; text-align: center; }}
            .otp-box {{ background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; margin: 30px auto; max-width: 280px; }}
            .otp-code {{ font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 6px; }}
            .email-footer {{ background-color: #f8fafc; padding: 24px 30px; text-align: center; color: #8c9ba5; font-size: 13px; border-top: 1px solid #edf2f7; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h2 style="color: #3b82f6; margin: 0;">Tradin System</h2>
            </div>
            <div class="email-body">
                <h2 style="color: #1f2937; margin-top: 0;">รหัสความปลอดภัยการแลกเปลี่ยน</h2>
                <p>คุณได้ขอรหัสความปลอดภัย (OTP) สำหรับเปิดดูข้อมูลการติดต่อ (เบอร์โทรศัพท์) ของคู่แลกเปลี่ยน กรุณาใช้รหัสนี้ยืนยันในระบบ:</p>
                <div class="otp-box">
                    <div class="otp-code">{code}</div>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">เพื่อความปลอดภัย ห้ามเปิดเผยรหัสนี้ให้แก่ผู้อื่น</p>
            </div>
            <div class="email-footer">
                <p style="margin: 0;">© 2026 <strong>Tradin</strong> — สังคมแห่งการแบ่งปันสิ่งของ</p>
            </div>
        </div>
    </body>
    </html>
    """
    send_notification_email(to_email, subject, body, custom_html=custom_html)