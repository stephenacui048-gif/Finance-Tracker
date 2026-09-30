import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ArrowRight, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromId?: string;
  defaultToId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  defaultFromId,
  defaultToId,
}) => {
  const { accounts, transferBetweenAccounts } = useFinance();

  const [fromAccountId, setFromAccountId] = useState<string>(
    defaultFromId || (accounts.length > 0 ? accounts[0].id : '')
  );
  const [toAccountId, setToAccountId] = useState<string>(
    defaultToId || (accounts.length > 1 ? accounts[1].id : '')
  );
  const [amountStr, setAmountStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>('2026-09-25');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  const numericAmount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;

  const quickPresets = [25_000, 50_000, 100_000, 200_000, 500_000];

  const handleSwap = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setErrorMessage('Pilih akun asal dan akun tujuan transfer.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMessage('Akun asal dan akun tujuan tidak boleh sama.');
      return;
    }
    if (numericAmount <= 0) {
      setErrorMessage('Masukkan nominal transfer yang valid.');
      return;
    }
    if (fromAccount && fromAccount.balance < numericAmount) {
      setErrorMessage(`Saldo ${fromAccount.name} tidak mencukupi (${formatIDR(fromAccount.balance)}).`);
      return;
    }

    transferBetweenAccounts(
      fromAccountId,
      toAccountId,
      numericAmount,
      notes || `Transfer dari ${fromAccount?.name} ke ${toAccount?.name}`,
      date
    );

    // Reset & close
    setAmountStr('');
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Pindah Dana / Transfer</h3>
              <p className="text-[11px] text-neutral-500">Pindahkan saldo antar dompet atau rekeningmu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account From and To Selector with Swap */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
              {/* From Account */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 block">
                  Dari Akun / Dompet
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-neutral-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.balance)})
                    </option>
                  ))}
                </select>
                {fromAccount && (
                  <span className="text-[10px] text-neutral-500 block truncate">
                    Saldo: <strong className="text-neutral-800">{formatIDR(fromAccount.balance)}</strong>
                  </span>
                )}
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex justify-center py-1 sm:py-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 shadow-2xs transition-colors"
                  title="Tukar akun asal dan tujuan"
                >
                  <ArrowRight className="w-3.5 h-3.5 sm:rotate-0 rotate-90" />
                </button>
              </div>

              {/* To Account */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-neutral-600 block">
                  Ke Akun Tujuan
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border border-neutral-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatIDR(acc.balance)})
                    </option>
                  ))}
                </select>
                {toAccount && (
                  <span className="text-[10px] text-neutral-500 block truncate">
                    Saldo: <strong className="text-neutral-800">{formatIDR(toAccount.balance)}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 block">
              Nominal Transfer
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
                Rp
              </span>
              <input
                type="text"
                value={
                  numericAmount > 0
                    ? new Intl.NumberFormat('id-ID').format(numericAmount)
                    : ''
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(raw);
                  setErrorMessage('');
                }}
                placeholder="0"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-bold text-neutral-900 tabular-nums"
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmountStr(String(val));
                    setErrorMessage('');
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                    numericAmount === val
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {formatIDR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600 block">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600 block">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tarik tunai ATM, Topup GoPay"
                className="w-full text-xs p-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Konfirmasi Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
