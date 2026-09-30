import React from 'react';
import { NavTab } from './Sidebar';
import { LayoutDashboard, Receipt, PieChart, Target, Sparkles, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMoreMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, onOpenMoreMenu }) => {
  const primaryTabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'budget', label: 'Anggaran', icon: PieChart },
    { id: 'goals', label: 'Target', icon: Target },
    { id: 'insights', label: 'Wawasan', icon: Sparkles },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 px-2 py-1 flex items-center justify-around shadow-lg">
      {primaryTabs.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[54px] ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}

      {/* More button */}
      <button
        onClick={onOpenMoreMenu}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[54px] ${
          ['calendar', 'reports', 'settings', 'wallets', 'recurring', 'campus', 'splitbill', 'pricesaver'].includes(currentTab)
            ? 'text-emerald-700 font-semibold'
            : 'text-neutral-500 hover:text-neutral-800'
        }`}
      >
        <MoreHorizontal className="w-5 h-5 stroke-2" />
        <span className="text-[10px] mt-0.5">Lainnya</span>
      </button>
    </nav>
  );
};
