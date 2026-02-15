import json
import anthropic
from config import Config
from supabase_client import get_supabase
from services.language_service import detect_language, get_language_instruction
from services.inventory_service import search_products
from services.order_service import create_order
from twilio.rest import Client as TwilioClient


def get_twilio_client():
    """Get Twilio client."""
    return TwilioClient(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)


def send_whatsapp_message(to: str, body: str):
    """Send a WhatsApp message via Twilio."""
    client = get_twilio_client()
    message = client.messages.create(
        from_=Config.TWILIO_WHATSAPP_NUMBER,
        body=body,
        to=to,
    )
    return message.sid


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


def get_business_for_whatsapp(whatsapp_number: str = None) -> dict:
    """Get the business associated with a WhatsApp number.
    For now (single-tenant / sandbox), return the first business.
    """
    sb = get_supabase()
    if whatsapp_number:
        result = (
            sb.table("businesses")
            .select("*")
            .eq("whatsapp_number", whatsapp_number)
            .execute()
        )
        if result.data:
            return result.data[0]

    # Fallback: return the most recent business (sandbox mode)
    result = (
        sb.table("businesses")
        .select("*")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def build_bot_system_prompt(business: dict, inventory: list, language: str) -> str:
    """Build the system prompt for the WhatsApp bot."""
    lang_instruction = get_language_instruction(language)

    inventory_text = ""
    if inventory:
        items = []
        for p in inventory[:50]:  # Limit to 50 products in context
            cat = p.get("categories", {}).get("name", "General") if p.get("categories") else "General"
            price_str = f"₹{p['price']}" if p.get("price") else "Price not set"
            stock_str = "In stock" if p.get("in_stock", True) else "Out of stock"
            items.append(f"- {p['name']} [{cat}] — {price_str} ({stock_str}): {p.get('description', '')}")
        inventory_text = "\n".join(items)
    else:
        inventory_text = "No products in inventory yet."

    return f"""You are a helpful WhatsApp assistant for "{business['name']}", a {business['type']} located in {business.get('location', 'India')}.
{business.get('description', '')}

{lang_instruction}

AVAILABLE INVENTORY:
{inventory_text}

YOUR CAPABILITIES:
1. Answer product availability questions ("Do you have X?" → Check inventory)
2. Tell prices when asked
3. Take orders — collect: product name, quantity, customer name, delivery address
4. Answer general questions about the business

ORDER FLOW:
- When a customer wants to order, collect ALL details before confirming
- Once you have product, quantity, name, and address, create the order
- When ready to place the order, output a JSON block:
```json
{{"action": "create_order", "customer_name": "...", "items": [{{"product": "...", "quantity": N, "price": N}}], "address": "..."}}
```

RULES:
- Be warm, friendly, and conversational — NOT robotic
- Keep messages SHORT (under 200 words)
- Use emojis naturally 🙏
- If product not found, suggest similar items from inventory
- If customer asks in a different language, switch to that language
- Never make up products that aren't in the inventory
- For pricing, only quote prices from the inventory
- If price is not set, say "Please contact the shop for pricing"
"""


def process_incoming_message(business_id: str, customer_phone: str, message_text: str) -> str:
    """Process an incoming WhatsApp message and return a response."""
    # 1. Detect language
    language = detect_language(message_text)

    # 2. Get/create conversation
    convo = get_or_create_conversation(business_id, customer_phone)
    messages = convo.get("messages", []) or []

    # 3. Get business info
    sb = get_supabase()
    business = sb.table("businesses").select("*").eq("id", business_id).execute()
    business = business.data[0] if business.data else {}

    # 4. Get inventory
    inventory = search_products(business_id, "")  # Get all products

    # 5. Build system prompt
    system_prompt = build_bot_system_prompt(business, inventory, language)

    # 6. Prepare message history (keep last 20 messages for context)
    claude_messages = []
    recent_messages = messages[-20:] if len(messages) > 20 else messages
    for msg in recent_messages:
        claude_messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })

    # Add current message
    claude_messages.append({
        "role": "user",
        "content": message_text,
    })

    # 7. Call Claude
    client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        system=system_prompt,
        messages=claude_messages,
    )

    reply = response.content[0].text

    # 8. Check if bot wants to create an order
    import re
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', reply, re.DOTALL)
    if json_match:
        try:
            action_data = json.loads(json_match.group(1))
            if action_data.get("action") == "create_order":
                order = create_order({
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
                # Clean reply — remove JSON, add confirmation
                reply = re.sub(r'```json\s*\{.*?\}\s*```', '', reply, flags=re.DOTALL).strip()
                if not reply:
                    reply = "✅ Your order has been placed! We'll prepare it shortly. Thank you! 🙏"
        except (json.JSONDecodeError, Exception):
            pass

    # 9. Update conversation history
    messages.append({"role": "user", "content": message_text})
    messages.append({"role": "assistant", "content": reply})
    update_conversation(convo["id"], messages, language)

    return reply
