from flask import Blueprint, request, jsonify
from services.whatsapp_service import (
    process_incoming_message,
    get_business_for_whatsapp,
    send_whatsapp_message,
)

whatsapp_bp = Blueprint("whatsapp", __name__)


@whatsapp_bp.route("/webhook", methods=["POST"])
def webhook():
    """Handle incoming WhatsApp messages from Twilio."""
    # Twilio sends form data
    incoming_msg = request.form.get("Body", "").strip()
    from_number = request.form.get("From", "")  # e.g. "whatsapp:+919876543210"
    to_number = request.form.get("To", "")

    if not incoming_msg or not from_number:
        return jsonify({"error": "Invalid webhook data"}), 400

    # Find the business this message is for
    business = get_business_for_whatsapp(to_number)
    if not business:
        return "<Response></Response>", 200

    # Process and generate reply
    reply = process_incoming_message(
        business_id=business["id"],
        customer_phone=from_number,
        message_text=incoming_msg,
    )

    # Send reply via Twilio
    try:
        send_whatsapp_message(from_number, reply)
    except Exception as e:
        print(f"[Twilio Error] Failed to send message: {e}")

    # Return empty TwiML (we send reply manually via API)
    return "<Response></Response>", 200


@whatsapp_bp.route("/webhook", methods=["GET"])
def verify():
    """Webhook verification endpoint."""
    return "WhatsApp webhook is active", 200


@whatsapp_bp.route("/status/<business_id>", methods=["GET"])
def status(business_id):
    """Get bot status for a business."""
    from services.business_service import get_business
    business = get_business(business_id)

    if not business:
        return jsonify({"error": "Business not found"}), 404

    return jsonify({
        "active": business.get("onboarding_complete", False),
        "whatsapp_configured": business.get("whatsapp_configured", False),
        "whatsapp_number": business.get("whatsapp_number", ""),
        "business_name": business.get("name", ""),
    })


@whatsapp_bp.route("/test-message", methods=["POST"])
def test_message():
    """Test endpoint — simulate a WhatsApp message without Twilio."""
    data = request.get_json()
    business_id = data.get("business_id")
    message = data.get("message", "")
    phone = data.get("phone", "whatsapp:+910000000000")

    if not business_id or not message:
        return jsonify({"error": "business_id and message required"}), 400

    reply = process_incoming_message(business_id, phone, message)
    return jsonify({"reply": reply})
