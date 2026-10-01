import {
  Transaction,
  MonthlyBudget,
  SavingGoal,
  Debt,
  RecurringTransaction,
  FinancialHealthBreakdown,
  SmartRecommendation,
  ExpenseCategory,
  Account,
} from '../types/finance';

/** Pins a legacy transaction to its matching account before the wallet list changes. */
export function pinTransactionAccount(
  transaction: Transaction,
  accounts: Account[]
): Transaction {
  if (transaction.type === 'transfer' || !accounts.length) return transaction;
  if (transaction.accountId && accounts.some((account) => account.id === transaction.accountId)) {
    return transaction;
  }
  const defaultAcc = accounts.find((account) => account.isDefault) || accounts[0];
  const byType = (type: Account['type']) => accounts.find((account) => account.type === type);
  const byName = (needle: string) => accounts.find((account) => account.name.toLowerCase().includes(needle));

  let account: Account | undefined;
  switch (transaction.paymentMethod) {
    case 'Tunai': account = byType('cash'); break;
    case 'Transfer Bank':
    case 'Kartu Debit': account = byType('bank'); break;
    case 'GoPay': account = byName('gopay'); break;
    case 'ShopeePay': account = byName('shopee'); break;
    case 'DANA': account = byName('dana'); break;
    case 'OVO': account = byName('ovo'); break;
  }

  return { ...transaction, accountId: (account || defaultAcc).id };
}

/**
 * Calculates real-time balances for each account/wallet based on transactions and transfers.
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Account[] {
  if (!accounts || accounts.length === 0) return [];

  // Create lookup map initialized with initial balance
  const balanceMap = new Map<string, number>();
  accounts.forEach((acc) => {
    balanceMap.set(acc.id, acc.initialBalance ?? acc.balance ?? 0);
  });

  // Replay transactions
  for (const t of transactions) {
    if (t.type === 'transfer') {
      if (t.fromAccountId && balanceMap.has(t.fromAccountId)) {
        balanceMap.set(t.fromAccountId, (balanceMap.get(t.fromAccountId) || 0) - t.amount);
      }
      if (t.toAccountId && balanceMap.has(t.toAccountId)) {
        balanceMap.set(t.toAccountId, (balanceMap.get(t.toAccountId) || 0) + t.amount);
      }
    } else {
      const accId = pinTransactionAccount(t, accounts).accountId;
      if (!accId || !balanceMap.has(accId)) continue;
      const current = balanceMap.get(accId) || 0;
      if (t.type === 'income') {
        balanceMap.set(accId, current + t.amount);
      } else if (t.type === 'expense') {
        balanceMap.set(accId, current - t.amount);
      } else if (t.type === 'savings_transfer') {
        balanceMap.set(accId, current - t.amount);
      }
    }
  }

  return accounts.map((acc) => ({
    ...acc,
    balance: balanceMap.get(acc.id) ?? 0,
  }));
}

export interface RecurringReminderStatus {
  recurring: RecurringTransaction;
  status: 'paid' | 'due_today' | 'upcoming' | 'overdue' | 'future';
  daysDifference: number; // positive = days until due, negative = days overdue, 0 = today
  formattedDue: string;
  isPaidThisMonth: boolean;
}

/**
 * Evaluates recurring bills/income and determines payment status for the current active month.
 */
