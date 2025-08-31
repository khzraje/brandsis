// نظام الترجمة للتطبيق
export type Language = 'ar' | 'ku';

export interface Translations {
  // التنقل والعناوين الرئيسية
  dashboard: string;
  customers: string;
  debts: string;
  installments: string;
  settings: string;
  whatsappReminders: string;

  // العناوين الفرعية
  addNewDebt: string;
  manageInstallments: string;
  whatsappRemindersTitle: string;
  appSettings: string;

  // الأزرار والإجراءات
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  confirm: string;
  send: string;
  search: string;
  filter: string;

  // الحالات
  active: string;
  inactive: string;
  completed: string;
  overdue: string;
  pending: string;

  // الرسائل والتنبيهات
  success: string;
  error: string;
  warning: string;
  info: string;
  loading: string;

  // رسائل محددة
  customerAdded: string;
  customerUpdated: string;
  customerDeleted: string;
  debtAdded: string;
  debtUpdated: string;
  debtDeleted: string;
  installmentAdded: string;
  installmentUpdated: string;
  installmentDeleted: string;
  paymentRecorded: string;
  messageSent: string;

  // حقول النماذج
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  amount: string;
  description: string;
  notes: string;
  date: string;
  dueDate: string;
  paymentMethod: string;
  status: string;

  // رسائل WhatsApp
  whatsappReminderMessage: string;

  // الإحصائيات
  total: string;
  today: string;
  tomorrow: string;
  thisWeek: string;
  thisMonth: string;

  // التحقق من الصحة
  requiredField: string;
  invalidPhone: string;
  invalidEmail: string;
  invalidAmount: string;

  // نصوص إضافية
  noInstallments: string;
  noSearchResults: string;
  addNewInstallment: string;
  registerPayment: string;
  loadingData: string;
  totalRemaining: string;
  upcomingPaymentsLabel: string;
  overdueLabel: string;
  saveSettingsLabel: string;
  exportDataLabel: string;
  importDataLabel: string;

  openMessage: string;
  templatesLabel: string;
  applyLabel: string;
  deleteLabel: string;
  addTemplate: string;
  manualNumberLabel: string;
  customersLoaded: string;
  noNumberLabel: string;
  sendBulkLabel: string;
  sending: string;

  // التأكيدات
  confirmDelete: string;
  confirmDeleteMessage: string;
  cannotUndo: string;
}

