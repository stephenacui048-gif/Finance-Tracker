import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallButton: React.FC<{ variant?: 'button' | 'banner' | 'card' }> = ({
  variant = 'button',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Check if iOS
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosGuide(true);
      } else {
        alert(
          'Untuk memasang aplikasi:\n1. Buka menu browser (titik tiga di kanan atas)\n2. Pilih "Pasang Aplikasi" atau "Install App" / "Tambahkan ke Layar Utama".'
        );
      }
    }
  };

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Aplikasi telah terpasang di perangkat ini (PWA Aktif)</span>
          </div>
        </div>
      );
    }
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className="p-3 bg-linear-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Pasang FinTrack di HP / Laptop (PWA)</span>
            <p className="text-[11px] text-emerald-100">
              Akses cepat tanpa browser, responsif instan & tetap bisa catat saat offline
            </p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang Sekarang</span>
        </button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="p-4 bg-linear-to-br from-emerald-50/70 via-white to-neutral-50 rounded-xl border border-emerald-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">
                Aplikasi Web Progresif (PWA)
              </h4>
              <p className="text-[11px] text-neutral-500">
                Install di Android, iOS, Windows, atau Mac
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Aplikasi</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-neutral-200/80">
          <p>
            ✨ <strong>Keunggulan PWA:</strong> Icon di homescreen, loading instan tanpa download dari Play Store, dan transaksi tetap tersimpan aman saat kuota internet habis.
          </p>
        </div>

        {/* iOS Helper Modal */}
        {showIosGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <div className="bg-white p-5 rounded-2xl max-w-sm w-full space-y-3 shadow-2xl text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-neutral-900">Cara Pasang di iPhone/iPad:</span>
                <button onClick={() => setShowIosGuide(false)}>
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1.5 text-neutral-700">
                <li>Buka situs ini di browser <strong>Safari</strong>.</li>
                <li>
                  Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas <Share className="w-3 h-3 inline" />).
                </li>
                <li>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                <li>Ketuk <strong>Tambah</strong> di pojok kanan atas. Selesai! 🎉</li>
              </ol>
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default compact button for Navbar
  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
        title="Pasang aplikasi di perangkatmu (PWA)"
      >
        <Download className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white p-5 rounded-2xl max-w-sm w-full space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-neutral-900">Cara Pasang di iPhone/iPad:</span>
              <button onClick={() => setShowIosGuide(false)}>
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-neutral-700">
              <li>Buka situs ini di browser <strong>Safari</strong>.</li>
              <li>
                Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah atas <Share className="w-3 h-3 inline" />).
              </li>
              <li>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
              <li>Ketuk <strong>Tambah</strong> di pojok kanan atas. Selesai! 🎉</li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
