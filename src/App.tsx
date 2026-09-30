import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetView } from './views/BudgetView';
import { SavingGoalsView } from './views/SavingGoalsView';
import { CalendarView } from './views/CalendarView';
import { ReportsView } from './views/ReportsView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { WalletsView } from './views/WalletsView';
import { RecurringView } from './views/RecurringView';
import { CampusFinanceView } from './views/CampusFinanceView';
import { SplitBillView } from './views/SplitBillView';
import { PriceSaverView } from './views/PriceSaverView';
import { QuickAddModal } from './components/modals/QuickAddModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { MoreMenuModal } from './components/modals/MoreMenuModal';
import { GoalContributionModal } from './components/modals/GoalContributionModal';
import { SavingGoal, TransactionType } from './types/finance';
import { Plus, Info, RotateCcw } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('expense');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingGoal | null>(null);

  const { isOnline } = useFinance();

  const handleOpenQuickAdd = (type: TransactionType = 'expense') => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  const handleGoalContribute = (goal: SavingGoal) => {
    setContributeGoal(goal);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900">
      {/* Offline Status Bar when disconnected */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <span className="font-bold">⚡ Mode Offline Aktif:</span>
            <span>
              Perangkatmu sedang tidak terhubung internet. Kamu tetap bisa menambah transaksi dan mengelola keuangan; semua perubahan tersimpan aman di penyimpanan lokal (localStorage).
            </span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectTab={setCurrentTab}
              onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
              onContributeGoal={handleGoalContribute}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView onOpenQuickAdd={() => handleOpenQuickAdd('expense')} />
          )}

          {currentTab === 'wallets' && <WalletsView />}

          {currentTab === 'campus' && <CampusFinanceView />}

          {currentTab === 'splitbill' && <SplitBillView />}

          {currentTab === 'pricesaver' && <PriceSaverView />}

          {currentTab === 'recurring' && <RecurringView />}

          {currentTab === 'budget' && <BudgetView />}

          {currentTab === 'goals' && <SavingGoalsView />}

          {currentTab === 'calendar' && (
            <CalendarView onOpenQuickAdd={() => handleOpenQuickAdd('expense')} />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'insights' && <InsightsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => handleOpenQuickAdd('expense')}
        className="md:hidden fixed bottom-16 right-4 z-40 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
        aria-label="Catat Transaksi Baru"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Mobile Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
      />

      {/* Overlays & Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultType={quickAddType}
      />

      <OnboardingModal />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
      />

      <GoalContributionModal
        goal={contributeGoal}
        onClose={() => setContributeGoal(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
