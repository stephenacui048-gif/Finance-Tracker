import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SavingGoal } from '../types/finance';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Shield,
  Laptop,
  Award,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { formatIDR, formatDateID } from '../utils/formatters';
import { calculateGoalMetrics } from '../utils/calculations';
import { GoalEditModal } from '../components/modals/GoalEditModal';
import { GoalContributionModal } from '../components/modals/GoalContributionModal';

export const SavingGoalsView: React.FC = () => {
  const { savingGoals, deleteSavingGoal, transactions } = useFinance();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoalToEdit, setSelectedGoalToEdit] = useState<SavingGoal | null>(null);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<SavingGoal | null>(null);

  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null);
  const [expandedGoalHistory, setExpandedGoalHistory] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setSelectedGoalToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingGoal) => {
    setSelectedGoalToEdit(goal);
    setIsEditModalOpen(true);
  };

  const handleOpenContribute = (goal: SavingGoal) => {
    setSelectedGoalForContribution(goal);
    setIsContributionModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (goalToDelete) {
      deleteSavingGoal(goalToDelete.id);
      setGoalToDelete(null);
    }
  };

  const getGoalIcon = (icon: string) => {
    switch (icon) {
      case 'laptop':
        return <Laptop className="w-5 h-5 text-sky-600" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-emerald-600" />;
      case 'award':
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Target className="w-5 h-5 text-indigo-600" />;
    }
  };

  // Total savings across all goals
  const totalSaved = savingGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = savingGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
            Target Tabungan (Saving Goals)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Rencanakan dana darurat, laptop, sertifikasi, dan impian mahasiswa
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Target Baru</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Total Saldo Terkumpul di Tabungan</span>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
            {formatIDR(totalSaved)}
          </p>
          <span className="text-[11px] text-neutral-400">Di {savingGoals.length} target aktif</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Total Akumulasi Target</span>
          <p className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
            {formatIDR(totalTarget)}
          </p>
          <span className="text-[11px] text-neutral-400">Total impian yang dituju</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs text-neutral-500">Sisa yang Perlu Ditabung</span>
          <p className="text-xl font-bold text-neutral-800 tabular-nums mt-1">
            {formatIDR(totalRemaining)}
          </p>
          <span className="text-[11px] text-neutral-400">
            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% telah terkumpul
          </span>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {savingGoals.map((goal) => {
          const metrics = calculateGoalMetrics(goal, '2026-09-25');
          const isDone = goal.currentAmount >= goal.targetAmount;

          // Goal transactions history
          const goalHistory = transactions.filter(
            (t) => t.goalId === goal.id || (t.notes && t.notes.includes(goal.name))
          );

          const isExpanded = expandedGoalHistory === goal.id;

          return (
            <div
              key={goal.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4 transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                    {getGoalIcon(goal.categoryIcon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900">{goal.name}</h3>
                      {goal.isEmergencyFund && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Dana Darurat
                        </span>
                      )}
                      {metrics.isOnTrack ? (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          On-Track
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Perlu Kejar
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">{goal.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenContribute(goal)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                  >
                    <span>Setor / Tarik</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
                    title="Ubah Target"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGoalToDelete(goal)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Hapus Target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-neutral-500">
                    Terkumpul: <strong className="text-neutral-900 tabular-nums">{formatIDR(goal.currentAmount)}</strong> dari {formatIDR(goal.targetAmount)}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                    {metrics.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-emerald-600' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${metrics.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Calculated Metrics Grid (Monthly & Daily Requirement) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50/70 rounded-lg border border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-500 text-[11px] block">Sisa Dibutuhkan</span>
                  <span className="font-bold text-neutral-900 tabular-nums">
                    {formatIDR(metrics.remainingAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Target Tanggal</span>
                  <span className="font-semibold text-neutral-800 tabular-nums">
                    {formatDateID(goal.targetDate, 'short')} ({metrics.diffMonths} bln)
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Wajib Nabung/Bulan</span>
                  <span className="font-bold text-emerald-800 tabular-nums">
                    {formatIDR(metrics.requiredMonthly)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[11px] block">Ekuivalen Nabung/Hari</span>
                  <span className="font-semibold text-neutral-700 tabular-nums">
                    {formatIDR(metrics.requiredDaily)}/hari
                  </span>
                </div>
              </div>

              {/* Transaction History for this goal accordion */}
              <div className="pt-1">
                <button
                  onClick={() => setExpandedGoalHistory(isExpanded ? null : goal.id)}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  <span>Riwayat Mutasi Tabungan ({goalHistory.length})</span>
                </button>

                {isExpanded && (
                  <div className="mt-2.5 divide-y divide-neutral-100 bg-neutral-50/40 rounded-lg p-3 border border-neutral-100">
                    {goalHistory.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-1">Belum ada riwayat setoran tercatat.</p>
                    ) : (
                      goalHistory.map((h) => (
                        <div key={h.id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium text-neutral-900">{h.notes || 'Setoran Tabungan'}</span>
                            <span className="block text-[10px] text-neutral-400">{formatDateID(h.date, 'medium')}</span>
                          </div>
                          <span className={`font-bold tabular-nums ${h.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {h.amount >= 0 ? '+' : ''}{formatIDR(h.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <GoalEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        goalToEdit={selectedGoalToEdit}
      />

      <GoalContributionModal
        goal={selectedGoalForContribution}
        onClose={() => {
          setIsContributionModalOpen(false);
          setSelectedGoalForContribution(null);
        }}
      />

      {/* Delete Goal Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Hapus Target Tabungan?</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{goalToDelete.name}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Target ini akan dihapus dari daftar pencapaian. Catatan transaksi riwayat tetap disimpan.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Hapus Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
