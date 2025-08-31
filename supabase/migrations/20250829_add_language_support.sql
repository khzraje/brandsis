-- إضافة إعدادات اللغة إلى قاعدة البيانات
DO $$
BEGIN
    -- إضافة إعداد اللغة الافتراضية
    IF NOT EXISTS (
        SELECT 1 FROM settings WHERE key = 'app_language'
    ) THEN
        INSERT INTO public.settings (key, value, description) VALUES
        ('app_language', '"ar"', 'لغة التطبيق - ar للعربية، ku للكردية السورانية');
    END IF;

    -- إضافة إعدادات الترجمة للرسائل
    IF NOT EXISTS (
        SELECT 1 FROM settings WHERE key = 'whatsapp_message_templates_ar'
    ) THEN
        INSERT INTO public.settings (key, value, description) VALUES
        ('whatsapp_message_templates_ar', '["مرحباً {customer_name}،\\n\\nتذكير بدفع القسط المستحق:\\n\\n📱 المنتج: {product_name}\\n💰 المبلغ: {amount} {currency}\\n📅 تاريخ الاستحقاق: {due_date}\\n⏰ باقي: {days_left} يوم\\n\\nيرجى تسديد المبلغ في الموعد المحدد.\\n\\nشكراً لتعاونكم."]', 'قوالب الرسائل باللغة العربية');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM settings WHERE key = 'whatsapp_message_templates_ku'
    ) THEN
        INSERT INTO public.settings (key, value, description) VALUES
        ('whatsapp_message_templates_ku', '["سڵاو {customer_name}،\\n\\nبیرهێنانەوەی پارەدان بۆ قیست:\\n\\n📱 بەرهەم: {product_name}\\n💰 بڕ: {amount} {currency}\\n📅 ڕێکەوتی دەستپێکردن: {due_date}\\n⏰ ماوە: {days_left} ڕۆژ\\n\\nتکایە پارەکە لە کاتی دیاریکراو بدە.\\n\\nسوپاس بۆ هاوکاریتان."]', 'قوالب الرسائل باللغة الكردية السورانية');
    END IF;
END $$;
