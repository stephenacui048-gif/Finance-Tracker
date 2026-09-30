import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  TransactionType,
  ExpenseCategory,
  IncomeSource,
  PaymentMethod,
  ExpenseClassification,
  SpendingMood,
} from '../../types/finance';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Check,
  ArrowLeftRight,
  Wallet,
  AlertCircle,
  Calendar,
  Camera,
  Sparkles,
} from 'lucide-react';
import { formatIDR, getTodayDateString } from '../../utils/formatters';
import { ReceiptScannerModal, ScannedReceiptData } from './ReceiptScannerModal';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const {
    addTransaction,
    savingGoals,
    contributeToGoal,
    accounts,
    transferBetweenAccounts,
  } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>('Makanan');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts.find((a) => a.isDefault)?.id || (accounts[0]?.id ?? '')
  );
  const [fromAccountId, setFromAccountId] = useState<string>(
    accounts[0]?.id ?? ''
  );
  const [toAccountId, setToAccountId] = useState<string>(
    accounts[1]?.id ?? (accounts[0]?.id ?? '')
  );
  const [classification, setClassification] = useState<ExpenseClassification>('need');
  const [mood, setMood] = useState<SpendingMood>('rational');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    savingGoals.length > 0 ? savingGoals[0].id : ''
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayDateString());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const expenseCategories: ExpenseCategory[] = [
    'Makanan',
    'Kos',
    'Listrik/Air',
    'Internet/Pulsa',
    'Transportasi',
    'Pendidikan',
    'Kesehatan',
    'Nongkrong',
    'Shopping',
    'Entertainment',
    'Subscription',
    'Investasi',
    'Pembayaran Utang',
    'Lainnya',
  ];

  const incomeSources: IncomeSource[] = [
    'Uang Saku',
    'Kiriman Orang Tua',
    'Beasiswa',
    'Part-Time',
    'Freelance',
    'Organisasi/Event',
    'Bonus',
    'Lainnya',
  ];

  const paymentMethods: PaymentMethod[] = [
    'QRIS',
    'GoPay',
    'ShopeePay',
    'OVO',
    'DANA',
    'Tunai',
    'Transfer Bank',
    'Kartu Debit',
  ];

  const quickPresets = [15_000, 25_000, 50_000, 100_000, 250_000, 500_000];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrorMessage('');
    if (newType === 'expense') {
      setCategory('Makanan');
    } else if (newType === 'income') {
      setCategory('Kiriman Orang Tua');
    } else if (newType === 'savings_transfer') {
      setCategory('Tabungan');
    }
  };

  const handlePresetClick = (val: number) => {
    setAmountStr(String(val));
    setErrorMessage('');
  };

  const handleApplyScannedData = (data: ScannedReceiptData) => {
    setType('expense');
    setAmountStr(String(data.totalAmount));
    if (data.category) setCategory(data.category);
    if (data.date) setDate(data.date);
    const itemSummary = data.items && data.items.length > 0 ? ` (${data.items.slice(0, 3).join(', ')})` : '';
    setNotes(`${data.merchant}${itemSummary}`);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountStr.replace(/[^0-9]/g, ''));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Nominal harus lebih dari Rp 0');
      return;
    }

    if (!date) {
      setErrorMessage('Tanggal harus diisi');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        setErrorMessage('Pilih akun asal dan akun tujuan');
        return;
      }
      if (fromAccountId === toAccountId) {
        setErrorMessage('Akun asal dan akun tujuan tidak boleh sama');
        return;
      }
      transferBetweenAccounts(
        fromAccountId,
        toAccountId,
        numericAmount,
        notes || undefined,
        date
      );
    } else if (type === 'savings_transfer') {
      if (!selectedGoalId) {
        setErrorMessage('Pilih target tabungan tujuan');
        return;
      }
      contributeToGoal(selectedGoalId, numericAmount, 'deposit', notes || 'Setoran Tabungan');
    } else {
      addTransaction({
        date,
        type,
        amount: numericAmount,
        category,
        paymentMethod,
        accountId: selectedAccountId || undefined,
        classification: type === 'expense' ? classification : undefined,
        mood: type === 'expense' ? mood : undefined,
        notes: notes.trim() || undefined,
      });
    }

    // Reset & close
    setAmountStr('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900">Catat Transaksi Baru</h3>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              title="Pindai struk/resi kasir secara otomatis (OCR)"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scan Resi</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Segmented Type Control */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('savings_transfer')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'savings_transfer'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Tabungan</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'transfer'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Nominal (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-neutral-500">
                Rp
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 text-lg font-bold text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent tabular-nums"
                autoFocus
              />
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickPresets.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handlePresetClick(val)}
                  className="px-2.5 py-1 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors tabular-nums"
                >
                  +{formatIDR(val).replace('Rp ', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Accounts Selectors */}
          {type === 'transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Dari Dompet / Rekening
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold rounded-lg border border-neutral-300 bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatIDR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Ke Dompet / Rekening Tujuan
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2 text-xs font-semibold rounded-lg border border-neutral-300 bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatIDR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Wallet / Account Selection for Expense & Income */}
          {(type === 'expense' || type === 'income') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                {type === 'expense' ? 'Dibayar Dari Dompet / Akun:' : 'Masuk Ke Dompet / Akun:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      if (acc.name.includes('GoPay')) setPaymentMethod('GoPay');
                      else if (acc.name.includes('Shopee')) setPaymentMethod('ShopeePay');
                      else if (acc.name.includes('DANA')) setPaymentMethod('DANA');
                      else if (acc.type === 'cash') setPaymentMethod('Tunai');
                      else if (acc.type === 'bank') setPaymentMethod('Transfer Bank');
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                      selectedAccountId === acc.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="truncate">{acc.name}</span>
                    <span className="text-[10px] text-neutral-500 ml-1 font-mono">
                      {formatIDR(acc.balance).replace('Rp ', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Savings Goal Target (Only if savings_transfer) */}
          {type === 'savings_transfer' ? (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Pilih Target Tabungan <span className="text-rose-500">*</span>
              </label>
              {savingGoals.length === 0 ? (
                <p className="text-xs text-rose-600">
                  Belum ada target tabungan dibuat. Silakan buat target di menu 'Target Tabungan' terlebih dahulu.
                </p>
              ) : (
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {savingGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Terkumpul: {formatIDR(g.currentAmount)} / {formatIDR(g.targetAmount)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : type !== 'transfer' ? (
            <>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Kategori {type === 'expense' ? 'Pengeluaran' : 'Sumber Pemasukan'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {type === 'expense'
                    ? expenseCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    : incomeSources.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                </select>
              </div>

              {/* Need vs Want toggle (Only for expense) */}
              {type === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Klasifikasi Pengeluaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClassification('need')}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                        classification === 'need'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-semibold'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${classification === 'need' ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Kebutuhan Pokok (Needs)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClassification('want')}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                        classification === 'want'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-semibold'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${classification === 'want' ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Keinginan / Gaya Hidup (Wants)</span>
                    </button>
                  </div>

                  {/* 11. Emotional & Mood Tagging */}
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Alasan / Emosi Belanja (Analisis Psikologi Finansial)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { id: 'rational', label: '🧠 Rasional', desc: 'Memang butuh' },
                        { id: 'impulsive', label: '🍔 Lapar Mata', desc: 'Spontan / promo' },
                        { id: 'stress', label: '😫 Stres Kuliah', desc: 'Pelampiasan tugas' },
                        { id: 'reward', label: '🎉 Self-Reward', desc: 'Hadiah pencapaian' },
                        { id: 'fomo', label: '👥 FOMO Teman', desc: 'Ikut-ikutan gaul' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMood(m.id as SpendingMood)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            mood === m.id
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="text-xs block">{m.label}</span>
                          <span className="text-[10px] text-neutral-500 font-normal">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {paymentMethods.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                        paymentMethod === m
                          ? 'bg-neutral-900 text-white font-medium'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {/* Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tanggal Transaksi (Otomatis Hari Ini)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateString())}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-colors ${
                    date === getTodayDateString()
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
                    setDate(yStr);
                  }}
                  className="px-2 py-0.5 text-[11px] rounded-md font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  Kemarin
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Makan siang warteg, Top up ShopeePay"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Transaksi</span>
            </button>
          </div>
        </form>
      </div>

      {/* 6. Receipt Scanner OCR Modal */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyScannedData={handleApplyScannedData}
      />
    </div>
  );
};
