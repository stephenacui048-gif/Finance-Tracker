import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sliders,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  HelpCircle,
  Award,
  Zap,
  Hourglass,
  Flame,
  Coffee,
  Smile,
  Frown,
  HeartHandshake,
  Check,
} from 'lucide-react';
import { formatIDR, formatPercent, formatDateID } from '../utils/formatters';
import { DebtModal } from '../components/modals/DebtModal';
import { BudgetingMethodsModal } from '../components/budget/BudgetingMethodsModal';
import { getRecommendedBudgetingMethod, BUDGETING_METHODS } from '../data/budgetingMethods';
import { Debt, SavingGoal } from '../types/finance';

export const InsightsView: React.FC = () => {
  const {
    healthScore,
    smartRecommendations,
    cashFlowForecast,
    gamification,
    studentRunway,
    emotionalSpending,
    gamificationProfile,
    claimGamificationQuest,
    savingGoals,
    debts,
    deleteDebt,
    monthlyExpenses,
    monthlyIncome,
    savingsRate,
    budgetSummary,
    selectedBudgetingMethod,
    currentBalance,
  } = useFinance();

  // Cooling-off Rule Wishlist State
  const [wishlistName, setWishlistName] = useState('');
  const [wishlistPrice, setWishlistPrice] = useState('');
  const [wishlistResult, setWishlistResult] = useState<string | null>(null);

  // Budgeting modal state
  const [isMethodsModalOpen, setIsMethodsModalOpen] = useState<boolean>(false);

  // What-If Simulator state
  const [reduceCategory, setReduceCategory] = useState<string>('Nongkrong');
  const [cutAmountPerWeek, setCutAmountPerWeek] = useState<number>(50_000);
  const [selectedGoalForSim, setSelectedGoalForSim] = useState<string>(
    savingGoals.length > 0 ? savingGoals[0].id : ''
  );

  // Emergency Fund planner target months
  const [emergencyMonths, setEmergencyMonths] = useState<number>(3);

  // Debt modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState<boolean>(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<Debt | null>(null);

  // Method recommendation calculation
  const activePayableDebts = debts.filter((d) => d.type === 'payable' && d.remainingAmount > 0);
  const totalDebtAmount = activePayableDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const methodRec = getRecommendedBudgetingMethod(
    monthlyIncome,
    monthlyExpenses,
    activePayableDebts.length,
    totalDebtAmount,
    savingsRate,
    budgetSummary.overBudgetCount
  );

  // Simulation calculations
  const monthlyCut = cutAmountPerWeek * 4.33;
  const annualCut = monthlyCut * 12;

  const targetGoal = savingGoals.find((g) => g.id === selectedGoalForSim) || savingGoals[0];
  const goalRemaining = targetGoal ? Math.max(0, targetGoal.targetAmount - targetGoal.currentAmount) : 0;
  const monthsAccelerated = monthlyCut > 0 && goalRemaining > 0 ? Math.ceil(goalRemaining / (monthlyCut + 200_000)) : 0;

  // Emergency Fund calculations
  const essentialCostPerMonth = 1_800_000; // estimated student baseline (kos + makan pokok)
  const targetEmergencyFund = essentialCostPerMonth * emergencyMonths;
  const emergencyGoal = savingGoals.find((g) => g.isEmergencyFund);
  const currentEmergencyFund = emergencyGoal ? emergencyGoal.currentAmount : 0;
  const emergencyProgress = Math.min(100, Math.round((currentEmergencyFund / targetEmergencyFund) * 100));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
            Wawasan Keuangan, Skor & Simulasi
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Analisis kesehatan finansial, proyeksi arus kas akhir bulan, dan strategi berhemat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Skor Kesehatan: {healthScore.overallScore}/100 ({healthScore.rating})</span>
          </div>
        </div>
      </div>

      {/* 1. Financial Health Score (Skor Kesehatan Finansial) */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Skor Kesehatan Finansial: {healthScore.overallScore}/100</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Evaluasi otomatis berbasis data riil kepatuhan anggaran, tabungan, dan likuiditas
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-bold ${
              healthScore.overallScore >= 75
                ? 'bg-emerald-100 text-emerald-800'
                : healthScore.overallScore >= 50
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            Status: {healthScore.rating}
          </span>
        </div>

        {/* Breakdown of 5 components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Disiplin Anggaran</span>
              <span className="font-bold text-neutral-900 tabular-nums">{healthScore.budgetScore}/25</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(healthScore.budgetScore / 25) * 100}%` }} />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Rasio Tabungan</span>
              <span className="font-bold text-neutral-900 tabular-nums">{healthScore.savingsScore}/25</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(healthScore.savingsScore / 25) * 100}%` }} />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Dana Darurat</span>
              <span className="font-bold text-neutral-900 tabular-nums">{healthScore.emergencyScore}/20</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(healthScore.emergencyScore / 20) * 100}%` }} />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Buffer Saldo</span>
              <span className="font-bold text-neutral-900 tabular-nums">{healthScore.discretionaryScore}/15</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(healthScore.discretionaryScore / 15) * 100}%` }} />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Kontrol Utang</span>
              <span className="font-bold text-neutral-900 tabular-nums">{healthScore.debtScore}/15</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(healthScore.debtScore / 15) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Plain language recommendations */}
        <div className="p-3.5 bg-neutral-50/80 rounded-lg border border-neutral-100 space-y-1.5">
          <span className="text-xs font-bold text-neutral-800">Saran Tindakan Utama:</span>
          {healthScore.recommendations.map((rec, i) => (
            <p key={i} className="text-xs text-neutral-600 flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span>{rec}</span>
            </p>
          ))}
        </div>
      </div>

      {/* 2. Smart Saving Recommendations with transparent reasons */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-neutral-900">Rekomendasi Hemat Cerdas (Data-Driven)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {smartRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                rec.type === 'warning'
                  ? 'border-amber-200 bg-amber-50/30 text-amber-950'
                  : rec.type === 'praise'
                  ? 'border-emerald-200 bg-emerald-50/30 text-emerald-950'
                  : 'border-neutral-200 bg-neutral-50/40 text-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold">{rec.title}</h4>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white border border-neutral-200">
                  {rec.type}
                </span>
              </div>
              <p className="leading-relaxed">{rec.message}</p>

              {/* Transparent reason */}
              <div className="pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500">
                <span className="font-semibold text-neutral-700">Mengapa ini muncul: </span>
                {rec.reason}
              </div>

              {rec.actionableStep && (
                <div className="p-2 rounded bg-white/80 border border-neutral-200/70 text-[11px] font-medium text-neutral-800">
                  💡 <strong>Langkah Aksi:</strong> {rec.actionableStep}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rekomendasi Metode Budgeting Section */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                Rekomendasi Metode Budgeting (50/30/20, 80/20, Zero-Based, 6 Jars, Snowball & Avalanche)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sistem mencocokkan pola pengeluaran & tanggungan utangmu dengan metode budgeting terbaik
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMethodsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <span>Buka 6 Metode Budgeting</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-linear-to-r from-emerald-50/70 via-teal-50/60 to-neutral-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-600">Metode Paling Direkomendasikan:</span>
              <strong className="text-emerald-950 font-bold text-sm">
                {methodRec.recommendedMethod.name}
              </strong>
            </div>
            <p className="text-neutral-700 leading-relaxed text-[11px]">
              {methodRec.reason}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMethodsModalOpen(true)}
            className="shrink-0 px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-emerald-300 text-emerald-900 font-semibold rounded-lg shadow-2xs text-xs"
          >
            Pelajari & Terapkan
          </button>
        </div>
      </div>

      {/* 3. AI Cash-Flow Forecast & Runway Mahasiswa ("Berapa Hari Bertahan") */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-emerald-600" />
              <span>AI Runway Mahasiswa: Berapa Hari Uangmu Bertahan?</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Prediksi daya tahan saldo kas berdasarkan burn-rate harian dan komitmen tagihan kampus
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-bold ${
              studentRunway.status === 'safe'
                ? 'bg-emerald-100 text-emerald-800'
                : studentRunway.status === 'caution'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {studentRunway.status === 'safe'
              ? '🛡️ Kas Sangat Aman'
              : studentRunway.status === 'caution'
              ? '⚠️ Perhatian Arus Kas'
              : '🚨 Kritis: Uang Menipis'}
          </span>
        </div>

        {/* Big Survival Days Hero Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-center flex flex-col justify-center">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Daya Tahan Saldo (Runway)
            </span>
            <div className="text-4xl font-black font-mono text-emerald-950 my-1">
              {studentRunway.survivalDays} <span className="text-lg font-normal text-emerald-700">Hari</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              Habis pada: {studentRunway.projectedEndDateStr}
            </p>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Rata-rata Belanja (Burn Rate):</span>
              <span className="font-bold text-neutral-900 font-mono">
                {formatIDR(studentRunway.dailyBurn)}/hari
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Tagihan Wajib Mendatang:</span>
              <span className="font-bold text-rose-700 font-mono">
                -{formatIDR(studentRunway.upcomingMandatoryBills)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-neutral-200">
              <span className="text-neutral-700 font-semibold">Runway Bersih Setelah Tagihan:</span>
              <span className="font-bold text-emerald-800 font-mono">
                {studentRunway.netSurvivalDays} Hari
              </span>
            </div>
          </div>

          <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-2 text-xs flex flex-col justify-between">
            <div>
              <span className="text-emerald-400 font-bold block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rekomendasi AI Mahasiswa</span>
              </span>
              <p className="text-[11px] text-emerald-100 mt-1 leading-relaxed">
                {studentRunway.studentTip}
              </p>
            </div>
            <p className="text-[10px] text-emerald-400/80">
              {studentRunway.message}
            </p>
          </div>
        </div>

        {/* Regular forecast breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 bg-neutral-50 rounded-lg">
            <span className="text-neutral-500 block">Saldo Saat Ini</span>
            <span className="text-sm font-bold text-neutral-900 tabular-nums">
              {formatIDR(cashFlowForecast.currentBalance)}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg">
            <span className="text-neutral-500 block">Pemasukan Berulang Tersisa</span>
            <span className="text-sm font-bold text-emerald-700 tabular-nums">
              +{formatIDR(cashFlowForecast.upcomingRecurringIncome)}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg">
            <span className="text-neutral-500 block">Estimasi Belanja Sisa ({cashFlowForecast.remainingDays} hari)</span>
            <span className="text-sm font-bold text-rose-700 tabular-nums">
              -{formatIDR(cashFlowForecast.estimatedDiscretionarySpend)}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              Rata-rata: {formatIDR(cashFlowForecast.averageDailySpent)}/hari
            </span>
          </div>

          <div className="p-3 bg-neutral-900 text-white rounded-lg">
            <span className="text-neutral-400 block text-[11px]">Proyeksi Saldo Akhir Bulan</span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              {formatIDR(cashFlowForecast.projectedBalance)}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">
              {cashFlowForecast.projectedBalance >= 0 ? 'Surplus aman' : 'Peringatan defisit!'}
            </span>
          </div>
        </div>
      </div>

      {/* 8. Gamifikasi & Level Kesehatan Finansial Mahasiswa */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Level & Tantangan Finansial Mahasiswa (Gamifikasi)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Dapatkan XP dari setiap pencatatan rapi, hari hemat no-spend, dan capai lencana prestasi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Streak: {gamificationProfile.streakDays} Hari</span>
            </span>
          </div>
        </div>

        {/* Level Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-100">
                Peringkat Mahasiswa
              </span>
              <h4 className="text-lg font-black">
                Level {gamificationProfile.level}: {gamificationProfile.levelTitle}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold">
                {gamificationProfile.currentXP} / {gamificationProfile.maxXPForLevel} XP
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((gamificationProfile.currentXP / gamificationProfile.maxXPForLevel) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Weekly Quests & Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Quests */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-800 block">Tantangan Mingguan (Quests):</span>
            <div className="space-y-1.5">
              {gamificationProfile.quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                    q.completed
                      ? 'bg-neutral-50 border-neutral-200 text-neutral-400'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${q.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                      {q.title}
                    </p>
                    <p className="text-[11px] text-neutral-500">{q.description}</p>
                  </div>

                  {q.completed ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesai</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => claimGamificationQuest(q.id)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold shadow-2xs transition-colors shrink-0"
                    >
                      +{q.rewardXP} XP
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-800 block">Koleksi Lencana (Badges):</span>
            <div className="grid grid-cols-2 gap-2">
              {gamificationProfile.badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                    b.unlocked
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{b.unlocked ? '🏆' : '🔒'}</span>
                    <span className="text-[10px] font-mono">
                      {b.progress}/{b.maxProgress}
                    </span>
                  </div>
                  <p className="font-bold truncate text-neutral-900">{b.name}</p>
                  <p className="text-[10px] text-neutral-500 line-clamp-2">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 11. Analisis Emosi & Belanja Impulsif (Psychology of Spending) */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Smile className="w-4 h-4 text-purple-600" />
              <span>Analisis Emosi & Belanja Impulsif (Sentimen Keuangan)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Ketahui seberapa banyak uang saku yang terbuang karena stres kuliah, lapar mata, atau FOMO
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md font-bold bg-purple-100 text-purple-900">
            {emotionalSpending.wastePercentage}% Pengeluaran Emosional
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Breakdown cards */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-neutral-800 block">Distribusi Berdasarkan Mood Belanja:</span>
            {Object.entries(emotionalSpending.moodMap).map(([key, val]) => (
              <div key={key} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-800">{val.label}</span>
                  <span className="font-mono font-bold text-neutral-900">{formatIDR(val.amount)}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: val.color,
                      width: `${emotionalSpending.totalTaggedAmount > 0 ? (val.amount / emotionalSpending.totalTaggedAmount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Aturan 24 Jam Impulse Simulator */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center gap-2 text-purple-900">
              <Clock className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-sm">Widget Uji Aturan 24 Jam (Cooling-off Rule)</h4>
            </div>
            <p className="text-neutral-600 text-[11px]">
              Tertarik beli barang di marketplace atau jajan mahal? Masukkan harganya untuk menguji apakah itu belanja impulsif:
            </p>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama barang (contoh: Sepatu branded, Baju tren)"
                value={wishlistName}
                onChange={(e) => setWishlistName(e.target.value)}
                className="w-full p-2 border border-purple-200 rounded-lg bg-white text-xs"
              />
              <input
                type="number"
                placeholder="Estimasi harga (Rp)"
                value={wishlistPrice}
                onChange={(e) => setWishlistPrice(e.target.value)}
                className="w-full p-2 border border-purple-200 rounded-lg bg-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const price = parseFloat(wishlistPrice) || 0;
                  if (price <= 0) return;
                  const days = Math.round(price / (studentRunway.dailyBurn || 35000));
                  if (days >= 3) {
                    setWishlistResult(`⚠️ PERINGATAN: Barang "${wishlistName || 'ini'}" setara dengan jatah hidup ${days} hari kamu! Terapkan aturan 24 jam: simpan di keranjang dan tunggu hingga besok. Jika besok tidak mendesak, batalkan.`);
                  } else {
                    setWishlistResult(`✅ Masuk akal (setara ~${days} hari jatah harian). Namun pastikan tagihan kos & UKT bulan ini sudah aman.`);
                  }
                }}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                Uji Nilai Pembelian
              </button>

              {wishlistResult && (
                <div className="p-3 bg-white border border-purple-300 rounded-lg text-xs text-neutral-800 font-medium">
                  {wishlistResult}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. What-If Simulator & Emergency Fund Planner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What-If Simulator */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">What-If Simulator (Simulasi Hemat)</h3>
              <p className="text-xs text-neutral-500">Uji dampak memangkas pengeluaran ke target tabungan</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pilih Kategori yang Ingin Dihemat
              </label>
              <select
                value={reduceCategory}
                onChange={(e) => setReduceCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              >
                <option value="Nongkrong">Nongkrong & Kafe</option>
                <option value="Shopping">Shopping & Belanja Online</option>
                <option value="Makanan">Makan Mewah / Jajan Diluar</option>
                <option value="Entertainment">Hiburan / Nonton Bioskop</option>
                <option value="Subscription">Langganan Digital</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-700">Potong Belanja per Minggu:</span>
                <span className="font-bold text-emerald-800 tabular-nums">{formatIDR(cutAmountPerWeek)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="10000"
                value={cutAmountPerWeek}
                onChange={(e) => setCutAmountPerWeek(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>Rp 10.000/mg</span>
                <span>Rp 200.000/mg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Alokasikan Hasil Hemat ke Target:
              </label>
              <select
                value={selectedGoalForSim}
                onChange={(e) => setSelectedGoalForSim(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              >
                {savingGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Simulation Results Box */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2 text-xs">
              <span className="font-bold text-emerald-950">Hasil Proyeksi Berhemat:</span>
              <div className="grid grid-cols-2 gap-2 text-neutral-800">
                <div>
                  <span className="text-[11px] text-neutral-500 block">Terkumpul 1 Bulan:</span>
                  <span className="font-bold text-emerald-800 tabular-nums">+{formatIDR(monthlyCut)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 block">Terkumpul 1 Tahun:</span>
                  <span className="font-bold text-emerald-800 tabular-nums">+{formatIDR(annualCut)}</span>
                </div>
              </div>
              {targetGoal && (
                <p className="text-[11px] text-emerald-900 pt-1 border-t border-emerald-200/60">
                  🚀 Target <strong>{targetGoal.name}</strong> akan selesai <strong>{monthsAccelerated} bulan lebih cepat</strong> dari jadwal awal!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Fund Planner */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Perencana Dana Darurat (Emergency Fund)</h3>
              <p className="text-xs text-neutral-500">Bantalan aman jika terjadi kendala tak terduga</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pilih Durasi Cadangan Biaya Hidup Mahasiswa:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 6].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEmergencyMonths(m)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      emergencyMonths === m
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {m} Bulan
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg space-y-2 border border-neutral-100">
              <div className="flex justify-between">
                <span className="text-neutral-500">Estimasi Biaya Pokok/Bulan:</span>
                <span className="font-semibold text-neutral-800 tabular-nums">{formatIDR(essentialCostPerMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Target Ideal Dana Darurat ({emergencyMonths} bln):</span>
                <span className="font-bold text-neutral-900 tabular-nums">{formatIDR(targetEmergencyFund)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Dana Terkumpul Saat Ini:</span>
                <span className="font-bold text-emerald-700 tabular-nums">{formatIDR(currentEmergencyFund)}</span>
              </div>

              {/* Progress bar */}
              <div className="pt-1">
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${emergencyProgress}%` }} />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block text-right font-mono">
                  {emergencyProgress}% tercapai
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500">
              💡 <em>Tips:</em> Mahasiswa perantauan disarankan minimal memiliki 2–3 bulan biaya hidup pokok di tabungan darurat terpisah agar tidak panik saat orang tua mengalami kendala transfer.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Debt & Receivable Tracker (Pencatat Utang & Piutang) */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Pencatat Utang & Piutang (Debt Tracker)</h3>
            <p className="text-xs text-neutral-500">Catat pinjaman buku, talangan makan kas, dan pelunasan tepat waktu</p>
          </div>
          <button
            onClick={() => {
              setSelectedDebtForPay(null);
              setIsDebtModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Catatan Utang / Piutang</span>
          </button>
        </div>

        {debts.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">
            Tidak ada tanggungan utang atau piutang aktif saat ini. Hidup bebas utang!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {debts.map((debt) => {
              const isPayable = debt.type === 'payable';
              const isSettled = debt.remainingAmount === 0;

              return (
                <div
                  key={debt.id}
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                    isSettled
                      ? 'border-neutral-200 bg-neutral-50/50 opacity-60'
                      : isPayable
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-emerald-200 bg-emerald-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isPayable ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isPayable ? 'Utang Saya (Wajib Bayar)' : 'Piutang (Teman Berutang)'}
                      </span>
                      <h4 className="font-bold text-neutral-900 text-sm mt-1">{debt.title}</h4>
                      <p className="text-neutral-500 text-[11px]">Pihak: {debt.personName}</p>
                    </div>

                    <button
                      onClick={() => deleteDebt(debt.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-neutral-100">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Sisa Tagihan</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatIDR(debt.remainingAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Jatuh Tempo</span>
                      <span className="font-medium text-neutral-700 tabular-nums">
                        {formatDateID(debt.dueDate, 'short')}
                      </span>
                    </div>
                  </div>

                  {!isSettled && (
                    <button
                      onClick={() => {
                        setSelectedDebtForPay(debt);
                        setIsDebtModalOpen(true);
                      }}
                      className="w-full py-1.5 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg shadow-2xs transition-colors"
                    >
                      {isPayable ? 'Bayar Cicilan / Lunas' : 'Catat Uang Diterima'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt Modal */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setSelectedDebtForPay(null);
        }}
        debtToPay={selectedDebtForPay}
      />

      {/* Budgeting Methods Modal */}
      <BudgetingMethodsModal
        isOpen={isMethodsModalOpen}
        onClose={() => setIsMethodsModalOpen(false)}
      />
    </div>
  );
};
