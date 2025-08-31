-- إضافة إعداد العملة الافتراضي
INSERT INTO settings (key, value, description)
VALUES ('currency', 'IQD', 'العملة المستخدمة في التطبيق')
ON CONFLICT (key) DO NOTHING;

-- إضافة إعدادات أخرى افتراضية إذا لم تكن موجودة
INSERT INTO settings (key, value, description)
VALUES
  ('app_theme', 'light', 'سمة التطبيق'),
  ('primary_color', '#2563eb', 'اللون الأساسي'),
  ('notification_enabled', 'true', 'تمكين الإشعارات'),
  ('telegram_enabled', 'false', 'تمكين تليجرام'),
  ('telegram_bot_token', '', 'رمز البوت'),
  ('telegram_chat_id', '', 'معرف المحادثة'),
  ('whatsapp_enabled', 'false', 'تمكين الواتساب'),
  ('whatsapp_api_url', '', 'رابط API الواتساب'),
  ('whatsapp_api_key', '', 'مفتاح API الواتساب'),
  ('whatsapp_sender_number', '', 'رقم المرسل'),
  ('whatsapp_reminder_days', '3', 'عدد الأيام قبل الاستحقاق للتنبيه')
ON CONFLICT (key) DO NOTHING;

-- إضافة عمود رقم الواتساب للعملاء
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- إضافة عمود رقم الواتساب للأقساط
ALTER TABLE installments ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
