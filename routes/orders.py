from flask import Blueprint, request, jsonify
from services.order_service import (
    get_orders,
    get_order,
    update_order_status,
    get_dashboard_stats,
)

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/<business_id>", methods=["GET"])
def list_orders(business_id):
    """List orders for a business."""
    status_filter = request.args.get("status")
    limit = request.args.get("limit", 50, type=int)
    orders = get_orders(business_id, status=status_filter, limit=limit)
    return jsonify({"orders": orders})


@orders_bp.route("/detail/<order_id>", methods=["GET"])
def order_detail(order_id):
    """Get a single order."""
    order = get_order(order_id)
    if order:
        return jsonify({"order": order})
    return jsonify({"error": "Order not found"}), 404


@orders_bp.route("/<order_id>/status", methods=["PUT"])
def change_status(order_id):
    """Update order status."""
    data = request.get_json()
    new_status = data.get("status")
    valid = ["pending", "confirmed", "preparing", "delivered", "cancelled"]
    if new_status not in valid:
        return jsonify({"error": f"Status must be one of {valid}"}), 400

    order = update_order_status(order_id, new_status)
    if order:
        return jsonify({"success": True, "order": order})
    return jsonify({"error": "Order not found"}), 404


@orders_bp.route("/dashboard/<business_id>", methods=["GET"])
def dashboard(business_id):
    """Get dashboard analytics."""
    stats = get_dashboard_stats(business_id)
    return jsonify(stats)
