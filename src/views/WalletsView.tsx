import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types/finance';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  CheckCircle,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { formatIDR, formatDateID } from '../utils/formatters';
import { TransferModal } from '../components/modals/TransferModal';
import { AccountModal } from '../components/modals/AccountModal';

export const WalletsView: React.FC = () => {
  const { accounts, currentBalance, transactions, deleteAccount } = useFinance();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [defaultTransferFromId, setDefaultTransferFromId] = useState<string | undefined>(undefined);

  // Group balances by type
  const balanceSummary = useMemo(() => {
    let bankTotal = 0;
    let ewalletTotal = 0;
    let cashTotal = 0;
    let otherTotal = 0;

    accounts.forEach((acc) => {
      if (acc.type === 'bank') bankTotal += acc.balance;
      else if (acc.type === 'ewallet') ewalletTotal += acc.balance;
      else if (acc.type === 'cash') cashTotal += acc.balance;
      else otherTotal += acc.balance;
    });

    return { bankTotal, ewalletTotal, cashTotal, otherTotal };
  }, [accounts]);

  // Selected account transactions
  const selectedAccountTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    return transactions.filter(
      (t) =>
        t.accountId === selectedAccountId ||
        t.fromAccountId === selectedAccountId ||
        t.toAccountId === selectedAccountId
    );
  }, [transactions, selectedAccountId]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'ewallet':
        return Smartphone;
      case 'cash':
        return Wallet;
      default:
        return CreditCard;
    }
  };

  const handleOpenTransferFor = (accId: string) => {
    setDefaultTransferFromId(accId);
    setIsTransferModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleDelete = (acc: Account) => {
    if (accounts.length <= 1) {
      alert('Kamu harus memiliki setidaknya satu akun/dompet aktif.');
      return;
    }
    if (confirm(`Apakah kamu yakin ingin menghapus akun "${acc.name}"?`)) {
      deleteAccount(acc.id);
      if (selectedAccountId === acc.id) setSelectedAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>Manajemen Dompet & Rekening (Multi-Wallet)</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pantau saldo terpisah di Rekening Bank (BCA/Mandiri), E-Wallet (GoPay/ShopeePay/DANA), dan Uang Tunai
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setDefaultTransferFromId(undefined);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-700" />
            <span>Pindah Saldo / Transfer</span>
          </button>

          <button
            onClick={() => {
              setEditingAccount(null);
              setIsAccountModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Total Balance & Category Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Balance */}
        <div className="p-4 bg-linear-to-br from-neutral-900 to-neutral-800 text-white rounded-xl shadow-xs">
          <span className="text-[11px] font-medium text-neutral-300 block">Total Saldo Likuid</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-bold tabular-nums">
              {formatIDR(currentBalance)}
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-neutral-400 mt-2 block">
            Tersebar di {accounts.length} dompet & rekening
          </span>
        </div>

        {/* Bank Total */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Rekening Bank</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">
            {formatIDR(balanceSummary.bankTotal)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            BCA, Mandiri, BNI, Jago
          </span>
        </div>

        {/* E-Wallet Total */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>E-Wallet</span>
            <Smartphone className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">
            {formatIDR(balanceSummary.ewalletTotal)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            GoPay, ShopeePay, DANA, OVO
          </span>
        </div>

        {/* Cash Total */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Uang Tunai (Cash)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">
            {formatIDR(balanceSummary.cashTotal)}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Dompet fisik / uang saku saku
          </span>
        </div>
      </div>

      {/* Accounts List Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            Daftar Akun & Dompet Aktif ({accounts.length})
          </h3>
          <span className="text-xs text-neutral-500">
            Klik kartu akun untuk melihat mutasi transaksi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const Icon = getAccountIcon(acc.type);
            const isSelected = selectedAccountId === acc.id;
            const cardColor = acc.color || '#2563eb';

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(isSelected ? null : acc.id)}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-md bg-white'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-xs'
                }`}
              >
                {/* Color Accent Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: cardColor }}
                />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl text-white shadow-2xs"
                      style={{ backgroundColor: cardColor }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-neutral-900">{acc.name}</h4>
                        {acc.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-emerald-700" />
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {acc.accountNumber || (acc.type === 'cash' ? 'Uang Fisik' : 'Tanpa No. Rekening')}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md">
                    {acc.type === 'bank' ? 'Bank' : acc.type === 'ewallet' ? 'E-Wallet' : 'Tunai'}
                  </span>
                </div>

                {/* Balance */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-baseline justify-between">
                  <span className="text-xs text-neutral-500 font-medium">Saldo Tersedia</span>
                  <span className="text-lg font-bold text-neutral-900 tabular-nums">
                    {formatIDR(acc.balance)}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTransferFor(acc.id);
                    }}
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Pindah Saldo</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(acc);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                      title="Edit Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(acc);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Account Activity Drawer / Section */}
      {selectedAccount && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Riwayat Transaksi: {selectedAccount.name}</span>
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Mutasi masuk, keluar, dan transfer pada akun ini
              </p>
            </div>
            <button
              onClick={() => setSelectedAccountId(null)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Tutup Rincian ✕
            </button>
          </div>

          {selectedAccountTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Belum ada mutasi transaksi spesifik yang dicatat untuk akun ini.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {selectedAccountTransactions.slice(0, 8).map((t) => {
                const isTransfer = t.type === 'transfer';
                const isTransferOut = isTransfer && t.fromAccountId === selectedAccount.id;
                const isTransferIn = isTransfer && t.toAccountId === selectedAccount.id;
                const isIncome = t.type === 'income' || isTransferIn;
                const isExpense = t.type === 'expense' || isTransferOut || t.type === 'savings_transfer';

                return (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {isTransfer
                            ? isTransferOut
                              ? `Transfer ke ${accounts.find((a) => a.id === t.toAccountId)?.name || 'Akun Lain'}`
                              : `Terima transfer dari ${accounts.find((a) => a.id === t.fromAccountId)?.name || 'Akun Lain'}`
                            : t.category}
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {formatDateID(t.date)} {t.notes ? `• ${t.notes}` : ''}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-bold tabular-nums ${
                        isIncome ? 'text-emerald-600' : 'text-neutral-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatIDR(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultFromId={defaultTransferFromId}
      />

      {/* Add / Edit Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />
    </div>
  );
};
