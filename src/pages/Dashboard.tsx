import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useRecentDebts } from "@/hooks/use-recent-debts";
import { useUpcomingInstallments } from "@/hooks/use-upcoming-installments";
import { useCurrencySettings, formatCurrency } from "@/hooks/use-currency-settings";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentDebts, isLoading: debtsLoading } = useRecentDebts();
  const { data: upcomingInstallments, isLoading: installmentsLoading } = useUpcomingInstallments();
  const { data: currencySettings } = useCurrencySettings();

  const isLoading = statsLoading || debtsLoading || installmentsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على الديون والأقساط
          </p>
        </div>
        <div className="flex space-x-reverse space-x-4">
          <Link to="/debts/new">
            <Button className="btn-primary">
              <Plus className="w-4 h-4 ml-2" />
              دين جديد
            </Button>
          </Link>
          <Link to="/installments/new">
            <Button variant="outline" className="btn-success">
              <Plus className="w-4 h-4 ml-2" />
              قسط جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الديون
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {isLoading ? "..." : formatCurrency(stats?.totalDebts, currencySettings?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 ml-1 text-secondary" />
              +12% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الأقساط
            </CardTitle>
            <CreditCard className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {isLoading ? "..." : formatCurrency(stats?.totalInstallments, currencySettings?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 ml-1 text-secondary" />
              +8% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              العملاء النشطون
            </CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {isLoading ? "..." : (stats?.activeCustomers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle className="inline w-3 h-3 ml-1 text-secondary" />
              عميل نشط
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المدفوعات المتأخرة
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive number-arabic">
              {isLoading ? "..." : (stats?.overduePayments || 0)}
            </div>
            <p className="text-xs text-destructive">
              يتطلب متابعة فورية
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Debts */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>الديون الحديثة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">جاري التحميل...</div>
              ) : recentDebts && recentDebts.length > 0 ? (
                recentDebts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{debt.customer}</p>
                      <p className="text-sm text-muted-foreground">{debt.date}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground number-arabic">
                        {formatCurrency(debt.amount, currencySettings?.currency)}
                      </p>
                      <Badge className={debt.status === "نشط" ? "badge-success" : "badge-warning"}>
                        {debt.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">لا توجد ديون حديثة</div>
              )}
            </div>
            <div className="mt-4">
              <Link to="/debts">
                <Button variant="outline" className="w-full">
                  عرض جميع الديون
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Installments */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <span>الأقساط القادمة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">جاري التحميل...</div>
              ) : upcomingInstallments && upcomingInstallments.length > 0 ? (
                upcomingInstallments.map((installment) => (
                  <div key={installment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{installment.customer}</p>
                      <p className="text-sm text-muted-foreground">{installment.product}</p>
                      <p className="text-xs text-muted-foreground">
                        الاستحقاق: {installment.dueDate}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-warning number-arabic">
                        {formatCurrency(installment.amount, currencySettings?.currency)}
                      </p>
                      <Badge className="badge-warning">
                        <Clock className="w-3 h-3 ml-1" />
                        قادم
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">لا توجد أقساط قادمة</div>
              )}
            </div>
            <div className="mt-4">
              <Link to="/installments">
                <Button variant="outline" className="w-full">
                  عرض جميع الأقساط
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;