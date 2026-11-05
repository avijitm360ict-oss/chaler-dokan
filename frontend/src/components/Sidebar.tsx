import React from 'react';
import { Language, UserRole } from '../types';
import { translations } from '../i18n/translations';
import { toBengaliDigits } from '../utils/formatters';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Truck,
  TrendingUp,
  Warehouse,
  Users,
  Wallet,
  HandCoins,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  History,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lang: Language;
  userRole?: UserRole;
  warehousesCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
  minRole?: 'cashier' | 'manager' | 'owner';
  adminOnly?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  lang,
  userRole = 'owner',
  warehousesCount = 1,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const t = translations[lang];

  // Grouped Navigation Items matching Design Brief Section 4.1
  const navSections: NavSection[] = [
    {
      group: lang === 'bn' ? 'বিক্রি ও কাউন্টার' : 'Sales & Counter',
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'pos', label: t.quickPos, icon: ShoppingCart, highlight: true },
        { id: 'sales-list', label: t.sales, icon: Receipt },
        { id: 'returns', label: t.returns, icon: RotateCcw, badge: 'নতুন' },
      ]
    },
    {
      group: lang === 'bn' ? 'ক্রয় ও চালের স্টক' : 'Purchase & Stock',
      items: [
        { id: 'daily-rates', label: t.dailyRates, icon: TrendingUp, badge: 'দর' },
        { id: 'purchases', label: t.purchases, icon: Truck, minRole: 'manager' },
        { id: 'inventory', label: t.inventory, icon: Warehouse },
      ]
    },
    {
      group: lang === 'bn' ? 'পার্টি ও বাকি হিসাব' : 'Parties & Dues',
      items: [
        { id: 'parties', label: t.parties, icon: Users },
        { id: 'due-collection', label: t.dueCollection, icon: HandCoins, badge: 'আদায়' },
      ]
    },
    {
      group: lang === 'bn' ? 'টাকা, খরচ ও রিপোর্ট' : 'Finance & Reports',
      items: [
        { id: 'cash-book', label: t.cashBook, icon: Wallet, minRole: 'manager' },
        { id: 'reports', label: t.reports, icon: BarChart3, minRole: 'manager' },
        { id: 'import', label: t.importExcel, icon: FileSpreadsheet, minRole: 'manager' },
      ]
    },
    {
      group: lang === 'bn' ? 'সিস্টেম ও অডিট' : 'System & Audit',
      items: [
        { id: 'settings', label: t.settings, icon: Settings, minRole: 'owner' },
        { id: 'audit-log', label: t.auditLog, icon: History, minRole: 'owner' },
        { id: 'super-admin', label: t.superAdmin, icon: ShieldAlert, adminOnly: true },
      ]
    }
  ];

  const renderNavList = (isMobile = false) => (
    <nav className="space-y-3.5">
      {navSections.map((sec, sIdx) => {
        const visibleItems = sec.items.filter((item) => {
          if (item.adminOnly && userRole !== 'superadmin') return false;
          if (userRole === 'cashier' && item.minRole) return false;
          if (userRole === 'manager' && item.minRole === 'owner') return false;
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={sIdx} className="space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 px-2.5">
              {sec.group}
            </div>
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/30'
                      : item.highlight
                      ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : item.highlight ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-900'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && !isActive && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-white border-r border-stroke-default h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-between p-3 shadow-xs overflow-y-auto">
        <div className="space-y-4">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span className="text-xs font-black text-emerald-900">
                {lang === 'bn' ? 'চালের দোকান SaaS' : 'Rice Shop SaaS'}
              </span>
            </div>
            <span className="text-[10px] bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded-md">v1.0</span>
          </div>

          {renderNavList(false)}
        </div>

        {/* Bottom Status Info */}
        <div className="pt-3 border-t border-stroke-default mt-2">
          <div className="p-2.5 bg-surface-page rounded-xl text-xs space-y-1.5 border border-stroke-default text-slate-700">
            <div className="flex justify-between font-bold text-ink-primary text-xs">
              <span>{lang === 'bn' ? 'গোডাউন সংযোগ' : 'Godowns'}</span>
              <span className="text-emerald-700 flex items-center gap-1 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                {warehousesCount ? `${toBengaliDigits(warehousesCount)}টি সক্রিয়` : '১টি সক্রিয়'}
              </span>
            </div>
            <div className="text-xs text-slate-600 font-semibold">
              {lang === 'bn' ? 'বেস ইউনিট: কেজি (KG)' : 'Base Unit: Kg'} • WAC রানিং
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer Sidebar */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-3.5 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
                    🌾
                  </div>
                  <span className="font-extrabold text-sm text-slate-900">চালের দোকান মেনু</span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavList(true)}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4">
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>গোডাউন:</span>
                  <span className="text-emerald-700">{warehousesCount ? `${toBengaliDigits(warehousesCount)}টি সক্রিয়` : '১টি সক্রিয়'}</span>
                </div>
                <div className="text-xs text-slate-500">বেস ইউনিট: কেজি • WAC হিসাব সক্রিয়</div>
              </div>
            </div>
          </div>
          <div className="flex-1 cursor-pointer" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};

