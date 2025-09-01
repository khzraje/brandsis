-- إضافة حقل العملة المفضلة إلى جدول العملاء
-- قم بتنفيذ هذا الكود في Supabase SQL Editor

ALTER TABLE customers
ADD COLUMN preferred_currency TEXT DEFAULT 'IQD';

-- تحديث جميع السجلات الموجودة
UPDATE customers
SET preferred_currency = 'IQD'
WHERE preferred_currency IS NULL;

-- إضافة تعليق على الحقل
COMMENT ON COLUMN customers.preferred_currency IS 'العملة المفضلة للعميل (IQD أو USD)';
