from flask import Blueprint, request, jsonify
from config import Config
from services.whatsapp_service import (
    process_incoming_message,
    get_business_for_whatsapp,
    send_whatsapp_message,
)

whatsapp_bp = Blueprint("whatsapp", __name__)


@whatsapp_bp.route("/webhook", methods=["GET"])
def verify():
    """Meta webhook verification (hub.challenge handshake)."""
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == Config.META_WEBHOOK_VERIFY_TOKEN:
        return challenge, 200
    return "Forbidden", 403


@whatsapp_bp.route("/webhook", methods=["POST"])
def webhook():
    """Handle incoming WhatsApp messages from Meta Cloud API."""
    data = request.get_json(silent=True)

    if not data or data.get("object") != "whatsapp_business_account":
        return jsonify({"status": "ok"}), 200

    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})

            # Skip status updates (delivery receipts etc.)
            if value.get("statuses"):
                continue

            phone_number_id = value.get("metadata", {}).get("phone_number_id", "")

            for message in value.get("messages", []):
                msg_type = message.get("type")

                # Only handle text messages
                if msg_type != "text":
                    continue

                from_number = message.get("from", "")
                message_text = message.get("text", {}).get("body", "").strip()

                if not message_text or not from_number:
                    continue

                business = get_business_for_whatsapp(phone_number_id)
                if not business:
                    print(f"[Webhook] No business found for phone_number_id: {phone_number_id}")
                    continue

                reply, _ = process_incoming_message(
                    business_id=business["id"],
                    customer_phone=from_number,
                    message_text=message_text,
                )

                try:
                    send_whatsapp_message(
                        to=from_number,
                        body=reply,
                        phone_number_id=phone_number_id,
                        access_token=business.get("meta_access_token", ""),
                    )
                except Exception as e:
                    print(f"[Meta API Error] Failed to send message: {e}")

    return jsonify({"status": "ok"}), 200


@whatsapp_bp.route("/status/<business_id>", methods=["GET"])
def status(business_id):
    """Get bot status for a business."""
    from services.business_service import get_business
    business = get_business(business_id)

    if not business:
        return jsonify({"error": "Business not found"}), 404

    return jsonify({
        "active": business.get("bot_active", False),
        "whatsapp_configured": business.get("whatsapp_configured", False),
        "whatsapp_number": business.get("whatsapp_number", ""),
        "phone_number_id": business.get("whatsapp_phone_number_id", ""),
        "business_name": business.get("name", ""),
    })


@whatsapp_bp.route("/test-message", methods=["POST"])
def test_message():
    """Test endpoint — simulate a WhatsApp message without a real webhook."""
    data = request.get_json()
    business_id = data.get("business_id")
    message = data.get("message", "")
    phone = data.get("phone", "+910000000000")
    language = data.get("language")

    if not business_id or not message:
        return jsonify({"error": "business_id and message required"}), 400

    reply, media_url = process_incoming_message(business_id, phone, message, language)
    return jsonify({"reply": reply, "media_url": media_url})
