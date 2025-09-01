-- إضافة حقل العملة إلى جدول الأقساط (إذا لم يكن موجوداً)
-- قم بتنفيذ هذا الكود في Supabase SQL Editor

-- التحقق من وجود الحقل أولاً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'installments' AND column_name = 'currency'
    ) THEN
        ALTER TABLE installments ADD COLUMN currency TEXT DEFAULT 'IQD';
        UPDATE installments SET currency = 'IQD' WHERE currency IS NULL;
        COMMENT ON COLUMN installments.currency IS 'العملة المستخدمة في القسط (IQD أو USD)';
    END IF;
END $$;
