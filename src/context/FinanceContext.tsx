import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Transaction,
  MonthlyBudget,
  SavingGoal,
  RecurringTransaction,
  Debt,
  UserSettings,
  AppNotification,
  ExpenseCategory,
  FinancialHealthBreakdown,
  SmartRecommendation,
  BudgetingMethodType,
  Account,
  DeviceSyncStatus,
  SemesterBudget,
  Scholarship,
  CampusBill,
  SplitBill,
  PriceComparisonItem,
  GamificationProfile,
} from '../types/finance';
import {
  generateBudgetPresetForMethod,
  BUDGETING_METHODS,
} from '../data/budgetingMethods';
import {
  calculateDataHash,
  getOutboxQueue,
  enqueueOutboxMutation,
  clearAllOutboxMutations,
  resolveSyncBaseUrl,
  getTombstones,
  addTombstone,
  clearTombstones,
  saveEmergencyBackup,
  getEmergencyBackup,
} from '../utils/syncEngine';
import {
  INITIAL_USER_SETTINGS,
  INITIAL_BUDGETS,
  INITIAL_SAVING_GOALS,
  INITIAL_RECURRING,
  INITIAL_DEBTS,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACCOUNTS,
  INITIAL_SEMESTER_BUDGETS,
  INITIAL_SCHOLARSHIPS,
  INITIAL_CAMPUS_BILLS,
  INITIAL_SPLIT_BILLS,
  INITIAL_PRICE_COMPARISONS,
  INITIAL_GAMIFICATION,
} from '../data/seedData';
import {
  calculateCurrentBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateMonthlySavings,
  calculateSavingsRate,
  calculateNeedsVsWants,
  calculateExpensesByCategory,
  calculateBudgetStatuses,
  calculateSafeDailySpending,
  calculateFinancialHealthScore,
  generateSmartRecommendations,
  calculateCashFlowForecast,
  calculateStreaksAndMilestones,
  calculateStudentRunway,
  calculateEmotionalSpending,
  CategoryBudgetStatus,
  calculateAccountBalances,
  pinTransactionAccount,
  getRecurringReminders,
  RecurringReminderStatus,
} from '../utils/calculations';
import { getTodayDateString, getCurrentMonthString } from '../utils/formatters';

interface FinanceContextType {
  // State
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  savingGoals: SavingGoal[];
  recurring: RecurringTransaction[];
  debts: Debt[];
  settings: UserSettings;
  notifications: AppNotification[];
  accounts: Account[];
  semesterBudgets: SemesterBudget[];
  scholarships: Scholarship[];
  campusBills: CampusBill[];
  splitBills: SplitBill[];
  priceComparisons: PriceComparisonItem[];
  gamificationProfile: GamificationProfile;
  activeMonth: string; // YYYY-MM
  setActiveMonth: (month: string) => void;

  // Offline / Storage / Multi-Device Sync state
  isOnline: boolean;
  lastSavedAt: string | null;
  storageUsageBytes: number;
  syncStatus: DeviceSyncStatus;

  // Derived metrics
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  recurringReminders: RecurringReminderStatus[];
  budgetSummary: {
    items: CategoryBudgetStatus[];
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    overBudgetCount: number;
  };
  needsVsWants: {
    needsTotal: number;
    wantsTotal: number;
    total: number;
    needsPercent: number;
    wantsPercent: number;
  };
  expensesByCategory: { category: string; amount: number; percentage: number; count: number }[];
  safeDailySpend: ReturnType<typeof calculateSafeDailySpending>;
  healthScore: FinancialHealthBreakdown;
  smartRecommendations: SmartRecommendation[];
  cashFlowForecast: ReturnType<typeof calculateCashFlowForecast>;
  gamification: ReturnType<typeof calculateStreaksAndMilestones>;
  studentRunway: ReturnType<typeof calculateStudentRunway>;
  emotionalSpending: ReturnType<typeof calculateEmotionalSpending>;
  todaySpent: number;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, notes?: string, date?: string) => void;
  setBudgetLimit: (category: ExpenseCategory, monthlyLimit: number) => void;
  addSavingGoal: (goal: Omit<SavingGoal, 'id' | 'createdAt'>) => void;
  updateSavingGoal: (id: string, updates: Partial<SavingGoal>) => void;
  deleteSavingGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, type: 'deposit' | 'withdraw', notes?: string) => void;
  addRecurring: (rec: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  processRecurringEntry: (recurringId: string, targetAccountId?: string) => void;
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'payments' | 'remainingAmount'>) => void;
  recordDebtPayment: (debtId: string, amount: number, notes?: string) => void;
  deleteDebt: (id: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  applyBudgetingMethod: (methodId: BudgetingMethodType) => void;
  applyCustomBudgets: (newBudgets: MonthlyBudget[], methodId?: BudgetingMethodType) => void;
  selectedBudgetingMethod: BudgetingMethodType;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => { success: boolean; error?: string };
  restoreEmergencyBackup: () => { success: boolean; count?: number; message?: string };

  // New Student Feature Actions
  addSemesterBudget: (sb: Omit<SemesterBudget, 'id' | 'createdAt'>) => void;
  updateSemesterBudget: (id: string, updates: Partial<SemesterBudget>) => void;
  deleteSemesterBudget: (id: string) => void;

  addScholarship: (sch: Omit<Scholarship, 'id' | 'createdAt'>) => void;
  updateScholarship: (id: string, updates: Partial<Scholarship>) => void;
  deleteScholarship: (id: string) => void;
  disburseScholarship: (id: string, targetAccountId?: string) => void;

  addCampusBill: (bill: Omit<CampusBill, 'id' | 'createdAt'>) => void;
  updateCampusBill: (id: string, updates: Partial<CampusBill>) => void;
  deleteCampusBill: (id: string) => void;
  payCampusBill: (id: string, accountId?: string) => void;

  addSplitBill: (split: Omit<SplitBill, 'id' | 'createdAt'>) => void;
  updateSplitBill: (id: string, updates: Partial<SplitBill>) => void;
  deleteSplitBill: (id: string) => void;
  toggleSplitBillMemberPaid: (splitId: string, memberId: string) => void;

  claimGamificationQuest: (questId: string) => void;
  addGamificationXP: (amount: number, reason?: string) => void;
}

const STORAGE_KEY = 'student_finance_tracker_data_v1';

