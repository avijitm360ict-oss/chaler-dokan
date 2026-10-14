import React, { useState } from 'react';
import { RiceProduct, SaleInvoice, ExpenseRecord, Party, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { BarChart3, Download, Printer, TrendingUp, Calendar, FileSpreadsheet, PieChart, Sparkles } from 'lucide-react';

interface ReportsHubProps {
  products: RiceProduct[];
  sales: SaleInvoice[];
  expenses: ExpenseRecord[];
  parties: Party[];
  lang: Language;
  numFormat: NumberFormat;
}

export const ReportsHub: React.FC<ReportsHubProps> = ({
  products,
  sales,
  expenses,
  parties,
  lang,
  numFormat
}) => {
  const t = translations[lang];

  const [reportType, setReportType] = useState<'daily' | 'profit_loss' | 'rice_margin' | 'aging'>('profit_loss');

  // Profit & Loss metrics (WAC Based)
  const totalSalesRevenuePaisa = sales.reduce((sum, s) => sum + s.grandTotalPaisa, 0);
  const totalCogsPaisa = sales.reduce((sum, s) => sum + s.totalCostSnapshotPaisa, 0);
  const totalGrossProfitPaisa = Math.max(0, totalSalesRevenuePaisa - totalCogsPaisa);
  const totalOperatingExpensePaisa = expenses.reduce((sum, e) => sum + e.amountPaisa, 0);
  const netProfitPaisa = totalGrossProfitPaisa - totalOperatingExpensePaisa;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'bn' ? 'অডিট ও ব্যবসায়িক লাভ-ক্ষতি রিপোর্ট' : 'Reports & Profit/Loss Center'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn' 
              ? 'WAC কস্ট মডেল অনুযায়ী প্রকৃত কেনা-দামের ভিত্তিতে সঠিক লাভ ও খরচের রিপোর্ট' 
              : 'Accurate profit & loss statements calculated with Weighted Average Cost snapshots.'}
          </p>
        </div>

        {/* Export / Print Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট</span>
          </button>
          <button
            onClick={() => alert(lang === 'bn' ? 'এক্সেল ফাইল ডাউনলোড শুরু হচ্ছে...' : 'Exporting to Excel...')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / PDF এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setReportType('profit_loss')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'profit_loss' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          লাভ-ক্ষতি বিবরণী (P&L)
        </button>
        <button
          onClick={() => setReportType('rice_margin')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'rice_margin' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          চালভিত্তিক মার্জিন %
        </button>
        <button
          onClick={() => setReportType('aging')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'aging' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          বাকির বয়স বিশ্লেষণ (Aging)
        </button>
      </div>

      {/* REPORT 1: Profit & Loss Statement (PRD Section 9) */}
      {reportType === 'profit_loss' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                লাভ ও ক্ষতি বিবরণী (Income & Profit Statement)
              </h3>
              <span className="text-xs text-slate-400">হিসাব সময়কাল: ১৪ অক্টোবর ২০২৬ (আজকের হিসাব)</span>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              WAC Cost Basis ✓
            </span>
          </div>

          <div className="space-y-3 text-xs max-w-2xl">
            {/* Sales Revenue */}
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">১. মোট চাল বিক্রি রাজস্ব (Gross Sales)</span>
              <span className="text-base font-extrabold text-slate-950">
                {formatCurrency(totalSalesRevenuePaisa, numFormat)}
              </span>
            </div>

            {/* COGS */}
            <div className="p-3 bg-amber-50/60 rounded-xl flex items-center justify-between text-amber-900">
              <div>
                <span className="font-bold text-sm block">২. বাদ: বিক্রীত চালের আসল কেনা-দাম (COGS - Landed Cost)</span>
                <span className="text-[10px] text-amber-700">প্রতিটি চালের ক্রয়মূল্য + ট্রাকভাড়া + আনলোড লেবার</span>
              </div>
              <span className="text-base font-extrabold text-red-700">
                - {formatCurrency(totalCogsPaisa, numFormat)}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-950">
              <span className="font-extrabold text-sm">৩. মোট মুনাফা / গ্রস লাভ (Gross Profit)</span>
              <span className="text-xl font-black text-emerald-800">
                {formatCurrency(totalGrossProfitPaisa, numFormat)}
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="p-3 bg-red-50/50 rounded-xl flex items-center justify-between text-red-950">
              <div>
                <span className="font-bold text-sm block">৪. বাদ: দোকানের পরিচালন খরচ (Operating Expenses)</span>
                <span className="text-[10px] text-red-700">দোকান ভাড়া, বিদ্যুৎ, দৈনিক লেবার, মেহমানদারি</span>
              </div>
              <span className="text-base font-extrabold text-red-700">
                - {formatCurrency(totalOperatingExpensePaisa, numFormat)}
              </span>
            </div>

            {/* Net Profit */}
            <div className="p-4 bg-linear-to-r from-emerald-600 to-teal-700 rounded-2xl text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-100 block">
                  প্রকৃত নিট মুনাফা (Net Profit)
                </span>
                <span className="text-2xl font-black">
                  {formatCurrency(netProfitPaisa, numFormat)}
                </span>
              </div>
              <div className="text-right text-xs text-emerald-100">
                <span>মার্জিন: {totalSalesRevenuePaisa > 0 ? ((netProfitPaisa / totalSalesRevenuePaisa) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: Rice Margin Table */}
      {reportType === 'rice_margin' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-extrabold text-slate-900 text-sm">
            প্রতিটি চালের জাতভিত্তিক বিক্রয় মার্জিন
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">চালের নাম</th>
                <th className="py-3 px-3">গড় কেনা-দাম (WAC)</th>
                <th className="py-3 px-3">খুচরা দর</th>
                <th className="py-3 px-3">পাইকারি দর</th>
                <th className="py-3 px-3">খুচরা মার্জিন %</th>
                <th className="py-3 px-3">পাইকারি মার্জিন %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const wac = p.wacPerKgPaisa / 100;
                const retail = p.retailPricePaisa / 100;
                const wholesale = p.wholesalePricePaisa / 100;
                const retailMargin = wac > 0 ? (((retail - wac) / retail) * 100).toFixed(1) : '0';
                const wholesaleMargin = wac > 0 ? (((wholesale - wac) / wholesale) * 100).toFixed(1) : '0';

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.nameBn}</td>
                    <td className="py-3 px-3 font-semibold text-slate-600">৳ {wac.toFixed(2)}</td>
                    <td className="py-3 px-3 font-extrabold text-emerald-700">৳ {retail.toFixed(2)}</td>
                    <td className="py-3 px-3 font-extrabold text-teal-700">৳ {wholesale.toFixed(2)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-800">+{retailMargin}%</td>
                    <td className="py-3 px-3 font-bold text-teal-800">+{wholesaleMargin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORT 3: Due Aging Breakdown */}
      {reportType === 'aging' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">
            বাকির বয়স বিশ্লেষণ (Aging Analysis)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="font-bold text-emerald-900 block">০ – ৭ দিন</span>
              <span className="text-xl font-black text-emerald-950 mt-1 block">৳ ৩২,৫০০</span>
              <span className="text-[10px] text-emerald-700">সম্পূর্ণ স্বাভাবিক রানিং বাকি</span>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="font-bold text-blue-900 block">৮ – ৩০ দিন</span>
              <span className="text-xl font-black text-blue-950 mt-1 block">৳ ৪১,০০০</span>
              <span className="text-[10px] text-blue-700">চলতি মাসের বকেয়া</span>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="font-bold text-amber-900 block">৩১ – ৬০ দিন</span>
              <span className="text-xl font-black text-amber-950 mt-1 block">৳ ১৭,৫০০</span>
              <span className="text-[10px] text-amber-700">তাগাদা প্রদান প্রয়োজন</span>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <span className="font-bold text-red-900 block">৬০+ দিন (ঝুঁকিপূর্ণ)</span>
              <span className="text-xl font-black text-red-950 mt-1 block">৳ ৯,৮০০</span>
              <span className="text-[10px] text-red-700">জরুরি ব্যবস্থা গ্রহণ কাম্য</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
