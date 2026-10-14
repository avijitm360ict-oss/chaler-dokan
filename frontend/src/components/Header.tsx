import React from 'react';
import { Language, NumberFormat, TenantInfo } from '../types';
import { translations } from '../i18n/translations';
import { Store, Languages, Hash, ShieldCheck, Clock, UserCheck, Menu } from 'lucide-react';

interface HeaderProps {
  tenant: TenantInfo;
  lang: Language;
  onToggleLang: () => void;
  numFormat: NumberFormat;
  onToggleNumFormat: () => void;
  onOpenMobileMenu?: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  lang,
  onToggleLang,
  numFormat,
  onToggleNumFormat,
  onOpenMobileMenu,
  activeTab,
  onSelectTab
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand & Shop Info */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div 
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 via-paddy-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                  {lang === 'bn' ? tenant.shopNameBn : tenant.shopNameEn}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {tenant.planName}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate max-w-xs">
                {tenant.address}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Quick POS Direct Button */}
          <button
            onClick={() => onSelectTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-1'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-md'
            }`}
          >
            <span className="text-base">⚡</span>
            <span className="font-bold">{t.quickPos}</span>
          </button>

          {/* Trial Status Badge */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.trialMessage}</span>
          </div>

          {/* Number Format Toggle (১২৩৪ বনাম 1234) */}
          <button
            onClick={onToggleNumFormat}
            title={numFormat === 'bn' ? 'Switch to English digits (1234)' : 'বাংলা অঙ্কে দেখুন (১২৩৪)'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition"
          >
            <Hash className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{numFormat === 'bn' ? 'অঙ্ক: ১২৩' : 'Digit: 123'}</span>
            <span className="sm:hidden">{numFormat === 'bn' ? '১২৩' : '123'}</span>
          </button>

          {/* Language Toggle (বাং | EN) */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition"
            title="ভাষা পরিবর্তন করুন"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* User Avatar */}
          <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
              রা
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">রফিকুল ইসলাম</div>
              <div className="text-[10px] text-emerald-600 font-semibold">মালিক (Owner)</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
