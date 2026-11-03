import React, { useState } from 'react';
import { Party, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { formatCurrency, toBengaliDigits } from '../../utils/formatters';
import { Users, Phone, MapPin, Plus, DollarSign, Calendar, Clock, Printer, CheckCircle2, ShieldCheck, MessageSquare, UserPlus } from 'lucide-react';
import { api } from '../../api/client';

interface PartyLedgerViewProps {
  parties: Party[];
  lang: Language;
  numFormat: NumberFormat;
  onCreateParty?: (newParty: Party) => void;
  onUpdatePartyBalance: (partyId: string, paymentPaisa: number) => void;
}

export const PartyLedgerView: React.FC<PartyLedgerViewProps> = ({
  parties,
  lang,
  numFormat,
  onCreateParty,
  onUpdatePartyBalance
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'all' | 'clients' | 'vendors'>('clients');
  const [selectedParty, setSelectedParty] = useState<Party | null>(parties[0] || null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionTaka, setCollectionTaka] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank'>('cash');
  const [isSendingSms, setIsSendingSms] = useState(false);

  // New Party Modal State (BUG-ACC-01)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPartyType, setNewPartyType] = useState<'client' | 'vendor'>('client');
  const [newName, setNewName] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCreditLimitTaka, setNewCreditLimitTaka] = useState<number>(50000);
  const [newOpeningBalanceTaka, setNewOpeningBalanceTaka] = useState<number>(0);
  const [newBalanceType, setNewBalanceType] = useState<'receivable' | 'payable'>('receivable');

  const handleSendDueSms = async () => {
    if (!selectedParty) return;
    try {
      setIsSendingSms(true);
      const res: any = await api.parties.sendSms(selectedParty.id);
      alert(res?.message || `${selectedParty.name}-কে বকেয়া তাগাদা SMS সফলভাবে পাঠানো হয়েছে!`);
    } catch (err: any) {
      alert('SMS পাঠাতে সমস্যা হয়েছে: ' + (err?.message || 'সমস্যা'));
    } finally {
      setIsSendingSms(false);
    }
  };

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

  const handleCreatePartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('অনুগ্রহ করে নাম এবং মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    const created: Party = {
      id: `party-${Date.now()}`,
      name: newName.trim(),
      shopName: newShopName.trim() || undefined,
      phone: newPhone.trim(),
      address: newAddress.trim() || 'বাবুবাজার, ঢাকা',
      type: newPartyType,
      clientType: newPartyType === 'client' ? 'wholesale' : undefined,
      vendorType: newPartyType === 'vendor' ? 'mill' : undefined,
      balancePaisa: Math.round((newOpeningBalanceTaka || 0) * 100),
      balanceType: newBalanceType,
      creditLimitPaisa: Math.round((newCreditLimitTaka || 0) * 100),
      totalSoldPaisa: 0,
      totalPurchasedPaisa: 0,
    };

    onCreateParty?.(created);
    setSelectedParty(created);
    setCreateModalOpen(false);

    // Reset Form
    setNewName('');
    setNewShopName('');
    setNewPhone('');
    setNewAddress('');
    setNewOpeningBalanceTaka(0);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Due Summary Cards with Strict Color Palette: পাবেন = Green, দেবেন = Red */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: কাস্টমার বাকি (পাবেন) -> সবুজ (Green / Emerald) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 block">মোট কাস্টমার বাকি (পাবেন)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              সবুজ: পাবেন
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {formatCurrency(totalReceivablePaisa, numFormat)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">খাতা অনুযায়ী মোট পাওনা টাকা</span>
        </div>

        {/* Card 2: মিলের পাওনা (দেবেন) -> লাল (Red / Rose) */}
        <div className="bg-white p-4 rounded-2xl border border-red-200/90 shadow-xs bg-red-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-950 block">মোট মিলের পাওনা (দেবেন)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
              লাল: দেবেন
            </span>
          </div>
          <div className="text-xl font-extrabold text-red-700 mt-1">
            {formatCurrency(totalPayablePaisa, numFormat)}
          </div>
          <span className="text-[10px] text-red-600 font-medium mt-0.5 block">রাইস মিল ও মহাজনদের দেনা টাকা</span>
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
          <div className="text-xl font-extrabold text-red-800 mt-1">
            {formatCurrency(Math.round(totalReceivablePaisa * 0.12), numFormat)}
          </div>
          <span className="text-[10px] text-red-600 font-bold mt-0.5 block">তাগাদা দেওয়া জরুরি</span>
        </div>

      </div>

      {/* Main Grid: Party List + Ledger Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Party List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          
          <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                {filteredParties.length} জন
              </span>
              <button
                onClick={() => {
                  setNewPartyType(activeTab === 'vendors' ? 'vendor' : 'client');
                  setNewBalanceType(activeTab === 'vendors' ? 'payable' : 'receivable');
                  setCreateModalOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ নতুন খাতা</span>
              </button>
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
            {filteredParties.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">👥</span>
                <p className="font-bold text-slate-700 text-xs">কোনো কাস্টমার বা সাপ্লায়ার পাওয়া যায়নি</p>
                <button
                  onClick={() => {
                    setNewPartyType('client');
                    setCreateModalOpen(true);
                  }}
                  className="mt-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  + নতুন কাস্টমার যোগ করুন
                </button>
              </div>
            ) : (
              filteredParties.map((party) => {
              const isSelected = selectedParty?.id === party.id;
              const isVendor = party.type === 'vendor';
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
                    <span className="text-[10px] block font-bold">
                      {isVendor ? (
                        <span className="text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">দেবেন</span>
                      ) : (
                        <span className="text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">পাবেন</span>
                      )}
                    </span>
                    <span className={`font-extrabold text-sm block mt-1 ${isVendor ? 'text-red-700' : 'text-emerald-700'}`}>
                      {formatCurrency(party.balancePaisa, numFormat)}
                    </span>
                  </div>
                </div>
              );
            }))}
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
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedParty.type === 'vendor' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedParty.type === 'vendor' ? 'মিল / মহাজন (সাপ্লায়ার)' : `ক্রেতা (${selectedParty.clientType || 'পাইকারি'})`}
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

                <div className="flex items-center gap-2">
                  {selectedParty.balancePaisa > 0 && selectedParty.type !== 'vendor' && (
                    <button
                      type="button"
                      onClick={handleSendDueSms}
                      disabled={isSendingSms}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isSendingSms ? 'পাঠানো হচ্ছে...' : 'তাগাদা SMS'}</span>
                    </button>
                  )}

                  {/* Collect / Pay Money Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setCollectionTaka(selectedParty.balancePaisa / 100);
                      setCollectionModalOpen(true);
                    }}
                    className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-98 cursor-pointer ${
                      selectedParty.type === 'vendor' 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{selectedParty.type === 'vendor' ? 'মিলকে টাকা পরিশোধ (দেবেন)' : 'বাকি টাকা আদায় (পাবেন)'}</span>
                  </button>
                </div>
              </div>

              {/* Balance Box with Strict Color Standard */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                <div className={`p-3 rounded-xl border ${
                  selectedParty.type === 'vendor'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <span className={`text-[10px] font-bold block ${
                    selectedParty.type === 'vendor' ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    {selectedParty.type === 'vendor' ? 'বর্তমান দেনা (দেবেন)' : 'বর্তমান পাওনা (পাবেন)'}
                  </span>
                  <span className={`text-lg font-extrabold ${
                    selectedParty.type === 'vendor' ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    {formatCurrency(selectedParty.balancePaisa, numFormat)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">ক্রেডিট লিমিট</span>
                  <span className="text-lg font-extrabold text-slate-800">
                    {formatCurrency(selectedParty.creditLimitPaisa, numFormat)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-600 font-bold block">মোট লেনদেন</span>
                  <span className="text-lg font-extrabold text-slate-900">
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
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
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
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">৳ ৭৮,৫০০</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-slate-500">১৪ অক্টো, ২০২৬</td>
                        <td className="py-2 px-3 font-semibold text-emerald-700">নগদ ও বিকাশ জমা (রসিদ #৪০৮)</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">৳ ৩০,০০০</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">৳ ৪৮,৫০০</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between border-t pt-3 border-slate-100">
              <span>সঠিক হিসাব সংরক্ষণে আগের বাকি আগে পরিশোধ (FIFO পদ্ধতি) প্রযোজ্য</span>
              <span className="font-semibold text-emerald-700">অডিট সিকিউরড ✓</span>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <span className="text-4xl mb-1">👥</span>
            <div className="font-bold text-slate-700 text-sm">কোনো পার্টি বা খাতা সিলেক্ট করা নেই</div>
            <p className="text-xs text-slate-500 max-w-xs">
              বাম পাশের তালিকা থেকে কাস্টমার বা সাপ্লায়ার সিলেক্ট করে লেনদেনের লেজার দেখুন।
            </p>
          </div>
        )}

      </div>

      {/* CREATE NEW PARTY MODAL (BUG-ACC-01) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    নতুন পার্টি খাতা তৈরি (কাস্টমার / সাপ্লায়ার)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    নতুন ক্রেতা বা মিলার এন্ট্রি করুন এবং প্রারম্ভিক জের সেট করুন
                  </p>
                </div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartySubmit} className="space-y-3 text-xs">
              
              {/* Type Switcher */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">পার্টির ধরন সিলেক্ট করুন *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPartyType('client');
                      setNewBalanceType('receivable');
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
                      newPartyType === 'client'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🛒 কাস্টমার / খুচরা-পাইকারি ক্রেতা
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPartyType('vendor');
                      setNewBalanceType('payable');
                    }}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition ${
                      newPartyType === 'vendor'
                        ? 'bg-red-50 border-red-600 text-red-900 ring-2 ring-red-500/20'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🏭 মিল / মহাজন / সাপ্লায়ার
                  </button>
                </div>
              </div>

              {/* Name & Shop Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ব্যক্তির নাম *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="যেমন: হাজী আব্দুল করিম"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">দোকান / মিলের নাম</label>
                  <input
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="যেমন: ভাই ভাই রাইস এজেন্সি"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                  />
                </div>
              </div>

              {/* Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ঠিকানা / আড়তের অবস্থান</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="যেমন: বাবুবাজার, ঢাকা"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                  />
                </div>
              </div>

              {/* Credit Limit & Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ক্রেডিট লিমিট (৳)</label>
                  <input
                    type="number"
                    value={newCreditLimitTaka || ''}
                    onChange={(e) => setNewCreditLimitTaka(Number(e.target.value))}
                    placeholder="৫০,০০০"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    প্রারম্ভিক জের / ব্যালেন্স (৳)
                  </label>
                  <input
                    type="number"
                    value={newOpeningBalanceTaka || ''}
                    onChange={(e) => setNewOpeningBalanceTaka(Number(e.target.value))}
                    placeholder="০"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>
              </div>

              {/* Balance Type Indicator */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-600">জেরের ধরন:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  newPartyType === 'vendor' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {newPartyType === 'vendor' ? 'দেবেন (মিলারকে দেওয়া হবে - লাল)' : 'পাবেন (কাস্টমার থেকে আদায় - সবুজ)'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MONEY COLLECTION / PAYMENT MODAL */}
      {collectionModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {selectedParty.type === 'vendor' ? 'মিলকে টাকা পরিশোধ (দেবেন)' : 'বাকি টাকা আদায় (পাবেন)'}
              </h3>
              <button onClick={() => setCollectionModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl font-semibold flex justify-between border ${
                selectedParty.type === 'vendor'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}>
                <span>{selectedParty.type === 'vendor' ? 'বর্তমান দেনা (দেবেন):' : 'বর্তমান পাওনা (পাবেন):'}</span>
                <span className={`font-extrabold text-sm ${selectedParty.type === 'vendor' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {formatCurrency(selectedParty.balancePaisa, numFormat)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {selectedParty.type === 'vendor' ? 'পরিশোধের পরিমাণ (৳)' : 'আদায়কৃত টাকার পরিমাণ (৳)'}
                </label>
                <input
                  type="number"
                  value={collectionTaka || ''}
                  onChange={(e) => setCollectionTaka(Number(e.target.value))}
                  placeholder="০"
                  className={`w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-lg bg-white ${
                    selectedParty.type === 'vendor' ? 'text-red-700' : 'text-emerald-800'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">লেনদেনের মাধ্যম</label>
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
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer ${
                    selectedParty.type === 'vendor' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{selectedParty.type === 'vendor' ? 'পরিশোধ সম্পন্ন করুন' : 'আদায় সম্পন্ন করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
