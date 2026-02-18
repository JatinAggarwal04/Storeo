-- ============================================================
-- Storeo — Schema Migration v2
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to run on existing databases (uses IF NOT EXISTS / IF NOT EXISTS checks)
-- ============================================================

-- Add Meta WhatsApp Cloud API columns to businesses
ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
    ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
    ADD COLUMN IF NOT EXISTS meta_waba_id TEXT,
    ADD COLUMN IF NOT EXISTS system_prompt TEXT,
    ADD COLUMN IF NOT EXISTS bot_active BOOLEAN DEFAULT FALSE;

-- Add stock quantity to products
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Index for fast lookup by phone_number_id (used on every incoming message)
CREATE INDEX IF NOT EXISTS idx_businesses_phone_number_id ON businesses(whatsapp_phone_number_id);
