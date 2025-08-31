type ReceiptData = {
  receiptId?: string;
  logo?: string;
  payerName: string;
  payerPhone?: string;
  productName?: string;
  amount: number;
  currency?: string;
  method?: string;
  date?: string;
  remaining?: number;
  notes?: string;
};

export function printReceipt(data: ReceiptData) {
  try {
  // open a writable about:blank window (avoid noopener which can restrict document access in some browsers)
  const win = window.open('about:blank', '_blank');
  if (!win) return;

    const style = `
      @page { size: A4 portrait; margin: 10mm; }
      html, body { height: 100%; }
      body { font-family: Arial, 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif; color: #111827; margin: 0; padding: 0; background: #fff; }
      /* Use full portrait flow: top-to-bottom, not centered horizontally */
      .sheet { width: 100%; min-height: 297mm; box-sizing: border-box; padding: 0; }
      .receipt { box-sizing: border-box; width: calc(210mm - 20mm); /* content width within portrait margins */ background: #fff; border-radius: 6px; padding: 18mm; margin: 0 auto 10mm auto; border: 1px solid #e6e7eb; }
      .header { display:flex; align-items:center; justify-content:space-between; gap:12px; direction: rtl; }
      .brand { display:flex; gap:12px; align-items:center; }
  .logo { width:64px; height:64px; background: linear-gradient(135deg,#4f46e5,#06b6d4); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:20px; }
  .logo-img { display:block; margin: 0 auto 8px auto; max-width:160px; height:auto; }
      .company { text-align:right; }
      .company .name { font-size:20px; font-weight:700; color:#0f172a; }
      .company .meta { font-size:12px; color:#475569; }
      .muted { color: #64748b; font-size: 12px; }
      .details { margin-top: 14px; display:flex; justify-content:space-between; gap:12px; direction: rtl; }
      .left, .right { width: 48%; }
      .row { display:flex; justify-content:space-between; margin:8px 0; direction: rtl; }
      .label { color:#64748b; font-size:12px; }
      .value { color:#0f172a; font-weight:600; }
      .amount { font-size:22px; font-weight:800; color:#0b3b6f; }
      hr.sep { border: none; border-top: 1px dashed #e6edf3; margin: 14px 0; }
      .footer { margin-top:18px; text-align:center; font-size:12px; color:#475569; }
      /* print optimizations */
      @media print {
        body { margin: 0; }
        .sheet { box-shadow: none; padding-top: 0; }
        .receipt { border: none; padding: 16mm; margin: 0; }
        /* ensure portrait page-break behavior */
        .receipt { page-break-inside: avoid; }
      }
    `;

    const html = `
      <html lang="ar">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>وصل قبض</title>
        <style>${style}</style>
      </head>
      <body dir="rtl">
        <div class="sheet">
          <div class="receipt">
            ${data.logo ? `<div style="text-align:center; margin-bottom:6px;"><img class="logo-img" src="${escapeHtml(data.logo)}" alt="logo"/></div>` : ''}
            <div class="header">
              <div class="brand">
                <div class="logo">Q</div>
                <div class="company">
                  <div class="name">نظام Qist</div>
                  <div class="meta">وصل قبض — Qist Manage Mate</div>
                </div>
              </div>
              <div style="text-align:left; direction:ltr;">
                <div class="muted">وصل قبض</div>
                <div class="muted">${escapeHtml(data.receiptId || '')}</div>
              </div>
            </div>

            <div class="details">
              <div class="left">
                <div class="row"><div class="label">الاسم</div><div class="value">${escapeHtml(data.payerName)}</div></div>
                ${data.payerPhone ? `<div class="row"><div class="label">الهاتف</div><div class="value">${escapeHtml(data.payerPhone)}</div></div>` : ''}
                ${data.productName ? `<div class="row"><div class="label">المنتج</div><div class="value">${escapeHtml(data.productName)}</div></div>` : ''}
              </div>
              <div class="right">
                <div class="row"><div class="label">التاريخ</div><div class="value">${escapeHtml(data.date || new Date().toLocaleString())}</div></div>
                <div class="row"><div class="label">الطريقة</div><div class="value">${escapeHtml(data.method || 'نقداً')}</div></div>
                ${typeof data.remaining === 'number' ? `<div class="row"><div class="label">المتبقي</div><div class="value">${formatCurrency(data.remaining, data.currency)}</div></div>` : ''}
              </div>
            </div>

            <hr class="sep" />

            <div style="margin-top:8mm; text-align:center;">
              <div style="font-size:14px; color:#64748b;">المبلغ المستلم</div>
              <div class="amount" style="margin-top:6px;">${formatCurrency(data.amount, data.currency)}</div>
            </div>

            ${data.notes ? `<hr class="sep" /><div style="margin-top:6px; color:#374151;">ملاحظة: ${escapeHtml(data.notes)}</div>` : ''}

            <div class="footer">هذا الإيصال يعتبر سند استلام مبالغ من قبل المؤسسة.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // write content and focus the new window
    try {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
    } catch (e) {
      // some browsers may block document access; abort
      return;
    }

    // Wait for styles to apply and for the window to render, then trigger print
    setTimeout(() => {
      try { win.print(); } catch (e) { /* ignore */ }
    }, 700);
  } catch (e) {
    // noop
  }
}

function escapeHtml(s: string | undefined) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function formatCurrency(amount: number, currency?: string) {
  try {
    if (!currency) return amount.toLocaleString();
    // simple formatting: use en-US for USD, ar-IQ for IQD
    if (currency.toLowerCase().includes('usd')) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
  } catch (e) {
    return String(amount);
  }
}

export default printReceipt;
