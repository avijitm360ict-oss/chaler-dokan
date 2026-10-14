import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  TrendingUp,
  Warehouse,
  Users,
  Wallet,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, lang }) => {
  const t = translations[lang];

  const mainNavItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'pos', label: t.quickPos, icon: ShoppingCart, highlight: true },
    { id: 'daily-rates', label: t.dailyRates, icon: TrendingUp, badge: 'দর' },
    { id: 'sales-list', label: t.sales, icon: Receipt },
    { id: 'purchases', label: t.purchases, icon: Truck },
    { id: 'inventory', label: t.inventory, icon: Warehouse },
    { id: 'parties', label: t.parties, icon: Users },
    { id: 'cash-book', label: t.cashBook, icon: Wallet },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'super-admin', label: t.superAdmin, icon: ShieldAlert, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-between p-3.5 shadow-xs">
      <div className="space-y-1">
        
        {/* Fast Action Banner */}
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-amber-500/10 border border-emerald-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-emerald-900">
              {lang === 'bn' ? 'দ্রুত চালের হিসাব' : 'Fast Rice Billing'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-md">V1.0</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                    : item.highlight
                    ? 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && !isActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <ChevronRight className="w-4 h-4 text-emerald-200" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Shop Helper info */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-500">
        <div className="flex justify-between font-semibold text-slate-700">
          <span>{lang === 'bn' ? 'আজকের অবস্থা' : 'Day Status'}</span>
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            {lang === 'bn' ? 'চালু' : 'Active'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {lang === 'bn' ? 'বেস ইউনিট: কেজি (KG)' : 'Base Unit: Kg'} • WAC Active
        </div>
      </div>
    </aside>
  );
};
