-- V5__partial_payment.sql: Add partial payment support

-- Allow PARTIAL status
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_status_check
    CHECK (status IN ('COMPLETED','CANCELLED','REFUNDED','PARTIAL'));

-- Add customer info and partial payment fields
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(15,2) DEFAULT 0;

