CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT
);

INSERT INTO app_settings (setting_key, setting_value) VALUES
('shopName', 'Shop'),
('tagline', 'Xerox, Print & Stationery Store'),
('timezone', 'Asia/Kolkata (IST)'),
('headerNote', 'Welcome to our Xerox & Print Center'),
('footerNote', 'Thank you for visiting! Please come again.'),
('billPrefix', 'BILL'),
('billCounter', '0')
ON CONFLICT (setting_key) DO NOTHING;

