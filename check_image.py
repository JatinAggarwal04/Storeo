from supabase_client import get_supabase

def check_image():
    sb = get_supabase()
    result = sb.table("products").select("name, image_urls").eq("name", "Premium Dinner Set").execute()
    for row in result.data:
        print(f"Product: {row['name']}")
        print(f"Image URL: {row['image_urls'][0] if row['image_urls'] else 'None'}")

if __name__ == "__main__":
    check_image()
