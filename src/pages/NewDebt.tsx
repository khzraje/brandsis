import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowRight, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrencySettings, formatCurrency, getCurrencySymbol } from "@/hooks/use-currency-settings";

const NewDebt = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currencySettings } = useCurrencySettings();
  const [customers, setCustomers] = useState<{id: string; name: string; phone?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    amount: "",
    description: "",
    notes: "",
    payment_method: "",
    due_date: undefined as Date | undefined,
    currency: "IQD"
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل العملاء",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('debts')
        .insert([{
          customer_id: formData.customer_id,
          amount: parseFloat(formData.amount),
          description: formData.description,
          notes: formData.notes,
          payment_method: formData.payment_method,
          due_date: formData.due_date ? format(formData.due_date, 'yyyy/MM/dd') : null,
          currency: formData.currency
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الدين بنجاح",
      });
      
      navigate('/debts');
    } catch (error) {
      console.error('Error creating debt:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الدين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <Button variant="ghost" onClick={() => navigate('/debts')}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">إضافة دين جديد</h1>
            <p className="text-muted-foreground mt-1">
              إضافة دين جديد للعميل مع تفاصيل الدفع
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>بيانات الدين</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customer">العميل *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, customer_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center space-x-reverse space-x-2">
                            <User className="w-4 h-4" />
                            <span>{customer.name}</span>
                            {customer.phone && (
                              <span className="text-muted-foreground">({customer.phone})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ ({getCurrencySymbol(formData.currency)}) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                    className="number-arabic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({...prev, currency: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">دينار عراقي (د.ع)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف الدين</Label>
                  <Input
                    id="description"
                    placeholder="مثال: قرض شخصي، شراء سيارة، ..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الاستحقاق</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.due_date ? (
                          format(formData.due_date, "yyyy/MM/dd")
                        ) : (
                          "اختر تاريخ الاستحقاق"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData(prev => ({...prev, due_date: date}))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">طريقة الدفع</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData(prev => ({...prev, payment_method: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نقد">نقد</SelectItem>
                      <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                      <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                      <SelectItem value="شيك">شيك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    placeholder="أي ملاحظات أو تفاصيل إضافية..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    rows={3}
                  />
                </div>

                <div className="flex space-x-reverse space-x-4 pt-4">
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري الحفظ..." : "حفظ الدين"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/debts')}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>ملخص الدين</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold text-primary number-arabic">
                    {formData.amount ? formatCurrency(parseFloat(formData.amount), formData.currency) : formatCurrency(0, formData.currency)}
                  </p>
                </div>
              </div>
              
              {formData.due_date && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning">تاريخ الاستحقاق</p>
                  <p className="font-medium">
                    {format(formData.due_date, "yyyy/MM/dd")}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• سيتم إضافة الدين إلى حساب العميل المحدد</p>
                <p>• يمكن تعديل بيانات الدين لاحقاً</p>
                <p>• ستصل تنبيهات قبل تاريخ الاستحقاق</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewDebt;