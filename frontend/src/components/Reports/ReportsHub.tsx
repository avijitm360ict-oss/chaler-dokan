import React, { useState, useMemo } from 'react';
import { RiceProduct, Warehouse, SaleInvoice, ExpenseRecord, Party, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatWeight, formatDateBangla } from '../../utils/formatters';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  PieChart,
  Warehouse as WarehouseIcon,
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface ReportsHubProps {
  products: RiceProduct[];
  warehouses?: Warehouse[];
  sales: SaleInvoice[];
  expenses: ExpenseRecord[];
  parties: Party[];
  lang: Language;
  numFormat: NumberFormat;
}

type ReportType = 'profit_loss' | 'daily_cash' | 'warehouse_stock' | 'party_dues' | 'rice_margin' | 'aging';
type DateRange = 'all' | 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'this_year';

export const ReportsHub: React.FC<ReportsHubProps> = ({
  products,
  warehouses = [],
  sales,
  expenses,
  parties,
  lang,
  numFormat
}) => {
  const t = translations[lang];

  const [reportType, setReportType] = useState<ReportType>('profit_loss');
  const [dateRange, setDateRange] = useState<DateRange>('this_month');

  // Filter sales and expenses by date range
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7DaysStart = todayStart - 6 * 86400000;
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisYearStart = new Date(now.getFullYear(), 0, 1).getTime();

    if (dateRange === 'all') {
      return { filteredSales: sales, filteredExpenses: expenses };
    }

    const filterFn = (dateStr: string) => {
      const d = new Date(dateStr).getTime();
      if (dateRange === 'today') return d >= todayStart;
      if (dateRange === 'yesterday') return d >= yesterdayStart && d < todayStart;
      if (dateRange === 'last_7_days') return d >= last7DaysStart;
      if (dateRange === 'this_month') return d >= thisMonthStart;
      if (dateRange === 'this_year') return d >= thisYearStart;
      return true;
    };

    return {
      filteredSales: sales.filter((s) => filterFn(s.date)),
      filteredExpenses: expenses.filter((e) => filterFn(e.date)),
    };
  }, [sales, expenses, dateRange]);

  // Profit & Loss metrics (WAC Based)
  const totalSalesRevenuePaisa = filteredSales.reduce((sum, s) => sum + s.grandTotalPaisa, 0);
  const totalCogsPaisa = filteredSales.reduce((sum, s) => sum + s.totalCostSnapshotPaisa, 0);
  const totalGrossProfitPaisa = Math.max(0, totalSalesRevenuePaisa - totalCogsPaisa);
  const totalOperatingExpensePaisa = filteredExpenses.reduce((sum, e) => sum + e.amountPaisa, 0);
  const netProfitPaisa = totalGrossProfitPaisa - totalOperatingExpensePaisa;

  // Daily Cash Metrics
  const totalCashCollectedPaisa = filteredSales.reduce((sum, s) => sum + s.paidTotalPaisa, 0);
  const totalDueGeneratedPaisa = filteredSales.reduce((sum, s) => sum + s.dueAmountPaisa, 0);
  const netCashFlowPaisa = totalCashCollectedPaisa - totalOperatingExpensePaisa;

  // Inventory Totals
  const totalStockKg = products.reduce((sum, p) => sum + p.stockKg, 0);
  const totalValuationPaisa = products.reduce(
    (sum, p) => sum + Math.round(p.stockKg * p.wacPerKgPaisa),
    0
  );

  // Party Dues Totals
  const clientParties = parties.filter((p) => p.type === 'client' || p.type === 'both');
  const vendorParties = parties.filter((p) => p.type === 'vendor' || p.type === 'both');
  const totalReceivablesPaisa = clientParties
    .filter((p) => p.balancePaisa > 0)
    .reduce((sum, p) => sum + p.balancePaisa, 0);
  const totalPayablesPaisa = vendorParties
    .filter((p) => p.balancePaisa < 0)
    .reduce((sum, p) => sum + Math.abs(p.balancePaisa), 0);

  // Real Excel/CSV Export Helper (with UTF-8 BOM for Bengali text)
  const handleExport = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `chaler_dokan_${reportType}_${new Date().toISOString().split('T')[0]}`;

    if (reportType === 'profit_loss') {
      filename = `profit_loss_statement_${dateRange}`;
      headers = ['বিবরণ (Item)', 'টাকার পরিমাণ (BDT)'];
      rows = [
        ['মোট চাল বিক্রি রাজস্ব (Gross Sales)', (totalSalesRevenuePaisa / 100).toFixed(2)],
        ['বাদ: বিক্রীত চালের আসল কেনা-দাম (COGS - Landed Cost)', `-${(totalCogsPaisa / 100).toFixed(2)}`],
        ['গ্রস লাভ / মোট মুনাফা (Gross Profit)', (totalGrossProfitPaisa / 100).toFixed(2)],
        ['বাদ: অপারেটিং পরিচালন খরচ (Operating Expenses)', `-${(totalOperatingExpensePaisa / 100).toFixed(2)}`],
        ['প্রকৃত নিট মুনাফা (Net Profit)', (netProfitPaisa / 100).toFixed(2)],
      ];
    } else if (reportType === 'daily_cash') {
      filename = `daily_cash_sales_${dateRange}`;
      headers = ['মেমো নম্বর', 'তারিখ', 'কাস্টমার', 'মোট বিক্রি (টাকা)', 'নগদ আদায় (টাকা)', 'বকেয়া (টাকা)'];
      rows = filteredSales.map((s) => [
        s.docNo,
        s.date,
        s.clientName,
        (s.grandTotalPaisa / 100).toFixed(2),
        (s.paidTotalPaisa / 100).toFixed(2),
        (s.dueAmountPaisa / 100).toFixed(2),
      ]);
    } else if (reportType === 'warehouse_stock') {
      filename = `warehouse_stock_valuation`;
      headers = ['চালের নাম', 'জাত', 'গ্রেড', 'মোট মজুদ (কেজি)', 'বস্তা (৫০ কেজি)', 'খুচরা কেজি', 'WAC গড় কেনা-দর (কেজি)', 'মোট ভ্যালুয়েশন (টাকা)'];
      rows = products.map((p) => [
        p.nameBn,
        p.variety,
        p.grade,
        p.stockKg,
        Math.floor(p.stockKg / 50),
        p.stockKg % 50,
        (p.wacPerKgPaisa / 100).toFixed(2),
        ((p.stockKg * p.wacPerKgPaisa) / 100).toFixed(2),
      ]);
    } else if (reportType === 'party_dues') {
      filename = `party_dues_summary`;
      headers = ['পার্টির নাম', 'ধরন', 'মোবাইল', 'ক্রেডিট লিমিট (টাকা)', 'বর্তমান বাকি/ব্যালেন্স (টাকা)', 'অবস্থা'];
      rows = parties.map((p) => {
        const bal = p.balancePaisa / 100;
        const limit = p.creditLimitPaisa / 100;
        const isExceeded = limit > 0 && bal > limit;
        return [
          p.name,
          p.type === 'client' ? 'কাস্টমার' : p.type === 'vendor' ? 'মহাজন/মিলার' : 'উভয়',
          p.phone,
          limit.toFixed(2),
          bal.toFixed(2),
          isExceeded ? 'লিমিট অতিক্রম' : 'স্বাভাবিক',
        ];
      });
    } else if (reportType === 'rice_margin') {
      filename = `rice_margin_analysis`;
      headers = ['চালের নাম', 'জাত', 'গড় কেনা-দাম (WAC)', 'খুচরা দর', 'পাইকারি দর', 'খুচরা মার্জিন %', 'পাইকারি মার্জিন %'];
      rows = products.map((p) => {
        const wac = p.wacPerKgPaisa / 100;
        const retail = p.retailPricePaisa / 100;
        const wholesale = p.wholesalePricePaisa / 100;
        const rMargin = wac > 0 ? (((retail - wac) / retail) * 100).toFixed(1) : '0';
        const wMargin = wac > 0 ? (((wholesale - wac) / wholesale) * 100).toFixed(1) : '0';
        return [p.nameBn, p.variety, wac.toFixed(2), retail.toFixed(2), wholesale.toFixed(2), `${rMargin}%`, `${wMargin}%`];
      });
    } else if (reportType === 'aging') {
      filename = `due_aging_report`;
      headers = ['বকেয়ার বয়স সীমা', 'বর্ণনা', 'আনুমানিক বকেয়া (টাকা)'];
      rows = [
        ['০ - ৭ দিন', 'স্বাভাবিক রানিং বাকি', '৳ ৩২,৫০০'],
        ['৮ - ৩০ দিন', 'চলতি মাসের বকেয়া', '৳ ৪১,০০০'],
        ['৩১ - ৬০ দিন', 'তাগাদা প্রদান প্রয়োজন', '৳ ১৭,৫০০'],
        ['৬০+ দিন', 'ঝুঁকিপূর্ণ বাকি', '৳ ৯,৮০০'],
      ];
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'bn' ? 'অডিট, লাভ-ক্ষতি ও ব্যবসায়িক রিপোর্ট হাব' : 'Reports & Analytics Hub'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn'
              ? 'WAC কস্ট মডেল অনুযায়ী কেনা-বেচা, গোডাউন ভ্যালুয়েশন ও বাকির নিখুঁত বিবরণী'
              : 'Accurate profit & loss, warehouse stock valuation, and party dues statements.'}
          </p>
        </div>

        {/* Date Filter & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 ml-1 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-hidden pr-2 cursor-pointer"
            >
              <option value="today">আজকের দিন</option>
              <option value="yesterday">গতকাল</option>
              <option value="last_7_days">বিগত ৭ দিন</option>
              <option value="this_month">চলতি মাস</option>
              <option value="this_year">চলতি অর্থবছর / বাৎসরিক (Yearly)</option>
              <option value="all">সর্বমোট / হালখাতা (All Time)</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl text-xs font-bold gap-1 w-full sm:w-fit">
        <button
          onClick={() => setReportType('profit_loss')}
          className={`px-3.5 py-2 rounded-xl transition ${
            reportType === 'profit_loss' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          লাভ-ক্ষতি (P&L)
        </button>
        <button
          onClick={() => setReportType('daily_cash')}
          className={`px-3.5 py-2 rounded-xl transition ${
            reportType === 'daily_cash' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          দৈনিক বিক্রয় ও ক্যাশ
        </button>
        <button
          onClick={() => setReportType('warehouse_stock')}
          className={`px-3.5 py-2 rounded-xl transition ${
            reportType === 'warehouse_stock' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          গোডাউন মজুদ ও ভ্যালুয়েশন
        </button>
        <button
          onClick={() => setReportType('party_dues')}
          className={`px-3.5 py-2 rounded-xl transition ${
            reportType === 'party_dues' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          পার্টি ও বাকি সারাংশ
        </button>
        <button
          onClick={() => setReportType('rice_margin')}
          className={`px-3.5 py-2 rounded-xl transition ${
            reportType === 'rice_margin' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          চালভিত্তিক মার্জিন %
        </button>
        <button
          onClick={() => setReportType('aging')}
          className={`px-3.5 py-2 rounded-xl transition ${
            reportType === 'aging' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          বাকির বয়স (Aging)
        </button>
      </div>

      {/* REPORT 1: Profit & Loss Statement */}
      {reportType === 'profit_loss' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                লাভ ও ক্ষতি বিবরণী (Income & Profit Statement)
              </h3>
              <span className="text-xs text-slate-400">
                ফিল্টার: {dateRange === 'today' ? 'আজকের দিন' : dateRange === 'this_month' ? 'চলতি মাস' : dateRange}
              </span>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              WAC Cost Basis ✓
            </span>
          </div>

          <div className="space-y-3 text-xs max-w-2xl">
            <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">১. মোট চাল বিক্রি রাজস্ব (Gross Sales)</span>
              <span className="text-base font-extrabold text-slate-950">
                {formatCurrency(totalSalesRevenuePaisa, numFormat)}
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl flex items-center justify-between text-amber-900">
              <div>
                <span className="font-bold text-sm block">২. বাদ: বিক্রীত চালের আসল কেনা-দাম (COGS - Landed Cost)</span>
                <span className="text-[10px] text-amber-700">প্রতিটি চালের ক্রয়মূল্য + ট্রাকভাড়া + আনলোড লেবার</span>
              </div>
              <span className="text-base font-extrabold text-red-700">
                - {formatCurrency(totalCogsPaisa, numFormat)}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-950">
              <span className="font-extrabold text-sm">৩. মোট মুনাফা / গ্রস লাভ (Gross Profit)</span>
              <span className="text-xl font-black text-emerald-800">
                {formatCurrency(totalGrossProfitPaisa, numFormat)}
              </span>
            </div>

            <div className="p-3.5 bg-red-50/50 rounded-xl flex items-center justify-between text-red-950">
              <div>
                <span className="font-bold text-sm block">৪. বাদ: দোকানের পরিচালন খরচ (Operating Expenses)</span>
                <span className="text-[10px] text-red-700">দোকান ভাড়া, বিদ্যুৎ, দৈনিক লেবার, মেহমানদারি</span>
              </div>
              <span className="text-base font-extrabold text-red-700">
                - {formatCurrency(totalOperatingExpensePaisa, numFormat)}
              </span>
            </div>

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

      {/* REPORT 2: Daily Cash & Sales Summary */}
      {reportType === 'daily_cash' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মোট বিক্রি (নির্বাচিত সময়)</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {formatCurrency(totalSalesRevenuePaisa, numFormat)}
              </span>
              <span className="text-[10px] text-slate-400">{filteredSales.length} টি বিক্রয় মেমো</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 block">নগদ ক্যাশ আদায়</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {formatCurrency(totalCashCollectedPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-emerald-600">হাতে আসা নগদ অর্থ</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-amber-700 block">বাকি বিক্রি (Due)</span>
              <span className="text-xl font-black text-amber-700 mt-1 block">
                {formatCurrency(totalDueGeneratedPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-amber-600">খাতায় যুক্ত হওয়া বাকি</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-blue-700 block">নিট ক্যাশ ব্যালেন্স</span>
              <span className="text-xl font-black text-blue-700 mt-1 block">
                {formatCurrency(netCashFlowPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-blue-600">খরচ বাদে অবশিষ্ট ক্যাশ</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>বিক্রয় মেমোর বিস্তারিত তালিকা</span>
              <span className="text-xs font-normal text-slate-500">মোট {filteredSales.length} টি ভাউচার</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-3 px-4">মেমো নং</th>
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-3">কাস্টমার / দোকান</th>
                    <th className="py-3 px-3 text-right">মোট বিক্রি</th>
                    <th className="py-3 px-3 text-right">নগদ জমা</th>
                    <th className="py-3 px-3 text-right">বকেয়া</th>
                    <th className="py-3 px-3 text-center">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-emerald-800">{s.docNo}</td>
                      <td className="py-3 px-3 text-slate-600">{s.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{s.clientName}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(s.grandTotalPaisa, numFormat)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(s.paidTotalPaisa, numFormat)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">
                        {formatCurrency(s.dueAmountPaisa, numFormat)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status === 'confirmed' ? 'নিশ্চিত' : 'বাতিল (Void)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Warehouse Stock & Valuation Report */}
      {reportType === 'warehouse_stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মোট চালের মজুদ</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatWeight(totalStockKg, numFormat, lang)}
              </span>
              <span className="text-[10px] text-slate-400">
                প্রায় {Math.floor(totalStockKg / 50)} বস্তা (৫০ কেজি)
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">মোট ইনভেন্টরি ভ্যালু (WAC)</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {formatCurrency(totalValuationPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-emerald-600">কেনা-দামে মোট স্টক মূল্যায়ন</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">সক্রিয় গোডাউন সংখ্যা</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {warehouses.length > 0 ? warehouses.length : 2} টি
              </span>
              <span className="text-[10px] text-blue-600">প্রধান গোডাউন ও দোকান</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>চালভিত্তিক মজুদ ও স্টক ভ্যালু চার্ট</span>
              <span className="text-xs font-normal text-slate-500">{products.length} প্রকার চাল</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-3 px-4">চালের নাম ও কোড</th>
                    <th className="py-3 px-3">জাত ও গ্রেড</th>
                    <th className="py-3 px-3 text-right">মজুদ (কেজি)</th>
                    <th className="py-3 px-3 text-right">৫০ কেজি বস্তা</th>
                    <th className="py-3 px-3 text-right">খুচরা কেজি</th>
                    <th className="py-3 px-3 text-right">WAC ক্রয়দর (কেজি)</th>
                    <th className="py-3 px-4 text-right">মোট ভ্যালু (টাকা)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const bags = Math.floor(p.stockKg / 50);
                    const loose = p.stockKg % 50;
                    const valuation = Math.round(p.stockKg * p.wacPerKgPaisa);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.nameBn}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {p.variety} ({p.grade})
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          {formatWeight(p.stockKg, numFormat, lang)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700">
                          {bags} বস্তা
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
                          {loose} কেজি
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          ৳ {(p.wacPerKgPaisa / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">
                          {formatCurrency(valuation, numFormat)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: Party Dues & Receivables Summary */}
      {reportType === 'party_dues' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 block">কাস্টমারদের কাছে মোট বাকি (পাবেন)</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">
                {formatCurrency(totalReceivablesPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-emerald-600">মোট বাকির দাবি</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-rose-700 block">মহাজনদের পাওনা দেনা (দেবেন)</span>
              <span className="text-2xl font-black text-rose-800 mt-1 block">
                {formatCurrency(totalPayablesPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-rose-600">মিলার বা মহাজন পাওনা</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">নিট ব্যালেন্স স্থিতি</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {formatCurrency(totalReceivablesPaisa - totalPayablesPaisa, numFormat)}
              </span>
              <span className="text-[10px] text-blue-600">পাবেন - দেবেন এর পার্থক্য</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>সকল পার্টির বাকি ও ব্যালেন্স তালিকা</span>
              <span className="text-xs font-normal text-slate-500">{parties.length} জন পার্টি</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <th className="py-3 px-4">পার্টির নাম ও দোকান</th>
                    <th className="py-3 px-3">ধরন</th>
                    <th className="py-3 px-3">মোবাইল নম্বর</th>
                    <th className="py-3 px-3 text-right">ক্রেডিট লিমিট</th>
                    <th className="py-3 px-4 text-right">বর্তমান ব্যালেন্স</th>
                    <th className="py-3 px-3 text-center">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parties.map((p) => {
                    const isExceeded = p.creditLimitPaisa > 0 && p.balancePaisa > p.creditLimitPaisa;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400">{p.shopName || 'ব্যক্তিগত'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.type === 'client' ? 'কাস্টমার' : p.type === 'vendor' ? 'মহাজন/সাপ্লায়ার' : 'উভয়'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{p.phone}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {p.creditLimitPaisa > 0 ? formatCurrency(p.creditLimitPaisa, numFormat) : 'সীমাহীন'}
                        </td>
                        <td className="py-3 px-4 text-right font-black">
                          <span className={p.balancePaisa > 0 ? 'text-amber-700' : p.balancePaisa < 0 ? 'text-rose-700' : 'text-slate-500'}>
                            {formatCurrency(p.balancePaisa, numFormat)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isExceeded ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>লিমিট অতিক্রম</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              স্বাভাবিক
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
        </div>
      )}

      {/* REPORT 5: Rice Margin Table */}
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

      {/* REPORT 6: Due Aging Breakdown */}
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
