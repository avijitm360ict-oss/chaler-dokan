import React, { useState } from 'react';
import { ExpenseRecord, DayCloseRecord, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, formatDateBangla } from '../../utils/formatters';
import { Wallet, Plus, CheckCircle2, Lock, Unlock, AlertTriangle, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';

interface CashBookAndDayCloseProps {
  expenses: ExpenseRecord[];
  dayClose: DayCloseRecord;
  lang: Language;
  numFormat: NumberFormat;
  onAddExpense: (expense: ExpenseRecord) => void;
  onPerformDayClose: (countedCashPaisa: number, note: string) => void;
}

export const CashBookAndDayClose: React.FC<CashBookAndDayCloseProps> = ({
  expenses,
  dayClose,
  lang,
  numFormat,
  onAddExpense,
  onPerformDayClose
}) => {
  const t = translations[lang];

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [dayCloseModalOpen, setDayCloseModalOpen] = useState(false);

  // New Expense state
  const [expenseCategory, setExpenseCategory] = useState<'rent' | 'electricity' | 'labour' | 'transport' | 'tea_snacks' | 'other'>('labour');
  const [expenseTaka, setExpenseTaka] = useState<number>(0);
  const [expenseAccount, setExpenseAccount] = useState<string>('প্রধান ক্যাশ ড্রয়ার');
  const [expenseNote, setExpenseNote] = useState<string>('');

  // Day close state
  const [countedCashTaka, setCountedCashTaka] = useState<number>(dayClose.expectedSystemCashPaisa / 100);
  const [dayCloseNote, setDayCloseNote] = useState<string>('আলহামদুলিল্লাহ, ক্যাশ সম্পূর্ণ গোনা হয়েছে।');

  const countedCashPaisa = Math.round(countedCashTaka * 100);
  const differencePaisa = countedCashPaisa - dayClose.expectedSystemCashPaisa;

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseTaka <= 0) return;

    const categoryNames: Record<string, string> = {
      rent: 'দোকান ভাড়া',
      electricity: 'বিদ্যুৎ বিল',
      labour: 'লেবার ও কুলি খরচ',
      transport: 'গাড়িভাড়া / পরিবহন',
      tea_snacks: 'দোকানের চা-নাস্তা ও আপ্যায়ন',
      other: 'অন্যান্য জরুরি খরচ'
    };

    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      category: expenseCategory,
      categoryNameBn: categoryNames[expenseCategory] || 'খরচ',
      amountPaisa: Math.round(expenseTaka * 100),
      account: expenseAccount,
      note: expenseNote
    };

    onAddExpense(newExp);
    setExpenseModalOpen(false);
    setExpenseTaka(0);
    setExpenseNote('');
  };

  const handleDayCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPerformDayClose(countedCashPaisa, dayCloseNote);
    setDayCloseModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner: Day Close Status & Cash Register */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {lang === 'bn' ? 'দৈনিক ক্যাশ বুক ও ডে-ক্লোজ' : 'Daily Cash Book & Day Close'}
            </h2>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            {lang === 'bn' 
              ? 'দিনের সমস্ত নগদ টাকার আয়-ব্যয় মিলিয়ে দিনশেষে ড্রয়ারের ক্যাশের সাথে হিসাব ক্লোজ করুন।' 
              : 'Reconcile daily cash register drawer against system sales, collections and expenses.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? '+ খরচ এন্ট্রি' : '+ Record Expense'}</span>
          </button>

          <button
            onClick={() => setDayCloseModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition"
          >
            <Lock className="w-4 h-4" />
            <span>{lang === 'bn' ? 'আজকের ডে-ক্লোজ করুন' : 'Perform Day Close'}</span>
          </button>
        </div>
      </div>

      {/* Cash Reconcile KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">দিনের শুরুর ক্যাশ (Opening)</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(dayClose.openingCashPaisa, numFormat)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">সকালে ড্রয়ারে থাকা ক্যাশ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">আজকের মোট নগদ বিক্রি ও আদায়</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {formatCurrency(dayClose.totalSalesCashPaisa + dayClose.dueCollectedCashPaisa, numFormat)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" />
            ক্যাশ জমা
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">আজকের মোট খরচ ও মিলকে পরিশোধ</span>
          <div className="text-xl font-extrabold text-red-700 mt-1">
            {formatCurrency(dayClose.expensesPaidCashPaisa + dayClose.vendorPaidCashPaisa, numFormat)}
          </div>
          <span className="text-[10px] text-red-600 font-bold mt-0.5 block flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            ক্যাশ বের হওয়া
          </span>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-900 block">সিস্টেম ড্রয়ার ক্যাশ ব্যালেন্স</span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            ড্রয়ারে এই টাকা নগদ থাকা উচিত
          </span>
        </div>

      </div>

      {/* Expense History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">
            {lang === 'bn' ? 'সাম্প্রতিক খরচের খতিয়ান' : 'Recent Expenses Log'}
          </h3>
          <span className="text-xs text-slate-400">{expenses.length} টি এন্ট্রি</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-2.5 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'খরচের খাত / ক্যাটাগরি' : 'Category'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'টাকার মাধ্যম' : 'Account'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'বিবরণ / নোট' : 'Note'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500">{formatDateBangla(exp.date)}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{exp.categoryNameBn}</td>
                  <td className="py-2.5 px-3 text-slate-600">{exp.account}</td>
                  <td className="py-2.5 px-3 text-slate-500 italic">{exp.note || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-red-700">
                    - {formatCurrency(exp.amountPaisa, numFormat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {lang === 'bn' ? 'নতুন খরচ এন্ট্রি' : 'Add Expense Record'}
              </h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">খরচের খাত</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="labour">লেবার ও কুলি খরচ (আনলোডিং/লোডিং)</option>
                  <option value="rent">দোকান ও গোডাউন ভাড়া</option>
                  <option value="electricity">বিদ্যুৎ বিল</option>
                  <option value="transport">গাড়িভাড়া / পরিবহন</option>
                  <option value="tea_snacks">চা-নাস্তা ও মেহমানদারি</option>
                  <option value="other">অন্যান্য জরুরি খরচ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={expenseTaka || ''}
                  onChange={(e) => setExpenseTaka(Number(e.target.value))}
                  placeholder="০"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-red-700 text-lg bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">কোন ফান্ড থেকে দেওয়া হয়েছে</label>
                <select
                  value={expenseAccount}
                  onChange={(e) => setExpenseAccount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  <option value="প্রধান ক্যাশ ড্রয়ার">প্রধান ক্যাশ ড্রয়ার</option>
                  <option value="বিকাশ মার্চেন্ট">বিকাশ মার্চেন্ট</option>
                  <option value="ডাচ বাংলা ব্যাংক">ডাচ বাংলা ব্যাংক</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">নোট / বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="যেমন: ৫০ বস্তা নাজিরশাইল আনলোড বাবদ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md"
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAY CLOSE RECONCILIATION MODAL */}
      {dayCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {lang === 'bn' ? 'আজকের ডে-ক্লোজ (ক্যাশ মিলানো)' : 'Reconcile Cash & Close Day'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    সিস্টেমের মোট ক্যাশ বনাম ড্রয়ারের গোনা ক্যাশ মিলিয়ে হিসাব চূড়ান্তকরণ
                  </span>
                </div>
              </div>
              <button onClick={() => setDayCloseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleDayCloseSubmit} className="space-y-4 text-xs">
              
              {/* Expected vs Physical Count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <span className="text-slate-500 font-semibold block">সিস্টেম অনুযায়ী ক্যাশ:</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(dayClose.expectedSystemCashPaisa, numFormat)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                  <label className="text-emerald-900 font-bold block mb-1">ড্রয়ারে গোনা আসল ক্যাশ (৳):</label>
                  <input
                    type="number"
                    value={countedCashTaka}
                    onChange={(e) => setCountedCashTaka(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-emerald-400 rounded-lg text-lg font-black text-emerald-900"
                  />
                </div>
              </div>

              {/* Discrepancy indicator */}
              <div className={`p-3 rounded-xl font-bold flex items-center justify-between ${
                differencePaisa === 0
                  ? 'bg-emerald-100 text-emerald-900'
                  : differencePaisa > 0
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-red-100 text-red-900'
              }`}>
                <span>{differencePaisa === 0 ? '✓ হিসাব সম্পূর্ণ মিলেছে (শূন্য অমিল)' : 'ক্যাশ গরমিল / পার্থক্য:'}</span>
                <span className="font-extrabold text-sm">
                  {differencePaisa === 0 ? '০.০০ ৳' : `${differencePaisa > 0 ? '+' : ''}${formatCurrency(differencePaisa, numFormat)}`}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ক্লোজিং মন্তব্য / অডিট নোট</label>
                <textarea
                  rows={2}
                  value={dayCloseNote}
                  onChange={(e) => setDayCloseNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-tight">
                ⚠️ সতর্কতা: ডে-ক্লোজ সম্পন্ন করার পর আজকের তারিখের পূর্ববর্তী কোনো লেনদেন সাধারণ ক্যাশিয়ার পরিবর্তন করতে পারবে না।
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDayCloseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ডে-ক্লোজ সম্পন্ন ও লক করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
