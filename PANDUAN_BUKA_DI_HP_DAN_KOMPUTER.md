# 📱 Panduan FinTrack: Buka di HP Android & Komputer (Offline & Online)

Aplikasi **FinTrack (Student Finance Tracker)** kini telah dilengkapi sistem otomatis agar Anda dapat:
1. **Membuka aplikasi di Laptop/PC dengan 1 klik** (tanpa perlu mengetik "run" atau membuka chat ini lagi).
2. **Membuka dan memasang aplikasi di HP Android** (seperti aplikasi Play Store).
3. **Mencatat dan mengedit keuangan secara Offline maupun Online**.

---

## 💻 1. Cara Buka di Laptop / PC Tanpa Mengetik "run"

Telah disediakan shortcut langsung di layar monitor Anda:
- **Cari icon di Desktop:** Klik dua kali pada shortcut **`Student Finance Tracker`** di Desktop Anda (`C:\Users\user\OneDrive\Desktop\Student Finance Tracker.lnk`).
- **Atau dari folder:** Klik dua kali file **`MULAI_APLIKASI.bat`** di dalam folder `c:\Users\user\Downloads\student-finance-tracker\`.

> **Apa yang terjadi saat diklik?**
> 1. Sistem otomatis mendeteksi Node.js dan alamat IP lokal Anda.
> 2. Server lokal dinyalakan otomatis.
> 3. Browser default Anda langsung terbuka ke alamat `http://localhost:3000`.
> 4. Tampil informasi alamat IP untuk diakses dari HP Android Anda.

*Tips Tambahan:* Jika Anda ingin server berjalan tenang di latar belakang tanpa jendela hitam CMD yang terbuka, cukup klik file **`BUKA_DI_LATAR_BELAKANG.vbs`**.

---

## 📱 2. Cara Buka & Pasang di HP Android

### Langkah Cepat (Via Wi-Fi / Hotspot yang Sama):
1. **Sambungkan HP dan Laptop ke jaringan yang sama**:
   - Hubungkan HP dan Laptop ke Wi-Fi kos/rumah yang sama, **ATAU**
   - Nyalakan **Hotspot Pribadi** dari HP Android Anda, lalu sambungkan Laptop ke Hotspot tersebut.
2. **Buka Aplikasi di Laptop**:
   - Klik tombol **"Buka di HP"** di bilah atas (*Navbar*) atau kartu **"Buka di HP Android"** di Dashboard.
   - Akan muncul **QR Code** dan alamat IP (contoh: `http://10.29.56.120:3000`).
3. **Buka di HP Android**:
   - Buka **Google Chrome** di HP Android Anda.
   - Scan QR Code tersebut menggunakan kamera HP, **atau** ketik alamat IP yang tertera di browser Chrome HP.
4. **Pasang Sebagai Aplikasi (PWA)**:
   - Di Chrome HP, ketuk menu **titik tiga (⋮)** di pojok kanan atas.
   - Pilih menu **"Pasang Aplikasi"** atau **"Tambahkan ke Layar Utama" (Add to Home screen)**.
   - Ketuk **Instal / Tambah**.
5. **Selesai!** Icon aplikasi FinTrack akan muncul di halaman beranda (*Homescreen*) HP Android Anda seperti aplikasi biasa!

---

## ⚡ 3. Cara Mengedit Secara Offline Maupun Online

Aplikasi ini menggunakan teknologi **LocalStorage** dan **Service Worker (PWA)**:
- **Saat Online (Ada Internet/Wi-Fi)**:
  Anda dapat membuka aplikasi, mengunduh pembaruan, dan mengekspor cadangan.
- **Saat Offline (Tidak Ada Kuota / Mode Pesawat / di Perjalanan)**:
  Aplikasi tetap dapat dibuka dari Homescreen HP!
  - Anda tetap bisa **menambah transaksi**, **membuat transfer dompet**, **mengubah pos anggaran**, dan **membayar tagihan**.
  - Semua perubahan disimpan secara persisten di penyimpanan internal HP Anda. Data tidak akan hilang meskipun HP dimatikan atau di-restart.

---

## 🔄 4. Cara Pindah Data (Sinkronisasi Laptop ⇄ HP Android)

Jika Anda ingin memindahkan data catatan keuangan yang sudah Anda buat di laptop ke HP Android:
1. **Di Laptop**: Buka menu **Pengaturan** > klik **"Unduh Cadangan JSON"** (file `fintrack_data.json` akan terunduh).
2. **Kirim File**: Kirim file `.json` tersebut ke HP Anda (bisa lewat WhatsApp, Bluetooth, atau Google Drive).
3. **Di HP Android**: Buka FinTrack > masuk ke menu **Pengaturan** > ketuk **"Pulihkan dari File JSON"** > pilih file tadi.
4. Seluruh saldo, dompet, target tabungan, dan riwayat transaksi langsung tersinkronisasi di HP Anda!

---

## 🌐 5. Opsi Tambahan: Buka Online 24 Jam dari Mana Saja (Deploy Gratis)
Jika ingin HP Android Anda bisa membuka aplikasi ini kapan saja dari luar kota tanpa perlu menyalakan laptop sama sekali:
1. Buka situs gratis [vercel.com](https://vercel.com) atau [netlify.com](https://netlify.com).
2. Upload folder `dist` (hasil `npm run build`).
3. Anda akan mendapatkan tautan web permanen (contoh: `https://fintrack-anda.vercel.app`) yang bisa dibuka dan di-install di HP Android dari jaringan mana pun di seluruh dunia!
