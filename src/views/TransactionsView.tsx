import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, ExpenseCategory, PaymentMethod, ExpenseClassification } from '../types/finance';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Download,
  Filter,
  X,
  AlertCircle,
  ArrowLeftRight,
  Check,
} from 'lucide-react';
import { formatIDR, formatDateID, getTodayDateString } from '../utils/formatters';

interface TransactionsViewProps {
  onOpenQuickAdd: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onOpenQuickAdd }) => {
  const { transactions, deleteTransaction, updateTransaction, activeMonth, settings, accounts } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Edit fields
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editClassification, setEditClassification] = useState<ExpenseClassification>('need');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month filter
      if (!tx.date.startsWith(activeMonth)) return false;

      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Account filter
      if (filterAccount !== 'all') {
        const matchesAcc =
          tx.accountId === filterAccount ||
          tx.fromAccountId === filterAccount ||
          tx.toAccountId === filterAccount;
        if (!matchesAcc) return false;
      }

      // Category filter
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;

      // Classification filter
      if (filterClassification !== 'all') {
        if (filterClassification === 'need' && tx.classification !== 'need') return false;
        if (filterClassification === 'want' && tx.classification !== 'want') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        const matchesMethod = tx.paymentMethod ? tx.paymentMethod.toLowerCase().includes(q) : false;
        if (!matchesCategory && !matchesNotes && !matchesMethod) return false;
      }

      return true;
    });
  }, [transactions, activeMonth, filterType, filterAccount, filterCategory, filterClassification, searchQuery]);

  // Sort
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
      }
      if (sortBy === 'date_asc') {
        return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [filteredTransactions, sortBy]);

  // Running balance calculation across chronologically sorted transactions
  const runningBalancesMap = useMemo(() => {
    // Sort all transactions chronologically from beginning
    const chrono = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const map = new Map<string, number>();
    let current = settings.openingBalance;

    for (const t of chrono) {
      if (t.type === 'income') {
        current += t.amount;
      } else if (t.type === 'expense') {
        current -= t.amount;
      } else if (t.type === 'savings_transfer') {
        current -= t.amount;
      }
      map.set(t.id, current);
    }
    return map;
  }, [transactions, settings.openingBalance]);

  // Unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Totals for current view
  const currentFilteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfer = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'savings_transfer') transfer += t.amount;
    });
    return { income, expense, transfer, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleStartEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditAmountStr(String(tx.amount));
    setEditNotes(tx.notes || '');
    setEditCategory(tx.category);
    setEditDate(tx.date);
    setEditAccountId(tx.accountId || accounts[0]?.id || '');
    setEditClassification(tx.classification || 'need');
    setIsCustomCategory(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const amount = parseFloat(editAmountStr.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0 || !editCategory.trim()) return;

    updateTransaction(editingTransaction.id, {
      amount,
      notes: editNotes.trim() || undefined,
      category: editCategory.trim(),
      date: editDate,
      accountId: editAccountId || undefined,
      classification: editingTransaction.type === 'expense' ? editClassification : undefined,
    });
    setEditingTransaction(null);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal (IDR)', 'Klasifikasi', 'Metode Pembayaran', 'Catatan'];
    const rows = sortedTransactions.map((t) => [
      t.date,
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Setor Tabungan',
      t.category,
      t.amount,
      t.classification || '-',
      t.paymentMethod || '-',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_${activeMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Daftar lengkap pemasukan, pengeluaran, dan tabungan bulan {activeMonth}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, catatan, metode..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="expense">Pengeluaran Saja</option>
              <option value="income">Pemasukan Saja</option>
              <option value="savings_transfer">Setor Tabungan</option>
              <option value="transfer">Transfer Antar Dompet</option>
            </select>
          </div>

          {/* Account / Dompet filter */}
          <div>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="all">Semua Dompet / Akun</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatIDR(a.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="date_desc">Tanggal: Terbaru</option>
              <option value="date_asc">Tanggal: Terlama</option>
              <option value="amount_desc">Nominal: Terbesar</option>
              <option value="amount_asc">Nominal: Terkecil</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="flex flex-wrap items-center justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <span>Ditemukan: <strong>{currentFilteredTotals.count}</strong> transaksi</span>
            <span>·</span>
            <span>Total Masuk: <strong className="text-emerald-700 tabular-nums">+{formatIDR(currentFilteredTotals.income)}</strong></span>
            <span>·</span>
            <span>Total Keluar: <strong className="text-rose-700 tabular-nums">-{formatIDR(currentFilteredTotals.expense)}</strong></span>
          </div>

          {(filterType !== 'all' || filterCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterCategory('all');
                setFilterClassification('all');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        {sortedTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Tidak ada transaksi yang cocok dengan filter atau kata kunci.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori & Catatan</th>
                  <th className="py-3 px-4">Klasifikasi</th>
                  <th className="py-3 px-4">Dompet / Metode</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isSavingsTransfer = tx.type === 'savings_transfer';
                  const isWalletTransfer = tx.type === 'transfer';
                  const running = runningBalancesMap.get(tx.id);

                  const matchedAccount = accounts.find((a) => a.id === tx.accountId);
                  const fromAcc = accounts.find((a) => a.id === tx.fromAccountId);
                  const toAcc = accounts.find((a) => a.id === tx.toAccountId);

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 tabular-nums">
                        {formatDateID(tx.date, 'short')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-700'
                                : isSavingsTransfer
                                ? 'bg-sky-100 text-sky-700'
                                : isWalletTransfer
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : isSavingsTransfer ? (
                              <PiggyBank className="w-3.5 h-3.5" />
                            ) : isWalletTransfer ? (
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 block">
                              {isWalletTransfer ? 'Transfer Antar Dompet' : tx.category}
                            </span>
                            {tx.notes && (
                              <span className="text-[11px] text-neutral-500 truncate max-w-xs block">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.classification ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              tx.classification === 'need'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {tx.classification === 'need' ? 'Kebutuhan' : 'Keinginan'}
                          </span>
                        ) : isWalletTransfer ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-medium">
                            Pindah Saldo
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600 text-[11px]">
                        {isWalletTransfer ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                            {fromAcc?.name || 'Asal'} → {toAcc?.name || 'Tujuan'}
                          </span>
                        ) : matchedAccount ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: matchedAccount.color || '#2563eb' }}
                            />
                            {matchedAccount.name}
                          </span>
                        ) : (
                          <span className="font-mono">{tx.paymentMethod || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-bold tabular-nums">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-700'
                              : isSavingsTransfer
                              ? 'text-sky-700'
                              : isWalletTransfer
                              ? 'text-indigo-700'
                              : 'text-neutral-900'
                          }
                        >
                          {isIncome ? '+' : isWalletTransfer ? '⇄ ' : '-'}
                          {formatIDR(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-neutral-500 tabular-nums">
                        {running !== undefined ? formatIDR(running) : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(tx)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                            title="Edit transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTransactionToDelete(tx)}
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Ubah Transaksi</h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Kategori Transaksi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Kategori {editingTransaction.type === 'expense' ? 'Pengeluaran' : editingTransaction.type === 'income' ? 'Pemasukan' : 'Tabungan'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    {isCustomCategory ? 'Pilih dari List' : '+ Kategori Kustom'}
                  </button>
                </div>

                {!isCustomCategory ? (
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                        setEditCategory('');
                      } else {
                        setEditCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {(editingTransaction.type === 'expense'
                      ? [
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
                        ]
                      : editingTransaction.type === 'income'
                      ? [
                          'Uang Saku',
                          'Kiriman Orang Tua',
                          'Beasiswa',
                          'Part-Time',
                          'Freelance',
                          'Organisasi/Event',
                          'Bonus',
                          'Lainnya',
                        ]
                      : [editCategory || 'Tabungan']
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Tulis Nama Kategori Lain...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama kategori..."
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    autoFocus
                  />
                )}
              </div>

              {/* Klasifikasi Needs vs Wants (khusus expense) */}
              {editingTransaction.type === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Klasifikasi Pengeluaran
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditClassification('need')}
                      className={`p-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        editClassification === 'need'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${editClassification === 'need' ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Kebutuhan (Need)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditClassification('want')}
                      className={`p-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        editClassification === 'want'
                          ? 'border-amber-600 bg-amber-50 text-amber-900'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${editClassification === 'want' ? 'opacity-100' : 'opacity-0'}`} />
                      <span>Keinginan (Want)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dompet / Rekening */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Dompet / Rekening Sumber
                </label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editAmountStr}
                  onChange={(e) => setEditAmountStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>

              {/* Tanggal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">Tanggal</label>
                  <button
                    type="button"
                    onClick={() => setEditDate(getTodayDateString())}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    Set Hari Ini
                  </button>
                </div>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Keterangan pengeluaran..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Hapus Transaksi Ini?</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {transactionToDelete.category} ({formatIDR(transactionToDelete.amount)}) pada tanggal {formatDateID(transactionToDelete.date, 'short')}.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Tindakan ini akan mengupdate saldo dan laporan keuanganmu secara permanen.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
