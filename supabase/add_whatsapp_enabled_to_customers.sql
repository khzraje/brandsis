-- إضافة عمود whatsapp_enabled إلى جدول العملاء
-- هذا العمود يحدد ما إذا كان العميل نشط لتلقي رسائل WhatsApp

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customers'
        AND column_name = 'whatsapp_enabled'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'تم إضافة عمود whatsapp_enabled إلى جدول العملاء';
    ELSE
        RAISE NOTICE 'عمود whatsapp_enabled موجود بالفعل في جدول العملاء';
    END IF;
END $$ LANGUAGE plpgsql;

-- تحديث جميع السجلات الموجودة لتكون نشطة افتراضياً
UPDATE public.customers
SET whatsapp_enabled = true
WHERE whatsapp_enabled IS NULL;

-- إضافة تعليق على العمود
COMMENT ON COLUMN customers.whatsapp_enabled IS 'تحديد ما إذا كان العميل نشط لتلقي رسائل WhatsApp';
