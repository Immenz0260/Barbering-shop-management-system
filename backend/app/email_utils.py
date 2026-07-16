import os
import resend
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

FRONTEND_URL = os.getenv("FRONTEND_URL")

def send_reset_email(to_email: str, reset_token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    resend.Emails.send({
        "from": "ESARPS Premium Cuts <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Reset your password",
        "html": f"<p>Click below to reset your password:</p><p><a href='{reset_link}'>{reset_link}</a></p><p>This link expires in 30 minutes.</p>"
    })

def send_signup_confirmation_email(to_email: str, name: str):
    resend.Emails.send({
        "from": "ESARPS Premium Cuts <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Welcome to ESARPS Premium Cuts",
        "html": f"<p>Hi {name}, your account was created successfully. Welcome aboard!</p>"
    })