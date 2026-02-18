from flask import Blueprint, request, jsonify
from services.business_service import (
    chat_with_ai,
    save_business,
    get_business,
    list_businesses,
    update_business,
    generate_system_prompt,
    exchange_meta_code,
)
from services.inventory_service import get_products

business_bp = Blueprint("business", __name__)


@business_bp.route("/chat", methods=["POST"])
def chat():
    """Conversational business onboarding endpoint."""
    data = request.get_json()
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "messages array required"}), 400

    try:
        result = chat_with_ai(messages)
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 500
    return jsonify(result)


@business_bp.route("/create", methods=["POST"])
def create():
    """Save finalized business profile."""
    data = request.get_json()
    if not data or not data.get("business_name"):
        return jsonify({"error": "business_name is required"}), 400

    business = save_business(data)
    if business:
        return jsonify({"success": True, "business": business}), 201
    return jsonify({"error": "Failed to create business"}), 500


@business_bp.route("/list", methods=["GET"])
def list_all():
    """List businesses for the authenticated user."""
    user_id = request.args.get("user_id")
    businesses = list_businesses(user_id)
    return jsonify({"businesses": businesses})


@business_bp.route("/<uuid:business_id>", methods=["GET"])
def get_one(business_id):
    """Get a single business."""
    business = get_business(str(business_id))
    if business:
        return jsonify({"business": business})
    return jsonify({"error": "Business not found"}), 404


@business_bp.route("/<uuid:business_id>", methods=["PUT"])
def update(business_id):
    """Update a business."""
    data = request.get_json()
    business = update_business(str(business_id), data)
    if business:
        return jsonify({"success": True, "business": business})
    return jsonify({"error": "Business not found"}), 404


@business_bp.route("/<uuid:business_id>/connect-whatsapp", methods=["POST"])
def connect_whatsapp(business_id):
    """Exchange Meta OAuth code for access token and store WhatsApp credentials."""
    data = request.get_json()
    code = data.get("code")
    if not code:
        return jsonify({"error": "code is required"}), 400

    try:
        meta_data = exchange_meta_code(code)
    except Exception as e:
        return jsonify({"error": f"Meta OAuth error: {str(e)}"}), 500

    updated = update_business(str(business_id), {
        "whatsapp_phone_number_id": meta_data.get("phone_number_id"),
        "meta_access_token": meta_data.get("access_token"),
        "meta_waba_id": meta_data.get("waba_id"),
        "whatsapp_configured": True,
    })
    if updated:
        return jsonify({"success": True, "business": updated})
    return jsonify({"error": "Failed to update business"}), 500


@business_bp.route("/<uuid:business_id>/launch", methods=["POST"])
def launch(business_id):
    """Generate AI system prompt from catalog and activate the bot."""
    business = get_business(str(business_id))
    if not business:
        return jsonify({"error": "Business not found"}), 404

    products = get_products(str(business_id))

    try:
        system_prompt = generate_system_prompt(business, products)
    except Exception as e:
        return jsonify({"error": f"AI generation error: {str(e)}"}), 500

    updated = update_business(str(business_id), {
        "system_prompt": system_prompt,
        "bot_active": True,
    })
    if updated:
        return jsonify({"success": True, "system_prompt": system_prompt})
    return jsonify({"error": "Failed to activate bot"}), 500