export function getRecurringReminders(
  recurring: RecurringTransaction[],
  transactions: Transaction[],
  activeMonth: string,
  referenceDateStr: string = '2026-09-25'
): RecurringReminderStatus[] {
  const refDate = new Date(`${referenceDateStr}T00:00:00`);
  const currentDay = refDate.getDate();

  return recurring.map((rec) => {
    // Check if there is an explicit transaction recorded for this recurring item this month
    const matchingTx = transactions.some((t) => {
      const matchesDate = t.date.startsWith(activeMonth);
      const matchesRecurringId = t.recurringId === rec.id;
      const matchesCategoryAndAmount =
        t.category === rec.category && Math.abs(t.amount - rec.amount) < 1 && t.type === rec.type;
      return matchesDate && (matchesRecurringId || matchesCategoryAndAmount);
    });

    const isPaidThisMonth = matchingTx || rec.lastPaidMonth === activeMonth;

    const dueDay = Math.min(31, Math.max(1, rec.dueDay));
    const daysDiff = dueDay - currentDay;

    let status: 'paid' | 'due_today' | 'upcoming' | 'overdue' | 'future';
    if (isPaidThisMonth) {
      status = 'paid';
    } else if (daysDiff === 0) {
      status = 'due_today';
    } else if (daysDiff > 0 && daysDiff <= (rec.reminderDaysBefore || 3)) {
      status = 'upcoming';
    } else if (daysDiff < 0) {
      status = 'overdue';
    } else {
      status = 'future';
    }

    const dayPad = String(dueDay).padStart(2, '0');
    const formattedDue = `Tgl ${dueDay} ${activeMonth}`;

    return {
      recurring: rec,
      status,
      daysDifference: daysDiff,
      formattedDue,
      isPaidThisMonth,
    };
  });
}

/**
 * Get current balance:
 * openingBalance + all income - all ordinary expenses.
 * Note: Savings transfers to goals stay within the student's wealth, so goal deposits
 * are tracked inside goals, while ordinary expenses reduce balance.
 */
export function calculateCurrentBalance(
  openingBalance: number,
  transactions: Transaction[],
  accounts?: Account[]
): number {
  if (accounts && accounts.length > 0) {
    const computedAccounts = calculateAccountBalances(accounts, transactions);
    return computedAccounts.reduce((sum, a) => sum + a.balance, 0);
  }

  let balance = openingBalance;
  for (const t of transactions) {
    if (t.type === 'income') {
      balance += t.amount;
    } else if (t.type === 'expense') {
      balance -= t.amount;
    }
    else if (t.type === 'savings_transfer') {
      balance -= t.amount;
    }
  }
  return balance;
}

/**
 * Filter transactions by month (format: YYYY-MM)
 */
export function getTransactionsByMonth(
  transactions: Transaction[],
  yearMonth: string
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(yearMonth));
}

/**
 * Monthly income sum
 */
export function calculateMonthlyIncome(transactions: Transaction[], yearMonth: string): number {
  return getTransactionsByMonth(transactions, yearMonth)
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Monthly expense sum (excluding savings transfers)
 */
export function calculateMonthlyExpenses(transactions: Transaction[], yearMonth: string): number {
  return getTransactionsByMonth(transactions, yearMonth)
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Monthly savings = income - expenses
 */
export function calculateMonthlySavings(income: number, expenses: number): number {
  return income - expenses;
}

/**
 * Monthly savings rate = savings / income (or 0 if income <= 0)
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const savings = income - expenses;
  return Math.max(0, savings / income);
}

/**
 * Needs vs Wants breakdown for a given month
 */
export function calculateNeedsVsWants(transactions: Transaction[], yearMonth: string) {
  const monthExpenses = getTransactionsByMonth(transactions, yearMonth).filter(
    (t) => t.type === 'expense'
  );

  let needsTotal = 0;
  let wantsTotal = 0;
  let unclassifiedTotal = 0;

  for (const t of monthExpenses) {
    if (t.classification === 'need') {
      needsTotal += t.amount;
    } else if (t.classification === 'want') {
      wantsTotal += t.amount;
    } else {
      // Default heuristic based on category if classification not explicitly set
      const defaultNeeds: ExpenseCategory[] = [
        'Makanan',
        'Kos',
        'Listrik/Air',
        'Internet/Pulsa',
        'Transportasi',
        'Pendidikan',
        'Kesehatan',
        'Pembayaran Utang',
      ];
      if (defaultNeeds.includes(t.category as ExpenseCategory)) {
        needsTotal += t.amount;
      } else {
        wantsTotal += t.amount;
      }
    }
  }

  const total = needsTotal + wantsTotal + unclassifiedTotal;
  const needsPercent = total > 0 ? (needsTotal / total) * 100 : 0;
  const wantsPercent = total > 0 ? (wantsTotal / total) * 100 : 0;

  return {
    needsTotal,
    wantsTotal,
    total,
    needsPercent,
    wantsPercent,
  };
}

/**
 * Category-based expenses breakdown for a given month
 */
export function calculateExpensesByCategory(
  transactions: Transaction[],
  yearMonth: string
): { category: string; amount: number; percentage: number; count: number }[] {
  const monthExpenses = getTransactionsByMonth(transactions, yearMonth).filter(
    (t) => t.type === 'expense'
  );
  const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  const map = new Map<string, { amount: number; count: number }>();
  for (const t of monthExpenses) {
    const existing = map.get(t.category) || { amount: 0, count: 0 };
    map.set(t.category, {
      amount: existing.amount + t.amount,
      count: existing.count + 1,
    });
  }

  const list = Array.from(map.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
    count: data.count,
  }));

  // Sort descending by amount
  return list.sort((a, b) => b.amount - a.amount);
}

