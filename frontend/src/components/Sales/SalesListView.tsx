import React, { useState } from 'react';
import { SaleInvoice, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, formatDateBangla } from '../../utils/formatters';
import { Receipt, Search, Printer, Ban, AlertCircle, Eye, CheckCircle2 } from 'lucide-react';

interface SalesListViewProps {
  sales: SaleInvoice[];
  lang: Language;
  numFormat: NumberFormat;
  onOpenReceipt: (invoice: SaleInvoice) => void;
  onVoidInvoice: (invoiceId: string, reason: string) => void;
}

export const SalesListView: React.FC<SalesListViewProps> = ({
  sales,
  lang,
  numFormat,
  onOpenReceipt,
  onVoidInvoice
}) => {
  const t = translations[lang];

  const [search, setSearch] = useState('');
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [targetInvoiceId, setTargetInvoiceId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('কাস্টমার ভুল মাল নিয়েছিলেন, অর্ডার বাতিল');

  const filteredSales = sales.filter((s) => {
    return (
      s.docNo.toLowerCase().includes(search.toLowerCase()) ||
      s.clientName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleVoidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceId || !voidReason) return;
    onVoidInvoice(targetInvoiceId, voidReason);
    setVoidModalOpen(false);
    setTargetInvoiceId(null);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'bn' ? 'বিক্রয় ও ইনভয়েস অডিট রেজিস্টার' : 'Sales Invoices & Audit Register'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'PRD ৪.৪ অনুযায়ী কোনো সেল সরাসরি ডিলিট হয় না; ভুল হলে বাতিল (Void) ও অডিট লগ সংরক্ষিত থাকে।' 
              : 'Append-only ledger. Voided sales are logged without deleting records.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ইনভয়েস বা কাস্টমারের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">ইনভয়েস নং</th>
                <th className="py-3 px-3">তারিখ ও সময়</th>
                <th className="py-3 px-3">ক্রেতা</th>
                <th className="py-3 px-3">চালের আইটেমসমূহ</th>
                <th className="py-3 px-3">মোট ওজন</th>
                <th className="py-3 px-3">বিল ও পরিশোধ</th>
                <th className="py-3 px-3">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => (
                <tr key={s.id} className={s.status === 'voided' ? 'bg-red-50/40 opacity-75' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {s.docNo}
                    <span className="block text-[10px] text-slate-400 font-normal">বাই: {s.createdBy}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{formatDateBangla(s.date)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {s.clientName}
                    <span className="block text-[10px] text-slate-400">{s.clientPhone}</span>
                  </td>
                  <td className="py-3 px-3">
                    {s.items.map((it, idx) => (
                      <div key={idx} className="font-medium text-slate-800">
                        {it.product.nameBn} - {it.unitQuantity} {it.selectedUnit.nameBn}
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-900">
                    {formatWeight(s.totalKg, numFormat, lang)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-slate-950 text-sm">
                      {formatCurrency(s.grandTotalPaisa, numFormat)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      জমা: {formatCurrency(s.paidTotalPaisa, numFormat)}
                    </div>
                    {s.dueAmountPaisa > 0 && (
                      <div className="text-[10px] text-amber-800 font-bold">
                        বাকি: {formatCurrency(s.dueAmountPaisa, numFormat)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {s.status === 'voided' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        বাতিল (Voided)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        কনফার্মড ✓
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenReceipt(s)}
                      className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-slate-600 transition"
                      title="ইনভয়েস প্রিন্ট"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {s.status !== 'voided' && (
                      <button
                        onClick={() => {
                          setTargetInvoiceId(s.id);
                          setVoidModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-700 rounded-lg text-slate-400 transition"
                        title="ইনভয়েস বাতিল করুন (Void)"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VOID INVOICE MODAL (Mandatory Audit Reason) */}
      {voidModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <Ban className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">ইনভয়েস বাতিলকরণ (Void Sale)</h3>
              </div>
              <button onClick={() => setVoidModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleVoidSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 text-red-900 rounded-xl leading-relaxed text-[11px]">
                ⚠️ <strong>অডিট সতর্কতা:</strong> ইনভয়েস বাতিল করলে বিক্রি করা চাল স্বয়ংক্রিয়ভাবে স্টকে ফিরে যাবে এবং কাস্টমারের লেজার থেকে বাকি সমন্বয় হয়ে রিভার্স এন্ট্রি পড়বে।
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বাতিলের বাধ্যতামূলক কারণ (Audit Note):</label>
                <textarea
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>নিশ্চিত বাতিল করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