const arabicTranslations: Translations = {
  // التنقل والعناوين الرئيسية
  dashboard: 'لوحة التحكم',
  customers: 'العملاء',
  debts: 'الديون',
  installments: 'الأقساط',
  settings: 'الإعدادات',
  whatsappReminders: 'تنبيهات WhatsApp',

  // العناوين الفرعية
  addNewDebt: 'إضافة دين جديد',
  manageInstallments: 'إدارة الأقساط',
  whatsappRemindersTitle: 'تنبيهات WhatsApp',
  appSettings: 'إعدادات التطبيق',

  // الأزرار والإجراءات
  add: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  send: 'إرسال',
  search: 'بحث',
  filter: 'تصفية',

  // الحالات
  active: 'نشط',
  inactive: 'غير نشط',
  completed: 'مكتمل',
  overdue: 'متأخر',
  pending: 'في الانتظار',

  // الرسائل والتنبيهات
  success: 'نجح',
  error: 'خطأ',
  warning: 'تحذير',
  info: 'معلومات',
  loading: 'جاري التحميل...',

  // رسائل محددة
  customerAdded: 'تم إضافة العميل بنجاح',
  customerUpdated: 'تم تحديث بيانات العميل',
  customerDeleted: 'تم حذف العميل',
  debtAdded: 'تم إضافة الدين بنجاح',
  debtUpdated: 'تم تحديث الدين',
  debtDeleted: 'تم حذف الدين',
  installmentAdded: 'تم إضافة القسط بنجاح',
  installmentUpdated: 'تم تحديث القسط',
  installmentDeleted: 'تم حذف القسط',
  paymentRecorded: 'تم تسجيل الدفعة',
  messageSent: 'تم إرسال الرسالة',

  // حقول النماذج
  name: 'الاسم',
  phone: 'رقم الهاتف',
  whatsappNumber: 'رقم WhatsApp',
  email: 'البريد الإلكتروني',
  address: 'العنوان',
  amount: 'المبلغ',
  description: 'الوصف',
  notes: 'ملاحظات',
  date: 'التاريخ',
  dueDate: 'تاريخ الاستحقاق',
  paymentMethod: 'طريقة الدفع',
  status: 'الحالة',

  // رسائل WhatsApp
  whatsappReminderMessage: `مرحباً {customer_name}،

تذكير بدفع القسط المستحق:

📱 المنتج: {product_name}
💰 المبلغ: {amount} {currency}
📅 تاريخ الاستحقاق: {due_date}
⏰ باقي: {days_left} يوم

يرجى تسديد المبلغ في الموعد المحدد.

شكراً لتعاونكم.`,

  // الإحصائيات
  total: 'المجموع',
  today: 'اليوم',
  tomorrow: 'غداً',
  thisWeek: 'هذا الأسبوع',
  thisMonth: 'هذا الشهر',

  // التحقق من الصحة
  requiredField: 'هذا الحقل مطلوب',
  invalidPhone: 'رقم الهاتف غير صحيح',
  invalidEmail: 'البريد الإلكتروني غير صحيح',
  invalidAmount: 'المبلغ غير صحيح',

  // التأكيدات
  confirmDelete: 'تأكيد الحذف',
  confirmDeleteMessage: 'هل أنت متأكد من حذف هذا العنصر؟',
  cannotUndo: 'لا يمكن التراجع عن هذا الإجراء',
  noInstallments: 'لا توجد أقساط',
  noSearchResults: 'لم يتم العثور على نتائج للبحث',
  addNewInstallment: 'إضافة قسط جديد',
  registerPayment: 'تسجيل الدفعة',
  loadingData: 'جاري تحميل البيانات...',
  totalRemaining: 'إجمالي المبالغ المتبقية',
  upcomingPaymentsLabel: 'دفعات قادمة (7 أيام)',
  overdueLabel: 'الأقساط المتأخرة',
  saveSettingsLabel: 'حفظ الإعدادات',
  exportDataLabel: 'تصدير البيانات',
  importDataLabel: 'استيراد البيانات',
  openMessage: 'فتح رسالة',
  templatesLabel: 'قوالب الرسائل',
  applyLabel: 'تطبيق',
  deleteLabel: 'حذف',
  addTemplate: 'إضافة قالب',
  manualNumberLabel: 'أو أدخل رقم يدوي',
  customersLoaded: 'تم تحميل {count} عميل',
  noNumberLabel: 'بدون رقم',
  sendBulkLabel: 'إرسال تنبيهات جماعية',
  sending: 'جاري الإرسال...',
};

