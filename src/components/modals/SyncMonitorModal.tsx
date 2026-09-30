import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  Laptop,
  Smartphone,
  Server,
  X,
  Activity,
  Layers,
} from 'lucide-react';

interface SyncMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncMonitorModal: React.FC<SyncMonitorModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, syncStatus, lastSavedAt, storageUsageBytes } = useFinance();
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<{
    identical: boolean;
    serverVersion: number;
    localVersion: number;
    serverHash: string;
    localHash: string;
  } | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleTestPing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/system/info');
      if (res.ok) {
        setPingLatency(Math.round(performance.now() - start));
      } else {
        setPingLatency(null);
      }
    } catch {
      setPingLatency(null);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await syncStatus.verifyIntegrity();
      setIntegrityResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleForceSync = async () => {
    await syncStatus.syncNow();
    await handleTestPing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Diagnostik & Monitor Sinkronisasi
              </h3>
              <p className="text-xs text-neutral-500">
                Arsitektur Offline-First & Real-Time Sync Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status Badge */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  syncStatus.status === 'synced'
                    ? 'bg-emerald-500 animate-pulse'
                    : syncStatus.status === 'syncing'
                    ? 'bg-sky-500 animate-ping'
                    : 'bg-amber-500'
                }`}
              />
              <div>
                <span className="font-bold text-neutral-900 text-sm block">
                  {syncStatus.status === 'synced'
                    ? 'Tersinkronisasi Penuh'
                    : syncStatus.status === 'syncing'
                    ? 'Sedang Menyinkronkan...'
                    : 'Mode Offline (Lokal)'}
                </span>
                <span className="text-neutral-500">
                  {isOnline ? 'Terhubung ke Jaringan' : 'Tidak Ada Internet'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-neutral-500 block">Ping Server:</span>
              <span className="font-mono font-bold text-emerald-700">
                {pingLatency !== null ? `${pingLatency} ms` : 'Offline'}
              </span>
            </div>
          </div>

          {/* Metric Rows */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Server className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Versi Database:</span>
              </div>
              <p className="text-sm font-bold font-mono text-neutral-900">
                v{syncStatus.version || 1}
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <Layers className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">Antrean Outbox:</span>
              </div>
              <p className="text-sm font-bold font-mono text-neutral-900">
                {syncStatus.outboxCount} Mutasi Tertunda
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Penyimpanan Lokal:</span>
              </div>
              <p className="text-sm font-bold font-mono text-neutral-900">
                {(storageUsageBytes / 1024).toFixed(1)} KB
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-500 mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="font-semibold">Hash Integritas:</span>
              </div>
              <p className="text-sm font-bold font-mono text-neutral-900">
                {syncStatus.dataHash ? syncStatus.dataHash.slice(0, 8) : '00000000'}
              </p>
            </div>
          </div>

          {/* Cross-Device Topology */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
            <span className="font-bold text-emerald-950 block">Topologi Perangkat:</span>
            <div className="flex items-center justify-between text-neutral-700">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>Laptop (Browser Web)</span>
              </div>
              <span className="text-emerald-800 font-bold">⇄ Realtime SSE ⇄</span>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>HP Android (PWA)</span>
              </div>
            </div>
          </div>

          {/* Integrity Result Card */}
          {integrityResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                integrityResult.identical
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              {integrityResult.identical ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {integrityResult.identical
                    ? 'Integritas 100% Identik (Konsisten)'
                    : 'Perbedaan Versi Terdeteksi'}
                </p>
                <p className="text-[11px] mt-0.5">
                  Server Hash: <strong className="font-mono">{integrityResult.serverHash}</strong> |
                  Lokal Hash: <strong className="font-mono">{integrityResult.localHash}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isVerifying ? 'Memeriksa...' : 'Uji Integritas Data'}</span>
          </button>

          <button
            onClick={handleForceSync}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sinkronkan Paksa Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
