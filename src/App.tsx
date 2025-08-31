import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Debts from "./pages/Debts";
import NewDebt from "./pages/NewDebt";
import Installments from "./pages/Installments";
import NewInstallment from "./pages/NewInstallment";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Calculator from "./pages/Calculator";
import Settings from "./pages/Settings";
import WhatsAppReminders from "./pages/WhatsAppReminders";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Language Context Provider
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for initial app setup
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/debts" element={<ProtectedRoute><Layout><Debts /></Layout></ProtectedRoute>} />
            <Route path="/debts/new" element={<ProtectedRoute><Layout><NewDebt /></Layout></ProtectedRoute>} />
            <Route path="/installments" element={<ProtectedRoute><Layout><Installments /></Layout></ProtectedRoute>} />
            <Route path="/installments/new" element={<ProtectedRoute><Layout><NewInstallment /></Layout></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><Layout><Calculator /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="/whatsapp-reminders" element={<ProtectedRoute><Layout><WhatsAppReminders /></Layout></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

};

export default App;
