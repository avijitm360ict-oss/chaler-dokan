import React from 'react';
import { RiceProduct, SaleInvoice, DayCloseRecord, TenantInfo, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, formatDateBangla } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Truck,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  Printer
} from 'lucide-react';

interface DashboardOverviewProps {
  products: RiceProduct[];
  sales: SaleInvoice[];
  dayClose: DayCloseRecord;
  tenant: TenantInfo;
  lang: Language;
  numFormat: NumberFormat;
  onSelectTab: (tab: string) => void;
  onOpenReceipt: (invoice: SaleInvoice) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
  sales,
  dayClose,
  tenant,
  lang,
  numFormat,
  onSelectTab,
  onOpenReceipt
}) => {
  const t = translations[lang];

  // Calculations for Today
  const totalSalesTodayPaisa = sales.reduce((sum, s) => sum + s.grandTotalPaisa, 0);
  const totalKgSoldToday = sales.reduce((sum, s) => sum + s.totalKg, 0);
  const totalGrossProfitTodayPaisa = sales.reduce((sum, s) => sum + s.estimatedProfitPaisa, 0);
  const totalDueTodayPaisa = sales.reduce((sum, s) => sum + s.dueAmountPaisa, 0);
  const lowStockProducts = products.filter((p) => p.stockKg <= p.minStockKg);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-800 rounded-3xl p-5 sm:p-7 text-white shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <span className="text-[140px] leading-none">🌾</span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'bn' ? 'চালের ব্যবসা পরিচালনা ড্যাশবোর্ড' : 'Rice Trade ERP & POS Active'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {lang === 'bn' ? 'স্বাগতম,' : 'Welcome,'} {tenant.proprietor}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            {lang === 'bn' 
              ? 'আজকে কাউন্টারে মোট বিক্রি হয়েছে ' 
              : 'Total sales registered today: '}
            <strong className="text-white underline decoration-amber-400 decoration-2">{formatCurrency(totalSalesTodayPaisa, numFormat)}</strong>
            {lang === 'bn' ? ` (${formatWeight(totalKgSoldToday, numFormat, lang)} চাল)।` : ` (${totalKgSoldToday} kg rice).`}
          </p>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={() => onSelectTab('pos')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition active:scale-98"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন বিক্রি করুন (POS)' : 'New POS Sale'}</span>
            </button>

            <button
              onClick={() => onSelectTab('daily-rates')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-xs border border-white/20 transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'bn' ? 'আজকের বাজারদর' : 'Update Today Rates'}</span>
            </button>

            <button
              onClick={() => onSelectTab('purchases')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-xs border border-white/20 transition"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-200" />
              <span>{lang === 'bn' ? 'চাল ক্রয় / চালান' : 'Inbound Purchases'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{lang === 'bn' ? 'আজকের মোট বিক্রি' : 'Today\'s Sales'}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(totalSalesTodayPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <span>{sales.length} টি ইনভয়েস</span>
            <span>• {formatWeight(totalKgSoldToday, numFormat, lang)}</span>
          </div>
        </div>

        {/* Estimated Gross Profit (WAC Based) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{lang === 'bn' ? 'আনুমানিক মোট লাভ' : 'Gross Profit (WAC)'}</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(totalGrossProfitTodayPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'আসল খরচ (Landed Cost) বাদে লাভ' : 'Calculated with WAC snapshot'}
          </div>
        </div>

        {/* Due / Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{lang === 'bn' ? 'আজকের বকেয়া বাকি' : 'Today\'s Credit Due'}</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800 mt-2">
            {formatCurrency(totalDueTodayPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {lang === 'bn' ? 'কাস্টমারের খাতার সাথে সংযুক্ত' : 'Linked to customer ledgers'}
          </div>
        </div>

        {/* Cash Register Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{lang === 'bn' ? 'ড্রয়ার ক্যাশ ব্যালেন্স' : 'Drawer Cash'}</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {lang === 'bn' ? 'ডে-ক্লোজের জন্য প্রস্তুত' : 'Ready for Day Close'}
          </div>
        </div>

      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">
                {lang === 'bn' ? 'লো-স্টক অ্যালার্ট: চাল কেনার তাগাদা' : 'Low Stock Warning'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {lowStockProducts.map((p) => `${p.nameBn} (${formatWeight(p.stockKg, numFormat, lang)})`).join(', ')} চালের মজুদ কমে এসেছে।
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('purchases')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
          >
            {lang === 'bn' ? 'মিল থেকে অর্ডার করুন' : 'Order from Mill'}
          </button>
        </div>
      )}

      {/* Recent Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {lang === 'bn' ? 'আজকের বিক্রয় তালিকা ও ইনভয়েস' : 'Recent Sales & Invoices'}
            </h3>
            <span className="text-xs text-slate-500">
              {lang === 'bn' ? 'সর্বশেষ কাউন্টার সেল ও পাইকারি বিক্রির হিসাব' : 'Live sales audit ledger'}
            </span>
          </div>

          <button
            onClick={() => onSelectTab('pos')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>+ নতুন সেল করুন</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-2.5 px-3">{lang === 'bn' ? 'মেমো / ইনভয়েস' : 'Invoice'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'তারিখ ও সময়' : 'Time'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'কাস্টমারের নাম' : 'Customer'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'আইটেম ও পরিমাণ' : 'Items & Qty'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'সর্বমোট বিল' : 'Total'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'আদায় ও বাকি' : 'Paid/Due'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'রসিদ' : 'Print'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{inv.docNo}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDateBangla(inv.date)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {inv.clientName}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {inv.clientType === 'walkin' ? 'কাউন্টার ক্যাশ' : 'পাইকারি কাস্টমার'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">
                      {inv.items.map((it) => `${it.product.nameBn} (${it.unitQuantity} ${it.selectedUnit.nameBn})`).join(', ')}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      মোট ওজন: {formatWeight(inv.totalKg, numFormat, lang)}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-900 text-sm">
                    {formatCurrency(inv.grandTotalPaisa, numFormat)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-emerald-700 font-bold">
                      জমা: {formatCurrency(inv.paidTotalPaisa, numFormat)}
                    </div>
                    {inv.dueAmountPaisa > 0 && (
                      <div className="text-amber-800 font-bold text-[10px]">
                        বাকি: {formatCurrency(inv.dueAmountPaisa, numFormat)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onOpenReceipt(inv)}
                      className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-slate-600 transition"
                      title="রসিদ দেখুন ও প্রিন্ট করুন"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
