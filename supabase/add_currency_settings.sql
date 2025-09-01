-- إضافة إعداد العملة الافتراضية
-- قم بتنفيذ هذا الكود في Supabase SQL Editor

INSERT INTO settings (key, value, description)
VALUES ('default_currency', 'IQD', 'العملة الافتراضية للتطبيق')
ON CONFLICT (key) DO NOTHING;

-- إضافة إعداد للعملات المدعومة
INSERT INTO settings (key, value, description)
VALUES ('supported_currencies', 'IQD,USD', 'العملات المدعومة في التطبيق')
ON CONFLICT (key) DO NOTHING;
