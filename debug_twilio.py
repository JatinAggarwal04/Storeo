import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

sid = os.getenv("TWILIO_ACCOUNT_SID")
token = os.getenv("TWILIO_AUTH_TOKEN")
from_num = os.getenv("TWILIO_WHATSAPP_NUMBER")
to_num = "whatsapp:+919855242000"  # User's number from logs

print(f"SID: {sid}")
# print(f"Token: {token}") 
print(f"From: {from_num}")
print(f"To: {to_num}")

try:
    client = Client(sid, token)
    message = client.messages.create(
        body="Hello from Stoereo Debugger! If you see this, credentials are correct.",
        from_=from_num,
        to=to_num
    )
    print(f"Success! Message SID: {message.sid}")
except Exception as e:
    print(f"Error sending message: {e}")
