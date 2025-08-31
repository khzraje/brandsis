import { DollarSign } from "lucide-react";
import { getCurrentLanguage, t } from "@/lib/translations";

export const LoadingScreen = () => {
  const lang = getCurrentLanguage();

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo Animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-glow rounded-full animate-ping opacity-20"></div>
          <div className="relative bg-gradient-to-br from-primary to-primary-glow p-6 rounded-full shadow-lg">
            <DollarSign className="w-12 h-12 text-primary-foreground animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('dashboard', lang)}</h2>
          <p className="text-muted-foreground animate-pulse">{t('loading', lang)}</p>
        </div>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-primary-glow animate-loading-bar"></div>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};