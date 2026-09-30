import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  ShoppingBag,
  Sparkles,
  TrendingDown,
  Calculator,
  CheckCircle,
  Lightbulb,
  Utensils,
  Droplets,
  Wifi,
  FileText,
  BadgePercent,
  ArrowRight,
} from 'lucide-react';
import { formatIDR } from '../utils/formatters';

export const PriceSaverView: React.FC = () => {
  const { priceComparisons } = useFinance();

  // Cook vs Buy Calculator State
  const [cookingDaysPerMonth, setCookingDaysPerMonth] = useState<number>(20);
  const [cookingCostPerMeal, setCookingCostPerMeal] = useState<number>(10_000);
  const [eatingOutCostPerMeal, setEatingOutCostPerMeal] = useState<number>(25_000);

  // Calculations
  const monthlyEatingOut = eatingOutCostPerMeal * cookingDaysPerMonth * 2; // 2 meals/day
  const monthlyCooking = cookingCostPerMeal * cookingDaysPerMonth * 2;
  const potentialSavings = Math.max(0, monthlyEatingOut - monthlyCooking);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-100 text-xs font-semibold backdrop-blur-xs mb-2">
            <BadgePercent className="w-4 h-4 text-amber-300" />
            <span>Katalog Hemat & Direktori Harga Mahasiswa</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Perbandingan Harga Kebutuhan Pokok Anak Kos
          </h2>
          <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-xl">
            Ketahui selisih harga kebutuhan harian di sekitar kampus. Hemat hingga 45% anggaran bulanan dengan belanja cerdas.
          </p>
        </div>

        <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-center shrink-0">
          <span className="text-xs text-amber-200 block">Potensi Hemat Maksimal</span>
          <span className="text-2xl font-black font-mono text-white mt-0.5 block">
            ~Rp 650.000 / bln
          </span>
          <span className="text-[11px] text-amber-200">Jika menerapkan tips belanja hemat</span>
        </div>
      </div>

      {/* Interactive Cooking vs Eating Out Calculator */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
          <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Kalkulator Simulasi: Masak Nasi di Kos vs Beli di Luar
            </h3>
            <p className="text-xs text-neutral-500">
              Hitung berapa uang saku yang bisa diselamatkan setiap bulan jika memanfaatkan rice cooker di kamar kos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="space-y-4 md:col-span-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span>Hari Masak Sendiri / Nasi Kos:</span>
                <span className="text-amber-700 font-bold">{cookingDaysPerMonth} Hari / Bulan</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={cookingDaysPerMonth}
                onChange={(e) => setCookingDaysPerMonth(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600 h-2 bg-neutral-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>1 Hari (Jarang)</span>
                <span>15 Hari (Sedang)</span>
                <span>30 Hari (Penuh)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Biaya Masak Sendiri / Porsi (Rp)
                </label>
                <input
                  type="number"
                  value={cookingCostPerMeal}
                  onChange={(e) => setCookingCostPerMeal(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Nasi + telur / tempe sayur</span>
              </div>
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Biaya Beli Luar / Porsi (Rp)
                </label>
                <input
                  type="number"
                  value={eatingOutCostPerMeal}
                  onChange={(e) => setEatingOutCostPerMeal(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Warteg lengkap / kafe / online</span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 text-center space-y-2">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Penghematan Bulanan Kamu
            </span>
            <div className="text-3xl font-black font-mono text-amber-900">
              {formatIDR(potentialSavings)}
            </div>
            <p className="text-xs text-amber-800">
              Dalam 1 semester kuliah (6 bulan), kamu mengumpulkan surplus tabungan hingga{' '}
              <strong className="font-mono">{formatIDR(potentialSavings * 6)}</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Price Comparison Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Komparasi Harga Kebutuhan Mahasiswa</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priceComparisons.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase rounded-md">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-neutral-900 mt-1">{item.itemName}</h4>
                  <p className="text-xs text-neutral-500">Satuan: {item.unit}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 block">
                    Hemat ~{formatIDR(item.monthlySavingsPotential)}/bln
                  </span>
                </div>
              </div>

              {/* Price Options */}
              <div className="space-y-1.5">
                {item.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      opt.isBestValue
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.isBestValue && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span>{opt.label}</span>
                      {opt.isBestValue && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold uppercase">
                          Pilihan Hemat
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold">{formatIDR(opt.price)}</span>
                  </div>
                ))}
              </div>

              {/* Student Tip Box */}
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">{item.studentTip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Golden Rules for Indonesian College Students */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 text-amber-400">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span>7 Aturan Emas Finansial Mahasiswa Perantau</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
          <div className="p-3 bg-neutral-800 rounded-xl space-y-1">
            <span className="font-bold text-white block">1. Beli Galon Isi Ulang Kos Bersertifikat</span>
            <p className="text-neutral-400">Hemat hingga Rp 60.000 sebulan dibanding terus membeli air mineral botol kemasan kecil di minimarket.</p>
          </div>

          <div className="p-3 bg-neutral-800 rounded-xl space-y-1">
            <span className="font-bold text-white block">2. Rice Cooker Adalah Investasi Terbaik</span>
            <p className="text-neutral-400">Hanya bermodal beras 5kg dan telur, kamu bisa makan malam kapan pun tanpa harus bayar ongkos delivery mahal.</p>
          </div>

          <div className="p-3 bg-neutral-800 rounded-xl space-y-1">
            <span className="font-bold text-white block">3. Maksimalkan Kuota Kampus / Eduroam</span>
            <p className="text-neutral-400">Unduh video materi kuliah, e-book, dan playlist lagu saat di kampus menggunakan WiFi resmi.</p>
          </div>

          <div className="p-3 bg-neutral-800 rounded-xl space-y-1">
            <span className="font-bold text-white block">4. Patungan Belanja Grosir Perlengkapan Kos</span>
            <p className="text-neutral-400">Minyak goreng, sabun cuci piring, dan deterjen jauh lebih murah jika patungan bersama teman satu lorong kos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
