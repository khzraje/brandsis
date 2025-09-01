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
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '../lib/translations';

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
      <h1 className="text-3xl font-bold text-foreground">{t('dashboard')}</h1>
      <p className="text-muted-foreground mt-1">{t('dashboardSubtitle')}</p>
        </div>
        <div className="flex space-x-reverse space-x-4">
          <Link to="/debts/new">
            <Button className="btn-primary">
              <Plus className="w-4 h-4 ml-2" />
        {t('newDebtButton')}
            </Button>
          </Link>
          <Link to="/installments/new">
            <Button variant="outline" className="btn-success">
              <Plus className="w-4 h-4 ml-2" />
        {t('newInstallmentButton')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalDebtsLabel')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {isLoading ? "..." : formatCurrency(stats?.totalDebts, currencySettings?.currency)}
            </div>
            <div className="text-sm text-muted-foreground space-y-1 mt-2">
              <div className="flex justify-between">
                <span>دينار عراقي:</span>
                <span className="font-medium">{isLoading ? "..." : formatCurrency(stats?.totalDebtsIQD, 'IQD')}</span>
              </div>
              <div className="flex justify-between">
                <span>دولار أمريكي:</span>
                <span className="font-medium">{isLoading ? "..." : formatCurrency(stats?.totalDebtsUSD, 'USD')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingUp className="inline w-3 h-3 ml-1 text-secondary" />
              {t('dashboardGrowth').replace('%d', '12%')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalInstallmentsLabel')}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {isLoading ? "..." : formatCurrency(stats?.totalInstallments, currencySettings?.currency)}
            </div>
            <div className="text-sm text-muted-foreground space-y-1 mt-2">
              <div className="flex justify-between">
                <span>دينار عراقي:</span>
                <span className="font-medium">{isLoading ? "..." : formatCurrency(stats?.totalInstallmentsIQD, 'IQD')}</span>
              </div>
              <div className="flex justify-between">
                <span>دولار أمريكي:</span>
                <span className="font-medium">{isLoading ? "..." : formatCurrency(stats?.totalInstallmentsUSD, 'USD')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingUp className="inline w-3 h-3 ml-1 text-secondary" />
              {t('dashboardGrowth').replace('%d', '8%')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('activeCustomersLabel')}
            </CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground number-arabic">
              {isLoading ? "..." : (stats?.activeCustomers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <CheckCircle className="inline w-3 h-3 ml-1 text-secondary" />
              {t('activeClientsCountLabel')}
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('overduePaymentsLabel')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive number-arabic">
              {isLoading ? "..." : (stats?.overduePayments || 0)}
            </div>
            <p className="text-xs text-destructive">
              {t('info')}
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
              <span>{t('recentDebtsTitle')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">{t('loadingData')}</div>
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
                <div className="text-center text-muted-foreground">{t('noRecentDebts')}</div>
              )}
            </div>
            <div className="mt-4">
              <Link to="/debts">
                  <Button variant="outline" className="w-full">
                  {t('viewAllDebts')}
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
              <span>{t('upcomingInstallmentsTitle')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">{t('loadingData')}</div>
              ) : upcomingInstallments && upcomingInstallments.length > 0 ? (
                upcomingInstallments.map((installment) => (
                  <div key={installment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{installment.customer}</p>
                      <p className="text-sm text-muted-foreground">{installment.product}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('dueLabel')}: {installment.dueDate}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-warning number-arabic">
                        {formatCurrency(installment.amount, currencySettings?.currency)}
                      </p>
                      <Badge className="badge-warning">
                        <Clock className="w-3 h-3 ml-1" />
                        {t('upcomingLabel')}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">{t('noUpcomingInstallments')}</div>
              )}
            </div>
            <div className="mt-4">
              <Link to="/installments">
                <Button variant="outline" className="w-full">
                  {t('viewAllInstallments')}
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