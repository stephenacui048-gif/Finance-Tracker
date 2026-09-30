import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  BUDGETING_METHODS,
  getRecommendedBudgetingMethod,
} from '../../data/budgetingMethods';
import { BudgetingMethodType, BudgetingMethodDefinition } from '../../types/finance';
import {
  X,
  Sparkles,
  Check,
  ArrowRight,
  TrendingDown,
  Layers,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

interface BudgetingMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetingMethodsModal: React.FC<BudgetingMethodsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    monthlyIncome,
    monthlyExpenses,
    debts,
    savingsRate,
    budgetSummary,
    selectedBudgetingMethod,
    applyBudgetingMethod,
    settings,
  } = useFinance();

  const [activeMethodId, setActiveMethodId] = useState<BudgetingMethodType>(
    selectedBudgetingMethod || '50_30_20'
  );

  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Debts calculation
  const activePayableDebts = useMemo(() => {
    return debts.filter((d) => d.type === 'payable' && d.remainingAmount > 0);
  }, [debts]);

  const totalDebtAmount = useMemo(() => {
    return activePayableDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [activePayableDebts]);

  // Intelligent Recommendation
  const recommendation = useMemo(() => {
    return getRecommendedBudgetingMethod(
      monthlyIncome,
      monthlyExpenses,
      activePayableDebts.length,
      totalDebtAmount,
      savingsRate,
      budgetSummary.overBudgetCount
    );
  }, [
    monthlyIncome,
    monthlyExpenses,
    activePayableDebts.length,
    totalDebtAmount,
    savingsRate,
    budgetSummary.overBudgetCount,
  ]);

  if (!isOpen) return null;

  const currentMethod =
    BUDGETING_METHODS.find((m) => m.id === activeMethodId) || BUDGETING_METHODS[0];

  const baseIncome = monthlyIncome > 0 ? monthlyIncome : (settings.monthlyIncomeTarget || 3_000_000);

  const handleApply = (methodId: BudgetingMethodType) => {
    applyBudgetingMethod(methodId);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  // Sort debts for Snowball (smallest remaining amount first) vs Avalanche (dueDate / largest urgency)
  const snowballDebts = [...activePayableDebts].sort((a, b) => a.remainingAmount - b.remainingAmount);
  const avalancheDebts = [...activePayableDebts].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.remainingAmount - a.remainingAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <PieChart className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Pilihan & Rekomendasi Metode Budgeting
              </h3>
              <p className="text-xs text-neutral-500">
                Pilih sistem alokasi anggaran yang sesuai dengan kondisi dompet & target finansialmu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Smart Recommendation Banner */}
          <div className="p-4 rounded-xl bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Rekomendasi Cerdas Sesuai Kondisi Finansialmu:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px]">
                    {recommendation.recommendedMethod.shortName}
                  </span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveMethodId(recommendation.recommendedMethod.id);
                  handleApply(recommendation.recommendedMethod.id);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <span>Terapkan Rekomendasi Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Method Selection Tabs / Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Pilih Salah Satu dari 6 Metode Populer:
              </label>
              <span className="text-[11px] text-neutral-400">
                Metode aktif saat ini: <strong>{selectedBudgetingMethod || '50_30_20'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {BUDGETING_METHODS.map((m) => {
                const isSelected = activeMethodId === m.id;
                const isCurrentActive = selectedBudgetingMethod === m.id;
                const isRecommended = recommendation.recommendedMethod.id === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMethodId(m.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-neutral-900 truncate">
                          {m.shortName}
                        </span>
                        {isCurrentActive && (
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"
                            title="Sedang diterapkan"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">
                        {m.tagline}
                      </p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                      {isRecommended ? (
                        <span className="text-emerald-700 font-bold">Direkomendasikan</span>
                      ) : (
                        <span className="text-neutral-400">Pilih</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Method Detail Card */}
          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-neutral-900">{currentMethod.name}</h4>
                  {selectedBudgetingMethod === currentMethod.id && (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Sedang Aktif di Anggaran
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">{currentMethod.tagline}</p>
              </div>

              <button
                type="button"
                onClick={() => handleApply(currentMethod.id)}
                disabled={appliedSuccess}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors"
              >
                {appliedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Berhasil Diterapkan!</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Terapkan ke Pos Anggaran Saya</span>
                  </>
                )}
              </button>
            </div>

            {/* Explanation & Philosophy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-neutral-200/80">
                <span className="font-bold text-neutral-800 block">Cara Kerja Metode:</span>
                <p className="text-neutral-600 leading-relaxed">{currentMethod.description}</p>
                <div className="pt-2 text-[11px] text-neutral-500">
                  <strong>Filosofi:</strong> <em>"{currentMethod.philosophy}"</em>
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-white rounded-xl border border-neutral-200/80">
                <div>
                  <span className="font-bold text-neutral-800 block">Paling Cocok Untuk:</span>
                  <p className="text-neutral-600 leading-relaxed mt-0.5">{currentMethod.idealFor}</p>
                </div>
                <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-950 font-medium">
                  💡 <strong>Pro-Tip Mahasiswa:</strong> {currentMethod.proTip}
                </div>
              </div>
            </div>

            {/* Proportional Visual Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                <span>Distribusi Alokasi Berdasarkan Pemasukan ({formatIDR(baseIncome)})</span>
                <span className="font-mono text-neutral-500">Total: 100%</span>
              </div>

              {/* Combined Progress Bar */}
              <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden flex shadow-inner">
                {currentMethod.allocations.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="h-full transition-all duration-300 relative group"
                    style={{
                      width: `${alloc.percentage}%`,
                      backgroundColor: alloc.color,
                    }}
                    title={`${alloc.name}: ${alloc.percentage}% (${formatIDR((baseIncome * alloc.percentage) / 100)})`}
                  />
                ))}
              </div>

              {/* Allocation Items Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                {currentMethod.allocations.map((alloc, idx) => {
                  const nominal = Math.round((baseIncome * alloc.percentage) / 100);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-neutral-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: alloc.color }}
                          />
                          <span className="font-bold text-neutral-900 truncate">
                            {alloc.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-neutral-700">
                          {alloc.percentage}%
                        </span>
                      </div>

                      <div className="text-sm font-bold text-neutral-900 tabular-nums">
                        {formatIDR(nominal)}
                      </div>

                      <p className="text-[11px] text-neutral-500 leading-snug">
                        {alloc.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Debt Specific Queue Simulator (Snowball vs Avalanche) */}
            {currentMethod.isDebtFocused && (
              <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h5 className="text-xs font-bold text-neutral-900">
                      Simulasi Urutan Eksekusi Pelunasan Utang:
                    </h5>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Total: {formatIDR(totalDebtAmount)} ({activePayableDebts.length} pinjaman)
                  </span>
                </div>

                {activePayableDebts.length === 0 ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    🎉 Kamu tidak memiliki catatan utang aktif saat ini! Sangat hebat. Kamu bisa memilih metode 50/30/20 atau 6 Jars untuk mempercepat tabungan.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {(currentMethod.id === 'debt_snowball' ? snowballDebts : avalancheDebts).map(
                      (debt, rank) => (
                        <div
                          key={debt.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-neutral-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                              {rank + 1}
                            </span>
                            <div>
                              <span className="font-bold text-neutral-900">{debt.title}</span>
                              <span className="text-[11px] text-neutral-500 block">
                                Pihak: {debt.personName} · Jatuh tempo: {debt.dueDate}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-rose-700 tabular-nums">
                              {formatIDR(debt.remainingAmount)}
                            </span>
                            <span className="block text-[10px] text-neutral-400">
                              {rank === 0 ? 'Target Utama (Agresif)' : 'Bayar Minimum'}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Mengubah metode akan memperbarui plafon kategori di menu <strong>Anggaran Bulanan</strong> tanpa menghapus catatan transaksi riilmu.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
