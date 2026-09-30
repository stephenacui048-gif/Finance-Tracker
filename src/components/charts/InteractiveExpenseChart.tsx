import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/finance';
import { formatIDR, formatCompactIDR, formatDateID } from '../../utils/formatters';
import { BarChart2, Activity, PieChart, Sparkles } from 'lucide-react';

interface InteractiveExpenseChartProps {
  transactions: Transaction[];
  activeMonth: string; // YYYY-MM
  safeDailyLimit: number;
}

export const InteractiveExpenseChart: React.FC<InteractiveExpenseChartProps> = ({
  transactions,
  activeMonth,
  safeDailyLimit,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    dateStr: string;
    total: number;
    count: number;
    categories: { category: string; amount: number }[];
  } | null>(null);

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'daily' | 'curve' | 'category'>('daily');

  // Days in month calculation
  const { daysInMonth, dailyData, chartCeiling, totalMonthExpense, peakDay, dailyAverage, noSpendDays } =
    useMemo(() => {
      const [y, m] = activeMonth.split('-').map(Number);
      const countDays = new Date(y, m, 0).getDate();

      // Filter month expenses
      const monthExpenses = transactions.filter(
        (t) => t.date.startsWith(activeMonth) && t.type === 'expense'
      );

      const totalMonth = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

      const map = new Map<number, { total: number; count: number; categories: Map<string, number> }>();
      for (let d = 1; d <= countDays; d++) {
        map.set(d, { total: 0, count: 0, categories: new Map() });
      }

      monthExpenses.forEach((t) => {
        const dayNum = parseInt(t.date.split('-')[2], 10);
        const entry = map.get(dayNum);
        if (entry) {
          entry.total += t.amount;
          entry.count += 1;
          const currCat = entry.categories.get(t.category) || 0;
          entry.categories.set(t.category, currCat + t.amount);
        }
      });

      let maxSpent = 0;
      let peak = { day: 1, amount: 0 };
      let zeroSpendCount = 0;

      const daysArray: {
        day: number;
        dateStr: string;
        total: number;
        count: number;
        categories: { category: string; amount: number }[];
      }[] = [];

      for (let d = 1; d <= countDays; d++) {
        const entry = map.get(d)!;
        if (entry.total > maxSpent) maxSpent = entry.total;
        if (entry.total > peak.amount) peak = { day: d, amount: entry.total };
        if (entry.total === 0) zeroSpendCount++;

        const catList: { category: string; amount: number }[] = [];
        entry.categories.forEach((amount, category) => catList.push({ category, amount }));
        catList.sort((a, b) => b.amount - a.amount);

        const dateStr = `${activeMonth}-${String(d).padStart(2, '0')}`;
        daysArray.push({
          day: d,
          dateStr,
          total: entry.total,
          count: entry.count,
          categories: catList,
        });
      }

      const avg = countDays > 0 ? Math.round(totalMonth / countDays) : 0;

      // Calculate an aesthetic chart ceiling: bars should fill nicely without tiny squishing
      let ceiling = Math.max(maxSpent * 1.3, 50_000);
      if (safeDailyLimit > 0 && safeDailyLimit < ceiling * 1.8) {
        ceiling = Math.max(ceiling, safeDailyLimit * 1.15);
      }

      return {
        daysInMonth: countDays,
        dailyData: daysArray,
        chartCeiling: ceiling,
        totalMonthExpense: totalMonth,
        peakDay: peak,
        dailyAverage: avg,
        noSpendDays: zeroSpendCount,
      };
    }, [transactions, activeMonth, safeDailyLimit]);

  // Category breakdown for Donut Chart
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.date.startsWith(activeMonth) && t.type === 'expense')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });

    const list: { category: string; amount: number; percentage: number; color: string }[] = [];
    const colors = [
      '#10b981', // emerald
      '#06b6d4', // cyan
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#f97316', // orange
      '#ef4444', // rose
      '#14b8a6', // teal
      '#6366f1', // indigo
      '#64748b', // slate
    ];

    let colorIdx = 0;
    map.forEach((amount, category) => {
      const percentage = totalMonthExpense > 0 ? (amount / totalMonthExpense) * 100 : 0;
      list.push({
        category,
        amount,
        percentage,
        color: colors[colorIdx % colors.length],
      });
      colorIdx++;
    });

    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [transactions, activeMonth, totalMonthExpense]);

  // Chart dimensions
  const svgHeight = 150;
  const svgWidth = 600;
  const barPadding = 2;
  const barWidth = Math.max(6, (svgWidth - daysInMonth * barPadding) / daysInMonth);

  // Safe daily line Y coordinate (only if within bounds)
  const safeLineY =
    safeDailyLimit > 0 && safeDailyLimit <= chartCeiling
      ? svgHeight - 10 - (safeDailyLimit / chartCeiling) * (svgHeight - 35)
      : null;

  // Curve points generator for smooth area chart
  const { curvePath, areaPath } = useMemo(() => {
    if (dailyData.length === 0) return { curvePath: '', areaPath: '' };

    const points = dailyData.map((d, i) => {
      const x = i * (svgWidth / (daysInMonth - 1 || 1));
      const y =
        d.total > 0
          ? svgHeight - 10 - (d.total / chartCeiling) * (svgHeight - 35)
          : svgHeight - 10;
      return { x, y };
    });

    if (points.length < 2) return { curvePath: '', areaPath: '' };

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const area = `${path} L ${points[points.length - 1].x} ${svgHeight - 10} L ${points[0].x} ${svgHeight - 10} Z`;

    return { curvePath: path, areaPath: area };
  }, [dailyData, daysInMonth, chartCeiling, svgHeight, svgWidth]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 md:p-6 space-y-4">
      {/* Top Header & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Grafik Pengeluaran Bulanan
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Interaktif
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Total bulan ini: <strong className="text-neutral-800">{formatIDR(totalMonthExpense)}</strong> • Rata-rata: <strong className="text-neutral-800">{formatIDR(dailyAverage)}/hari</strong>
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setChartView('daily')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              chartView === 'daily'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Batang Harian</span>
          </button>

          <button
            onClick={() => setChartView('curve')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              chartView === 'curve'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kurva Tren</span>
          </button>

          <button
            onClick={() => setChartView('category')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
              chartView === 'category'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kategori</span>
          </button>
        </div>
      </div>

      {chartView !== 'category' ? (
        <div className="space-y-3">
          {/* Sleek, Clean Info / Hover Banner */}
          <div className="min-h-[42px] px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between text-xs transition-all">
            {hoveredDay ? (
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-800">
                    {formatDateID(hoveredDay.dateStr, 'long')}:
                  </span>
                  <span className="font-extrabold text-emerald-700 tabular-nums">
                    {formatIDR(hoveredDay.total)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      safeDailyLimit > 0 && hoveredDay.total > safeDailyLimit
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {safeDailyLimit > 0 && hoveredDay.total > safeDailyLimit ? 'Melebihi Batas' : 'Aman'}
                  </span>
                </div>

                {hoveredDay.categories.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 truncate max-w-sm">
                    {hoveredDay.categories.map((c) => (
                      <span key={c.category} className="px-1.5 py-0.5 rounded bg-white border border-neutral-200">
                        {c.category}: <strong>{formatIDR(c.amount)}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-neutral-500 text-[11px] italic">
                    🎉 Hari Hemat (Tanpa pengeluaran)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-neutral-500">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Arahkan kursor atau sentuh tanggal untuk melihat rincian belanja</span>
                </span>
                <span className="hidden sm:inline text-[11px] font-medium text-emerald-700">
                  {noSpendDays} Hari Bebas Belanja 🎉
                </span>
              </div>
            )}
          </div>

          {/* SVG Chart Container */}
          <div className="relative pt-1 pb-3 px-2 bg-neutral-50/30 rounded-xl border border-neutral-100">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredDay(null)}
            >
              <defs>
                {/* Emerald Gradient for safe bars */}
                <linearGradient id="barEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Rose Gradient for over bars */}
                <linearGradient id="barRoseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>

                {/* Area Chart Gradient */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="90%" stopColor="#10b981" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Baseline */}
              <line
                x1="0"
                y1={svgHeight - 10}
                x2={svgWidth}
                y2={svgHeight - 10}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Safe Daily spending reference benchmark line */}
              {safeLineY !== null && (
                <g>
                  <line
                    x1="0"
                    y1={safeLineY}
                    x2={svgWidth}
                    y2={safeLineY}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    opacity="0.75"
                  />
                  <rect
                    x="6"
                    y={safeLineY - 12}
                    width="120"
                    height="12"
                    rx="3"
                    fill="#ecfdf5"
                    stroke="#a7f3d0"
                    strokeWidth="0.8"
                  />
                  <text
                    x="10"
                    y={safeLineY - 3}
                    fill="#047857"
                    fontSize="7.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    Batas Harian: {formatCompactIDR(safeDailyLimit)}
                  </text>
                </g>
              )}

              {/* View 1: Bar Chart Mode */}
              {chartView === 'daily' &&
                dailyData.map((d, index) => {
                  const x = index * (barWidth + barPadding) + barPadding;
                  const barHeight =
                    d.total > 0
                      ? Math.max(8, (d.total / chartCeiling) * (svgHeight - 35))
                      : 2;
                  const y = svgHeight - 10 - barHeight;

                  const isOverSafe = safeDailyLimit > 0 && d.total > safeDailyLimit;
                  const isHovered = hoveredDay?.day === d.day;

                  return (
                    <g
                      key={d.day}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDay(d)}
                      onClick={() => setHoveredDay(d)}
                    >
                      {/* Generous hover hit target */}
                      <rect
                        x={x - 1}
                        y="0"
                        width={barWidth + 2}
                        height={svgHeight}
                        fill="transparent"
                      />

                      {/* Bar Rectangle */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={barWidth > 6 ? 3 : 1.5}
                        fill={
                          isHovered
                            ? '#0284c7'
                            : isOverSafe
                            ? 'url(#barRoseGrad)'
                            : d.total > 0
                            ? 'url(#barEmeraldGrad)'
                            : '#e2e8f0'
                        }
                        opacity={d.total === 0 ? 0.6 : 1}
                        className="transition-colors"
                      />

                      {/* Day number label on bottom */}
                      {(d.day === 1 || d.day % 5 === 0 || d.day === daysInMonth) && (
                        <text
                          x={x + barWidth / 2}
                          y={svgHeight + 5}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#94a3b8"
                          fontWeight="600"
                        >
                          {d.day}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* View 2: Smooth Curve Area Mode */}
              {chartView === 'curve' && (
                <g>
                  {/* Filled Area */}
                  <path d={areaPath} fill="url(#areaGradient)" />

                  {/* Curve Line */}
                  <path
                    d={curvePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Day Points */}
                  {dailyData.map((d, i) => {
                    const x = i * (svgWidth / (daysInMonth - 1 || 1));
                    const y =
                      d.total > 0
                        ? svgHeight - 10 - (d.total / chartCeiling) * (svgHeight - 35)
                        : svgHeight - 10;
                    const isHovered = hoveredDay?.day === d.day;
                    const isOver = safeDailyLimit > 0 && d.total > safeDailyLimit;

                    if (d.total === 0 && !isHovered) return null;

                    return (
                      <g
                        key={d.day}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDay(d)}
                        onClick={() => setHoveredDay(d)}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 5 : 3}
                          fill={isHovered ? '#0284c7' : isOver ? '#ef4444' : '#10b981'}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2 : 1}
                          className="transition-all"
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>
        </div>
      ) : (
        /* View 3: Clean Category Breakdown */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          {/* Donut graphic */}
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {(() => {
                  let accumulatedPercent = 0;
                  return categoryBreakdown.map((item) => {
                    const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += item.percentage;
                    const isHovered = hoveredCategory === item.category;

                    return (
                      <circle
                        key={item.category}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth={isHovered ? '17' : '14'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 cursor-pointer"
                        pathLength="100"
                        onMouseEnter={() => setHoveredCategory(item.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                  {hoveredCategory || 'Total Belanja'}
                </span>
                <span className="text-sm font-bold text-neutral-900 tabular-nums">
                  {hoveredCategory
                    ? formatIDR(
                        categoryBreakdown.find((c) => c.category === hoveredCategory)?.amount || 0
                      )
                    : formatCompactIDR(totalMonthExpense)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">
                  {hoveredCategory
                    ? `${categoryBreakdown.find((c) => c.category === hoveredCategory)?.percentage.toFixed(0)}%`
                    : `${categoryBreakdown.length} Pos Kategori`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {categoryBreakdown.map((c) => {
              const isHovered = hoveredCategory === c.category;
              return (
                <div
                  key={c.category}
                  onMouseEnter={() => setHoveredCategory(c.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'border-emerald-400 bg-emerald-50/60 shadow-2xs'
                      : 'border-neutral-150 bg-neutral-50/50 hover:bg-neutral-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-semibold text-neutral-800 text-xs truncate">
                      {c.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-neutral-900 tabular-nums text-xs">
                      {formatIDR(c.amount)}
                    </span>
                    <span className="text-[10px] font-medium text-neutral-400 ml-1.5">
                      ({c.percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
