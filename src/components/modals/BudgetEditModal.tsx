import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategory } from '../../types/finance';
import { X } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

interface BudgetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ExpenseCategory | null;
  currentLimit: number;
}

export const BudgetEditModal: React.FC<BudgetEditModalProps> = ({
  isOpen,
  onClose,
  category,
  currentLimit,
}) => {
  const { setBudgetLimit } = useFinance();
  const [limitStr, setLimitStr] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (category) {
      setLimitStr(String(currentLimit));
    }
    setError('');
  }, [category, currentLimit, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitStr.replace(/[^0-9]/g, ''));
    if (isNaN(limit) || limit < 0) {
      setError('Nominal batas anggaran tidak valid');
      return;
    }

    setBudgetLimit(category, limit);
    onClose();
  };

  const quickAmounts = [100_000, 200_000, 500_000, 1_000_000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Atur Anggaran Bulanan</h3>
            <p className="text-xs text-neutral-500">Kategori: {category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Batas Maksimal Pengeluaran (Rp / Bulan)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                Rp
              </span>
              <input
                type="number"
                min="0"
                required
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 text-base font-bold text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setLimitStr(String(val))}
                  className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors tabular-nums"
                >
                  {formatIDR(val).replace('Rp ', '')}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              Simpan Anggaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
