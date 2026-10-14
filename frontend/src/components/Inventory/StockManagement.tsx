import React, { useState } from 'react';
import { RiceProduct, Warehouse, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { Warehouse as WarehouseIcon, ArrowRightLeft, Sliders, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';

interface StockManagementProps {
  products: RiceProduct[];
  warehouses: Warehouse[];
  lang: Language;
  numFormat: NumberFormat;
  onAdjustStock: (productId: string, diffKg: number, reason: string) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  warehouses,
  lang,
  numFormat,
  onAdjustStock
}) => {
  const t = translations[lang];

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh-1');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [adjustKg, setAdjustKg] = useState<number>(-15); // e.g. -15 kg moisture loss
  const [reasonCode, setReasonCode] = useState<string>('moisture_loss');
  const [note, setNote] = useState<string>('রোদে শুকিয়ে ওজন হ্রাস');

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  const totalStockKg = products.reduce((sum, p) => sum + p.stockKg, 0);
  const totalValuationPaisa = products.reduce((sum, p) => sum + Math.round(p.stockKg * p.wacPerKgPaisa), 0);
  const lowStockCount = products.filter((p) => p.stockKg <= p.minStockKg).length;

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdjustStock(selectedProductId, adjustKg, `${reasonCode}: ${note}`);
    setAdjustmentModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">মোট চালের মজুদ (সকল গোডাউন)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatWeight(totalStockKg, numFormat, lang)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            প্রায় {Math.floor(totalStockKg / 50)} বস্তা চাল স্টকে আছে
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">মোট স্টক ভ্যালু (গড় কেনা-দামে)</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(totalValuationPaisa, numFormat)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
            WAC অনুযায়ী প্রকৃত ইনভেন্টরি ভ্যালু
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">লো-স্টক সতর্কতা</span>
            <div className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockCount} টি চাল
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">পুনরায় ক্রয় প্রয়োজন</span>
          </div>

          <button
            onClick={() => setAdjustmentModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
          >
            <Sliders className="w-4 h-4" />
            <span>স্টক এডজাস্ট</span>
          </button>
        </div>
      </div>

      {/* Warehouse Selector & Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Godown Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">গোডাউন অনুযায়ী চালের ব্যালেন্স:</span>
          </div>

          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
            {warehouses.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWarehouseId(w.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedWarehouseId === w.id ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                {w.nameBn}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">চালের নাম ও জাত</th>
                <th className="py-3 px-3">বর্তমান মজুদ (কেজি ও বস্তা)</th>
                <th className="py-3 px-3">গড় ক্রয়মূল্য (WAC)</th>
                <th className="py-3 px-3">খুচরা দর / কেজি</th>
                <th className="py-3 px-3">পাইকারি দর / কেজি</th>
                <th className="py-3 px-3">মোট স্টক ভ্যালু</th>
                <th className="py-3 px-3">স্টক স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isLow = p.stockKg <= p.minStockKg;
                const valuePaisa = Math.round(p.stockKg * p.wacPerKgPaisa);

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.nameBn}</div>
                      <div className="text-[11px] text-slate-500">{p.variety} • {p.grade} • SKU: {p.sku}</div>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatWeight(p.stockKg, numFormat, lang)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-bold">
                      {formatCurrency(p.wacPerKgPaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">
                      {formatCurrency(p.retailPricePaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3 text-teal-700 font-bold">
                      {formatCurrency(p.wholesalePricePaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {formatCurrency(valuePaisa, numFormat)}
                    </td>
                    <td className="py-3 px-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          লো-স্টক ({p.minStockKg} কেজির কম)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          পর্যাপ্ত মজুদ ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                স্টক এডজাস্টমেন্ট (Stock Adjustment)
              </h3>
              <button onClick={() => setAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">কোন চালের স্টক পরিবর্তন করবেন</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.nameBn} (বর্তমান: {p.stockKg} কেজি)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ওজন সমন্বয় (কেজি: মাইনাস অথবা প্লাস)</label>
                <input
                  type="number"
                  value={adjustKg}
                  onChange={(e) => setAdjustKg(Number(e.target.value))}
                  placeholder="-১৫ বা +৫০"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ওজন কমে গেলে ঋণাত্মক সংখ্যা দিন (যেমন: -১৫), বাড়লে ধনাত্মক (+৫০)
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বাধ্যতামূলক কারণ (PRD 5.3 অনুযায়ী)</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="moisture_loss">ওজন কমে যাওয়া (Moisture loss / শুকানো)</option>
                  <option value="damage">পোকা ধরা / চাল নষ্ট / আর্দ্রতা</option>
                  <option value="theft_loss">চুরি বা অনিচ্ছাকৃত ক্ষতি</option>
                  <option value="counting_error">গণনায় ভুল সমন্বয়</option>
                  <option value="other">অন্যান্য কারণ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিস্তারিত নোট</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md"
                >
                  এডজাস্টমেন্ট সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
