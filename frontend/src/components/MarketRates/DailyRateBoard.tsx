import React, { useState } from 'react';
import { RiceProduct, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { TrendingUp, Save, CheckCircle2, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

interface DailyRateBoardProps {
  products: RiceProduct[];
  lang: Language;
  numFormat: NumberFormat;
  onUpdateRates: (updatedProducts: RiceProduct[]) => void;
}

export const DailyRateBoard: React.FC<DailyRateBoardProps> = ({
  products,
  lang,
  numFormat,
  onUpdateRates
}) => {
  const t = translations[lang];

  // Local state for editable rates
  const [rates, setRates] = useState<{
    [productId: string]: {
      retailKgTaka: number;
      wholesaleKgTaka: number;
      sackWholesaleTaka: number;
      sackRetailTaka: number;
    };
  }>(() => {
    const initial: any = {};
    products.forEach((p) => {
      initial[p.id] = {
        retailKgTaka: p.retailPricePaisa / 100,
        wholesaleKgTaka: p.wholesalePricePaisa / 100,
        sackWholesaleTaka: p.sack50WholesalePricePaisa / 100,
        sackRetailTaka: p.sack50RetailPricePaisa / 100,
      };
    });
    return initial;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handle rate input change
  const handleRateChange = (
    productId: string,
    field: 'retailKgTaka' | 'wholesaleKgTaka' | 'sackWholesaleTaka' | 'sackRetailTaka',
    value: number
  ) => {
    setRates((prev) => {
      const current = prev[productId] || { retailKgTaka: 0, wholesaleKgTaka: 0, sackWholesaleTaka: 0, sackRetailTaka: 0 };
      const updatedItem = { ...current, [field]: value };

      // Smart auto-suggestion: If KG rate changed, suggest 50kg bag rate (Rate * 50 - bulk discount)
      if (field === 'retailKgTaka' && value > 0) {
        updatedItem.sackRetailTaka = Math.round(value * 50 * 0.98); // 2% bulk incentive
      } else if (field === 'wholesaleKgTaka' && value > 0) {
        updatedItem.sackWholesaleTaka = Math.round(value * 50 * 0.99);
      }

      return {
        ...prev,
        [productId]: updatedItem,
      };
    });
  };

  const handleSaveAll = () => {
    const updated = products.map((p) => {
      const r = rates[p.id];
      if (!r) return p;
      return {
        ...p,
        retailPricePaisa: Math.round(r.retailKgTaka * 100),
        wholesalePricePaisa: Math.round(r.wholesaleKgTaka * 100),
        sack50WholesalePricePaisa: Math.round(r.sackWholesaleTaka * 100),
        sack50RetailPricePaisa: Math.round(r.sackRetailTaka * 100),
      };
    });

    onUpdateRates(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner */}
      <div className="bg-linear-to-r from-emerald-600 via-teal-700 to-amber-600 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <TrendingUp className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {lang === 'bn' ? 'আজকের বাজারদর আপডেট' : 'Daily Rice Market Price Board'}
            </h2>
          </div>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
            {lang === 'bn' 
              ? 'চালের দাম প্রতিদিন ওঠানামা করে। এখানে সব চালের পাইকারি ও খুচরা দর এক ক্লিকে পরিবর্তন করুন।' 
              : 'Bulk update today’s retail and wholesale market prices in one quick screen.'}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold bg-white text-emerald-800 px-3 py-1.5 rounded-xl shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {lang === 'bn' ? 'দর সফলভাবে আপডেট হয়েছে!' : 'Rates Saved!'}
            </span>
          )}

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            <span>{lang === 'bn' ? 'সব দর সেভ করুন' : 'Save Today\'s Rates'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                <th className="py-3.5 px-4">{lang === 'bn' ? 'চালের বিবরণ' : 'Rice Variety'}</th>
                <th className="py-3.5 px-3">{lang === 'bn' ? 'বর্তমান স্টক' : 'Stock'}</th>
                <th className="py-3.5 px-3">{lang === 'bn' ? 'আসল গড় খরচ (WAC)' : 'Avg Cost (WAC)'}</th>
                <th className="py-3.5 px-3 bg-emerald-50/70 text-emerald-900 border-x border-emerald-100">
                  {lang === 'bn' ? 'কেজি খুচরা দর (৳)' : 'Retail/Kg (৳)'}
                </th>
                <th className="py-3.5 px-3 bg-teal-50/70 text-teal-900 border-r border-teal-100">
                  {lang === 'bn' ? 'কেজি পাইকারি দর (৳)' : 'Wholesale/Kg (৳)'}
                </th>
                <th className="py-3.5 px-3 bg-amber-50/70 text-amber-900 border-r border-amber-100">
                  {lang === 'bn' ? '৫০ কেজি বস্তা (পাইকারি ৳)' : '50kg Bag (Wholesale ৳)'}
                </th>
                <th className="py-3.5 px-3 bg-slate-100/70 text-slate-900">
                  {lang === 'bn' ? '৫০ কেজি বস্তা (খুচরা ৳)' : '50kg Bag (Retail ৳)'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {products.map((p) => {
                const r = rates[p.id] || {
                  retailKgTaka: p.retailPricePaisa / 100,
                  wholesaleKgTaka: p.wholesalePricePaisa / 100,
                  sackWholesaleTaka: p.sack50WholesalePricePaisa / 100,
                  sackRetailTaka: p.sack50RetailPricePaisa / 100,
                };

                const currentWacTaka = p.wacPerKgPaisa / 100;
                const wholesaleMargin = r.wholesaleKgTaka - currentWacTaka;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Name & Variety */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {lang === 'bn' ? p.nameBn : p.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.variety} • {p.grade} • SKU: {p.sku}
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {formatWeight(p.stockKg, numFormat, lang)}
                    </td>

                    {/* WAC Cost */}
                    <td className="py-3 px-3 text-slate-600 font-bold whitespace-nowrap">
                      {formatCurrency(p.wacPerKgPaisa, numFormat)}
                    </td>

                    {/* Retail Kg Input */}
                    <td className="py-2.5 px-3 bg-emerald-50/30 border-x border-emerald-100">
                      <input
                        type="number"
                        value={r.retailKgTaka}
                        onChange={(e) => handleRateChange(p.id, 'retailKgTaka', Number(e.target.value))}
                        className="w-24 py-1.5 px-2 bg-white border border-emerald-300 rounded-lg font-extrabold text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* Wholesale Kg Input */}
                    <td className="py-2.5 px-3 bg-teal-50/30 border-r border-teal-100">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={r.wholesaleKgTaka}
                          onChange={(e) => handleRateChange(p.id, 'wholesaleKgTaka', Number(e.target.value))}
                          className="w-24 py-1.5 px-2 bg-white border border-teal-300 rounded-lg font-extrabold text-teal-800 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          wholesaleMargin > 0 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
                        }`}>
                          +{wholesaleMargin.toFixed(1)}৳
                        </span>
                      </div>
                    </td>

                    {/* 50kg Sack Wholesale */}
                    <td className="py-2.5 px-3 bg-amber-50/30 border-r border-amber-100">
                      <input
                        type="number"
                        value={r.sackWholesaleTaka}
                        onChange={(e) => handleRateChange(p.id, 'sackWholesaleTaka', Number(e.target.value))}
                        className="w-28 py-1.5 px-2 bg-white border border-amber-300 rounded-lg font-extrabold text-amber-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </td>

                    {/* 50kg Sack Retail */}
                    <td className="py-2.5 px-3 bg-slate-100/30">
                      <input
                        type="number"
                        value={r.sackRetailTaka}
                        onChange={(e) => handleRateChange(p.id, 'sackRetailTaka', Number(e.target.value))}
                        className="w-28 py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-extrabold text-slate-800 text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
                      />
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
