import { useState } from "react";
import { format } from "date-fns";
import { useCurrencySettings, getCurrencySymbol } from "@/hooks/use-currency-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator as CalculatorIcon, 
  DollarSign, 
  Calendar,
  PieChart
} from "lucide-react";

interface InstallmentCalculation {
  monthlyPayment: number;
  totalAmount: number;
  additionalAmount: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    additional: number;
    balance: number;
    date: string;
  }>;
}

const Calculator = () => {
  const [principal, setPrincipal] = useState<string>("");
  const [additionalAmount, setAdditionalAmount] = useState<string>("");
  const [months, setMonths] = useState<string>("");
  const [calculation, setCalculation] = useState<InstallmentCalculation | null>(null);
  const { data: currencySettings } = useCurrencySettings();

  const calculateInstallments = () => {
    const P = parseFloat(principal);
    const A = parseFloat(additionalAmount) || 0;
    const n = parseInt(months);

    if (!P || !n || P <= 0 || n <= 0) {
      alert("يرجى إدخال قيم صحيحة");
      return;
    }

    const totalAmount = P + A;
    const monthlyPayment = totalAmount / n;
    const monthlyPrincipal = P / n;
    const monthlyAdditional = A / n;

    const schedule: InstallmentCalculation['schedule'] = [];
    let remainingBalance = P;

    for (let i = 1; i <= n; i++) {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + i);
      
      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: monthlyPrincipal,
        additional: monthlyAdditional,
        balance: remainingBalance - monthlyPrincipal,
        date: format(currentDate, "dd/MM/yyyy")
      });
      
      remainingBalance -= monthlyPrincipal;
    }

    setCalculation({
      monthlyPayment,
      totalAmount,
      additionalAmount: A,
      schedule
    });
  };

  const resetCalculator = () => {
    setPrincipal("");
    setAdditionalAmount("");
    setMonths("");
    setCalculation(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الحاسبة المالية</h1>
          <p className="text-muted-foreground mt-1">
            احسب أقساط القروض والديون مع إمكانية إضافة مبلغ ثابت
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <CalculatorIcon className="h-5 w-5 text-primary" />
              <span>حاسبة الأقساط والمبالغ الإضافية</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="principal">المبلغ الأساسي ({getCurrencySymbol(currencySettings?.currency)})</Label>
              <Input
                id="principal"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="أدخل المبلغ الأساسي"
              />
            </div>

            <div>
              <Label htmlFor="additionalAmount">المبلغ الإضافي ({getCurrencySymbol(currencySettings?.currency)})</Label>
              <Input
                id="additionalAmount"
                type="number"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(e.target.value)}
                placeholder="أدخل المبلغ الإضافي (اختياري)"
              />
            </div>

            <div>
              <Label htmlFor="months">عدد الأشهر</Label>
              <Input
                id="months"
                type="number"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="أدخل عدد الأشهر"
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button onClick={calculateInstallments} className="btn-primary flex-1">
                <CalculatorIcon className="w-4 h-4 ml-2" />
                احسب
              </Button>
              <Button onClick={resetCalculator} variant="outline">
                مسح
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {calculation && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <PieChart className="h-5 w-5 text-secondary" />
                <span>ملخص الحساب</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">القسط الشهري:</span>
                  <span className="font-bold text-primary number-arabic">
                    {calculation.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">إجمالي المبلغ:</span>
                  <span className="font-bold text-foreground number-arabic">
                    {calculation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">المبلغ الإضافي:</span>
                  <span className="font-bold text-secondary number-arabic">
                    {calculation.additionalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">نسبة المبلغ الإضافي:</span>
                  <span className="font-bold text-accent number-arabic">
                    {((calculation.additionalAmount / parseFloat(principal)) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Schedule */}
      {calculation && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span>جدول الدفعات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">الشهر</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">التاريخ</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">القسط</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">الأصل</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">الإضافي</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.schedule.map((payment) => (
                    <tr key={payment.month} className="border-b border-border/50">
                      <td className="py-3 px-2 number-arabic">{payment.month}</td>
                      <td className="py-3 px-2 text-muted-foreground">{payment.date}</td>
                      <td className="py-3 px-2 font-medium number-arabic">
                        {payment.payment.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                      </td>
                      <td className="py-3 px-2 text-primary number-arabic">
                        {payment.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                      </td>
                      <td className="py-3 px-2 text-secondary number-arabic">
                        {payment.additional.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground number-arabic">
                        {payment.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {getCurrencySymbol(currencySettings?.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Calculator;