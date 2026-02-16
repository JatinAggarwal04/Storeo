from supabase_client import get_supabase
try:
    sb = get_supabase()
    # Try to select from orders. If table missing, this will fail.
    resp = sb.table("orders").select("id").limit(1).execute()
    print("TABLE_EXISTS: True")
except Exception as e:
    print(f"TABLE_EXISTS: False - {e}")
