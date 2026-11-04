import React, { useState } from 'react';
import { Party, Language, NumberFormat } from '../../types';
import { formatCurrency, toBengaliDigits } from '../../utils/formatters';
import { DueCollectionModal } from './DueCollectionModal';
import { 
  Wallet, 
  HandCoins, 
  Search, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  ArrowDownLeft, 
  AlertCircle,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { api } from '../../api/client';

interface DueCollectionViewProps {
  parties: Party[];
  lang: Language;
  numFormat: NumberFormat;
  onCollectDue: (partyId: string, amountPaisa: number, method?: string, note?: string) => void;
}

export const DueCollectionView: React.FC<DueCollectionViewProps> = ({
  parties,
  lang,
  numFormat,
  onCollectDue
}) => {
  // Only filter clients / customers (Customers owe us money)
  const clients = parties.filter((p) => (p.type === 'client' || p.type === 'both') && p.balancePaisa > 0);
  const allClients = parties.filter((p) => p.type === 'client' || p.type === 'both');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState<string | null>(null);

  // Total Receivable from Customers
  const totalDuePaisa = clients.reduce((sum, c) => sum + (c.balancePaisa || 0), 0);
  const overduePaisa = Math.round(totalDuePaisa * 0.35); // 30+ days overdue estimate

  // Filtered list by search
  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.shopName && c.shopName.toLowerCase().includes(q)) ||
      c.phone.includes(q)
    );
  });

  const handleOpenCollection = (partyId?: string) => {
    setSelectedPartyId(partyId || (clients[0]?.id || allClients[0]?.id));
    setIsModalOpen(true);
  };

  const handleSendDueSms = async (party: Party) => {
    try {
      setIsSendingSms(party.id);
      const res: any = await api.parties.sendSms(party.id);
      alert(res?.message || `${party.name}-কে বকেয়া তাগাদা SMS পাঠানো হয়েছে!`);
    } catch (err: any) {
      alert('SMS পাঠাতে সমস্যা হয়েছে: ' + (err?.message || 'সমস্যা'));
    } finally {
      setIsSendingSms(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Top Banner & Notice */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl shadow-xs">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{lang === 'bn' ? 'কাস্টমার বাকি আদায় কাউন্টার' : 'Customer Due Collection'}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ক্যাশ জমা (Cash In)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn' 
                ? 'খরিদ্দারদের বকেয়া বাকি দ্রুত আদায়, কিস্তি গ্রহণ ও ডিজিটাল মানি রসিদ তৈরি' 
                : 'Collect customer dues, record partial payments, and issue instant receipts.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenCollection()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>{lang === 'bn' ? '+ দ্রুত বাকি আদায় করুন' : '+ Collect Due Now'}</span>
        </button>
      </div>

      {/* Difference Clarification Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>বিশেষ নির্দেশনা:</strong> এই পেজটি শুধুমাত্র <strong>দোকানের খরিদ্দারদের (কাস্টমার)</strong> থেকে বকেয়া টাকা তোলার জন্য। মিল বা মোকামের মহাজনকে চালের কেনা বাবদ দেনা পরিশোধ করতে বাম পাশের মেনু থেকে <strong>"পার্টি ও খাতা &gt; মিল / মহাজন"</strong> অপশনে যান।
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
          <span className="text-xs font-bold text-emerald-950 block">মোট আদায়যোগ্য কাস্টমার বাকি</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(totalDuePaisa, numFormat)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {clients.length} জন কাস্টমারের কাছে পাওনা
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
          <span className="text-xs font-bold text-amber-950 block">তাগাদাযোগ্য বকেয়া (৩০+ দিন)</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(overduePaisa, numFormat)}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
            দ্রুত SMS তাগাদা দেওয়া প্রয়োজন
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 block">মোট নিবন্ধিত কাস্টমার</span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {numFormat === 'bn' ? toBengaliDigits(allClients.length) : allClients.length} জন
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            বাকি ছাড়া কাস্টমার: {allClients.length - clients.length} জন
          </span>
        </div>
      </div>

      {/* Due Customer Search & Fast Action List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="কাস্টমারের নাম, দোকান বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            বাকিদার কাস্টমার: {filteredClients.length} জন
          </span>
        </div>

        {/* Due Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">কাস্টমারের নাম ও দোকান</th>
                <th className="py-3 px-3">মোবাইল নম্বর ও ঠিকানা</th>
                <th className="py-3 px-3 text-right">মোট বাকি টাকা</th>
                <th className="py-3 px-3 text-center">বাকির স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                        🎉
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {searchTerm ? 'এই নামে কোনো বাকিদার কাস্টমার পাওয়া যায়নি' : 'বর্তমানে কোনো কাস্টমারের বকেয়া বাকি নেই!'}
                      </div>
                      <p className="text-xs text-slate-400">
                        সব কাস্টমারের হিসাব পরিশোধ রয়েছে অথবা নতুন বিক্রি এখনো বাকিতে করা হয়নি।
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const dueTaka = client.balancePaisa / 100;
                  const isHighDue = dueTaka > 10000;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="text-sm font-extrabold text-slate-900">
                          {client.name}
                        </div>
                        {client.shopName && (
                          <div className="text-[11px] font-medium text-slate-500">
                            দোকান: {client.shopName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {client.address || 'বাংলাদেশ'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="text-base font-black text-emerald-700">
                          {formatCurrency(client.balancePaisa, numFormat)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          লিমিট: {formatCurrency(client.creditLimitPaisa || 5000000, numFormat)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isHighDue 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {isHighDue ? 'জরুরি তাগাদা' : 'চলতি বাকি'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenCollection(client.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>আদায় করুন</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendDueSms(client)}
                            disabled={isSendingSms === client.id}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-98 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1"
                            title="বকেয়া তাগাদা SMS পাঠান"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isSendingSms === client.id ? '...' : 'SMS'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Step Due Collection Modal (M1) */}
      <DueCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parties={parties}
        selectedPartyId={selectedPartyId}
        lang={lang}
        numFormat={numFormat}
        onCollectDue={(partyId, amountPaisa, method, note) => {
          onCollectDue(partyId, amountPaisa, method, note);
        }}
      />

    </div>
  );
};
