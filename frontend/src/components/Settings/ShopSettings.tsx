import React, { useState } from 'react';
import { TenantInfo, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { Settings, Store, Printer, Shield, Save, CheckCircle2, Users, Download, CreditCard, Sparkles, Check, Smartphone, X } from 'lucide-react';
import { UsersAndRolesModal } from './UsersAndRolesModal';
import { api } from '../../api/client';

interface ShopSettingsProps {
  tenant: TenantInfo;
  lang: Language;
  numFormat: NumberFormat;
  onUpdateTenant: (tenant: TenantInfo) => void;
}

export const ShopSettings: React.FC<ShopSettingsProps> = ({
  tenant,
  lang,
  numFormat,
  onUpdateTenant
}) => {
  const [shopNameBn, setShopNameBn] = useState(tenant.shopNameBn);
  const [shopNameEn, setShopNameEn] = useState(tenant.shopNameEn);
  const [proprietor, setProprietor] = useState(tenant.proprietor);
  const [phone, setPhone] = useState(tenant.phone);
  const [address, setAddress] = useState(tenant.address);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [defaultPrintSize, setDefaultPrintSize] = useState('thermal80');
  const [footerNote, setFooterNote] = useState('আমাদের পণ্য ব্যবহারের জন্য আন্তরিক ধন্যবাদ। আবার আসবেন।');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Subscription Upgrade Modal State (BUG-13)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const planNames = {
      basic: 'বেসিক প্ল্যান (Basic - ৳৭৫০/মাস)',
      pro: 'স্ট্যান্ডার্ড প্রো (Standard Pro - ৳১,৫০০/মাস)',
      enterprise: 'এন্টারপ্রাইজ আড়তদার (Enterprise - ৳৩,০০০/মাস)',
    };
    const chosenPlanName = planNames[selectedPlan];

    try {
      setIsUpgrading(true);
      await api.tenant.upgradeSubscription({
        planName: chosenPlanName,
        paymentMethod,
        trxId: trxId.trim(),
      });

      const updatedTenant: TenantInfo = {
        ...tenant,
        planName: chosenPlanName,
        status: 'active',
        trialDaysLeft: 30,
      };

      onUpdateTenant(updatedTenant);
      localStorage.setItem('chal_tenant_info', JSON.stringify(updatedTenant));
      setShowUpgradeModal(false);
      setTrxId('');
      alert(`অভিনন্দন! আপনার সাবস্ক্রিপশন সফলভাবে "${chosenPlanName}"-এ উন্নীত করা হয়েছে।`);
    } catch (err: any) {
      alert('আপগ্রেড ব্যর্থ হয়েছে: ' + (err?.message || 'সমস্যা হয়েছে'));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setIsBackingUp(true);
      const res: any = await api.tenant.getBackup();
      const backupData = res?.data || res;
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chal_a_dokan_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('দোকানের সমস্ত ডাটা সফলভাবে ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে!');
    } catch (err: any) {
      alert('ব্যাকআপ ডাউনলোডে ত্রুটি: ' + (err?.message || 'সমস্যা হয়েছে'));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...tenant,
      shopNameBn,
      shopNameEn,
      proprietor,
      phone,
      address
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 max-w-4xl">
      
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>দোকান ও ইনভয়েস সেটিংস</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকানের মেমো তথ্য, প্রিন্টার কনফিগারেশন ও সফটওয়্যার নিরাপত্তা রুলস
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={isBackingUp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isBackingUp ? 'ব্যাকআপ হচ্ছে...' : 'ডাটা ব্যাকআপ'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUsersModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>ব্যবহারকারী ও পারমিশন</span>
          </button>

          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              সেটিংস সেভ হয়েছে
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 font-extrabold text-slate-900 text-sm">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>দোকানের বিবরণ ও মেমো হেডার</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">দোকানের নাম (বাংলা)</label>
              <input
                type="text"
                value={shopNameBn}
                onChange={(e) => setShopNameBn(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">দোকানের নাম (English)</label>
              <input
                type="text"
                value={shopNameEn}
                onChange={(e) => setShopNameEn(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">প্রোপ্রাইটর / মালিকের নাম</label>
              <input
                type="text"
                value={proprietor}
                onChange={(e) => setProprietor(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর (মেমোতে যাবে)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">দোকানের পূর্ণ ঠিকানা</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Printer Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 font-extrabold text-slate-900 text-sm">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>প্রিন্ট ও ইনভয়েস ফরম্যাট</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ডিফল্ট প্রিন্টার সাইজ</label>
              <select
                value={defaultPrintSize}
                onChange={(e) => setDefaultPrintSize(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="thermal80">৮০ মিমি থার্মাল পিওএস (80mm Thermal POS - প্রস্তাবিত)</option>
                <option value="thermal58">৫৮ মিমি ছোট থার্মাল পিওএস (58mm Thermal)</option>
                <option value="a4">A4 সম্পূর্ণ ট্যাক্স ইনভয়েস (ফুল পেজ)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ইনভয়েস ফুটার নোট</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
              />
            </div>
          </div>
        </div>

        {/* Business Rules (Negative stock, Credit limit) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 font-extrabold text-slate-900 text-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>ব্যবসায়িক নিয়ম ও নীতিমালা (PRD সেকশন ১০)</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-xl hover:bg-slate-50">
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-800 block">নেগেটিভ স্টক অনুমোদন করুন</span>
                <span className="text-[11px] text-slate-500">
                  চাল স্টকে না থাকলেও বিক্রি রেকর্ড করার অনুমতি (অনেকে মাল বেচে পরে রাতে এন্ট্রি দেন)।
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SaaS Subscription & License Plan Section (BUG-13) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>সাবস্ক্রিপশন ও লাইসেন্স প্ল্যান (SaaS Billing)</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {tenant.status === 'active' ? 'সক্রিয় লাইসেন্স (Active)' : 'ফ্রি ট্রায়াল (Trial)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">বর্তমান প্যাকেজ:</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {tenant.planName || 'ট্রায়াল প্ল্যান (৩০ দিনের ফ্রি ট্রায়াল)'}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                বাকি মেয়াদ: {tenant.trialDaysLeft ?? 30} দিন
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-xl shadow-sm text-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>প্ল্যান আপগ্রেড / নবায়ন করুন</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>সেটিংস সেভ করুন</span>
          </button>
        </div>

      </form>

      {/* Users and Roles Modal */}
      <UsersAndRolesModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        lang={lang}
      />

      {/* Subscription Upgrade Modal (BUG-13) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-[#1A1A17]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-modal border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">প্ল্যান আপগ্রেড ও রিনিউ</h3>
                  <p className="text-[11px] text-slate-500">আপনার চালের ব্যবসার পরিধি অনুযায়ী প্যাকেজ নির্বাচন করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              {/* Plan Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                {[
                  { id: 'basic', name: 'বেসিক', price: '৳৭৫০/মাস', users: '১ ইউজার', wh: '১ গোডাউন' },
                  { id: 'pro', name: 'স্ট্যান্ডার্ড প্রো', price: '৳১,৫০০/মাস', users: '৩ ইউজার', wh: '২ গোডাউন', badge: 'জনপ্রিয়' },
                  { id: 'enterprise', name: 'এন্টারপ্রাইজ', price: '৳৩,০০০/মাস', users: 'আনলিমিটেড', wh: 'আনলিমিটেড' },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      selectedPlan === p.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                      <div className="font-black text-emerald-700 text-xs mt-0.5">{p.price}</div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                      <div>• {p.users}</div>
                      <div>• {p.wh}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">পেমেন্ট মেথড বাছাই করুন:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bkash', label: 'বিকাশ মার্চেন্ট', color: 'pink' },
                    { id: 'nagad', label: 'নগদ উদ্যোক্তা', color: 'orange' },
                    { id: 'bank', label: 'ব্যাংক ট্রান্সফার', color: 'blue' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details & TrxID Input */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800">পেমেন্ট নির্দেশনা:</span> আমাদের মার্চেন্ট একাউন্টে ফি পাঠিয়ে নিচে Transaction ID দিন।
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ট্রানজেকশন আইডি (TrxID) / রেফারেন্স নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="যেমন: BL10293847"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-xs text-slate-600 bg-white hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUpgrading}
                  className="px-5 py-2.5 bg-[#1F7A4D] hover:bg-[#185E3B] text-white rounded-xl font-extrabold text-xs shadow-md transition"
                >
                  {isUpgrading ? 'সক্রিয় হচ্ছে...' : 'পেমেন্ট সম্পন্ন ও প্ল্যান সক্রিয় করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
