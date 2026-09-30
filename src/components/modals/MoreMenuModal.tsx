import React from 'react';
import { NavTab } from '../layout/Sidebar';
import { Calendar, FileText, Settings, X, PlusCircle, Wallet, CalendarClock, GraduationCap, Users, ShoppingBag } from 'lucide-react';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenQuickAdd,
}) => {
  if (!isOpen) return null;

  const items: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    {
      id: 'campus',
      label: 'Keuangan Kampus (Semester & Beasiswa)',
      icon: GraduationCap,
      desc: 'Atur budget semester, pantau beasiswa, dan bayar tagihan UKT/lab',
    },
    {
      id: 'splitbill',
      label: 'Split Bill & QR Tagihan',
      icon: Users,
      desc: 'Patungan makan teman/kos, hitung pajak, dan kirim pesan WhatsApp',
    },
    {
      id: 'pricesaver',
      label: 'Katalog Hemat & Cek Harga',
      icon: ShoppingBag,
      desc: 'Komparasi harga belanja kos & simulasi hemat masak sendiri',
    },
    {
      id: 'wallets',
      label: 'Dompet & Rekening (Multi-Wallet)',
      icon: Wallet,
      desc: 'Pantau saldo di Bank BCA, GoPay, Tunai, dan transfer antar akun',
    },
    {
      id: 'recurring',
      label: 'Tagihan & Pengingat Rutin',
      icon: CalendarClock,
      desc: 'Pengingat uang kos, Spotify, WiFi, dan jadwal pembayaran',
    },
    {
      id: 'calendar',
      label: 'Kalender Keuangan',
      icon: Calendar,
      desc: 'Lihat jadwal pengeluaran harian & tanggal no-spend',
    },
    {
      id: 'reports',
      label: 'Laporan Bulanan',
      icon: FileText,
      desc: 'Analisis pemasukan, kebutuhan vs keinginan, dan komparasi',
    },
    {
      id: 'settings',
      label: 'Pengaturan & Cadangan',
      icon: Settings,
      desc: 'Reset data demo, ekspor backup, dan profil',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-neutral-200 overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900">Menu Lainnya</h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-neutral-50 border border-neutral-100 transition-colors"
              >
                <div className="p-2 bg-neutral-100 rounded-md text-neutral-700">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">{item.label}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-neutral-100">
          <button
            onClick={() => {
              onClose();
              onOpenQuickAdd();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
