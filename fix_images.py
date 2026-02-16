from supabase_client import get_supabase

def update_images():
    sb = get_supabase()
    print("Updating product images to safe URLs...")
    
    # Safe images from reliable sources (Unsplash/Placehold)
    updates = {
        "Premium Dinner Set": "https://images.unsplash.com/photo-1590590491385-d5e6e87dcb77?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "Non-Stick Cookware Set": "https://images.unsplash.com/photo-1584990347449-a0846fc1e31b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "Glass Water Bottle Set": "https://images.unsplash.com/photo-1602143407151-01114192003b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }

    # Get business ID
    bus = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business not found!")
        return
    
    bid = bus.data[0]['id']

    for name, url in updates.items():
        sb.table("products").update({"image_urls": [url]}).eq("business_id", bid).eq("name", name).execute()
        print(f"Updated {name}")

    print("Images updated.")

if __name__ == "__main__":
    update_images()
