import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Users,
  MoreHorizontal,
  TrendingUp,
  Warehouse,
  Wallet,
  BarChart3,
  Settings,
  ShieldAlert,
  Receipt,
  X
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, lang }) => {
  const t = translations[lang];
  const [showMoreModal, setShowMoreModal] = useState(false);

  const primaryTabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'pos', label: t.quickPos, icon: ShoppingCart, special: true },
    { id: 'purchases', label: t.purchases, icon: Truck },
    { id: 'parties', label: t.parties, icon: Users },
  ];

  const moreItems = [
    { id: 'daily-rates', label: t.dailyRates, icon: TrendingUp },
    { id: 'due-collection', label: t.dueCollection, icon: Users },
    { id: 'sales-list', label: t.sales, icon: Receipt },
    { id: 'returns', label: t.returns, icon: Receipt },
    { id: 'inventory', label: t.inventory, icon: Warehouse },
    { id: 'cash-book', label: t.cashBook, icon: Wallet },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'import', label: t.importExcel, icon: Warehouse },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'audit-log', label: t.auditLog, icon: Settings },
    { id: 'super-admin', label: t.superAdmin, icon: ShieldAlert },
  ];

  const handleSelectMoreItem = (id: string) => {
    onSelectTab(id);
    setShowMoreModal(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stroke-default px-2 py-1 shadow-sheet flex items-center justify-around">
        {primaryTabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors touch-target ${
                tab.special
                  ? 'text-[#1F7A4D] font-extrabold'
                  : isActive
                  ? 'text-[#1F7A4D] font-extrabold'
                  : 'text-ink-secondary'
              }`}
            >
              <div className={`p-1 rounded-xl ${tab.special ? 'bg-[#E8F4EC]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{tab.label}</span>
            </button>
          );
        })}

        {/* Center/Right primary tabs */}
        {primaryTabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors touch-target ${
                isActive ? 'text-[#1F7A4D] font-extrabold' : 'text-ink-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 leading-none">{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setShowMoreModal(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-ink-secondary hover:text-ink-primary touch-target ${
            moreItems.some((item) => item.id === activeTab) ? 'text-[#1F7A4D] font-extrabold' : ''
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">{lang === 'bn' ? 'আরও' : 'More'}</span>
        </button>
      </div>

      {/* More Options Modal for Mobile */}
      {showMoreModal && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 max-h-[82vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-[#1A1A17] text-base">
                {lang === 'bn' ? 'অন্যান্য মেনু ও মডিউল' : 'All Modules & Settings'}
              </h3>
              <button
                onClick={() => setShowMoreModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMoreItem(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition touch-target ${
                      isActive
                        ? 'border-[#1F7A4D] bg-[#E8F4EC] text-[#1F7A4D] font-bold'
                        : 'border-stroke-default bg-surface-page text-ink-primary hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[#1F7A4D] shrink-0" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

