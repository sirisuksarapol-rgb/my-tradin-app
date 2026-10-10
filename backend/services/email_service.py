import logging
import os
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
logger = logging.getLogger(__name__)


def send_notification_email(to_email, subject, body_text, custom_html=None):
    if not to_email or not EMAIL_USER:
        return

    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    alternative = MIMEMultipart("alternative")
    alternative.attach(MIMEText(body_text, "plain", "utf-8"))

    if custom_html:
        html_content = custom_html
    else:
        html_content = f"""
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #f4f7fa;
                    margin: 0;
                    padding: 0;
                    color: #2c3e50;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e1e8ed;
                }}
                .email-header {{
                    background: #ffffff;
                    padding: 28px 30px;
                    text-align: center;
                    border-bottom: 1px solid #edf2f7;
                }}
                .email-header img {{
                    max-height: 50px;
                    width: auto;
                }}
                .email-body {{
                    padding: 40px 35px;
                    font-size: 16px;
                    line-height: 1.8;
                    color: #34495e;
                }}
                .email-footer {{
                    background-color: #f8fafc;
                    padding: 24px 30px;
                    text-align: center;
                    color: #8c9ba5;
                    font-size: 13px;
                    border-top: 1px solid #edf2f7;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <img src="cid:company_logo" alt="Tradin Logo">
                </div>
                <div class="email-body">
                    {body_text.replace(chr(10), "<br>")}
                </div>
                <div class="email-footer">
                    <p style="margin: 0;">© 2026 <strong>Tradin</strong> — สังคมแห่งการแบ่งปันสิ่งของ</p>
                </div>
            </div>
        </body>
        </html>
        """

    alternative.attach(MIMEText(html_content, "html", "utf-8"))
    msg.attach(alternative)

    logo_paths = [
        os.path.join(os.path.dirname(__file__), "..", "images", "image.png"),
        os.path.join(os.path.dirname(__file__), "images", "image.png"),
        "images/image.png"
    ]

    logo_path = next((path for path in logo_paths if os.path.exists(path)), None)

    if logo_path:
        try:
            with open(logo_path, "rb") as file:
                image = MIMEImage(file.read())

            image.add_header("Content-ID", "<company_logo>")
            image.add_header("Content-Disposition", "inline", filename="image.png")
            msg.attach(image)
        except Exception as e:
            logger.warning(f"ไม่สามารถแนบไฟล์โลโก้ในอีเมลได้: {str(e)}")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        logger.error(f"ไม่สามารถส่งอีเมลไปยัง {to_email} ได้: {str(e)}")


def send_verify_email(to_email, code):
    subject = "[Tradin] รหัสยืนยันการสมัครสมาชิก"
    body = (
        f"เรียน ผู้ใช้งาน,\n\n"
        f"ยินดีต้อนรับสู่ Tradin! รหัส OTP สำหรับยืนยันอีเมลของคุณคือ {code}"
    )

    html = f"""
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f4f7fa;
                margin: 0;
                padding: 0;
                color: #2c3e50;
            }}
            .email-container {{
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
                border: 1px solid #e1e8ed;
            }}
            .email-header {{
                padding: 28px 30px;
                text-align: center;
                border-bottom: 1px solid #edf2f7;
            }}
            .email-header img {{
                max-height: 50px;
                width: auto;
            }}
            .email-body {{
                padding: 40px 35px;
                font-size: 16px;
                line-height: 1.8;
                color: #34495e;
                text-align: center;
            }}
            .otp-box {{
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 2px dashed #10b981;
                border-radius: 12px;
                padding: 20px;
                margin: 30px auto;
                max-width: 280px;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 700;
                color: #065f46;
                letter-spacing: 6px;
            }}
            .email-footer {{
                background-color: #f8fafc;
                padding: 24px 30px;
                text-align: center;
                color: #8c9ba5;
                font-size: 13px;
                border-top: 1px solid #edf2f7;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <img src="cid:company_logo" alt="Tradin Logo">
            </div>

            <div class="email-body">
                <h2 style="color: #1f2937; margin-top: 0;">
                    ยืนยันอีเมลสมัครสมาชิก
                </h2>

                <p>
                    เรียน ผู้ใช้งาน,<br>
                    ขอบคุณที่สมัครสมาชิกกับ Tradin
                    กรุณาใช้รหัส OTP ด้านล่างนี้เพื่อยืนยันตัวตนของคุณ:
                </p>

                <div class="otp-box">
                    <div class="otp-code">{code}</div>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                    หากคุณไม่ได้ทำการสมัครสมาชิก สามารถเพิกเฉยต่ออีเมลนี้ได้
                </p>
            </div>

            <div class="email-footer">
                <p style="margin: 0;">
                    © 2026 <strong>Tradin</strong> — สังคมแห่งการแบ่งปันสิ่งของ
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    send_notification_email(to_email, subject, body, html)


def send_exchange_verify_email(to_email, code):
    subject = "[Tradin] รหัสความปลอดภัยเพื่อเข้าถึงข้อมูลการติดต่อ"
    body = f"รหัสความปลอดภัย (OTP) สำหรับเปิดดูเบอร์โทรศัพท์คือ: {code}"

    html = f"""
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f4f7fa;
                margin: 0;
                padding: 0;
                color: #2c3e50;
            }}
            .email-container {{
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
                border: 1px solid #e1e8ed;
            }}
            .email-header {{
                padding: 28px 30px;
                text-align: center;
                border-bottom: 1px solid #edf2f7;
            }}
            .email-header img {{
                max-height: 50px;
                width: auto;
            }}
            .email-body {{
                padding: 40px 35px;
                font-size: 16px;
                line-height: 1.8;
                color: #34495e;
                text-align: center;
            }}
            .otp-box {{
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border: 2px dashed #3b82f6;
                border-radius: 12px;
                padding: 20px;
                margin: 30px auto;
                max-width: 280px;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 700;
                color: #1e40af;
                letter-spacing: 6px;
            }}
            .email-footer {{
                background-color: #f8fafc;
                padding: 24px 30px;
                text-align: center;
                color: #8c9ba5;
                font-size: 13px;
                border-top: 1px solid #edf2f7;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <img src="cid:company_logo" alt="Tradin Logo">
            </div>

            <div class="email-body">
                <h2 style="color: #1f2937; margin-top: 0;">
                    รหัสความปลอดภัยการแลกเปลี่ยน
                </h2>

                <p>
                    คุณได้ขอรหัสความปลอดภัย (OTP)
                    สำหรับเปิดดูข้อมูลการติดต่อของคู่แลกเปลี่ยน
                    กรุณาใช้รหัสนี้ยืนยันในระบบ:
                </p>

                <div class="otp-box">
                    <div class="otp-code">{code}</div>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                    เพื่อความปลอดภัย ห้ามเปิดเผยรหัสนี้ให้แก่ผู้อื่น
                </p>
            </div>

            <div class="email-footer">
                <p style="margin: 0;">
                    © 2026 <strong>Tradin</strong> — สังคมแห่งการแบ่งปันสิ่งของ
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    send_notification_email(to_email, subject, body, html)