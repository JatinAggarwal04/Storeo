import uuid
import base64
from supabase_client import get_supabase


def create_category(business_id: str, name: str) -> dict:
    """Create a new product category."""
    sb = get_supabase()
    result = sb.table("categories").insert({
        "business_id": business_id,
        "name": name,
    }).execute()
    return result.data[0] if result.data else None


def get_categories(business_id: str) -> list:
    """Get all categories for a business."""
    sb = get_supabase()
    result = (
        sb.table("categories")
        .select("*")
        .eq("business_id", business_id)
        .order("created_at")
        .execute()
    )
    return result.data or []


def delete_category(category_id: str) -> bool:
    """Delete a category (cascades to products)."""
    sb = get_supabase()
    sb.table("categories").delete().eq("id", category_id).execute()
    return True


def create_product(data: dict) -> dict:
    """Create a new product."""
    sb = get_supabase()
    product = {
        "category_id": data["category_id"],
        "business_id": data["business_id"],
        "name": data["name"],
        "description": data.get("description", ""),
        "price": data.get("price"),
        "image_urls": data.get("image_urls", []),
        "in_stock": data.get("in_stock", True),
        "stock_quantity": data.get("stock_quantity", 0),
    }
    result = sb.table("products").insert(product).execute()
    return result.data[0] if result.data else None


def get_products(business_id: str, category_id: str = None) -> list:
    """Get products, optionally filtered by category."""
    sb = get_supabase()
    query = sb.table("products").select("*, categories(name)").eq("business_id", business_id)
    if category_id:
        query = query.eq("category_id", category_id)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


def get_product(product_id: str) -> dict:
    """Get a single product."""
    sb = get_supabase()
    result = sb.table("products").select("*, categories(name)").eq("id", product_id).execute()
    return result.data[0] if result.data else None


def update_product(product_id: str, data: dict) -> dict:
    """Update a product."""
    sb = get_supabase()
    update_data = {}
    for key in ["name", "description", "price", "image_urls", "in_stock", "stock_quantity", "category_id"]:
        if key in data:
            update_data[key] = data[key]
    result = sb.table("products").update(update_data).eq("id", product_id).execute()
    return result.data[0] if result.data else None


def delete_product(product_id: str) -> bool:
    """Delete a product."""
    sb = get_supabase()
    sb.table("products").delete().eq("id", product_id).execute()
    return True


def upload_image(business_id: str, file_data: bytes, filename: str, content_type: str) -> str:
    """Upload an image to Supabase Storage and return the public URL."""
    sb = get_supabase()
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    storage_path = f"{business_id}/{uuid.uuid4().hex}.{ext}"

    sb.storage.from_("product-images").upload(
        path=storage_path,
        file=file_data,
        file_options={"content-type": content_type},
    )

    public_url = sb.storage.from_("product-images").get_public_url(storage_path)
    return public_url


def search_products(business_id: str, query: str) -> list:
    """Search products by name/description with basic fuzzy matching."""
    sb = get_supabase()
    all_products = (
        sb.table("products")
        .select("*, categories(name)")
        .eq("business_id", business_id)
        .execute()
    ).data or []

    if not query:
        return all_products

    query_lower = query.lower().strip()
    query_words = query_lower.split()

    scored = []
    for product in all_products:
        name_lower = (product.get("name") or "").lower()
        desc_lower = (product.get("description") or "").lower()
        cat_name = ""
        if product.get("categories"):
            cat_name = (product["categories"].get("name") or "").lower()

        searchable = f"{name_lower} {desc_lower} {cat_name}"
        score = 0

        # Exact match in name
        if query_lower in name_lower:
            score += 10
        # Exact match in description
        if query_lower in desc_lower:
            score += 5
        # Word matches
        for word in query_words:
            if word in searchable:
                score += 3
            # Partial match (at least 3 chars)
            elif len(word) >= 3:
                for s_word in searchable.split():
                    if word in s_word or s_word in word:
                        score += 1

        if score > 0:
            scored.append((score, product))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored]
