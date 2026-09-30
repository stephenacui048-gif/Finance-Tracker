import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SavingGoal } from '../../types/finance';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

interface GoalContributionModalProps {
  goal: SavingGoal | null;
  onClose: () => void;
}

export const GoalContributionModal: React.FC<GoalContributionModalProps> = ({ goal, onClose }) => {
  const { contributeToGoal } = useFinance();

  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountStr, setAmountStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(/[^0-9]/g, ''));

    if (isNaN(amount) || amount <= 0) {
      setError('Nominal harus lebih dari Rp 0');
      return;
    }

    if (type === 'withdraw' && amount > goal.currentAmount) {
      setError(`Maksimal penarikan adalah saldo target saat ini (${formatIDR(goal.currentAmount)})`);
      return;
    }

    contributeToGoal(goal.id, amount, type, notes.trim() || undefined);
    onClose();
  };

  const quickAmounts = [50_000, 100_000, 200_000, 500_000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {type === 'deposit' ? 'Setor Tabungan' : 'Tarik Tabungan'}
            </h3>
            <p className="text-xs text-neutral-500">{goal.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status bar */}
        <div className="p-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-500">Terkumpul Saat Ini:</span>
            <p className="font-bold text-neutral-900 tabular-nums">{formatIDR(goal.currentAmount)}</p>
          </div>
          <div className="text-right">
            <span className="text-neutral-500">Target Total:</span>
            <p className="font-bold text-neutral-900 tabular-nums">{formatIDR(goal.targetAmount)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Deposit vs Withdraw tabs */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('deposit');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                type === 'deposit'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Setor (Menabung)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('withdraw');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                type === 'withdraw'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tarik Tabungan</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                Rp
              </span>
              <input
                type="number"
                min="1"
                required
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setError('');
                }}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 text-base font-bold text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                autoFocus
              />
            </div>

            {/* Quick preset buttons */}
            <div className="flex gap-1.5 mt-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(String(val))}
                  className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors tabular-nums"
                >
                  +{formatIDR(val).replace('Rp ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={type === 'deposit' ? 'Misal: Sisa uang jajan minggu ini' : 'Misal: Keperluan mendadak'}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {type === 'deposit' ? 'Konfirmasi Setoran' : 'Konfirmasi Penarikan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
