import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Bell, ChevronLeft, ChevronRight, Wallet, WifiOff, HardDrive, Smartphone } from 'lucide-react';
import { formatIDR, getCurrentMonthString } from '../../utils/formatters';
import { PwaInstallButton } from '../common/PwaInstallButton';
import { AndroidConnectModal } from '../modals/AndroidConnectModal';
import { SyncMonitorModal } from '../modals/SyncMonitorModal';

interface NavbarProps {
  onOpenQuickAdd: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickAdd, onOpenNotifications }) => {
  const { activeMonth, setActiveMonth, notifications, currentBalance, isOnline, syncStatus } = useFinance();
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isSyncMonitorOpen, setIsSyncMonitorOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handlePrevMonth = () => {
    const [y, m] = activeMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = activeMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(newMonth);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const [yearStr, monthNumStr] = activeMonth.split('-');
  const displayMonth = `${monthNames[parseInt(monthNumStr, 10) - 1]} ${yearStr}`;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-neutral-200">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-base shadow-sm">
          Rp
        </div>
        <span className="text-base md:text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap">
          Student Finance Tracker
        </span>
      </div>

      {/* Zone 2: Month Switcher Navigation Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
          title="Bulan sebelumnya"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs md:text-sm font-semibold text-neutral-800 tabular-nums px-2 py-1 bg-neutral-100/70 rounded-md whitespace-nowrap">
          {displayMonth}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
          title="Bulan berikutnya"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {activeMonth !== getCurrentMonthString() && (
          <button
            onClick={() => setActiveMonth(getCurrentMonthString())}
            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            title="Kembali ke bulan berjalan saat ini"
          >
            Bulan Ini
          </button>
        )}
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Real-time Multi-device Sync indicator badge */}
        {syncStatus.status === 'synced' ? (
          <button
            onClick={() => setIsSyncMonitorOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs cursor-pointer"
            title="Tersinkronisasi otomatis antara Laptop & HP Android. Klik untuk monitor status sinkron."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tersinkron: Laptop ⇄ HP</span>
          </button>
        ) : syncStatus.status === 'syncing' ? (
          <button
            onClick={() => setIsSyncMonitorOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-lg text-xs font-semibold text-sky-800 cursor-pointer"
            title="Sedang menyinkronkan data antar perangkat..."
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>Menyinkronkan...</span>
          </button>
        ) : (
          <button
            onClick={() => setIsSyncMonitorOpen(true)}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 cursor-pointer"
            title="Bekerja dalam mode lokal offline. Klik untuk diagnostik."
          >
            <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Mode Lokal (Offline)</span>
          </button>
        )}

        {/* Quick balance indicator on desktop */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-neutral-100/80 rounded-lg text-xs font-medium text-neutral-700">
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Saldo Dompet:</span>
          <span className="font-semibold text-neutral-900 tabular-nums">
            {formatIDR(currentBalance)}
          </span>
        </div>

        {/* Open on Android Button */}
        <button
          onClick={() => setIsAndroidModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors shadow-2xs"
          title="Buka & Pasang di HP Android"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Buka di HP</span>
        </button>

        {/* PWA Install Button */}
        <PwaInstallButton variant="button" />

        {/* Notifications button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Lihat Notifikasi"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Primary CTA */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Transaksi</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Android Connection Modal */}
      <AndroidConnectModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Sync Monitor & Health Diagnostics Modal */}
      <SyncMonitorModal
        isOpen={isSyncMonitorOpen}
        onClose={() => setIsSyncMonitorOpen(false)}
      />
    </header>
  );
};
