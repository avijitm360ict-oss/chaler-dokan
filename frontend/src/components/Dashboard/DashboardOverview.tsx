import React from 'react';
import {
  RiceProduct,
  SaleInvoice,
  DayCloseRecord,
  TenantInfo,
  Language,
  NumberFormat,
  UserRole,
  Party
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
  parties?: Party[];
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
  parties = [],
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

  // Dynamic Due Customers calculation from Parties
  const dueCustomers = parties.filter((p) => (p.type === 'client' || p.type === 'both') && p.balancePaisa > 0);
  const totalDueFromCustomersPaisa = dueCustomers.reduce((sum, p) => sum + p.balancePaisa, 0);

  // Dynamic 7-Day sales bar chart data calculated from sales invoices
  const bnDayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const enDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();

    const amountPaisa = sales
      .filter((s) => s.date && s.date.startsWith(dateKey))
      .reduce((sum, s) => sum + (s.grandTotalPaisa || 0), 0);

    return {
      dayBn: bnDayNames[dayOfWeek],
      dayEn: enDayNames[dayOfWeek],
      amountPaisa,
      dateKey,
    };
  });

  const rawMaxDay = Math.max(...last7Days.map((d) => d.amountPaisa));
  const maxDayAmount = rawMaxDay > 0 ? rawMaxDay : 100000;
  const hasAnySalesIn7Days = rawMaxDay > 0;

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
          <p className="text-xs text-slate-600 font-semibold">
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
            <CalendarCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-[#1A1A17] uppercase tracking-wide">
              {lang === 'bn' ? 'আজকের কাজ ও করণীয় তালিকা (Today\'s Actions)' : 'Today\'s Task Checklist'}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900">
            ৫টি ধাপ
          </span>
        </div>

        <div className="divide-y divide-stroke-default">
          
          {/* Row 1: ৭ দিনের বেশি বাকি */}
          <button
            onClick={() => onSelectTab('due-collection')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs shrink-0">
                ১
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-emerald-700">
                  {dueCustomers.length > 0 ? 'বকেয়া খাতা ও বাকি আদায়' : 'বকেয়া খাতার হালনাগাদ'}
                </span>
                <span className="block text-xs text-slate-600 font-medium mt-0.5">
                  {dueCustomers.length > 0
                    ? `${toBengaliDigits(dueCustomers.length)} জন ক্রেতার মোট ${formatCurrency(totalDueFromCustomersPaisa, numFormat)} বকেয়া বাকি আছে`
                    : 'বর্তমানে কোনো বকেয়া বাকি নেই, সব হিসাব পরিশোধিত'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <span>{dueCustomers.length > 0 ? 'আদায় করুন' : 'খাতা দেখুন'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 2: লো-স্টক চাল */}
          <button
            onClick={() => onSelectTab('inventory')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FDECEA] text-[#B3261E] flex items-center justify-center font-bold text-xs shrink-0">
                ২
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-emerald-700">
                  লো-স্টক চাল পুনঃক্রয় তাগাদা
                </span>
                <span className="block text-xs text-slate-600 font-medium mt-0.5">
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
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                ৩
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-emerald-700">
                  আজকের ক্যাশ ড্রয়ার ব্যালেন্স নিরীক্ষা
                </span>
                <span className="block text-xs text-slate-600 font-medium mt-0.5">
                  বর্তমানে ড্রয়ারে প্রত্যাশিত ক্যাশ: {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <span>ক্যাশ বুক</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 4: রেট আপডেট বাকি */}
          <button
            onClick={() => onSelectTab('daily-rates')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                ৪
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-emerald-700">
                  আজকের বাজারদর আপডেট ও রেট কার্ড তৈরি
                </span>
                <span className="block text-xs text-slate-600 font-medium mt-0.5">
                  {tenant.address ? `আজকের মোকামের পাইকারি ও খুচরা দর হালনাগাদ করুন (${tenant.address})` : 'আজকের মোকামের পাইকারি ও খুচরা দর সিস্টেমে হালনাগাদ করুন'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-amber-800">
              <span>রেট কার্ড</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Row 5: ডে ক্লোজ বাকি */}
          <button
            onClick={() => onSelectTab('cash-book')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/50 transition text-left group touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                ৫
              </div>
              <div>
                <span className="text-xs font-bold text-[#1A1A17] group-hover:text-emerald-700">
                  দিনের শেষ: ক্যাশ মেলানো ও ডে ক্লোজ
                </span>
                <span className="block text-xs text-slate-600 font-medium mt-0.5">
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
            {userRole === 'cashier' ? (
              <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-600" /> শুধুমাত্র মালিকের জন্য
              </span>
            ) : (
              formatCurrency(totalSalesTodayPaisa, numFormat)
            )}
          </div>
          <div className="text-xs text-emerald-700 font-bold mt-1">
            {sales.length} টি মেমো • {formatWeight(totalKgSoldToday, numFormat, lang)}
          </div>
        </div>

        {/* Card 2: আজ আদায় */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1F7A4D]/50 transition">
          <div className="flex items-center justify-between text-ink-secondary">
            <span className="text-xs font-bold">{lang === 'bn' ? 'আজ আদায় (ক্যাশ)' : 'Collections'}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-2 tabular-nums">
            {userRole === 'cashier' ? (
              <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-600" /> শুধুমাত্র মালিকের জন্য
              </span>
            ) : (
              formatCurrency(totalPaidTodayPaisa, numFormat)
            )}
          </div>
          <div className="text-xs text-slate-600 font-semibold mt-1">
            নগদ ও ডিজিটাল আদায়
          </div>
        </div>

        {/* Card 3: মোট বাকি পাওনা (পাবেন ৳... - সবুজ) */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1F7A4D]/50 transition">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-bold">{lang === 'bn' ? 'মোট বাকি পাওনা' : 'Receivable Due'}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-2 tabular-nums">
            {userRole === 'cashier' ? (
              <span className="text-sm text-slate-600 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> শুধুমাত্র মালিকের জন্য
              </span>
            ) : (
              formatCurrency(totalDueFromCustomersPaisa > 0 ? totalDueFromCustomersPaisa : totalDueTodayPaisa, numFormat)
            )}
          </div>
          <div className="text-xs text-emerald-700 font-bold mt-1">
            পাবেন (কাস্টমার খাতা)
          </div>
        </div>

        {/* Card 4: ক্যাশ ব্যালেন্স */}
        <div className="bg-white p-4 rounded-2xl border border-stroke-default shadow-xs hover:border-[#1F7A4D]/50 transition">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-bold">{lang === 'bn' ? 'ক্যাশ ব্যালেন্স' : 'Drawer Cash'}</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1A1A17] mt-2 tabular-nums">
            {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
          </div>
          <div className="text-xs text-emerald-800 font-bold mt-1">
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
              <span className="text-[11px] text-slate-600 font-semibold">দৈনিক সর্বমোট বিক্রি ও গতিবিধি</span>
            </div>
            {userRole !== 'cashier' && hasAnySalesIn7Days && (
              <span className="text-xs font-bold text-[#1F7A4D]">
                সর্বোচ্চ: {formatCurrency(maxDayAmount, numFormat)}
              </span>
            )}
          </div>

          {userRole === 'cashier' ? (
            <div className="h-40 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
              <Lock className="w-6 h-6 text-slate-500 mb-2" />
              <div className="font-bold text-slate-700 text-xs">বিক্রয় ও আর্থিক গ্রাফ শুধুমাত্র মালিক এবং ম্যানেজারের জন্য উন্মুক্ত</div>
              <div className="text-[11px] text-slate-600 mt-1">কাউন্টার ক্যাশিয়ার হিসেবে আপনি সরাসরি পিওএস ও মেমো পরিচালনা করতে পারবেন</div>
            </div>
          ) : !hasAnySalesIn7Days ? (
            <div className="h-40 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center">
              <span className="text-2xl mb-1">📊</span>
              <div className="font-bold text-slate-700 text-xs">বিগত ৭ দিনে কোনো বিক্রয় রেকর্ড হয়নি</div>
              <div className="text-[11px] text-slate-500 mt-0.5">কাউন্টার থেকে চাল বিক্রি শুরু করলে এখানে লাইভ দৈনিক বিক্রয় গ্রাফ তৈরি হবে</div>
              <button
                onClick={() => onSelectTab('pos')}
                className="mt-2.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                + পিওএস থেকে বিক্রি শুরু করুন
              </button>
            </div>
          ) : (
            <div className="h-40 flex items-end justify-between gap-2 pt-4 px-1">
              {last7Days.map((d, idx) => {
                const heightPct = d.amountPaisa > 0 ? Math.max(15, Math.round((d.amountPaisa / maxDayAmount) * 100)) : 8;
                const isToday = idx === last7Days.length - 1;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition tabular-nums">
                      {d.amountPaisa > 0 ? formatCurrency(d.amountPaisa, numFormat) : '৳০'}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        isToday
                          ? 'bg-[#1F7A4D] shadow-sm shadow-[#1F7A4D]/30'
                          : d.amountPaisa > 0 ? 'bg-[#D1EAD9] group-hover:bg-[#1F7A4D]/70' : 'bg-slate-200'
                      }`}
                    />
                    <span className={`text-[11px] font-bold ${isToday ? 'text-[#1F7A4D]' : 'text-slate-600'}`}>
                      {lang === 'bn' ? d.dayBn : d.dayEn}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: "সবচেয়ে বেশি চলা ৫ চাল" per Section 4.2 */}
        <div className="bg-white rounded-2xl border border-stroke-default p-4 sm:p-5 shadow-xs">
          <h3 className="text-xs font-extrabold text-[#1A1A17] uppercase tracking-wide mb-1">
            {lang === 'bn' ? 'সবচেয়ে বেশি চলা ৫ চাল' : 'Top 5 Rice Varieties'}
          </h3>
          <p className="text-[11px] text-slate-600 font-semibold mb-3">বিক্রির পরিমাণ ও বর্তমান মজুদ</p>

          <div className="space-y-2.5">
            {top5Rice.length === 0 ? (
              <div className="py-6 text-center text-slate-500">
                <p className="text-xs font-semibold">কোনো চালের আইটেম নেই</p>
                <button
                  onClick={() => onSelectTab('purchases')}
                  className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
                >
                  + চাল ক্রয় করুন
                </button>
              </div>
            ) : (
              top5Rice.map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-surface-page text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-[#1A1A17] block truncate">{prod.nameBn}</span>
                      <span className="text-[10px] text-slate-600 font-semibold">{prod.category}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-[#1F7A4D] tabular-nums block">
                      {formatCurrency(prod.retailPricePaisa, numFormat)}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold">
                      স্টক: {Math.floor(prod.stockKg / 50)} বস্তা
                    </span>
                  </div>
                </div>
              ))
            )}
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
            <span className="text-[11px] text-slate-600 font-semibold">কাউন্টার ও পাইকারি বিক্রির হিসাব</span>
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
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <p className="font-bold text-xs text-slate-700">আজ কোনো চাল বিক্রি এন্ট্রি করা হয়নি</p>
                    <button
                      onClick={() => onSelectTab('pos')}
                      className="mt-2 text-xs font-bold text-white bg-[#1F7A4D] hover:bg-[#16603B] px-3.5 py-1.5 rounded-xl shadow-xs transition"
                    >
                      + দ্রুত চাল বিক্রি শুরু করুন
                    </button>
                  </td>
                </tr>
              ) : (
                sales.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#1F7A4D]">{inv.docNo}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{formatDateBangla(inv.date)}</td>
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
              )))}
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

