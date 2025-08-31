import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// replaced Select with a searchable input dropdown for inventory selection
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowRight, User, CreditCard, Calculator } from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrencySettings, formatCurrency, getCurrencySymbol } from "@/hooks/use-currency-settings";

const NewInstallment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currencySettings } = useCurrencySettings();
  const [customers, setCustomers] = useState<{id: string; name: string; phone?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    product_name: "",
    total_amount: "",
    months_count: "",
    start_date: new Date(),
    notes: "",
  });
  // المنتجات من المخزون
  const [inventoryProducts, setInventoryProducts] = useState<{id?: string, name?: string, price?: number, priceIQD?: number, priceUSD?: number}[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productWrapRef = useRef<HTMLDivElement | null>(null);

  // filtered list for dropdown
  const filteredInventory = inventoryProducts.filter(p => (p.name || "").toLowerCase().includes(productQuery.toLowerCase()));

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!productWrapRef.current) return;
      if (!productWrapRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    // جلب المنتجات من المخزون (من localStorage أو أي مصدر آخر)
    const stored = localStorage.getItem("inventoryProducts");
    if (stored) {
      try {
        setInventoryProducts(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse stored inventory', err);
        toast({ title: 'خطأ', description: 'فشل قراءة بيانات المخزون من المتصفح' });
      }
    }
  }, []);

  const monthlyAmount = formData.total_amount && formData.months_count 
    ? parseFloat(formData.total_amount) / parseInt(formData.months_count) 
    : 0;

  const nextPaymentDate = addMonths(formData.start_date, 1);

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
    
    if (!formData.customer_id || !formData.product_name || !formData.total_amount || !formData.months_count) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const totalAmount = parseFloat(formData.total_amount);
      const monthsCount = parseInt(formData.months_count);
      const monthlyAmount = totalAmount / monthsCount;

      const { error } = await supabase
        .from('installments')
        .insert([{
          customer_id: formData.customer_id,
          product_name: formData.product_name,
          total_amount: totalAmount,
          monthly_amount: monthlyAmount,
          remaining_amount: totalAmount,
          months_count: monthsCount,
          start_date: format(formData.start_date, 'yyyy-MM-dd'),
          next_payment_date: format(nextPaymentDate, 'yyyy-MM-dd'),
          notes: formData.notes,
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة القسط بنجاح",
      });
      
      navigate('/installments');
    } catch (error) {
      console.error('Error creating installment:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة القسط",
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
          <Button variant="ghost" onClick={() => navigate('/installments')}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">إضافة قسط جديد</h1>
            <p className="text-muted-foreground mt-1">
              إضافة منتج جديد للبيع بالتقسيط
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
                <CreditCard className="w-5 h-5 text-primary" />
                <span>بيانات القسط</span>
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

                <div className="space-y-2" ref={productWrapRef}>
                  <Label>نوع المنتج</Label>
                  <div className="relative">
                    <Input
                      value={productQuery}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProductQuery(v);
                        // allow typing to be used as product_name as well
                        setFormData(prev => ({ ...prev, product_name: v }));
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="ابحث عن منتج أو اكتب اسماً جديداً"
                      className="mb-2 font-sans text-lg"
                    />
                    {showProductDropdown && filteredInventory.length > 0 && (
                      <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
                        {filteredInventory.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="px-3 py-2 hover:bg-muted/60 cursor-pointer font-sans text-lg"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, product_name: p.name || "" }));
                              setProductQuery(p.name || "");
                              setShowProductDropdown(false);
                            }}
                          >
                            {p.name || 'منتج بدون اسم'}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* عرض سعر المنتج المحدد إن وُجد */}
                    {(() => {
                      const lookupKey = (productQuery || formData.product_name || '').toLowerCase();
                      const selected = inventoryProducts.find(p => (p.name || '').toLowerCase() === lookupKey);
                      if (!selected) return null;
                      return (
                        <div className="mt-2 text-sm text-muted-foreground">
                          السعر: {' '}
                          {selected.priceIQD ? (
                            <>
                              {new Intl.NumberFormat('ar-IQ').format(selected.priceIQD)} د.ع
                              {selected.priceUSD ? (
                                <span className="ml-2 text-sm text-muted-foreground">({new Intl.NumberFormat('en-US').format(selected.priceUSD)}$)</span>
                              ) : null}
                            </>
                          ) : selected.priceUSD ? (
                            <>{new Intl.NumberFormat('en-US').format(selected.priceUSD)}$</>
                          ) : selected.price ? (
                            <>{new Intl.NumberFormat('ar-IQ').format(selected.price)} د.ع</>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">المبلغ الإجمالي ({getCurrencySymbol(currencySettings?.currency)}) *</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.total_amount}
                      onChange={(e) => setFormData(prev => ({...prev, total_amount: e.target.value}))}
                      className="number-arabic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="months_count">عدد الأشهر *</Label>
                    <Select
                      value={formData.months_count}
                      onValueChange={(value) => setFormData(prev => ({...prev, months_count: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="عدد الأشهر" />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 6, 9, 12, 18, 24, 36].map((months) => (
                          <SelectItem key={months} value={months.toString()}>
                            {months} شهر
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ البداية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {format(formData.start_date, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => date && setFormData(prev => ({...prev, start_date: date}))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    {isLoading ? "جاري الحفظ..." : "حفظ القسط"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/installments')}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span>ملخص القسط</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold text-primary number-arabic">
                    {formData.total_amount ? formatCurrency(parseFloat(formData.total_amount), currencySettings?.currency) : formatCurrency(0, currencySettings?.currency)}
                  </p>
                </div>
              </div>
              
              {monthlyAmount > 0 && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm text-accent">القسط الشهري</p>
                  <p className="text-xl font-bold text-accent number-arabic">
                    {formatCurrency(monthlyAmount, currencySettings?.currency)}
                  </p>
                </div>
              )}

              {formData.months_count && (
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                  <p className="text-sm text-secondary">مدة التقسيط</p>
                  <p className="font-medium">
                    {formData.months_count} شهر
                  </p>
                </div>
              )}

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning">أول دفعة مستحقة</p>
                <p className="font-medium">
                  {format(nextPaymentDate, "dd/MM/yyyy")}
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• سيتم حساب الأقساط تلقائياً</p>
                <p>• ستصل تنبيهات قبل كل دفعة</p>
                <p>• يمكن تعديل بيانات القسط لاحقاً</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewInstallment;