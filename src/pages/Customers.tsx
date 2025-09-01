import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Search,
  Eye,
  Ban,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  national_id?: string;
  notes?: string;
  created_at: string;
  whatsapp_enabled?: boolean;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    national_id: "",
    notes: ""
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب بيانات العملاء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "اسم العميل مطلوب",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
        
        toast({
          title: "نجح",
          description: "تم تحديث بيانات العميل بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "نجح",
          description: "تم إضافة العميل بنجاح",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const handleToggleWhatsApp = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ whatsapp_enabled: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "نجح",
        description: !currentStatus ? "تم تشغيل العميل لتلقي رسائل WhatsApp" : "تم تعطيل العميل من تلقي رسائل WhatsApp",
      });
      
      fetchCustomers();
    } catch (error) {
      console.error('Error toggling WhatsApp status:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة العميل",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      national_id: "",
      notes: ""
    });
    setEditingCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      national_id: customer.national_id || "",
      notes: customer.notes || ""
    });
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة العملاء</h1>
          <p className="text-muted-foreground mt-1">
            قائمة العملاء وإدارة بياناتهم
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" onClick={resetForm}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عميل جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
              </DialogTitle>
            </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">اسم العميل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="أدخل اسم العميل"
                    required
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                <div>
                  <Label htmlFor="national_id">رقم الهوية الوطنية</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => setFormData(prev => ({...prev, national_id: e.target.value}))}
                    placeholder="أدخل رقم الهوية"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                    placeholder="أدخل العنوان"
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="أضف ملاحظات إضافية"
                    rows={2}
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-2 pt-4">
                  <Button type="submit" className="btn-primary">
                    {editingCustomer ? "تحديث" : "إضافة"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="card-elegant">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في العملاء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي العملاء
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {customers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{customer.name}</span>
                <div className="flex space-x-reverse space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleWhatsApp(customer.id, customer.whatsapp_enabled ?? true)}
                    className={customer.whatsapp_enabled ?? true ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    title={customer.whatsapp_enabled ?? true ? "تعطيل العميل من تلقي رسائل WhatsApp" : "تشغيل العميل لتلقي رسائل WhatsApp"}
                  >
                    {customer.whatsapp_enabled ?? true ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 ml-2" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 ml-2" />
                  {customer.email}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 ml-2" />
                  {customer.address}
                </div>
              )}
              {customer.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>ملاحظات:</strong> {customer.notes}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                تاريخ الإضافة: {format(new Date(customer.created_at), "dd/MM/yyyy")}
              </div>
              <div className="flex items-center text-xs">
                <span className={customer.whatsapp_enabled ?? true ? "text-green-600" : "text-red-600"}>
                  {customer.whatsapp_enabled ?? true ? "نشط لـ WhatsApp" : "معطل لـ WhatsApp"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="card-elegant">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد عملاء</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "لم يتم العثور على عملاء مطابقين للبحث" : "ابدأ بإضافة عميل جديد"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Customers;