function serializeCoreData(data: any): string {
  if (!data) return '';
  return JSON.stringify({
    transactions: data.transactions || [],
    budgets: data.budgets || [],
    savingGoals: data.savingGoals || [],
    recurring: data.recurring || [],
    debts: data.debts || [],
    settings: data.settings || {},
    notifications: data.notifications || [],
    accounts: data.accounts || [],
    semesterBudgets: data.semesterBudgets || [],
    scholarships: data.scholarships || [],
    campusBills: data.campusBills || [],
    splitBills: data.splitBills || [],
    priceComparisons: data.priceComparisons || [],
    gamificationProfile: data.gamificationProfile || data.gamification || null,
    activeMonth: data.activeMonth || '',
  });
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or clean defaults
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonthString());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>(INITIAL_BUDGETS);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_USER_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const accountsRef = useRef<Account[]>(INITIAL_ACCOUNTS);
  accountsRef.current = accounts;
  const [semesterBudgets, setSemesterBudgets] = useState<SemesterBudget[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [campusBills, setCampusBills] = useState<CampusBill[]>([]);
  const [splitBills, setSplitBills] = useState<SplitBill[]>([]);
  const [priceComparisons, setPriceComparisons] = useState<PriceComparisonItem[]>(INITIAL_PRICE_COMPARISONS);
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile>(INITIAL_GAMIFICATION);

  // Network & persistence status
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);

  // Synchronization refs
  const deviceIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? localStorage.getItem('fintrack_device_id') ||
        (() => {
          const newId = 'dev_' + Math.random().toString(36).substring(2, 9);
          try {
            localStorage.setItem('fintrack_device_id', newId);
          } catch {
            // ignore
          }
          return newId;
        })()
      : 'device_unknown'
  );
  const localVersionRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  const skipNextPushRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<any>(null);
  const lastSavedSerializedRef = useRef<string>('');

  // Listen to online / offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate current storage usage
  const calculateStorageSize = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setStorageUsageBytes(new Blob([data]).size);
      }
    } catch {
      // ignore
    }
  };

  // Load from local storage on mount with automated backup recovery
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const backup = getEmergencyBackup();

      let parsed: any = null;
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch {
          parsed = null;
        }
      }

      // If main storage has empty transactions but backup has them, restore from backup!
      if (!parsed || (!parsed.transactions?.length && backup?.transactions?.length)) {
        if (backup && backup.transactions?.length > 0) {
          parsed = { ...(parsed || {}), transactions: backup.transactions };
        }
      }

      // If main storage has empty accounts but backup has them, restore from backup!
      if (!parsed || (!parsed.accounts?.length && backup?.accounts?.length)) {
        if (backup && backup.accounts?.length > 0) {
          parsed = { ...(parsed || {}), accounts: backup.accounts };
        }
      }

      if (parsed) {
        const loadedAccounts =
          Array.isArray(parsed.accounts) && parsed.accounts.length > 0
            ? parsed.accounts as Account[]
            : INITIAL_ACCOUNTS;
        if (parsed.transactions) {
          const cleanTx = parsed.transactions.filter(
            (t: Transaction) => !t.id.startsWith('tx_demo_')
          ).map((t: Transaction) => pinTransactionAccount(t, loadedAccounts));
          setTransactions(cleanTx);
          parsed.transactions = cleanTx;
        }
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.savingGoals) {
          const cleanGoals = parsed.savingGoals.filter(
            (g: SavingGoal) => !['goal_laptop', 'goal_emergency', 'goal_cert'].includes(g.id)
          );
          setSavingGoals(cleanGoals);
        }
        if (parsed.recurring) {
          const cleanRec = parsed.recurring.filter(
            (r: RecurringTransaction) =>
              !['rec_ortu', 'rec_aslab', 'rec_kos', 'rec_spotify', 'rec_internet'].includes(r.id)
          );
          setRecurring(cleanRec);
        }
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.notifications) {
          const cleanNotifs = parsed.notifications.filter(
            (n: AppNotification) =>
              !['notif_1', 'notif_2', 'notif_3'].includes(n.id)
          );
          setNotifications(cleanNotifs);
        }
        setAccounts(loadedAccounts);
        parsed.accounts = loadedAccounts;
        const tombstoneSet = new Set(getTombstones());
        if (parsed.semesterBudgets && Array.isArray(parsed.semesterBudgets)) {
          setSemesterBudgets(parsed.semesterBudgets.filter((s: SemesterBudget) => !tombstoneSet.has(s.id) && s.id !== 'sem_1'));
        } else {
          setSemesterBudgets([]);
        }
        if (parsed.scholarships && Array.isArray(parsed.scholarships)) {
          setScholarships(parsed.scholarships.filter((s: Scholarship) => !tombstoneSet.has(s.id) && !['sch_1', 'sch_2'].includes(s.id)));
        } else {
          setScholarships([]);
        }
        if (parsed.campusBills && Array.isArray(parsed.campusBills)) {
          setCampusBills(parsed.campusBills.filter((b: CampusBill) => !tombstoneSet.has(b.id) && !['bill_ukt', 'bill_lab', 'bill_lib', 'bill_org'].includes(b.id)));
        } else {
          setCampusBills([]);
        }
        if (parsed.splitBills && Array.isArray(parsed.splitBills)) {
          setSplitBills(parsed.splitBills.filter((s: SplitBill) => !tombstoneSet.has(s.id) && s.id !== 'split_1'));
        } else {
          setSplitBills([]);
        }
        if (parsed.priceComparisons && Array.isArray(parsed.priceComparisons)) {
          setPriceComparisons(parsed.priceComparisons);
        }
        if (parsed.gamificationProfile) {
          setGamificationProfile(parsed.gamificationProfile);
        }
        setActiveMonth(getCurrentMonthString());
        if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
        setStorageUsageBytes(new Blob([saved || '']).size);

        // Keep fresh emergency backup
        saveEmergencyBackup(parsed);
        lastSavedSerializedRef.current = serializeCoreData(parsed);
      } else {
        // Initial clean data saved to localStorage
        const tombstoneSet = new Set(getTombstones());
        const initialData = {
          transactions: [],
          budgets: INITIAL_BUDGETS,
          savingGoals: [],
          recurring: [],
          debts: [],
          settings: INITIAL_USER_SETTINGS,
          notifications: [],
          accounts: INITIAL_ACCOUNTS,
          semesterBudgets: [],
          scholarships: [],
          campusBills: [],
          splitBills: [],
          priceComparisons: INITIAL_PRICE_COMPARISONS,
          gamificationProfile: INITIAL_GAMIFICATION,
          activeMonth: getCurrentMonthString(),
          lastSavedAt: new Date().toISOString(),
        };
        const serialized = JSON.stringify(initialData);
        localStorage.setItem(STORAGE_KEY, serialized);
        saveEmergencyBackup(initialData);
        setStorageUsageBytes(new Blob([serialized]).size);
        setLastSavedAt(initialData.lastSavedAt);
        setAccounts(INITIAL_ACCOUNTS);
        lastSavedSerializedRef.current = serializeCoreData(initialData);
      }
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
      setAccounts(INITIAL_ACCOUNTS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Cross-tab sync: listen for changes made in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const serialized = serializeCoreData(parsed);
          if (serialized === lastSavedSerializedRef.current) return;
          lastSavedSerializedRef.current = serialized;
          skipNextPushRef.current = true;

          if (parsed.transactions && Array.isArray(parsed.transactions)) {
            const syncedAccounts = Array.isArray(parsed.accounts) ? parsed.accounts : accountsRef.current;
            setTransactions(parsed.transactions.map((t: Transaction) => pinTransactionAccount(t, syncedAccounts)));
          }
          if (parsed.budgets) setBudgets(parsed.budgets);
          if (parsed.savingGoals) setSavingGoals(parsed.savingGoals);
          if (parsed.recurring) setRecurring(parsed.recurring);
          if (parsed.debts) setDebts(parsed.debts);
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.accounts) setAccounts(parsed.accounts);
          const tombstoneSet = new Set(getTombstones());
          if (parsed.semesterBudgets && Array.isArray(parsed.semesterBudgets)) {
            setSemesterBudgets(parsed.semesterBudgets.filter((s: SemesterBudget) => !tombstoneSet.has(s.id) && s.id !== 'sem_1'));
          }
          if (parsed.scholarships && Array.isArray(parsed.scholarships)) {
            setScholarships(parsed.scholarships.filter((s: Scholarship) => !tombstoneSet.has(s.id) && !['sch_1', 'sch_2'].includes(s.id)));
          }
          if (parsed.campusBills && Array.isArray(parsed.campusBills)) {
            setCampusBills(parsed.campusBills.filter((b: CampusBill) => !tombstoneSet.has(b.id) && !['bill_ukt', 'bill_lab', 'bill_lib', 'bill_org'].includes(b.id)));
          }
          if (parsed.splitBills && Array.isArray(parsed.splitBills)) {
            setSplitBills(parsed.splitBills.filter((s: SplitBill) => !tombstoneSet.has(s.id) && s.id !== 'split_1'));
          }
          if (parsed.priceComparisons) setPriceComparisons(parsed.priceComparisons);
          if (parsed.gamificationProfile) setGamificationProfile(parsed.gamificationProfile);
          if (parsed.activeMonth) setActiveMonth(parsed.activeMonth);
          if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
          setStorageUsageBytes(new Blob([e.newValue]).size);
        } catch (err) {
          console.error('Error parsing synced storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cross-device sync status core state
  const [syncState, setSyncState] = useState<{
    status: 'synced' | 'syncing' | 'pending' | 'offline';
    lastSyncedAt: Date | null;
    serverIp: string | null;
    serverUrl: string | null;
    version: number;
    outboxCount: number;
    dataHash: string | null;
    errorMessage: string | null;
  }>({
    status: 'synced',
    lastSyncedAt: null,
    serverIp: null,
    serverUrl: null,
    version: 0,
    outboxCount: 0,
    dataHash: null,
    errorMessage: null,
  });

  // Pull latest master database from server
  const pullFromServer = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      const targetUrl = resolveSyncBaseUrl(settings?.cloudSyncUrl).replace(/\/+$/, '');
      const res = await fetch(`${targetUrl}/api/sync`);
      if (!res.ok) throw new Error('Server offline / network error');
      const json = await res.json();

      if (json.success && json.data) {
        const serverData = json.data;
        localVersionRef.current = serverData.version || 1;
        skipNextPushRef.current = true;

        const incomingSerialized = serializeCoreData(serverData);
        if (incomingSerialized === lastSavedSerializedRef.current) {
          const localHash = calculateDataHash({
            transactions: serverData.transactions,
            budgets: serverData.budgets,
            savingGoals: serverData.savingGoals,
            recurring: serverData.recurring,
            accounts: serverData.accounts,
            debts: serverData.debts,
            settings: serverData.settings,
            semesterBudgets: serverData.semesterBudgets,
            scholarships: serverData.scholarships,
            campusBills: serverData.campusBills,
            splitBills: serverData.splitBills,
          });
          setSyncState((prev) => ({
            ...prev,
            status: 'synced',
            version: serverData.version || 1,
            dataHash: localHash,
            outboxCount: 0,
            errorMessage: null,
            lastSyncedAt: new Date(),
          }));
          return;
        }
        lastSavedSerializedRef.current = incomingSerialized;

        if (Array.isArray(serverData.tombstones)) {
          serverData.tombstones.forEach((id: string) => {
            if (typeof id === 'string') addTombstone(id);
          });
        }
        const tombstoneSet = new Set(getTombstones());

        // 1. Transactions: Non-destructive union merge (NEVER LOSE LOCAL TRANSACTIONS)
        setTransactions((prevTx) => {
          const txMap = new Map<string, Transaction>();
          (prevTx || []).forEach((t) => {
            if (t && t.id && !t.id.startsWith('tx_demo_') && !tombstoneSet.has(t.id)) {
              txMap.set(t.id, t);
            }
          });
          (serverData.transactions || []).forEach((rawTransaction: Transaction) => {
            const t = pinTransactionAccount(rawTransaction, accountsRef.current);
            if (t && t.id && !t.id.startsWith('tx_demo_') && !tombstoneSet.has(t.id)) {
              const existing = txMap.get(t.id);
              if (!existing) {
                txMap.set(t.id, t);
              } else {
                const prevTime = new Date(existing.createdAt || 0).getTime();
                const serverTime = new Date(t.createdAt || 0).getTime();
                if (serverTime >= prevTime) {
                  txMap.set(t.id, t);
                }
              }
            }
          });
          return Array.from(txMap.values());
        });

        // 2. Accounts: keep the newest version when the same wallet exists on both devices.
        setAccounts((prevAccounts) => {
          const accMap = new Map<string, Account>();
          const base = (prevAccounts && prevAccounts.length > 0) ? prevAccounts : INITIAL_ACCOUNTS;
          base.forEach((a) => {
            if (a && a.id && !tombstoneSet.has(a.id)) accMap.set(a.id, a);
          });
          (serverData.accounts || []).forEach((a: Account) => {
            if (!a || !a.id || tombstoneSet.has(a.id)) return;
            const local = accMap.get(a.id);
            const localUpdated = Date.parse(local?.updatedAt || local?.createdAt || '') || 0;
            const remoteUpdated = Date.parse(a.updatedAt || a.createdAt || '') || 0;
            if (!local || remoteUpdated >= localUpdated) accMap.set(a.id, a);
          });
          const result = Array.from(accMap.values());
          return result.length > 0 ? result : INITIAL_ACCOUNTS;
        });

        // 3. Budgets
        if (Array.isArray(serverData.budgets) && serverData.budgets.length > 0) {
          setBudgets(serverData.budgets);
        }

        // 4. Saving goals: Non-destructive union merge
        setSavingGoals((prevGoals) => {
          const goalMap = new Map<string, SavingGoal>();
          (prevGoals || []).forEach((g) => {
            if (g && g.id && !['goal_laptop', 'goal_emergency', 'goal_cert'].includes(g.id) && !tombstoneSet.has(g.id)) {
              goalMap.set(g.id, g);
            }
          });
          (serverData.savingGoals || []).forEach((g: SavingGoal) => {
            if (g && g.id && !['goal_laptop', 'goal_emergency', 'goal_cert'].includes(g.id) && !tombstoneSet.has(g.id)) {
              goalMap.set(g.id, g);
            }
          });
          return Array.from(goalMap.values());
        });

        // 5. Recurring: Non-destructive union merge
        setRecurring((prevRec) => {
          const recMap = new Map<string, RecurringTransaction>();
          (prevRec || []).forEach((r) => {
            if (r && r.id && !['rec_ortu', 'rec_aslab', 'rec_kos', 'rec_spotify', 'rec_internet'].includes(r.id) && !tombstoneSet.has(r.id)) {
              recMap.set(r.id, r);
            }
          });
          (serverData.recurring || []).forEach((r: RecurringTransaction) => {
            if (r && r.id && !['rec_ortu', 'rec_aslab', 'rec_kos', 'rec_spotify', 'rec_internet'].includes(r.id) && !tombstoneSet.has(r.id)) {
              recMap.set(r.id, r);
            }
          });
          return Array.from(recMap.values());
        });

        // 6. Debts: Non-destructive union merge
        setDebts((prevDebts) => {
          const debtMap = new Map<string, Debt>();
          (prevDebts || []).forEach((d) => {
            if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
          });
          (serverData.debts || []).forEach((d: Debt) => {
            if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
          });
          return Array.from(debtMap.values());
        });

        // 7. Semester Budgets: Non-destructive union merge
        setSemesterBudgets((prevSem) => {
          const semMap = new Map<string, SemesterBudget>();
          (prevSem || []).forEach((s) => {
            if (s && s.id && !['sem_1'].includes(s.id) && !tombstoneSet.has(s.id)) semMap.set(s.id, s);
          });
          (serverData.semesterBudgets || []).forEach((s: SemesterBudget) => {
            if (s && s.id && !['sem_1'].includes(s.id) && !tombstoneSet.has(s.id)) semMap.set(s.id, s);
          });
          return Array.from(semMap.values());
        });

        // 8. Scholarships: Non-destructive union merge
        setScholarships((prevSch) => {
          const schMap = new Map<string, Scholarship>();
          (prevSch || []).forEach((s) => {
            if (s && s.id && !['sch_1', 'sch_2'].includes(s.id) && !tombstoneSet.has(s.id)) schMap.set(s.id, s);
          });
          (serverData.scholarships || []).forEach((s: Scholarship) => {
            if (s && s.id && !['sch_1', 'sch_2'].includes(s.id) && !tombstoneSet.has(s.id)) schMap.set(s.id, s);
          });
          return Array.from(schMap.values());
        });

        // 9. Campus Bills: Non-destructive union merge
        setCampusBills((prevBills) => {
          const billMap = new Map<string, CampusBill>();
          (prevBills || []).forEach((b) => {
            if (b && b.id && !['bill_ukt', 'bill_lab', 'bill_lib', 'bill_org'].includes(b.id) && !tombstoneSet.has(b.id)) billMap.set(b.id, b);
          });
          (serverData.campusBills || []).forEach((b: CampusBill) => {
            if (b && b.id && !['bill_ukt', 'bill_lab', 'bill_lib', 'bill_org'].includes(b.id) && !tombstoneSet.has(b.id)) billMap.set(b.id, b);
          });
          return Array.from(billMap.values());
        });

        // 10. Split Bills: Non-destructive union merge
        setSplitBills((prevSplits) => {
          const splitMap = new Map<string, SplitBill>();
          (prevSplits || []).forEach((s) => {
            if (s && s.id && !['split_1'].includes(s.id) && !tombstoneSet.has(s.id)) splitMap.set(s.id, s);
          });
          (serverData.splitBills || []).forEach((s: SplitBill) => {
            if (s && s.id && !['split_1'].includes(s.id) && !tombstoneSet.has(s.id)) splitMap.set(s.id, s);
          });
          return Array.from(splitMap.values());
        });

        // 11. Gamification
        if (serverData.gamification) {
          setGamificationProfile(serverData.gamification);
        }

        // 12. Settings & active month
        if (serverData.settings) setSettings((prev) => ({ ...prev, ...serverData.settings }));
        if (Array.isArray(serverData.notifications)) setNotifications(serverData.notifications);

        // Compute local hash
        const localHash = calculateDataHash({
          transactions: serverData.transactions,
          budgets: serverData.budgets,
          savingGoals: serverData.savingGoals,
          recurring: serverData.recurring,
          accounts: serverData.accounts,
          debts: serverData.debts,
          settings: serverData.settings,
          semesterBudgets: serverData.semesterBudgets,
          scholarships: serverData.scholarships,
          campusBills: serverData.campusBills,
          splitBills: serverData.splitBills,
        });

        // Clear outbox queue if all synced
        setSyncState((prev) => ({
          ...prev,
          status: getOutboxQueue().length > 0 ? 'pending' : 'synced',
          version: serverData.version || 1,
          dataHash: localHash,
          outboxCount: getOutboxQueue().length,
          errorMessage: null,
          lastSyncedAt: new Date(),
        }));
      } else if (json.success && json.data === null) {
        // Master server DB is empty: seed server with current local data
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            fetch(`${targetUrl}/api/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Device-Id': deviceIdRef.current,
              },
              body: JSON.stringify(parsed),
            }).catch(() => {});
          } catch {
            // ignore
          }
        }
        setSyncState((prev) => ({
          ...prev,
          status: 'synced',
          lastSyncedAt: new Date(),
        }));
          return true;
        }
        throw new Error('Server tidak mengonfirmasi sinkronisasi');
      } catch (err: any) {
      setSyncState((prev) => ({
        ...prev,
        status: 'offline',
        errorMessage: err.message || 'Offline',
        outboxCount: getOutboxQueue().length,
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [settings?.cloudSyncUrl]);

  // Push local updates to server
  const pushToServer = useCallback(
    async (data: any) => {
      const targetUrl = resolveSyncBaseUrl(settings?.cloudSyncUrl).replace(/\/+$/, '');
      const localHash = calculateDataHash(data);

      // If user is offline, record mutation in Outbox
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOutboxMutation('batch', 'sync_all', data);
        setSyncState((prev) => ({
          ...prev,
          status: 'pending',
          outboxCount: getOutboxQueue().length,
          dataHash: localHash,
        }));
        return;
      }

      try {
        setSyncState((prev) => ({ ...prev, status: 'syncing' }));
        const res = await fetch(`${targetUrl}/api/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Id': deviceIdRef.current,
          },
          body: JSON.stringify({
            ...data,
            tombstones: getTombstones(),
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || `Server menolak sinkronisasi (HTTP ${res.status})`);
        }

        if (json.success) {
          localVersionRef.current = json.version;
          clearAllOutboxMutations();
          setSyncState((prev) => ({
            ...prev,
            status: 'synced',
            version: json.version,
            dataHash: json.hash || localHash,
            outboxCount: 0,
            errorMessage: null,
            lastSyncedAt: new Date(),
          }));
        }
      } catch (err: any) {
        enqueueOutboxMutation('batch', 'sync_all', data);
        setSyncState((prev) => ({
          ...prev,
          status: 'pending',
          errorMessage: err.message || 'Gagal terhubung ke server',
          outboxCount: getOutboxQueue().length,
          dataHash: localHash,
        }));
        return false;
      }
    },
    [settings?.cloudSyncUrl]
  );

  const syncNow = useCallback(async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      await pullFromServer();
      return;
    }

    let localData: any;
    try {
      localData = JSON.parse(saved);
    } catch {
      setSyncState((prev) => ({
        ...prev,
        status: 'pending',
        errorMessage: 'Data lokal tidak dapat dibaca. Ekspor cadangan sebelum mencoba lagi.',
        outboxCount: getOutboxQueue().length,
      }));
      return;
    }

    const uploaded = await pushToServer(localData);
    if (uploaded) await pullFromServer();
  }, [pullFromServer, pushToServer]);

  // Integrity Check: Compare data hash between Mobile & Server
  const verifyIntegrity = useCallback(async () => {
    const targetUrl = resolveSyncBaseUrl(settings?.cloudSyncUrl).replace(/\/+$/, '');
    const localHash = calculateDataHash({
      transactions,
      budgets,
      savingGoals,
      recurring,
      accounts,
      debts,
      settings,
      semesterBudgets,
      scholarships,
      campusBills,
      splitBills,
    });

    try {
      const res = await fetch(`${targetUrl}/api/sync/verify`);
      if (!res.ok) throw new Error('Server unreachable');
      const json = await res.json();
      return {
        identical: json.hash === localHash,
        serverVersion: json.version || 0,
        localVersion: localVersionRef.current,
        serverHash: json.hash || '00000000',
        localHash,
      };
    } catch {
      return {
        identical: false,
        serverVersion: 0,
        localVersion: localVersionRef.current,
        serverHash: 'offline',
        localHash,
      };
    }
  }, [
    settings?.cloudSyncUrl,
    settings,
    transactions,
    budgets,
    savingGoals,
    recurring,
    accounts,
    debts,
    semesterBudgets,
    scholarships,
    campusBills,
    splitBills,
  ]);

  // Set Custom Server / Cloud URL
  const setCustomServerUrl = useCallback((url: string) => {
    setSettings((prev) => ({
      ...prev,
      cloudSyncUrl: url,
    }));
  }, []);

  // Clear pending outbox queue
  const clearOutbox = useCallback(() => {
    clearAllOutboxMutations();
    setSyncState((prev) => ({ ...prev, outboxCount: 0 }));
  }, []);

  // Memoized DeviceSyncStatus exposed to consumers (no useEffect setState loops!)
  const syncStatus: DeviceSyncStatus = useMemo(
    () => ({
      ...syncState,
      isOnline,
      syncNow,
      verifyIntegrity,
      setCustomServerUrl,
      clearOutbox,
    }),
    [syncState, isOnline, syncNow, verifyIntegrity, setCustomServerUrl, clearOutbox]
  );

  // Real-time Server-Sent Events (SSE) listener for instantaneous push to HP & Laptop
  useEffect(() => {
    const targetUrl = resolveSyncBaseUrl(settings?.cloudSyncUrl).replace(/\/+$/, '');
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`${targetUrl}/api/sync/stream`);

      eventSource.addEventListener('update', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          // If the change came from another device (HP or Laptop), pull immediately!
          if (payload.sourceDeviceId !== deviceIdRef.current) {
            pullFromServer();
          }
        } catch {
          // ignore
        }
      });

      eventSource.onerror = () => {
        // SSE disconnected or unsupported, gracefully fallback to polling
        eventSource?.close();
      };
    } catch {
      // EventSource failed or blocked
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [settings?.cloudSyncUrl, pullFromServer]);

  // Initial connection check & background polling fallback
  useEffect(() => {
    const targetUrl = resolveSyncBaseUrl(settings?.cloudSyncUrl).replace(/\/+$/, '');

    // 1. Detect server network info
    fetch(`${targetUrl}/api/system/info`)
      .then((r) => r.json())
      .then((info) => {
        if (info.success) {
          setSyncState((prev) => ({
            ...prev,
            serverIp: info.localIp,
            serverUrl: targetUrl || info.url,
          }));
        }
      })
      .catch(() => {});

    // 2. Initial sync
    pullFromServer();

    // 3. Fallback polling every 3 seconds for browsers where SSE was throttled
    const interval = setInterval(async () => {
      if (document.hidden) return; // save mobile battery
      try {
        const res = await fetch(`${targetUrl}/api/sync/version`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && (json.version !== localVersionRef.current || json.hash !== syncState.dataHash)) {
            pullFromServer();
          }
        }
      } catch {
        // server temporarily unreachable
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [settings?.cloudSyncUrl, pullFromServer, syncState.dataHash]);

  // Save to local storage on changes and push to server
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataPayload = {
        transactions,
        budgets,
        savingGoals,
        recurring,
        debts,
        settings,
        notifications,
        accounts,
        semesterBudgets,
        scholarships,
        campusBills,
        splitBills,
        priceComparisons,
        gamificationProfile,
        activeMonth,
      };

      const serializedCore = serializeCoreData(dataPayload);
      if (serializedCore === lastSavedSerializedRef.current) {
        return;
      }
      lastSavedSerializedRef.current = serializedCore;

      const now = new Date().toISOString();
      const dataToSave = {
        ...dataPayload,
        lastSavedAt: now,
      };
      const serialized = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEY, serialized);
      setLastSavedAt(now);
      setStorageUsageBytes(new Blob([serialized]).size);

      // Skip push if this change was triggered by pulling from server
      if (skipNextPushRef.current) {
        skipNextPushRef.current = false;
        return;
      }

      // Debounce push to server
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        pushToServer(dataToSave);
      }, 300);
    } catch (err) {
      console.error('Error saving data to localStorage:', err);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    transactions,
    budgets,
    savingGoals,
    recurring,
    debts,
    settings,
    notifications,
    accounts,
    semesterBudgets,
    scholarships,
    campusBills,
    splitBills,
    priceComparisons,
    gamificationProfile,
    activeMonth,
    isLoaded,
    pushToServer,
  ]);

  // Derived Calculations
  const computedAccounts = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const currentBalance = useMemo(() => {
    return calculateCurrentBalance(settings.openingBalance, transactions, computedAccounts);
  }, [settings.openingBalance, transactions, computedAccounts]);

  const recurringReminders = useMemo(() => {
    return getRecurringReminders(recurring, transactions, activeMonth, getTodayDateString());
  }, [recurring, transactions, activeMonth]);

  const monthlyIncome = useMemo(() => {
    return calculateMonthlyIncome(transactions, activeMonth);
  }, [transactions, activeMonth]);

  const monthlyExpenses = useMemo(() => {
    return calculateMonthlyExpenses(transactions, activeMonth);
  }, [transactions, activeMonth]);

  const monthlySavings = useMemo(() => {
    return calculateMonthlySavings(monthlyIncome, monthlyExpenses);
  }, [monthlyIncome, monthlyExpenses]);

  const savingsRate = useMemo(() => {
    return calculateSavingsRate(monthlyIncome, monthlyExpenses);
  }, [monthlyIncome, monthlyExpenses]);

  const budgetSummary = useMemo(() => {
    return calculateBudgetStatuses(budgets, transactions, activeMonth);
  }, [budgets, transactions, activeMonth]);

  const needsVsWants = useMemo(() => {
    return calculateNeedsVsWants(transactions, activeMonth);
  }, [transactions, activeMonth]);

  const expensesByCategory = useMemo(() => {
    return calculateExpensesByCategory(transactions, activeMonth);
  }, [transactions, activeMonth]);

  // Saved to goals this month
  const savedThisMonth = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(activeMonth) && t.type === 'savings_transfer')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, activeMonth]);

  // Remaining upcoming committed expenses before the next allowance date (e.g. Kos, tagihan bulanan wajib)
  const upcomingCommittedExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payday = Math.min(31, Math.max(1, Number(settings.paydayOrAllowanceDay) || 1));

    let targetYear = today.getFullYear();
    let targetMonth = today.getMonth();
    if (today.getDate() >= payday) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
    const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    const nextAllowanceDate = new Date(targetYear, targetMonth, Math.min(payday, maxDays), 0, 0, 0, 0);

    return recurring
      .filter((r) => {
        if (r.type !== 'expense' || r.classification !== 'need') return false;

        // Check if already paid in this active month
        const isPaid =
          r.lastPaidMonth === activeMonth ||
          transactions.some(
            (t) =>
              t.date.startsWith(activeMonth) &&
              (t.recurringId === r.id ||
                (t.category === r.category && Math.abs(t.amount - r.amount) < 1 && t.type === r.type))
          );
        if (isPaid) return false;

        // Check if dueDay in today's month falls between today and next allowance
        const d1 = new Date(today.getFullYear(), today.getMonth(), r.dueDay, 12, 0, 0);
        if (d1 >= today && d1 < nextAllowanceDate) return true;

        // Check if dueDay in next allowance month falls between today and next allowance
        const d2 = new Date(nextAllowanceDate.getFullYear(), nextAllowanceDate.getMonth(), r.dueDay, 12, 0, 0);
        if (d2 >= today && d2 < nextAllowanceDate) return true;

        return false;
      })
      .reduce((sum, r) => sum + r.amount, 0);
  }, [recurring, settings.paydayOrAllowanceDay, activeMonth, transactions]);

  const safeDailySpend = useMemo(() => {
    const today = new Date();
    return calculateSafeDailySpending(
      currentBalance,
      settings.desiredSavingsTarget,
      savedThisMonth,
      upcomingCommittedExpenses,
      today,
      settings.paydayOrAllowanceDay
    );
  }, [
    currentBalance,
    settings.desiredSavingsTarget,
    savedThisMonth,
    upcomingCommittedExpenses,
    settings.paydayOrAllowanceDay,
  ]);

  // Today's total spending
  const todaySpent = useMemo(() => {
    const todayStr = getTodayDateString();
    return transactions
      .filter((t) => t.date === todayStr && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const healthScore = useMemo(() => {
    return calculateFinancialHealthScore(
      monthlyIncome,
      monthlyExpenses,
      budgetSummary,
      savingGoals,
      debts,
      currentBalance
    );
  }, [monthlyIncome, monthlyExpenses, budgetSummary, savingGoals, debts, currentBalance]);

  const smartRecommendations = useMemo(() => {
    return generateSmartRecommendations(
      transactions,
      budgets,
      savingGoals,
      activeMonth,
      monthlyIncome
    );
  }, [transactions, budgets, savingGoals, activeMonth, monthlyIncome]);

  const cashFlowForecast = useMemo(() => {
    const today = new Date();
    return calculateCashFlowForecast(currentBalance, recurring, transactions, activeMonth, today);
  }, [currentBalance, recurring, transactions, activeMonth]);

  const gamification = useMemo(() => {
    return calculateStreaksAndMilestones(transactions, getTodayDateString());
  }, [transactions]);

  const studentRunway = useMemo(() => {
    return calculateStudentRunway(currentBalance, transactions, recurring, activeMonth);
  }, [currentBalance, transactions, recurring, activeMonth]);

  const emotionalSpending = useMemo(() => {
    return calculateEmotionalSpending(transactions, activeMonth);
  }, [transactions, activeMonth]);

  // Actions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    Object.assign(newTx, pinTransactionAccount(newTx, accountsRef.current));
    setTransactions((prev) => [newTx, ...prev]);

    // Ensure activeMonth matches transaction's month so it is immediately visible in the list
    const txMonth = newTx.date ? newTx.date.substring(0, 7) : '';
    if (txMonth && txMonth !== activeMonth) {
      setActiveMonth(txMonth);
    }

    // Check if this expense pushes any category over 90%
    if (newTx.type === 'expense') {
      const budget = budgets.find((b) => b.category === newTx.category);
      if (budget) {
        const monthSpent = transactions
          .filter((t) => t.date.startsWith(activeMonth) && t.category === newTx.category && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0) + newTx.amount;
        if (monthSpent > budget.monthlyLimit) {
          const newNotif: AppNotification = {
            id: `notif_over_${Date.now()}`,
            type: 'budget',
            title: `Peringatan: Anggaran ${newTx.category} Terlampaui!`,
            message: `Pengeluaran ${newTx.category} (Rp ${monthSpent.toLocaleString('id-ID')}) sudah melampaui limit Rp ${budget.monthlyLimit.toLocaleString('id-ID')}.`,
            date: newTx.date,
            read: false,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      }
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (updates.date) {
      const updMonth = updates.date.substring(0, 7);
      if (updMonth && updMonth !== activeMonth) {
        setActiveMonth(updMonth);
      }
    }
  };

  const deleteTransaction = (id: string) => {
    addTombstone(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const setBudgetLimit = (category: ExpenseCategory, monthlyLimit: number) => {
    setBudgets((prev) => {
      const existing = prev.find((b) => b.category === category);
      if (existing) {
        return prev.map((b) => (b.category === category ? { ...b, monthlyLimit } : b));
      } else {
        return [...prev, { category, monthlyLimit }];
      }
    });
  };

  const addSavingGoal = (goal: Omit<SavingGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSavingGoals((prev) => [...prev, newGoal]);
  };

  const updateSavingGoal = (id: string, updates: Partial<SavingGoal>) => {
    setSavingGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteSavingGoal = (id: string) => {
    addTombstone(id);
    setSavingGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const contributeToGoal = (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    notes?: string
  ) => {
    const goal = savingGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const actualAmount = Math.abs(amount);
    const newCurrent =
      type === 'deposit'
        ? goal.currentAmount + actualAmount
        : Math.max(0, goal.currentAmount - actualAmount);

    updateSavingGoal(goalId, { currentAmount: newCurrent });

    // Log savings transfer transaction
    // Positive amount when deposit (money leaves liquid pocket into goal jar)
    // Negative amount when withdraw (money returns to liquid pocket)
    const txAmount = type === 'deposit' ? actualAmount : -actualAmount;
    addTransaction({
      date: getTodayDateString(),
      type: 'savings_transfer',
      amount: txAmount,
      category: 'Tabungan',
      goalId,
      notes: notes || (type === 'deposit' ? `Setoran ke ${goal.name}` : `Penarikan dari ${goal.name}`),
    });

    if (newCurrent >= goal.targetAmount && goal.currentAmount < goal.targetAmount) {
      setNotifications((prev) => [
        {
          id: `notif_goal_done_${Date.now()}`,
          type: 'achievement',
          title: `Selamat! Target "${goal.name}" Tercapai! 🎉`,
          message: `Kamu berhasil mengumpulkan Rp ${goal.targetAmount.toLocaleString('id-ID')}. Kerja bagus!`,
          date: getTodayDateString(),
          read: false,
        },
        ...prev,
      ]);
    }
  };

  // Account / Wallet Actions
  const addAccount = (account: Omit<Account, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...account,
      id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now.slice(0, 10),
      updatedAt: now,
    };
    setAccounts((prev) => [
      ...prev.map((existing) => account.isDefault
        ? { ...existing, isDefault: false, updatedAt: now }
        : existing),
      newAccount,
    ]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    const updatedAt = new Date().toISOString();
    setAccounts((prev) => prev.map((a) => {
      const isBeingUpdated = a.id === id;
      const defaultChanged = updates.isDefault && a.isDefault !== (a.id === id);
      return {
        ...a,
        ...(isBeingUpdated ? updates : {}),
        ...(updates.isDefault ? { isDefault: a.id === id } : {}),
        ...(isBeingUpdated || defaultChanged ? { updatedAt } : {}),
      };
    }));
  };

  const deleteAccount = (id: string) => {
    addTombstone(id);
    setAccounts((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      return remaining.length > 0 ? remaining : INITIAL_ACCOUNTS;
    });
  };

  const transferBetweenAccounts = (
    fromId: string,
    toId: string,
    amount: number,
    notes?: string,
    date: string = getTodayDateString()
  ) => {
    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc) return;

    const actualAmount = Math.abs(amount);
    addTransaction({
      date,
      type: 'transfer',
      amount: actualAmount,
      category: 'Transfer Antar Akun',
      fromAccountId: fromId,
      toAccountId: toId,
      notes: notes || `Transfer dari ${fromAcc.name} ke ${toAcc.name}`,
    });

    setNotifications((prev) => [
      {
        id: `notif_trf_${Date.now()}`,
        type: 'system',
        title: 'Transfer Saldo Berhasil',
        message: `Berhasil memindahkan Rp ${actualAmount.toLocaleString('id-ID')} dari ${fromAcc.name} ke ${toAcc.name}.`,
        date,
        read: false,
      },
      ...prev,
    ]);
  };

  const addRecurring = (rec: Omit<RecurringTransaction, 'id'>) => {
    const newRec: RecurringTransaction = {
      ...rec,
      id: `rec_${Date.now()}`,
    };
    setRecurring((prev) => [...prev, newRec]);
  };

  const updateRecurring = (id: string, updates: Partial<RecurringTransaction>) => {
    setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRecurring = (id: string) => {
    addTombstone(id);
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  };

  const processRecurringEntry = (recurringId: string, targetAccountId?: string) => {
    const rec = recurring.find((r) => r.id === recurringId);
    if (!rec) return;

    // Generate transaction for current active month
    const dayStr = String(rec.dueDay).padStart(2, '0');
    const txDate = `${activeMonth}-${dayStr}`;

    addTransaction({
      date: txDate,
      type: rec.type,
      amount: rec.amount,
      category: rec.category,
      paymentMethod: rec.paymentMethod,
      accountId: targetAccountId || rec.accountId,
      classification: rec.classification,
      notes: rec.notes ? `[Tagihan] ${rec.title}: ${rec.notes}` : `[Tagihan Berulang] ${rec.title}`,
      isRecurringInstance: true,
      recurringId: rec.id,
    });

    // Mark as paid for the current month
    setRecurring((prev) =>
      prev.map((r) => (r.id === recurringId ? { ...r, lastPaidMonth: activeMonth } : r))
    );

    setNotifications((prev) => [
      {
        id: `notif_rec_${Date.now()}`,
        type: 'recurring',
        title: `Tagihan Dicatat: ${rec.title}`,
        message: `${rec.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'} sebesar Rp ${rec.amount.toLocaleString('id-ID')} telah dicatat untuk bulan ${activeMonth}.`,
        date: txDate,
        read: false,
      },
      ...prev,
    ]);
  };

  const addDebt = (debt: Omit<Debt, 'id' | 'createdAt' | 'payments' | 'remainingAmount'>) => {
    const newDebt: Debt = {
      ...debt,
      id: `debt_${Date.now()}`,
      remainingAmount: debt.principalAmount,
      payments: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDebts((prev) => [...prev, newDebt]);
  };

  const recordDebtPayment = (debtId: string, amount: number, notes?: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const actualAmount = Math.min(amount, debt.remainingAmount);
    const newRemaining = Math.max(0, debt.remainingAmount - actualAmount);

    const newPayment = {
      id: `p_${Date.now()}`,
      date: getTodayDateString(),
      amount: actualAmount,
      notes,
    };

    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? {
              ...d,
              remainingAmount: newRemaining,
              payments: [newPayment, ...d.payments],
            }
          : d
      )
    );

    // Record as transaction
    if (debt.type === 'payable') {
      addTransaction({
        date: getTodayDateString(),
        type: 'expense',
        amount: actualAmount,
        category: 'Pembayaran Utang',
        notes: `Cicilan utang: ${debt.title} (${debt.personName})`,
        classification: 'need',
      });
    } else {
      addTransaction({
        date: getTodayDateString(),
        type: 'income',
        amount: actualAmount,
        category: 'Lainnya',
        notes: `Penerimaan piutang: ${debt.title} dari ${debt.personName}`,
      });
    }
  };

  const deleteDebt = (id: string) => {
    addTombstone(id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const selectedBudgetingMethod: BudgetingMethodType =
    settings.selectedBudgetingMethod || '50_30_20';

  const applyBudgetingMethod = (methodId: BudgetingMethodType) => {
    const baseIncome = monthlyIncome > 0 ? monthlyIncome : (settings.monthlyIncomeTarget || 3_000_000);
    const newBudgets = generateBudgetPresetForMethod(methodId, baseIncome);
    setBudgets(newBudgets);
    updateSettings({ selectedBudgetingMethod: methodId });

    const methodDef = BUDGETING_METHODS.find((m) => m.id === methodId);
    if (methodDef) {
      setNotifications((prev) => [
        {
          id: `notif_method_${Date.now()}`,
          type: 'budget',
          title: `Metode Budgeting Diterapkan: ${methodDef.shortName}`,
          message: `Pos anggaran bulanan telah otomatis disesuaikan menggunakan formula ${methodDef.name}.`,
          date: getTodayDateString(),
          read: false,
        },
        ...prev,
      ]);
    }
  };

  const applyCustomBudgets = (
    newBudgets: MonthlyBudget[],
    methodId: BudgetingMethodType = '50_30_20'
  ) => {
    setBudgets(newBudgets);
    updateSettings({ selectedBudgetingMethod: methodId });
    const methodDef = BUDGETING_METHODS.find((m) => m.id === methodId);
    const titleMethod = methodDef ? methodDef.shortName : 'Kustom';
    setNotifications((prev) => [
      {
        id: `notif_budget_apply_${Date.now()}`,
        type: 'budget',
        title: `Alokasi Anggaran ${titleMethod} Diterapkan! 🎯`,
        message: `Plafon pos anggaran bulanan berhasil diperbarui sesuai kalkulasi metode ${titleMethod}.`,
        date: getTodayDateString(),
        read: false,
      },
      ...prev,
    ]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetToDemoData = () => {
    clearTombstones();
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setSavingGoals(INITIAL_SAVING_GOALS);
    setRecurring(INITIAL_RECURRING);
    setDebts(INITIAL_DEBTS);
    setSettings(INITIAL_USER_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAccounts(INITIAL_ACCOUNTS);
    setSemesterBudgets(INITIAL_SEMESTER_BUDGETS);
    setScholarships(INITIAL_SCHOLARSHIPS);
    setCampusBills(INITIAL_CAMPUS_BILLS);
    setSplitBills(INITIAL_SPLIT_BILLS);
    setActiveMonth(getCurrentMonthString());
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearAllData = () => {
    clearTombstones();
    const cleanAccounts = INITIAL_ACCOUNTS.map((a) => ({ ...a, balance: 0, initialBalance: 0 }));
    setTransactions([]);
    setBudgets(INITIAL_BUDGETS.map((b) => ({ ...b, monthlyLimit: 0 })));
    setSavingGoals([]);
    setRecurring([]);
    setDebts([]);
    setAccounts(cleanAccounts);
    setNotifications([]);
    setSemesterBudgets([]);
    setScholarships([]);
    setCampusBills([]);
    setSplitBills([]);
    setSettings({
      userName: 'Mahasiswa',
      university: '',
      openingBalance: 0,
      monthlyIncomeTarget: 0,
      essentialExpenseTarget: 0,
      desiredSavingsTarget: 0,
      paydayOrAllowanceDay: 1,
      emergencyFundMonths: 3,
      hasCompletedOnboarding: true,
      selectedBudgetingMethod: '50_30_20',
    });
    pushToServer({
      transactions: [],
      budgets: INITIAL_BUDGETS.map((b) => ({ ...b, monthlyLimit: 0 })),
      accounts: cleanAccounts,
      savingGoals: [],
      recurring: [],
      debts: [],
      semesterBudgets: [],
      scholarships: [],
      campusBills: [],
      splitBills: [],
      isExplicitClearAll: true,
    });
  };

  const restoreEmergencyBackup = () => {
    const backup = getEmergencyBackup();
    if (!backup) return { success: false, message: 'Tidak ada cadangan darurat yang tersimpan.' };
    let count = 0;
    if (Array.isArray(backup.transactions) && backup.transactions.length > 0) {
      setTransactions(backup.transactions);
      count = backup.transactions.length;
    }
    if (Array.isArray(backup.accounts) && backup.accounts.length > 0) {
      setAccounts(backup.accounts);
    } else {
      setAccounts(INITIAL_ACCOUNTS);
    }
    if (Array.isArray(backup.budgets) && backup.budgets.length > 0) {
      setBudgets(backup.budgets);
    }
    if (Array.isArray(backup.savingGoals)) {
      setSavingGoals(backup.savingGoals);
    }
    if (Array.isArray(backup.recurring)) {
      setRecurring(backup.recurring);
    }
    if (Array.isArray(backup.debts)) {
      setDebts(backup.debts);
    }
    if (backup.settings) {
      setSettings(backup.settings);
    }
    return { success: true, count, message: `Berhasil memulihkan ${count} transaksi dan ${backup.accounts?.length || 0} akun dompet.` };
  };

  const exportDataJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      savingGoals,
      recurring,
      debts,
      settings,
      notifications,
      accounts,
      semesterBudgets,
      scholarships,
      campusBills,
      splitBills,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        setTransactions(parsed.transactions);
      }
      if (parsed.budgets && Array.isArray(parsed.budgets)) {
        setBudgets(parsed.budgets);
      }
      if (parsed.savingGoals && Array.isArray(parsed.savingGoals)) {
        setSavingGoals(parsed.savingGoals);
      }
      if (parsed.recurring && Array.isArray(parsed.recurring)) {
        setRecurring(parsed.recurring);
      }
      if (parsed.debts && Array.isArray(parsed.debts)) {
        setDebts(parsed.debts);
      }
      if (parsed.accounts && Array.isArray(parsed.accounts)) {
        setAccounts(parsed.accounts);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      if (parsed.semesterBudgets && Array.isArray(parsed.semesterBudgets)) {
        setSemesterBudgets(parsed.semesterBudgets);
      }
      if (parsed.scholarships && Array.isArray(parsed.scholarships)) {
        setScholarships(parsed.scholarships);
      }
      if (parsed.campusBills && Array.isArray(parsed.campusBills)) {
        setCampusBills(parsed.campusBills);
      }
      if (parsed.splitBills && Array.isArray(parsed.splitBills)) {
        setSplitBills(parsed.splitBills);
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid JSON file';
      return { success: false, error: message };
    }
  };

  // New Student Feature Actions
  const addSemesterBudget = (sb: Omit<SemesterBudget, 'id' | 'createdAt'>) => {
    const newSb: SemesterBudget = {
      ...sb,
      id: `sem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSemesterBudgets((prev) => [newSb, ...prev]);
    addGamificationXP(50, 'Menambahkan rencana anggaran semester!');
  };

  const updateSemesterBudget = (id: string, updates: Partial<SemesterBudget>) => {
    setSemesterBudgets((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSemesterBudget = (id: string) => {
    addTombstone(id);
    setSemesterBudgets((prev) => prev.filter((s) => s.id !== id));
  };

  const addScholarship = (sch: Omit<Scholarship, 'id' | 'createdAt'>) => {
    const newSch: Scholarship = {
      ...sch,
      id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setScholarships((prev) => [newSch, ...prev]);
    addGamificationXP(40, 'Mencatat data beasiswa');
  };

  const updateScholarship = (id: string, updates: Partial<Scholarship>) => {
    setScholarships((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteScholarship = (id: string) => {
    addTombstone(id);
    setScholarships((prev) => prev.filter((s) => s.id !== id));
  };

  const disburseScholarship = (id: string, targetAccountId?: string) => {
    const sch = scholarships.find((s) => s.id === id);
    if (!sch) return;
    const targetAcc = targetAccountId || (accounts.find((a) => a.isDefault)?.id || accounts[0]?.id);

    addTransaction({
      date: getTodayDateString(),
      type: 'income',
      amount: sch.amount,
      category: 'Beasiswa',
      accountId: targetAcc,
      paymentMethod: 'Transfer Bank',
      notes: `Pencairan Beasiswa: ${sch.name} (${sch.provider})`,
    });

    updateScholarship(id, { status: 'disbursed' });
    addGamificationXP(80, `Pencairan beasiswa ${sch.name} berhasil dicatat!`);
  };

  const addCampusBill = (bill: Omit<CampusBill, 'id' | 'createdAt'>) => {
    const newBill: CampusBill = {
      ...bill,
      id: `bill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setCampusBills((prev) => [newBill, ...prev]);
    addGamificationXP(30, 'Menambahkan tagihan kampus');
  };

  const updateCampusBill = (id: string, updates: Partial<CampusBill>) => {
    setCampusBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteCampusBill = (id: string) => {
    addTombstone(id);
    setCampusBills((prev) => prev.filter((b) => b.id !== id));
  };

  const payCampusBill = (id: string, accountId?: string) => {
    const bill = campusBills.find((b) => b.id === id);
    if (!bill || bill.isPaid) return;
    const targetAcc = accountId || (accounts.find((a) => a.isDefault)?.id || accounts[0]?.id);

    addTransaction({
      date: getTodayDateString(),
      type: 'expense',
      amount: bill.amount,
      category: 'Pendidikan',
      classification: 'need',
      accountId: targetAcc,
      paymentMethod: 'Transfer Bank',
      notes: `Pelunasan Tagihan Kampus: ${bill.title}`,
    });

    updateCampusBill(id, {
      isPaid: true,
      paidDate: getTodayDateString(),
      paidFromAccountId: targetAcc,
    });

    addGamificationXP(70, `Pelunasan tagihan ${bill.title} berhasil!`);
  };

  const addSplitBill = (split: Omit<SplitBill, 'id' | 'createdAt'>) => {
    const newSplit: SplitBill = {
      ...split,
      id: `split_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSplitBills((prev) => [newSplit, ...prev]);
    addGamificationXP(45, 'Membuat tagihan patungan (split bill)');
  };

  const updateSplitBill = (id: string, updates: Partial<SplitBill>) => {
    setSplitBills((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSplitBill = (id: string) => {
    addTombstone(id);
    setSplitBills((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSplitBillMemberPaid = (splitId: string, memberId: string) => {
    setSplitBills((prev) =>
      prev.map((s) => {
        if (s.id !== splitId) return s;
        const updatedMembers = s.members.map((m) =>
          m.id === memberId ? { ...m, isPaid: !m.isPaid } : m
        );
        return { ...s, members: updatedMembers };
      })
    );
  };

  const addGamificationXP = (amount: number, reason?: string) => {
    setGamificationProfile((prev) => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let newMaxXP = prev.maxXPForLevel;
      let newTitle = prev.levelTitle;

      while (newXP >= newMaxXP) {
        newXP -= newMaxXP;
        newLevel += 1;
        newMaxXP = Math.round(newMaxXP * 1.4);
        if (newLevel === 2) newTitle = 'Pemburu Hemat Kampus';
        else if (newLevel === 3) newTitle = 'Perencana Anggaran Bijak';
        else if (newLevel === 4) newTitle = 'Master Anti-Boncos';
        else newTitle = 'Sultan Finansial Kampus';
      }

      return {
        ...prev,
        level: newLevel,
        levelTitle: newTitle,
        currentXP: newXP,
        maxXPForLevel: newMaxXP,
      };
    });
  };

  const claimGamificationQuest = (questId: string) => {
    setGamificationProfile((prev) => {
      const quest = prev.quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return prev;
      const updatedQuests = prev.quests.map((q) => (q.id === questId ? { ...q, completed: true } : q));
      let newXP = prev.currentXP + quest.rewardXP;
      let newLevel = prev.level;
      let newMaxXP = prev.maxXPForLevel;
      let newTitle = prev.levelTitle;

      while (newXP >= newMaxXP) {
        newXP -= newMaxXP;
        newLevel += 1;
        newMaxXP = Math.round(newMaxXP * 1.4);
        if (newLevel === 2) newTitle = 'Pemburu Hemat Kampus';
        else if (newLevel === 3) newTitle = 'Perencana Anggaran Bijak';
        else if (newLevel === 4) newTitle = 'Master Anti-Boncos';
        else newTitle = 'Sultan Finansial Kampus';
      }

      return {
        ...prev,
        quests: updatedQuests,
        level: newLevel,
        levelTitle: newTitle,
        currentXP: newXP,
        maxXPForLevel: newMaxXP,
      };
    });
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        savingGoals,
        recurring,
        debts,
        settings,
        notifications,
        accounts: computedAccounts,
        semesterBudgets,
        scholarships,
        campusBills,
        splitBills,
        priceComparisons,
        gamificationProfile,
        activeMonth,
        setActiveMonth,
        isOnline,
        lastSavedAt,
        storageUsageBytes,
        syncStatus,
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        savingsRate,
        recurringReminders,
        budgetSummary,
        needsVsWants,
        expensesByCategory,
        safeDailySpend,
        healthScore,
        smartRecommendations,
        cashFlowForecast,
        gamification,
        studentRunway,
        emotionalSpending,
        todaySpent,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        setBudgetLimit,
        addSavingGoal,
        updateSavingGoal,
        deleteSavingGoal,
        contributeToGoal,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        processRecurringEntry,
        addDebt,
        recordDebtPayment,
        deleteDebt,
        updateSettings,
        applyBudgetingMethod,
        applyCustomBudgets,
        selectedBudgetingMethod,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
        restoreEmergencyBackup,
        addSemesterBudget,
        updateSemesterBudget,
        deleteSemesterBudget,
        addScholarship,
        updateScholarship,
        deleteScholarship,
        disburseScholarship,
        addCampusBill,
        updateCampusBill,
        deleteCampusBill,
        payCampusBill,
        addSplitBill,
        updateSplitBill,
        deleteSplitBill,
        toggleSplitBillMemberPaid,
        claimGamificationQuest,
        addGamificationXP,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
