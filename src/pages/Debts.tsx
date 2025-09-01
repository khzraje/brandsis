import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  DollarSign, 
  User, 
  Calendar,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Edit,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrencySettings, formatCurrency, getCurrencySymbol } from "@/hooks/use-currency-settings";

interface Debt {
  id: string;
  amount: number;
  description?: string;
  notes?: string;
  status: string;
  due_date?: string;
  payment_method?: string;
  currency?: string;
  created_at: string;
  customers?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
  };
}

const Debts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    notes: "",
    status: "",
    due_date: "",
    currency: "IQD"
  });
  const { toast } = useToast();
  const { data: currencySettings } = useCurrencySettings();

  const fetchDebts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
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
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الديون",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleEditDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;

    try {
      const { error } = await supabase
        .from('debts')
        .update({
          amount: parseFloat(editForm.amount),
          description: editForm.description,
          notes: editForm.notes,
          status: editForm.status,
          due_date: editForm.due_date || null,
          currency: editForm.currency
        })
        .eq('id', editingDebt.id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات الدين",
      });

      setEditingDebt(null);
      fetchDebts();
    } catch (error) {
      console.error('Error updating debt:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الدين",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    setEditForm({
      amount: debt.amount.toString(),
      description: debt.description || "",
      notes: debt.notes || "",
      status: debt.status,
      due_date: debt.due_date || "",
      currency: debt.currency || "IQD"
    });
  };

  const getDaysOverdue = (dueDate?: string): number => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const filteredDebts = debts.filter(debt =>
    debt.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debt.customers?.phone?.includes(searchTerm)
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

  const totalDebts = debts.reduce((sum, debt) => debt.status !== "مكتمل" ? sum + debt.amount : sum, 0);
  const overdueDebts = debts.filter(debt => {
    if (debt.status === "مكتمل") return false;
    if (!debt.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(debt.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;
  const activeDebts = debts.filter(debt => debt.status === "نشط").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل الديون...</p>
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
          <h1 className="text-3xl font-bold text-foreground">إدارة الديون</h1>
          <p className="text-muted-foreground mt-1">
            متابعة وإدارة جميع الديون والمبالغ المستحقة
          </p>
        </div>
        <Link to="/debts/new">
          <Button className="btn-primary">
            <Plus className="w-4 h-4 ml-2" />
            دين جديد
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الديون النشطة</p>
                <p className="text-2xl font-bold text-foreground number-arabic">
                  {formatCurrency(totalDebts, currencySettings?.currency)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الديون النشطة</p>
                <p className="text-2xl font-bold text-secondary number-arabic">{activeDebts}</p>
              </div>
              <Clock className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الديون المتأخرة</p>
                <p className="text-2xl font-bold text-destructive number-arabic">{overdueDebts}</p>
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
              placeholder="البحث باسم العميل أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Debts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDebts.map((debt) => (
          <Card key={debt.id} className="card-elegant animate-slide-in">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{debt.customers?.name}</CardTitle>
                    <div className="flex items-center space-x-reverse space-x-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{debt.customers?.phone}</span>
                    </div>
                  </div>
                </div>
                <Badge className={(() => {
                  if (debt.status === "مكتمل") return getStatusColor(debt.status);
                  if (!debt.due_date) return getStatusColor(debt.status);
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dueDate = new Date(debt.due_date);
                  dueDate.setHours(0, 0, 0, 0);
                  
                  if (dueDate < today) {
                    return getStatusColor("متأخر");
                  }
                  
                  return getStatusColor(debt.status);
                })()}>
                  {(() => {
                    if (debt.status === "مكتمل") return debt.status;
                    if (!debt.due_date) return debt.status;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(debt.due_date);
                    dueDate.setHours(0, 0, 0, 0);
                    
                    if (dueDate < today) {
                      return "متأخر";
                    }
                    
                    return debt.status;
                  })()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debt.customers?.address && (
                  <div className="flex items-center space-x-reverse space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{debt.customers.address}</span>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">المبلغ</p>
                      <p className="text-lg font-bold text-primary number-arabic">
                        {formatCurrency(debt.amount, debt.currency || currencySettings?.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">تاريخ الاستحقاق</p>
                      <p className="text-sm font-medium text-foreground">
                        {debt.due_date ? format(new Date(debt.due_date), "dd/MM/yyyy") : 'غير محدد'}
                      </p>
                      {(() => {
                        if (!debt.due_date || debt.status === "مكتمل") return null;
                        
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dueDate = new Date(debt.due_date);
                        dueDate.setHours(0, 0, 0, 0);
                        
                        if (dueDate < today) {
                          const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <p className="text-xs text-destructive">
                              متأخر {daysOverdue} يوم
                            </p>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {debt.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">الوصف</p>
                    <p className="text-sm text-foreground">{debt.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center space-x-reverse space-x-2 text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>تاريخ الإنشاء: {format(new Date(debt.created_at), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex space-x-reverse space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(debt)}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تحرير
                    </Button>
                    <Button 
                      size="sm" 
                      className="btn-success"
                      onClick={() => setSelectedDebt(debt)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDebts.length === 0 && (
        <Card className="card-elegant">
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد ديون</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "لم يتم العثور على نتائج للبحث" : "لا توجد ديون مسجلة حالياً"}
            </p>
            <Link to="/debts/new">
              <Button className="btn-primary">
                إضافة دين جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDebt} onOpenChange={() => setEditingDebt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الدين</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditDebt} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">المبلغ ({getCurrencySymbol(editForm.currency || currencySettings?.currency)})</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({...prev, amount: e.target.value}))}
                className="number-arabic"
              />
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
              <Label htmlFor="edit-description">الوصف</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
              />
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

            <div className="space-y-2">
              <Label htmlFor="edit-due-date">تاريخ الاستحقاق</Label>
              <Input
                id="edit-due-date"
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm(prev => ({...prev, due_date: e.target.value}))}
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="submit" className="btn-primary">حفظ التغييرات</Button>
              <Button type="button" variant="outline" onClick={() => setEditingDebt(null)}>
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedDebt} onOpenChange={() => setSelectedDebt(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-reverse space-x-2">
              <User className="w-5 h-5 text-primary" />
              <span>تفاصيل الدين</span>
            </DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-reverse space-x-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>بيانات العميل</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span className="font-medium text-sm">{selectedDebt.customers?.name}</span>
                  </div>
                  {selectedDebt.customers?.phone && (
                    <div className="flex items-center space-x-reverse space-x-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{selectedDebt.customers.phone}</span>
                    </div>
                  )}
                  {selectedDebt.customers?.address && (
                    <div className="flex items-center space-x-reverse space-x-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{selectedDebt.customers.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Debt Info */}
              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-reverse space-x-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span>بيانات الدين</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                      <span className="text-sm text-muted-foreground">المبلغ</span>
                      <span className="text-lg font-bold text-primary number-arabic">
                        {formatCurrency(selectedDebt.amount, currencySettings?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">الحالة</span>
                      <Badge className={(() => {
                        if (selectedDebt.status === "مكتمل") return getStatusColor(selectedDebt.status);
                        if (!selectedDebt.due_date) return getStatusColor(selectedDebt.status);
                        
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dueDate = new Date(selectedDebt.due_date);
                        dueDate.setHours(0, 0, 0, 0);
                        
                        if (dueDate < today) {
                          return getStatusColor("متأخر");
                        }
                        
                        return getStatusColor(selectedDebt.status);
                      })()}>
                        {(() => {
                          if (selectedDebt.status === "مكتمل") return selectedDebt.status;
                          if (!selectedDebt.due_date) return selectedDebt.status;
                          
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const dueDate = new Date(selectedDebt.due_date);
                          dueDate.setHours(0, 0, 0, 0);
                          
                          if (dueDate < today) {
                            return "متأخر";
                          }
                          
                          return selectedDebt.status;
                        })()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">تاريخ الإنشاء</span>
                      <span className="font-medium">
                        {new Date(selectedDebt.created_at).toLocaleDateString('ar-IQ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">تاريخ الاستحقاق</span>
                      <span className="font-medium">
                        {selectedDebt.due_date
                          ? new Date(selectedDebt.due_date).toLocaleDateString('ar-IQ')
                          : 'غير محدد'
                        }
                      </span>
                    </div>
                  </div>

                  {selectedDebt.description && (
                    <div className="p-3 bg-secondary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">الوصف</p>
                      <p className="text-sm text-foreground">{selectedDebt.description}</p>
                    </div>
                  )}

                  {selectedDebt.notes && (
                    <div className="p-3 bg-warning/5 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">ملاحظات</p>
                      <p className="text-sm text-foreground">{selectedDebt.notes}</p>
                    </div>
                  )}

                  {selectedDebt.payment_method && (
                    <div className="p-3 bg-accent/5 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">طريقة الدفع</p>
                      <p className="text-sm text-foreground">{selectedDebt.payment_method}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;