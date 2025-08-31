import { ReactNode } from "react";
import { format } from "date-fns";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  Bell, 
  Home,
  Calculator,
  Settings as SettingsIcon,
  MessageSquare,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const navigation = [
    {
      name: t('dashboard'),
      href: "/",
      icon: Home,
      current: location.pathname === "/"
    },
    {
      name: t('debts'),
      href: "/debts",
      icon: DollarSign,
      current: location.pathname === "/debts"
    },
    {
      name: t('installments'),
      href: "/installments",
      icon: CreditCard,
      current: location.pathname === "/installments"
    },
    {
      name: t('customers'),
      href: "/customers",
      icon: Users,
      current: location.pathname === "/customers"
    },
    {
      name: "المخزون",
      href: "/inventory",
      icon: Calculator,
      current: location.pathname === "/inventory"
    },
    {
      name: "الحاسبة المالية",
      href: "/calculator",
      icon: Calculator,
      current: location.pathname === "/calculator"
    },
    {
      name: t('whatsappReminders'),
      href: "/whatsapp-reminders", 
      icon: MessageSquare,
      current: location.pathname === "/whatsapp-reminders"
    },
    {
      name: t('settings'),
      href: "/settings", 
      icon: SettingsIcon,
      current: location.pathname === "/settings"
    }
  ];

  const isRtl = language === 'ar' || language === 'ku';

  return (
    <div className={cn("min-h-screen bg-background", isRtl ? "dir-rtl" : "dir-ltr", language === 'ku' ? 'font-kurdish' : 'font-arabic')} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-card border-b border-border shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex items-center space-x-reverse space-x-2">
                <DollarSign className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">
                  {language === 'ar' ? 'نظام إدارة الديون والأقساط' : 'سیستەمی بەڕێوەبردنی قەرز و قیستان'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-4">
              <Select value={language} onValueChange={(value: 'ar' | 'ku') => setLanguage(value)}>
                <SelectTrigger className="w-32">
                  <Globe className="h-4 w-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="ku">کوردی</SelectItem>
                </SelectContent>
              </Select>
              <NotificationCenter />
              <div className="text-sm text-muted-foreground">
                {language === 'ar' ? 'اليوم:' : 'ئەمڕۆ:'} {format(new Date(), "yyyy/MM/dd")}
              </div>
              {/* Auth logout button */}
              {/* ...existing code... */}
              {/* logout UI insertion */}
              <AuthArea />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-card border-l border-border shadow-elegant min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      item.current
                        ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

// Small auth area component to avoid exporting additional files
function AuthArea() {
  const auth = useAuth();
  const navigate = useNavigate();
  if (!auth.isAuthenticated) return null;
  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm text-muted-foreground">{auth.username}</div>
      <button onClick={() => { auth.logout(); navigate('/login'); }} className="px-3 py-1 bg-muted rounded-md text-sm">تسجيل الخروج</button>
    </div>
  );
}