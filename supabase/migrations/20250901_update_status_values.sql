-- تحديث قيم الحالة من العربية إلى الإنجليزية لتجنب مشاكل الترميز

-- أولاً، حذف CHECK constraints الموجودة
ALTER TABLE public.debts DROP CONSTRAINT IF EXISTS debts_status_check;
ALTER TABLE public.installments DROP CONSTRAINT IF EXISTS installments_status_check;

-- تحديث جدول الديون
UPDATE public.debts
SET status = CASE
  WHEN status = 'نشط' THEN 'active'
  WHEN status = 'مسدد' THEN 'paid'
  WHEN status = 'متأخر' THEN 'overdue'
  WHEN status = 'ملغي' THEN 'cancelled'
  ELSE status
END;

-- تحديث جدول الأقساط
UPDATE public.installments
SET status = CASE
  WHEN status = 'نشط' THEN 'active'
  WHEN status = 'مكتمل' THEN 'completed'
  WHEN status = 'متأخر' THEN 'overdue'
  WHEN status = 'ملغي' THEN 'cancelled'
  ELSE status
END;

-- إضافة CHECK constraints الجديدة مع جميع القيم الممكنة
ALTER TABLE public.debts ADD CONSTRAINT debts_status_check
  CHECK (status IN ('active', 'paid', 'overdue', 'cancelled', 'نشط', 'مسدد', 'متأخر', 'ملغي'));

ALTER TABLE public.installments ADD CONSTRAINT installments_status_check
  CHECK (status IN ('active', 'completed', 'overdue', 'cancelled', 'نشط', 'مكتمل', 'متأخر', 'ملغي'));

-- تحديث القيم الافتراضية
ALTER TABLE public.debts ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE public.installments ALTER COLUMN status SET DEFAULT 'active';
