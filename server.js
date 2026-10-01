import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(String(process.env.PORT || '').trim(), 10) || 3000;

// Data directory & database file location
const dataDir = path.resolve(__dirname, 'data');
const dbFile = path.resolve(dataDir, 'finance_db.json');
const backupFile = path.resolve(dataDir, 'finance_db.backup.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Active SSE client connections
const sseClients = new Set();

// Deterministic 32-bit FNV-1a hash
function computeHash(data) {
  try {
    const txIds = (data?.transactions || []).map((t) => `${t.id}:${t.amount}:${t.date}`).sort().join('|');
    const accState = (data?.accounts || []).map((a) => `${a.id}:${a.balance}`).sort().join('|');
    const budgetState = (data?.budgets || []).map((b) => `${b.category}:${b.monthlyLimit}`).sort().join('|');
    const goalsState = (data?.savingGoals || []).map((g) => `${g.id}:${g.currentAmount}`).sort().join('|');
    const debtsState = (data?.debts || []).map((d) => `${d.id}:${d.remainingAmount}`).sort().join('|');
    const settingsState = data?.settings ? `${data.settings.paydayOrAllowanceDay || 1}:${data.settings.openingBalance || 0}:${data.settings.desiredSavingsTarget || 0}` : '';
    const semState = (data?.semesterBudgets || []).map((s) => `${s.id}:${s.name}`).sort().join('|');
    const schState = (data?.scholarships || []).map((s) => `${s.id}:${s.amount}:${s.status}`).sort().join('|');
    const billsState = (data?.campusBills || []).map((b) => `${b.id}:${b.isPaid}`).sort().join('|');
    const splitsState = (data?.splitBills || []).map((s) => `${s.id}:${s.totalAmount}`).sort().join('|');

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

// Broadcast real-time update event to all connected devices
function broadcastUpdate(version, hash, sourceDeviceId) {
  const message = JSON.stringify({
    type: 'SYNC_UPDATE',
    version,
    hash,
    timestamp: new Date().toISOString(),
    sourceDeviceId: sourceDeviceId || 'unknown',
  });

  sseClients.forEach((res) => {
    try {
      res.write(`event: update\ndata: ${message}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  });
}

// Keepalive heartbeat every 15s to keep mobile connections alive
setInterval(() => {
  sseClients.forEach((res) => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(res);
    }
  });
}, 15000);

// Global middleware
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// 1. System info
app.get('/api/system/info', (req, res) => {
  res.json({
    success: true,
    port: PORT,
    serverTime: new Date().toISOString(),
    connectedClients: sseClients.size,
    status: 'cloud_ready',
  });
});

// 2. Real-time Server-Sent Events (SSE) stream
app.get('/api/sync/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let currentVersion = 0;
  let currentHash = '00000000';
  if (fs.existsSync(dbFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      currentVersion = data.version || 0;
      currentHash = computeHash(data);
    } catch {}
  }

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      version: currentVersion,
      hash: currentHash,
      serverTime: new Date().toISOString(),
    })}\n\n`
  );

  sseClients.add(res);

  req.on('close', () => sseClients.delete(res));
  req.on('error', () => sseClients.delete(res));
});

// 3. Lightweight version check
app.get('/api/sync/version', (req, res) => {
  try {
    if (!fs.existsSync(dbFile)) {
      return res.json({ success: true, version: 0, hash: '00000000', lastSavedAt: null });
    }
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    const hash = computeHash(data);
    res.json({
      success: true,
      version: data.version || 1,
      hash,
      lastSavedAt: data.lastSavedAt || null,
    });
  } catch {
    res.json({ success: false, version: 0, hash: '00000000' });
  }
});

// 4. Data verification endpoint
app.get('/api/sync/verify', (req, res) => {
  try {
    if (!fs.existsSync(dbFile)) {
      return res.json({
        success: true,
        initialized: false,
        version: 0,
        hash: '00000000',
        counts: { transactions: 0, accounts: 0, budgets: 0 },
      });
    }
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    const hash = computeHash(data);
    res.json({
      success: true,
      initialized: true,
      version: data.version || 1,
      hash,
      counts: {
        transactions: Array.isArray(data.transactions) ? data.transactions.length : 0,
        accounts: Array.isArray(data.accounts) ? data.accounts.length : 0,
        budgets: Array.isArray(data.budgets) ? data.budgets.length : 0,
        savingGoals: Array.isArray(data.savingGoals) ? data.savingGoals.length : 0,
      },
      lastSavedAt: data.lastSavedAt || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Full database fetch
app.get('/api/sync', (req, res) => {
  try {
    if (!fs.existsSync(dbFile)) {
      return res.json({
        success: true,
        data: null,
        message: 'Database belum terinisialisasi',
        serverTime: new Date().toISOString(),
      });
    }
    const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    const hash = computeHash(data);
    res.json({
      success: true,
      data,
      hash,
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Save & Non-Destructive Union Merge
app.post('/api/sync', (req, res) => {
  try {
    const payload = req.body;
    const now = new Date().toISOString();
    const sourceDeviceId = req.headers['x-device-id'] || 'client';

    let existing = {};
    if (fs.existsSync(dbFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      } catch {
        existing = {};
      }
    }

    // Save rolling backup
    if (fs.existsSync(dbFile)) {
      try {
        fs.copyFileSync(dbFile, backupFile);
      } catch {}
    }

    let mergedData;
    if (payload.isExplicitClearAll) {
      mergedData = {
        transactions: [],
        budgets: payload.budgets || existing.budgets || [],
        accounts: payload.accounts || existing.accounts || [],
        savingGoals: [],
        recurring: [],
        debts: [],
        settings: payload.settings || existing.settings || {},
        tombstones: [],
        version: (existing.version || 0) + 1,
        lastSavedAt: now,
      };
    } else {
      const tombstoneSet = new Set([
        ...(existing.tombstones || []),
        ...(payload.tombstones || []),
      ]);

      // Transactions
      const txMap = new Map();
      (existing.transactions || []).forEach((t) => {
        if (t && t.id && !tombstoneSet.has(t.id)) txMap.set(t.id, t);
      });
      (payload.transactions || []).forEach((t) => {
        if (t && t.id && !tombstoneSet.has(t.id)) {
          const prev = txMap.get(t.id);
          if (!prev || new Date(t.createdAt || 0).getTime() >= new Date(prev.createdAt || 0).getTime()) {
            txMap.set(t.id, t);
          }
        }
      });

      // Accounts
      const accMap = new Map();
      (existing.accounts || []).forEach((a) => {
        if (a && a.id && !tombstoneSet.has(a.id)) accMap.set(a.id, a);
      });
      (payload.accounts || []).forEach((a) => {
        if (a && a.id && !tombstoneSet.has(a.id)) accMap.set(a.id, a);
      });
      let finalAccounts = Array.from(accMap.values());
      if (finalAccounts.length === 0 && Array.isArray(existing.accounts) && existing.accounts.length > 0) {
        finalAccounts = existing.accounts;
      }

      // Saving Goals
      const goalsMap = new Map();
      (existing.savingGoals || []).forEach((g) => {
        if (g && g.id && !tombstoneSet.has(g.id)) goalsMap.set(g.id, g);
      });
      (payload.savingGoals || []).forEach((g) => {
        if (g && g.id && !tombstoneSet.has(g.id)) goalsMap.set(g.id, g);
      });

      // Budgets
      const budgetMap = new Map();
      (existing.budgets || []).forEach((b) => {
        if (b && b.category) budgetMap.set(b.category, b);
      });
      (payload.budgets || []).forEach((b) => {
        if (b && b.category) budgetMap.set(b.category, b);
      });

      // Recurring
      const recMap = new Map();
      (existing.recurring || []).forEach((r) => {
        if (r && r.id && !tombstoneSet.has(r.id)) recMap.set(r.id, r);
      });
      (payload.recurring || []).forEach((r) => {
        if (r && r.id && !tombstoneSet.has(r.id)) recMap.set(r.id, r);
      });

      // Debts
      const debtMap = new Map();
      (existing.debts || []).forEach((d) => {
        if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
      });
      (payload.debts || []).forEach((d) => {
        if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
      });

      // Semester Budgets
      const semMap = new Map();
      (existing.semesterBudgets || []).forEach((s) => { if (s && s.id && !tombstoneSet.has(s.id)) semMap.set(s.id, s); });
      (payload.semesterBudgets || []).forEach((s) => { if (s && s.id && !tombstoneSet.has(s.id)) semMap.set(s.id, s); });

      // Scholarships
      const schMap = new Map();
      (existing.scholarships || []).forEach((s) => { if (s && s.id && !tombstoneSet.has(s.id)) schMap.set(s.id, s); });
      (payload.scholarships || []).forEach((s) => { if (s && s.id && !tombstoneSet.has(s.id)) schMap.set(s.id, s); });

      // Campus Bills
      const cbMap = new Map();
      (existing.campusBills || []).forEach((b) => { if (b && b.id && !tombstoneSet.has(b.id)) cbMap.set(b.id, b); });
      (payload.campusBills || []).forEach((b) => { if (b && b.id && !tombstoneSet.has(b.id)) cbMap.set(b.id, b); });

      // Split Bills
      const sbMap = new Map();
      (existing.splitBills || []).forEach((s) => { if (s && s.id && !tombstoneSet.has(s.id)) sbMap.set(s.id, s); });
      (payload.splitBills || []).forEach((s) => { if (s && s.id && !tombstoneSet.has(s.id)) sbMap.set(s.id, s); });

      mergedData = {
        transactions: Array.from(txMap.values()),
        accounts: finalAccounts,
        budgets: Array.from(budgetMap.values()),
        savingGoals: Array.from(goalsMap.values()),
        recurring: Array.from(recMap.values()),
        debts: Array.from(debtMap.values()),
        semesterBudgets: Array.from(semMap.values()),
        scholarships: Array.from(schMap.values()),
        campusBills: Array.from(cbMap.values()),
        splitBills: Array.from(sbMap.values()),
        gamification: payload.gamification || existing.gamification || null,
        settings: {
          ...(existing.settings || {}),
          ...(payload.settings || {}),
        },
        tombstones: Array.from(tombstoneSet).slice(-500),
        version: (existing.version || 0) + 1,
        lastSavedAt: now,
      };
    }

    fs.writeFileSync(dbFile, JSON.stringify(mergedData, null, 2), 'utf-8');
    const newHash = computeHash(mergedData);

    // Broadcast update via SSE
    broadcastUpdate(mergedData.version, newHash, sourceDeviceId);

    res.json({
      success: true,
      version: mergedData.version,
      hash: newHash,
      lastSavedAt: now,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Serve frontend static build
const distDir = path.resolve(__dirname, 'dist');
const isDistValid = fs.existsSync(distDir) && fs.statSync(distDir).isDirectory() && fs.existsSync(path.resolve(distDir, 'index.html'));
if (isDistValid) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('FinTrack Cloud API is running. Run "npm run build" to build and serve the frontend.');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` FinTrack Cloud Server is running on port ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Cloud Ready: Yes (Supports Render, Railway, VPS, etc.)`);
  console.log(`=======================================================`);
});
