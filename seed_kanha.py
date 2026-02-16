import os
from supabase_client import get_supabase

def seed_data():
    sb = get_supabase()
    
    print("Seeding Kanha Kollection data...")

    # 1. Create/Get Business
    print("Checking business...")
    business_data = {
        "name": "Kanha Kollection",
        "type": "Retail Store",
        "whatsapp_number": "+919855242000",
        "description": "Kanha Kollection offers a wide range of premium dinner sets, kitchenware, and home essentials.",
        "bot_tone": "friendly",
        "auto_greet": True,
        "greeting_message": "Welcome to Kanha Kollection! How can I help you today?"
    }
    
    # Check if exists
    existing = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    
    business_id = None
    if existing.data:
        business_id = existing.data[0]['id']
        print(f"Business exists: {business_id}")
        sb.table("businesses").update(business_data).eq("id", business_id).execute()
    else:
        new_bus = sb.table("businesses").insert(business_data).execute()
        business_id = new_bus.data[0]['id']
        print(f"Created business: {business_id}")

    # 2. Create/Get Category
    print("Checking category...")
    cat_name = "Kitchenware"
    existing_cat = sb.table("categories").select("id").eq("business_id", business_id).eq("name", cat_name).execute()
    
    category_id = None
    if existing_cat.data:
        category_id = existing_cat.data[0]['id']
    else:
        new_cat = sb.table("categories").insert({"business_id": business_id, "name": cat_name}).execute()
        category_id = new_cat.data[0]['id']
    print(f"Category ID: {category_id}")

    # 3. Create Products
    print("Seeding products...")
    products = [
        {
            "name": "Premium Dinner Set",
            "description": "32-piece ceramic dinner set, microwave safe.",
            "price": 2500.00,
            "image_urls": ["https://m.media-amazon.com/images/I/71wF7x3+JBL._AC_SL1500_.jpg"]
        },
        {
            "name": "Non-Stick Cookware Set",
            "description": "3-piece non-stick cookware set including frying pan and kadhai.",
            "price": 1200.00,
            "image_urls": ["https://m.media-amazon.com/images/I/61k-g5LzRBL._AC_SL1500_.jpg"]
        },
        {
            "name": "Glass Water Bottle Set",
            "description": "Set of 6 borosilicate glass water bottles, 1 litre each.",
            "price": 600.00,
            "image_urls": ["https://m.media-amazon.com/images/I/61+9+8+9+9L._AC_SL1500_.jpg"]
        }
    ]

    for p in products:
        # Check if exists to avoid duplicates
        existing_p = sb.table("products").select("id").eq("business_id", business_id).eq("name", p["name"]).execute()
        if not existing_p.data:
            sb.table("products").insert({
                "business_id": business_id,
                "category_id": category_id,
                "name": p["name"],
                "description": p["description"],
                "price": p["price"],
                "image_urls": p["image_urls"],
                "in_stock": True
            }).execute()
            print(f"Added product: {p['name']}")
        else:
             print(f"Product already exists: {p['name']}")

    print("Seeding complete! Kanha Kollection is ready.")

if __name__ == "__main__":
    seed_data()
