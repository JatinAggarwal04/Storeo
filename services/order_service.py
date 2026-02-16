from supabase_client import get_supabase


def get_orders(business_id: str, status: str = None, limit: int = 50) -> list:
    """Get orders for a business."""
    sb = get_supabase()
    query = sb.table("orders").select("*").eq("business_id", business_id)
    if status:
        query = query.eq("status", status)
    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data or []


def get_order(order_id: str) -> dict:
    """Get a single order."""
    sb = get_supabase()
    result = sb.table("orders").select("*").eq("id", order_id).execute()
    return result.data[0] if result.data else None


def create_order(data: dict) -> dict:
    """Create a new order."""
    sb = get_supabase()
    order = {
        "business_id": data["business_id"],
        "customer_name": data.get("customer_name", ""),
        "customer_phone": data["customer_phone"],
        "customer_address": data.get("customer_address", ""),
        "items": data.get("items", []),
        "total": data.get("total", 0),
        "status": "pending",
        "notes": data.get("notes", ""),
    }
    result = sb.table("orders").insert(order).execute()
    return result.data[0] if result.data else None


def update_order_status(order_id: str, status: str) -> dict:
    """Update order status."""
    sb = get_supabase()
    result = (
        sb.table("orders")
        .update({"status": status})
        .eq("id", order_id)
        .execute()
    )
    return result.data[0] if result.data else None


def get_dashboard_stats(business_id: str) -> dict:
    """Get dashboard analytics for a business."""
    sb = get_supabase()

    # Total orders
    orders_result = sb.table("orders").select("id, status, total, created_at").eq("business_id", business_id).execute()
    orders = orders_result.data or []

    # Unique customers
    customers_result = (
        sb.table("orders")
        .select("customer_phone")
        .eq("business_id", business_id)
        .execute()
    )
    unique_phones = set(c["customer_phone"] for c in (customers_result.data or []))

    # Conversations
    convos_result = (
        sb.table("conversations")
        .select("id")
        .eq("business_id", business_id)
        .execute()
    )

    # Products count
    products_result = (
        sb.table("products")
        .select("id")
        .eq("business_id", business_id)
        .execute()
    )

    # Daily stats
    from datetime import datetime
    today = datetime.utcnow().date()
    today_orders = [o for o in orders if datetime.fromisoformat(o["created_at"].replace('Z', '+00:00')).date() == today]
    today_count = len(today_orders)
    today_revenue = sum(float(o.get("total") or 0) for o in today_orders)
    
    # Calculate total revenue
    total_revenue = sum(float(o.get("total") or 0) for o in orders)

    # Calculate status breakdown
    status_counts = {}
    for o in orders:
        s = o.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    return {
        "total_orders": len(orders),
        "total_customers": len(unique_phones),
        "total_conversations": len(convos_result.data or []),
        "total_products": len(products_result.data or []),
        "total_revenue": total_revenue,
        "order_status_breakdown": status_counts,
        "today_orders": today_count,
        "today_revenue": today_revenue,
    }
