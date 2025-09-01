import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  CreditCard,
  User,
  Calendar,
  Phone,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Eye,
  DollarSign,
  MapPin,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printReceipt } from '@/lib/printReceipt';
import { useCurrencySettings, formatCurrency, getCurrencySymbol } from "@/hooks/use-currency-settings";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Installment {
  id: string;
  customer_id: string;
  product_name: string;
  total_amount: number;
  monthly_amount: number;
  remaining_amount: number;
  months_count: number;
  paid_months: number;
  start_date: string;
  next_payment_date?: string;
  notes?: string;
  status: string;
  currency?: string;
  created_at: string;
  customers?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
  };
}

const Installments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<Installment | null>(null);
  const [editForm, setEditForm] = useState({
    product_name: "",
    total_amount: "",
    monthly_amount: "",
    months_count: "",
    notes: "",
    status: "",
    currency: "IQD"
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_amount: "",
    payment_method: "",
    notes: ""
  });
  const [deleteDialog, setDeleteDialog] = useState<Installment | null>(null);
  const { toast } = useToast();
  const { data: currencySettings } = useCurrencySettings();
  const { language, t } = useLanguage();

  const fetchInstallments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows: Installment[] = data || [];

      // Detect overdue rows that aren't marked completed or already overdue
      const toMarkOverdue = rows.filter(r => {
        if (r.status === "مكتمل" || r.status === "متأخر") return false;
        if (!r.next_payment_date) return false;
        const due = new Date(r.next_payment_date);
        if (isNaN(due.getTime())) return false;
        const now = new Date();
        due.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
        return due < now;
      });

      if (toMarkOverdue.length > 0) {
        const ids = toMarkOverdue.map(r => r.id);
        const { error: updateErr } = await supabase
          .from('installments')
          .update({ status: 'متأخر' })
          .in('id', ids);

        if (updateErr) {
          console.error('Error marking overdue installments:', updateErr);
        } else {
          // refetch to get updated statuses
          const { data: refreshed } = await supabase
            .from('installments')
            .select(`
              *,
              customers ( id, name, phone, address )
            `)
            .order('created_at', { ascending: false });

          setInstallments(refreshed || []);
          return;
        }
      }

      setInstallments(rows);
    } catch (error) {
      console.error('Error fetching installments:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأقساط",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  const handleEditInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment) return;

    try {
      const { error } = await supabase
        .from('installments')
        .update({
          product_name: editForm.product_name,
          total_amount: parseFloat(editForm.total_amount),
          monthly_amount: parseFloat(editForm.monthly_amount),
          months_count: parseInt(editForm.months_count),
          notes: editForm.notes,
          status: editForm.status,
          currency: editForm.currency
        })
        .eq('id', editingInstallment.id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات القسط",
      });

      setEditingInstallment(null);
      fetchInstallments();
    } catch (error) {
      console.error('Error updating installment:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث القسط",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDialog) return;

    try {
      const paymentAmount = parseFloat(paymentForm.payment_amount);
      
      // إضافة دفعة جديدة
      const { error: paymentError } = await supabase
        .from('installment_payments')
        .insert([{
          installment_id: paymentDialog.id,
          payment_amount: paymentAmount,
          payment_method: paymentForm.payment_method,
          notes: paymentForm.notes
        }]);

      if (paymentError) throw paymentError;

      // تحديث بيانات القسط
      const newPaidMonths = paymentDialog.paid_months + 1;
      const newRemainingAmount = paymentDialog.remaining_amount - paymentAmount;
      const newStatus = newPaidMonths >= paymentDialog.months_count ? "مكتمل" : "نشط";

      const { error: updateError } = await supabase
        .from('installments')
        .update({
          paid_months: newPaidMonths,
          remaining_amount: Math.max(0, newRemainingAmount),
          status: newStatus,
          next_payment_date: newStatus !== "مكتمل" 
            ? new Date(new Date(paymentDialog.next_payment_date).setMonth(new Date(paymentDialog.next_payment_date).getMonth() + 1)).toISOString().split('T')[0]
            : null
        })
        .eq('id', paymentDialog.id);

      if (updateError) throw updateError;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
      });

      // اطبع الوصل تلقائياً
      try {
        printReceipt({
          payerName: paymentDialog.customers?.name || 'مجهول',
          payerPhone: paymentDialog.customers?.phone || undefined,
          productName: paymentDialog.product_name,
          amount: paymentAmount,
          currency: currencySettings?.currency || undefined,
          method: paymentForm.payment_method || 'نقداً',
          date: new Date().toLocaleString(),
          remaining: Math.max(0, newRemainingAmount),
          notes: paymentForm.notes || undefined,
          logo: '/logo.png',
          receiptId: `RCPT-${Date.now()}`
        });
      } catch (e) {
        // ignore print errors
      }

      setPaymentDialog(null);
      setPaymentForm({ payment_amount: "", payment_method: "", notes: "" });
      fetchInstallments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الدفعة",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInstallment = async () => {
    if (!deleteDialog) return;

    try {
      // حذف جميع المدفوعات المرتبطة بالقسط أولاً
      const { error: paymentsError } = await supabase
        .from('installment_payments')
        .delete()
        .eq('installment_id', deleteDialog.id);

      if (paymentsError) throw paymentsError;

      // حذف القسط
      const { error: deleteError } = await supabase
        .from('installments')
        .delete()
        .eq('id', deleteDialog.id);

      if (deleteError) throw deleteError;

      toast({
        title: "تم بنجاح",
        description: "تم حذف القسط بنجاح",
      });

      setDeleteDialog(null);
      fetchInstallments();
    } catch (error) {
      console.error('Error deleting installment:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف القسط",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (installment: Installment) => {
    setEditingInstallment(installment);
    setEditForm({
      product_name: installment.product_name,
      total_amount: installment.total_amount.toString(),
      monthly_amount: installment.monthly_amount.toString(),
      months_count: installment.months_count.toString(),
      notes: installment.notes || "",
      status: installment.status,
      currency: installment.currency || "IQD"
    });
  };

  const openPaymentDialog = (installment: Installment) => {
    setPaymentDialog(installment);
    setPaymentForm({
      payment_amount: installment.monthly_amount.toString(),
      payment_method: "",
      notes: ""
    });
  };

  const filteredInstallments = installments.filter(installment =>
    installment.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installment.customers?.phone?.includes(searchTerm) ||
    installment.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "نشط":
        return "badge-success";
      case "متأخر":
        return "badge-danger";
      case "مكتمل":
        return "bg-primary/20 text-primary border-primary/30";
      default:
        return "badge-warning";
    }
  };

  const totalActiveAmount = installments
    .filter(i => i.status !== "مكتمل")
    .reduce((sum, i) => sum + i.remaining_amount, 0);
  
  const overdueCount = installments.filter(i => {
    // Consider installment overdue if status is explicitly 'متأخر'
    if (i.status === "متأخر") return true;
    // Or if the next payment date exists and is in the past and the installment isn't completed
    if (i.next_payment_date && i.status !== "مكتمل") {
      const due = new Date(i.next_payment_date);
      const now = new Date();
      // normalize to date-only comparison
      if (!isNaN(due.getTime()) && due.setHours(0,0,0,0) < now.setHours(0,0,0,0)) {
        return true;
      }
    }
    return false;
  }).length;
  const activeCount = installments.filter(i => i.status === "نشط").length;
  const upcomingPayments = installments.filter(i => {
    if (i.status === "مكتمل") return false;
    const dueDate = new Date(i.next_payment_date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الأقساط...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('manageInstallments')}</h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'متابعة المبيعات بالتقسيط والدفعات الشهرية' : 'شوێنپێدانی فرۆشتنەکان بە قیست و پارەدانە مانگانەکان'}
          </p>
        </div>
        <Link to="/installments/new">
          <Button className="btn-primary">
            <Plus className="w-4 h-4 ml-2" />
            {t('add')}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'إجمالي المبالغ المتبقية' : 'کۆی گشتی بڕە ماوەکان'}</p>
                <p className="text-2xl font-bold text-foreground number-arabic">
                  {formatCurrency(totalActiveAmount, currencySettings?.currency)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الأقساط النشطة' : 'قیستە چالاکەکان'}</p>
                <p className="text-2xl font-bold text-secondary number-arabic">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'دفعات قادمة (7 أيام)' : 'پارەدانە داهاتووەکان (7 ڕۆژ)'}</p>
                <p className="text-2xl font-bold text-warning number-arabic">{upcomingPayments}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الأقساط المتأخرة' : 'قیستە دواخراوەکان'}</p>
                <p className="text-2xl font-bold text-destructive number-arabic">{overdueCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-elegant">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث باسم العميل أو المنتج أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Installments List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredInstallments.map((installment) => {
          const progress = (installment.paid_months / installment.months_count) * 100;
          
          return (
            <Card key={installment.id} className="card-elegant animate-slide-in">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-reverse space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                      <User className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg truncate">{installment.customers?.name}</CardTitle>
                      <div className="flex items-center space-x-reverse space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{installment.customers?.phone}</span>
                      </div>
                    </div>
                  </div>
                  {/* Determine overdue visually if date passed (and not completed) */}
                  {(() => {
                    const isOverdue = (() => {
                      if (installment.status === "متأخر") return true;
                      if (installment.next_payment_date && installment.status !== "مكتمل") {
                        const due = new Date(installment.next_payment_date);
                        const now = new Date();
                        if (!isNaN(due.getTime())) {
                          due.setHours(0,0,0,0);
                          now.setHours(0,0,0,0);
                          if (due < now) return true;
                        }
                      }
                      return false;
                    })();

                    const statusLabel = isOverdue && installment.status !== "مكتمل" ? "متأخر" : installment.status;

                    return (
                      <Badge variant={isOverdue ? 'destructive' : statusLabel === 'نشط' ? 'secondary' : 'default'}>
                        {statusLabel}
                      </Badge>
                    );
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-reverse space-x-2 text-sm text-foreground">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{installment.product_name}</span>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">إجمالي المبلغ</p>
                        <p className="text-lg font-bold text-primary number-arabic">
                          {formatCurrency(installment.total_amount, installment.currency || currencySettings?.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">القسط الشهري</p>
                        <p className="text-lg font-bold text-accent number-arabic">
                          {formatCurrency(installment.monthly_amount, installment.currency || currencySettings?.currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">التقدم</span>
                      <span className="text-sm font-medium text-foreground number-arabic">
                        {installment.paid_months} / {installment.months_count}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      المبلغ المتبقي: {formatCurrency(installment.remaining_amount, installment.currency || currencySettings?.currency)}
                    </p>
                  </div>

                  {installment.status !== "مكتمل" && (
                    <div className="flex items-center space-x-reverse space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-warning" />
                      <span className="text-muted-foreground">الدفعة القادمة:</span>
                      <span className="font-medium text-warning">
                        {installment.next_payment_date 
                          ? format(new Date(installment.next_payment_date), "yyyy/MM/dd")
                          : 'غير محدد'
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
                    <div className="text-xs text-muted-foreground">
                      تاريخ البداية: {format(new Date(installment.start_date), "yyyy/MM/dd")}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(installment)}
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تحرير
                      </Button>
                      <Button 
                        size="sm" 
                        className="btn-success"
                        onClick={() => setSelectedInstallment(installment)}
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض التفاصيل
                      </Button>
                      {installment.status !== 'مكتمل' && (
                        <Button 
                          size="sm" 
                          className="btn-warning"
                          onClick={() => openPaymentDialog(installment)}
                        >
                          <DollarSign className="w-4 h-4 ml-1" />
                          تسجيل دفعة
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setDeleteDialog(installment)}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInstallments.length === 0 && (
        <Card className="card-elegant">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد أقساط</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "لم يتم العثور على نتائج للبحث" : "لا توجد أقساط مسجلة حالياً"}
            </p>
            <Link to="/installments/new">
              <Button className="btn-primary">
                إضافة قسط جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingInstallment} onOpenChange={() => setEditingInstallment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات القسط</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditInstallment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product">اسم المنتج</Label>
              <Input
                id="edit-product"
                value={editForm.product_name}
                onChange={(e) => setEditForm(prev => ({...prev, product_name: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-total">المبلغ الإجمالي</Label>
                <Input
                  id="edit-total"
                  type="number"
                  step="0.01"
                  value={editForm.total_amount}
                  onChange={(e) => setEditForm(prev => ({...prev, total_amount: e.target.value}))}
                  className="number-arabic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-monthly">القسط الشهري</Label>
                <Input
                  id="edit-monthly"
                  type="number"
                  step="0.01"
                  value={editForm.monthly_amount}
                  onChange={(e) => setEditForm(prev => ({...prev, monthly_amount: e.target.value}))}
                  className="number-arabic"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">الحالة</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm(prev => ({...prev, status: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="متأخر">متأخر</SelectItem>
                  <SelectItem value="مكتمل">مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currency">العملة</Label>
              <Select
                value={editForm.currency}
                onValueChange={(value) => setEditForm(prev => ({...prev, currency: value}))}
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
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({...prev, notes: e.target.value}))}
                rows={3}
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="submit" className="btn-primary">حفظ التغييرات</Button>
              <Button type="button" variant="outline" onClick={() => setEditingInstallment(null)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">العميل</p>
              <p className="font-medium">{paymentDialog?.customers?.name}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">المنتج</p>
              <p className="font-medium">{paymentDialog?.product_name}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">مبلغ الدفعة ({getCurrencySymbol(paymentDialog?.currency || currencySettings?.currency)})</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentForm.payment_amount}
                onChange={(e) => setPaymentForm(prev => ({...prev, payment_amount: e.target.value}))}
                className="number-arabic"
              />
              <p className="text-xs text-muted-foreground">
                القسط المطلوب: {formatCurrency(paymentDialog?.monthly_amount, paymentDialog?.currency || currencySettings?.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                المبلغ المدفوع: {formatCurrency(paymentDialog?.paid_amount, paymentDialog?.currency || currencySettings?.currency)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">طريقة الدفع</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value) => setPaymentForm(prev => ({...prev, payment_method: value}))}
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
              <Label htmlFor="payment-notes">ملاحظات</Label>
              <Textarea
                id="payment-notes"
                placeholder="أي ملاحظات حول الدفعة..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({...prev, notes: e.target.value}))}
                rows={2}
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="submit" className="btn-primary">تسجيل الدفعة</Button>
              <Button type="button" variant="outline" onClick={() => setPaymentDialog(null)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-reverse space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>تأكيد الحذف</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">هل أنت متأكد من حذف هذا القسط؟</p>
              {deleteDialog && (
                <div className="space-y-2 text-sm">
                  <p><strong>العميل:</strong> {deleteDialog.customers?.name}</p>
                  <p><strong>المنتج:</strong> {deleteDialog.product_name}</p>
                  <p><strong>المبلغ المتبقي:</strong> {formatCurrency(deleteDialog.remaining_amount, deleteDialog.currency || currencySettings?.currency)}</p>
                  <p><strong>الأقساط المدفوعة:</strong> {deleteDialog.paid_months} / {deleteDialog.months_count}</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-xs text-warning">
                ⚠️ تحذير: سيتم حذف جميع المدفوعات المرتبطة بهذا القسط ولا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          </div>
          <div className="flex space-x-reverse space-x-2 pt-4">
            <Button 
              variant="destructive" 
              onClick={handleDeleteInstallment}
              className="btn-destructive"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف نهائياً
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog(null)}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Installments;