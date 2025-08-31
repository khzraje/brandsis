-- إنشاء جدول العملاء
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  national_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الديون
CREATE TABLE public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  debt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'نشط' CHECK (status IN ('نشط', 'مسدد', 'متأخر', 'ملغي')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الأقساط
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  monthly_amount DECIMAL(15,2) NOT NULL,
  remaining_amount DECIMAL(15,2) NOT NULL,
  months_count INTEGER NOT NULL,
  paid_months INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'نشط' CHECK (status IN ('نشط', 'مكتمل', 'متأخر', 'ملغي')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول مدفوعات الأقساط
CREATE TABLE public.installment_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  payment_amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_customer_id UUID REFERENCES public.customers(id),
  related_debt_id UUID REFERENCES public.debts(id),
  related_installment_id UUID REFERENCES public.installments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإعدادات
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS على جميع الجداول
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الوصول (مؤقتاً مفتوحة - يجب إضافة نظام المصادقة لاحقاً)
CREATE POLICY "Enable all operations for all users" ON public.customers FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.debts FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.installments FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.installment_payments FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON public.settings FOR ALL USING (true);

-- إنشاء function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة triggers لتحديث updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة بيانات الإعدادات الافتراضية
INSERT INTO public.settings (key, value, description) VALUES
('app_theme', '"light"', 'سمة التطبيق'),
('primary_color', '"#2563eb"', 'اللون الأساسي'),
('notification_enabled', 'true', 'تمكين الإشعارات'),
('telegram_enabled', 'false', 'تمكين التليجرام'),
('telegram_bot_token', '""', 'رمز بوت التليجرام'),
('telegram_chat_id', '""', 'معرف محادثة التليجرام');

-- إضافة بعض العملاء التجريبيين
INSERT INTO public.customers (name, phone, email, address) VALUES
('أحمد محمد علي', '0501234567', 'ahmed@example.com', 'الرياض، المملكة العربية السعودية'),
('فاطمة سالم', '0509876543', 'fatima@example.com', 'جدة، المملكة العربية السعودية'),
('خالد عبدالله', '0505555555', 'khalid@example.com', 'الدمام، المملكة العربية السعودية'),
('نورا أحمد', '0502222222', 'nora@example.com', 'مكة، المملكة العربية السعودية'),
('محمد حسن', '0507777777', 'mohammed@example.com', 'المدينة المنورة، المملكة العربية السعودية');