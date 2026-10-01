import {
  Transaction,
  MonthlyBudget,
  SavingGoal,
  RecurringTransaction,
  Debt,
  Account,
  UserSettings,
  OutboxMutation,
  SemesterBudget,
  Scholarship,
  CampusBill,
  SplitBill,
} from '../types/finance';
import { INITIAL_ACCOUNTS, INITIAL_BUDGETS, INITIAL_USER_SETTINGS } from '../data/seedData';

const OUTBOX_STORAGE_KEY = 'student_finance_outbox_queue_v1';
const TOMBSTONES_STORAGE_KEY = 'fintrack_tombstones_v1';
const EMERGENCY_BACKUP_KEY = 'student_finance_tracker_backup_v2';

/**
 * Generate a lightweight, deterministic hash string (FNV-1a 32-bit variant converted to hex)
 * to verify data integrity between Mobile and Laptop.
 */
export function calculateDataHash(payload: {
  transactions?: Transaction[];
  budgets?: MonthlyBudget[];
  savingGoals?: SavingGoal[];
  recurring?: RecurringTransaction[];
  accounts?: Account[];
  debts?: Debt[];
  settings?: UserSettings;
  semesterBudgets?: SemesterBudget[];
  scholarships?: Scholarship[];
  campusBills?: CampusBill[];
  splitBills?: SplitBill[];
}): string {
  try {
    const txIds = (payload.transactions || []).map((t) => `${t.id}:${t.amount}:${t.date}:${t.accountId || ''}:${t.fromAccountId || ''}:${t.toAccountId || ''}`).sort().join('|');
    const accState = (payload.accounts || []).map((a) => `${a.id}:${a.name}:${a.type}:${a.balance}:${a.initialBalance ?? ''}:${a.isDefault ? 1 : 0}:${a.updatedAt || ''}`).sort().join('|');
    const budgetState = (payload.budgets || []).map((b) => `${b.category}:${b.monthlyLimit}`).sort().join('|');
    const goalsState = (payload.savingGoals || []).map((g) => `${g.id}:${g.currentAmount}`).sort().join('|');
    const debtsState = (payload.debts || []).map((d) => `${d.id}:${d.remainingAmount}`).sort().join('|');
    const settingsState = payload.settings ? `${payload.settings.paydayOrAllowanceDay || 1}:${payload.settings.openingBalance || 0}:${payload.settings.desiredSavingsTarget || 0}` : '';
    const semState = (payload.semesterBudgets || []).map((s) => `${s.id}:${s.name}`).sort().join('|');
    const schState = (payload.scholarships || []).map((s) => `${s.id}:${s.amount}:${s.status}`).sort().join('|');
    const billsState = (payload.campusBills || []).map((b) => `${b.id}:${b.isPaid}`).sort().join('|');
    const splitsState = (payload.splitBills || []).map((s) => `${s.id}:${s.totalAmount}`).sort().join('|');

    const canonical = `${txIds}__${accState}__${budgetState}__${goalsState}__${debtsState}__${settingsState}__${semState}__${schState}__${billsState}__${splitsState}`;

    let hash = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i++) {
      hash ^= canonical.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  } catch {
    return '00000000';
  }
}

/**
 * Read the offline Outbox queue from local storage.
 */
export function getOutboxQueue(): OutboxMutation[] {
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Enqueue a new mutation to be pushed to the sync server when online.
 */
export function enqueueOutboxMutation(
  entity: OutboxMutation['entity'],
  action: OutboxMutation['action'],
  data: any
): OutboxMutation {
  const mutation: OutboxMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entity,
    action,
    data,
    timestamp: new Date().toISOString(),
    retries: 0,
  };

  try {
    const queue = getOutboxQueue();
    const updated = [...queue.slice(-99), mutation];
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to enqueue outbox mutation:', e);
  }

  return mutation;
}

/**
 * Remove one or more mutations after successful server sync ack.
 */
