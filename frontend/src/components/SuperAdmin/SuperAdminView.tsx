import React, { useState } from 'react';
import { Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { ShieldAlert, Users, Store, CheckCircle, XCircle, Clock, Eye, Sparkles } from 'lucide-react';

interface SuperAdminViewProps {
  lang: Language;
  numFormat: NumberFormat;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ lang, numFormat }) => {
  const [tenants, setTenants] = useState([
    {
      id: 't-1',
      name: 'মেসার্স বিসমিল্লাহ চাউল আড়ত ও স্টোর',
      owner: 'হাজী মো: রফিকুল ইসলাম',
      phone: '01712-345678',
      location: 'বাবুবাজার, ঢাকা',
      plan: 'Pro Plan (প্রো)',
      status: 'active',
      trialDays: 14,
      usersCount: 4,
      monthlySalesCount: 840
    },
    {
      id: 't-2',
      name: 'দিনাজপুর অটো রাইস এজেন্সি',
      owner: 'আব্দুস সামাদ',
      phone: '01819-887766',
      location: 'বাহাদুর বাজার, দিনাজপুর',
      plan: 'Basic Plan (বেসিক)',
      status: 'trial',
      trialDays: 5,
      usersCount: 2,
      monthlySalesCount: 310
    },
    {
      id: 't-3',
      name: 'কুষ্টিয়া গোল্ডেন চাউল ভান্ডার',
      owner: 'আলহাজ্ব মোকাররম হোসেন',
      phone: '01911-334455',
      location: 'মজুপুর, কুষ্টিয়া',
      plan: 'Pro Plan (প্রো)',
      status: 'active',
      trialDays: 30,
      usersCount: 5,
      monthlySalesCount: 1420
    }
  ]);

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' } : t))
    );
  };

  const extendTrial = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, trialDays: t.trialDays + 14 } : t))
    );
    alert('ট্রায়াল মেয়াদ আরও ১৪ দিন বাড়ানো হয়েছে!');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Super Admin Top Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">সুপার এডমিন কন্ট্রোল সেন্টার</h2>
              <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                PLATFORM OWNER
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              সকল চালের দোকান (Tenants) পরিচালনা, সাবস্ক্রিপশন প্ল্যান ও অডিট লগ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="text-right">
            <span className="text-slate-400 block">মোট দোকান (Tenants):</span>
            <span className="text-lg font-black text-white">{tenants.length} টি</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">সক্রিয় দোকান:</span>
            <span className="text-lg font-black text-emerald-400">
              {tenants.filter((t) => t.status === 'active').length} টি
            </span>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">
            নিবন্ধিত চালের দোকান ও লাইসেন্স তালিকা
          </h3>
          <span className="text-xs text-slate-500">PRD সেকশন ৫.১২ অনুযায়ী</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                <th className="py-3 px-4">দোকানের নাম ও ঠিকানা</th>
                <th className="py-3 px-3">মালিকের নাম ও ফোন</th>
                <th className="py-3 px-3">বর্তমান প্ল্যান</th>
                <th className="py-3 px-3">অবস্থা</th>
                <th className="py-3 px-3">ট্রায়াল বাকি</th>
                <th className="py-3 px-3">ইউজার / মাসিক সেল</th>
                <th className="py-3 px-4 text-right">ম্যানেজমেন্ট অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.location}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{t.owner}</div>
                    <div className="text-slate-500 text-[11px]">{t.phone}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-800">{t.plan}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t.status === 'active' ? 'সক্রিয় (Active)' : 'বন্ধ (Suspended)'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700">{t.trialDays} দিন</td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{t.usersCount} জন ইউজার</div>
                    <div className="text-[10px] text-slate-400">{t.monthlySalesCount} টি সেল/মাস</div>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => extendTrial(t.id)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition"
                    >
                      +১৪ দিন
                    </button>
                    <button
                      onClick={() => toggleStatus(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        t.status === 'active'
                          ? 'bg-red-50 hover:bg-red-100 text-red-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {t.status === 'active' ? 'স্থগিত' : 'চালু'}
                    </button>
                    <button
                      onClick={() => alert(`ইমপার্সনেশন মোড চালু হচ্ছে: ${t.name} (Read-only security log)`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                      title="Impersonate shop for support"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      লগইন
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
