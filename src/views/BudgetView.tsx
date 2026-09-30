import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ExpenseCategory } from '../types/finance';
import {
  PieChart,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Settings2,
} from 'lucide-react';
import { formatIDR } from '../utils/formatters';
import { BudgetEditModal } from '../components/modals/BudgetEditModal';
import { BudgetingMethodsModal } from '../components/budget/BudgetingMethodsModal';
import { AutoCalculator503020 } from '../components/budget/AutoCalculator503020';
import { BUDGETING_METHODS } from '../data/budgetingMethods';
import { InteractiveBudgetChart } from '../components/charts/InteractiveBudgetChart';

export const BudgetView: React.FC = () => {
  const { budgetSummary, activeMonth, selectedBudgetingMethod, monthlyIncome, needsVsWants } = useFinance();

  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [selectedLimit, setSelectedLimit] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMethodsModalOpen, setIsMethodsModalOpen] = useState(false);

  const activeMethodDef =
    BUDGETING_METHODS.find((m) => m.id === selectedBudgetingMethod) || BUDGETING_METHODS[0];

  const handleEditBudget = (category: ExpenseCategory, currentLimit: number) => {
    setSelectedCategory(category);
    setSelectedLimit(currentLimit);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
            Anggaran Bulanan Mahasiswa
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Batas pengeluaran per kategori untuk bulan {activeMonth}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsMethodsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rekomendasi & Metode Budgeting</span>
          </button>

          {/* Status badges indicator explanation */}
          <div className="hidden sm:flex items-center gap-3 text-xs pl-2 border-l border-neutral-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-neutral-600">&lt; 70%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-neutral-600">70–90%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-neutral-600">&gt; 90%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Budgeting Method Banner */}
      <div className="p-4 rounded-xl bg-linear-to-r from-emerald-50/90 via-teal-50/70 to-neutral-50 border border-emerald-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-600 text-white font-bold shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Metode Aktif:</span>
              <strong className="text-neutral-900 font-bold">{activeMethodDef.name}</strong>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[10px]">
                {activeMethodDef.shortName}
              </span>
            </div>
            <p className="text-neutral-600 mt-0.5 text-[11px] leading-relaxed">
              {activeMethodDef.tagline} — {activeMethodDef.idealFor}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMethodsModalOpen(true)}
          className="shrink-0 text-emerald-800 hover:text-emerald-950 font-bold underline text-[11px] flex items-center gap-1"
        >
          <span>Ganti / Sesuaikan Metode</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Total Anggaran Dialokasikan</span>
          <p className="text-lg font-bold text-neutral-900 tabular-nums mt-1">
            {formatIDR(budgetSummary.totalBudget)}
          </p>
          <span className="text-[11px] text-neutral-400">Plafon maksimal belanja</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Total Terpakai Bulan Ini</span>
          <p className="text-lg font-bold text-rose-700 tabular-nums mt-1">
            {formatIDR(budgetSummary.totalSpent)}
          </p>
          <span className="text-[11px] text-neutral-400">
            {Math.round(budgetSummary.overallPercentage)}% dari total limit
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Sisa Anggaran Tersedia</span>
          <p
            className={`text-lg font-bold tabular-nums mt-1 ${
              budgetSummary.totalRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatIDR(budgetSummary.totalRemaining)}
          </p>
          <span className="text-[11px] text-neutral-400">
            {budgetSummary.totalRemaining >= 0 ? 'Masih dalam batas aman' : 'Melebihi anggaran total!'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Kategori Over-Budget</span>
          <p
            className={`text-lg font-bold tabular-nums mt-1 ${
              budgetSummary.overBudgetCount > 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {budgetSummary.overBudgetCount} Kategori
          </p>
          <span className="text-[11px] text-neutral-400">
            {budgetSummary.overBudgetCount === 0 ? 'Semua pos terkendali' : 'Perlu evaluasi pengeluaran'}
          </span>
        </div>
      </div>

      {/* Interactive Budget Chart with Filter and Utilization Ring */}
      <InteractiveBudgetChart
        budgetSummary={budgetSummary}
        onEditCategory={handleEditBudget}
        onOpenMethodsModal={() => setIsMethodsModalOpen(true)}
      />

      {/* Auto Calculator 50/30/20 Component */}
      <AutoCalculator503020 />

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetSummary.items.map((item) => {
          const isOver = item.remaining < 0;
          return (
            <div
              key={item.category}
              className={`bg-white rounded-xl border p-4.5 shadow-xs flex flex-col justify-between transition-all ${
                item.status === 'red'
                  ? 'border-rose-300 bg-rose-50/20'
                  : item.status === 'yellow'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-neutral-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-900">{item.category}</h4>
                  <button
                    onClick={() => handleEditBudget(item.category, item.monthlyLimit)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    title="Ubah batas anggaran"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <span className="text-neutral-500">Terpakai:</span>
                  <span className="font-bold text-neutral-900 tabular-nums">
                    {formatIDR(item.spent)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs mt-1">
                  <span className="text-neutral-500">Plafon:</span>
                  <span className="font-medium text-neutral-700 tabular-nums">
                    {formatIDR(item.monthlyLimit)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'red'
                        ? 'bg-rose-500'
                        : item.status === 'yellow'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, item.percentageUsed)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500">
                  {isOver ? 'Melebihi Anggaran:' : 'Sisa Kuota:'}
                </span>
                <span
                  className={`font-bold tabular-nums ${
                    isOver
                      ? 'text-rose-600'
                      : item.status === 'yellow'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {formatIDR(item.remaining)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <BudgetEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={selectedCategory}
        currentLimit={selectedLimit}
      />

      {/* Budgeting Methods & Recommendation Modal */}
      <BudgetingMethodsModal
        isOpen={isMethodsModalOpen}
        onClose={() => setIsMethodsModalOpen(false)}
      />
    </div>
  );
};