export function removeOutboxMutations(mutationIds: string[]): void {
  try {
    const queue = getOutboxQueue();
    const idSet = new Set(mutationIds);
    const updated = queue.filter((m) => !idSet.has(m.id));
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to remove outbox mutations:', e);
  }
}

/**
 * Clear the entire outbox queue.
 */
export function clearAllOutboxMutations(): void {
  try {
    localStorage.removeItem(OUTBOX_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Tombstones tracking: prevents deleted entities from being resurrected by sync.
 */
export function getTombstones(): string[] {
  try {
    const raw = localStorage.getItem(TOMBSTONES_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addTombstone(id: string): void {
  try {
    const list = getTombstones();
    if (!list.includes(id)) {
      const updated = [...list.slice(-500), id];
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

export function clearTombstones(): void {
  try {
    localStorage.removeItem(TOMBSTONES_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Emergency local backup management
 */
export function saveEmergencyBackup(data: any): void {
  try {
    if (!data) return;
    // Only save if there is meaningful data
    if ((data.transactions && data.transactions.length > 0) || (data.accounts && data.accounts.length > 0)) {
      localStorage.setItem(EMERGENCY_BACKUP_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

export function getEmergencyBackup(): any | null {
  try {
    const raw = localStorage.getItem(EMERGENCY_BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Resolve target base URL for sync operations.
 */
export function resolveSyncBaseUrl(configuredUrl?: string): string {
  // Prefer explicit URL from settings
  if (configuredUrl && configuredUrl.trim().length > 0) {
    let clean = configuredUrl.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }
  // Fallback to environment variable VITE_API_URL if defined (Vite exposes via import.meta.env)
  try {
    const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
    if (envUrl && envUrl.trim().length > 0) {
      let clean = envUrl.trim().replace(/\/+$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      return clean;
    }
  } catch {}
  return typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : '';
}

/**
 * Non-destructive merge of local and remote datasets:
 * - Ensures transactions are NEVER lost.
 * - Ensures multi-wallet accounts are NEVER empty.
 * - Honors tombstones so deleted items stay deleted.
 */
export function mergeDatasets(local: any, remote: any, tombstones: string[] = []): any {
  const tombstoneSet = new Set([...getTombstones(), ...(tombstones || [])]);

  // 1. Merge transactions (Union by ID, respect tombstones)
  const txMap = new Map<string, Transaction>();
  (local?.transactions || []).forEach((t: Transaction) => {
    if (t && t.id && !tombstoneSet.has(t.id)) {
      txMap.set(t.id, t);
    }
  });
  (remote?.transactions || []).forEach((t: Transaction) => {
    if (t && t.id && !tombstoneSet.has(t.id)) {
      const existing = txMap.get(t.id);
      if (!existing) {
        txMap.set(t.id, t);
      } else {
        // Keep whichever is newer
        const existingTime = new Date(existing.createdAt || 0).getTime();
        const remoteTime = new Date(t.createdAt || 0).getTime();
        if (remoteTime >= existingTime) {
          txMap.set(t.id, t);
        }
      }
    }
  });

  // 2. Merge accounts (Never allow empty array)
  const accMap = new Map<string, Account>();
  const localAcc = Array.isArray(local?.accounts) && local.accounts.length > 0 ? local.accounts : INITIAL_ACCOUNTS;
  const remoteAcc = Array.isArray(remote?.accounts) && remote.accounts.length > 0 ? remote.accounts : [];

  localAcc.forEach((a: Account) => {
    if (a && a.id && !tombstoneSet.has(a.id)) {
      accMap.set(a.id, a);
    }
  });
  remoteAcc.forEach((a: Account) => {
    if (a && a.id && !tombstoneSet.has(a.id)) {
      accMap.set(a.id, a);
    }
  });

  let finalAccounts = Array.from(accMap.values());
  if (finalAccounts.length === 0) {
    finalAccounts = INITIAL_ACCOUNTS;
  }

  // 3. Merge saving goals
  const goalsMap = new Map<string, SavingGoal>();
  (local?.savingGoals || []).forEach((g: SavingGoal) => {
    if (g && g.id && !tombstoneSet.has(g.id)) goalsMap.set(g.id, g);
  });
  (remote?.savingGoals || []).forEach((g: SavingGoal) => {
    if (g && g.id && !tombstoneSet.has(g.id)) goalsMap.set(g.id, g);
  });

  // 4. Merge budgets
  const budgetMap = new Map<string, MonthlyBudget>();
  const baseBudgets = Array.isArray(local?.budgets) && local.budgets.length > 0 ? local.budgets : INITIAL_BUDGETS;
  baseBudgets.forEach((b: MonthlyBudget) => budgetMap.set(b.category, b));
  (remote?.budgets || []).forEach((b: MonthlyBudget) => {
    if (b && b.category) budgetMap.set(b.category, b);
  });

  // 5. Merge recurring
  const recMap = new Map<string, RecurringTransaction>();
  (local?.recurring || []).forEach((r: RecurringTransaction) => {
    if (r && r.id && !tombstoneSet.has(r.id)) recMap.set(r.id, r);
  });
  (remote?.recurring || []).forEach((r: RecurringTransaction) => {
    if (r && r.id && !tombstoneSet.has(r.id)) recMap.set(r.id, r);
  });

  // 6. Merge debts
  const debtMap = new Map<string, Debt>();
  (local?.debts || []).forEach((d: Debt) => {
    if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
  });
  (remote?.debts || []).forEach((d: Debt) => {
    if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
  });

  // 7. Merge semester budgets
  const semMap = new Map<string, SemesterBudget>();
  (local?.semesterBudgets || []).forEach((s: SemesterBudget) => {
    if (s && s.id && !tombstoneSet.has(s.id)) semMap.set(s.id, s);
  });
  (remote?.semesterBudgets || []).forEach((s: SemesterBudget) => {
    if (s && s.id && !tombstoneSet.has(s.id)) semMap.set(s.id, s);
  });

  // 8. Merge scholarships
  const schMap = new Map<string, Scholarship>();
  (local?.scholarships || []).forEach((s: Scholarship) => {
    if (s && s.id && !tombstoneSet.has(s.id)) schMap.set(s.id, s);
  });
  (remote?.scholarships || []).forEach((s: Scholarship) => {
    if (s && s.id && !tombstoneSet.has(s.id)) schMap.set(s.id, s);
  });

  // 9. Merge campus bills
  const billMap = new Map<string, CampusBill>();
  (local?.campusBills || []).forEach((b: CampusBill) => {
    if (b && b.id && !tombstoneSet.has(b.id)) billMap.set(b.id, b);
  });
  (remote?.campusBills || []).forEach((b: CampusBill) => {
    if (b && b.id && !tombstoneSet.has(b.id)) billMap.set(b.id, b);
  });

  // 10. Merge split bills
  const splitMap = new Map<string, SplitBill>();
  (local?.splitBills || []).forEach((s: SplitBill) => {
    if (s && s.id && !tombstoneSet.has(s.id)) splitMap.set(s.id, s);
  });
  (remote?.splitBills || []).forEach((s: SplitBill) => {
    if (s && s.id && !tombstoneSet.has(s.id)) splitMap.set(s.id, s);
  });

  return {
    transactions: Array.from(txMap.values()),
    accounts: finalAccounts,
    savingGoals: Array.from(goalsMap.values()),
    budgets: Array.from(budgetMap.values()),
    recurring: Array.from(recMap.values()),
    debts: Array.from(debtMap.values()),
    semesterBudgets: Array.from(semMap.values()),
    scholarships: Array.from(schMap.values()),
    campusBills: Array.from(billMap.values()),
    splitBills: Array.from(splitMap.values()),
    settings: {
      ...INITIAL_USER_SETTINGS,
      ...(local?.settings || {}),
      ...(remote?.settings || {}),
    },
    tombstones: Array.from(tombstoneSet).slice(-500),
    version: Math.max(local?.version || 0, remote?.version || 0) + 1,
    lastSavedAt: new Date().toISOString(),
  };
}
