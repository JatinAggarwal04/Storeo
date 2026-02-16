from supabase_client import get_supabase
from services.order_service import get_dashboard_stats

def check():
    sb = get_supabase()
    # Get ID
    bus = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business not found")
        return
    bid = bus.data[0]['id']
    print(f"Business ID: {bid}")

    # Check raw orders
    orders = sb.table("orders").select("id, created_at").eq("business_id", bid).execute()
    print(f"Total Orders in DB: {len(orders.data)}")
    if orders.data:
        print(f"Sample Order Date: {orders.data[0]['created_at']}")

    # Check stats function
    stats = get_dashboard_stats(bid)
    print("Stats returned by service:", stats)

if __name__ == "__main__":
    check()
