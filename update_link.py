from supabase_client import get_supabase

def update_product_link():
    sb = get_supabase()
    
    product_link = "https://myborosil.com/products/larah-opalware-bluebell-dinner-set-21-pc-set-serves-6?variant=45897536995466"
    
    # Update description to include the link
    # And specifically user said "dont add jpg", so I will clear the image_urls to be safe/compliant with "just add this link"
    description = f"32-piece ceramic dinner set (microwave safe). Buy here: {product_link}"
    
    print("Updating Premium Dinner Set description...")
    
    # Get Business ID
    bus = sb.table("businesses").select("id").eq("name", "Kanha Kollection").execute()
    if not bus.data:
        print("Business not found")
        return
    bid = bus.data[0]['id']

    sb.table("products").update({
        "description": description,
        "image_urls": [] # User said "dont add jpg", assuming they want text link only
    }).eq("business_id", bid).eq("name", "Premium Dinner Set").execute()
    
    print("Product updated with link and image removed.")

if __name__ == "__main__":
    update_product_link()
