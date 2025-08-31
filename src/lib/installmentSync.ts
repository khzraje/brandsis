import { supabase } from "@/integrations/supabase/client";

export const syncInstallmentsOverdue = async () => {
  // جلب جميع الأقساط غير المكتملة
  const { data, error } = await supabase
    .from('installments')
    .select('id, next_payment_date, status')
    .neq('status', 'مكتمل');

  if (error) throw error;
  const now = new Date();
  now.setHours(0,0,0,0);

  const toMark = (data || []).filter((r) => {
    if (!r.next_payment_date) return false;
    const due = new Date(r.next_payment_date);
    if (isNaN(due.getTime())) return false;
    due.setHours(0,0,0,0);
    return due < now;
  }).map((r) => r.id);

  if (toMark.length > 0) {
    const { error: updateErr } = await supabase
      .from('installments')
      .update({ status: 'متأخر' })
      .in('id', toMark);
    if (updateErr) throw updateErr;
  }
  return { marked: toMark.length };
};
