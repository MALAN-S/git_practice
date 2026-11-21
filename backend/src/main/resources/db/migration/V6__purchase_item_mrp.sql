-- Add MRP column to purchase_items table if not exists
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS mrp NUMERIC(15,2);