const kurdishTranslations: Translations = {
  // التنقل والعناوين الرئيسية
  dashboard: 'دەستپێک',
  customers: 'کڕیاران',
  debts: 'قەرزان',
  installments: 'قیستان',
  settings: 'ڕێکخستنەکان',
  whatsappReminders: 'بیرهێنانەوەکانی WhatsApp',

  // العناوين الفرعية
  addNewDebt: 'زیادکردنی قەرزێکی نوێ',
  manageInstallments: 'بەڕێوەبردنی قیستان',
  whatsappRemindersTitle: 'بیرهێنانەوەکانی WhatsApp',
  appSettings: 'ڕێکخستنەکانی بەرنامە',

  // الأزرار والإجراءات
  add: 'زیادکردن',
  edit: 'دەستکاری',
  delete: 'سڕینەوە',
  save: 'پاشەکەوتکردن',
  cancel: 'پاشگەزبوونەوە',
  confirm: 'پشتڕاستکردنەوە',
  send: 'ناردن',
  search: 'گەڕان',
  filter: 'پاڵاوتن',

  // الحالات
  active: 'چالاک',
  inactive: 'ناچالاک',
  completed: 'تەواوبوو',
  overdue: 'دواخراو',
  pending: 'لە چاوەڕوانیدا',

  // الرسائل والتنبيهات
  success: 'سەرکەوتوو',
  error: 'هەڵە',
  warning: 'ئاگاداری',
  info: 'زانیاری',
  loading: 'بارکردن...',

  // رسائل محددة
  customerAdded: 'کڕیار بە سەرکەوتوویی زیادکرا',
  customerUpdated: 'زانیاری کڕیار نوێکرایەوە',
  customerDeleted: 'کڕیار سڕایەوە',
  debtAdded: 'قەرز بە سەرکەوتوویی زیادکرا',
  debtUpdated: 'قەرز نوێکرایەوە',
  installmentAdded: 'قیست بە سەرکەوتوویی زیادکرا',
  installmentUpdated: 'قیست نوێکرایەوە',
  installmentDeleted: 'قیست سڕایەوە',
  debtDeleted: 'قەرز سڕایەوە',
  paymentRecorded: 'پارەدان تۆمارکرا',
  messageSent: 'نامە نێردرا',

  // حقول النماذج
  name: 'ناو',
  phone: 'ژمارەی تەلەفۆن',
  whatsappNumber: 'ژمارەی WhatsApp',
  email: 'ئیمەیڵ',
  address: 'ناونیشان',
  amount: 'بڕ',
  description: 'وەسف',
  notes: 'تێبینیەکان',
  date: 'ڕێکەوت',
  dueDate: 'ڕێکەوتی دەستپێکردن',
  paymentMethod: 'شێوازی پارەدان',
  status: 'دۆخ',

  // رسائل WhatsApp
  whatsappReminderMessage: `سڵاو {customer_name}،

بیرهێنانەوەی پارەدان بۆ قیست:

📱 بەرهەم: {product_name}
💰 بڕ: {amount} {currency}
📅 ڕێکەوتی دەستپێکردن: {due_date}
⏰ ماوە: {days_left} ڕۆژ

تکایە پارەکە لە کاتی دیاریکراو بدە.

سوپاس بۆ هاوکاریتان.`,

  // الإحصائيات
  total: 'کۆی گشتی',
  today: 'ئەمڕۆ',
  tomorrow: 'سبەی',
  thisWeek: 'ئەم هەفتەیە',
  thisMonth: 'ئەم مانگە',

  // التحقق من الصحة
  requiredField: 'ئەم خانەیە پێویستە',
  invalidPhone: 'ژمارەی تەلەفۆن نادروستە',
  invalidEmail: 'ئیمەیڵ نادروستە',
  invalidAmount: 'بڕ نادروستە',

  // التأكيدات
  confirmDelete: 'پشتڕاستکردنەوەی سڕینەوە',
  confirmDeleteMessage: 'دڵنیایت لە سڕینەوەی ئەم بڕگەیە؟',
  cannotUndo: 'ناتوانرێت بگەڕێتەوە لەم کردارە',
  noInstallments: 'قیستێک نییە',
  noSearchResults: 'هیچ ئەنجامێک نەدۆزرایەوە',
  addNewInstallment: 'زیادکردنی قیستێکی نوێ',
  registerPayment: 'تۆماری پارەدان',
  loadingData: 'بارکردن...',
  totalRemaining: 'کۆی بڕەکانی ماوە',
  upcomingPaymentsLabel: 'پارەدانە داهاتووەکان (7 ڕۆژ)',
  overdueLabel: 'قیستە دواخراوەکان',
  saveSettingsLabel: 'پاشەکەوتکردنی ڕێکخستنەکان',
  exportDataLabel: 'دراوکردنی داتا',
  importDataLabel: 'هێنانەوەی داتا',
  openMessage: 'کردنەوەی نامە',
  templatesLabel: 'قالبە نامەکان',
  applyLabel: 'ئەپلای',
  deleteLabel: 'سڕینەوە',
  addTemplate: 'زیادکردنی قالب',
  manualNumberLabel: 'یان ژمارەی دەستکار بکە',
  customersLoaded: 'بارکرایەوە {count} کڕیار',
  noNumberLabel: 'بێ ژمارە',
  sendBulkLabel: 'ناردنی بیرەهێنانەوەی گروپی',
  sending: 'ناردن...',
};

export const translations: Record<Language, Translations> = {
  ar: arabicTranslations,
  ku: kurdishTranslations,
};

// دالة للحصول على الترجمة الحالية
export const getTranslation = (language: Language): Translations => {
  return translations[language] || translations.ar;
};

// دالة للحصول على نص مترجم
export const t = (key: keyof Translations, language: Language = 'ar'): string => {
  return getTranslation(language)[key];
};

// دالة للحصول على اللغة الحالية من localStorage
export const getCurrentLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app_language');
    if (saved === 'ar' || saved === 'ku') {
      return saved;
    }
  }
  return 'ar'; // الافتراضي العربية
};

// دالة لحفظ اللغة الحالية
export const setCurrentLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_language', language);
  }
};
