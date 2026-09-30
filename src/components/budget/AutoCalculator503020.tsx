import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategory, MonthlyBudget, BudgetingMethodType, BudgetingMethodDefinition } from '../../types/finance';
import {
  Calculator,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Percent,
  Layers,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { formatIDR, formatPercent } from '../../utils/formatters';
import { BUDGETING_METHODS, generateBudgetPresetForMethod } from '../../data/budgetingMethods';

interface BudgetCalculatorProps {
  onApplied?: () => void;
}

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ onApplied }) => {
  const {
    monthlyIncome,
    settings,
    applyCustomBudgets,
    budgets,
    selectedBudgetingMethod,
    debts,
  } = useFinance();

  const [selectedMethodId, setSelectedMethodId] = useState<BudgetingMethodType>(
    selectedBudgetingMethod || '50_30_20'
  );

  // Sync if selectedBudgetingMethod in context changes
  useEffect(() => {
    if (selectedBudgetingMethod) {
      setSelectedMethodId(selectedBudgetingMethod);
    }
  }, [selectedBudgetingMethod]);

  // Default base income: monthlyIncome or settings target or 3.000.000
  const initialBase = monthlyIncome > 0 ? monthlyIncome : (settings.monthlyIncomeTarget || 3_000_000);
  const [inputIncomeStr, setInputIncomeStr] = useState<string>(String(initialBase));
  const [showDetailedList, setShowDetailedList] = useState<boolean>(true);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Custom sliders for custom mode
  const [customNeeds, setCustomNeeds] = useState<number>(50);
  const [customWants, setCustomWants] = useState<number>(30);
  const [customSavings, setCustomSavings] = useState<number>(20);

  // Manual adjustments per category
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, number>>({});

  const numericIncome = useMemo(() => {
    const parsed = parseFloat(inputIncomeStr.replace(/[^0-9]/g, ''));
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [inputIncomeStr]);

  const currentMethodDef: BudgetingMethodDefinition = useMemo(() => {
    const found = BUDGETING_METHODS.find((m) => m.id === selectedMethodId);
    if (found) return found;

    // Custom fallback
    return {
      id: '50_30_20',
      name: 'Alokasi Kustom Mahasiswa',
      shortName: 'Kustom',
      tagline: 'Atur sendiri persentase kebutuhan, keinginan, dan tabungan',
      description: 'Sesuaikan porsi alokasi sesuai preferensi dan gaya hidup perkuliahanmu.',
      philosophy: 'Fleksibilitas penuh untuk kebutuhan mahasiswa yang dinamis.',
      idealFor: 'Mahasiswa yang memiliki struktur pengeluaran unik.',
      proTip: 'Pastikan total persentase selalu 100% agar tidak ada defisit anggaran.',
      allocations: [
        {
          name: `Kebutuhan Pokok (${customNeeds}%)`,
          percentage: customNeeds,
          categories: ['Kos', 'Makanan', 'Listrik/Air', 'Internet/Pulsa', 'Transportasi', 'Pendidikan', 'Kesehatan'],
          description: 'Pengeluaran primer kehidupan dan kuliah.',
          color: '#059669',
        },
        {
          name: `Keinginan & Hiburan (${customWants}%)`,
          percentage: customWants,
          categories: ['Nongkrong', 'Shopping', 'Entertainment', 'Subscription', 'Lainnya'],
          description: 'Ngopi, jajan, dan refreshing.',
          color: '#d97706',
        },
        {
          name: `Tabungan & Investasi (${customSavings}%)`,
          percentage: customSavings,
          categories: ['Tabungan', 'Investasi'],
          description: 'Masa depan dan dana darurat.',
          color: '#0284c7',
        },
      ],
    };
  }, [selectedMethodId, customNeeds, customWants, customSavings]);

  // Calculated group pools based on current method allocations
  const groupPools = useMemo(() => {
    return currentMethodDef.allocations.map((alloc) => {
      const amount = Math.round(numericIncome * (alloc.percentage / 100));
      return {
        ...alloc,
        amount,
      };
    });
  }, [currentMethodDef, numericIncome]);

  // Calculate base presets for all categories
  const calculatedItems = useMemo(() => {
    let presets: MonthlyBudget[] = [];

    if (selectedMethodId === 'custom') {
      const needsPool = numericIncome * (customNeeds / 100);
      const wantsPool = numericIncome * (customWants / 100);
      const savingsPool = numericIncome * (customSavings / 100);

      const items: { category: ExpenseCategory; amount: number }[] = [
        { category: 'Kos', amount: Math.round(needsPool * 0.45) },
        { category: 'Makanan', amount: Math.round(needsPool * 0.35) },
        { category: 'Internet/Pulsa', amount: Math.round(needsPool * 0.08) },
        { category: 'Transportasi', amount: Math.round(needsPool * 0.06) },
        { category: 'Pendidikan', amount: Math.round(needsPool * 0.04) },
        { category: 'Kesehatan', amount: Math.round(needsPool * 0.02) },
        { category: 'Nongkrong', amount: Math.round(wantsPool * 0.4) },
        { category: 'Shopping', amount: Math.round(wantsPool * 0.35) },
        { category: 'Subscription', amount: Math.round(wantsPool * 0.1) },
        { category: 'Entertainment', amount: Math.round(wantsPool * 0.15) },
        { category: 'Tabungan', amount: Math.round(savingsPool * 0.8) },
        { category: 'Investasi', amount: Math.round(savingsPool * 0.2) },
      ];
      presets = items.map((i) => ({
        category: i.category,
        monthlyLimit: Math.round(i.amount / 5000) * 5000,
      }));
    } else {
      presets = generateBudgetPresetForMethod(selectedMethodId, numericIncome);
    }

    // Apply any manual category overrides
    return presets.map((item) => {
      const currentLimit = budgets.find((b) => b.category === item.category)?.monthlyLimit || 0;
      const finalAmount = categoryOverrides[item.category] !== undefined
        ? categoryOverrides[item.category]
        : item.monthlyLimit;

      // Find which allocation group this category belongs to
      const matchedGroup = currentMethodDef.allocations.find((alloc) =>
        alloc.categories.includes(item.category)
      ) || currentMethodDef.allocations[0];

      return {
        category: item.category,
        amount: finalAmount,
        originalCalculated: item.monthlyLimit,
        currentLimit,
        difference: finalAmount - currentLimit,
        groupName: matchedGroup.name,
        color: matchedGroup.color,
      };
    });
  }, [selectedMethodId, numericIncome, customNeeds, customWants, customSavings, categoryOverrides, budgets, currentMethodDef]);

  const totalCalculated = useMemo(() => {
    return calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  }, [calculatedItems]);

  const handleAdjustCategory = (category: string, delta: number) => {
    setCategoryOverrides((prev) => {
      const current = prev[category] !== undefined
        ? prev[category]
        : (calculatedItems.find((c) => c.category === category)?.amount || 0);
      const next = Math.max(0, current + delta);
      return { ...prev, [category]: next };
    });
  };

  const handleResetOverrides = () => {
    setCategoryOverrides({});
  };

  const handleApplyToBudgets = () => {
    const newBudgets: MonthlyBudget[] = calculatedItems.map((item) => ({
      category: item.category,
      monthlyLimit: item.amount,
    }));

    applyCustomBudgets(newBudgets, selectedMethodId);
    setAppliedNotification(
      `Berhasil menerapkan metode ${currentMethodDef.shortName} untuk ${newBudgets.length} pos anggaran!`
    );

    if (onApplied) onApplied();

    setTimeout(() => {
      setAppliedNotification(null);
    }, 4500);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs space-y-0">
      {/* Top Header */}
      <div className="p-5 md:p-6 bg-linear-to-r from-neutral-900 to-neutral-800 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold">Kalkulator Anggaran Cerdas</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono text-[10px] font-semibold">
                  Multi-Metode
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                Hitung otomatis dan terapkan pembagian anggaran untuk semua formula keuangan mahasiswa: 50/30/20, 80/20, Zero-Based, 6 Toples, atau Pelunasan Utang.
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyToBudgets}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan ke Anggaran</span>
          </button>
        </div>

        {/* Method Selector Pills */}
        <div className="mt-5 pt-4 border-t border-neutral-700/80">
          <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Pilih Formula / Metode Budgeting:
          </label>
          <div className="flex flex-wrap gap-2">
            {BUDGETING_METHODS.map((method) => {
              const isSelected = selectedMethodId === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    setCategoryOverrides({});
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                      : 'bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{method.shortName}</span>
                </button>
              );
            })}

            {/* Custom Option */}
            <button
              onClick={() => {
                setSelectedMethodId('custom' as BudgetingMethodType);
                setCategoryOverrides({});
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedMethodId === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                  : 'bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Kustom Sendiri</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applied Feedback Banner */}
      {appliedNotification && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{appliedNotification}</span>
          </div>
          <button
            onClick={() => setAppliedNotification(null)}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Controls Section */}
      <div className="p-5 md:p-6 space-y-6">
        {/* Income Input and Method Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
              <span>Dasar Pemasukan / Uang Saku Bulanan:</span>
              <span className="text-[11px] font-normal text-neutral-500">
                Pemasukan riil: {formatIDR(monthlyIncome)}
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
                Rp
              </span>
              <input
                type="text"
                value={
                  numericIncome > 0
                    ? new Intl.NumberFormat('id-ID').format(numericIncome)
                    : ''
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setInputIncomeStr(raw);
                }}
                placeholder="Contoh: 3.000.000"
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-neutral-900 tabular-nums"
              />
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-400 font-medium">Pilih cepat:</span>
              {[1_500_000, 2_500_000, 3_000_000, 4_000_000, 5_000_000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setInputIncomeStr(String(val))}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    numericIncome === val
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {val >= 1_000_000 ? `${val / 1_000_000} jt` : formatIDR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Active Method Overview Card */}
          <div className="md:col-span-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentMethodDef.name}</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 bg-neutral-200/70 text-neutral-700 rounded-md font-mono">
                {currentMethodDef.shortName}
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {currentMethodDef.description}
            </p>

            <div className="pt-2 border-t border-neutral-200/70 text-[11px] text-neutral-500 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-700">Pro-Tip:</strong> {currentMethodDef.proTip}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Mode Sliders */}
        {selectedMethodId === 'custom' && (
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sesuaikan Proporsi Kustom (%)</span>
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  customNeeds + customWants + customSavings === 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                Total: {customNeeds + customWants + customSavings}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-700 font-medium">Kebutuhan (Needs)</span>
                  <span className="font-bold text-emerald-700">{customNeeds}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={customNeeds}
                  onChange={(e) => setCustomNeeds(parseInt(e.target.value) || 0)}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-700 font-medium">Keinginan (Wants)</span>
                  <span className="font-bold text-amber-700">{customWants}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={customWants}
                  onChange={(e) => setCustomWants(parseInt(e.target.value) || 0)}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-700 font-medium">Tabungan (Savings)</span>
                  <span className="font-bold text-sky-700">{customSavings}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={customSavings}
                  onChange={(e) => setCustomSavings(parseInt(e.target.value) || 0)}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Visual Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span className="font-semibold text-neutral-800">Distribusi Pos Alokasi:</span>
            <span className="font-mono text-neutral-500">
              Total: {formatIDR(numericIncome)}
            </span>
          </div>

          {/* Progress Stack Bar */}
          <div className="w-full h-4 bg-neutral-100 rounded-full overflow-hidden flex shadow-inner">
            {groupPools.map((pool, idx) => (
              <div
                key={idx}
                style={{
                  width: `${pool.percentage}%`,
                  backgroundColor: pool.color,
                }}
                className="h-full transition-all duration-300 relative group cursor-pointer"
                title={`${pool.name}: ${formatIDR(pool.amount)} (${pool.percentage}%)`}
              />
            ))}
          </div>

          {/* Allocation Group Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {groupPools.map((pool, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-neutral-200/90 bg-white hover:bg-neutral-50/50 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: pool.color }}
                    />
                    <h5 className="text-xs font-bold text-neutral-900 truncate">
                      {pool.name}
                    </h5>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-800">
                    {pool.percentage}%
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-neutral-900 tabular-nums">
                    {formatIDR(pool.amount)}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {pool.categories.length} kategori
                  </span>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                  {pool.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Category Allocations Toggle & Table */}
        <div className="pt-2 border-t border-neutral-100 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetailedList(!showDetailedList)}
              className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-neutral-950"
            >
              {showDetailedList ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
              <span>
                Rincian Plafon Per Kategori ({calculatedItems.length} Pos Pengeluaran)
              </span>
            </button>

            {Object.keys(categoryOverrides).length > 0 && (
              <button
                onClick={handleResetOverrides}
                className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Penyesuaian Manual</span>
              </button>
            )}
          </div>

          {showDetailedList && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Kelompok</th>
                      <th className="py-2.5 px-3 text-right">Alokasi Formula</th>
                      <th className="py-2.5 px-3 text-right">Batas Saat Ini</th>
                      <th className="py-2.5 px-3 text-right">Selisih</th>
                      <th className="py-2.5 px-3 text-center">Sesuaikan (±Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {calculatedItems.map((item) => (
                      <tr key={item.category} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor: `${item.color}15`,
                              color: item.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.groupName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900 tabular-nums">
                          {formatIDR(item.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-500 tabular-nums">
                          {formatIDR(item.currentLimit)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <span
                            className={`font-semibold ${
                              item.difference > 0
                                ? 'text-emerald-600'
                                : item.difference < 0
                                ? 'text-amber-600'
                                : 'text-neutral-400'
                            }`}
                          >
                            {item.difference > 0 ? '+' : ''}
                            {formatIDR(item.difference)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustCategory(item.category, -25_000)}
                              className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-xs transition-colors"
                              title="Kurangi Rp 25.000"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustCategory(item.category, 25_000)}
                              className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-xs transition-colors"
                              title="Tambah Rp 25.000"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 border-t border-neutral-200 font-bold text-neutral-900">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3">
                        Total Alokasi Rencana
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-mono text-xs tabular-nums">
                        {formatIDR(totalCalculated)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500 font-mono text-xs tabular-nums">
                        {formatIDR(budgets.reduce((s, b) => s + b.monthlyLimit, 0))}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-right text-[11px] text-neutral-500 font-normal">
                        {totalCalculated <= numericIncome ? (
                          <span className="text-emerald-700 font-medium">✓ Sesuai Pemasukan</span>
                        ) : (
                          <span className="text-rose-600 font-medium">! Melebihi Pemasukan</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 text-center sm:text-left">
            <span>Metode terpilih: </span>
            <strong className="text-neutral-900 font-bold">{currentMethodDef.name}</strong>
            <span className="block sm:inline sm:ml-1 text-[11px] text-neutral-400">
              (Formula akan langsung mengupdate plafon anggaran bulan {settings.paydayOrAllowanceDay ? `setiap tgl ${settings.paydayOrAllowanceDay}` : 'berjalan'})
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleApplyToBudgets}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Terapkan Metode Ini ({currentMethodDef.shortName})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Maintain backwards compatibility with AutoCalculator503020 import
export const AutoCalculator503020 = BudgetCalculator;
