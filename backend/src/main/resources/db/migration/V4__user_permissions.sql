-- V4__user_permissions.sql: Add permissions column to users table
-- Stores comma-separated list of allowed page keys for STAFF users
-- ADMIN users always have full access regardless of this field
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '';

