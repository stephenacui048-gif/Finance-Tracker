import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import {
  formatIDR,
  formatDateID,
  getMonthNameID,
  getTodayDateString,
  getCurrentMonthString,
} from '../utils/formatters';
import { Transaction } from '../types/finance';

interface CalendarViewProps {
  onOpenQuickAdd: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenQuickAdd }) => {
  const { transactions, recurring, activeMonth, setActiveMonth, safeDailySpend } = useFinance();

  const todayStr = getTodayDateString();
  const curMonthStr = getCurrentMonthString();

  const [yearStr, monthStr] = activeMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return activeMonth === curMonthStr ? todayStr : `${activeMonth}-01`;
  });

  // Keep selected date aligned when month changes
  useEffect(() => {
    if (activeMonth === curMonthStr) {
      setSelectedDateStr(todayStr);
    } else if (!selectedDateStr.startsWith(activeMonth)) {
      setSelectedDateStr(`${activeMonth}-01`);
    }
  }, [activeMonth, curMonthStr, todayStr]);

  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const now = new Date();
  const todayDayNum = now.getDate();
  const isCurrentMonth = activeMonth === curMonthStr;

  // Month navigation helpers
  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 1, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(newMonth);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month + 1, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(newMonth);
  };

  const handleJumpToToday = () => {
    setActiveMonth(curMonthStr);
    setSelectedDateStr(todayStr);
  };

  // Map transactions by day string "YYYY-MM-DD"
  const dayDataMap = new Map<
    string,
    {
      incomeTotal: number;
      expenseTotal: number;
      savingsTotal: number;
      txList: Transaction[];
      isNoSpendDay: boolean;
      recurringDue: typeof recurring;
    }
  >();

  for (let d = 1; d <= totalDays; d++) {
    const dayStr = `${activeMonth}-${String(d).padStart(2, '0')}`;
    const dayTx = transactions.filter((t) => t.date === dayStr);

    let inc = 0;
    let exp = 0;
    let sav = 0;
    let nonEssentialExp = 0;

    for (const t of dayTx) {
      if (t.type === 'income') inc += t.amount;
      else if (t.type === 'expense') {
        exp += t.amount;
        if (
          t.classification === 'want' ||
          ['Nongkrong', 'Shopping', 'Entertainment'].includes(t.category)
        ) {
          nonEssentialExp += t.amount;
        }
      } else if (t.type === 'savings_transfer') {
        sav += t.amount;
      }
    }

    const recDue = recurring.filter((r) => r.dueDay === d);
    const isPastOrToday = !isCurrentMonth || d <= todayDayNum;
    const isNoSpend = isPastOrToday && nonEssentialExp === 0 && dayTx.length > 0;

    dayDataMap.set(dayStr, {
      incomeTotal: inc,
      expenseTotal: exp,
      savingsTotal: sav,
      txList: dayTx,
      isNoSpendDay: isNoSpend,
      recurringDue: recDue,
    });
  }

  const selectedDayData = dayDataMap.get(selectedDateStr) || {
    incomeTotal: 0,
    expenseTotal: 0,
    savingsTotal: 0,
    txList: [],
    isNoSpendDay: false,
    recurringDue: [],
  };

  const daysHeader = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
              Kalender Finansial Real-Time
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Real-Time
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Petakan pengeluaran harian, tanggal tagihan rutin, dan pantau hari hemat mahasiswa
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-600">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-neutral-600">Pengeluaran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-neutral-600">Hari Hemat (No-Spend)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-neutral-600">Jatuh Tempo Rutin</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs">
          {/* Calendar Header with Navigation Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-bold text-neutral-900 tabular-nums px-1">
                {getMonthNameID(month)} {year}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Jump to Today Button */}
              {activeMonth !== curMonthStr && (
                <button
                  onClick={handleJumpToToday}
                  className="ml-2 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  Kembali ke Bulan Ini
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-neutral-500 font-medium">Batas Harian:</span>
              <span className="font-bold text-emerald-700 tabular-nums">
                {formatIDR(safeDailySpend.safeDaily)}/hari
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">
                (Sisa {safeDailySpend.remainingDays} hari s/d tgl {safeDailySpend.paydayOrAllowanceDay})
              </span>
            </div>
          </div>

          <div className="mt-4">
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-neutral-400 text-xs mb-2">
              {daysHeader.map((dh) => (
                <div key={dh} className="py-1">
                  {dh}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Blank cells for initial offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank_${i}`} className="min-h-[64px] bg-neutral-50/40 rounded-xl" />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const dayStr = `${activeMonth}-${String(dayNum).padStart(2, '0')}`;
                const data = dayDataMap.get(dayStr);
                const isSelected = selectedDateStr === dayStr;
                const isToday = dayStr === todayStr;

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDateStr(dayStr)}
                    className={`min-h-[72px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-2xs'
                        : isToday
                        ? 'border-neutral-400 bg-neutral-50/80 shadow-2xs'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] shadow-xs'
                            : 'text-neutral-700'
                        }`}
                        title={isToday ? 'Hari Ini (Real-Time)' : undefined}
                      >
                        {dayNum}
                      </span>
                      <div className="flex items-center gap-1">
                        {dayNum === safeDailySpend.paydayOrAllowanceDay && (
                          <span
                            title={`Jadwal Terima Kiriman Ortu / Gaji (Tanggal ${safeDailySpend.paydayOrAllowanceDay})`}
                            className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase leading-none"
                          >
                            Kiriman
                          </span>
                        )}
                        {data?.isNoSpendDay && (
                          <span title="Hari Hemat: Bebas Belanja Non-Esensial" className="text-amber-500 text-[10px]">
                            ⭐
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {data && data.incomeTotal > 0 && (
                        <div className="text-[10px] font-bold text-emerald-700 truncate tabular-nums">
                          +{formatIDR(data.incomeTotal).replace('Rp ', '')}
                        </div>
                      )}
                      {data && data.expenseTotal > 0 && (
                        <div className="text-[10px] font-bold text-rose-700 truncate tabular-nums">
                          -{formatIDR(data.expenseTotal).replace('Rp ', '')}
                        </div>
                      )}
                      {data && data.recurringDue.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" title="Tagihan rutin jatuh tempo" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Detail Drawer / Panel */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Detail Tanggal
                  </h3>
                  {selectedDateStr === todayStr && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Hari Ini
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatDateID(selectedDateStr, 'long')}
                </p>
              </div>
              <button
                onClick={onOpenQuickAdd}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat</span>
              </button>
            </div>

            {/* Daily balance summary */}
            <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-neutral-50 rounded-xl text-xs">
              <div>
                <span className="text-neutral-500 text-[11px] block">Pemasukan</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {formatIDR(selectedDayData.incomeTotal)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 text-[11px] block">Pengeluaran</span>
                <span className="font-bold text-rose-700 tabular-nums">
                  {formatIDR(selectedDayData.expenseTotal)}
                </span>
              </div>
            </div>

            {/* Safe Daily Spend Comparison */}
            <div className="p-3 rounded-xl border border-neutral-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 font-medium">Batas Harian Aman:</span>
                <span className="font-bold text-neutral-900 tabular-nums">
                  {formatIDR(safeDailySpend.safeDaily)}/hari
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>Daya Tahan Saldo:</span>
                <span className="font-semibold text-neutral-700 tabular-nums">
                  {safeDailySpend.remainingDays} hari (s/d tgl {safeDailySpend.paydayOrAllowanceDay})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                <span className="text-neutral-600 font-medium">Status Belanja:</span>
                {selectedDayData.expenseTotal <= safeDailySpend.safeDaily ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aman Terkendali
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold">
                    Over +{formatIDR(selectedDayData.expenseTotal - safeDailySpend.safeDaily)}
                  </span>
                )}
              </div>
            </div>

            {/* Recurring transactions due today */}
            {selectedDayData.recurringDue.length > 0 && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Jatuh Tempo Berulang</span>
                </div>
                {selectedDayData.recurringDue.map((r) => (
                  <p key={r.id} className="text-indigo-800 text-[11px]">
                    · {r.title} ({formatIDR(r.amount)})
                  </p>
                ))}
              </div>
            )}

            {/* List of transactions on selected date */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-neutral-900">
                Daftar Transaksi ({selectedDayData.txList.length})
              </h4>
              {selectedDayData.txList.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center">
                  Tidak ada transaksi tercatat pada tanggal ini.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedDayData.txList.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl border border-neutral-100 bg-white hover:bg-neutral-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">{tx.category}</div>
                        {tx.notes && <div className="text-[11px] text-neutral-500">{tx.notes}</div>}
                      </div>
                      <span
                        className={`font-bold tabular-nums ${
                          tx.type === 'income'
                            ? 'text-emerald-700'
                            : tx.type === 'savings_transfer'
                            ? 'text-sky-700'
                            : 'text-neutral-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatIDR(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 text-center">
            <span className="text-[11px] text-neutral-400">
              Makin disiplin mencatat dan berhemat, makin cepat target finansial impianmu tercapai!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
