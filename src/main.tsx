import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/rtl.css'
import { syncInstallmentsOverdue } from '@/lib/installmentSync';

// مزامنة تلقائية للأقساط المتأخرة عند بدء التطبيق
syncInstallmentsOverdue().catch(e => console.error('Sync installments error', e));

createRoot(document.getElementById("root")!).render(<App />);
