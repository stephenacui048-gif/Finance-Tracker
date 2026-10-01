import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/finance';
import { X, Wallet, Building2, Smartphone, CreditCard, Check, AlertCircle } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
}) => {
  const { addAccount, updateAccount } = useFinance();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('bank');
  const [balanceStr, setBalanceStr] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [color, setColor] = useState<string>('#2563eb');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setBalanceStr(String(editingAccount.initialBalance ?? editingAccount.balance));
      setAccountNumber(editingAccount.accountNumber || '');
      setColor(editingAccount.color || '#2563eb');
      setIsDefault(!!editingAccount.isDefault);
    } else {
      setName('');
      setType('bank');
      setBalanceStr('');
      setAccountNumber('');
      setColor('#2563eb');
      setIsDefault(false);
    }
    setErrorMessage('');
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const colorPresets = [
    '#2563eb', // Blue (BCA/Mandiri)
    '#059669', // Emerald (Cash)
    '#0891b2', // Cyan (GoPay)
    '#ea580c', // Orange (ShopeePay)
    '#0284c7', // Sky (DANA)
    '#7c3aed', // Purple (OVO)
    '#475569', // Slate
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama akun/dompet tidak boleh kosong.');
      return;
    }

    const numericBalance = parseFloat(balanceStr.replace(/[^0-9]/g, '')) || 0;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: name.trim(),
        type,
        initialBalance: numericBalance,
        accountNumber: accountNumber.trim() || undefined,
        color,
        isDefault,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        balance: numericBalance,
        initialBalance: numericBalance,
        accountNumber: accountNumber.trim() || undefined,
        color,
        isDefault,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: color }}
            >
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                {editingAccount ? 'Edit Akun / Dompet' : 'Tambah Akun / Dompet Baru'}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Kelola rekening bank, e-wallet, atau dompet tunaimu
              </p>
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

          {/* Account Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 block">
              Tipe Akun / Dompet
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Tunai', icon: Wallet },
                { id: 'bank', label: 'Bank', icon: Building2 },
                { id: 'ewallet', label: 'E-Wallet', icon: Smartphone },
                { id: 'other', label: 'Lainnya', icon: CreditCard },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id as AccountType);
                      if (item.id === 'cash') setColor('#059669');
                      else if (item.id === 'bank') setColor('#2563eb');
                      else if (item.id === 'ewallet') setColor('#0891b2');
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">
              Nama Akun / Dompet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Bank BCA, GoPay, Dompet Saku"
              className="w-full text-xs font-semibold p-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Initial Balance */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">
              {editingAccount ? 'Saldo Awal' : 'Saldo Saat Ini'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                Rp
              </span>
              <input
                type="text"
                value={
                  balanceStr
                    ? new Intl.NumberFormat('id-ID').format(
                        parseFloat(balanceStr.replace(/[^0-9]/g, '')) || 0
                      )
                    : ''
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setBalanceStr(raw);
                }}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 text-xs font-bold tabular-nums focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Account Number / Details */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 block">
              Nomor Rekening / No. HP (Opsional)
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Contoh: 8219••••32 atau 0812••••9910"
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 block">
              Warna Kartu Dompet
            </label>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-neutral-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Default Account Checkbox */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
            />
            <label htmlFor="isDefault" className="text-xs text-neutral-700 cursor-pointer">
              Jadikan akun/dompet utama secara default
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
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
              <span>{editingAccount ? 'Simpan Perubahan' : 'Tambahkan Akun'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