/**
 * Budget status for each category in a month
 */
export interface CategoryBudgetStatus {
  category: ExpenseCategory;
  monthlyLimit: number;
  spent: number;
  remaining: number; // Can be negative if over budget!
  percentageUsed: number;
  status: 'green' | 'yellow' | 'red';
}

export function calculateBudgetStatuses(
  budgets: MonthlyBudget[],
  transactions: Transaction[],
  yearMonth: string
): {
  items: CategoryBudgetStatus[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  overBudgetCount: number;
} {
  const monthExpenses = getTransactionsByMonth(transactions, yearMonth).filter(
    (t) => t.type === 'expense'
  );

  const spentMap = new Map<string, number>();
  for (const t of monthExpenses) {
    spentMap.set(t.category, (spentMap.get(t.category) || 0) + t.amount);
  }

  let totalBudget = 0;
  let totalSpent = 0;
  let overBudgetCount = 0;

  const items: CategoryBudgetStatus[] = budgets.map((b) => {
    const spent = spentMap.get(b.category) || 0;
    const remaining = b.monthlyLimit - spent;
    const percentageUsed = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : spent > 0 ? 100 : 0;

    totalBudget += b.monthlyLimit;
    totalSpent += spent;

    let status: 'green' | 'yellow' | 'red' = 'green';
    if (percentageUsed > 90) {
      status = 'red';
      overBudgetCount++;
    } else if (percentageUsed >= 70) {
      status = 'yellow';
    }

    return {
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      spent,
      remaining,
      percentageUsed: Math.round(percentageUsed),
      status,
    };
  });

  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return {
    items,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
    overBudgetCount,
  };
}

/**
 * Daily Spending Limit (Batas Belanja Harian Aman)
 * Formula:
 * (Liquid Wallet Balance - Required Remaining Savings - Committed Remaining Essential Expenses) / Days remaining until next allowance/payday
 *
 * If paydayOrAllowanceDay is configured (e.g. 10 for the 10th of every month):
 * Remaining days is calculated from today up to the next allowance date.
 * E.g. Today is Sep 29 and payday is 10 -> 11 days remaining until Oct 10.
 * If payday is 1 or undefined -> remaining days until 1st of next month (end of calendar month).
 */
export function calculateSafeDailySpending(
  currentBalance: number,
  desiredMonthlySavings: number,
  savedThisMonth: number,
  upcomingCommittedExpenses: number,
  todayDate: Date = new Date(),
  paydayOrAllowanceDay: number = 1
) {
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth();
  const todayDay = todayDate.getDate();
  const todayMidnight = new Date(year, month, todayDay, 0, 0, 0, 0);

  // Total days in the current calendar month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Validate allowance day (1 - 31)
  const validPayday = Math.min(31, Math.max(1, Number(paydayOrAllowanceDay) || 1));
  const isAllowanceCycleActive = validPayday !== 1 || todayDay > 1;

  let targetYear = year;
  let targetMonth = month;

  if (todayDay >= validPayday) {
    // If today is on or after the allowance day, next allowance is in the following month
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  // Clamp to max days in target month (e.g. Feb 28, Apr 30)
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedTargetDay = Math.min(validPayday, maxDaysInTargetMonth);
  const nextAllowanceDate = new Date(targetYear, targetMonth, clampedTargetDay, 0, 0, 0, 0);

  // Difference in whole days
  const diffMs = nextAllowanceDate.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const remainingDays = Math.max(1, diffDays);
  const nextAllowanceDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(clampedTargetDay).padStart(2, '0')}`;

  // Remaining savings needed this month
  const remainingSavingsTarget = Math.max(0, desiredMonthlySavings - savedThisMonth);

  // Available discretionary pool
  const availablePool = currentBalance - remainingSavingsTarget - upcomingCommittedExpenses;
  const safeDaily = Math.max(0, Math.floor(availablePool / remainingDays));

  return {
    safeDaily,
    availablePool,
    remainingDays,
    totalDaysInMonth,
    remainingSavingsTarget,
    upcomingCommittedExpenses,
    paydayOrAllowanceDay: validPayday,
    nextAllowanceDateStr,
    isAllowanceCycleActive,
  };
}

/**
 * Calculate saving goal requirements
 */
export function calculateGoalMetrics(
  goal: SavingGoal,
  referenceDateStr: string = new Date().toISOString().slice(0, 10)
) {
  const refDate = new Date(referenceDateStr + 'T00:00:00');
  const targetDate = new Date(goal.targetDate + 'T00:00:00');

  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progressRatio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));

  // Remaining days
  const diffMs = targetDate.getTime() - refDate.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const diffMonths = Math.max(1, Math.ceil(diffDays / 30.416));

  const requiredMonthly = Math.ceil(remainingAmount / diffMonths);
  const requiredDaily = Math.ceil(remainingAmount / diffDays);

  // Is on track: if current date progress ratio >= expected time progress ratio
  const createdDate = new Date((goal.createdAt || referenceDateStr) + 'T00:00:00');
  const totalDurationMs = Math.max(1, targetDate.getTime() - createdDate.getTime());
  const elapsedMs = Math.max(0, refDate.getTime() - createdDate.getTime());
  const expectedPaceRatio = totalDurationMs > 0 ? elapsedMs / totalDurationMs : 0;

  const isOnTrack = goal.currentAmount >= goal.targetAmount || progressRatio >= expectedPaceRatio * 0.9;

  return {
    remainingAmount,
    progressRatio,
    progressPercent,
    diffDays,
    diffMonths,
    requiredMonthly,
    requiredDaily,
    isOnTrack,
  };
}

/**
 * Financial Health Score (0 - 100)
 */
export function calculateFinancialHealthScore(
  income: number,
  expenses: number,
  budgetStatuses: { items: CategoryBudgetStatus[]; totalBudget: number; totalSpent: number },
  savingGoals: SavingGoal[],
  debts: Debt[],
  currentBalance: number
): FinancialHealthBreakdown {
  const recommendations: string[] = [];

  // 1. Budget Adherence (0 - 25 points)
  let budgetScore = 25;
  if (budgetStatuses.totalBudget > 0) {
    const overBudgetItems = budgetStatuses.items.filter((i) => i.spent > i.monthlyLimit);
    if (overBudgetItems.length > 0) {
      budgetScore = Math.max(5, 25 - overBudgetItems.length * 6);
      recommendations.push(
        `Ada ${overBudgetItems.length} kategori yang melebihi batas anggaran (${overBudgetItems.map((i) => i.category).join(', ')}). Kurangi pengeluaran di kategori ini.`
      );
    }
  } else {
    budgetScore = 15; // default if no budget set
    recommendations.push('Buat anggaran bulanan untuk mengontrol pengeluaran tiap kategori.');
  }

  // 2. Savings Rate (0 - 25 points)
  let savingsScore = 0;
  const savingsRate = income > 0 ? (income - expenses) / income : 0;
  if (savingsRate >= 0.2) {
    savingsScore = 25;
  } else if (savingsRate >= 0.1) {
    savingsScore = 20;
  } else if (savingsRate >= 0.05) {
    savingsScore = 14;
    recommendations.push('Tingkatkan tabungan bulanan menjadi minimal 10%–20% dari kiriman/pemasukan.');
  } else if (savingsRate > 0) {
    savingsScore = 8;
    recommendations.push('Tabungan bulan ini masih tipis (<5%). Sisihkan uang di awal bulan begitu menerima kiriman.');
  } else {
    savingsScore = 0;
    recommendations.push('Peringatan: Pengeluaran bulan ini melebihi pemasukan (defisit arus kas). Tekan pengeluaran non-esensial segera.');
  }

  // 3. Emergency Fund / Saving Goals Progress (0 - 20 points)
  let emergencyScore = 10;
  const emergencyGoal = savingGoals.find((g) => g.isEmergencyFund || g.name.toLowerCase().includes('darurat'));
  if (emergencyGoal) {
    const ratio = emergencyGoal.targetAmount > 0 ? emergencyGoal.currentAmount / emergencyGoal.targetAmount : 0;
    if (ratio >= 1) {
      emergencyScore = 20;
    } else if (ratio >= 0.5) {
      emergencyScore = 16;
    } else {
      emergencyScore = 10;
      recommendations.push('Lanjutkan mengisi Dana Darurat hingga minimal 1–3 bulan biaya hidup pokok mahasiswa.');
    }
  } else if (savingGoals.length > 0) {
    emergencyScore = 14;
    recommendations.push('Disarankan membuat target khusus "Dana Darurat Mahasiswa" untuk antisipasi kebutuhan mendadak.');
  } else {
    emergencyScore = 5;
    recommendations.push('Kamu belum memiliki target tabungan. Buat target tabungan pertama untuk menjaga motivasi berhemat.');
  }

  // 4. Discretionary Spending / Cash Buffer (0 - 15 points)
  let discretionaryScore = 12;
  if (currentBalance < 0) {
    discretionaryScore = 0;
    recommendations.push('Saldo saat ini minus! Lakukan penyesuaian catatan atau prioritaskan pelunasan.');
  } else if (currentBalance < 100_000) {
    discretionaryScore = 4;
    recommendations.push('Saldo dompet sangat tipis (< Rp 100.000). Batasi jajan dan fokus pada kebutuhan esensial.');
  } else if (currentBalance >= 500_000) {
    discretionaryScore = 15;
  }

  // 5. Debt Management (0 - 15 points)
  let debtScore = 15;
  const payables = debts.filter((d) => d.type === 'payable' && d.remainingAmount > 0);
  const totalDebt = payables.reduce((sum, d) => sum + d.remainingAmount, 0);
  if (totalDebt > 0) {
    if (income > 0 && totalDebt > income * 0.3) {
      debtScore = 5;
      recommendations.push(`Total utang/cicilan (Rp ${totalDebt.toLocaleString('id-ID')}) cukup besar dibanding pemasukan. Prioritaskan cicilan.`);
    } else {
      debtScore = 10;
      recommendations.push('Ada tanggungan utang/pinjaman aktif. Pastikan bayar tepat waktu sebelum jatuh tempo.');
    }
  }

  const overallScore = Math.min(100, Math.max(0, budgetScore + savingsScore + emergencyScore + discretionaryScore + debtScore));

  let rating: FinancialHealthBreakdown['rating'] = 'Cukup';
  if (overallScore >= 85) rating = 'Sangat Sehat';
  else if (overallScore >= 70) rating = 'Sehat';
  else if (overallScore >= 50) rating = 'Cukup';
  else if (overallScore >= 35) rating = 'Perlu Perhatian';
  else rating = 'Kritis';

  if (recommendations.length === 0) {
    recommendations.push('Pengelolaan keuanganmu sangat solid! Pertahankan kedisiplinan mencatat dan menabung.');
  }

  return {
    overallScore,
    rating,
    budgetScore,
    savingsScore,
    emergencyScore,
    discretionaryScore,
    debtScore,
    recommendations,
  };
}

/**
 * Smart Saving Recommendations
 */
export function generateSmartRecommendations(
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  savingGoals: SavingGoal[],
  yearMonth: string,
  income: number
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const monthExpenses = getTransactionsByMonth(transactions, yearMonth).filter((t) => t.type === 'expense');

  // Check Nongkrong / Kopi spending
  const nongkrongSpend = monthExpenses
    .filter((t) => t.category === 'Nongkrong' || t.notes?.toLowerCase().includes('kopi') || t.notes?.toLowerCase().includes('cafe'))
    .reduce((sum, t) => sum + t.amount, 0);

  if (income > 0 && nongkrongSpend > income * 0.15) {
    recommendations.push({
      id: 'rec_nongkrong',
      type: 'warning',
      title: 'Pengeluaran Nongkrong & Kopi Cukup Tinggi',
      message: `Total pengeluaran nongkrong/kafe sudah mencapai Rp ${nongkrongSpend.toLocaleString('id-ID')} (${Math.round((nongkrongSpend / income) * 100)}% dari kiriman/pemasukan).`,
      reason: 'Dihitung karena pengeluaran Nongkrong melebihi ambang batas rekomendasi mahasiswa (15% dari total pemasukan).',
      actionableStep: 'Coba kurangi nongkrong dari 4x seminggu jadi 2x, atau seduh kopi sendiri di kos untuk berhemat Rp 100.000–200.000/bulan.',
    });
  }

  // Check Subscriptions
  const subscriptions = monthExpenses.filter((t) => t.category === 'Subscription');
  const subTotal = subscriptions.reduce((sum, t) => sum + t.amount, 0);
  if (subscriptions.length >= 3 || subTotal >= 150_000) {
    recommendations.push({
      id: 'rec_subs',
      type: 'tip',
      title: 'Audit Langganan Digital (Subscription)',
      message: `Kamu memiliki pengeluaran langganan total Rp ${subTotal.toLocaleString('id-ID')}.`,
      reason: 'Dihitung dari transaksi berkategori Subscription bulan ini.',
      actionableStep: 'Periksa Spotify Family, Netflix sharing, atau YouTube Premium mahasiswa untuk menghemat biaya bulanan bersama teman kos.',
    });
  }

  // Check Emergency Fund
  const hasEmergency = savingGoals.some((g) => g.isEmergencyFund || g.name.toLowerCase().includes('darurat'));
  if (!hasEmergency) {
    recommendations.push({
      id: 'rec_emergency',
      type: 'tip',
      title: 'Mulai Bangun Dana Darurat Mahasiswa',
      message: 'Kamu belum memiliki target Dana Darurat aktif.',
      reason: 'Mahasiswa rentan biaya darurat (ban bocor, ganti charger laptop, obat mendadak, tiket pulang darurat).',
      actionableStep: 'Buat target Dana Darurat sebesar Rp 1.000.000 – Rp 2.000.000 dan isi Rp 50.000 setiap awal bulan.',
    });
  }

  // Praise good savings
  const totalExp = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  if (income > 0 && totalExp <= income * 0.7) {
    recommendations.push({
      id: 'rec_praise',
      type: 'praise',
      title: 'Hebat! Kamu Menyimpan Lebih dari 30% Bulan Ini',
      message: 'Arus kas bulan ini sangat sehat dan kamu memiliki surplus tabungan yang kuat.',
      reason: 'Pengeluaranmu di bawah 70% dari pemasukan bulan berjalan.',
      actionableStep: 'Alokasikan sebagian surplus ke target tabungan utama agar impianmu tercapai lebih cepat.',
    });
  }

  return recommendations;
}

/**
 * End of Month Cash-flow forecast
 */
export function calculateCashFlowForecast(
  currentBalance: number,
  recurringList: RecurringTransaction[],
  transactions: Transaction[],
  yearMonth: string,
  today: Date = new Date()
) {
  const currentDay = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const remainingDays = Math.max(0, lastDay - currentDay);

  // Remaining upcoming recurring transactions for this month
  let upcomingRecurringIncome = 0;
  let upcomingRecurringExpenses = 0;

  for (const r of recurringList) {
    if (r.dueDay > currentDay && r.dueDay <= lastDay) {
      if (r.type === 'income') {
        upcomingRecurringIncome += r.amount;
      } else {
        upcomingRecurringExpenses += r.amount;
      }
    }
  }

  // Estimate daily discretionary burn rate based on past 14 days or current month so far
  const monthExpenses = getTransactionsByMonth(transactions, yearMonth).filter((t) => t.type === 'expense');
  const pastDays = Math.max(1, currentDay);
  const totalSpentSoFar = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const averageDailySpent = Math.round(totalSpentSoFar / pastDays);

  const estimatedDiscretionarySpend = averageDailySpent * remainingDays;
  const projectedBalance =
    currentBalance + upcomingRecurringIncome - upcomingRecurringExpenses - estimatedDiscretionarySpend;

  return {
    currentBalance,
    upcomingRecurringIncome,
    upcomingRecurringExpenses,
    estimatedDiscretionarySpend,
    averageDailySpent,
    remainingDays,
    projectedBalance,
  };
}

/**
 * Gamification streak and no-spend days calculation
 */
export function calculateStreaksAndMilestones(
  transactions: Transaction[],
  todayStr: string = new Date().toISOString().slice(0, 10)
) {
  // Days with no non-essential expenses
  const datesWithExpenses = new Set<string>();
  const allDays = new Set<string>();

  for (const t of transactions) {
    allDays.add(t.date);
    if (t.type === 'expense' && t.classification === 'want') {
      datesWithExpenses.add(t.date);
    }
  }

  // Count no-spend days in current month
  const currentYearMonth = todayStr.slice(0, 7);
  const currentDayNum = parseInt(todayStr.slice(8, 10), 10);
  let noSpendDaysThisMonth = 0;

  for (let d = 1; d <= currentDayNum; d++) {
    const dayStr = `${currentYearMonth}-${String(d).padStart(2, '0')}`;
    const dayTransactions = transactions.filter((t) => t.date === dayStr && t.type === 'expense');
    const spentOnWants = dayTransactions
      .filter((t) => t.classification === 'want' || t.category === 'Nongkrong' || t.category === 'Shopping' || t.category === 'Entertainment')
      .reduce((sum, t) => sum + t.amount, 0);

    if (spentOnWants === 0 && dayTransactions.length > 0) {
      noSpendDaysThisMonth++;
    }
  }

  // Consecutive tracking streak (days where at least 1 transaction was logged or reviewed)
  let trackingStreak = 1;
  const todayDate = new Date(todayStr + 'T00:00:00');
  for (let i = 1; i <= 30; i++) {
    const prev = new Date(todayDate);
    prev.setDate(prev.getDate() - i);
    const dateStr = prev.toISOString().slice(0, 10);
    const hasLog = transactions.some((t) => t.date === dateStr);
    if (hasLog) {
      trackingStreak++;
    } else {
      break;
    }
  }

  // Milestones
  const milestones = [
    {
      id: 'first_record',
      title: 'Pencatat Disiplin',
      desc: 'Mencatat transaksi keuangan pertamamu.',
      achieved: transactions.length >= 1,
    },
    {
      id: 'ten_records',
      title: 'Master Transaksi',
      desc: 'Mencatat 10 transaksi dalam satu aplikasi.',
      achieved: transactions.length >= 10,
    },
    {
      id: 'no_spend_champ',
      title: 'Hari Hemat Juara',
      desc: 'Mencapai minimal 3 hari tanpa jajan non-esensial.',
      achieved: noSpendDaysThisMonth >= 3,
    },
    {
      id: 'savings_hero',
      title: 'Pahlawan Tabungan',
      desc: 'Menyimpan lebih dari Rp 500.000 ke dalam target tabungan.',
      achieved: transactions.some((t) => t.type === 'savings_transfer' && t.amount >= 500_000),
    },
  ];

  return {
    trackingStreak,
    noSpendDaysThisMonth,
    milestones,
  };
}

/**
 * 5. AI-driven Cash-Flow Forecast & Student Runway ("Berapa Hari Bertahan")
 */
export function calculateStudentRunway(
  currentBalance: number,
  transactions: Transaction[],
  recurringList: RecurringTransaction[],
  yearMonth: string
) {
  // Expenses this month
  const monthExpenses = transactions.filter(
    (t) => t.date.startsWith(yearMonth) && t.type === 'expense'
  );

  const today = new Date();
  const currentDay = Math.max(1, today.getDate());
  const totalSpentSoFar = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Daily burn rate (minimum fallback to Rp 25.000 / day if no data yet)
  const rawDailyBurn = totalSpentSoFar > 0 ? Math.round(totalSpentSoFar / currentDay) : 35_000;
  const dailyBurn = Math.max(15_000, rawDailyBurn);

  // Days money will survive with current balance
  const effectiveBalance = Math.max(0, currentBalance);
  const survivalDays = Math.floor(effectiveBalance / dailyBurn);

  // Projected zero balance date
  const projectedEndDate = new Date();
  projectedEndDate.setDate(projectedEndDate.getDate() + survivalDays);
  const projectedEndDateStr = projectedEndDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate upcoming mandatory recurring expenses for the remainder of the month
  const upcomingMandatoryBills = recurringList
    .filter((r) => r.type === 'expense' && r.dueDay > currentDay)
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalanceAfterBills = effectiveBalance - upcomingMandatoryBills;
  const netSurvivalDays = Math.max(0, Math.floor(netBalanceAfterBills / dailyBurn));

  let status: 'safe' | 'caution' | 'critical' = 'safe';
  let message = '';
  let studentTip = '';

  if (survivalDays >= 30) {
    status = 'safe';
    message = `Uangmu diprediksi aman hingga ${survivalDays} hari ke depan (${projectedEndDateStr}).`;
    studentTip = 'Kondisi kas sangat kuat. Manfaatkan sisa dana untuk tabungan dana darurat atau modal akademik.';
  } else if (survivalDays >= 14) {
    status = 'caution';
    message = `Uangmu diprediksi bertahan sekitar ${survivalDays} hari lagi (${projectedEndDateStr}).`;
    studentTip = 'Jaga pengeluaran non-pokok. Utamakan masak nasi di kos dan kurangi jajan kafe.';
  } else {
    status = 'critical';
    message = `Peringatan: Saldo hanya cukup untuk sekitar ${survivalDays} hari (${projectedEndDateStr})!`;
    studentTip = `Tekan batas pengeluaran harian menjadi Rp ${Math.round(effectiveBalance / 30).toLocaleString('id-ID')}/hari agar bertahan hingga akhir bulan.`;
  }

  return {
    dailyBurn,
    survivalDays,
    netSurvivalDays,
    projectedEndDateStr,
    upcomingMandatoryBills,
    status,
    message,
    studentTip,
  };
}

/**
 * 11. Analisis Emosi & Sentimen Pengeluaran (Emotional/Impulse Spending Breakdown)
 */
export function calculateEmotionalSpending(
  transactions: Transaction[],
  yearMonth: string
) {
  const monthExpenses = transactions.filter(
    (t) => t.date.startsWith(yearMonth) && t.type === 'expense'
  );

  const moodMap = {
    rational: { label: 'Rasional & Kebutuhan', count: 0, amount: 0, color: '#10b981' },
    impulsive: { label: 'Lapar Mata / Impulsif', count: 0, amount: 0, color: '#f59e0b' },
    stress: { label: 'Stres Kuliah / Pelampiasan', count: 0, amount: 0, color: '#ef4444' },
    reward: { label: 'Self-Reward Terencana', count: 0, amount: 0, color: '#8b5cf6' },
    fomo: { label: 'FOMO / Ikut Teman', count: 0, amount: 0, color: '#ec4899' },
  };

  let totalTagged = 0;
  let totalTaggedAmount = 0;

  for (const t of monthExpenses) {
    const mood = t.mood || (t.classification === 'want' ? 'impulsive' : 'rational');
    if (moodMap[mood]) {
      moodMap[mood].count += 1;
      moodMap[mood].amount += t.amount;
      totalTagged += 1;
      totalTaggedAmount += t.amount;
    }
  }

  const emotionalWaste = moodMap.impulsive.amount + moodMap.stress.amount + moodMap.fomo.amount;
  const wastePercentage = totalTaggedAmount > 0 ? Math.round((emotionalWaste / totalTaggedAmount) * 100) : 0;

  return {
    moodMap,
    totalTagged,
    totalTaggedAmount,
    emotionalWaste,
    wastePercentage,
  };
}
