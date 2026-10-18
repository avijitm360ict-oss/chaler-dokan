import React from 'react';
import {
  RiceProduct,
  SaleInvoice,
  DayCloseRecord,
  TenantInfo,
  Language,
  NumberFormat,
  UserRole
} from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, formatDateBangla, toBengaliDigits } from '../../utils/formatters';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Clock,
  Printer,
  ChevronRight,
  Plus,
  Package,
  CalendarCheck,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

interface DashboardOverviewProps {
  products: RiceProduct[];
  sales: SaleInvoice[];
  dayClose: DayCloseRecord;
  tenant: TenantInfo;
  lang: Language;
  numFormat: NumberFormat;
  userRole?: UserRole;
  onSelectTab: (tab: string) => void;
  onOpenReceipt: (invoice: SaleInvoice) => void;
  onOpenDueCollect?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
  sales,
  dayClose,
  tenant,
  lang,
  numFormat,
  userRole = 'owner',
  onSelectTab,
  onOpenReceipt,
  onOpenDueCollect
}) => {
  const t = translations[lang];

  // Calculations for Today
  const totalSalesTodayPaisa = sales.reduce((sum, s) => sum + s.grandTotalPaisa, 0);
  const totalPaidTodayPaisa = sales.reduce((sum, s) => sum + s.paidTotalPaisa, 0);
  const totalDueTodayPaisa = sales.reduce((sum, s) => sum + s.dueAmountPaisa, 0);
  const totalKgSoldToday = sales.reduce((sum, s) => sum + s.totalKg, 0);
  const lowStockProducts = products.filter((p) => p.stockKg <= p.minStockKg);

  // 7-Day sales bar chart mock data
  const last7Days = [
    { dayBn: 'শনি', dayEn: 'Sat', amountPaisa: 4800000 },
    { dayBn: 'রবি', dayEn: 'Sun', amountPaisa: 6200000 },
    { dayBn: 'সোম', dayEn: 'Mon', amountPaisa: 5400000 },
    { dayBn: 'মঙ্গল', dayEn: 'Tue', amountPaisa: 7100000 },
    { dayBn: 'বুধ', dayEn: 'Wed', amountPaisa: 4500000 },
    { dayBn: 'বৃহঃ', dayEn: 'Thu', amountPaisa: 8900000 },
    { dayBn: 'শুক্র', dayEn: 'Fri', amountPaisa: totalSalesTodayPaisa || 5650000 },
  ];
  const maxDayAmount = Math.max(...last7Days.map((d) => d.amountPaisa));

  // Top 5 rice varieties
  const top5Rice = products.slice(0, 5);

  const todayDateString = formatDateBangla(new Date().toISOString());

  return (
    <div className="space-y-4 pb-24 md:pb-6 relative">
      
      {/* 1. Greetings & Today's Date (One Line per Section 4.2) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A17] tracking-tight">
            {lang === 'bn' ? 'আসসালামু আলাইকুম,' : 'Hello,'} {tenant.proprietor}
          </h2>
          <p className="text-xs text-[#5B574E] font-medium">
            {lang === 'bn' ? `আজকের তারিখ: ${todayDateString}` : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F4EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
            <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-ping" />
            {lang === 'bn' ? 'কাউন্টার সক্রিয়' : 'Counter Active'}
          </span>
        </div>
      </div>

      {/* 2. Today's Tasks Card (আজকের কাজ কার্ড - ৫টি লাইন, প্রতিটি পুরো-প্রস্থ ট্যাপ এলাকা per Section 4.2) */}
      <div className="bg-white rounded-2xl border border-stroke-default shadow-xs overflow-hidden">
        <div className="p-3.5 bg-surface-page border-b border-stroke-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#1F7A4D]" />
            <h3 className="text-xs font-extrabold text-[#1A1A17] uppercase tracking-wide">
              {lang === 'bn' ? 'আজকের কাজ ও করণীয় তালিকা (Today\'s Actions)' : 'Today\'s Task Checklist'}
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF4DC] text-[#8A5A00]">
            ৫টি ধাপ
          </span>
        </div>

        <div className="divide-y divide-stroke-default">
          
          {/* Row 1: ৭ দিনের বেশি বাকি */}
          <button
            onClick={() => onSelectTab('due-collection')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#E8F4EC]/40 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF4DC] text-[#8A5A00] flex items-center justify-center font-bold text-xs shrink-0">
                ১
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-[#1F7A4D]">
                  ৭ দিনের বেশি পুরোনো বাকি আদায়
                </span>
                <span className="block text-[11px] text-[#5B574E]">
                  ৩ জন পাইকারি ক্রেতার মোট ৳১,৫২,০০০ বকেয়া বাকি আছে
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D5FA8]">
              <span>আদায় করুন</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 2: লো-স্টক চাল */}
          <button
            onClick={() => onSelectTab('inventory')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#E8F4EC]/40 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FDECEA] text-[#B3261E] flex items-center justify-center font-bold text-xs shrink-0">
                ২
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-[#1F7A4D]">
                  লো-স্টক চাল পুনঃক্রয় তাগাদা
                </span>
                <span className="block text-[11px] text-[#5B574E]">
                  {lowStockProducts.length > 0 ? `${lowStockProducts.length}টি জাতের চালের স্টক তলানিতে` : 'মিনিকেট ও নাজিরশাইল চাল পর্যাপ্ত আছে'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#B3261E]">
              <span>মজুদ দেখুন</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 3: আজকের ক্যাশ */}
          <button
            onClick={() => onSelectTab('cash-book')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#E8F4EC]/40 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center font-bold text-xs shrink-0">
                ৩
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-[#1F7A4D]">
                  আজকের ক্যাশ ড্রয়ার ব্যালেন্স নিরীক্ষা
                </span>
                <span className="block text-[11px] text-[#5B574E]">
                  বর্তমানে ড্রয়ারে প্রত্যাশিত ক্যাশ: {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F7A4D]">
              <span>ক্যাশ বুক</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 4: রেট আপডেট বাকি */}
          <button
            onClick={() => onSelectTab('daily-rates')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#E8F4EC]/40 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center font-bold text-xs shrink-0">
                ৪
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-[#1F7A4D]">
                  আজকের বাজারদর আপডেট ও রেট কার্ড তৈরি
                </span>
                <span className="block text-[11px] text-[#5B574E]">
                  সকালে বাবুবাজার মোকামের নতুন দর সিস্টেমে উঠান
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#E0A526]">
              <span>রেট কার্ড</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 5: ডে ক্লোজ বাকি */}
          <button
            onClick={() => onSelectTab('cash-book')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#E8F4EC]/40 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#5B574E] flex items-center justify-center font-bold text-xs shrink-0">
                ৫
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-[#1F7A4D]">
                  দিনের শেষ: ক্যাশ মেলানো ও ডে ক্লোজ
                </span>
                <span className="block text-[11px] text-[#5B574E]">
                  {dayClose.isClosed ? 'আজকের ডে ক্লোজ সম্পন্ন হয়েছে' : 'দোকান বন্ধের সময় শারীরিক ক্যাশ গুনে লক করুন'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Lock className="w-3.5 h-3.5" />
              <span>ডে ক্লোজ</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

        </div>
      </div>

      {/* 3. Four Stat Cards (২×২ ফোনে, ৪×১ ডেস্কটপে per Section 4.2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: আজকের বিক্রি */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1F7A4D]/50 transition">
          <div className="flex items-center justify-between text-ink-secondary">
            <span className="text-xs font-bold">{lang === 'bn' ? 'আজকের বিক্রি' : 'Today Sales'}</span>
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1A1A17] mt-2 tabular-nums">
            {formatCurrency(totalSalesTodayPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-[#1F7A4D] font-bold mt-1">
            {sales.length} টি মেমো • {formatWeight(totalKgSoldToday, numFormat, lang)}
          </div>
        </div>

        {/* Card 2: আজ আদায় */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1F7A4D]/50 transition">
          <div className="flex items-center justify-between text-ink-secondary">
            <span className="text-xs font-bold">{lang === 'bn' ? 'আজ আদায় (ক্যাশ)' : 'Collections'}</span>
            <div className="p-2 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1B7F3B] mt-2 tabular-nums">
            {formatCurrency(totalPaidTodayPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-[#5B574E] mt-1">
            নগদ ও ব্যাংক মিলে আদায়
          </div>
        </div>

        {/* Card 3: মোট বাকি পাওনা (পাবেন ৳...) */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1D5FA8]/50 transition">
          <div className="flex items-center justify-between text-ink-secondary">
            <span className="text-xs font-bold">{lang === 'bn' ? 'মোট বাকি পাওনা' : 'Receivable Due'}</span>
            <div className="p-2 bg-blue-50 text-[#1D5FA8] rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1D5FA8] mt-2 tabular-nums">
            {formatCurrency(totalDueTodayPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-[#1D5FA8] font-bold mt-1">
            পাবেন (কাস্টমার খাতা)
          </div>
        </div>

        {/* Card 4: ক্যাশ ব্যালেন্স */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1F7A4D]/50 transition">
          <div className="flex items-center justify-between text-ink-secondary">
            <span className="text-xs font-bold">{lang === 'bn' ? 'ক্যাশ ব্যালেন্স' : 'Drawer Cash'}</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1A1A17] mt-2 tabular-nums">
            {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
          </div>
          <div className="text-[11px] text-[#16603B] font-bold mt-1">
            {dayClose.isClosed ? 'ক্লোজড ও লক' : 'সিস্টেম ক্যাশ প্রস্তুত'}
          </div>
        </div>

      </div>

      {/* 4. Small Chart: গত ৭ দিনের বিক্রি (বার) + ডেস্কটপে পাশে "সবচেয়ে বেশি চলা ৫ চাল" per Section 4.2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left 2 Cols: 7-Day Mini Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stroke-default p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-extrabold text-[#1A1A17] uppercase tracking-wide">
                {lang === 'bn' ? 'গত ৭ দিনের বিক্রির ধারা (বার চার্ট)' : 'Last 7 Days Sales Trend'}
              </h3>
              <span className="text-[11px] text-[#5B574E]">দৈনিক সর্বমোট বিক্রি ও গতিবিধি</span>
            </div>
            <span className="text-xs font-bold text-[#1F7A4D]">
              সর্বোচ্চ: {formatCurrency(maxDayAmount, numFormat)}
            </span>
          </div>

          <div className="h-40 flex items-end justify-between gap-2 pt-4 px-1">
            {last7Days.map((d, idx) => {
              const heightPct = Math.max(15, Math.round((d.amountPaisa / maxDayAmount) * 100));
              const isToday = idx === last7Days.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[9px] font-bold text-[#5B574E] opacity-0 group-hover:opacity-100 transition tabular-nums">
                    ৳{toBengaliDigits(Math.round(d.amountPaisa / 100000))}L
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? 'bg-[#1F7A4D] shadow-sm shadow-[#1F7A4D]/30'
                        : 'bg-[#D1EAD9] group-hover:bg-[#1F7A4D]/70'
                    }`}
                  />
                  <span className={`text-[11px] font-bold ${isToday ? 'text-[#1F7A4D]' : 'text-[#5B574E]'}`}>
                    {lang === 'bn' ? d.dayBn : d.dayEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: "সবচেয়ে বেশি চলা ৫ চাল" per Section 4.2 */}
        <div className="bg-white rounded-2xl border border-stroke-default p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-extrabold text-[#1A1A17] uppercase tracking-wide mb-1">
            {lang === 'bn' ? 'সবচেয়ে বেশি চলা ৫ চাল' : 'Top 5 Rice Varieties'}
          </h3>
          <p className="text-[11px] text-[#5B574E] mb-3">বিক্রির পরিমাণ ও বর্তমান মজুদ</p>

          <div className="space-y-2.5">
            {top5Rice.map((prod, idx) => (
              <div key={prod.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-lg bg-surface-page text-ink-secondary flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-[#1A1A17] block truncate">{prod.nameBn}</span>
                    <span className="text-[10px] text-[#5B574E]">{prod.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-[#1F7A4D] tabular-nums block">
                    {formatCurrency(prod.retailPricePaisa, numFormat)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    স্টক: {Math.floor(prod.stockKg / 50)} বস্তা
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Recent 5 Sales with "সবগুলো দেখুন" Link per Section 4.2 */}
      <div className="bg-white rounded-2xl border border-stroke-default shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#1A1A17] text-sm">
              {lang === 'bn' ? 'সর্বশেষ ৫টি বিক্রি ও ইনভয়েস' : 'Recent 5 Sales'}
            </h3>
            <span className="text-[11px] text-[#5B574E]">কাউন্টার ও পাইকারি বিক্রির হিসাব</span>
          </div>

          <button
            onClick={() => onSelectTab('sales-list')}
            className="text-xs font-bold text-[#1F7A4D] hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-page border-b border-stroke-default font-bold text-[#1A1A17]">
                <th className="py-2.5 px-3">ইনভয়েস নং</th>
                <th className="py-2.5 px-3">সময়</th>
                <th className="py-2.5 px-3">কাস্টমার</th>
                <th className="py-2.5 px-3">চাল ও ওজন</th>
                <th className="py-2.5 px-3">মোট বিল</th>
                <th className="py-2.5 px-3">আদায় / বাকি</th>
                <th className="py-2.5 px-3 text-right">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#1F7A4D]">{inv.docNo}</td>
                  <td className="py-2.5 px-3 text-[#5B574E]">{formatDateBangla(inv.date)}</td>
                  <td className="py-2.5 px-3 font-bold text-[#1A1A17]">{inv.clientName}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-[#1A1A17]">
                      {formatWeight(inv.totalKg, numFormat, lang)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-black text-[#1A1A17] tabular-nums">
                    {formatCurrency(inv.grandTotalPaisa, numFormat)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-[#1B7F3B]">
                      {formatCurrency(inv.paidTotalPaisa, numFormat)}
                    </span>
                    {inv.dueAmountPaisa > 0 && (
                      <span className="text-[10px] text-[#9A4A00] block font-semibold">
                        বাকি: {formatCurrency(inv.dueAmountPaisa, numFormat)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onOpenReceipt(inv)}
                      className="p-1.5 text-slate-500 hover:text-[#1F7A4D] hover:bg-slate-100 rounded-lg transition"
                      title="প্রিন্ট রসিদ"
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

      {/* 6. Floating Action Button (FAB) on Phone: "+ নতুন বিক্রি" per Section 4.2 & Section 5 */}
      <div className="md:hidden fixed bottom-18 right-4 z-40">
        <button
          onClick={() => onSelectTab('pos')}
          className="flex items-center gap-2 px-5 py-3.5 bg-[#1F7A4D] hover:bg-[#16603B] text-white font-black text-sm rounded-full shadow-lg shadow-[#1F7A4D]/40 transition active:scale-95 touch-target-pos"
        >
          <Plus className="w-5 h-5" />
          <span>নতুন বিক্রি</span>
        </button>
      </div>

    </div>
  );
};

