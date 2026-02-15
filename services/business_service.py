import anthropic
from config import Config
from supabase_client import get_supabase

ONBOARDING_SYSTEM_PROMPT = """You are a friendly business setup assistant for an Indian SME WhatsApp Bot Builder platform. 
Your job is to help small business owners set up their business profile through a natural conversation.

You need to collect the following information step by step (ask ONE question at a time):
1. What kind of business they run (e.g., crockery shop, kirana store, bakery, clothing store)
2. Business name
3. Location (city/area) 
4. Brief description of what they sell
5. Which languages their customers speak (from: English, Hindi, Punjabi, Kannada — they can pick multiple)
6. Whether they already have a WhatsApp Business account

IMPORTANT RULES:
- Be warm, friendly, and use simple language
- If the user responds in Hindi or another language, respond in the same language
- Keep responses SHORT (2-3 sentences max)
- After collecting ALL info, respond with a JSON summary wrapped in ```json``` code block like:
```json
{
    "complete": true,
    "business_type": "...",
    "business_name": "...",
    "location": "...",
    "description": "...",
    "languages": ["English", "Hindi"],
    "has_whatsapp_business": true/false
}
```
- Do NOT return the JSON until ALL information is collected
- If user hasn't answered something, ask for it
- Be encouraging — this is for small business owners who may not be tech-savvy
"""

WHATSAPP_SETUP_GUIDE = """
Great! Here's how to set up WhatsApp Business:

1. **Download** WhatsApp Business app from Play Store / App Store
2. **Register** with your business phone number
3. **Set up your profile**: Add business name, category, description, address
4. **Business hours**: Set your operating hours
5. **Catalog**: You can skip this — our bot will handle product queries!

Once done, you'll connect it to our platform through Twilio to automate responses.

For now, we'll use a sandbox number for testing. You can upgrade to your own WhatsApp Business number later.
"""


def chat_with_ai(messages: list, business_id: str = None) -> dict:
    """Process a chat message for business onboarding."""
    client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)

    claude_messages = []
    for msg in messages:
        claude_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=ONBOARDING_SYSTEM_PROMPT,
        messages=claude_messages,
    )

    assistant_text = response.content[0].text

    # Check if onboarding is complete (AI returned JSON)
    import json
    import re
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', assistant_text, re.DOTALL)

    result = {
        "reply": assistant_text,
        "complete": False,
        "business_data": None,
    }

    if json_match:
        try:
            data = json.loads(json_match.group(1))
            if data.get("complete"):
                result["complete"] = True
                result["business_data"] = data
                # Clean the reply to remove JSON block
                result["reply"] = re.sub(
                    r'```json\s*\{.*?\}\s*```', '', assistant_text, flags=re.DOTALL
                ).strip()
                if not result["reply"]:
                    result["reply"] = (
                        f"Perfect! Here's your business profile:\n\n"
                        f"🏪 **{data.get('business_name', '')}**\n"
                        f"📍 {data.get('location', '')}\n"
                        f"🏷️ {data.get('business_type', '')}\n"
                        f"📝 {data.get('description', '')}\n"
                        f"🌐 Languages: {', '.join(data.get('languages', []))}\n\n"
                        f"Shall I save this and set up your WhatsApp bot?"
                    )
        except json.JSONDecodeError:
            pass

    return result


def save_business(data: dict) -> dict:
    """Save a business profile to Supabase."""
    sb = get_supabase()

    business_record = {
        "name": data.get("business_name", ""),
        "type": data.get("business_type", ""),
        "location": data.get("location", ""),
        "description": data.get("description", ""),
        "languages": data.get("languages", ["English"]),
        "whatsapp_configured": False,
        "onboarding_complete": True,
        "bot_tone": "friendly",
        "auto_greet": True,
        "greeting_message": "",
        "business_hours": {"open": "09:00", "close": "21:00"},
        "feature_requests": [],
    }

    result = sb.table("businesses").insert(business_record).execute()
    return result.data[0] if result.data else None


def get_business(business_id: str) -> dict:
    """Get a single business by ID."""
    sb = get_supabase()
    result = sb.table("businesses").select("*").eq("id", business_id).execute()
    return result.data[0] if result.data else None


def list_businesses() -> list:
    """List all businesses."""
    sb = get_supabase()
    result = sb.table("businesses").select("*").order("created_at", desc=True).execute()
    return result.data or []


def update_business(business_id: str, data: dict) -> dict:
    """Update a business profile."""
    sb = get_supabase()
    result = sb.table("businesses").update(data).eq("id", business_id).execute()
    return result.data[0] if result.data else None
