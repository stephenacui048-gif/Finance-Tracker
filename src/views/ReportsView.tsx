import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { formatIDR, formatPercent, formatDateID, getMonthNameID } from '../utils/formatters';
import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateMonthlySavings,
  calculateSavingsRate,
  calculateNeedsVsWants,
  calculateExpensesByCategory,
} from '../utils/calculations';

export const ReportsView: React.FC = () => {
  const { transactions, activeMonth } = useFinance();

  const [yearStr, monthNumStr] = activeMonth.split('-');
  const currYear = parseInt(yearStr, 10);
  const currMonth = parseInt(monthNumStr, 10);

  // Previous month string
  const prevDate = new Date(currYear, currMonth - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Current month metrics
  const currIncome = useMemo(() => calculateMonthlyIncome(transactions, activeMonth), [transactions, activeMonth]);
  const currExpenses = useMemo(() => calculateMonthlyExpenses(transactions, activeMonth), [transactions, activeMonth]);
  const currSavings = useMemo(() => calculateMonthlySavings(currIncome, currExpenses), [currIncome, currExpenses]);
  const currSavingsRate = useMemo(() => calculateSavingsRate(currIncome, currExpenses), [currIncome, currExpenses]);
  const currNeedsWants = useMemo(() => calculateNeedsVsWants(transactions, activeMonth), [transactions, activeMonth]);
  const currCategories = useMemo(() => calculateExpensesByCategory(transactions, activeMonth), [transactions, activeMonth]);

  // Previous month metrics
  const prevIncome = useMemo(() => calculateMonthlyIncome(transactions, prevMonthStr), [transactions, prevMonthStr]);
  const prevExpenses = useMemo(() => calculateMonthlyExpenses(transactions, prevMonthStr), [transactions, prevMonthStr]);
  const prevSavings = useMemo(() => calculateMonthlySavings(prevIncome, prevExpenses), [prevIncome, prevExpenses]);

  // Differences
  const incomeDiff = currIncome - prevIncome;
  const expenseDiff = currExpenses - prevExpenses;
  const savingsDiff = currSavings - prevSavings;

  const handlePrint = () => {
    window.print();
  };

  // Automated narrative report generator in Indonesian
  const narrativeSummary = useMemo(() => {
    const lines: string[] = [];

    if (currSavings > 0) {
      lines.push(
        `Pada bulan ${activeMonth}, kamu berhasil mempertahankan arus kas positif dengan surplus tabungan sebesar ${formatIDR(currSavings)} (tingkat tabungan ${formatPercent(currSavingsRate)}).`
      );
    } else {
      lines.push(
        `Pada bulan ${activeMonth}, arus kas mengalami defisit sebesar ${formatIDR(Math.abs(currSavings))}. Pengeluaran melebihi total dana masuk.`
      );
    }

    if (prevExpenses > 0) {
      if (expenseDiff > 0) {
        const pct = Math.round((expenseDiff / prevExpenses) * 100);
        lines.push(
          `Pengeluaran bulanan meningkat sebesar ${formatIDR(expenseDiff)} (+${pct}%) dibandingkan bulan lalu.`
        );
      } else if (expenseDiff < 0) {
        const pct = Math.round((Math.abs(expenseDiff) / prevExpenses) * 100);
        lines.push(
          `Bagus! Pengeluaran berhasil ditekan hemat sebesar ${formatIDR(Math.abs(expenseDiff))} (-${pct}%) dibanding bulan lalu.`
        );
      }
    }

    if (currNeedsWants.wantsPercent > 35) {
      lines.push(
        `Alokasi pos gaya hidup & keinginanmu mencapai ${Math.round(currNeedsWants.wantsPercent)}% (melebihi anjuran ideal mahasiswa 30%). Prioritaskan pengurangan nongkrong dan belanja non-esensial.`
      );
    } else {
      lines.push(
        `Komposisi pengeluaran pokokmu terjaga sangat sehat pada angka ${Math.round(currNeedsWants.needsPercent)}% dari total belanja.`
      );
    }

    return lines;
  }, [activeMonth, currSavings, currSavingsRate, prevExpenses, expenseDiff, currNeedsWants]);

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs print:border-none">
        <div>
          <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
            Laporan Keuangan Bulanan
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Evaluasi komprehensif arus kas & perbandingan performa bulan {activeMonth}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>

      {/* Narrative AI/Smart Analysis Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-emerald-950">Ringkasan Analisis Finansial</h3>
        </div>
        <div className="space-y-1.5 text-xs text-emerald-900 leading-relaxed">
          {narrativeSummary.map((line, idx) => (
            <p key={idx}>• {line}</p>
          ))}
        </div>
      </div>

      {/* Main KPI Month-over-Month Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Total Pemasukan</span>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
            {formatIDR(currIncome)}
          </p>
          <div className="mt-2 flex items-center text-xs">
            {incomeDiff >= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +{formatIDR(incomeDiff)} vs bln lalu
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> {formatIDR(incomeDiff)} vs bln lalu
              </span>
            )}
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Total Pengeluaran</span>
          <p className="text-xl font-bold text-rose-700 tabular-nums mt-1">
            {formatIDR(currExpenses)}
          </p>
          <div className="mt-2 flex items-center text-xs">
            {expenseDiff <= 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Lebih hemat {formatIDR(Math.abs(expenseDiff))}
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Naik +{formatIDR(expenseDiff)}
              </span>
            )}
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Tabungan Bersih (Surplus)</span>
          <p
            className={`text-xl font-bold tabular-nums mt-1 ${
              currSavings >= 0 ? 'text-sky-700' : 'text-rose-600'
            }`}
          >
            {formatIDR(currSavings)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
            <span>Rasio Simpan: <strong className="text-neutral-900">{formatPercent(currSavingsRate)}</strong></span>
            <span>Bln lalu: {formatIDR(prevSavings)}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Needs vs Wants & 50/30/20 Framework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs vs Wants Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Pola 50/30/20 (Kebutuhan vs Keinginan vs Tabungan)
              </h3>
              <p className="text-xs text-neutral-500">Pedoman manajemen anggaran ideal mahasiswa</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Needs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">
                  1. Kebutuhan Pokok (Target: ~50-60%)
                </span>
                <span className="font-bold tabular-nums text-neutral-900">
                  {formatIDR(currNeedsWants.needsTotal)} ({Math.round(currNeedsWants.needsPercent)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${currNeedsWants.needsPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">
                Mencakup sewa kos, makan harian pokok, internet kuliah, dan transport.
              </span>
            </div>

            {/* Wants */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">
                  2. Keinginan & Nongkrong (Target: ~20-30%)
                </span>
                <span className="font-bold tabular-nums text-neutral-900">
                  {formatIDR(currNeedsWants.wantsTotal)} ({Math.round(currNeedsWants.wantsPercent)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${currNeedsWants.wantsPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">
                Mencakup kafe, shopping, bioskop, subscription musik/video.
              </span>
            </div>

            {/* Savings Rate */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-800">
                  3. Tabungan & Investasi (Target: ~15-20%)
                </span>
                <span className="font-bold tabular-nums text-sky-700">
                  {formatIDR(Math.max(0, currSavings))} ({formatPercent(currSavingsRate)})
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, currSavingsRate * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">
                Disimpan untuk laptop, dana darurat, dan sertifikasi masa depan.
              </span>
            </div>
          </div>
        </div>

        {/* Top Expense Categories Ranking */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">Peringkat Pengeluaran per Kategori</h3>
            <span className="text-xs text-neutral-400">Total {currCategories.length} Pos</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {currCategories.map((c, i) => (
              <div key={c.category} className="p-2.5 rounded-lg border border-neutral-100 hover:bg-neutral-50/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-neutral-900">
                    {i + 1}. {c.category} ({c.count} transaksi)
                  </span>
                  <span className="font-bold text-neutral-900 tabular-nums">
                    {formatIDR(c.amount)} ({Math.round(c.percentage)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-700 h-full rounded-full"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
