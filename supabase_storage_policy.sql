-- Run this in your Supabase SQL Editor to enable image uploads

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users (like your demo script) to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Allow public viewing of images
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Enable RLS on objects if not already enabled (usually is by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
