-- Add sku column to purchase_items table if not exists
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

