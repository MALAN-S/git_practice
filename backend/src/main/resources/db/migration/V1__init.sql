-- V1__init.sql: Initial schema for Xerox Shop Management System

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','STAFF')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    purchase_price NUMERIC(15,2) NOT NULL,
    selling_price NUMERIC(15,2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 0,
    image_url TEXT,
    status VARCHAR(10) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')),
    category_id INT REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(10) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    paper_size VARCHAR(10) NOT NULL,
    sides VARCHAR(10) NOT NULL CHECK (sides IN ('SINGLE','DOUBLE')),
    price_per_page NUMERIC(15,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    total_amount NUMERIC(15,2) NOT NULL,
    discount NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH','UPI','CARD')),
    status VARCHAR(15) NOT NULL CHECK (status IN ('COMPLETED','CANCELLED','REFUNDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    service_id UUID REFERENCES services(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('IN','OUT','ADJUST')),
    quantity INT NOT NULL,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(30) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    payment_method VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed initial categories
INSERT INTO categories (name) VALUES 
('Stationery'),
('Paper'),
('Xerox Services'),
('Color Printing'),
('Other Services')
ON CONFLICT (name) DO NOTHING;

-- Seed default admin user (password: admin123, BCrypt encoded: $2a$10$wK1.V/f7NlC9PqyNqTeqh.v3v5V07mQ6lD3jR0rG9Yk4m0XyE6/eW)
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$X8m1jK4wB7r2Z7tT1oDqQ.5hV1i2k3l4m5n6o7p8q9r0s1t2u3v4w', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
