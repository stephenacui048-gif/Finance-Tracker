import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  CheckCircle,
  HelpCircle,
  Plus,
  Flame,
  CalendarCheck,
  ChevronRight,
  Info,
  CalendarClock,
  ArrowLeftRight,
  Building2,
  Smartphone,
  CreditCard,
  BellRing,
  BarChart3,
  Target,
  Scale,
  Sparkles,
  Wifi,
  ShieldCheck,
  TrendingUp,
  Hourglass,
  GraduationCap,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { formatIDR, formatPercent, formatDateID } from '../utils/formatters';
import { NavTab } from '../components/layout/Sidebar';
import { SavingGoal } from '../types/finance';
import { TransferModal } from '../components/modals/TransferModal';
import { AndroidConnectModal } from '../components/modals/AndroidConnectModal';
import { InteractiveExpenseChart } from '../components/charts/InteractiveExpenseChart';
import { InteractiveBudgetChart } from '../components/charts/InteractiveBudgetChart';

interface DashboardViewProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
  onContributeGoal: (goal: SavingGoal) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTab,
  onOpenQuickAdd,
  onContributeGoal,
}) => {
  const {
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    budgetSummary,
    needsVsWants,
    safeDailySpend,
    todaySpent,
    savingGoals,
    transactions,
    gamification,
    activeMonth,
    accounts,
    recurringReminders,
    processRecurringEntry,
    settings,
    healthScore,
    studentRunway,
    campusBills,
  } = useFinance();

  const unpaidCampusBills = campusBills.filter((b) => !b.isPaid);

  const [activeChartTab, setActiveChartTab] = useState<'expense' | 'budget' | 'cashflow'>('expense');
  const [showSafeDailyInfo, setShowSafeDailyInfo] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Month transactions (recent 6)
  const monthTransactions = transactions
    .filter((t) => t.date.startsWith(activeMonth))
    .slice(0, 6);

  const isSpendingSafe = todaySpent <= safeDailySpend.safeDaily;

  // Urgent recurring bills
  const urgentBills = recurringReminders.filter(
    (r) =>
      r.recurring.type === 'expense' &&
      !r.isPaidThisMonth &&
      (r.status === 'due_today' || r.status === 'upcoming' || r.status === 'overdue')
  );

  // Color helper for wallet badges
  const getWalletBadgeStyle = (name: string, type: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('bca') || lowerName.includes('mandiri') || lowerName.includes('bni') || type === 'bank') {
      return {
        bg: 'bg-blue-50/80',
        border: 'border-blue-200',
        text: 'text-blue-700',
        indicator: 'bg-blue-600',
      };
    }
    if (lowerName.includes('gopay')) {
      return {
        bg: 'bg-teal-50/80',
        border: 'border-teal-200',
        text: 'text-teal-700',
        indicator: 'bg-teal-500',
      };
    }
    if (lowerName.includes('shopee') || lowerName.includes('spay')) {
      return {
        bg: 'bg-orange-50/80',
        border: 'border-orange-200',
        text: 'text-orange-700',
        indicator: 'bg-orange-500',
      };
    }
    if (lowerName.includes('dana')) {
      return {
        bg: 'bg-sky-50/80',
        border: 'border-sky-200',
        text: 'text-sky-700',
        indicator: 'bg-sky-500',
      };
    }
    return {
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      indicator: 'bg-emerald-600',
    };
  };

  // Radial calculation for health score
  const scoreRadius = 32;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreProgress = Math.min(100, Math.max(0, healthScore.overallScore));
  const scoreOffset = scoreCircumference - (scoreProgress / 100) * scoreCircumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 65) return '#0d9488'; // teal-600
    if (score >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // rose-500
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight">
              Halo, {settings.userName || 'Mahasiswa'}! 👋
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              {settings.university || 'Kampus Indonesia'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Ringkasan & visualisasi interaktif keuanganmu untuk bulan <strong className="text-neutral-800">{activeMonth}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Streak & Gamification badges */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-800 shadow-2xs">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>Streak {gamification.trackingStreak} Hari</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-800 shadow-2xs">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>{gamification.noSpendDaysThisMonth} Hari Hemat</span>
          </div>

          {/* Android Connect Button */}
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 transition-colors shadow-2xs"
            title="Buka & Pasang di HP Android"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buka di HP</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HERO SECTION: Student Smart Card + Health & Daily Spend */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Fintech Student Smart Card (7 cols) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #064e3b 100%)',
            backgroundColor: '#090d16',
          }}
          className="lg:col-span-7 relative overflow-hidden rounded-3xl text-white p-6 md:p-7 shadow-xl flex flex-col justify-between min-h-[235px] border border-slate-700/80 hover-lift"
        >
          {/* Subtle ambient emerald glow at bottom right */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Brand & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-xs text-emerald-400 shadow-sm">
                Rp
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 block leading-tight">
                  Student Smart Wallet
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {settings.university || 'Perguruan Tinggi'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
                Likuid & Siap Pakai
              </span>
              <Wifi className="w-4 h-4 text-emerald-400 rotate-90" />
            </div>
          </div>

          {/* Middle Row: Gold Chip & Bold Balance */}
          <div className="relative z-10 my-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className="w-10 h-7 rounded-md flex items-center justify-center relative overflow-hidden shadow-sm border border-amber-300/80 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
                  }}
                >
                  <div className="w-full h-px bg-amber-900/40 absolute top-2" />
                  <div className="w-full h-px bg-amber-900/40 absolute bottom-2" />
                  <div className="h-full w-px bg-amber-900/40 absolute left-3" />
                  <div className="h-full w-px bg-amber-900/40 absolute right-3" />
                </div>
                <span className="text-xs font-semibold text-slate-300 tracking-wide">
                  Total Saldo Seluruh Dompet
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-sm">
                {formatIDR(currentBalance)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Tersebar di</span>
              <span className="text-xs font-bold text-slate-200 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 inline-block mt-0.5 shadow-2xs">
                {accounts.length} Dompet / Rekening
              </span>
            </div>
          </div>

          {/* Bottom Row: Cardholder Info & Quick Action Chips */}
          <div className="relative z-10 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Pemilik Kartu</span>
                <span className="text-xs font-bold tracking-wide uppercase text-white truncate max-w-[180px] block">
                  {settings.userName || 'Mahasiswa'}
                </span>
              </div>
              <div className="text-slate-600">|</div>
              <div className="font-mono text-xs text-slate-300 font-semibold tracking-widest">
                •••• 2026
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQuickAdd}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Catat</span>
              </button>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-600 shadow-2xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pindah Saldo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Health Score & Safe Daily Spend Dual Widgets (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Widget 1: Skor Kesehatan Finansial with Circular Ring */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-4.5 md:p-5 shadow-xs flex flex-col justify-between hover-lift">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* SVG Radial Gauge */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r={scoreRadius}
                      stroke="#f1f5f9"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={scoreRadius}
                      stroke={getScoreColor(healthScore.overallScore)}
                      strokeWidth="7"
                      strokeDasharray={scoreCircumference}
                      strokeDashoffset={scoreOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-extrabold text-neutral-900 tabular-nums">
                      {healthScore.overallScore}
                    </span>
                    <span className="text-[8px] font-bold text-neutral-400 -mt-0.5">/100</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-neutral-900">Kesehatan Finansial</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        healthScore.overallScore >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : healthScore.overallScore >= 55
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {healthScore.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">
                    Evaluasi disiplin belanja, tabungan, & dana darurat.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectTab('insights')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold shrink-0"
                title="Buka Halaman Wawasan Finansial"
              >
                Detail →
              </button>
            </div>

            {/* Mini Progress Bars for 3 Health Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-neutral-100 text-[10px]">
              <div>
                <span className="text-neutral-500 block truncate">Tabungan</span>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (healthScore.savingsScore / 25) * 100)}%` }}
                  />
                </div>
                <span className="font-bold text-neutral-800 block mt-0.5 tabular-nums">
                  {healthScore.savingsScore}/25
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block truncate">Anggaran</span>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (healthScore.budgetScore / 25) * 100)}%` }}
                  />
                </div>
                <span className="font-bold text-neutral-800 block mt-0.5 tabular-nums">
                  {healthScore.budgetScore}/25
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block truncate">Darurat</span>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-sky-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (healthScore.emergencyScore / 20) * 100)}%` }}
                  />
                </div>
                <span className="font-bold text-neutral-800 block mt-0.5 tabular-nums">
                  {healthScore.emergencyScore}/20
                </span>
              </div>
            </div>
          </div>

          {/* Widget 2: Batas Belanja Harian (Smart Daily Spending) */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-4.5 md:p-5 shadow-xs flex flex-col justify-between hover-lift">
            <div>
              <div className="flex items-center justify-between text-neutral-500 text-xs">
                <span className="flex items-center gap-1 font-semibold text-neutral-700">
                  <span>Batas Belanja Hari Ini</span>
                  <button
                    onClick={() => setShowSafeDailyInfo(!showSafeDailyInfo)}
                    className="text-neutral-400 hover:text-neutral-600"
                    title="Penjelasan rumus batas belanja harian"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSpendingSafe
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isSpendingSafe ? '✓ Pengeluaran Aman' : '⚠ Over Limit'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-neutral-900 tabular-nums">
                  {formatIDR(safeDailySpend.safeDaily)}
                </span>
                <span className="text-xs text-neutral-400 font-medium">/hari</span>
              </div>
            </div>

            {/* Spent Today Progress */}
            <div className="mt-3 pt-2.5 border-t border-neutral-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">
                  Terpakai hari ini: <strong className="text-neutral-800 tabular-nums">{formatIDR(todaySpent)}</strong>
                </span>
                <span className="text-neutral-400 font-medium tabular-nums" title={`Kiriman ortu/gaji berikutnya: tgl ${safeDailySpend.paydayOrAllowanceDay}`}>
                  Sisa {safeDailySpend.remainingDays} hari (s/d tgl {safeDailySpend.paydayOrAllowanceDay})
                </span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSpendingSafe ? 'bg-emerald-600' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      safeDailySpend.safeDaily > 0 ? (todaySpent / safeDailySpend.safeDaily) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safe Daily Info Collapsible */}
      {showSafeDailyInfo && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-900">Bagaimana Batas Belanja Harian Dihitung?</p>
            <p className="text-neutral-700 leading-relaxed font-mono">
              Batas Harian = (Saldo Dompet - Target Tabungan - Tagihan Wajib Sisa) ÷ Sisa Hari ({safeDailySpend.remainingDays} hari s/d tgl kiriman {safeDailySpend.paydayOrAllowanceDay})
            </p>
            <p className="text-neutral-600 text-[11px]">
              Rumus ini mencegah uang bulananmu habis sebelum tanggal kiriman ortu/gaji berikutnya (tanggal {safeDailySpend.paydayOrAllowanceDay}) tanpa mengorbankan kewajiban pokokmu.
            </p>
          </div>
        </div>
      )}

      {/* 4 Clean Key KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan Bulan Ini */}
        <div className="p-4.5 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col justify-between hover-lift">
          <div>
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Pemasukan Bulan Ini</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-emerald-700 tabular-nums mt-1">
              {formatIDR(monthlyIncome)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Kiriman, gaji, & freelance</span>
            <button
              onClick={onOpenQuickAdd}
              className="text-emerald-700 font-semibold hover:underline"
            >
              + Catat Masuk
            </button>
          </div>
        </div>

        {/* Card 2: Pengeluaran Bulan Ini */}
        <div className="p-4.5 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col justify-between hover-lift">
          <div>
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Pengeluaran Bulan Ini</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-neutral-900 tabular-nums mt-1">
              {formatIDR(monthlyExpenses)}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              {monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0}% dari pemasukan
            </span>
            <button
              onClick={() => setActiveChartTab('expense')}
              className="text-neutral-700 font-semibold hover:underline"
            >
              Lihat Grafik →
            </button>
          </div>
        </div>

        {/* Card 3: Tabungan & Rasio Hemat */}
        <div className="p-4.5 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col justify-between hover-lift">
          <div>
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Sisa Tabungan Kas</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-teal-800 tabular-nums mt-1">
              {formatIDR(Math.max(0, monthlySavings))}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Rasio hemat: <strong className="text-neutral-800 font-semibold">{savingsRate}%</strong></span>
            <button
              onClick={() => onSelectTab('goals')}
              className="text-teal-700 font-semibold hover:underline"
            >
              Target Tabungan →
            </button>
          </div>
        </div>

        {/* Card 4: Total Anggaran Aktif */}
        <div className="p-4.5 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col justify-between hover-lift">
          <div>
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Realisasi Plafon Anggaran</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-neutral-900 tabular-nums mt-1">
              {Math.round(budgetSummary.overallPercentage)}%
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              {budgetSummary.overBudgetCount > 0 ? (
                <span className="text-rose-600 font-bold">{budgetSummary.overBudgetCount} kategori over</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Semua aman</span>
              )}
            </span>
            <button
              onClick={() => setActiveChartTab('budget')}
              className="text-purple-700 font-semibold hover:underline"
            >
              Detail Anggaran →
            </button>
          </div>
        </div>
      </div>

      {/* Student AI Runway & Quick Hub Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Hourglass className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
                  Student Financial Runway
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    studentRunway.status === 'safe'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : studentRunway.status === 'caution'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {studentRunway.status === 'safe'
                    ? 'Sangat Aman'
                    : studentRunway.status === 'caution'
                    ? 'Waspada'
                    : 'Kritis'}
                </span>
                {unpaidCampusBills.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40">
                    {unpaidCampusBills.length} Tagihan Kampus Belum Lunas
                  </span>
                )}
              </div>
              <p className="text-lg md:text-xl font-bold mt-1 text-white">
                Sisa saldo mampu bertahan sekitar{' '}
                <span className="text-emerald-400 font-extrabold">{studentRunway.survivalDays} hari</span> lagi
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Burn rate harian: <span className="font-semibold text-white">{formatIDR(studentRunway.dailyBurn)}/hari</span> • Proyeksi habis: <span className="font-semibold text-white">{studentRunway.projectedEndDateStr}</span>
              </p>
            </div>
          </div>

          {/* Quick Feature Shortcut Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
            <button
              onClick={() => onSelectTab('campus')}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Keuangan Kampus</span>
              {unpaidCampusBills.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('splitbill')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Split Bill QR</span>
            </button>

            <button
              onClick={() => onSelectTab('pricesaver')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Katalog Hemat</span>
            </button>
          </div>
        </div>
      </section>

      {/* Urgent Recurring Bills Alert (if any) */}
      {urgentBills.length > 0 && (
        <section className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <BellRing className="w-4 h-4 text-amber-700 animate-bounce" />
              <span>Pengingat: Ada {urgentBills.length} Tagihan Bulanan Perlu Dibayar!</span>
            </div>
            <button
              onClick={() => onSelectTab('recurring')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>Kelola Tagihan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {urgentBills.slice(0, 3).map((item) => (
              <div
                key={item.recurring.id}
                className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-neutral-900 truncate">
                    {item.recurring.title}
                  </h5>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                    <span className="font-bold text-neutral-900">{formatIDR(item.recurring.amount)}</span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        item.status === 'due_today'
                          ? 'text-rose-600'
                          : item.status === 'overdue'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {item.status === 'due_today'
                        ? 'Hari Ini!'
                        : item.status === 'overdue'
                        ? 'Terlewat'
                        : `H-${item.daysDifference}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => processRecurringEntry(item.recurring.id)}
                  className="shrink-0 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  Bayar & Catat
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* MULTI-WALLET DECK: Modern FinTech Wallet Accounts        */}
      {/* ======================================================== */}
      <section className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Dompet & Rekening (Multi-Wallet)</h3>
              <p className="text-[11px] text-neutral-500">Saldo aktif terpisah di Bank, E-Wallet, dan Uang Tunai</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors shadow-2xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Pindah Saldo</span>
            </button>
            <button
              onClick={() => onSelectTab('wallets')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
            >
              <span>Kelola Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {accounts.map((acc) => {
            const Icon =
              acc.type === 'bank'
                ? Building2
                : acc.type === 'ewallet'
                ? Smartphone
                : acc.type === 'cash'
                ? Wallet
                : CreditCard;

            const badgeStyle = getWalletBadgeStyle(acc.name, acc.type);

            return (
              <div
                key={acc.id}
                onClick={() => onSelectTab('wallets')}
                className={`p-3.5 rounded-xl border ${badgeStyle.border} ${badgeStyle.bg} hover:border-neutral-400 transition-all cursor-pointer relative overflow-hidden hover-lift shadow-2xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${badgeStyle.indicator}`} />
                      <Icon className="w-3.5 h-3.5 text-neutral-700" />
                    </div>
                    <span className="text-[9px] uppercase font-bold text-neutral-500 bg-white/70 px-1.5 py-0.5 rounded">
                      {acc.type}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-neutral-900 truncate">{acc.name}</h5>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-200/60">
                  <span className="text-xs md:text-sm font-extrabold text-neutral-900 tabular-nums block">
                    {formatIDR(acc.balance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* INTERACTIVE CHART HUB (Grafik Pengeluaran & Anggaran)   */}
      {/* ======================================================== */}
      <section className="space-y-4">
        {/* Chart Segmented Control Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-200 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => setActiveChartTab('expense')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'expense'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grafik Pengeluaran</span>
            </button>

            <button
              onClick={() => setActiveChartTab('budget')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'budget'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grafik Anggaran</span>
            </button>

            <button
              onClick={() => setActiveChartTab('cashflow')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === 'cashflow'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Komposisi 50/30/20</span>
            </button>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            Visualisasi Data Interaktif Real-Time
          </div>
        </div>

        {/* Tab 1: Interactive Expense Chart */}
        {activeChartTab === 'expense' && (
          <InteractiveExpenseChart
            transactions={transactions}
            activeMonth={activeMonth}
            safeDailyLimit={safeDailySpend.safeDaily}
          />
        )}

        {/* Tab 2: Interactive Budget Chart */}
        {activeChartTab === 'budget' && (
          <InteractiveBudgetChart
            budgetSummary={budgetSummary}
            onOpenMethodsModal={() => onSelectTab('budget')}
          />
        )}

        {/* Tab 3: Cash Flow & 50/30/20 Breakdown */}
        {activeChartTab === 'cashflow' && (
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Arus Kas & Komposisi Kebutuhan vs Keinginan
                </h3>
                <p className="text-xs text-neutral-500">
                  Evaluasi alokasi pengeluaran mahasiswa bulan {activeMonth}
                </p>
              </div>
              <button
                onClick={() => onSelectTab('reports')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5"
              >
                <span>Laporan Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Income vs Expense Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-neutral-600">
                <span>Rasio Pemasukan vs Pengeluaran</span>
                <span className="tabular-nums font-bold text-neutral-900">
                  {formatIDR(monthlyExpenses)} / {formatIDR(monthlyIncome)} (
                  {monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-rose-500 h-full rounded-l-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0
                    )}%`,
                  }}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      100 - (monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Pengeluaran ({formatIDR(monthlyExpenses)})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Sisa Tabungan ({formatIDR(Math.max(0, monthlySavings))})</span>
                </span>
              </div>
            </div>

            {/* Needs vs Wants Bar (50/30/20 guideline) */}
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              <div className="flex justify-between text-xs font-medium text-neutral-600">
                <span>Analisis Kebutuhan Pokok (Needs) vs Gaya Hidup (Wants)</span>
                <span className="tabular-nums font-bold text-neutral-900">
                  Needs: {Math.round(needsVsWants.needsPercent)}% · Wants:{' '}
                  {Math.round(needsVsWants.wantsPercent)}%
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${needsVsWants.needsPercent}%` }}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${needsVsWants.wantsPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>
                  Needs ({formatIDR(needsVsWants.needsTotal)}) - Kos, makan, kuliah (Ideal: ≤50%)
                </span>
                <span>
                  Wants ({formatIDR(needsVsWants.wantsTotal)}) - Nongkrong, shopping (Ideal: ≤30%)
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* BOTTOM GRID: Recent Transactions & Saving Goals          */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Riwayat Transaksi Terbaru</h3>
              <p className="text-xs text-neutral-500">Pencatatan pengeluaran & pemasukan terkini</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab('transactions')}
                className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                Lihat Semua
              </button>
              <button
                onClick={onOpenQuickAdd}
                className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat</span>
              </button>
            </div>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Belum ada transaksi di bulan {activeMonth}. Ketuk tombol '+ Catat' untuk mulai mencatat.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {monthTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'savings_transfer' || tx.type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTab('transactions')}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-neutral-50/70 rounded-xl px-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-700'
                            : isTransfer
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : isTransfer ? (
                          <ArrowLeftRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 truncate">
                            {tx.category}
                          </span>
                          {tx.classification && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                tx.classification === 'need'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {tx.classification === 'need' ? 'Pokok' : 'Gaya Hidup'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {tx.notes || (isTransfer ? 'Transfer Antar Dompet' : 'Tanpa catatan')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span
                        className={`font-bold tabular-nums text-xs md:text-sm block ${
                          isIncome
                            ? 'text-emerald-700'
                            : isTransfer
                            ? 'text-sky-700'
                            : 'text-neutral-900'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                        {formatIDR(Math.abs(tx.amount))}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {formatDateID(tx.date, 'short')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Saving Goals Snapshot */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Target Tabungan</h3>
                <p className="text-xs text-neutral-500">Kemajuan target finansial aktif</p>
              </div>
              <button
                onClick={() => onSelectTab('goals')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold"
              >
                Semua Target
              </button>
            </div>

            <div className="space-y-3">
              {savingGoals.slice(0, 3).map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );
                return (
                  <div
                    key={goal.id}
                    className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-2 hover-lift"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{goal.name}</h4>
                      <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 tabular-nums">
                      <span>{formatIDR(goal.currentAmount)}</span>
                      <span>Target: {formatIDR(goal.targetAmount)}</span>
                    </div>

                    <button
                      onClick={() => onContributeGoal(goal)}
                      className="w-full mt-1 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                    >
                      + Setor Tabungan
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-950">
            <span className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tips Mahasiswa Cerdas:</span>
            </span>
            <p className="text-emerald-800 mt-1 text-[11px] leading-relaxed">
              Kunci membeli barang impian tanpa utang adalah menyisihkan tabungan di awal bulan, bukan menyisakan uang di akhir bulan.
            </p>
          </div>
        </div>
      </section>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      {/* Android Connect Modal */}
      <AndroidConnectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
};
