import json
import re
import requests
import google.generativeai as genai
from config import Config
from supabase_client import get_supabase

genai.configure(api_key=Config.GEMINI_API_KEY)

ONBOARDING_SYSTEM_PROMPT = """You are a friendly business setup assistant for Storeo — an Indian SME WhatsApp Bot Builder platform.
Your job is to help small business owners set up their business profile through a natural conversation.

You need to collect the following information step by step (ask ONE question at a time):
1. What kind of business they run (e.g., crockery shop, kirana store, bakery, clothing store)
2. Business name
3. Location (city/area in India — could be a specific city or multiple states)
4. Brief description of what they sell
5. Which languages their customers speak (from: English, Hindi, Hinglish — they can pick multiple)

IMPORTANT RULES:
- Be warm, friendly, and use simple language
- If the user responds in Hindi or Hinglish, respond in the same language
- Keep responses SHORT (2-3 sentences max)
- After collecting ALL info, respond with a JSON summary wrapped in ```json``` code block like:
```json
{
    "complete": true,
    "business_type": "...",
    "business_name": "...",
    "location": "...",
    "description": "...",
    "languages": ["English", "Hindi"]
}
```
- Do NOT return the JSON until ALL information is collected
- If user hasn't answered something, ask for it
- Be encouraging — this is for small business owners who may not be tech-savvy
"""


def chat_with_ai(messages: list) -> dict:
    """Process a chat message for business onboarding using Gemini."""
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=ONBOARDING_SYSTEM_PROMPT,
    )

    # Build history for Gemini (all messages except the last user message)
    history = []
    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})

    # The last message is the one we're sending now
    last_message = messages[-1]["content"]

    chat = model.start_chat(history=history)
    response = chat.send_message(last_message)
    assistant_text = response.text

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
                result["reply"] = re.sub(
                    r'```json\s*\{.*?\}\s*```', '', assistant_text, flags=re.DOTALL
                ).strip()
                if not result["reply"]:
                    result["reply"] = (
                        f"Perfect! I've got all the details for **{data.get('business_name', '')}**. "
                        f"Shall I save this and set up your WhatsApp bot?"
                    )
        except json.JSONDecodeError:
            pass

    return result


def generate_system_prompt(business: dict, products: list) -> str:
    """Use Gemini to generate a rich, personalised WhatsApp bot system prompt."""
    catalog_lines = []
    for p in products[:80]:
        cat = ""
        if p.get("categories"):
            cat = f" [{p['categories'].get('name', '')}]"
        price = f"₹{p['price']}" if p.get("price") else "Price on request"
        qty = p.get("stock_quantity", 0)
        stock = f"qty:{qty}" if qty else ("in stock" if p.get("in_stock", True) else "out of stock")
        line = f"- {p['name']}{cat} | {price} | {stock}"
        if p.get("description"):
            line += f" | {p['description']}"
        img = p.get("image_urls", [])
        if img:
            line += f" | image:{img[0]}"
        catalog_lines.append(line)

    catalog_text = "\n".join(catalog_lines) if catalog_lines else "No products yet."
    languages = ", ".join(business.get("languages", ["English", "Hindi", "Hinglish"]))

    meta_prompt = f"""You are building a WhatsApp bot for a real Indian business. Write a complete system prompt for an AI assistant that will act as this shop's WhatsApp customer service agent.

BUSINESS DETAILS:
- Name: {business.get('name', '')}
- Type: {business.get('type', '')}
- Location: {business.get('location', '')}
- Description: {business.get('description', '')}
- Languages supported: {languages}
- Bot tone: {business.get('bot_tone', 'friendly')}

PRODUCT CATALOG:
{catalog_text}

Write a system prompt that:
1. Establishes the bot's identity as the shop's WhatsApp assistant
2. Lists all products with prices clearly so the bot can answer queries accurately
3. Defines the order flow: collect product name, quantity, customer name, and delivery address before confirming
4. When ready to place an order, output exactly this JSON block (and nothing else in that message):
   ```json
   {{"action": "create_order", "customer_name": "...", "items": [{{"product": "...", "quantity": N, "price": N}}], "address": "..."}}
   ```
5. Instructs the bot to detect the customer's language (English / Hindi Devanagari / Hinglish Roman script) and always reply in the same language/script
6. Keeps replies short and conversational (under 200 words), uses emojis naturally
7. Never invents products not in the catalog
8. Handles out-of-stock queries graciously, suggests alternatives

Output only the system prompt text. No preamble.
"""

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(meta_prompt)
    return response.text


def exchange_meta_code(code: str) -> dict:
    """Exchange a Meta OAuth code for an access token, then retrieve phone number ID."""
    token_resp = requests.get(
        "https://graph.facebook.com/v19.0/oauth/access_token",
        params={
            "client_id": Config.META_APP_ID,
            "client_secret": Config.META_APP_SECRET,
            "code": code,
        },
        timeout=10,
    )
    token_resp.raise_for_status()
    token_data = token_resp.json()
    access_token = token_data.get("access_token")

    if not access_token:
        raise ValueError(f"No access token in Meta response: {token_data}")

    # Get WhatsApp Business Account info
    waba_resp = requests.get(
        "https://graph.facebook.com/v19.0/me/businesses",
        params={"access_token": access_token, "fields": "id,name,whatsapp_business_accounts"},
        timeout=10,
    )
    waba_data = waba_resp.json()

    waba_id = None
    phone_number_id = None

    businesses_list = waba_data.get("data", [])
    if businesses_list:
        first_biz = businesses_list[0]
        waba_accounts = first_biz.get("whatsapp_business_accounts", {}).get("data", [])
        if waba_accounts:
            waba_id = waba_accounts[0].get("id")

    if waba_id:
        phones_resp = requests.get(
            f"https://graph.facebook.com/v19.0/{waba_id}/phone_numbers",
            params={"access_token": access_token, "fields": "id,display_phone_number"},
            timeout=10,
        )
        phones_data = phones_resp.json()
        phones = phones_data.get("data", [])
        if phones:
            phone_number_id = phones[0].get("id")

    return {
        "access_token": access_token,
        "waba_id": waba_id,
        "phone_number_id": phone_number_id,
    }


def save_business(data: dict) -> dict:
    """Save a business profile to Supabase."""
    sb = get_supabase()

    business_record = {
        "name": data.get("business_name", ""),
        "type": data.get("business_type", ""),
        "location": data.get("location", ""),
        "description": data.get("description", ""),
        "languages": data.get("languages", ["English", "Hindi"]),
        "whatsapp_configured": False,
        "bot_active": False,
        "bot_tone": "friendly",
        "auto_greet": True,
        "greeting_message": "",
        "business_hours": {"open": "09:00", "close": "21:00"},
        "feature_requests": [],
    }

    if data.get("user_id"):
        business_record["user_id"] = data["user_id"]

    result = sb.table("businesses").insert(business_record).execute()
    return result.data[0] if result.data else None


def get_business(business_id: str) -> dict:
    """Get a single business by ID."""
    sb = get_supabase()
    result = sb.table("businesses").select("*").eq("id", business_id).execute()
    return result.data[0] if result.data else None


def list_businesses(user_id: str = None) -> list:
    """List businesses, optionally filtered by user."""
    sb = get_supabase()
    query = sb.table("businesses").select("*").order("created_at", desc=True)
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.execute()
    return result.data or []


def update_business(business_id: str, data: dict) -> dict:
    """Update a business profile."""
    sb = get_supabase()
    result = sb.table("businesses").update(data).eq("id", str(business_id)).execute()
    return result.data[0] if result.data else None
