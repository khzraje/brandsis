-- إضافة حقل whatsapp_number إلى جدول العملاء
-- هذا الحقل اختياري ويمكن أن يكون مختلف عن رقم الهاتف العادي

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers'
        AND column_name = 'whatsapp_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN whatsapp_number TEXT;
        RAISE NOTICE 'تم إضافة حقل whatsapp_number إلى جدول العملاء';
    ELSE
        RAISE NOTICE 'حقل whatsapp_number موجود بالفعل في جدول العملاء';
    END IF;
END $$ LANGUAGE plpgsql;

-- إضافة حقل whatsapp_number إلى جدول الأقساط إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'installments'
        AND column_name = 'whatsapp_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.installments ADD COLUMN whatsapp_number TEXT;
        RAISE NOTICE 'تم إضافة حقل whatsapp_number إلى جدول الأقساط';
    ELSE
        RAISE NOTICE 'حقل whatsapp_number موجود بالفعل في جدول الأقساط';
    END IF;
END $$ LANGUAGE plpgsql;

-- تحديث البيانات الموجودة: نسخ رقم الهاتف إلى whatsapp_number إذا كان فارغاً
UPDATE public.customers
SET whatsapp_number = phone
WHERE whatsapp_number IS NULL AND phone IS NOT NULL;

UPDATE public.installments
SET whatsapp_number = customers.phone
FROM customers
WHERE installments.customer_id = customers.id
AND installments.whatsapp_number IS NULL
AND customers.phone IS NOT NULL;
