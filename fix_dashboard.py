from supabase_client import get_supabase
from services.order_service import get_dashboard_stats

def update_and_check():
    sb = get_supabase()
    
    # 1. Update WhatsApp Number
    print("Updating WhatsApp number...")
    sb.table("businesses").update({"whatsapp_number": "+14155238886"}).eq("name", "Kanha Kollection").execute()
    
    # 2. Get Business ID
    bus = sb.table("businesses").select("id, whatsapp_number").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business not found")
        return
    bid = bus.data[0]['id']
    print(f"Business ID: {bid}")
    print(f"Current Number: {bus.data[0]['whatsapp_number']}")

    # 3. Check Stats
    print("\nChecking Stats API Logic:")
    try:
        stats = get_dashboard_stats(bid)
        print("Stats returned:", stats)
    except Exception as e:
        print(f"Error getting stats: {e}")

if __name__ == "__main__":
    update_and_check()
