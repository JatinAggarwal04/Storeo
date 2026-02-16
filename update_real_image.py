from supabase_client import get_supabase

def update_real_image():
    sb = get_supabase()
    # Real image from MyBorosil CDN found via curl/grep
    real_url = "https://myborosil.com/cdn/shop/files/1_07621415-3885-45c1-968b-5778a48742db.jpg" 
    
    print(f"Updating Premium Dinner Set to: {real_url}")
    
    # Get business ID
    bus = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business not found!")
        return
    bid = bus.data[0]['id']

    sb.table("products").update({"image_urls": [real_url]}).eq("business_id", bid).eq("name", "Premium Dinner Set").execute()
    print("Update complete.")

if __name__ == "__main__":
    update_real_image()
