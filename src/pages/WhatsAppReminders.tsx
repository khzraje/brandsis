import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencySettings, getCurrencySymbol } from "@/hooks/use-currency-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Settings,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  X
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from '../lib/translations';

interface UpcomingDebt {
  id: string;
  customer_name: string;
  customer_phone?: string;
  whatsapp_number?: string;
  amount: number;
  currency?: string;
  due_date: string;
  days_overdue: number;
  description?: string;
  customer_whatsapp_enabled?: boolean;
}

interface UpcomingInstallment {
  id: string;
  customer_name: string;
  customer_phone?: string;
  whatsapp_number?: string;
  product_name: string;
  monthly_amount: number;
  currency?: string;
  next_payment_date: string;
  days_until_due: number;
  status: string;
  customer_whatsapp_enabled?: boolean;
}

interface WhatsAppSettings {
  whatsapp_enabled: boolean;
  whatsapp_api_url: string;
  whatsapp_api_key: string;
  whatsapp_sender_number: string;
  whatsapp_reminder_days: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  whatsapp_number?: string;
  whatsapp_enabled?: boolean;
}

const WhatsAppReminders = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeInstallment, setActiveInstallment] = useState<UpcomingInstallment | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [settings, setSettings] = useState<WhatsAppSettings>({
    whatsapp_enabled: false,
    whatsapp_api_url: "",
    whatsapp_api_key: "",
    whatsapp_sender_number: "",
    whatsapp_reminder_days: 3
  });
  const [messageLanguage, setMessageLanguage] = useState<'ar' | 'ku'>('ar');

  const { data: currencySettings } = useCurrencySettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

  // إذا لم توجد قيمة للمفتاح، سنستخدم هذا المفتاح الجديد ونحفظه في الإعدادات
  const DEFAULT_WHATSAPP_API_KEY = '63fb74c7b6fa464677beae0da80393ed71b33d8b424f9f8c268525f72f77d97c';

  // جلب إعدادات WhatsApp
  const { data: whatsappSettings } = useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: async () => {
      const settingsKeys = [
        'whatsapp_enabled',
        'whatsapp_api_url',
        'whatsapp_api_key',
        'whatsapp_sender_number',
        'whatsapp_reminder_days'
      ];

      const dataResp = await supabase
        .from('settings')
        .select('key, value')
        .in('key', settingsKeys) as unknown;
      const resp = dataResp as { data?: unknown; error?: unknown };
      let data = resp.data;
      const error = resp.error;

      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }

      // إذا لم تكن الإعدادات موجودة، أضفها
      if (!data || (data as { key: string; value: string }[]).length === 0) {
        console.log('Settings not found, creating default settings...');
        const defaultSettings = [
          { key: 'whatsapp_enabled', value: 'false', description: 'تمكين الواتساب' },
          { key: 'whatsapp_api_url', value: '', description: 'رابط API الواتساب' },
          { key: 'whatsapp_api_key', value: '', description: 'مفتاح API الواتساب' },
          { key: 'whatsapp_sender_number', value: '', description: 'رقم المرسل' },
          { key: 'whatsapp_reminder_days', value: '3', description: 'عدد الأيام قبل الاستحقاق للتنبيه' }
        ];

        const promises = defaultSettings.map(setting =>
          supabase
            .from('settings')
            .upsert(setting, { onConflict: 'key' })
        );

        await Promise.all(promises);

        // استرجاع الإعدادات بعد إضافتها
        const { data: newData, error: newError } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', settingsKeys);

        if (newError) throw newError;
        data = newData;
      }

      const settingsMap = (data as { key: string; value: string }[])?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>) || {};

      const settings: WhatsAppSettings = {
        whatsapp_enabled: settingsMap.whatsapp_enabled === 'true',
        whatsapp_api_url: settingsMap.whatsapp_api_url || "",
        whatsapp_api_key: settingsMap.whatsapp_api_key || "",
        whatsapp_sender_number: settingsMap.whatsapp_sender_number || "",
        whatsapp_reminder_days: parseInt(settingsMap.whatsapp_reminder_days || "3")
      };

      console.log('Loaded WhatsApp settings:', settings);
      return settings;
    }
  });

  // جلب الأقساط المستحقة قريباً
  const { data: upcomingInstallments, isLoading } = useQuery({
    queryKey: ["upcoming-installments-whatsapp"],
    queryFn: async (): Promise<UpcomingInstallment[]> => {
      const reminderDays = settings.whatsapp_reminder_days;
      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + reminderDays);

      const { data, error } = await supabase
        .from("installments")
        .select(`
          id,
          product_name,
          monthly_amount,
          currency,
          next_payment_date,
          status,
          customers!inner (
            name,
            phone,
            whatsapp_number,
            whatsapp_enabled
          )
        `)
        .in("status", ["نشط", "متأخر"])
        .or(`and(status.eq.نشط,next_payment_date.gte.${currentDate.toISOString().split('T')[0]},next_payment_date.lte.${futureDate.toISOString().split('T')[0]}),status.eq.متأخر`)
        .eq('customers.whatsapp_enabled', true)
        .order("next_payment_date", { ascending: true });

      if (error) throw error;

      return Array.isArray(data) ? data.map(installment => {
        const nextPaymentDate = new Date(installment.next_payment_date);
        const daysUntilDue = Math.ceil((nextPaymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        // معالجة الحقول غير الموجودة
        const customerObj = installment.customers || {};
        return {
          id: installment.id,
          customer_name: customerObj.name || "غير محدد",
          customer_phone: customerObj.phone || "",
          whatsapp_number: (customerObj.whatsapp_number ?? customerObj.phone ?? ""),
          product_name: installment.product_name,
          monthly_amount: installment.monthly_amount,
          currency: installment.currency || "IQD",
          next_payment_date: installment.next_payment_date,
          days_until_due: daysUntilDue,
          status: installment.status,
          customer_whatsapp_enabled: customerObj.whatsapp_enabled
        };
      }) : [];
    },
    enabled: !!settings.whatsapp_reminder_days
  });

  // جلب الديون المتأخرة
  const { data: overdueDebts, isLoading: debtsLoading } = useQuery({
    queryKey: ["overdue-debts-whatsapp"],
    queryFn: async (): Promise<UpcomingDebt[]> => {
      const { data, error } = await supabase
        .from("debts")
        .select(`
          id,
          amount,
          currency,
          due_date,
          description,
          status,
          customers!inner (
            name,
            phone,
            whatsapp_number,
            whatsapp_enabled
          )
        `)
        .not('due_date', 'is', null)
        .neq("status", "مكتمل")
        .eq('customers.whatsapp_enabled', true)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // تصفية الديون المتأخرة بناءً على تاريخ الاستحقاق الفعلي
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // إزالة الوقت للمقارنة الصحيحة

      const filteredOverdueDebts = Array.isArray(data) ? data.filter(debt => {
        if (!debt.due_date) return false;
        const dueDate = new Date(debt.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < currentDate;
      }) : [];

      return filteredOverdueDebts.map(debt => {
        const dueDate = new Date(debt.due_date);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: debt.id,
          customer_name: debt.customers.name || "غير محدد",
          customer_phone: debt.customers.phone || "",
          whatsapp_number: (debt.customers.whatsapp_number ?? debt.customers.phone ?? ""),
          amount: debt.amount,
          currency: debt.currency || "IQD",
          due_date: debt.due_date,
          days_overdue: daysOverdue,
          description: debt.description || "",
          customer_whatsapp_enabled: debt.customers.whatsapp_enabled
        };
      });
    }
  });

  // جلب قائمة العملاء (لكي تظهر في قائمة الإرسال الفردي)
  const { data: customersList } = useQuery<Customer[]>({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp_number, whatsapp_enabled')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as Customer[]) || [];
    }
  });

  // (قوالب الرسائل أُلغيت — لا حاجة لاستعلامها)

  // تحديث إعدادات WhatsApp
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: WhatsAppSettings) => {
      const settingsToUpdate = [
        { key: 'whatsapp_enabled', value: newSettings.whatsapp_enabled ? 'true' : 'false' },
        { key: 'whatsapp_api_url', value: newSettings.whatsapp_api_url },
        { key: 'whatsapp_api_key', value: newSettings.whatsapp_api_key },
        { key: 'whatsapp_sender_number', value: newSettings.whatsapp_sender_number },
        { key: 'whatsapp_reminder_days', value: newSettings.whatsapp_reminder_days.toString() }
      ];

      const promises = settingsToUpdate.map(setting =>
        supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' })
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات WhatsApp بنجاح",
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    }
  });

  // إرسال تنبيه واحد
  const sendReminderMutation = useMutation({
    mutationFn: async (params: { installment: UpcomingInstallment; messageOverride?: string }) => {
      const { installment, messageOverride } = params;
      if (!settings.whatsapp_api_url || !settings.whatsapp_api_key || !settings.whatsapp_sender_number) {
        throw new Error("إعدادات WhatsApp غير مكتملة");
      }

      const to = installment.whatsapp_number || installment.customer_phone;
      if (!to) throw new Error("لا يوجد رقم مستلم لإرسال الرسالة");

      // تنظيف رقم الهاتف
      const cleanPhoneNumber = to.replace(/\D/g, '');
      const formattedPhone = cleanPhoneNumber.startsWith('964') ? cleanPhoneNumber : 
                           cleanPhoneNumber.startsWith('0') ? '964' + cleanPhoneNumber.substring(1) : 
                           '964' + cleanPhoneNumber;

      const defaultMessage = getTranslation(messageLanguage)['whatsappReminderMessage']
        .replace('{customer_name}', installment.customer_name)
        .replace('{product_name}', installment.product_name)
        .replace('{amount}', installment.monthly_amount.toLocaleString())
        .replace('{currency}', getCurrencySymbol(installment.currency || currencySettings?.currency) || 'د.ع')
        .replace('{due_date}', format(new Date(installment.next_payment_date), messageLanguage === 'ar' ? "dd/MM/yyyy" : "yyyy/MM/dd"))
        .replace('{days_left}', installment.days_until_due.toString());

      const message = messageOverride ?? defaultMessage;

      const apiUrl = settings.whatsapp_api_url;
      const apiKey = settings.whatsapp_api_key;

      // helper to post and return response & status
      const doPost = async (url: string, bodyObj: Record<string, unknown>, headers: Record<string,string> = {}) => {
        console.log('Sending to', url, 'headers', headers, 'body', bodyObj);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(bodyObj)
        });
        const text = await res.text().catch(() => '');
        let json: unknown = undefined;
        try { json = text ? JSON.parse(text) : undefined; } catch (e) { json = text; }
        if (!res.ok) {
          // throw a structured error object so callers can inspect status/body
          throw { message: `API error ${res.status}: ${text}`, status: res.status, body: json } as const;
        }
        return { status: res.status, body: json } as const;
      };

      // candidate payload shapes to try for wasenderapi
      const candidates = [
        // wasenderapi expects { to, text } with Authorization Bearer
        { obj: { to: formattedPhone, text: message }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false },
        // alternative format
        { obj: { phone: formattedPhone, message: message, sender: settings.whatsapp_sender_number }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false },
        // simple format
        { obj: { number: formattedPhone, body: message }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false }
      ];

      // try candidates in order; if apiUrl not wasenderapi, still attempt first Authorization variant
      let lastError: unknown = null;
      const asApiError = (e: unknown): { status?: number; body?: unknown; message?: string } => {
        if (e && typeof e === 'object') {
          const rec = e as Record<string, unknown>;
          return {
            status: typeof rec['status'] === 'number' ? (rec['status'] as number) : undefined,
            body: rec['body'],
            message: typeof rec['message'] === 'string' ? (rec['message'] as string) : undefined
          };
        }
        return { message: typeof e === 'string' ? e : undefined };
      };

      for (const c of candidates) {
        // if candidate requires query key and apiUrl doesn't include wasenderapi, skip
        if (c.useQueryKey && !apiUrl.includes('wasenderapi.com')) continue;

        const targetUrl = c.useQueryKey ? `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}` : apiUrl;
        try {
          const res = await doPost(targetUrl, c.obj as Record<string, unknown>, c.headers);
          console.log('Send success', res);
          return installment;
        } catch (err) {
          lastError = err;
          const info = asApiError(err);
          // if a 422 or 429, continue to try next candidate; otherwise rethrow
          if (info.status && (info.status === 422 || info.status === 429)) {
            console.log(`Retrying with different format after ${info.status} error`);
            // انتظار أطول قبل المحاولة التالية
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          // for other errors, rethrow immediately
          throw err;
        }
      }

      // all attempts failed
      if (lastError) {
        const info = asApiError(lastError);
        if (info.status === 429) {
          throw new Error("تم تجاوز حد الإرسال. يرجى الانتظار دقيقة كاملة قبل إرسال رسالة أخرى.");
        } else if (info.status === 401) {
          throw new Error("مفتاح API غير صحيح أو منتهي الصلاحية. يرجى التحقق من إعدادات API.");
        } else if (info.status === 422) {
          throw new Error("خطأ في تنسيق البيانات. يرجى التحقق من رقم الهاتف والرسالة.");
        } else {
          const bodyText = info.body ? JSON.stringify(info.body) : info.message || String(lastError);
          throw new Error(`خطأ في الإرسال (${info.status || 'غير معروف'}): ${bodyText}`);
        }
      }

      return installment;
    },
    onSuccess: (installment) => {
      toast({
        title: "تم الإرسال",
        description: `تم إرسال التنبيه إلى ${installment.customer_name}`,
      });
    },
    onError: (error) => {
      console.error('WhatsApp send error:', error);
      let errorMessage = error.message;

      if (error.message.includes('429')) {
        errorMessage = "تم تجاوز حد الإرسال. يرجى الانتظار دقيقة كاملة قبل إرسال رسالة أخرى.";
      } else if (error.message.includes('401')) {
        errorMessage = "مفتاح API غير صحيح أو منتهي الصلاحية. يرجى التحقق من إعدادات API.";
      } else if (error.message.includes('422')) {
        errorMessage = "خطأ في تنسيق البيانات. يرجى التحقق من رقم الهاتف والرسالة.";
      } else if (error.message.includes('account protection')) {
        errorMessage = "حماية الحساب مفعلة. يرجى تعطيل حماية الحساب في لوحة تحكم API.";
      }

      toast({
        title: "خطأ في الإرسال",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // إرسال تنبيهات جماعية
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkSendController, setBulkSendController] = useState<AbortController | null>(null);

  const sendBulkRemindersMutation = useMutation({
    mutationFn: async () => {
      const installmentsWithWhatsApp = upcomingInstallments?.filter(inst => inst.whatsapp_number && inst.customer_whatsapp_enabled !== false) || [];

      if (installmentsWithWhatsApp.length === 0) {
        throw new Error("لا توجد أقساط لها رقم WhatsApp نشط");
      }

      setIsBulkSending(true);
      const controller = new AbortController();
      setBulkSendController(controller);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      try {
        // إرسال التنبيهات واحداً تلو الآخر مع تأخير أكبر
        for (let i = 0; i < installmentsWithWhatsApp.length; i++) {
          // التحقق من إلغاء العملية
          if (controller.signal.aborted) {
            throw new Error("تم إلغاء الإرسال الجماعي");
          }

          const installment = installmentsWithWhatsApp[i];

          try {
            await sendReminderMutation.mutateAsync({ installment });
            successCount++;

            // انتظار 15 ثانية بين كل رسالة لتجنب تجاوز الحدود
            if (i < installmentsWithWhatsApp.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 15000));
            }
          } catch (error: unknown) {
            errorCount++;
            const errorMessage = (error as Error)?.message || 'خطأ غير معروف';
            errors.push(`${installment.customer_name}: ${errorMessage}`);

            // إيقاف الإرسال في حالة خطأ 401
            if (errorMessage.includes('401') || errorMessage.includes('مفتاح API غير صحيح')) {
              throw new Error(`تم إيقاف الإرسال بسبب خطأ في مفتاح API: ${errorMessage}`);
            }

            // انتظار أطول في حالة خطأ 429
            if (errorMessage.includes('429') || errorMessage.includes('تجاوز حد الإرسال')) {
              console.log('Rate limit hit, waiting 60 seconds...');
              await new Promise(resolve => setTimeout(resolve, 60000));
              i--; // إعادة المحاولة لنفس الرسالة
              continue;
            }

            // انتظار أطول في حالة أخطاء أخرى
            console.log('Other error, waiting 15 seconds...');
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }

        if (errorCount > 0) {
          throw new Error(`تم إرسال ${successCount} رسالة بنجاح، فشل ${errorCount}: ${errors.join(', ')}`);
        }

        return successCount;
      } finally {
        setIsBulkSending(false);
        setBulkSendController(null);
      }
    },
    onSuccess: (count) => {
      toast({
        title: "تم الإرسال الجماعي",
        description: `تم إرسال ${count} تنبيه بنجاح`,
      });
    },
    onError: (error) => {
      console.error('Bulk send error:', error);
      toast({
        title: "خطأ في الإرسال الجماعي",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (whatsappSettings) {
      // إذا كان الحقل فارغاً، نملأه بالمفتاح الجديد ونحفظ الإعدادات تلقائياً
      if (!whatsappSettings.whatsapp_api_key) {
        const patched = { ...whatsappSettings, whatsapp_api_key: DEFAULT_WHATSAPP_API_KEY };
        setSettings(patched);
        try {
          updateSettingsMutation.mutate(patched);
        } catch (e) {
          // ignore
        }
      } else {
        setSettings(whatsappSettings);
      }
    }
  }, [whatsappSettings, updateSettingsMutation]);

  useEffect(() => {
    const saved = localStorage.getItem('whatsapp_message_language');
    if (saved === 'ar' || saved === 'ku') {
      setMessageLanguage(saved);
    }
  }, []);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleMessageLanguageChange = (lang: 'ar' | 'ku') => {
    setMessageLanguage(lang);
    localStorage.setItem('whatsapp_message_language', lang);
  };

  // اختيار يدوي لإرسال رسالة فردية
  const [manualRecipient, setManualRecipient] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");


  const getStatusColor = (days: number) => {
    if (days <= 1) return "destructive";
    if (days <= 3) return "warning";
    return "secondary";
  };

  const getStatusIcon = (days: number) => {
    if (days <= 1) return <AlertTriangle className="h-4 w-4" />;
    if (days <= 3) return <Clock className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  return (
    <>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('whatsappRemindersTitle')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('whatsappRemindersTitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* تنبيهات مهمة */}
        <Card className="card-elegant border-warning">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>تنبيهات مهمة</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>حدود الإرسال:</strong> يمكن إرسال رسالة واحدة كل 10 ثواني كحد أقصى
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>خطأ 401:</strong> مفتاح API منتهي الصلاحية أو غير صحيح
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>خطأ 429:</strong> تجاوز حد الطلبات، انتظر دقيقة كاملة
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        {/* إعدادات WhatsApp */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>{t('appSettings')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* قوالب الرسائل أُزيلت بناءً على طلب المستخدم */}
            <div className="flex items-center justify-between">
              <div className="text-right">
                <Label htmlFor="whatsapp-enabled">تمكين WhatsApp</Label>
              </div>
              <div>
                <Switch
                  id="whatsapp-enabled"
                  aria-label="تمكين WhatsApp"
                  checked={settings.whatsapp_enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, whatsapp_enabled: checked }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="api-url">رابط API الواتساب</Label>
              <Input
                id="api-url"
                value={settings.whatsapp_api_url}
                onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_api_url: e.target.value }))}
                placeholder="https://api.whatsapp.com/..."
              />
            </div>

            <div>
              <Label htmlFor="api-key">مفتاح API</Label>
              <div className="flex space-x-reverse space-x-2">
                <Input
                  id="api-key"
                  type="password"
                  value={settings.whatsapp_api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                  placeholder="أدخل مفتاح API"
                  className="flex-1"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, whatsapp_api_key: '' }))}
                  title="مسح مفتاح API"
                >
                  🗑️
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="sender-number">رقم المرسل</Label>
              <Input
                id="sender-number"
                value={settings.whatsapp_sender_number}
                onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_sender_number: e.target.value }))}
                placeholder="+964XXXXXXXXXX"
              />
            </div>

            <div>
              <Label htmlFor="reminder-days">عدد الأيام قبل التنبيه</Label>
              <Input
                id="reminder-days"
                type="number"
                min="1"
                max="30"
                value={settings.whatsapp_reminder_days}
                onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_reminder_days: parseInt(e.target.value) || 3 }))}
              />
            </div>

            <div>
              <Label htmlFor="message-language">لغة الرسالة</Label>
              <select
                id="message-language"
                value={messageLanguage}
                onChange={(e) => handleMessageLanguageChange(e.target.value as 'ar' | 'ku')}
                className="w-full rounded-md border px-2 py-1"
              >
                <option value="ar">العربية</option>
                <option value="ku">کوردیی سۆرانی</option>
              </select>
            </div>

            <Button
              onClick={handleSaveSettings}
              className="w-full btn-primary"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                if (!settings.whatsapp_api_url || !settings.whatsapp_api_key) {
                  toast({
                    title: "خطأ",
                    description: "يرجى إكمال إعدادات API أولاً",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  // اختبار الاتصال بإرسال طلب بسيط
                  const testResponse = await fetch(`${settings.whatsapp_api_url}?api_key=${encodeURIComponent(settings.whatsapp_api_key)}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                  });

                  if (testResponse.ok) {
                    toast({
                      title: "نجح الاختبار",
                      description: "الاتصال بـ API يعمل بشكل صحيح",
                    });
                  } else if (testResponse.status === 401) {
                    toast({
                      title: "خطأ في API",
                      description: "مفتاح API غير صحيح",
                      variant: "destructive"
                    });
                  } else {
                    toast({
                      title: "خطأ في API",
                      description: `خطأ ${testResponse.status}: ${testResponse.statusText}`,
                      variant: "destructive"
                    });
                  }
                } catch (error) {
                  toast({
                    title: "خطأ في الاتصال",
                    description: "فشل في الاتصال بـ API",
                    variant: "destructive"
                  });
                }
              }}
            >
              اختبار الاتصال بـ API
            </Button>
          </CardContent>
        </Card>

        {/* إرسال فردي (اختياري) */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <Send className="h-5 w-5 text-accent" />
              <span>{language === 'ar' ? 'إرسال فردي (اختياري)' : 'ناردنی تاکەکەسی (هەڵبژاردەیی)'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('customers')}</Label>
              <select
                className="w-full rounded-md border px-2 py-1"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- {t('search')} --</option>
                {customersList?.map((c: Customer) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.whatsapp_number || c.phone || 'بدون رقم'} 
                    {c.whatsapp_enabled === false && ' (معطل)'}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">{t('customersLoaded').replace('{count}', String(customersList?.length || 0))}</p>
            </div>

            {/* قوالب الرسائل أزيلت من واجهة الإرسال الفردي */}

            <div>
              <Label>{t('manualNumberLabel')}</Label>
              <Input value={manualRecipient} onChange={(e) => setManualRecipient(e.target.value)} placeholder="+964XXXXXXXXXX" />
            </div>

              <Button
              onClick={() => {
                // حدد المستلم: إذا تم اختيار عميل نستخدم رقمه، وإلا نستخدم الرقم اليدوي
                let target: string | undefined;
                if (selectedCustomerId) {
                  const cust = customersList?.find((c: Customer) => c.id === selectedCustomerId);
                  // create an UpcomingInstallment-like object if customer selected
                  const temp: UpcomingInstallment = {
                    id: cust.id,
                    customer_name: cust.name,
                    customer_phone: cust.phone,
                    whatsapp_number: cust.whatsapp_number || cust.phone, // استخدام whatsapp_number أو رقم الهاتف
                    product_name: '',
                    monthly_amount: 0,
                    next_payment_date: new Date().toISOString(),
                    days_until_due: 0,
                    status: '',
                    customer_whatsapp_enabled: cust.whatsapp_enabled
                  };
                  setActiveInstallment(temp);
                  target = cust?.whatsapp_number || cust?.phone; // استخدام whatsapp_number أو رقم الهاتف
                } else if (manualRecipient) {
                  // نخلق كائن مؤقت من النوع UpcomingInstallment لتعبئة الحقول المطلوبة
                  const temp: UpcomingInstallment = {
                    id: 'manual',
                    customer_name: manualRecipient,
                    customer_phone: manualRecipient,
                    whatsapp_number: manualRecipient,
                    product_name: '',
                    monthly_amount: 0,
                    next_payment_date: new Date().toISOString(),
                    days_until_due: 0,
                    status: '',
                    customer_whatsapp_enabled: true // الإرسال اليدوي يُعتبر نشط دائماً
                  };
                  setActiveInstallment(temp);
                  target = manualRecipient;
                }

                if (!target) {
                  toast({ title: t('error'), description: t('invalidPhone'), variant: 'destructive' });
                  return;
                }

                // التحقق من حالة العميل إذا تم اختياره من القائمة
                if (selectedCustomerId) {
                  const selectedCustomer = customersList?.find((c: Customer) => c.id === selectedCustomerId);
                  if (selectedCustomer && selectedCustomer.whatsapp_enabled === false) {
                    toast({ 
                      title: t('warning'), 
                      description: 'هذا العميل معطل من تلقي رسائل WhatsApp', 
                      variant: 'destructive' 
                    });
                    return;
                  }
                }

                const defaultMessage = getTranslation(messageLanguage)['whatsappReminderMessage']
                  .replace('{customer_name}', activeInstallment?.customer_name || target)
                  .replace('{product_name}', '')
                  .replace('{amount}', '0')
                  .replace('{currency}', getCurrencySymbol(activeInstallment?.currency || currencySettings?.currency) || '')
                  .replace('{due_date}', format(new Date(), messageLanguage === 'ar' ? 'dd/MM/yyyy' : 'yyyy/MM/dd'))
                  .replace('{days_left}', '0');
                setCustomMessage(defaultMessage);
                setDialogOpen(true);
              }}
              className="w-full"
              disabled={!selectedCustomerId && !manualRecipient}
            >
              {t('openMessage')}
            </Button>
          </CardContent>
        </Card>

        {/* إحصائيات سريعة */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <span>{t('total')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي الأقساط المستحقة:</span>
              <Badge variant="secondary">
                {upcomingInstallments?.length || 0}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">لها رقم WhatsApp نشط:</span>
              <Badge variant="secondary">
                {upcomingInstallments?.filter(inst => inst.whatsapp_number && inst.customer_whatsapp_enabled !== false).length || 0}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">مستحقة اليوم:</span>
              <Badge variant="destructive">
                {upcomingInstallments?.filter(inst => inst.days_until_due <= 1).length || 0}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي الديون المتأخرة:</span>
              <Badge variant="destructive">
                {overdueDebts?.length || 0}
              </Badge>
            </div>

            <Separator />

            <Button
              onClick={() => sendBulkRemindersMutation.mutate()}
              className="w-full"
              disabled={!settings.whatsapp_enabled || sendBulkRemindersMutation.isPending || isBulkSending}
            >
              <Send className="w-4 h-4 ml-2" />
              {sendBulkRemindersMutation.isPending || isBulkSending ? "جاري الإرسال..." : "إرسال تنبيهات جماعية"}
            </Button>

            {isBulkSending && (
              <Button
                onClick={() => {
                  if (bulkSendController) {
                    bulkSendController.abort();
                    setIsBulkSending(false);
                    setBulkSendController(null);
                    toast({
                      title: "تم الإلغاء",
                      description: "تم إلغاء الإرسال الجماعي",
                    });
                  }
                }}
                variant="destructive"
                className="w-full"
              >
                <X className="w-4 h-4 ml-2" />
                إيقاف الإرسال الجماعي
              </Button>
            )}

            <Button
              onClick={() => {
                const installmentsWithWhatsApp = upcomingInstallments?.filter(inst => inst.whatsapp_number && inst.customer_whatsapp_enabled !== false) || [];
                if (installmentsWithWhatsApp.length === 0) {
                  toast({ title: "لا توجد أقساط", description: "لا توجد أقساط مستحقة لها رقم WhatsApp نشط", variant: "destructive" });
                  return;
                }

                // إرسال تنبيهات الأقساط مع فترات انتظار
                (async () => {
                  for (let i = 0; i < installmentsWithWhatsApp.length; i++) {
                    const installment = installmentsWithWhatsApp[i];
                    const message = getTranslation(messageLanguage)['installmentReminderMessage']
                      .replace('{customer_name}', installment.customer_name)
                      .replace('{amount}', installment.monthly_amount.toLocaleString())
                      .replace('{currency}', getCurrencySymbol(installment.currency || currencySettings?.currency))
                      .replace('{due_date}', format(new Date(installment.next_payment_date), messageLanguage === 'ar' ? "dd/MM/yyyy" : "yyyy/MM/dd"))
                      .replace('{days_until_due}', installment.days_until_due.toString())
                      .replace('{product_name}', installment.product_name)
                      .replace('{installment_number}', installment.installment_number.toString())
                      .replace('{total_installments}', installment.total_installments.toString());

                    try {
                      await sendReminderMutation.mutateAsync({
                        installment: installment,
                        messageOverride: message
                      });

                      // انتظار 15 ثانية بين كل رسالة
                      if (i < installmentsWithWhatsApp.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 15000));
                      }
                    } catch (error) {
                      console.error(`فشل إرسال التنبيه إلى ${installment.customer_name}:`, error);
                      // استمرار مع الرسالة التالية حتى لو فشلت إحداها
                    }
                  }

                  toast({ title: "تم الإرسال", description: `تم إرسال ${installmentsWithWhatsApp.length} تنبيه للأقساط المستحقة` });
                })();
              }}
              className="w-full mt-2"
              variant="secondary"
              disabled={!settings.whatsapp_enabled || sendReminderMutation.isPending}
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال تنبيهات الأقساط الفردية
            </Button>

            <Button
              onClick={() => {
                const debtsWithWhatsApp = overdueDebts?.filter(debt => debt.whatsapp_number && debt.customer_whatsapp_enabled !== false) || [];
                if (debtsWithWhatsApp.length === 0) {
                  toast({ title: "لا توجد ديون", description: "لا توجد ديون متأخرة لها رقم WhatsApp نشط", variant: "destructive" });
                  return;
                }

                // إرسال تنبيهات الديون مع فترات انتظار
                (async () => {
                  for (let i = 0; i < debtsWithWhatsApp.length; i++) {
                    const debt = debtsWithWhatsApp[i];
                    const message = getTranslation(messageLanguage)['overdueDebtMessage']
                      .replace('{customer_name}', debt.customer_name)
                      .replace('{amount}', debt.amount.toLocaleString())
                      .replace('{currency}', getCurrencySymbol(debt.currency || currencySettings?.currency))
                      .replace('{due_date}', format(new Date(debt.due_date), messageLanguage === 'ar' ? "dd/MM/yyyy" : "yyyy/MM/dd"))
                      .replace('{days_overdue}', debt.days_overdue.toString())
                      .replace('{description}', debt.description ? `📝 ${debt.description}\n\n` : '');

                    try {
                      await sendReminderMutation.mutateAsync({
                        installment: {
                          id: debt.id,
                          customer_name: debt.customer_name,
                          customer_phone: debt.customer_phone,
                          whatsapp_number: debt.whatsapp_number,
                          product_name: debt.description || 'دين',
                          monthly_amount: debt.amount,
                          next_payment_date: debt.due_date,
                          days_until_due: -debt.days_overdue,
                          status: 'متأخر',
                          customer_whatsapp_enabled: debt.customer_whatsapp_enabled
                        },
                        messageOverride: message
                      });

                      // انتظار 15 ثانية بين كل رسالة
                      if (i < debtsWithWhatsApp.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 15000));
                      }
                    } catch (error) {
                      console.error(`فشل إرسال التنبيه إلى ${debt.customer_name}:`, error);
                      // استمرار مع الرسالة التالية حتى لو فشلت إحداها
                    }
                  }

                  toast({ title: "تم الإرسال", description: `تم إرسال ${debtsWithWhatsApp.length} تنبيه للديون المتأخرة` });
                })();
              }}
              className="w-full mt-2"
              variant="destructive"
              disabled={!settings.whatsapp_enabled || sendReminderMutation.isPending}
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال تنبيهات الديون المتأخرة
            </Button>
          </CardContent>
        </Card>

        {/* تنبيهات الإعدادات */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>ملاحظات مهمة</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!settings.whatsapp_enabled && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  يجب تمكين WhatsApp أولاً لإرسال التنبيهات
                </AlertDescription>
              </Alert>
            )}

            {settings.whatsapp_enabled && (!settings.whatsapp_api_url || !settings.whatsapp_api_key) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  يرجى إكمال إعدادات API الواتساب
                </AlertDescription>
              </Alert>
            )}

            {settings.whatsapp_enabled && settings.whatsapp_api_key && settings.whatsapp_api_key.length < 20 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  مفتاح API يبدو غير صحيح. يرجى التحقق من مفتاح API الصحيح.
                </AlertDescription>
              </Alert>
            )}

            {upcomingInstallments?.filter(inst => !inst.whatsapp_number || inst.customer_whatsapp_enabled === false).length > 0 && (
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  {upcomingInstallments.filter(inst => !inst.whatsapp_number || inst.customer_whatsapp_enabled === false).length} عميل بدون رقم WhatsApp نشط
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              <p>• تأكد من إضافة أرقام WhatsApp للعملاء</p>
              <p>• تأكد من تفعيل العملاء لتلقي الرسائل</p>
              <p>• تحقق من صحة إعدادات API</p>
              <p>• اختبر الإرسال قبل الاستخدام الفعلي</p>
              <p>• انتظر دقيقة كاملة بين كل رسالة لتجنب تجاوز الحدود</p>
              <p>• في حالة خطأ 401، تحقق من تجديد مفتاح API</p>
              <p>• استخدم زر الإيقاف لإلغاء الإرسال الجماعي في أي وقت</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الديون المتأخرة */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>الديون المتأخرة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debtsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">جاري تحميل الديون المتأخرة...</p>
            </div>
          ) : overdueDebts?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد ديون متأخرة</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {overdueDebts?.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg hover:bg-destructive/5 transition-colors"
                  >
                    <div className="flex items-center space-x-reverse space-x-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="font-medium">{debt.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {debt.amount.toLocaleString()} {getCurrencySymbol(debt.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          متأخر {debt.days_overdue} يوم • {format(new Date(debt.due_date), "yyyy/MM/dd")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-reverse space-x-2">
                      {debt.whatsapp_number && debt.customer_whatsapp_enabled !== false ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const defaultMessage = getTranslation(messageLanguage)['overdueDebtMessage']
                              .replace('{customer_name}', debt.customer_name)
                              .replace('{amount}', debt.amount.toLocaleString())
                              .replace('{currency}', getCurrencySymbol(debt.currency || currencySettings?.currency))
                              .replace('{due_date}', format(new Date(debt.due_date), messageLanguage === 'ar' ? "dd/MM/yyyy" : "yyyy/MM/dd"))
                              .replace('{days_overdue}', debt.days_overdue.toString())
                              .replace('{description}', debt.description ? `📝 ${debt.description}\n\n` : '');
                            setActiveInstallment({
                              id: debt.id,
                              customer_name: debt.customer_name,
                              customer_phone: debt.customer_phone,
                              whatsapp_number: debt.whatsapp_number,
                              product_name: debt.description || 'دين',
                              monthly_amount: debt.amount,
                              next_payment_date: debt.due_date,
                              days_until_due: -debt.days_overdue,
                              status: 'متأخر',
                              customer_whatsapp_enabled: debt.customer_whatsapp_enabled
                            });
                            setCustomMessage(defaultMessage);
                            setDialogOpen(true);
                          }}
                          disabled={sendReminderMutation.isPending}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {debt.customer_whatsapp_enabled === false ? 'معطل' : 'بدون رقم'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
    {/* رسالة فردية - حوار */}
    <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'إرسال رسالة فردية' : 'ناردنی نامەی تاکەکەسی'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'عدل الرسالة ثم اضغط إرسال.' : 'نامەکە بگۆڕە و پاشان کلیکی ناردن بکە.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Textarea value={customMessage} onChange={(e) => setCustomMessage((e.target as HTMLTextAreaElement).value)} />
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={async () => {
              if (!activeInstallment) return;
              try {
                await sendReminderMutation.mutateAsync({ installment: activeInstallment, messageOverride: customMessage });
                setDialogOpen(false);
              } catch (err) {
                // error handled by mutation onError
              }
            }}
            disabled={sendReminderMutation.isPending}
          >
            {t('send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default WhatsAppReminders;
