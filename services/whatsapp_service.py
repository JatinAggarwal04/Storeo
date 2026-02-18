import json
import re
import requests
import google.generativeai as genai
from config import Config
from supabase_client import get_supabase
from services.language_service import detect_language, get_language_instruction
from services.inventory_service import search_products
from services.order_service import create_order

genai.configure(api_key=Config.GEMINI_API_KEY)

META_GRAPH_URL = "https://graph.facebook.com/v19.0"


def send_whatsapp_message(to: str, body: str, phone_number_id: str, access_token: str) -> dict:
    """Send a WhatsApp message via Meta Cloud API."""
    url = f"{META_GRAPH_URL}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body},
    }
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


def get_or_create_conversation(business_id: str, customer_phone: str) -> dict:
    """Get existing conversation or create a new one."""
    sb = get_supabase()
    result = (
        sb.table("conversations")
        .select("*")
        .eq("business_id", business_id)
        .eq("customer_phone", customer_phone)
        .execute()
    )

    if result.data:
        return result.data[0]

    new_convo = {
        "business_id": business_id,
        "customer_phone": customer_phone,
        "messages": [],
        "language": "English",
    }
    result = sb.table("conversations").insert(new_convo).execute()
    return result.data[0] if result.data else new_convo


def update_conversation(convo_id: str, messages: list, language: str):
    """Update conversation messages."""
    sb = get_supabase()
    sb.table("conversations").update({
        "messages": messages,
        "language": language,
        "last_message_at": "now()",
    }).eq("id", convo_id).execute()


def get_business_for_whatsapp(phone_number_id: str) -> dict:
    """Get the business associated with a Meta phone_number_id."""
    if not phone_number_id:
        return None
    sb = get_supabase()
    result = (
        sb.table("businesses")
        .select("*")
        .eq("whatsapp_phone_number_id", phone_number_id)
        .execute()
    )
    return result.data[0] if result.data else None


def build_bot_system_prompt(business: dict, inventory: list, language: str) -> str:
    """Build a dynamic fallback system prompt (used when no stored prompt exists)."""
    lang_instruction = get_language_instruction(language)

    inventory_text = ""
    if inventory:
        items = []
        for p in inventory[:50]:
            cat = p.get("categories", {}).get("name", "General") if p.get("categories") else "General"
            price_str = f"₹{p['price']}" if p.get("price") else "Price not set"
            qty = p.get("stock_quantity", 0)
            stock_str = f"qty:{qty}" if qty else ("In stock" if p.get("in_stock", True) else "Out of stock")
            img_str = p.get("image_urls", [])[0] if p.get("image_urls") else ""
            items.append(f"- {p['name']} [{cat}] — {price_str} ({stock_str}) [Image: {img_str}]: {p.get('description', '')}")
        inventory_text = "\n".join(items)
    else:
        inventory_text = "No products in inventory yet."

    return f"""You are a helpful WhatsApp assistant for "{business['name']}", a {business['type']} located in {business.get('location', 'India')}.
{business.get('description', '')}

{lang_instruction}

AVAILABLE INVENTORY:
{inventory_text}

YOUR CAPABILITIES:
1. Answer product availability questions
2. Tell prices when asked
3. Take orders — collect: product name, quantity, customer name, delivery address
4. Answer general questions about the business

ORDER FLOW:
When ready to place an order, output exactly:
```json
{{"action": "create_order", "customer_name": "...", "items": [{{"product": "...", "quantity": N, "price": N}}], "address": "..."}}
```

RULES:
- Be warm, friendly, and conversational — NOT robotic
- Keep messages SHORT (under 200 words)
- Use emojis naturally 🙏
- Never make up products that aren't in the inventory
- Detect the customer's language and always reply in the same language
"""


def process_incoming_message(business_id: str, customer_phone: str, message_text: str, language: str = None) -> tuple:
    """Process an incoming WhatsApp message and return (reply_text, media_url)."""
    if not language:
        language = detect_language(message_text)

    convo = get_or_create_conversation(business_id, customer_phone)
    messages = convo.get("messages", []) or []

    sb = get_supabase()
    business_result = sb.table("businesses").select("*").eq("id", business_id).execute()
    business = business_result.data[0] if business_result.data else {}

    # Use stored system prompt if available, else build dynamically
    if business.get("system_prompt"):
        system_prompt = business["system_prompt"]
    else:
        inventory = search_products(business_id, "")
        system_prompt = build_bot_system_prompt(business, inventory, language)

    # Build Gemini conversation history (last 20 messages)
    recent_messages = messages[-20:] if len(messages) > 20 else messages
    history = []
    for msg in recent_messages:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt,
    )
    chat = model.start_chat(history=history)
    response = chat.send_message(message_text)
    reply = response.text

    # Parse order creation action
    media_url = None
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', reply, re.DOTALL)
    if json_match:
        try:
            action_data = json.loads(json_match.group(1))
            if action_data.get("action") == "create_order":
                create_order({
                    "business_id": business_id,
                    "customer_name": action_data.get("customer_name", ""),
                    "customer_phone": customer_phone,
                    "customer_address": action_data.get("address", ""),
                    "items": action_data.get("items", []),
                    "total": sum(
                        (i.get("price", 0) or 0) * (i.get("quantity", 1) or 1)
                        for i in action_data.get("items", [])
                    ),
                })
                reply = re.sub(r'```json\s*\{.*?\}\s*```', '', reply, flags=re.DOTALL).strip()
                if not reply:
                    reply = "✅ Your order has been placed! We'll prepare it shortly. Thank you! 🙏"
        except (json.JSONDecodeError, Exception):
            pass

    # Update conversation history
    messages.append({"role": "user", "content": message_text})
    messages.append({"role": "assistant", "content": reply})
    update_conversation(convo["id"], messages, language)

    return reply, media_url
