
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id?: string;
  name?: string;
  // backward-compatible primary price (IQD preferred)
  price?: number;
  // separate currency fields when available
  priceIQD?: number;
  priceUSD?: number;
  createdAt: string;
}

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPriceIQD, setEditPriceIQD] = useState<string>("");
  const [editPriceUSD, setEditPriceUSD] = useState<string>("");
  const { toast } = useToast();

  // استيراد المنتجات من ملف JSON
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.products || !Array.isArray(json.products)) {
        toast({ title: "خطأ في الملف", description: "الملف لا يحتوي على منتجات" });
        setLoading(false);
        return;
      }
      // مساعدة لاستخراج السعر من مفاتيح مختلفة بصيغ متعددة
      const normalizeDigits = (s: string) => {
        // convert Arabic-Indic and Extended Arabic-Indic digits to Latin digits
        const map: Record<string, string> = {
          '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
          '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
        };
        return s.replace(/[٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹]/g, d => map[d] ?? d);
      };

      const parseNumericString = (raw: string) => {
        if (!raw) return NaN;
        let s = normalizeDigits(String(raw)).trim();
  // remove whitespace (spaces, NBSP, tabs, newlines)
  s = s.replace(/\s+/g, '');
        // if contains both '.' and ',', decide which is decimal separator
        const hasDot = s.indexOf('.') !== -1;
        const hasComma = s.indexOf(',') !== -1;
        if (hasDot && hasComma) {
          // if last comma appears after last dot, treat comma as decimal separator
          if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            s = s.replace(/\./g, ''); // remove thousand separators
            s = s.replace(/,/g, '.'); // comma -> decimal
          } else {
            s = s.replace(/,/g, ''); // remove thousand separators
          }
        } else if (hasComma && !hasDot) {
          // common thousands with comma -> remove commas
          s = s.replace(/,/g, '');
        }
        // finally remove any remaining non-digit except dot and minus
        s = s.replace(/[^0-9.-]+/g, '');
        return parseFloat(s);
      };

  const extractPrice = (obj: unknown): number => {
        if (obj == null) return 0;
        if (typeof obj !== 'object') return 0;
        const record = obj as Record<string, unknown>;
        const candidates = [
          'price', 'amount', 'unitPrice', 'unit_price', 'سعر', 'السعر', 'cost'
        ];
        for (const key of candidates) {
          if (Object.prototype.hasOwnProperty.call(record, key)) {
            const v = record[key];
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const n = parseNumericString(v);
              if (!Number.isNaN(n)) return n;
            }
          }
        }
        // بعض النسخ قد تحوي السعر داخل كائن مثل { price: { value: 100 } }
        const priceField = record['price'];
        if (priceField && typeof priceField === 'object') {
          const priceRec = priceField as Record<string, unknown>;
          const v = priceRec['value'] ?? priceRec['amount'];
          if (typeof v === 'number') return v;
          if (typeof v === 'string') {
            const n = parseNumericString(v);
            if (!Number.isNaN(n)) return n;
          }
        }
        return 0;
      };

      // extract currency-aware values: IQD and USD candidates
      const extractCurrency = (obj: unknown, candidates: string[]) => {
        if (obj == null || typeof obj !== 'object') return 0;
        const rec = obj as Record<string, unknown>;
        for (const key of candidates) {
          if (Object.prototype.hasOwnProperty.call(rec, key)) {
            const v = rec[key];
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const n = parseNumericString(v);
              if (!Number.isNaN(n)) return n;
            }
          }
        }
        return 0;
      };

      // إضافة id لكل منتج، وتوحيد الحقول (price كرقم، createdAt موجود)
      const usdCandidates = ['price_usd', 'usd', 'dollar', 'priceDollar', 'price_dollar', 'amount_usd'];
      const iqdCandidates = ['price', 'amount', 'unitPrice', 'unit_price', 'سعر', 'السعر', 'cost', 'price_iqd', 'iqd'];

      const imported = json.products.map((p: unknown, idx: number) => {
        const rec = (p && typeof p === 'object') ? (p as Record<string, unknown>) : {} as Record<string, unknown>;
        let priceUSD = extractCurrency(rec, usdCandidates);
        let priceIQD = extractCurrency(rec, iqdCandidates);
        // If IQD missing but USD present, try to parse price field
        if (!priceIQD && !priceUSD) {
          const fallback = extractPrice(rec);
          // heuristics: if fallback is large, treat as IQD
          if (fallback >= 100) priceIQD = fallback;
          else priceUSD = fallback;
        }
        // normalize decimals: IQD integers, USD two decimals
        if (priceIQD) {
          // heuristic: if IQD parsed is small (e.g. 245) it's likely shorthand for thousands -> 245,000
          if (priceIQD > 0 && priceIQD < 1000) {
            priceIQD = Math.round(priceIQD * 1000);
          } else {
            priceIQD = Math.round(priceIQD);
          }
        }
        if (priceUSD) priceUSD = Math.round(priceUSD * 100) / 100;
        const primary = priceIQD || priceUSD || 0;
        return {
          id: (rec['id'] && String(rec['id'])) || `${Date.now()}-${idx}`,
          name: String(rec['name'] ?? rec['title'] ?? rec['اسم'] ?? 'بدون اسم'),
          price: Number(primary),
          priceIQD: priceIQD || undefined,
          priceUSD: priceUSD || undefined,
          createdAt: String(rec['createdAt'] ?? rec['created_at'] ?? new Date().toISOString()),
        };
      });
      setProducts(imported);
      localStorage.setItem("inventoryProducts", JSON.stringify(imported));
      toast({ title: "تم الاستيراد", description: `تم استيراد ${imported.length} منتج` });

      // حاول مزامنة الاستيراد مع Supabase (إن وُجد جدول inventory)
      try {
        if (imported.length > 0 && typeof supabase !== 'undefined') {
          const toUpsert = imported.map(p => ({
            name: p.name,
            price: p.price,
            price_iqd: p.priceIQD ?? null,
            price_usd: p.priceUSD ?? null,
            created_at: p.createdAt,
          }));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: upsertErr } = await (supabase as any).from('inventory').upsert(toUpsert);
          if (upsertErr) throw upsertErr;
          // حذف أي منتجات في DB غير موجودة في الاستيراد
          const ids = toUpsert.map(i => i.id).filter(Boolean) as string[];
          if (ids.length > 0) {
            // build comma-separated list without extra quotes (uuids should not be wrapped with extra quotes)
            const idsFilter = ids.map(id => id).join(',');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: delErr } = await (supabase as any).from('inventory').delete().not('id', 'in', `(${idsFilter})`);
            if (delErr) throw delErr;
          }
          toast({ title: 'مزامنة', description: 'تم تحديث المخزون في قاعدة البيانات' });
        }
      } catch (dbErr: unknown) {
        console.error('Supabase sync failed', dbErr);
  const msg = typeof dbErr === 'object' && dbErr !== null && 'message' in dbErr ? String((dbErr as Record<string, unknown>)['message']) : String(dbErr);
        toast({ title: 'مزامنة قاعدة البيانات فشلت', description: msg });
      }
    } catch (err) {
      console.error('import error', err);
      toast({ title: "خطأ في الاستيراد", description: String(err ?? 'صيغة الملف غير صحيحة') });
    }
    setLoading(false);
  };

  // حذف منتج
  const handleDelete = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem("inventoryProducts", JSON.stringify(updated));
    toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح" });
  };

  // فتح نافذة التعديل
  const openEditDialog = (product: Product) => {
    setEditDialog(product);
    setEditName(product.name || "");
  // populate price fields for editing
  setEditPriceIQD(product.priceIQD !== undefined && product.priceIQD !== null ? String(product.priceIQD) : (product.price ? String(product.price) : ""));
  setEditPriceUSD(product.priceUSD !== undefined && product.priceUSD !== null ? String(product.priceUSD) : "");
  };

  // حفظ التعديل
  const handleEditSave = async () => {
    if (!editDialog) return;
    // parse price inputs
    const parsedIQD = editPriceIQD ? Number(editPriceIQD) : undefined;
    const parsedUSD = editPriceUSD ? Number(editPriceUSD) : undefined;

    const updated = products.map(p => p.id === editDialog.id ? {
      ...p,
      name: editName,
      priceIQD: parsedIQD !== undefined && !Number.isNaN(parsedIQD) ? Math.round(parsedIQD) : undefined,
      priceUSD: parsedUSD !== undefined && !Number.isNaN(parsedUSD) ? Math.round(parsedUSD * 100) / 100 : undefined,
      price: (parsedIQD && !Number.isNaN(parsedIQD)) ? Math.round(parsedIQD) : ((parsedUSD && !Number.isNaN(parsedUSD)) ? Math.round(parsedUSD * 100) / 100 : p.price),
    } : p);

    setProducts(updated);
    localStorage.setItem("inventoryProducts", JSON.stringify(updated));

    // close dialog and clear edit fields
    setEditDialog(null);
    setEditPriceIQD("");
    setEditPriceUSD("");

    toast({ title: "تم التعديل", description: "تم تعديل المنتج بنجاح" });

    // try to persist change to Supabase (best-effort)
    try {
      const prod = updated.find(p => p.id === editDialog.id);
      if (prod && typeof supabase !== 'undefined') {
        const row = {
          id: prod.id,
          name: prod.name,
          price: prod.price ?? null,
          price_iqd: prod.priceIQD ?? null,
          price_usd: prod.priceUSD ?? null,
          created_at: prod.createdAt ?? new Date().toISOString(),
        };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('inventory').upsert([row]);
        if (error) throw error;
        toast({ title: 'مزامنة', description: 'تم حفظ التعديلات في قاعدة البيانات' });
      }
    } catch (dbErr: unknown) {
      console.error('Failed to upsert edited product', dbErr);
  const msg = typeof dbErr === 'object' && dbErr !== null && 'message' in dbErr ? String((dbErr as Record<string, unknown>)['message']) : String(dbErr);
      toast({ title: 'خطأ في المزامنة', description: msg });
    }
  };

  // البحث
  useEffect(() => {
    // تحميل المنتجات من localStorage عند فتح الصفحة
    const stored = localStorage.getItem("inventoryProducts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setProducts(parsed);
      } catch (err) {
        console.error('Failed to parse stored inventory', err);
        toast({ title: 'خطأ', description: 'فشل قراءة بيانات المخزون من المتصفح' });
      }
    }
    // محاولة جلب المنتجات من قاعدة البيانات إن أمكن لتأكيد الحقول (price_usd/price_iqd)
    (async () => {
      try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('inventory').select('id,name,price,price_iqd,price_usd,created_at');
        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((r: unknown) => {
            const rec = r as Record<string, unknown>;
            return {
              id: String(rec['id']),
              name: String(rec['name'] ?? ''),
              price: (rec['price'] ?? (rec['price_iqd'] ?? rec['price_usd'])) as number ?? 0,
              priceIQD: (rec['price_iqd'] as number) ?? undefined,
              priceUSD: (rec['price_usd'] as number) ?? undefined,
              createdAt: rec['created_at'] ?? String(new Date().toISOString()),
            };
          });
          setProducts(mapped);
          localStorage.setItem('inventoryProducts', JSON.stringify(mapped));
        }
      } catch (e) {
        /* ignore DB fetch errors — fallback to localStorage */
      }
    })();
  }, [toast]);

  const filteredProducts = products.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <input type="file" accept=".json" onChange={handleImport} disabled={loading} />
            <Button disabled={loading} className="ml-2">استيراد المنتجات</Button>
            <Input placeholder="بحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          </div>
          <div>
            <h2 className="font-bold mb-2">قائمة المنتجات:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod, idx) => (
                typeof prod === 'object' && prod !== null ? (
                  <Card key={String(prod.id) || idx} className="shadow border">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold font-sans truncate">{typeof prod.name === 'string' ? prod.name : "منتج بدون اسم"}</CardTitle>
                      </CardHeader>
                    <CardContent>
                        <div className="mb-2 text-muted-foreground">تاريخ الإضافة: {prod.createdAt ? new Date(prod.createdAt).toLocaleString() : "غير محدد"}</div>
                        <div className="mb-2 font-bold">
                          السعر: {' '}
                          {prod.priceIQD ? (
                            <>
                              {new Intl.NumberFormat('ar-IQ').format(prod.priceIQD)} د.ع
                              {prod.priceUSD ? (
                                <span className="ml-2 text-sm text-muted-foreground">({new Intl.NumberFormat('en-US').format(prod.priceUSD)}$)</span>
                              ) : null}
                            </>
                          ) : prod.priceUSD ? (
                            <>{new Intl.NumberFormat('en-US').format(prod.priceUSD)}$</>
                          ) : typeof prod.price === 'number' ? (
                            <>{new Intl.NumberFormat('ar-IQ').format(prod.price)} د.ع</>
                          ) : (
                            'غير محدد'
                          )}
                        </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(prod)}>تعديل</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(String(prod.id))}>حذف</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* نافذة التعديل */}
      <Dialog open={!!editDialog} onOpenChange={open => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
            <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="اسم المنتج" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              <Input value={editPriceIQD} onChange={e => setEditPriceIQD(e.target.value)} placeholder="السعر (د.ع)" />
              <Input value={editPriceUSD} onChange={e => setEditPriceUSD(e.target.value)} placeholder="السعر (USD)" />
            </div>
          <DialogFooter>
            <Button onClick={handleEditSave}>حفظ</Button>
            <Button variant="outline" onClick={() => setEditDialog(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
