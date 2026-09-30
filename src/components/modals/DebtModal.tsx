import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Debt } from '../../types/finance';
import { X } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToPay?: Debt | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debtToPay,
}) => {
  const { addDebt, recordDebtPayment } = useFinance();

  // Mode: if debtToPay is provided, it's payment mode. Else it's add new debt mode.
  const isPaymentMode = Boolean(debtToPay);

  // New debt fields
  const [title, setTitle] = useState('');
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [principalAmountStr, setPrincipalAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('2026-10-15');
  const [notes, setNotes] = useState('');

  // Payment fields
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmountStr.replace(/[^0-9]/g, ''));
    if (!title.trim() || !personName.trim()) {
      setError('Judul dan nama pihak harus diisi');
      return;
    }
    if (isNaN(principal) || principal <= 0) {
      setError('Nominal harus lebih dari Rp 0');
      return;
    }

    addDebt({
      title: title.trim(),
      personName: personName.trim(),
      type,
      principalAmount: principal,
      dueDate,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtToPay) return;
    const amount = parseFloat(payAmountStr.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setError('Nominal pembayaran harus lebih dari Rp 0');
      return;
    }
    if (amount > debtToPay.remainingAmount) {
      setError(`Maksimal pelunasan adalah ${formatIDR(debtToPay.remainingAmount)}`);
      return;
    }

    recordDebtPayment(debtToPay.id, amount, payNotes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {isPaymentMode ? 'Catat Cicilan / Pelunasan' : 'Tambah Catatan Utang / Piutang'}
            </h3>
            {isPaymentMode && debtToPay && (
              <p className="text-xs text-neutral-500">{debtToPay.title} ({debtToPay.personName})</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isPaymentMode && debtToPay ? (
          <form onSubmit={handlePaySubmit} className="p-5 space-y-4">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs flex justify-between items-center">
              <span className="text-neutral-500">Sisa Tagihan:</span>
              <span className="font-bold text-neutral-900 tabular-nums">
                {formatIDR(debtToPay.remainingAmount)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nominal Bayar / Terima (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  max={debtToPay.remainingAmount}
                  value={payAmountStr}
                  onChange={(e) => {
                    setPayAmountStr(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-base font-bold text-neutral-900 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => setPayAmountStr(String(debtToPay.remainingAmount))}
                className="mt-1.5 text-xs text-emerald-700 hover:underline font-medium"
              >
                Bayar lunas seluruhnya ({formatIDR(debtToPay.remainingAmount)})
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Contoh: Transfer via GoPay / QRIS"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
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
                Catat Pembayaran
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('payable')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  type === 'payable'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Utang Saya (Wajib Bayar)
              </button>
              <button
                type="button"
                onClick={() => setType('receivable')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  type === 'receivable'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Piutang (Teman Berutang)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Keterangan / Keperluan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Talangan beli buku, uang makan kas, dll."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {type === 'payable' ? 'Nama Pemberi Pinjaman' : 'Nama Teman yang Berutang'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Contoh: Rian, Dimas, atau Koperasi Mahasiswa"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={principalAmountStr}
                  onChange={(e) => setPrincipalAmountStr(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Jatuh Tempo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan pelunasan atau kesepakatan"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
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
                Simpan Catatan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
