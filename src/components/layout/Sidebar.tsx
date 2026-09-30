import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  Calendar,
  FileText,
  Sparkles,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wallet,
  CalendarClock,
  GraduationCap,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'wallets'
  | 'campus'
  | 'splitbill'
  | 'pricesaver'
  | 'recurring'
  | 'budget'
  | 'goals'
  | 'calendar'
  | 'reports'
  | 'insights'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { settings, safeDailySpend, healthScore, accounts, recurringReminders, campusBills, splitBills } = useFinance();

  const urgentBillsCount = recurringReminders.filter(
    (r) =>
      r.recurring.type === 'expense' &&
      !r.isPaidThisMonth &&
      (r.status === 'due_today' || r.status === 'upcoming' || r.status === 'overdue')
  ).length;

  const unpaidCampusBills = campusBills.filter((b) => !b.isPaid).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'wallets', label: 'Dompet & Rekening', icon: Wallet, badge: `${accounts.length}` },
    {
      id: 'campus',
      label: 'Keuangan Kampus',
      icon: GraduationCap,
      badge: unpaidCampusBills > 0 ? `${unpaidCampusBills}` : undefined,
      badgeAlert: unpaidCampusBills > 0,
    },
    {
      id: 'splitbill',
      label: 'Split Bill & QR',
      icon: Users,
      badge: splitBills.length > 0 ? `${splitBills.length}` : undefined,
    },
    { id: 'pricesaver', label: 'Katalog Hemat', icon: ShoppingBag },
    {
      id: 'recurring',
      label: 'Tagihan & Rutin',
      icon: CalendarClock,
      badge: urgentBillsCount > 0 ? `${urgentBillsCount}` : undefined,
      badgeAlert: urgentBillsCount > 0,
    },
    { id: 'budget', label: 'Anggaran', icon: PieChart },
    { id: 'goals', label: 'Target Tabungan', icon: Target },
    { id: 'calendar', label: 'Kalender Keuangan', icon: Calendar },
    { id: 'reports', label: 'Laporan Bulanan', icon: FileText },
    { id: 'insights', label: 'Wawasan & AI', icon: Sparkles, badge: `${healthScore.overallScore}` },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white min-h-[calc(100vh-4rem)]">
      {/* Student user banner */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
            {settings.userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-neutral-900 truncate">
              {settings.userName || 'Mahasiswa'}
            </h4>
            <p className="text-xs text-neutral-500 truncate">
              {settings.university || 'Perguruan Tinggi'}
            </p>
          </div>
        </div>

        {/* Safe Daily Spend mini card */}
        <div className="mt-3 p-2.5 bg-white rounded-lg border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span title={`Dihitung hingga kiriman ortu/gaji tgl ${safeDailySpend.paydayOrAllowanceDay}`}>
              Batas Harian Aman
            </span>
            <span className="font-semibold text-emerald-700 tabular-nums">
              {formatIDR(safeDailySpend.safeDaily)}/hari
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
            <span title={`Kiriman ortu/gaji berikutnya: tgl ${safeDailySpend.paydayOrAllowanceDay}`}>
              Sisa {safeDailySpend.remainingDays} hari (s/d tgl {safeDailySpend.paydayOrAllowanceDay})
            </span>
            <span>Skor: {healthScore.overallScore}/100</span>
          </div>
        </div>
      </div>

      {/* Nav items list */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                    item.badgeAlert
                      ? 'bg-amber-500 text-white font-bold'
                      : isActive
                      ? 'bg-neutral-800 text-emerald-400'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom helper card */}
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-950 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Prinsip Mahasiswa</p>
            <p className="text-emerald-700 mt-0.5">
              Sisihkan tabungan di awal bulan, bukan menyisakan sisa belanja di akhir bulan.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
