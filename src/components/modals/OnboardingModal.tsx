import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

export const OnboardingModal: React.FC = () => {
  const { settings, updateSettings, addSavingGoal } = useFinance();

  // If user has already completed onboarding, don't show
  if (settings.hasCompletedOnboarding) {
    return null;
  }

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState(settings.userName || '');
  const [university, setUniversity] = useState(settings.university || '');
  const [openingBalance, setOpeningBalance] = useState<string>('500000');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('3000000');
  const [essentialExpense, setEssentialExpense] = useState<string>('1800000');
  const [desiredSavings, setDesiredSavings] = useState<string>('500000');
  const [firstGoalName, setFirstGoalName] = useState<string>('Beli Laptop Kuliah');
  const [firstGoalTarget, setFirstGoalTarget] = useState<string>('6000000');

  const handleSkip = () => {
    updateSettings({ hasCompletedOnboarding: true });
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(openingBalance.replace(/[^0-9]/g, '')) || 0;
    const incomeNum = parseFloat(monthlyIncome.replace(/[^0-9]/g, '')) || 0;
    const expenseNum = parseFloat(essentialExpense.replace(/[^0-9]/g, '')) || 0;
    const savingsNum = parseFloat(desiredSavings.replace(/[^0-9]/g, '')) || 0;

    updateSettings({
      userName: name.trim() || 'Mahasiswa',
      university: university.trim() || 'Universitas',
      openingBalance: balanceNum,
      monthlyIncomeTarget: incomeNum,
      essentialExpenseTarget: expenseNum,
      desiredSavingsTarget: savingsNum,
      hasCompletedOnboarding: true,
    });

    if (firstGoalName.trim() && parseFloat(firstGoalTarget) > 0) {
      addSavingGoal({
        name: firstGoalName.trim(),
        targetAmount: parseFloat(firstGoalTarget),
        currentAmount: 0,
        targetDate: '2027-03-31',
        categoryIcon: 'laptop',
        description: 'Target tabungan pertama dari onboarding.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100 bg-neutral-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm">
                Rp
              </span>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Selamat Datang di Student Finance Tracker
                </h3>
                <p className="text-xs text-neutral-500">
                  Setup keuangan mahasiswa dalam 1 menit
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-neutral-500 px-2 py-1 bg-neutral-200/60 rounded">
              Langkah {step} dari 2
            </span>
          </div>
        </div>

        {/* Step 1: Profil & Saldo Awal */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bima Arya"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Kampus / Universitas
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Contoh: Universitas Indonesia"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Saldo Awal Dompet/Rekening Saat Ini (Rp)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Total uang tunai + saldo e-wallet + rekening bank yang kamu pegang saat ini.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-neutral-100">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                Lewati untuk sekarang
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Target Finansial & Target Tabungan */}
        {step === 2 && (
          <form onSubmit={handleFinish} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Estimasi Uang Masuk / Bln
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 text-xs font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Biaya Esensial (Kos/Makan)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={essentialExpense}
                    onChange={(e) => setEssentialExpense(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 text-xs font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Target Tabungan Bulanan (Rp)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-neutral-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={desiredSavings}
                  onChange={(e) => setDesiredSavings(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
              <label className="block text-xs font-semibold text-neutral-800">
                🎯 Target Tabungan Pertama (Opsional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={firstGoalName}
                  onChange={(e) => setFirstGoalName(e.target.value)}
                  placeholder="Nama target (misal: Laptop)"
                  className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded bg-white"
                />
                <input
                  type="number"
                  value={firstGoalTarget}
                  onChange={(e) => setFirstGoalTarget(e.target.value)}
                  placeholder="Target nominal (Rp)"
                  className="px-2.5 py-1.5 text-xs border border-neutral-300 rounded bg-white tabular-nums"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Mulai Gunakan Tracker</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
