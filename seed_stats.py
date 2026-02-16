import random
from datetime import datetime, timedelta
from supabase_client import get_supabase
import uuid

def seed_fake_stats():
    sb = get_supabase()
    print("Seeding fake stats for Kanha Kollection...")

    # Get Business ID
    bus = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business 'Kanha Kollection' not found.")
        return
    bid = bus.data[0]['id']

    # 1. Create Dummy Orders
    statuses = ['delivered', 'confirmed', 'pending', 'cancelled']
    items_pool = [
        {"product": "Premium Dinner Set", "quantity": 1, "price": 2500},
        {"product": "Non-Stick Cookware Set", "quantity": 1, "price": 1200},
        {"product": "Glass Water Bottle Set", "quantity": 2, "price": 1200}
    ]

    orders = []
    for _ in range(15):  # Create 15 orders
        item = random.choice(items_pool)
        orders.append({
            "business_id": bid,
            "customer_name": f"Customer {random.randint(100, 999)}",
            "customer_phone": f"+9198765{random.randint(10000, 99999)}",
            "customer_address": "123 Demo St, City",
            "items": [item],
            "total": item['price'] * item['quantity'],
            "status": random.choice(statuses),
            "created_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat()
        })
    
    sb.table("orders").insert(orders).execute()
    print(f"Inserted {len(orders)} dummy orders.")

    # 2. Create Dummy Conversations (Interactions)
    convos = []
    for _ in range(8):
        phone = f"+9198765{random.randint(10000, 99999)}"
        # Check if conversation exists to avoid unique constraint error
        exists = sb.table("conversations").select("id").eq("business_id", bid).eq("customer_phone", phone).execute()
        if not exists.data:
            convos.append({
                "business_id": bid,
                "customer_phone": phone,
                "messages": [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello! How can I help?"}],
                "last_message_at": (datetime.now() - timedelta(hours=random.randint(1, 48))).isoformat()
            })
    
    if convos:
        sb.table("conversations").insert(convos).execute()
        print(f"Inserted {len(convos)} dummy conversations.")

    print("Stats seeding complete.")

if __name__ == "__main__":
    seed_fake_stats()
