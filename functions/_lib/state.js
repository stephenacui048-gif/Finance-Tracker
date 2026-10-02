export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Device-Id",
  "Cache-Control": "no-store",
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function hashState(data) {
  try {
    const tx = (data?.transactions || []).map((t) =>
      [t.id, t.amount, t.date, t.accountId || "", t.fromAccountId || "", t.toAccountId || ""].join(":")
    ).sort().join("|");
    const accounts = (data?.accounts || []).map((a) =>
      [a.id, a.name, a.type, a.balance, a.initialBalance ?? "", a.isDefault ? 1 : 0, a.updatedAt || ""].join(":")
    ).sort().join("|");
    const budgets = (data?.budgets || []).map((b) => [b.category, b.monthlyLimit].join(":")).sort().join("|");
    const goals = (data?.savingGoals || []).map((g) => [g.id, g.currentAmount].join(":")).sort().join("|");
    const debts = (data?.debts || []).map((d) => [d.id, d.remainingAmount].join(":")).sort().join("|");
    const settings = data?.settings
      ? [data.settings.paydayOrAllowanceDay || 1, data.settings.openingBalance || 0, data.settings.desiredSavingsTarget || 0].join(":")
      : "";
    const semesters = (data?.semesterBudgets || []).map((s) => [s.id, s.name].join(":")).sort().join("|");
    const scholarships = (data?.scholarships || []).map((s) => [s.id, s.amount, s.status].join(":")).sort().join("|");
    const bills = (data?.campusBills || []).map((b) => [b.id, b.isPaid].join(":")).sort().join("|");
    const splits = (data?.splitBills || []).map((s) => [s.id, s.totalAmount].join(":")).sort().join("|");
    const canonical = [tx, accounts, budgets, goals, debts, settings, semesters, scholarships, bills, splits].join("__");
    let value = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i++) {
      value ^= canonical.charCodeAt(i);
      value = Math.imul(value, 0x01000193);
    }
    return (value >>> 0).toString(16).padStart(8, "0");
  } catch {
    return "00000000";
  }
}

function mergeById(existing = [], incoming = [], deleted, pickIncoming = () => true) {
  const map = new Map();
  for (const item of existing) {
    if (item?.id && !deleted.has(item.id)) map.set(item.id, item);
  }
  for (const item of incoming) {
    if (!item?.id || deleted.has(item.id)) continue;
    const previous = map.get(item.id);
    if (!previous || pickIncoming(previous, item)) map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function mergeState(existing, payload) {
  const old = existing || {};
  const incoming = payload || {};
  const deleted = new Set([...(old.tombstones || []), ...(incoming.tombstones || [])]);

  if (incoming.isExplicitClearAll) {
    return {
      transactions: [],
      budgets: incoming.budgets || old.budgets || [],
      accounts: incoming.accounts || old.accounts || [],
      savingGoals: [],
      recurring: [],
      debts: [],
      semesterBudgets: [],
      scholarships: [],
      campusBills: [],
      splitBills: [],
      gamification: null,
      settings: { ...(old.settings || {}), ...(incoming.settings || {}) },
      tombstones: [],
    };
  }

  const transactions = mergeById(
    old.transactions, incoming.transactions, deleted,
    (previous, next) => new Date(next.createdAt || 0).getTime() >= new Date(previous.createdAt || 0).getTime()
  );
  let accounts = mergeById(
    old.accounts, incoming.accounts, deleted,
    (previous, next) => {
      const a = Date.parse(previous.updatedAt || previous.createdAt || "") || 0;
      const b = Date.parse(next.updatedAt || next.createdAt || "") || 0;
      return b >= a;
    }
  );
  if (accounts.length === 0 && (old.accounts || []).length > 0) accounts = old.accounts;

  const budgetMap = new Map();
  for (const item of old.budgets || []) if (item?.category) budgetMap.set(item.category, item);
  for (const item of incoming.budgets || []) if (item?.category) budgetMap.set(item.category, item);

  return {
    transactions,
    accounts,
    budgets: Array.from(budgetMap.values()),
    savingGoals: mergeById(old.savingGoals, incoming.savingGoals, deleted),
    recurring: mergeById(old.recurring, incoming.recurring, deleted),
    debts: mergeById(old.debts, incoming.debts, deleted),
    semesterBudgets: mergeById(old.semesterBudgets, incoming.semesterBudgets, deleted),
    scholarships: mergeById(old.scholarships, incoming.scholarships, deleted),
    campusBills: mergeById(old.campusBills, incoming.campusBills, deleted),
    splitBills: mergeById(old.splitBills, incoming.splitBills, deleted),
    gamification: incoming.gamification || old.gamification || null,
    settings: { ...(old.settings || {}), ...(incoming.settings || {}) },
    tombstones: Array.from(deleted).slice(-500),
  };
}

export async function database(env) {
  if (!env.DB) throw new Error("Binding D1 bernama DB belum dipasang di Cloudflare Pages.");
  return typeof env.DB.withSession === "function" ? env.DB.withSession("first-primary") : env.DB;
}

async function readRow(db) {
  const row = await db.prepare(
    "SELECT state_json, version, last_saved_at FROM finance_state WHERE id = 1"
  ).first();
  if (!row) return { state: null, version: 0, lastSavedAt: null };
  return {
    state: JSON.parse(row.state_json),
    version: Number(row.version) || 0,
    lastSavedAt: row.last_saved_at || null,
  };
}

export async function readState(env) {
  const db = await database(env);
  const row = await readRow(db);
  if (!row.version) return { data: null, version: 0, lastSavedAt: null, hash: "00000000" };
  const data = { ...row.state, version: row.version, lastSavedAt: row.lastSavedAt };
  return { data, version: row.version, lastSavedAt: row.lastSavedAt, hash: hashState(data) };
}

export async function saveState(env, payload) {
  const db = await database(env);
  await db.prepare(
    "INSERT OR IGNORE INTO finance_state (id, state_json, version, last_saved_at) VALUES (1, '{}', 0, NULL)"
  ).run();

  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readRow(db);
    const nextVersion = current.version + 1;
    const now = new Date().toISOString();
    const merged = mergeState(current.state, payload);
    merged.version = nextVersion;
    merged.lastSavedAt = now;
    const result = await db.prepare(
      "UPDATE finance_state SET state_json = ?, version = ?, last_saved_at = ? WHERE id = 1 AND version = ?"
    ).bind(JSON.stringify(merged), nextVersion, now, current.version).run();
    if (result.meta?.changes === 1) {
      return { version: nextVersion, lastSavedAt: now, hash: hashState(merged) };
    }
  }

  const error = new Error("Data berubah bersamaan di perangkat lain. Coba sinkronkan kembali.");
  error.status = 409;
  throw error;
}

export function stateCounts(data = {}) {
  return {
    transactions: Array.isArray(data.transactions) ? data.transactions.length : 0,
    accounts: Array.isArray(data.accounts) ? data.accounts.length : 0,
    budgets: Array.isArray(data.budgets) ? data.budgets.length : 0,
    savingGoals: Array.isArray(data.savingGoals) ? data.savingGoals.length : 0,
  };
}

export function failure(error) {
  const status = error.status || 500;
  return json({ success: false, error: status === 500 ? "Layanan penyimpanan belum siap. Pastikan migrasi D1 dan binding DB sudah diterapkan." : error.message }, status);
}
