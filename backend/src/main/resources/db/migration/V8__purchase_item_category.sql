-- Add category_id column to purchase_items table if not exists
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

