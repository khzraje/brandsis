import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecentDebt {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: string;
}

export const useRecentDebts = () => {
  return useQuery({
    queryKey: ["recent-debts"],
    queryFn: async (): Promise<RecentDebt[]> => {
      const { data, error } = await supabase
        .from("debts")
        .select(`
          id,
          amount,
          debt_date,
          status,
          customers (
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data?.map(debt => ({
        id: debt.id,
        customer: debt.customers?.name || "غير محدد",
        amount: debt.amount,
        date: debt.debt_date || debt.created_at?.split('T')[0] || "",
        status: debt.status,
      })) || [];
    },
  });
};
