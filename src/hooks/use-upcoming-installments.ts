import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UpcomingInstallment {
  id: string;
  customer: string;
  amount: number;
  dueDate: string;
  product: string;
}

export const useUpcomingInstallments = () => {
  return useQuery({
    queryKey: ["upcoming-installments"],
    queryFn: async (): Promise<UpcomingInstallment[]> => {
      const currentDate = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // الأقساط في الـ30 يوم القادمة
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("installments")
        .select(`
          id,
          monthly_amount,
          next_payment_date,
          product_name,
          customers (
            name
          )
        `)
        .eq("status", "نشط")
        .gte("next_payment_date", currentDate)
        .lte("next_payment_date", futureDateStr)
        .order("next_payment_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      return data?.map(installment => ({
        id: installment.id,
        customer: installment.customers?.name || "غير محدد",
        amount: installment.monthly_amount,
        dueDate: installment.next_payment_date,
        product: installment.product_name,
      })) || [];
    },
  });
};
