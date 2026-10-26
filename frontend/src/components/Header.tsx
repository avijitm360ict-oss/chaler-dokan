import React, { useState } from 'react';
import { Language, NumberFormat, TenantInfo, UserRole } from '../types';
import { translations } from '../i18n/translations';
import {
  Languages,
  Hash,
  ShieldCheck,
  WifiOff,
  Wifi,
  Keyboard,
  HelpCircle,
  Sparkles,
  ChevronDown,
  User,
  Menu,
  EyeOff,
  RotateCw,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  tenant: TenantInfo;
  lang: Language;
  onToggleLang: () => void;
  numFormat: NumberFormat;
  onToggleNumFormat: () => void;
  onOpenMobileMenu?: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenShortcuts: () => void;
  onOpenHelp: () => void;
  onOpenOnboarding: () => void;
  isImpersonating?: boolean;
  pendingSyncCount?: number;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  onLogout?: () => void;
  currentUser?: { name: string; phone?: string; role?: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  lang,
  onToggleLang,
  numFormat,
  onToggleNumFormat,
  onOpenMobileMenu,
  activeTab,
  onSelectTab,
  userRole,
  onSelectRole,
  isOffline,
  onToggleOffline,
  onOpenShortcuts,
  onOpenHelp,
  onOpenOnboarding,
  isImpersonating = false,
  pendingSyncCount = 0,
  onTriggerSync,
  isSyncing = false,
  onLogout,
  currentUser,
}) => {
  const t = translations[lang];
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roleNames: Record<UserRole, { bn: string; en: string }> = {
    owner: { bn: 'মালিক (Owner)', en: 'Owner' },
    manager: { bn: 'ম্যানেজার (Manager)', en: 'Manager' },
    cashier: { bn: 'ক্যাশিয়ার (Cashier)', en: 'Cashier' },
    superadmin: { bn: 'সুপার এডমিন (Super Admin)', en: 'Super Admin' },
  };

  return (
    <>
      {/* Impersonation Permanent Banner (Section 4.14) */}
      {isImpersonating && (
        <div className="bg-[#B3261E] text-white px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 z-50">
          <EyeOff className="w-4 h-4" />
          <span>
            {lang === 'bn'
              ? `আপনি "${tenant.shopNameBn}" দেখছেন (শুধু পড়া - Read Only)`
              : `Viewing "${tenant.shopNameEn}" (Impersonation Mode - Read Only)`}
          </span>
        </div>
      )}

      {/* Main Sticky App Bar */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur border-b border-stroke-default shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Brand & Shop Info */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-ink-secondary hover:text-ink-primary hover:bg-slate-100 rounded-lg touch-target"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#1F7A4D] via-[#16603B] to-[#E0A526] flex items-center justify-center text-white shadow-md shadow-[#1F7A4D]/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">🌾</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg text-ink-primary tracking-tight leading-tight">
                    {lang === 'bn' ? tenant.shopNameBn : tenant.shopNameEn}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {tenant.planName}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary hidden sm:block truncate max-w-xs">
                  {tenant.address}
                </p>
              </div>
            </div>
          </div>

          {/* Action Controls & Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick POS Direct Button */}
            <button
              onClick={() => onSelectTab('pos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs touch-target ${
                activeTab === 'pos'
                  ? 'bg-[#1F7A4D] text-white ring-2 ring-[#1F7A4D] ring-offset-1'
                  : 'bg-[#1F7A4D] hover:bg-[#16603B] text-white hover:shadow-md'
              }`}
            >
              <span className="text-sm">⚡</span>
              <span>{t.quickPos}</span>
            </button>

            {/* Offline Simulator Button (Section 4.1 & 7.1) */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? 'অনলাইনে ফিরুন' : 'অফলাইন মোড পরীক্ষা করুন'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                isOffline
                  ? 'bg-[#FFF4DC] border-[#E0A526] text-[#8A5A00] animate-pulse'
                  : 'bg-white border-stroke-default text-ink-secondary hover:bg-slate-50'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 text-[#1F7A4D]" />}
              <span className="hidden lg:inline">{isOffline ? 'অফলাইন মোড' : 'অনলাইন'}</span>
            </button>

            {/* Pending Sync Trigger Button */}
            {pendingSyncCount > 0 && (
              <button
                onClick={onTriggerSync}
                disabled={isSyncing}
                title="অপেক্ষমাণ অফলাইন বিক্রয় ক্লাউডে সিঙ্ক করুন"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition animate-bounce cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{pendingSyncCount}টি সিঙ্ক অপেক্ষমাণ</span>
              </button>
            )}

            {/* Setup / Onboarding Button */}
            <button
              onClick={onOpenOnboarding}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF4DC] border border-[#E0A526]/50 text-[#8A5A00] text-xs font-bold hover:bg-[#FEE8B9] transition"
              title="শুরুর গাইড ও প্রাথমিক চালের স্টক লোড"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E0A526]" />
              <span>{lang === 'bn' ? 'শুরুর গাইড' : 'Setup Guide'}</span>
            </button>

            {/* Keyboard Shortcuts Trigger (?) */}
            <button
              onClick={onOpenShortcuts}
              title="কীবোর্ড শর্টকাট তালিকা (?)"
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl border border-stroke-default text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Help Button (especially in POS where floating button is hidden per Section 4.1) */}
            <button
              onClick={onOpenHelp}
              title="সাহায্য চাই (WhatsApp)"
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-stroke-default text-ink-secondary hover:text-ink-primary hover:bg-slate-100 transition"
            >
              <HelpCircle className="w-4 h-4 text-[#1F7A4D]" />
            </button>

            {/* Number Format Toggle (১২৩৪ বনাম 1234) */}
            <button
              onClick={onToggleNumFormat}
              title={numFormat === 'bn' ? 'English digits (1234)' : 'বাংলা অঙ্ক (১২৩৪)'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stroke-default text-ink-secondary hover:bg-slate-100 text-xs font-semibold transition"
            >
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span>{numFormat === 'bn' ? '১২৩' : '123'}</span>
            </button>

            {/* Language Toggle (বাং | EN) per Section 2.10 */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink-primary text-xs font-bold border border-slate-300 transition"
              title="ভাষা পরিবর্তন করুন"
            >
              <Languages className="w-3.5 h-3.5 text-[#1F7A4D]" />
              <span>{lang === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            {/* Role Switcher Menu (Section 1.1: Owner, Manager, Cashier, SuperAdmin) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-stroke-default transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#E8F4EC] border border-[#1F7A4D]/30 flex items-center justify-center text-[#1F7A4D] font-bold text-xs">
                  {userRole === 'owner' ? 'মা' : userRole === 'manager' ? 'ম্যা' : userRole === 'cashier' ? 'ক্যা' : 'এড'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-[11px] font-extrabold text-ink-primary leading-tight">
                    {lang === 'bn' ? roleNames[userRole].bn : roleNames[userRole].en}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-sheet border border-stroke-default p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-bold text-ink-secondary px-2.5 py-1 uppercase tracking-wider">
                    {lang === 'bn' ? 'ব্যবহারকারী রোল পরিবর্তন' : 'Switch Role View'}
                  </div>
                  {(['owner', 'manager', 'cashier', 'superadmin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onSelectRole(r);
                        if (r === 'superadmin') onSelectTab('super-admin');
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        userRole === r
                          ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                          : 'text-ink-primary hover:bg-slate-100'
                      }`}
                    >
                      <span>{lang === 'bn' ? roleNames[r].bn : roleNames[r].en}</span>
                      {userRole === r && <span className="w-2 h-2 rounded-full bg-[#1F7A4D]" />}
                    </button>
                  ))}

                  {/* Log Out Option */}
                  {onLogout && (
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>{lang === 'bn' ? 'লগআউট করুন' : 'Log Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Yellow Offline Banner per Section 4.1 & 7.1 */}
      {isOffline && (
        <div className="bg-[#FFF4DC] border-b border-[#E0A526] px-4 py-2 text-xs font-bold text-[#8A5A00] flex items-center justify-center gap-2 shadow-xs transition">
          <WifiOff className="w-4 h-4 text-[#8A5A00]" />
          <span>{lang === 'bn' ? t.offlineBanner : 'Offline Mode: No Internet. Sales saved safely in drafts.'}</span>
        </div>
      )}
    </>
  );
};

