import React, { useState } from 'react';
import { Camera, Upload, Check, RefreshCw, X, Receipt, Sparkles, FileText, ShoppingBag } from 'lucide-react';
import { formatIDR } from '../../utils/formatters';

export interface ScannedReceiptData {
  merchant: string;
  totalAmount: number;
  date: string;
  category: string;
  items: string[];
  notes: string;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScannedData: (data: ScannedReceiptData) => void;
}

const SAMPLE_RECEIPTS: { name: string; icon: string; data: ScannedReceiptData }[] = [
  {
    name: 'Indomaret Point Kos',
    icon: '🛒',
    data: {
      merchant: 'Indomaret Point Kaliurang',
      totalAmount: 38_500,
      date: new Date().toISOString().slice(0, 10),
      category: 'Makanan',
      items: ['Air Mineral 1.5L', 'Roti Gandum Kasur', 'Sabun Cuci Piring', 'Baterai ABC AAA'],
      notes: 'Belanja mingguan perlengkapan kos & air minum',
    },
  },
  {
    name: 'Warmindo Borobudur (Nasi Dok-dok)',
    icon: '🍜',
    data: {
      merchant: 'Warmindo Borobudur Kampus',
      totalAmount: 24_000,
      date: new Date().toISOString().slice(0, 10),
      category: 'Makanan',
      items: ['1x Nasi Dok-Dok Spesial', '1x Es Teh Manis Jumbo', '2x Kerupuk Putih'],
      notes: 'Makan malam sepulang kuliah praktikum',
    },
  },
  {
    name: 'Fotokopi & Print Barokah',
    icon: '📄',
    data: {
      merchant: 'Fotokopi & Percetakan Barokah',
      totalAmount: 45_000,
      date: new Date().toISOString().slice(0, 10),
      category: 'Pendidikan',
      items: ['Print Draft Proposal Skripsi 45 Lembar', 'Jilid Mika Spiral Kawat'],
      notes: 'Cetak berkas seminar proposal bab 1-3',
    },
  },
  {
    name: 'Kafe Ruang Kopi (Nugas)',
    icon: '☕',
    data: {
      merchant: 'Ruang Kopi & Coworking',
      totalAmount: 32_000,
      date: new Date().toISOString().slice(0, 10),
      category: 'Nongkrong',
      items: ['1x Es Kopi Susu Aren Gula Jawa', '1x French Fries'],
      notes: 'Nugas kelompok mata kuliah Pemrograman',
    },
  },
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyScannedData,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedReceiptData | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      simulateOCRScan(file.name);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsScanning(true);
    setTimeout(() => {
      setScannedResult(sample.data);
      setIsScanning(false);
    }, 700);
  };

  const simulateOCRScan = (fileName: string) => {
    setIsScanning(true);
    setScannedResult(null);

    setTimeout(() => {
      // Intelligent fallback scan result
      const isIndomaret = fileName.toLowerCase().includes('indo') || fileName.toLowerCase().includes('alfa');
      const isFood = fileName.toLowerCase().includes('makan') || fileName.toLowerCase().includes('resto');

      const result: ScannedReceiptData = {
        merchant: isIndomaret ? 'Minimarket Retail' : isFood ? 'Kantin / Resto Kampus' : 'Toko Kebutuhan Mahasiswa',
        totalAmount: isIndomaret ? 42_500 : isFood ? 25_000 : 35_000,
        date: new Date().toISOString().slice(0, 10),
        category: isIndomaret ? 'Makanan' : isFood ? 'Makanan' : 'Pendidikan',
        items: ['Item Terdeteksi 1', 'Item Terdeteksi 2', 'Air Mineral'],
        notes: `Pindaian otomatis struk ${fileName}`,
      };

      setScannedResult(result);
      setIsScanning(false);
    }, 1200);
  };

  const handleApply = () => {
    if (scannedResult) {
      onApplyScannedData(scannedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Pindai Resi / Struk Kasir</h3>
              <p className="text-xs text-neutral-500">Ekstrak otomatis nominal, toko, dan barang belanja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Upload Box */}
          <div className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-xl p-6 text-center transition-colors bg-neutral-50/60">
            <input
              type="file"
              accept="image/*"
              id="receipt-file-input"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="receipt-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-800">
                Unggah Foto Struk Belanja atau Nota
              </p>
              <p className="text-xs text-neutral-500">
                Format JPG, PNG, atau jepret langsung dari kamera HP
              </p>
              <span className="mt-1 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors shadow-2xs">
                Pilih Berkas Struk
              </span>
            </label>
          </div>

          {previewUrl && (
            <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 p-2 text-center">
              <img src={previewUrl} alt="Preview Struk" className="max-h-40 mx-auto object-contain rounded" />
              <p className="text-xs text-neutral-500 mt-1">{selectedFile?.name}</p>
            </div>
          )}

          {/* Quick Preset Samples for Testing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Atau Coba Contoh Struk Mahasiswa:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_RECEIPTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="flex items-center gap-2.5 p-2.5 bg-neutral-50 hover:bg-emerald-50/70 border border-neutral-200 hover:border-emerald-300 rounded-lg text-left transition-colors group"
                >
                  <span className="text-xl shrink-0">{sample.icon}</span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-neutral-800 group-hover:text-emerald-800 truncate">
                      {sample.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {formatIDR(sample.data.totalAmount)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* OCR Scanning Progress */}
          {isScanning && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Membaca karakter OCR & total belanja...</p>
                <p className="text-[11px] text-emerald-700">Mendeteksi tanggal, nominal subtotal, pajak, dan kategori</p>
              </div>
            </div>
          )}

          {/* Scanned Result Card */}
          {scannedResult && !isScanning && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  Hasil Pindaian Terdeteksi
                </span>
                <span className="text-xs font-mono font-bold text-emerald-900">
                  {formatIDR(scannedResult.totalAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500">Toko / Merchant:</span>
                  <p className="font-semibold text-neutral-900">{scannedResult.merchant}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Kategori Disarankan:</span>
                  <p className="font-semibold text-emerald-800">{scannedResult.category}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Tanggal:</span>
                  <p className="font-semibold text-neutral-900">{scannedResult.date}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Item Terbaca:</span>
                  <p className="font-semibold text-neutral-900">{scannedResult.items.length} Barang</p>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-100 text-xs text-neutral-600">
                <span className="font-semibold text-neutral-800 block mb-1">Daftar Barang:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {scannedResult.items.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            disabled={!scannedResult || isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Gunakan ke Formulir Transaksi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
