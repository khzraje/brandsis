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
  view: string;
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

  // additional labels found in UI / settings
  outstandingInstallmentsTotal: string;
  hasWhatsappNumber: string;
  dueToday: string;
  totalOverdueDebts: string;
  sendOverdueDebtsReminders: string;
  enableWhatsApp: string;
  whatsappApiUrl: string;
  whatsappApiKey: string;
  senderNumber: string;
  daysBeforeReminder: string;

  appSettingsAndBackups: string;
  appearance: string;
  theme: string;
  dark: string;
  primaryColor: string;
  languageUsed: string;
  kurdishSoraniLabel: string;
  languageChangeConfirmMessage: string;
  languageInfo: string;

  currencySettings: string;
  currencyUsed: string;
  IQDLabel: string;
  currencyInfo: string;

  enableNotifications: string;
  inAppNotifications: string;

  telegramSettings: string;
  enableTelegram: string;
  telegramBotToken: string;
  telegramChatId: string;

  createBackupLabel: string;
  noFileChosenLabel: string;
  restoreBackupLabel: string;
  importWarningMessage: string;

  overviewLabel: string;
  newDebtLabel: string;
  newInstallmentLabel: string;
  totalDebtsLabel: string;
  totalInstallmentsLabel: string;
  activeClientsLabel: string;
  activeClientsCountLabel: string;
  overduePaymentsDashboardLabel: string;
  recentDebtsLabel: string;
  viewAllDebts: string;
  viewAllInstallments: string;
  noUpcomingInstallmentsLabel: string;
  manageCustomersLabel: string;
  addNewCustomerLabel: string;
  searchCustomersPlaceholder: string;
  totalCustomersLabel: string;
  logoutButton: string;

  // dashboard specific
  dashboardSubtitle: string;
  newDebtButton: string;
  newInstallmentButton: string;
  dashboardGrowth: string;
  activeCustomersLabel: string;
  overduePaymentsLabel: string;
  recentDebtsTitle: string;
  upcomingInstallmentsTitle: string;
  noRecentDebts: string;
  noUpcomingInstallments: string;
  dueLabel: string;
  upcomingLabel: string;

  // whatsapp specific
  overdueDebtMessage: string;
  whatsappEnabled: string;
  whatsappDisabled: string;
  enableCustomer: string;
  disableCustomer: string;
  customerEnabled: string;
  customerDisabled: string;
  whatsappStatus: string;

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
  deleteDebtConfirm: string;
  deleteDebtMessage: string;
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
  view: 'عرض',
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
  deleteDebtConfirm: 'تأكيد حذف الدين',
  deleteDebtMessage: 'هل أنت متأكد من حذف هذا الدين؟ سيتم حذف جميع البيانات المتعلقة بهذا الدين نهائياً.',
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

  // additional labels
  outstandingInstallmentsTotal: 'إجمالي الأقساط المستحقة:',
  hasWhatsappNumber: 'لها رقم WhatsApp:',
  dueToday: 'مستحقة اليوم:',
  totalOverdueDebts: 'إجمالي الديون المتأخرة:',
  sendOverdueDebtsReminders: 'إرسال تنبيهات الديون المتأخرة',
  enableWhatsApp: 'تمكين WhatsApp',
  whatsappApiUrl: 'رابط API الواتساب',
  whatsappApiKey: 'مفتاح API',
  senderNumber: 'رقم المرسل',
  daysBeforeReminder: 'عدد الأيام قبل التنبيه',

  appSettingsAndBackups: 'إعدادات التطبيق والنسخ الاحتياطية',
  appearance: 'المظهر',
  theme: 'سمة التطبيق',
  dark: 'غامق',
  primaryColor: 'اللون الأساسي',
  languageUsed: 'اللغة المستخدمة',
  kurdishSoraniLabel: 'کوردیی سۆرانی',
  languageChangeConfirmMessage: 'سيتم تغيير لغة التطبيق إلى الكردية السورانية',
  languageInfo: '• العربية: اللغة الافتراضية للتطبيق\n\n• کوردیی سۆرانی: اللغة الكردية السورانية\n\n• يمكن تغيير اللغة في أي وقت\n\n• سيتم حفظ اختيارك تلقائياً',

  currencySettings: 'إعدادات العملة',
  currencyUsed: 'العملة المستخدمة',
  IQDLabel: 'الدينار العراقي (IQD)',
  currencyInfo: '• الدينار العراقي (IQD): العملة الرسمية في العراق\n\n• الدولار الأمريكي (USD): العملة الدولية\n\n• يمكن تغيير العملة في أي وقت\n\n• سيتم تحديث جميع العرض في التطبيق فوراً',

  enableNotifications: 'تمكين الإشعارات',
  inAppNotifications: 'استقبال إشعارات داخل التطبيق',

  telegramSettings: 'إعدادات تليجرام',
  enableTelegram: 'تمكين تليجرام',
  telegramBotToken: 'رمز البوت (Bot Token)',
  telegramChatId: 'معرف المحادثة (Chat ID)',

  createBackupLabel: 'إنشاء نسخة احتياطية',
  noFileChosenLabel: 'No file chosen',
  restoreBackupLabel: 'استعادة نسخة احتياطية',
  importWarningMessage: 'تنبيه: استيراد البيانات سيحل محل جميع البيانات الحالية. تأكد من إنشاء نسخة احتياطية قبل الاستيراد.',

  overviewLabel: 'نظرة شاملة على الديون والأقساط',
  newDebtLabel: 'دين جديد',
  newInstallmentLabel: 'قسط جديد',
  totalDebtsLabel: 'إجمالي الديون',
  totalInstallmentsLabel: 'إجمالي الأقساط',
  activeClientsLabel: 'العملاء النشطون',
  activeClientsCountLabel: 'عميل نشط',
  overduePaymentsDashboardLabel: 'المدفوعات المتأخرة',
  recentDebtsLabel: 'الديون الحديثة',
  viewAllDebts: 'عرض جميع الديون',
  viewAllInstallments: 'عرض جميع الأقساط',
  noUpcomingInstallmentsLabel: 'لا توجد أقساط قادمة',
  manageCustomersLabel: 'إدارة العملاء',
  addNewCustomerLabel: 'إضافة عميل جديد',
  searchCustomersPlaceholder: 'البحث في العملاء...',
  totalCustomersLabel: 'إجمالي العملاء',
  logoutButton: 'زر تسجيل الخروج',

  // dashboard specific
  dashboardSubtitle: 'نظرة شاملة على الديون والأقساط',
  newDebtButton: 'دين جديد',
  newInstallmentButton: 'قسط جديد',
  dashboardGrowth: '+ %d من الشهر الماضي',
  activeCustomersLabel: 'العملاء النشطون',
  overduePaymentsLabel: 'المدفوعات المتأخرة',
  recentDebtsTitle: 'الديون الحديثة',
  upcomingInstallmentsTitle: 'الأقساط القادمة',
  noRecentDebts: 'لا توجد ديون حديثة',
  noUpcomingInstallments: 'لا توجد أقساط قادمة',
  dueLabel: 'الاستحقاق',
  upcomingLabel: 'قادم',

  // whatsapp specific
  overdueDebtMessage: `مرحباً {customer_name}،\n\nتذكير بدفع الدين المستحق:\n\n💰 المبلغ: {amount} {currency}\n📅 تاريخ الاستحقاق: {due_date}\n⏰ متأخر: {days_overdue} يوم\n\n{description}يرجى تسديد المبلغ في أقرب وقت ممكن.\n\nشكراً لتعاونكم.`,
  whatsappEnabled: 'نشط لـ WhatsApp',
  whatsappDisabled: 'معطل لـ WhatsApp',
  enableCustomer: 'تشغيل العميل',
  disableCustomer: 'تعطيل العميل',
  customerEnabled: 'تم تشغيل العميل',
  customerDisabled: 'تم تعطيل العميل',
  whatsappStatus: 'حالة WhatsApp',
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
  view: 'بینین',
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
  whatsappReminderMessage: `سڵاو بەرێز {customer_name}،

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
  deleteDebtConfirm: 'پشتڕاستکردنەوەی سڕینەوەی قەرز',
  deleteDebtMessage: 'دڵنیایت لە سڕینەوەی ئەم قەرزە؟ هەموو زانیارییە پەیوەندیدارەکانی ئەم قەرزە بە تەواوی دەسڕدرێتەوە.',
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

  // additional labels
  outstandingInstallmentsTotal: 'کۆی قەسطەکانی دەسەنگرابوو:',
  hasWhatsappNumber: 'ژمارەی WhatsApp هەیە:',
  dueToday: 'ئەمڕۆ دەستپێکراوە:',
  totalOverdueDebts: 'کۆی قەرزە دواخراوەکان:',
  sendOverdueDebtsReminders: 'ناردنی بیرهێنانی قەرزانى دواخراو',
  enableWhatsApp: 'چالاککردنی WhatsApp',
  whatsappApiUrl: 'ڕێکەوتی API ی واتسئاپ',
  whatsappApiKey: 'کلیل API',
  senderNumber: 'ژمارەی نێردەر',
  daysBeforeReminder: 'ژمارەی ڕۆژ پێش ئاگاداری',

  appSettingsAndBackups: 'ڕێکخستنەکانی بەرنامە و پاشەکەوتەکان',
  appearance: 'ڕووکار',
  theme: 'شێوەی بەرنامە',
  dark: 'تاریک',
  primaryColor: 'ڕەنگی سەرەکی',
  languageUsed: 'زمانی بەکارھاتوو',
  kurdishSoraniLabel: 'کوردیی سۆرانی',
  languageChangeConfirmMessage: 'زمانی بەرنامە دەگۆڕدرێتەوە بۆ کوردیی سۆرانی',
  languageInfo: '• عەرەبی: زمانە بنەڕەتییەکەی بەرنامە\n\n• کوردیی سۆرانی: زمانى کوردى سۆرانی\n\n• دەتوانیت زمانەکە بگۆڕیت هەر کاتێک\n\n• هەڵبژاردنی تۆ بەخۆی پاشەکەوت دەکرێت',

  currencySettings: 'ڕێکخستنەکانی دراو',
  currencyUsed: 'درایە بەکارهاتوو',
  IQDLabel: 'دیناری عێراقی (IQD)',
  currencyInfo: '• دیناری عێراقی (IQD): دراوە رەسمییەکەی عێراق\n\n• دۆلارى ئەمەریکا (USD): دراوی نێودەوڵەتی\n\n• دەتوانرێت دراوەکە هەر کاتێک بگۆڕدرێت\n\n• هەموو نیشاندانی بەرنامەدابەزێتەوە',

  enableNotifications: 'چالاککردنی ئاگادارییەکان',
  inAppNotifications: 'وەرگرتنی ئاگاداری لە ناو بەرنامە',

  telegramSettings: 'ڕێکخستنەکانی تێلێگرام',
  enableTelegram: 'چالاککردنی تێلێگرام',
  telegramBotToken: 'کۆدی بۆت (Bot Token)',
  telegramChatId: 'ناسنامەی گفتوگۆ (Chat ID)',

  createBackupLabel: 'دروستکردنی پاشەکەوتەوە',
  noFileChosenLabel: 'No file chosen',
  restoreBackupLabel: 'گەڕاندنەوەی پاشەکەوت',
  importWarningMessage: 'ئاگاداری: هێنانەوەی داتا هەموو داتاکان دەگۆڕێت. تکایە پێش هێنانەوە، پاشەکەوتێک دروست بکە.',

  overviewLabel: 'پوختەیەکی گشتی لەسەر قەرزان و قەسطەکان',
  newDebtLabel: 'قەرزی نوێ',
  newInstallmentLabel: 'قیستی نوێ',
  totalDebtsLabel: 'کۆی قەرزان',
  totalInstallmentsLabel: 'کۆی قەسطەکان',
  activeClientsLabel: 'کڕیارانی چالاک',
  activeClientsCountLabel: 'کڕیارێکی چالاک',
  overduePaymentsDashboardLabel: 'پارەدانە دواخراوەکان',
  recentDebtsLabel: 'قەرزە نوێکان',
  viewAllDebts: 'بینینی هەموو قەرزان',
  viewAllInstallments: 'بینینی هەموو قەسطەکان',
  noUpcomingInstallmentsLabel: 'قەسطێک ئەم مۆنە نییە',
  manageCustomersLabel: 'بەڕێوەبردنی کڕیاران',
  addNewCustomerLabel: 'زیادکردنی کڕیارێکی نوێ',
  searchCustomersPlaceholder: 'گەڕان لە کڕیاران...',
  totalCustomersLabel: 'کۆی کڕیاران',
  logoutButton: 'تکایە دەرچوون (Logout)',

  // dashboard specific
  dashboardSubtitle: 'پوختەیەکی گشتی لەسەر قەرزان و قەسطەکان',
  newDebtButton: 'قەرزی نوێ',
  newInstallmentButton: 'قیستی نوێ',
  dashboardGrowth: '+ %d لە مانگی ڕابردوو',
  activeCustomersLabel: 'کڕیارانی چالاک',
  overduePaymentsLabel: 'پارەدانە دواخراوەکان',
  recentDebtsTitle: 'قەرزە نوێکان',
  upcomingInstallmentsTitle: 'قیستە داهاتووەکان',
  noRecentDebts: 'قەرزی نوێ نییە',
  noUpcomingInstallments: 'قیستی داهاتوو نییە',
  dueLabel: 'دەستپێکردن',
  upcomingLabel: 'داهاتوو',

  // whatsapp specific
  overdueDebtMessage: `سڵاو بەرێز {customer_name}،\n بە داوای لێ بوردنەوە ئەم نامەیە لە سیستەمەوە نێردراوە ، تەنها بیرهێنانەوەیە کە بڕە پارەیەک ماوە لەسەر بەرێزتان:\n\n💰 بڕ: {amount} {currency}\n📅 ڕێکەوتی کڕین: {due_date}\n⏰ دواخراو: {days_overdue} ڕۆژ\n\n{description}چاوەڕێی سەردانی بەرێزتانین.\n\nسوپاس بۆ هاوکاریتان.`,
  whatsappEnabled: 'چالاک بۆ WhatsApp',
  whatsappDisabled: 'ناچالاک بۆ WhatsApp',
  enableCustomer: 'چالاککردنی کڕیار',
  disableCustomer: 'ناچالاککردنی کڕیار',
  customerEnabled: 'کڕیار چالاککرا',
  customerDisabled: 'کڕیار ناچالاککرا',
  whatsappStatus: 'دۆخی WhatsApp',
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
