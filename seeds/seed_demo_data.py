
import os
import mimetypes
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Using service role key if available would be better, but we'll try with what we have
# If SUPABASE_KEY is anon, we need to sign in a user.

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Demo User Credentials
DEMO_EMAIL = "demo@runbase.com"
DEMO_PASSWORD = "DemoPassword123!"

def login_or_signup():
    print(f"Authenticating as {DEMO_EMAIL}...")
    try:
        data = supabase.auth.sign_in_with_password({"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        print("Logged in successfully.")
        return data.user
    except Exception as e:
        print(f"Login failed ({e}), trying signup...")
        try:
            data = supabase.auth.sign_up({"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
            print("Signed up successfully.")
            return data.user
        except Exception as e2:
            print(f"Signup failed: {e2}")
            return None

def get_or_create_business(user_id):
    # Check if business exists
    res = supabase.table("businesses").select("*").eq("user_id", user_id).execute()
    if res.data:
        print(f"Found existing business: {res.data[0]['name']}")
        return res.data[0]["id"]
    
    # Create new business
    print("Creating new business 'Home Decor & Dining'...")
    biz = {
        "user_id": user_id,
        "name": "Home Decor & Dining",
        "type": "Retail",
        "whatsapp_number": "919999999999" # Placeholder
    }
    res = supabase.table("businesses").insert(biz).execute()
    return res.data[0]["id"]

def get_or_create_category(business_id, name):
    res = supabase.table("categories").select("*").eq("business_id", business_id).eq("name", name).execute()
    if res.data:
        return res.data[0]["id"]
    
    print(f"Creating category '{name}'...")
    cat = {
        "business_id": business_id,
        "name": name
    }
    res = supabase.table("categories").insert(cat).execute()
    return res.data[0]["id"]

def upload_image(business_id, file_path):
    bucket_name = "product-images"
    filename = os.path.basename(file_path)
    # Prefix with business_id to avoid collisions and keep organized (optional but good practice)
    storage_path = f"{business_id}/{filename}"
    
    # Check if bucket exists (cannot check easily with client, assume it does or catch error)
    # supabase.storage.create_bucket(bucket_name, options={'public': True}) # requires admin rights usually
    
    print(f"Uploading {filename}...")
    try:
        with open(file_path, "rb") as f:
            file_data = f.read()
            content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
            supabase.storage.from_(bucket_name).upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": content_type, "upsert": "true"}
            )
        
        # Get Public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
        return public_url
    except Exception as e:
        print(f"Upload failed for {filename}: {e}")
        # Try to return public URL anyway if it already exists
        return supabase.storage.from_(bucket_name).get_public_url(storage_path)

def seed():
    user = login_or_signup()
    if not user:
        print("Could not authenticate. Ensure email confirmation is disabled or check credentials.")
        return

    business_id = get_or_create_business(user.id)
    
    # Create Categories
    cat_dinnerware = get_or_create_category(business_id, "Dinnerware")
    cat_cutlery = get_or_create_category(business_id, "Cutlery")
    
    products = [
        {
            "name": "Side plates - Freakway Stoneware Ceramic Dinner Plates (10.6 Inch) Set of 6 Pcs",
            "description": "Material: Ceramic, Type: Dinner, Microwave Safe: Yes, Hand Painted: Yes, Quantity: 6-piece set, Size: 26.92 cm",
            "price": 1299.00,
            "category_id": cat_dinnerware,
            "image_file": "demo/plates/plates-1.jpeg"
        },
        {
            "name": "Embassy French Dinner Plate Size 3 (Pack of 2)",
            "description": "Color: Steel, Material: Stainless Steel, Type: Plate, Subtype: Dinner plate, Count: 2, Quantity: 2, Size: 25.7 cms, Dishwasher Safe: Yes",
            "price": 499.00,
            "category_id": cat_dinnerware,
            "image_file": "demo/plates/plates-2.jpeg"
        },
        {
            "name": "Stainless Steel Spoons Set of 12",
            "description": "Dinner Spoon Length 16 cm, for Mirror Polished Stainless Steel Cut. Count: 12 spoons.",
            "price": 399.00,
            "category_id": cat_cutlery,
            "image_file": "demo/spoons/spoons-1.jpeg"
        },
        {
            "name": "Gold Hammered Steel Head Serving Spoons (Set of Two)",
            "description": "Brand: VarEesha. Hand-crafted.",
            "price": 599.00,
            "category_id": cat_cutlery,
            "image_file": "demo/spoons/spoons-2.jpeg"
        }
    ]
    
    for p in products:
        # Check if product exists
        res = supabase.table("products").select("*").eq("business_id", business_id).eq("name", p["name"]).execute()
        
        # Upload Image
        image_url = None
        if os.path.exists(p["image_file"]):
            image_url = upload_image(business_id, p["image_file"])
        else:
            print(f"Warning: Image file not found: {p['image_file']}")
            
        # Upsert Product
        prod_data = {
            "business_id": business_id,
            "category_id": p["category_id"],
            "name": p["name"],
            "description": p["description"],
            "price": p["price"],
            "image_urls": [image_url] if image_url else [],
            "in_stock": True
        }
        
        if res.data:
             print(f"Updating product: {p['name']}")
             supabase.table("products").update(prod_data).eq("id", res.data[0]["id"]).execute()
        else:
             print(f"Inserting product: {p['name']}")
             supabase.table("products").insert(prod_data).execute()

    print("\n--- Seeding Complete ---")
    print(f"Demo User: {DEMO_EMAIL}")
    print(f"Password:  {DEMO_PASSWORD}")
    print("Log in with these credentials to see the demo data.")

if __name__ == "__main__":
    seed()
