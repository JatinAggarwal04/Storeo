from supabase_client import get_supabase

def update_dinner_set_specifics():
    sb = get_supabase()
    
    # Specific image URL and description provided by user
    image_link = "https://myborosil.com/cdn/shop/files/HTTC21DN1BBLMO_a_74bc9ab5-9f3a-4824-8640-587b424ac682.jpg?v=1748534090&width=1646"
    
    # We embed the markdown link directly in the description so the AI picks it up easily
    new_description = (
        "32-piece ceramic dinner set (microwave safe). "
        "This complete set has everything you need - plates, bowls, spoons, and more for your dining needs! "
        f"Here's the image: [Premium Dinner Set]({image_link})"
    )
    
    print("Updating Premium Dinner Set description...")
    
    # Get Business ID
    bus = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business not found")
        return
    bid = bus.data[0]['id']

    sb.table("products").update({
        "description": new_description,
        "image_urls": [] # Ensure no attachment is sent, only the text link
    }).eq("business_id", bid).eq("name", "Premium Dinner Set").execute()
    
    print("Product updated with specific markdown link.")

if __name__ == "__main__":
    update_dinner_set_specifics()
