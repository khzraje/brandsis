import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencySettings {
  currency: string;
}

export const useCurrencySettings = () => {
  return useQuery({
    queryKey: ["currency-settings"],
    queryFn: async (): Promise<CurrencySettings> => {
      try {
        // أولاً نحاول جلب الإعداد الموجود
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "currency")
          .single();

        if (error) {
          // إذا لم يوجد إعداد، نحاول إنشاؤه
          if (error.code === 'PGRST116') {
            console.log("Currency settings not found, creating default settings");

            // إدراج جميع الإعدادات الافتراضية
            const defaultSettings = [
              { key: "currency", value: "IQD", description: "العملة المستخدمة في التطبيق" },
              { key: "app_theme", value: "light", description: "سمة التطبيق" },
              { key: "primary_color", value: "#2563eb", description: "اللون الأساسي" },
              { key: "notification_enabled", value: "true", description: "تمكين الإشعارات" },
              { key: "telegram_enabled", value: "false", description: "تمكين تليجرام" },
              { key: "telegram_bot_token", value: "", description: "رمز البوت" },
              { key: "telegram_chat_id", value: "", description: "معرف المحادثة" }
            ];

            for (const setting of defaultSettings) {
              const { error: insertError } = await supabase
                .from("settings")
                .upsert(setting, {
                  onConflict: 'key'
                });

              if (insertError) {
                console.error(`Error creating default setting ${setting.key}:`, insertError);
              }
            }
          } else {
            console.log("Error fetching currency settings:", error.message);
          }
          return { currency: "IQD" };
        }

        return { currency: data?.value as string || "IQD" };
      } catch (error) {
        console.error("Error fetching currency settings:", error);
        return { currency: "IQD" };
      }
    },
    // إعادة المحاولة في حالة فشل الاستعلام
    retry: 1,
    // قيمة افتراضية أثناء التحميل
    initialData: { currency: "IQD" }
  });
};

export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case "IQD":
      return "د.ع";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    default:
      return "د.ع";
  }
};

export const getCurrencyName = (currency: string): string => {
  switch (currency) {
    case "IQD":
      return "دينار عراقي";
    case "USD":
      return "دولار أمريكي";
    default:
      return "دينار عراقي";
  }
};

export const formatCurrency = (amount: number | undefined | null, currency: string | undefined): string => {
  // التحقق من أن المبلغ صحيح
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 " + getCurrencySymbol(currency || "IQD");
  }

  // التحقق من أن العملة صحيحة
  const validCurrency = currency || "IQD";
  const symbol = getCurrencySymbol(validCurrency);

  // تنسيق موحد لجميع العملات - بدون أرقام عشرية إلا إذا كانت مطلوبة
  const isInteger = amount % 1 === 0; // التحقق من أن الرقم صحيح

  if (validCurrency === "IQD") {
    // تنسيق خاص للدينار العراقي
    const integerAmount = Math.round(amount);
    const formattedAmount = integerAmount.toLocaleString('ar-IQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return `${formattedAmount} ${symbol}`;
  } else {
    // تنسيق للعملات الأخرى - بدون أرقام عشرية إلا إذا كانت مطلوبة
    if (isInteger) {
      // إذا كان الرقم صحيحاً، لا نعرض الأرقام العشرية
      return `${symbol}${Math.round(amount).toLocaleString('en-US')}`;
    } else {
      // إذا كان الرقم عشرياً، نعرض رقمين عشريين كحد أقصى
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
  }
};
