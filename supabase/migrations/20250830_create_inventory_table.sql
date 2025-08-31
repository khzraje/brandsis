-- إنشاء جدول inventory لتخزين المنتجات
-- هذا الملف ينشئ الامتداد pgcrypto إن لم يكن موجودًا ثم ينشئ الجدول

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric,
  price_iqd numeric,
  price_usd numeric,
  created_at timestamptz DEFAULT now()
);

-- فهرس على الاسم للبحث السريع
CREATE INDEX IF NOT EXISTS inventory_name_idx ON public.inventory USING btree (lower(name));
