import React, { useState } from 'react';
import { TenantInfo, Language, NumberFormat } from '../../types';
import { translations } from '../../i18n/translations';
import { Settings, Store, Printer, Shield, Save, CheckCircle2, Users, Download } from 'lucide-react';
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

    </div>
  );
};
