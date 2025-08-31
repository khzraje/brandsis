import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Download, 
  Upload, 
  Database,
  Smartphone,
  Save,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface AppSettings {
  app_theme: string;
  primary_color: string;
  notification_enabled: boolean;
  telegram_enabled: boolean;
  telegram_bot_token: string;
  telegram_chat_id: string;
  currency: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    app_theme: "light",
    primary_color: "#2563eb",
    notification_enabled: true,
    telegram_enabled: false,
    telegram_bot_token: "",
    telegram_chat_id: "",
    currency: "IQD"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, string | boolean> = {};
      data.forEach(setting => {
        if (setting.key in settings) {
          settingsMap[setting.key] = setting.value;
        }
      });

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب الإعدادات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [settings, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: string | boolean) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await updateSetting(key, value);
      }

      toast({
        title: "نجح",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      // جلب جميع البيانات
      const [customersResult, debtsResult, installmentsResult, notificationsResult] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('installments').select('*'),
        supabase.from('notifications').select('*')
      ]);

      const exportData = {
        customers: customersResult.data || [],
        debts: debtsResult.data || [],
        installments: installmentsResult.data || [],
        notifications: notificationsResult.data || [],
        settings: settings,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };

      // تحويل البيانات إلى JSON وتحميلها
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "نجح",
        description: "تم إنشاء النسخة الاحتياطية بنجاح",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // التحقق من صحة البيانات
      if (!importData.version || !importData.customers) {
        throw new Error('Invalid backup file format');
      }

      const confirmImport = confirm(
        'هل أنت متأكد من استيراد هذه البيانات؟ سيتم استبدال البيانات الحالية.'
      );

      if (!confirmImport) return;

      // حذف البيانات الحالية واستيراد الجديدة
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (importData.customers.length > 0) {
        await supabase.from('customers').insert(importData.customers);
      }
      
      if (importData.debts && importData.debts.length > 0) {
        await supabase.from('debts').insert(importData.debts);
      }
      
      if (importData.installments && importData.installments.length > 0) {
        await supabase.from('installments').insert(importData.installments);
      }

      toast({
        title: "نجح",
        description: "تم استيراد البيانات بنجاح",
      });

      // إعادة تحميل الصفحة لتحديث البيانات
      window.location.reload();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في استيراد البيانات",
        variant: "destructive",
      });
    }
  };

  const testTelegramConnection = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      toast({
        title: "خطأ",
        description: "يجب إدخال رمز البوت ومعرف المحادثة أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: settings.telegram_chat_id,
          text: '✅ تم الاتصال بنجاح! سيتم إرسال الإشعارات هنا.'
        }),
      });

      if (response.ok) {
        toast({
          title: "نجح",
          description: "تم اختبار الاتصال بتليجرام بنجاح",
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error testing Telegram:', error);
      toast({
        title: "خطأ",
        description: "فشل في الاتصال بتليجرام. تحقق من البيانات",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-muted-foreground mt-1">
            إعدادات التطبيق والنسخ الاحتياطية
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4 ml-2" />
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
          <TabsTrigger value="currency">العملة</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="telegram">تليجرام</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطية</TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>إعدادات المظهر</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">سمة التطبيق</Label>
                <Select
                  value={settings.app_theme}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, app_theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">غامق</SelectItem>
                    <SelectItem value="system">حسب النظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">اللون الأساسي</Label>
                <div className="flex space-x-reverse space-x-4 items-center">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    placeholder="#2563eb"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currency Settings */}
        <TabsContent value="currency">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span>إعدادات العملة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">العملة المستخدمة</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IQD">الدينار العراقي (IQD)</SelectItem>
                    <SelectItem value="USD">الدولار الأمريكي (USD)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  سيتم عرض جميع المبالغ بعملة {settings.currency === "IQD" ? "الدينار العراقي" : "الدولار الأمريكي"}
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">معلومات العملة</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• الدينار العراقي (IQD): العملة الرسمية في العراق</p>
                  <p>• الدولار الأمريكي (USD): العملة الدولية</p>
                  <p>• يمكن تغيير العملة في أي وقت</p>
                  <p>• سيتم تحديث جميع العرض في التطبيق فوراً</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Bell className="h-5 w-5 text-warning" />
                <span>إعدادات الإشعارات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">تمكين الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">
                    استقبال إشعارات داخل التطبيق
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notification_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notification_enabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Settings */}
        <TabsContent value="telegram">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Smartphone className="h-5 w-5 text-accent" />
                <span>إعدادات تليجرام</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="telegramEnabled">تمكين تليجرام</Label>
                  <p className="text-sm text-muted-foreground">
                    إرسال الإشعارات عبر تليجرام
                  </p>
                </div>
                <Switch
                  id="telegramEnabled"
                  checked={settings.telegram_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, telegram_enabled: checked }))}
                />
              </div>

              {settings.telegram_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="botToken">رمز البوت (Bot Token)</Label>
                    <Input
                      id="botToken"
                      type="password"
                      value={settings.telegram_bot_token}
                      onChange={(e) => setSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                      placeholder="أدخل رمز البوت من @BotFather"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chatId">معرف المحادثة (Chat ID)</Label>
                    <Input
                      id="chatId"
                      value={settings.telegram_chat_id}
                      onChange={(e) => setSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                      placeholder="أدخل معرف المحادثة"
                    />
                  </div>

                  <Button onClick={testTelegramConnection} variant="outline" className="w-full">
                    <Smartphone className="w-4 h-4 ml-2" />
                    اختبار الاتصال
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup">
          <div className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center space-x-reverse space-x-2">
                  <Database className="h-5 w-5 text-secondary" />
                  <span>النسخ الاحتياطية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportData} variant="outline" className="h-20 flex-col space-y-2">
                    <Download className="h-6 w-6" />
                    <span>تصدير البيانات</span>
                    <span className="text-xs text-muted-foreground">إنشاء نسخة احتياطية</span>
                  </Button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                      <Upload className="h-6 w-6" />
                      <span>استيراد البيانات</span>
                      <span className="text-xs text-muted-foreground">استعادة نسخة احتياطية</span>
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>تنبيه:</strong> استيراد البيانات سيحل محل جميع البيانات الحالية. 
                    تأكد من إنشاء نسخة احتياطية قبل الاستيراد.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;