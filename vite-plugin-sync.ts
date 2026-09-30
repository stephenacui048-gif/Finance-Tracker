import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ServerResponse } from 'http';

/**
 * Server-Side Sync Plugin for Student Finance Tracker.
 * Provides:
 * 1. Master JSON database at `data/finance_db.json`.
 * 2. Real-time Server-Sent Events (SSE) at `/api/sync/stream`.
 * 3. Bidirectional Push/Pull endpoints `/api/sync` and `/api/sync/version`.
 * 4. Batch Outbox ingestion at `/api/sync/batch`.
 * 5. Deterministic hash integrity verification at `/api/sync/verify`.
 */
export function syncPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');
  const dbFile = path.resolve(dataDir, 'finance_db.json');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Active SSE client connections (Laptop browsers & Mobile HP browsers)
  const sseClients = new Set<ServerResponse>();

  // Helper to compute deterministic 32-bit FNV-1a hash string (matching client-side calculation)
  function computeHash(data: any): string {
    try {
      const txIds = (data?.transactions || []).map((t: any) => `${t.id}:${t.amount}:${t.date}`).sort().join('|');
      const accState = (data?.accounts || []).map((a: any) => `${a.id}:${a.balance}`).sort().join('|');
      const budgetState = (data?.budgets || []).map((b: any) => `${b.category}:${b.monthlyLimit}`).sort().join('|');
      const goalsState = (data?.savingGoals || []).map((g: any) => `${g.id}:${g.currentAmount}`).sort().join('|');
      const debtsState = (data?.debts || []).map((d: any) => `${d.id}:${d.remainingAmount}`).sort().join('|');
      const settingsState = data?.settings ? `${data.settings.paydayOrAllowanceDay || 1}:${data.settings.openingBalance || 0}:${data.settings.desiredSavingsTarget || 0}` : '';
      const semState = (data?.semesterBudgets || []).map((s: any) => `${s.id}:${s.name}`).sort().join('|');
      const schState = (data?.scholarships || []).map((s: any) => `${s.id}:${s.amount}:${s.status}`).sort().join('|');
      const billsState = (data?.campusBills || []).map((b: any) => `${b.id}:${b.isPaid}`).sort().join('|');
      const splitsState = (data?.splitBills || []).map((s: any) => `${s.id}:${s.totalAmount}`).sort().join('|');

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

  // Broadcast event to all connected devices (HP Android & Laptop)
  function broadcastUpdate(version: number, hash: string, sourceDeviceId?: string) {
    const message = JSON.stringify({
      type: 'SYNC_UPDATE',
      version,
      hash,
      timestamp: new Date().toISOString(),
      sourceDeviceId: sourceDeviceId || 'unknown',
    });

    sseClients.forEach((client) => {
      try {
        client.write(`event: update\ndata: ${message}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    });
  }

  // Get active local network IPv4 address (e.g. 192.168.x.x or 10.x.x.x)
  function getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  return {
    name: 'vite-plugin-sync',
    apply: 'serve',
    configureServer(server) {
      // Keepalive heartbeat every 15 seconds to keep mobile connections alive
      const heartbeatTimer = setInterval(() => {
        sseClients.forEach((client) => {
          try {
            client.write(': heartbeat\n\n');
          } catch {
            sseClients.delete(client);
          }
        });
      }, 15000);

      server.httpServer?.on('close', () => clearInterval(heartbeatTimer));
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // CORS headers for seamless multi-device network access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Id');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // 1. Endpoint: GET /api/system/info
        if (url === '/api/system/info' && req.method === 'GET') {
          const localIp = getLocalIp();
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              localIp,
              port: 3000,
              url: `http://${localIp}:3000`,
              serverTime: new Date().toISOString(),
              connectedClients: sseClients.size,
            })
          );
          return;
        }

        // 2. Endpoint: GET /api/sync/stream (Real-Time Server-Sent Events)
        if (url === '/api/sync/stream' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          });

          // Read current state
          let currentVersion = 0;
          let currentHash = '00000000';
          if (fs.existsSync(dbFile)) {
            try {
              const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
              currentVersion = data.version || 0;
              currentHash = computeHash(data);
            } catch {
              // ignore
            }
          }

          // Initial welcome event
          res.write(
            `event: connected\ndata: ${JSON.stringify({
              version: currentVersion,
              hash: currentHash,
              serverTime: new Date().toISOString(),
            })}\n\n`
          );

          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          req.on('error', () => {
            sseClients.delete(res);
          });
          return;
        }

        // 3. Endpoint: GET /api/sync/version (Lightweight version check)
        if (url === '/api/sync/version' && req.method === 'GET') {
          try {
            if (!fs.existsSync(dbFile)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  version: 0,
                  hash: '00000000',
                  lastSavedAt: null,
                })
              );
              return;
            }

            const content = fs.readFileSync(dbFile, 'utf-8');
            const data = JSON.parse(content);
            const hash = computeHash(data);
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                version: data.version || 1,
                hash,
                lastSavedAt: data.lastSavedAt || null,
              })
            );
          } catch {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, version: 0, hash: '00000000' }));
          }
          return;
        }

        // 4. Endpoint: GET /api/sync/verify (Data integrity & hash verification)
        if (url === '/api/sync/verify' && req.method === 'GET') {
          try {
            if (!fs.existsSync(dbFile)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  initialized: false,
                  version: 0,
                  hash: '00000000',
                  counts: { transactions: 0, accounts: 0, budgets: 0 },
                })
              );
              return;
            }

            const content = fs.readFileSync(dbFile, 'utf-8');
            const data = JSON.parse(content);
            const hash = computeHash(data);

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
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
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // 5. Endpoint: GET /api/sync (Full database download)
        if (url.startsWith('/api/sync') && req.method === 'GET') {
          try {
            if (!fs.existsSync(dbFile)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  data: null,
                  message: 'Database belum terinisialisasi',
                  serverTime: new Date().toISOString(),
                })
              );
              return;
            }

            const content = fs.readFileSync(dbFile, 'utf-8');
            const data = JSON.parse(content);
            const hash = computeHash(data);

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                data,
                hash,
                serverTime: new Date().toISOString(),
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // 6. Endpoint: POST /api/sync (Save database updates from Laptop or Mobile)
        if (url.startsWith('/api/sync') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const now = new Date().toISOString();
              const sourceDeviceId = (req.headers['x-device-id'] as string) || 'client';

              let existing: any = {};
              if (fs.existsSync(dbFile)) {
                try {
                  existing = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
                } catch {
                  existing = {};
                }
              }

              // Create rolling backup of existing db file before modifications
              const backupFile = path.resolve(dataDir, 'finance_db.backup.json');
              if (fs.existsSync(dbFile)) {
                try {
                  fs.copyFileSync(dbFile, backupFile);
                } catch {
                  // ignore
                }
              }

              let mergedData: any;

              if (payload.isExplicitClearAll) {
                // User explicitly clicked "Clear all data" in Danger Zone
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
                // Non-destructive intelligent union merge: PREVENTS ANY ACCIDENTAL LOSS
                const tombstoneSet = new Set<string>([
                  ...(existing.tombstones || []),
                  ...(payload.tombstones || []),
                ]);

                // Merge transactions by ID (union)
                const txMap = new Map<string, any>();
                (existing.transactions || []).forEach((t: any) => {
                  if (t && t.id && !tombstoneSet.has(t.id)) txMap.set(t.id, t);
                });
                (payload.transactions || []).forEach((t: any) => {
                  if (t && t.id && !tombstoneSet.has(t.id)) {
                    const prev = txMap.get(t.id);
                    if (!prev || new Date(t.createdAt || 0).getTime() >= new Date(prev.createdAt || 0).getTime()) {
                      txMap.set(t.id, t);
                    }
                  }
                });

                // Merge accounts by ID (union - NEVER ALLOW EMPTY ACCOUNTS)
                const accMap = new Map<string, any>();
                (existing.accounts || []).forEach((a: any) => {
                  if (a && a.id && !tombstoneSet.has(a.id)) accMap.set(a.id, a);
                });
                (payload.accounts || []).forEach((a: any) => {
                  if (a && a.id && !tombstoneSet.has(a.id)) accMap.set(a.id, a);
                });

                let finalAccounts = Array.from(accMap.values());
                if (finalAccounts.length === 0 && Array.isArray(existing.accounts) && existing.accounts.length > 0) {
                  finalAccounts = existing.accounts;
                }

                // Merge saving goals
                const goalsMap = new Map<string, any>();
                (existing.savingGoals || []).forEach((g: any) => {
                  if (g && g.id && !tombstoneSet.has(g.id)) goalsMap.set(g.id, g);
                });
                (payload.savingGoals || []).forEach((g: any) => {
                  if (g && g.id && !tombstoneSet.has(g.id)) goalsMap.set(g.id, g);
                });

                // Merge budgets
                const budgetMap = new Map<string, any>();
                (existing.budgets || []).forEach((b: any) => {
                  if (b && b.category) budgetMap.set(b.category, b);
                });
                (payload.budgets || []).forEach((b: any) => {
                  if (b && b.category) budgetMap.set(b.category, b);
                });

                // Merge recurring
                const recMap = new Map<string, any>();
                (existing.recurring || []).forEach((r: any) => {
                  if (r && r.id && !tombstoneSet.has(r.id)) recMap.set(r.id, r);
                });
                (payload.recurring || []).forEach((r: any) => {
                  if (r && r.id && !tombstoneSet.has(r.id)) recMap.set(r.id, r);
                });

                // Merge debts
                const debtMap = new Map<string, any>();
                (existing.debts || []).forEach((d: any) => {
                  if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
                });
                (payload.debts || []).forEach((d: any) => {
                  if (d && d.id && !tombstoneSet.has(d.id)) debtMap.set(d.id, d);
                });

                // Merge semester budgets
                const semMap = new Map<string, any>();
                (existing.semesterBudgets || []).forEach((s: any) => { if (s && s.id && !tombstoneSet.has(s.id)) semMap.set(s.id, s); });
                (payload.semesterBudgets || []).forEach((s: any) => { if (s && s.id && !tombstoneSet.has(s.id)) semMap.set(s.id, s); });

                // Merge scholarships
                const schMap = new Map<string, any>();
                (existing.scholarships || []).forEach((s: any) => { if (s && s.id && !tombstoneSet.has(s.id)) schMap.set(s.id, s); });
                (payload.scholarships || []).forEach((s: any) => { if (s && s.id && !tombstoneSet.has(s.id)) schMap.set(s.id, s); });

                // Merge campus bills
                const cbMap = new Map<string, any>();
                (existing.campusBills || []).forEach((b: any) => { if (b && b.id && !tombstoneSet.has(b.id)) cbMap.set(b.id, b); });
                (payload.campusBills || []).forEach((b: any) => { if (b && b.id && !tombstoneSet.has(b.id)) cbMap.set(b.id, b); });

                // Merge split bills
                const sbMap = new Map<string, any>();
                (existing.splitBills || []).forEach((s: any) => { if (s && s.id && !tombstoneSet.has(s.id)) sbMap.set(s.id, s); });
                (payload.splitBills || []).forEach((s: any) => { if (s && s.id && !tombstoneSet.has(s.id)) sbMap.set(s.id, s); });

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

              // Broadcast instant real-time event to all connected HP & Laptop clients!
              broadcastUpdate(mergedData.version, newHash, sourceDeviceId);

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  version: mergedData.version,
                  hash: newHash,
                  lastSavedAt: now,
                })
              );
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
