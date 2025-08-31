import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalDebts: number;
  totalInstallments: number;
  activeCustomers: number;
  overduePayments: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // جلب إجمالي الديون
      const { data: debtsData, error: debtsError } = await supabase
        .from("debts")
        .select("amount")
        .eq("status", "نشط");

      if (debtsError) throw debtsError;

      const totalDebts = debtsData?.reduce((sum, debt) => sum + debt.amount, 0) || 0;

      // جلب إجمالي الأقساط
      const { data: installmentsData, error: installmentsError } = await supabase
        .from("installments")
        .select("remaining_amount")
        .eq("status", "نشط");

      if (installmentsError) throw installmentsError;

      const totalInstallments = installmentsData?.reduce((sum, installment) => sum + installment.remaining_amount, 0) || 0;

      // جلب عدد العملاء النشطين
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id");

      if (customersError) throw customersError;

      const activeCustomers = customersData?.length || 0;

      // جلب المدفوعات المتأخرة (الأقساط التي تجاوز تاريخ الاستحقاق)
      const currentDate = new Date().toISOString().split('T')[0];
        const { data: overdueInstallments, error: overdueError } = await supabase
          .from("installments")
          .select("id")
          .in("status", ["نشط", "متأخر"])
          .lt("next_payment_date", currentDate);

      if (overdueError) throw overdueError;

      const overduePayments = overdueInstallments?.length || 0;

      return {
        totalDebts,
        totalInstallments,
        activeCustomers,
        overduePayments,
      };
    },
  });
};
