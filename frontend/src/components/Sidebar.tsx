import React from 'react';
import { Language, UserRole } from '../types';
import { translations } from '../i18n/translations';
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
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lang: Language;
  userRole?: UserRole;
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, lang, userRole = 'owner' }) => {
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

  return (
    <aside className="w-60 bg-white border-r border-stroke-default h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col justify-between p-3 shadow-xs overflow-y-auto">
      <div className="space-y-4">
        
        {/* Fast Action Banner */}
        <div className="px-3 py-2 rounded-xl bg-linear-to-r from-[#1F7A4D]/10 via-[#1F7A4D]/5 to-[#E0A526]/10 border border-[#1F7A4D]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1F7A4D] animate-pulse" />
            <span className="text-xs font-black text-[#16603B]">
              {lang === 'bn' ? 'চালের দোকান SaaS' : 'Rice Shop SaaS'}
            </span>
          </div>
          <span className="text-[10px] bg-[#1F7A4D] text-white font-extrabold px-1.5 py-0.5 rounded-md">v1.0</span>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-3.5">
          {navSections.map((sec, sIdx) => {
            // Filter items based on userRole
            const visibleItems = sec.items.filter((item) => {
              if (item.adminOnly && userRole !== 'superadmin') return false;
              if (userRole === 'cashier' && item.minRole) return false;
              if (userRole === 'manager' && item.minRole === 'owner') return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-ink-disabled px-2.5">
                  {sec.group}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                        isActive
                          ? 'bg-[#1F7A4D] text-white shadow-sm shadow-[#1F7A4D]/30'
                          : item.highlight
                          ? 'text-[#1F7A4D] bg-[#E8F4EC] hover:bg-[#D1EAD9]'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : item.highlight ? 'text-[#1F7A4D]' : 'text-slate-400 group-hover:text-ink-primary'
                        }`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && !isActive && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FFF4DC] text-[#8A5A00] border border-[#E0A526]/40">
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
      </div>

      {/* Bottom Status Info */}
      <div className="pt-3 border-t border-stroke-default mt-2">
        <div className="p-2.5 bg-surface-page rounded-xl text-xs space-y-1 border border-stroke-default text-ink-secondary">
          <div className="flex justify-between font-bold text-ink-primary text-[11px]">
            <span>{lang === 'bn' ? 'গোডাউন সংযোগ' : 'Godowns'}</span>
            <span className="text-[#1F7A4D] flex items-center gap-1 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A4D] animate-ping" />
              ৩টি সক্রিয়
            </span>
          </div>
          <div className="text-[10px] text-ink-disabled">
            {lang === 'bn' ? 'বেস ইউনিট: কেজি (KG)' : 'Base Unit: Kg'} • WAC রানিং
          </div>
        </div>
      </div>
    </aside>
  );
};

