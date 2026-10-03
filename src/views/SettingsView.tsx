import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Settings,
  User,
  ShieldAlert,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Check,
  Plus,
  Clock,
  Sparkles,
  AlertCircle,
  HardDrive,
  Wifi,
  WifiOff,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Server,
  Cloud,
  Globe,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { formatIDR, formatDateID } from '../utils/formatters';
import { RecurringTransaction, ExpenseCategory, IncomeSource } from '../types/finance';
import { BudgetingMethodsModal } from '../components/budget/BudgetingMethodsModal';
import { BUDGETING_METHODS } from '../data/budgetingMethods';
import { PwaInstallButton } from '../components/common/PwaInstallButton';
import { AndroidConnectModal } from '../components/modals/AndroidConnectModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    recurring,
    addRecurring,
    deleteRecurring,
    processRecurringEntry,
    resetToDemoData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
    isOnline,
    lastSavedAt,
    storageUsageBytes,
    transactions,
    savingGoals,
    selectedBudgetingMethod,
    syncStatus,
    restoreEmergencyBackup,
  } = useFinance();

  // Budgeting modal state
  const [isMethodsModalOpen, setIsMethodsModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const activeMethodDef =
    BUDGETING_METHODS.find((m) => m.id === selectedBudgetingMethod) || BUDGETING_METHODS[0];

  // Profile inputs
  const [name, setName] = useState(settings.userName);
  const [university, setUniversity] = useState(settings.university);
  const [openingBalance, setOpeningBalance] = useState(String(settings.openingBalance));
  const [desiredSavings, setDesiredSavings] = useState(String(settings.desiredSavingsTarget));
  const [payday, setPayday] = useState(String(settings.paydayOrAllowanceDay));
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keep form inputs synced when settings update from cloud/other devices
  React.useEffect(() => {
    setName(settings.userName || '');
    setUniversity(settings.university || '');
    setOpeningBalance(String(settings.openingBalance || 0));
    setDesiredSavings(String(settings.desiredSavingsTarget || 0));
    setPayday(String(settings.paydayOrAllowanceDay || 1));
  }, [
    settings.userName,
    settings.university,
    settings.openingBalance,
    settings.desiredSavingsTarget,
    settings.paydayOrAllowanceDay,
  ]);

  // New recurring modal / inputs
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recAmountStr, setRecAmountStr] = useState('');
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recCategory, setRecCategory] = useState<string>('Subscription');
  const [recDueDay, setRecDueDay] = useState<number>(1);

  // Confirmation dialogs
  const [showConfirmResetDemo, setShowConfirmResetDemo] = useState(false);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  // JSON import feedback
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Cloud & Multi-Device Sync state
  const [cloudUrlInput, setCloudUrlInput] = useState(settings.cloudSyncUrl || '');
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isForcingSync, setIsForcingSync] = useState(false);
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<{
    identical: boolean;
    serverVersion: number;
    localVersion: number;
    serverHash: string;
    localHash: string;
  } | null>(null);

  const handleTestCloudUrl = async () => {
    setIsTestingCloud(true);
    setTestResult(null);
    try {
      let target = cloudUrlInput.trim();
      if (!target) {
        target = window.location.origin;
      } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'http://' + target;
      }
      target = target.replace(/\/+$/, '');

      const res = await fetch(`${target}/api/sync/version`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}: server sync belum siap`);
      }
      if (data.success) {
        setTestResult({
          success: true,
          message: `Terhubung sukses! Master Versi: v${data.version}, Hash: #${data.hash || '0000'}`,
        });
        updateSettings({ cloudSyncUrl: cloudUrlInput.trim() });
        syncStatus.setCustomServerUrl(cloudUrlInput.trim());
      } else {
        setTestResult({ success: false, message: 'Server merespon tetapi data sync tidak valid.' });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Gagal terhubung: ${e.message || 'Server offline'}. Pastikan server berjalan dan URL benar.`,
      });
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleResetToLocalServer = () => {
    setCloudUrlInput('');
    updateSettings({ cloudSyncUrl: '' });
    syncStatus.setCustomServerUrl('');
    setTestResult({ success: true, message: 'Kembali menggunakan server Wi-Fi lokal laptop.' });
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleForceSync = async () => {
    setIsForcingSync(true);
    try {
      await syncStatus.syncNow();
    } finally {
      setIsForcingSync(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifyingIntegrity(true);
    setIntegrityReport(null);
    try {
      const res = await syncStatus.verifyIntegrity();
      setIntegrityReport(res);
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: name.trim() || 'Mahasiswa',
      university: university.trim() || 'Universitas',
      openingBalance: parseFloat(openingBalance) || 0,
      desiredSavingsTarget: parseFloat(desiredSavings) || 0,
      paydayOrAllowanceDay: Math.min(31, Math.max(1, parseInt(payday, 10) || 1)),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(recAmountStr.replace(/[^0-9]/g, ''));
    if (!recTitle.trim() || isNaN(amount) || amount <= 0) return;

    addRecurring({
      title: recTitle.trim(),
      amount,
      type: recType,
      category: recCategory,
      frequency: 'monthly',
      dueDay: recDueDay,
      nextDueDate: `2026-10-${String(recDueDay).padStart(2, '0')}`,
      classification: recType === 'expense' ? 'need' : undefined,
    });

    setRecTitle('');
    setRecAmountStr('');
    setShowAddRecurring(false);
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_finance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        setImportStatus({ success: true, message: 'Data backup berhasil dipulihkan!' });
      } else {
        setImportStatus({ success: false, message: `Gagal memulihkan: ${res.error}` });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
        <h2 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight">
          Pengaturan & Manajemen Data
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Kelola profil mahasiswa, transaksi berulang otomatis, cadangan data, dan opsi reset
        </p>
      </div>

      {/* Profile & Financial Preferences Form */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <User className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-neutral-900">Profil & Preferensi Mahasiswa</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nama Lengkap / Panggilan
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Kampus / Universitas
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Saldo Awal Dompet (Rp)
              </label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Target Nabung Bulanan (Rp)
              </label>
              <input
                type="number"
                value={desiredSavings}
                onChange={(e) => setDesiredSavings(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tanggal Terima Kiriman Ortu / Gaji (1 - 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={payday}
                onChange={(e) => setPayday(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Pengaturan profil berhasil disimpan!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Preferensi Metode Budgeting Section */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                Preferensi Metode Budgeting (Alokasi Anggaran)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Pilih formula budgeting mahasiswa (50/30/20, 80/20, Zero-Based, 6 Jars, Debt Snowball, Debt Avalanche)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMethodsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <span>Pilih & Ganti Metode</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Metode yang Digunakan Saat Ini:</span>
              <strong className="text-neutral-900 font-bold text-sm">{activeMethodDef.name}</strong>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                {activeMethodDef.shortName}
              </span>
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              {activeMethodDef.description}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[10px] text-neutral-400 block">Penerapan Anggaran</span>
            <span className="text-emerald-700 font-bold text-xs">Terapkan Otomatis Tersedia</span>
          </div>
        </div>
      </div>

      {/* Recurring Transactions Section */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Transaksi Berulang Otomatis (Recurring)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Uang kos, wifi, langganan Spotify, dan kiriman ortu yang berulang setiap bulan
            </p>
          </div>

          <button
            onClick={() => setShowAddRecurring(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Berulang</span>
          </button>
        </div>

        {recurring.length === 0 ? (
          <p className="text-xs text-neutral-400 py-3 text-center">
            Belum ada transaksi berulang terdaftar.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 text-xs">
            {recurring.map((rec) => (
              <div key={rec.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">{rec.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        rec.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rec.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    Kategori: {rec.category} · Tiap tanggal {rec.dueDay} setiap bulan
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-bold tabular-nums ${rec.type === 'income' ? 'text-emerald-700' : 'text-neutral-900'}`}>
                    {rec.type === 'income' ? '+' : '-'}{formatIDR(rec.amount)}
                  </span>
                  <button
                    onClick={() => processRecurringEntry(rec.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                    title="Catat langsung transaksi ini ke bulan aktif sekarang"
                  >
                    Eksekusi Sekarang
                  </button>
                  <button
                    onClick={() => deleteRecurring(rec.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Recurring Form inline collapsible */}
        {showAddRecurring && (
          <form onSubmit={handleAddRecurring} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900">Tambah Transaksi Berulang Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Nama (misal: Sewa Kamar Kos)"
                value={recTitle}
                onChange={(e) => setRecTitle(e.target.value)}
                className="px-3 py-1.5 text-xs border rounded bg-white"
              />
              <input
                type="number"
                required
                placeholder="Nominal (Rp)"
                value={recAmountStr}
                onChange={(e) => setRecAmountStr(e.target.value)}
                className="px-3 py-1.5 text-xs border rounded bg-white tabular-nums"
              />
              <select
                value={recType}
                onChange={(e) => setRecType(e.target.value as any)}
                className="px-3 py-1.5 text-xs border rounded bg-white"
              >
                <option value="expense">Pengeluaran Rutin</option>
                <option value="income">Pemasukan Rutin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-500 mb-0.5">Tanggal Jatuh Tempo (1 - 31):</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recDueDay}
                  onChange={(e) => setRecDueDay(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-1.5 text-xs border rounded bg-white tabular-nums"
                />
              </div>
              <div className="flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecurring(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                >
                  Simpan Berulang
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Multi-Device Cloud & Offline Sync Control Center */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900">
              Sinkronisasi Multi-Perangkat (HP & Laptop) & Server Cloud
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                syncStatus.status === 'synced'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : syncStatus.status === 'syncing'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : syncStatus.status === 'pending'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              {syncStatus.status === 'synced' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Data Identik & Terhubung (SSE Real-Time)</span>
                </>
              ) : syncStatus.status === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Sedang Menyinkronkan...</span>
                </>
              ) : syncStatus.status === 'pending' ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{syncStatus.outboxCount} Mutasi Tertunda (Outbox)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Mode Offline (Disimpan Aman di Perangkat)</span>
                </>
              )}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Menggunakan arsitektur <strong>Local-First & Sync Engine</strong>. Semua mutasi keuangan (transaksi, anggaran, target tabungan) tersimpan seketika di memori lokal HP dan Laptop (0ms latensi), kemudian disinkronkan dua arah secara mulus (*seamless*) ke server pusat sehingga seluruh perangkat selalu menampilkan data yang identik.
        </p>

        {/* 4 Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-0.5">
            <span className="text-[11px] text-neutral-500 block">Status Jaringan</span>
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-700">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                  <span className="text-neutral-600">Offline</span>
                </>
              )}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-0.5">
            <span className="text-[11px] text-neutral-500 block">Versi Basis Data Master</span>
            <span className="text-xs font-bold text-neutral-900 tabular-nums">
              v{syncStatus.version || 1}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-0.5">
            <span className="text-[11px] text-neutral-500 block">Integritas Data (Hash)</span>
            <span className="text-xs font-mono font-bold text-emerald-700 truncate block">
              #{syncStatus.dataHash || '00000000'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-0.5">
            <span className="text-[11px] text-neutral-500 block">Antrean Offline (Outbox)</span>
            <span
              className={`text-xs font-bold tabular-nums ${
                syncStatus.outboxCount > 0 ? 'text-amber-600' : 'text-neutral-900'
              }`}
            >
              {syncStatus.outboxCount} Mutasi
            </span>
          </div>
        </div>

        {/* Quick Sync Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleForceSync}
            disabled={isForcingSync}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isForcingSync ? 'animate-spin' : ''}`} />
            <span>{isForcingSync ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>

          <button
            onClick={handleVerifyIntegrity}
            disabled={isVerifyingIntegrity}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isVerifyingIntegrity ? 'Memverifikasi...' : 'Uji Kesamaan Data (Verifikasi Hash)'}</span>
          </button>

          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-700" />
            <span>Hubungkan HP (QR Code)</span>
          </button>
        </div>

        {/* Integrity Check Result Banner */}
        {integrityReport && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              integrityReport.identical
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {integrityReport.identical ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data 100% Identik & Sinkron Sempurna!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Perbedaan Terdeteksi - Menyinkronkan Ulang Disarankan</span>
                </>
              )}
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Hash Lokal: <code className="font-mono bg-white/60 px-1 py-0.5 rounded">#{integrityReport.localHash}</code> | 
              Hash Server: <code className="font-mono bg-white/60 px-1 py-0.5 rounded">#{integrityReport.serverHash}</code> | 
              Versi Master: <span className="font-semibold">v{integrityReport.serverVersion}</span> (Versi Lokal: v{integrityReport.localVersion})
            </p>
          </div>
        )}

        {/* Outbox Pending Mutations Alert */}
        {syncStatus.outboxCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Terdapat <strong>{syncStatus.outboxCount} mutasi</strong> menunggu dikirim ke server. Mutasi tetap tersimpan di perangkat sampai server mengonfirmasi penerimaan.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleForceSync}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
              >
                Kirim
              </button>
              <button
                onClick={() => syncStatus.clearOutbox()}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px]"
              >
                Bersihkan
              </button>
            </div>
          </div>
        )}

        {syncStatus.errorMessage && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            Sinkronisasi gagal: {syncStatus.errorMessage}. Data lokal dan antrean tetap tersimpan.
          </div>
        )}

        {/* Cloud / Remote Server URL Configuration Box */}
        <div className="p-4 bg-neutral-50/70 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-neutral-700" />
              <h4 className="text-xs font-bold text-neutral-900">
                Konfigurasi Server Sinkronisasi (Lokal Wi-Fi atau Cloud)
              </h4>
            </div>
            {settings.cloudSyncUrl ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                Cloud Kustom Aktif
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-neutral-200 text-neutral-700 rounded">
                Server Lokal Wi-Fi
              </span>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Secara default aplikasi menggunakan server lokal Laptopmu di <strong>{syncStatus.serverUrl || 'http://localhost:3000'}</strong> (cukup hubungkan HP & Laptop ke Wi-Fi / Hotspot yang sama). Jika kamu ingin sinkron dari luar rumah via internet, masukkan URL server Cloudmu di sini:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={cloudUrlInput}
              onChange={(e) => setCloudUrlInput(e.target.value)}
              placeholder="Contoh: https://fintrack.domainkamu.com atau http://10.29.63.199:3000"
              className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <button
              onClick={handleTestCloudUrl}
              disabled={isTestingCloud}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {isTestingCloud ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menguji...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Uji & Simpan</span>
                </>
              )}
            </button>
            {settings.cloudSyncUrl && (
              <button
                onClick={handleResetToLocalServer}
                className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                Gunakan Wi-Fi Lokal
              </button>
            )}
          </div>

          {testResult && (
            <p
              className={`text-[11px] p-2 rounded-md font-medium ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.message}
            </p>
          )}
        </div>

        {/* Storage Details Footer */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-100 gap-2">
          <span>
            {transactions.length} Transaksi, {savingGoals.length} Target Tabungan disimpan secara lokal ({(storageUsageBytes / 1024).toFixed(1)} KB).
          </span>
          {lastSavedAt && (
            <span>
              Terakhir diperbarui: {new Date(lastSavedAt).toLocaleTimeString('id-ID')} ({formatDateID(lastSavedAt.slice(0, 10), 'short')})
            </span>
          )}
        </div>
      </div>

      {/* PWA Mobile & Desktop App Card */}
      <PwaInstallButton variant="card" />

      {/* Android Connect Banner Card */}
      <div className="p-4 bg-linear-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Buka FinTrack di HP Android</h4>
            <p className="text-[11px] text-emerald-100">
              Scan QR code untuk membuka di Google Chrome HP & pasang ke Layar Utama
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAndroidModalOpen(true)}
          className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Lihat QR Code & Panduan HP</span>
        </button>
      </div>

      {/* Backup & Restore JSON */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Download className="w-4 h-4 text-neutral-700" />
          <h3 className="text-sm font-bold text-neutral-900">Ekspor & Impor Cadangan Data (JSON)</h3>
        </div>
        <p className="text-xs text-neutral-500">
          Simpan seluruh riwayat keuanganmu sebagai file cadangan lokal atau pulihkan data di perangkat lain.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Pulihkan dari File JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              const res = restoreEmergencyBackup();
              if (res.success) {
                setImportStatus({ success: true, message: res.message || 'Cadangan darurat berhasil dipulihkan!' });
              } else {
                setImportStatus({ success: false, message: res.message || 'Tidak ada cadangan darurat yang tersimpan.' });
              }
              setTimeout(() => setImportStatus(null), 5000);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>Pulihkan Cadangan Otomatis</span>
          </button>
        </div>

        {importStatus && (
          <p
            className={`text-xs p-2.5 rounded-lg border font-medium ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {importStatus.message}
          </p>
        )}
      </div>

      {/* Reset & Dangerous Zone */}
      <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-900">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold">Zona Bahaya & Reset Data</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <h4 className="text-xs font-bold text-neutral-900">Kembalikan Data Contoh (Demo Mahasiswa)</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Mengisi ulang aplikasi dengan data simulasi realistis mahasiswa Indonesia (kiriman ortu, kos, part-time aslab, target laptop).
            </p>
            <button
              onClick={() => setShowConfirmResetDemo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Data Demo</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 space-y-2">
            <h4 className="text-xs font-bold text-rose-950">Mulai dari Nol (Hapus Seluruh Data)</h4>
            <p className="text-[11px] text-rose-800/80 leading-relaxed">
              Menghapus semua transaksi, target tabungan, dan anggaran dari browser untuk memulai catatan pribadi barumu.
            </p>
            <button
              onClick={() => setShowConfirmClearAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Bersih Semua Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showConfirmResetDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-neutral-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-neutral-900">Reset ke Data Contoh?</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Data transaksi yang telah kamu tambahkan akan digantikan oleh dataset demo mahasiswa.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmResetDemo(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setShowConfirmResetDemo(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Ya, Muat Data Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-rose-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-rose-950">Konfirmasi Hapus Seluruh Data</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Seluruh transaksi, anggaran, dan target tabungan akan dikosongkan.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmClearAll(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowConfirmClearAll(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Ya, Hapus Bersih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budgeting Methods Modal */}
      <BudgetingMethodsModal
        isOpen={isMethodsModalOpen}
        onClose={() => setIsMethodsModalOpen(false)}
      />

      {/* Android Connect Modal */}
      <AndroidConnectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
};
