from flask import Blueprint, request, jsonify
from services.business_service import (
    chat_with_ai,
    save_business,
    get_business,
    list_businesses,
    update_business,
)

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
        error_msg = str(e)
        if "authentication" in error_msg.lower() or "api-key" in error_msg.lower() or "401" in error_msg:
            return jsonify({"error": "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in your .env file."}), 401
        return jsonify({"error": f"AI service error: {error_msg}"}), 500
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
    """List all businesses."""
    businesses = list_businesses()
    return jsonify({"businesses": businesses})


@business_bp.route("/<uuid:business_id>", methods=["GET"])
def get_one(business_id):
    """Get a single business."""
    # Convert UUID to str for Supabase
    business = get_business(str(business_id))
    if business:
        return jsonify({"business": business})
    return jsonify({"error": "Business not found"}), 404


@business_bp.route("/<uuid:business_id>", methods=["PUT"])
def update(business_id):
    """Update a business."""
    data = request.get_json()
    business = update_business(business_id, data)
    if business:
        return jsonify({"success": True, "business": business})
    return jsonify({"error": "Business not found"}), 404
