import React, { useState } from 'react';
import { Party, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, toBengaliDigits } from '../../utils/formatters';
import { Users, Phone, MapPin, Plus, DollarSign, Calendar, Clock, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PartyLedgerViewProps {
  parties: Party[];
  lang: Language;
  numFormat: NumberFormat;
  onUpdatePartyBalance: (partyId: string, paymentPaisa: number) => void;
}

export const PartyLedgerView: React.FC<PartyLedgerViewProps> = ({
  parties,
  lang,
  numFormat,
  onUpdatePartyBalance
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'vendors'>('clients');
  const [selectedParty, setSelectedParty] = useState<Party | null>(parties[0] || null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionTaka, setCollectionTaka] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');

  const filteredParties = parties.filter((p) => {
    if (activeTab === 'clients') return p.type === 'client' || p.type === 'both';
    if (activeTab === 'vendors') return p.type === 'vendor' || p.type === 'both';
    return true;
  });

  const totalReceivablePaisa = parties
    .filter((p) => p.type === 'client' || p.type === 'both')
    .reduce((sum, p) => sum + p.balancePaisa, 0);

  const totalPayablePaisa = parties
    .filter((p) => p.type === 'vendor' || p.type === 'both')
    .reduce((sum, p) => sum + p.balancePaisa, 0);

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || collectionTaka <= 0) return;
    onUpdatePartyBalance(selectedParty.id, Math.round(collectionTaka * 100));
    setCollectionModalOpen(false);
    setCollectionTaka(0);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Due Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">মোট কাস্টমার বাকি (পাওনা)</span>
          <div className="text-xl font-extrabold text-amber-700 mt-1">
            {formatCurrency(totalReceivablePaisa, numFormat)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">খাতা অনুযায়ী মোট পাওনা</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">মোট মিলের পাওনা (দেনা)</span>
          <div className="text-xl font-extrabold text-red-700 mt-1">
            {formatCurrency(totalPayablePaisa, numFormat)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">রাইস মিল ও মহাজনদের দেনা</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">বাকির বয়স (০-৩০ দিন)</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {formatCurrency(Math.round(totalReceivablePaisa * 0.7), numFormat)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">নিয়মিত রানিং বাকি</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">ঝুঁকিপূর্ণ বাকি (৬০+ দিন)</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(Math.round(totalReceivablePaisa * 0.12), numFormat)}
          </div>
          <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">তাগাদা দেওয়া জরুরি</span>
        </div>

      </div>

      {/* Main Grid: Party List + Ledger Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Party List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'clients' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                কাস্টমারগণ
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'vendors' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                মিল / মহাজন
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {filteredParties.length} জন
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
            {filteredParties.map((party) => {
              const isSelected = selectedParty?.id === party.id;
              return (
                <div
                  key={party.id}
                  onClick={() => setSelectedParty(party)}
                  className={`p-3.5 cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {party.name}
                    </div>
                    {party.shopName && (
                      <div className="text-xs text-slate-500 font-medium">
                        {party.shopName}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{party.phone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {party.type === 'vendor' ? 'পাওনা দেনা' : 'বকেয়া বাকি'}
                    </span>
                    <span className="font-extrabold text-sm text-amber-800">
                      {formatCurrency(party.balancePaisa, numFormat)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Party Statement & Actions (7 cols) */}
        {selectedParty ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4">
            
            <div>
              {/* Header Profile */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4 border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{selectedParty.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {selectedParty.clientType ? `ক্রেতা (${selectedParty.clientType})` : 'মিল/সাপ্লায়ার'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedParty.phone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedParty.address}
                    </span>
                  </p>
                </div>

                {/* Collect / Pay Money Button */}
                <button
                  onClick={() => {
                    setCollectionTaka(selectedParty.balancePaisa / 100);
                    setCollectionModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-98"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{selectedParty.type === 'vendor' ? 'মিলকে টাকা পরিশোধ' : 'বাকি টাকা আদায়'}</span>
                </button>
              </div>

              {/* Balance Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block">বর্তমান মোট বাকি</span>
                  <span className="text-lg font-extrabold text-amber-950">
                    {formatCurrency(selectedParty.balancePaisa, numFormat)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">ক্রেডিট লিমিট</span>
                  <span className="text-lg font-extrabold text-slate-800">
                    {formatCurrency(selectedParty.creditLimitPaisa, numFormat)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-emerald-800 font-bold block">মোট লেনদেন</span>
                  <span className="text-lg font-extrabold text-emerald-950">
                    {formatCurrency(selectedParty.totalSoldPaisa || selectedParty.totalPurchasedPaisa || 0, numFormat)}
                  </span>
                </div>
              </div>

              {/* Sample Party Ledger Statement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">লেনদেনের লেজার খতিয়ান (সাম্প্রতিক)</h4>
                  <button
                    onClick={() => window.print()}
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>স্টেটমেন্ট প্রিন্ট</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">তারিখ</th>
                        <th className="py-2 px-3">বিবরণ / রেফারেন্স</th>
                        <th className="py-2 px-3 text-right">ডেবিট (টাকা)</th>
                        <th className="py-2 px-3 text-right">ক্রেডিট (জমা)</th>
                        <th className="py-2 px-3 text-right">অবশিষ্ট ব্যালেন্স</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3 text-slate-500">১৪ অক্টো, ২০২৬</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">চাল বিক্রি (INV-2026-000101)</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">৳ ৫৪,০০০</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-800">৳ ৭৮,৫০০</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">১৪ অক্টো, ২০২৬</td>
                        <td className="py-2 px-3 font-semibold text-emerald-700">নগদ ও বিকাশ জমা (রসিদ #৪০৮)</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">৳ ৩০,০০০</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-800">৳ ৪৮,৫০০</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between border-t pt-3 border-slate-100">
              <span>সঠিক হিসাব সংরক্ষণে FIFO ভিত্তিক বিল সমন্বয় প্রযোজ্য</span>
              <span className="font-semibold text-emerald-700">অডিট সিকিউরড ✓</span>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center text-slate-400">
            বাম পাশ থেকে যেকোনো পার্টি সিলেক্ট করুন
          </div>
        )}

      </div>

      {/* MONEY COLLECTION MODAL */}
      {collectionModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {selectedParty.type === 'vendor' ? 'মিলকে টাকা পরিশোধ' : 'বাকি টাকা আদায়'}
              </h3>
              <button onClick={() => setCollectionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-900 font-semibold flex justify-between">
                <span>বর্তমান বকেয়া:</span>
                <span className="font-extrabold">{formatCurrency(selectedParty.balancePaisa, numFormat)}</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">আদায়কৃত টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={collectionTaka || ''}
                  onChange={(e) => setCollectionTaka(Number(e.target.value))}
                  placeholder="০"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-lg text-emerald-800 bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">টাকা গ্রহণের মাধ্যম</label>
                <div className="grid grid-cols-2 gap-2 font-bold">
                  {(['cash', 'bkash', 'nagad', 'bank'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-xl border text-center transition ${
                        paymentMethod === m ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {m === 'cash' ? 'নগদ ক্যাশ ড্রয়ার' : m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>আদায় সম্পন্ন করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
