import React, { useState, useMemo } from 'react';
import { BudgetSummary, CategoryBudgetStatus, ExpenseCategory } from '../../types/finance';
import { formatIDR, formatPercent } from '../../utils/formatters';
import { Target, AlertTriangle, CheckCircle2, Edit2, Filter, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface InteractiveBudgetChartProps {
  budgetSummary: BudgetSummary;
  onEditCategory?: (category: ExpenseCategory, currentLimit: number) => void;
  onOpenMethodsModal?: () => void;
}

export const InteractiveBudgetChart: React.FC<InteractiveBudgetChartProps> = ({
  budgetSummary,
  onEditCategory,
  onOpenMethodsModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');

  const filteredItems = useMemo(() => {
    return budgetSummary.items.filter((item: CategoryBudgetStatus) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'safe') return item.status === 'green';
      if (filterStatus === 'warning') return item.status === 'yellow';
      if (filterStatus === 'danger') return item.status === 'red';
      return true;
    });
  }, [budgetSummary.items, filterStatus]);

  // Overall completion ring
  const overallPct = Math.min(100, Math.round(budgetSummary.overallPercentage));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-5 md:p-6 space-y-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Grafik Realisasi & Pemantauan Anggaran
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Interaktif
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Pantau rasio plafon anggaran vs realisasi pengeluaran tiap kategori
          </p>
        </div>

        {onOpenMethodsModal && (
          <button
            onClick={onOpenMethodsModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200 shadow-2xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kalkulator & Metode Budgeting</span>
          </button>
        )}
      </div>

      {/* Overview Gauge & Status Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Overall Ring Mini */}
        <div className="p-3.5 bg-linear-to-br from-neutral-50 to-white rounded-2xl border border-neutral-200/80 flex items-center gap-3.5 shadow-2xs">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={overallPct > 90 ? '#ef4444' : overallPct >= 70 ? '#f59e0b' : '#10b981'}
                strokeWidth="3.5"
                strokeDasharray={`${overallPct}, 100`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-neutral-900 tabular-nums">
              {overallPct}%
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 block font-semibold">Realisasi Total</span>
            <span className="text-xs font-bold text-neutral-900 block truncate tabular-nums">
              {formatIDR(budgetSummary.totalSpent)}
            </span>
            <span className="text-[10px] text-neutral-500 truncate block">
              dari {formatIDR(budgetSummary.totalBudget)}
            </span>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="md:col-span-3 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'all'
                ? 'bg-neutral-900 text-white shadow-2xs font-bold'
                : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Semua ({budgetSummary.items.length})
          </button>

          <button
            onClick={() => setFilterStatus('safe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterStatus === 'safe'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aman ({budgetSummary.items.filter((i: CategoryBudgetStatus) => i.status === 'green').length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterStatus === 'warning'
                ? 'bg-amber-500 text-white shadow-2xs font-bold'
                : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Waspada ({budgetSummary.items.filter((i: CategoryBudgetStatus) => i.status === 'yellow').length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('danger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterStatus === 'danger'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'bg-rose-50/70 text-rose-800 hover:bg-rose-100 border border-rose-200/80'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Over-Budget ({budgetSummary.overBudgetCount})</span>
          </button>
        </div>
      </div>

      {/* Category Budget Bars Grid */}
      <div className="space-y-3 pt-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-400 bg-neutral-50/50 rounded-2xl border border-neutral-100">
            Tidak ada kategori pada status filter ini.
          </div>
        ) : (
          filteredItems.map((item: CategoryBudgetStatus) => {
            const isOver = item.remaining < 0;
            const pct = Math.round(item.percentageUsed);

            return (
              <div
                key={item.category}
                className={`p-3.5 rounded-2xl border transition-all hover-lift ${
                  item.status === 'red'
                    ? 'border-rose-300/80 bg-linear-to-r from-rose-50/30 to-white shadow-2xs'
                    : item.status === 'yellow'
                    ? 'border-amber-300/80 bg-linear-to-r from-amber-50/30 to-white'
                    : 'border-neutral-200/80 bg-linear-to-r from-neutral-50/40 to-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-neutral-900 truncate">{item.category}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'red'
                          ? 'bg-rose-100 text-rose-800'
                          : item.status === 'yellow'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-neutral-500 text-[11px] font-medium">
                      <strong className="text-neutral-900">{formatIDR(item.spent)}</strong>{' '}
                      <span className="text-neutral-400">/</span> {formatIDR(item.monthlyLimit)}
                    </span>
                    {onEditCategory && (
                      <button
                        onClick={() => onEditCategory(item.category, item.monthlyLimit)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Ubah Anggaran Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar with vibrant gradient fill */}
                <div className="relative w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'red'
                        ? 'bg-linear-to-r from-rose-500 to-red-600'
                        : item.status === 'yellow'
                        ? 'bg-linear-to-r from-amber-400 to-orange-500'
                        : 'bg-linear-to-r from-emerald-500 to-teal-600'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                {/* Bottom Sisa / Over label */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1.5">
                  <span>
                    {isOver ? (
                      <strong className="text-rose-600 font-semibold">
                        ⚠️ Melebihi Anggaran: {formatIDR(Math.abs(item.remaining))}
                      </strong>
                    ) : (
                      <span>
                        Sisa Plafon:{' '}
                        <strong
                          className={
                            item.status === 'yellow' ? 'text-amber-700' : 'text-emerald-700'
                          }
                        >
                          {formatIDR(item.remaining)}
                        </strong>
                      </span>
                    )}
                  </span>
                  <span className="text-neutral-400 text-[10px]">
                    {isOver ? 'Perlu evaluasi' : pct >= 70 ? 'Gunakan hemat' : 'Terkendali'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
