-- إضافة حقل العملة إلى جدول الديون
-- قم بتنفيذ هذا الكود في Supabase SQL Editor

ALTER TABLE debts
ADD COLUMN currency TEXT DEFAULT 'IQD';

-- تحديث جميع السجلات الموجودة لتكون بالدينار العراقي
UPDATE debts
SET currency = 'IQD'
WHERE currency IS NULL;

-- إضافة تعليق على الحقل
COMMENT ON COLUMN debts.currency IS 'العملة المستخدمة في الدين (IQD أو USD)';
