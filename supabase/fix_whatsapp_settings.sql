-- تحديث إعدادات WhatsApp لإصلاح مشاكل التخزين
-- هذا الملف يحتاج إلى تشغيله في Supabase SQL Editor

-- تحديث القيم الموجودة لإزالة علامات التنصيص المزدوجة
UPDATE settings SET value = 'false' WHERE key = 'whatsapp_enabled' AND value = '"false"';
UPDATE settings SET value = 'true' WHERE key = 'whatsapp_enabled' AND value = '"true"';
UPDATE settings SET value = '3' WHERE key = 'whatsapp_reminder_days' AND value = '"3"';

-- التأكد من وجود جميع الإعدادات المطلوبة
INSERT INTO settings (key, value, description)
VALUES
  ('whatsapp_enabled', 'false', 'تمكين الواتساب'),
  ('whatsapp_api_url', '', 'رابط API الواتساب'),
  ('whatsapp_api_key', '', 'مفتاح API الواتساب'),
  ('whatsapp_sender_number', '', 'رقم المرسل'),
  ('whatsapp_reminder_days', '3', 'عدد الأيام قبل الاستحقاق للتنبيه')
ON CONFLICT (key) DO NOTHING;

-- عرض الإعدادات الحالية للتأكد
SELECT key, value, description FROM settings WHERE key LIKE 'whatsapp_%';
