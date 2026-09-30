import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringTransaction, ExpenseCategory, IncomeSource, PaymentMethod, ExpenseClassification } from '../types/finance';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Edit2,
  Trash2,
  Check,
  X,
  BellRing,
  Wallet,
  Building2,
  Smartphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatIDR, formatDateID } from '../utils/formatters';

export const RecurringView: React.FC = () => {
  const {
    recurring,
    recurringReminders,
    activeMonth,
    processRecurringEntry,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    accounts,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'income'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<string>('Kos');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [dueDay, setDueDay] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [classification, setClassification] = useState<ExpenseClassification>('need');
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Payment confirmation popup
  const [payingRecurringId, setPayingRecurringId] = useState<string | null>(null);
  const [payUsingAccountId, setPayUsingAccountId] = useState<string>(accounts[0]?.id || '');

  const expenseCategories: ExpenseCategory[] = [
    'Kos',
    'Listrik/Air',
    'Internet/Pulsa',
    'Subscription',
    'Makanan',
    'Transportasi',
    'Pendidikan',
    'Kesehatan',
    'Pembayaran Utang',
    'Lainnya',
  ];

  const incomeSources: IncomeSource[] = [
    'Kiriman Orang Tua',
    'Part-Time',
    'Beasiswa',
    'Freelance',
    'Uang Saku',
    'Bonus',
    'Lainnya',
  ];

  // Summary Metrics
  const summary = useMemo(() => {
    let totalExpenseMonthly = 0;
    let totalIncomeMonthly = 0;
    let unpaidBillsCount = 0;
    let unpaidBillsAmount = 0;

    recurringReminders.forEach((r) => {
      if (r.recurring.type === 'expense') {
        totalExpenseMonthly += r.recurring.amount;
        if (!r.isPaidThisMonth) {
          unpaidBillsCount++;
          unpaidBillsAmount += r.recurring.amount;
        }
      } else {
        totalIncomeMonthly += r.recurring.amount;
      }
    });

    return { totalExpenseMonthly, totalIncomeMonthly, unpaidBillsCount, unpaidBillsAmount };
  }, [recurringReminders]);

  // Urgent reminders (due today, overdue, or upcoming within reminder window)
  const urgentReminders = useMemo(() => {
    return recurringReminders.filter(
      (r) =>
        r.recurring.type === 'expense' &&
        !r.isPaidThisMonth &&
        (r.status === 'due_today' || r.status === 'upcoming' || r.status === 'overdue')
    );
  }, [recurringReminders]);

  // Filtered List
  const filteredList = useMemo(() => {
    return recurringReminders.filter((item) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unpaid') return item.recurring.type === 'expense' && !item.isPaidThisMonth;
      if (activeTab === 'paid') return item.isPaidThisMonth;
      if (activeTab === 'income') return item.recurring.type === 'income';
      return true;
    });
  }, [recurringReminders, activeTab]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setAmountStr('');
    setType('expense');
    setCategory('Kos');
    setFrequency('monthly');
    setDueDay(1);
    setPaymentMethod('Transfer Bank');
    setAccountId(accounts[0]?.id || '');
    setClassification('need');
    setReminderDaysBefore(3);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringTransaction) => {
    setEditingItem(rec);
    setTitle(rec.title);
    setAmountStr(String(rec.amount));
    setType(rec.type);
    setCategory(rec.category);
    setFrequency(rec.frequency);
    setDueDay(rec.dueDay);
    setPaymentMethod(rec.paymentMethod || 'Transfer Bank');
    setAccountId(rec.accountId || accounts[0]?.id || '');
    setClassification(rec.classification || 'need');
    setReminderDaysBefore(rec.reminderDaysBefore || 3);
    setNotes(rec.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Judul tagihan tidak boleh kosong.');
      return;
    }
    const num = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (isNaN(num) || num <= 0) {
      setFormError('Nominal harus lebih dari Rp 0.');
      return;
    }

    const dayNum = Math.min(31, Math.max(1, Number(dueDay) || 1));
    const dayPad = String(dayNum).padStart(2, '0');
    const nextDueDate = `${activeMonth}-${dayPad}`;

    if (editingItem) {
      updateRecurring(editingItem.id, {
        title: title.trim(),
        amount: num,
        type,
        category,
        frequency,
        dueDay: dayNum,
        nextDueDate,
        paymentMethod,
        accountId: accountId || undefined,
        classification: type === 'expense' ? classification : undefined,
        reminderDaysBefore,
        notes: notes.trim() || undefined,
      });
    } else {
      addRecurring({
        title: title.trim(),
        amount: num,
        type,
        category,
        frequency,
        dueDay: dayNum,
        nextDueDate,
        paymentMethod,
        accountId: accountId || undefined,
        classification: type === 'expense' ? classification : undefined,
        reminderDaysBefore,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmPay = (recId: string) => {
    processRecurringEntry(recId, payUsingAccountId);
    setPayingRecurringId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-emerald-600" />
            <span>Tagihan Rutin & Pengingat (Recurring)</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Otomatisasi pencatatan uang kos, WiFi, Spotify, dan honor part-time agar tidak pernah lupa atau telat bayar
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tagihan / Transaksi Rutin</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Total Tagihan Bulanan</span>
          <div className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">
            {formatIDR(summary.totalExpenseMonthly)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Pengeluaran terikat rutin per bulan
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Belum Dibayar Bulan Ini</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-amber-600 tabular-nums">
              {formatIDR(summary.unpaidBillsAmount)}
            </span>
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-semibold">
              {summary.unpaidBillsCount} Tagihan
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Sisa kewajiban aktif bulan {activeMonth}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Pemasukan Rutin Tetap</span>
          <div className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">
            {formatIDR(summary.totalIncomeMonthly)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Kiriman ortu, honor aslab, beasiswa
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Status Pengingat</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-neutral-900">
              {urgentReminders.length > 0 ? `${urgentReminders.length} Jatuh Tempo` : 'Aman'}
            </span>
            {urgentReminders.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Notifikasi otomatis H-3 sebelum tanggal jatuh tempo
          </span>
        </div>
      </div>

      {/* Urgent Reminders Alert Card */}
      {urgentReminders.length > 0 && (
        <div className="p-4 rounded-xl bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <BellRing className="w-4 h-4 text-amber-700 animate-bounce" />
              <span>Pengingat Jatuh Tempo Tagihan Bulan Ini ({urgentReminders.length})</span>
            </div>
            <span className="text-[11px] text-amber-800 font-medium">
              Bayar tepat waktu untuk hindari denda atau tunggakan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {urgentReminders.map((item) => {
              const rec = item.recurring;
              return (
                <div
                  key={rec.id}
                  className="p-3 bg-white rounded-lg border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{rec.title}</h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.status === 'due_today'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'overdue'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.status === 'due_today'
                          ? 'Hari Ini!'
                          : item.status === 'overdue'
                          ? 'Terlewat!'
                          : `H-${item.daysDifference}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span className="font-bold text-neutral-900">{formatIDR(rec.amount)}</span>
                      <span>•</span>
                      <span>Tgl {rec.dueDay}</span>
                      <span>•</span>
                      <span className="truncate">{rec.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPayingRecurringId(rec.id);
                      setPayUsingAccountId(rec.accountId || accounts[0]?.id || '');
                    }}
                    className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-2xs"
                  >
                    Bayar & Catat
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `Semua (${recurringReminders.length})` },
            { id: 'unpaid', label: `Belum Dibayar (${summary.unpaidBillsCount})` },
            { id: 'paid', label: `Sudah Dibayar (${recurringReminders.filter((r) => r.isPaidThisMonth).length})` },
            { id: 'income', label: `Pemasukan Rutin (${recurringReminders.filter((r) => r.recurring.type === 'income').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring Cards List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-neutral-200 text-center space-y-2">
            <Clock className="w-8 h-8 text-neutral-300 mx-auto" />
            <h4 className="text-sm font-bold text-neutral-800">Tidak ada transaksi rutin di filter ini</h4>
            <p className="text-xs text-neutral-400">
              Tambahkan tagihan bulanan seperti kos, Spotify, WiFi, atau kiriman ortu agar mudah dipantau.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((item) => {
              const rec = item.recurring;
              const isIncome = rec.type === 'income';
              const isPaid = item.isPaidThisMonth;
              const targetAccount = accounts.find((a) => a.id === rec.accountId);

              return (
                <div
                  key={rec.id}
                  className={`p-4 bg-white rounded-xl border transition-all shadow-2xs space-y-3 ${
                    isPaid
                      ? 'border-neutral-200 opacity-90'
                      : item.status === 'due_today' || item.status === 'overdue'
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl font-bold ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        <CalendarClock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-neutral-900">{rec.title}</h4>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <Check className="w-2.5 h-2.5" />
                              Lunas Bulan Ini
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.status === 'due_today'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : item.status === 'upcoming'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {item.status === 'due_today'
                                ? 'Jatuh Tempo Hari Ini'
                                : item.status === 'overdue'
                                ? 'Terlewat'
                                : item.status === 'upcoming'
                                ? `Jatuh tempo H-${item.daysDifference}`
                                : 'Belum Dicatat'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {rec.category} • Frekuensi:{' '}
                          <span className="font-semibold text-neutral-700">
                            {rec.frequency === 'monthly' ? `Bulanan (Tgl ${rec.dueDay})` : rec.frequency === 'weekly' ? 'Mingguan' : 'Tahunan'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-base font-bold tabular-nums block ${
                          isIncome ? 'text-emerald-600' : 'text-neutral-900'
                        }`}
                      >
                        {isIncome ? '+' : ''}
                        {formatIDR(rec.amount)}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {targetAccount ? targetAccount.name : rec.paymentMethod || 'Tunai'}
                      </span>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                      {rec.notes}
                    </p>
                  )}

                  {/* Actions Bottom Bar */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    {!isPaid ? (
                      <button
                        onClick={() => {
                          setPayingRecurringId(rec.id);
                          setPayUsingAccountId(rec.accountId || accounts[0]?.id || '');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isIncome ? 'Catat Pemasukan Ini' : 'Bayar & Catat Sekarang'}</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Sudah tercatat di mutasi bulan ini</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
                        title="Edit Tagihan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus transaksi rutin "${rec.title}"?`)) {
                            deleteRecurring(rec.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        title="Hapus Tagihan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay & Record Modal (Account Selector) */}
      {payingRecurringId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-sm font-bold text-neutral-900">
                Pilih Sumber Dana Pembayaran
              </h4>
              <button
                onClick={() => setPayingRecurringId(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Pilih dompet atau rekening yang digunakan untuk membayar tagihan ini:
            </p>

            <div className="space-y-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setPayUsingAccountId(acc.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                    payUsingAccountId === acc.id
                      ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: acc.color || '#2563eb' }}
                    />
                    <span>{acc.name}</span>
                  </div>
                  <span className="font-mono">{formatIDR(acc.balance)}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
              <button
                onClick={() => setPayingRecurringId(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => handleConfirmPay(payingRecurringId)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Konfirmasi & Catat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {editingItem ? 'Edit Transaksi Rutin' : 'Tambah Tagihan / Transaksi Rutin'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Atur pengingat dan jadwal pembayaran otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {formError}
                </div>
              )}

              {/* Type Selector */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Tipe Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      setCategory('Kos');
                    }}
                    className={`py-2 rounded-lg font-bold border transition-all ${
                      type === 'expense'
                        ? 'border-rose-400 bg-rose-50 text-rose-800'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    Pengeluaran / Tagihan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('income');
                      setCategory('Kiriman Orang Tua');
                    }}
                    className={`py-2 rounded-lg font-bold border transition-all ${
                      type === 'income'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    Pemasukan Rutin
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Judul Tagihan / Pemasukan</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Sewa Kamar Kos, Paket Internet Kampus"
                  className="w-full p-2.5 rounded-lg border border-neutral-300 font-semibold"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  value={
                    amountStr
                      ? new Intl.NumberFormat('id-ID').format(
                          parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0
                        )
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setAmountStr(raw);
                  }}
                  placeholder="0"
                  className="w-full p-2.5 rounded-lg border border-neutral-300 font-bold tabular-nums"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-neutral-300 bg-white"
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

              {/* Due Day & Frequency */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Jatuh Tempo (Tgl 1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-lg border border-neutral-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Frekuensi</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-neutral-300 bg-white"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="weekly">Mingguan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </div>

              {/* Default Account / Wallet */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Dompet / Rekening Default
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-neutral-300 bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatIDR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reminder Days Before */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Munculkan Pengingat
                </label>
                <select
                  value={reminderDaysBefore}
                  onChange={(e) => setReminderDaysBefore(parseInt(e.target.value) || 3)}
                  className="w-full p-2.5 rounded-lg border border-neutral-300 bg-white"
                >
                  <option value={1}>H-1 Sebelum Jatuh Tempo</option>
                  <option value={2}>H-2 Sebelum Jatuh Tempo</option>
                  <option value={3}>H-3 Sebelum Jatuh Tempo (Direkomendasikan)</option>
                  <option value={5}>H-5 Sebelum Jatuh Tempo</option>
                  <option value={7}>H-7 (1 Minggu Sebelumnya)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Transfer ke rekening pemilik kos BCA 123456"
                  className="w-full p-2.5 rounded-lg border border-neutral-300"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
