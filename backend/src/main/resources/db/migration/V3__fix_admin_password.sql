-- V3__fix_admin_password.sql: Fix admin user password hash
-- Password: admin123 (BCrypt $2a$10$ encoded)
UPDATE users
SET password = '$2a$10$OguyJeCVbittUg1l30roy.wxRY8DHxtMrJ9Es.EkJ4fd1wdNWDYji',
    updated_at = now()
WHERE username = 'admin';

