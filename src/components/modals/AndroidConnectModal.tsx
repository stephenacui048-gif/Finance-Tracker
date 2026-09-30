import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Download,
  Upload,
  Globe,
  HelpCircle,
  QrCode,
  RefreshCw,
  Laptop,
  ArrowLeftRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface AndroidConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidConnectModal: React.FC<AndroidConnectModalProps> = ({ isOpen, onClose }) => {
  const { exportDataJSON, importDataJSON, syncStatus } = useFinance();
  const [copied, setCopied] = useState(false);
  const [customIp, setCustomIp] = useState('');
  const [detectedUrl, setDetectedUrl] = useState('');
  const [qrError, setQrError] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Automatically detect real server local IP from backend API
    fetch('/api/system/info')
      .then((r) => r.json())
      .then((info) => {
        if (info.success && info.localIp) {
          const hostPort = `${info.localIp}:${info.port || '3000'}`;
          setCustomIp(hostPort);
          setDetectedUrl(`http://${hostPort}`);
        }
      })
      .catch(() => {
        const currentHost = window.location.hostname;
        const currentPort = window.location.port || '3000';
        if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
          setCustomIp(`${currentHost}:${currentPort}`);
        } else {
          setCustomIp(`10.29.63.199:${currentPort}`);
        }
      });
  }, [isOpen]);

  const activeUrl = detectedUrl || `http://${customIp || 'localhost:3000'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    activeUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncNow = async () => {
    setIsManualSyncing(true);
    try {
      await syncStatus.syncNow();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 600);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack_data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Integrasi HP Android & Laptop</h3>
              <p className="text-xs text-emerald-100">
                Edit keuangan dari HP maupun Laptop secara sinkron real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Real-time Sync Status Banner */}
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sinkronisasi Otomatis Dua Arah Aktif</span>
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5 truncate">
                  Data yang Anda tambah/edit di HP langsung tersimpan dan tampil di Laptop.
                </p>
              </div>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isManualSyncing}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
            </button>
          </div>

          {/* URL & QR Code Card */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-center gap-5">
            {/* QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-2xs">
                {!qrError ? (
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR untuk membuka di HP Android"
                    className="w-36 h-36 rounded-lg object-contain"
                    onError={() => setQrError(true)}
                  />
                ) : (
                  <div className="w-36 h-36 flex flex-col items-center justify-center text-center p-2 text-neutral-400">
                    <QrCode className="w-12 h-12 mb-1 text-emerald-600" />
                    <span className="text-[10px]">Ketik alamat URL secara manual</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-medium mt-1.5 flex items-center gap-1">
                📷 Scan dengan Kamera HP
              </span>
            </div>

            {/* URL Input & Copy */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Alamat URL untuk HP Android:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeUrl}
                    readOnly
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-lg text-emerald-700 font-bold focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                    title="Salin Alamat URL"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 bg-white p-2.5 rounded-lg border border-neutral-200/80 space-y-1">
                <span className="font-semibold text-neutral-700">💡 IP Jaringan Terdeteksi Otomatis:</span>
                <p className="text-[10px] text-neutral-500">
                  Laptop dan HP harus terhubung ke Wi-Fi / Hotspot yang sama agar dapat saling terhubung.
                </p>
                <input
                  type="text"
                  placeholder="Ganti IP manual jika perlu (misal 192.168.1.5:3000)"
                  value={customIp}
                  onChange={(e) => {
                    setCustomIp(e.target.value);
                    setDetectedUrl(`http://${e.target.value}`);
                    setQrError(false);
                  }}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-mono border rounded bg-neutral-50"
                />
              </div>
            </div>
          </div>

          {/* 3 Langkah Mudah Membuka di Android */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <span>🚀 3 Langkah Pasang FinTrack di HP Android:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h5 className="font-bold text-neutral-900 text-xs">Satu Wi-Fi / Hotspot</h5>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Hubungkan HP dan Laptop ke Wi-Fi yang sama (atau nyalakan Hotspot HP ke Laptop).
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h5 className="font-bold text-neutral-900 text-xs">Buka di Browser HP</h5>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Scan QR code di atas atau buka Google Chrome di HP dan ketik URL tersebut.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h5 className="font-bold text-neutral-900 text-xs">Pasang di Layar HP</h5>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Ketuk titik tiga (⋮) di Chrome HP &gt; pilih <strong>"Pasang Aplikasi"</strong> / <strong>"Tambahkan ke Layar Utama"</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Backup data option */}
          <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-neutral-500 text-[11px]">
              Ingin salinan cadangan offline? Unduh berkas data JSON kapan saja.
            </span>
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>Cadangkan File JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
