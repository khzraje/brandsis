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
  Phone
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UpcomingInstallment {
  id: string;
  customer_name: string;
  customer_phone?: string;
  whatsapp_number?: string;
  product_name: string;
  monthly_amount: number;
  next_payment_date: string;
  days_until_due: number;
  status: string;
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
      if (!data || data.length === 0) {
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

      const settingsMap = data?.reduce((acc, setting) => {
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
          next_payment_date,
          status,
          whatsapp_number,
          customers!inner (
            name,
            phone
          )
        `)
        .in("status", ["نشط", "متأخر"])
        .or(`and(status.eq.نشط,next_payment_date.gte.${currentDate.toISOString().split('T')[0]},next_payment_date.lte.${futureDate.toISOString().split('T')[0]}),status.eq.متأخر`)
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
          whatsapp_number: (installment.whatsapp_number ?? customerObj.whatsapp_number ?? customerObj.phone ?? ""),
          product_name: installment.product_name,
          monthly_amount: installment.monthly_amount,
          next_payment_date: installment.next_payment_date,
          days_until_due: daysUntilDue,
          status: installment.status
        };
      }) : [];
    },
    enabled: !!settings.whatsapp_reminder_days
  });

  // جلب قائمة العملاء (لكي تظهر في قائمة الإرسال الفردي)
  const { data: customersList } = useQuery<Customer[]>({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp_number')
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

      const defaultMessage = t('whatsappReminderMessage')
        .replace('{customer_name}', installment.customer_name)
        .replace('{product_name}', installment.product_name)
        .replace('{amount}', installment.monthly_amount.toLocaleString())
        .replace('{currency}', getCurrencySymbol(currencySettings?.currency) || 'د.ع')
        .replace('{due_date}', format(new Date(installment.next_payment_date), language === 'ar' ? "dd/MM/yyyy" : "yyyy/MM/dd"))
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
        { obj: { to, text: message }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false },
        // common alternatives
        { obj: { to, message, sender: settings.whatsapp_sender_number }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false },
        { obj: { phone: to, message, sender: settings.whatsapp_sender_number }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false },
        { obj: { number: to, body: message }, headers: { Authorization: `Bearer ${apiKey}` }, useQueryKey: false },
        // try without Authorization header but with api_key query param
        { obj: { phone: to, message, sender: settings.whatsapp_sender_number }, headers: {}, useQueryKey: true },
        { obj: { to, message }, headers: {}, useQueryKey: true },
        { obj: { number: to, body: message }, headers: {}, useQueryKey: true }
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
          // if a 422, continue to try next candidate; otherwise rethrow
          if (info.status && info.status !== 422) {
            throw err;
          }
          // otherwise continue loop to try next payload shape
        }
      }

      // all attempts failed
      if (lastError) {
        const info = asApiError(lastError);
        const bodyText = info.body ? JSON.stringify(info.body) : info.message || String(lastError);
        throw new Error(bodyText || 'فشل في إرسال الرسالة');
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
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // إرسال تنبيهات جماعية
  const sendBulkRemindersMutation = useMutation({
    mutationFn: async () => {
      const installmentsWithWhatsApp = upcomingInstallments?.filter(inst => inst.customer_phone) || [];

      if (installmentsWithWhatsApp.length === 0) {
        throw new Error("لا توجد أقساط لها رقم هاتف");
      }

      // إرسال التنبيهات واحداً تلو الآخر
      for (const installment of installmentsWithWhatsApp) {
        await sendReminderMutation.mutateAsync({ installment });
        // انتظار قليل بين كل رسالة
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return installmentsWithWhatsApp.length;
    },
    onSuccess: (count) => {
      toast({
        title: "تم الإرسال الجماعي",
        description: `تم إرسال ${count} تنبيه بنجاح`,
      });
    },
    onError: (error) => {
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
  }, [whatsappSettings]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
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
              <Input
                id="api-key"
                type="password"
                value={settings.whatsapp_api_key}
                onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                placeholder="أدخل مفتاح API"
              />
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

            <Button
              onClick={handleSaveSettings}
              className="w-full btn-primary"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
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
                  <option key={c.id} value={c.id}>{c.name} — {c.whatsapp_number || c.phone || 'بدون رقم'}</option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">{t('customersLoaded').replace('{count}', String(customersList?.length || 0))}</p>
              {typeof window !== 'undefined' && console.log('customersList', customersList)}
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
                    status: ''
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
                    status: ''
                  };
                  setActiveInstallment(temp);
                  target = manualRecipient;
                }

                if (!target) {
                  toast({ title: t('error'), description: t('invalidPhone'), variant: 'destructive' });
                  return;
                }

                const defaultMessage = t('whatsappReminderMessage')
                  .replace('{customer_name}', activeInstallment?.customer_name || target)
                  .replace('{product_name}', '')
                  .replace('{amount}', '0')
                  .replace('{currency}', getCurrencySymbol(currencySettings?.currency) || '')
                  .replace('{due_date}', format(new Date(), 'dd/MM/yyyy'))
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
              <span className="text-muted-foreground">لها رقم WhatsApp:</span>
              <Badge variant="secondary">
                {upcomingInstallments?.filter(inst => inst.whatsapp_number).length || 0}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">مستحقة اليوم:</span>
              <Badge variant="destructive">
                {upcomingInstallments?.filter(inst => inst.days_until_due <= 1).length || 0}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">مستحقة غداً:</span>
              <Badge variant="warning">
                {upcomingInstallments?.filter(inst => inst.days_until_due === 2).length || 0}
              </Badge>
            </div>

            <Separator />

            <Button
              onClick={() => sendBulkRemindersMutation.mutate()}
              className="w-full"
              disabled={!settings.whatsapp_enabled || sendBulkRemindersMutation.isPending}
            >
              <Send className="w-4 h-4 ml-2" />
              {sendBulkRemindersMutation.isPending ? "جاري الإرسال..." : "إرسال تنبيهات جماعية"}
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

            {upcomingInstallments?.filter(inst => !inst.whatsapp_number).length > 0 && (
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  {upcomingInstallments.filter(inst => !inst.whatsapp_number).length} عميل بدون رقم WhatsApp
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              <p>• تأكد من إضافة أرقام WhatsApp للعملاء</p>
              <p>• تحقق من صحة إعدادات API</p>
              <p>• اختبر الإرسال قبل الاستخدام الفعلي</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الأقساط المستحقة */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <Users className="h-5 w-5 text-accent" />
            <span>{language === 'ar' ? 'الأقساط المستحقة قريباً' : 'قیستە دەستپێبووەکان بەم زوانە'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">جاري تحميل البيانات...</p>
            </div>
          ) : upcomingInstallments?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد أقساط مستحقة في الفترة المحددة</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {upcomingInstallments?.map((installment) => (
                  <div
                    key={installment.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-reverse space-x-3">
                      {getStatusIcon(installment.days_until_due)}
                      <div>
                        <p className="font-medium">{installment.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {installment.product_name} • {installment.monthly_amount.toLocaleString()} {getCurrencySymbol(currencySettings?.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(installment.next_payment_date), "yyyy/MM/dd")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-reverse space-x-2">
                      <Badge className={getStatusColor(installment.days_until_due)}>
                        {installment.days_until_due === 0 ? "اليوم" :
                         installment.days_until_due === 1 ? "غداً" :
                         `بعد ${installment.days_until_due} يوم`}
                      </Badge>

                      {installment.whatsapp_number ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            const defaultMessage = `مرحباً ${installment.customer_name}،\n\nتذكير بدفع القسط المستحق:\n\n📱 المنتج: ${installment.product_name}\n💰 المبلغ: ${installment.monthly_amount.toLocaleString()} ${getCurrencySymbol(currencySettings?.currency)}\n📅 تاريخ الاستحقاق: ${format(new Date(installment.next_payment_date), "yyyy/MM/dd")}\n⏰ باقي: ${installment.days_until_due} يوم\n\nيرجى تسديد المبلغ في الموعد المحدد.\n\nشكراً لتعاونكم.`;
                            setActiveInstallment(installment);
                            setCustomMessage(defaultMessage);
                            setDialogOpen(true);
                          }}
                          disabled={sendReminderMutation.isPending}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          بدون رقم
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
          <DialogDescription>{language === 'ar' ? 'عدل الرسالة ثم اضغط إرسال.' : 'نامەکە بگۆڕە و پاشان کلیکی ناردن بکە.'}</DialogDescription>
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
