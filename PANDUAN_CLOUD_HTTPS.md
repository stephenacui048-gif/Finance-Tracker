# 🌐 Panduan Membuka FinTrack Secara Online & Cloud HTTPS (HP & Laptop dari Mana Saja)

Aplikasi **FinTrack (Student Finance Tracker)** kini mendukung akses **Cloud & HTTPS penuh**. Anda tidak perlu lagi berada di jaringan Wi-Fi / IP lokal yang sama! Anda bisa membuka dan mengupdate keuangan Anda dari:
- 📱 **HP Android / iPhone** menggunakan paket data seluler (4G / 5G) di jalan, di kampus, atau di kos.
- 💻 **Laptop / Komputer** dari jaringan mana pun di seluruh dunia.
- 🔄 **Real-Time Cloud Sync**: Ketika Anda memasukkan pengeluaran di HP, data di laptop langsung terupdate otomatis secara instan.

---

## ⚡ OPSI 1: Akses HTTPS Publik Instan (Langsung Aktif dari Laptop)

Jika Anda ingin langsung menggunakan link HTTPS aman di HP sekarang juga tanpa perlu mendaftar hosting:

1. **Jalankan File**:
   - Klik ganda pada file **`BUKA_ONLINE_HTTPS.bat`** di folder aplikasi.
2. **Pilih Menu [1]**:
   - Ketik `1` lalu tekan `ENTER`.
3. **Pindai QR Code atau Buka Link HTTPS**:
   - Jendela terminal akan menampilkan link HTTPS resmi (contoh: `https://xxxx.a.pinggy.link`) serta **QR Code**.
   - Arahkan kamera HP Anda ke QR Code tersebut atau ketikkan alamat HTTPS di Chrome/Safari HP.
4. **Pasang di HP (PWA App)**:
   - Di browser Chrome HP, ketuk menu titik tiga (⋮) di kanan atas.
   - Pilih **"Pasang Aplikasi"** atau **"Tambahkan ke Layar Utama"**.
   - FinTrack akan terpasang sebagai aplikasi mandiri di HP Anda dengan enkripsi SSL/HTTPS penuh!

> 💡 *Catatan Opsi 1: Laptop Anda berfungsi sebagai server, sehingga laptop perlu dalam keadaan menyala saat Anda membuka link ini dari HP.*

---

## ☁️ OPSI 2: Deploy di Cloud (Tanpa Perlu Laptop Menyala)

Render dapat menjalankan aplikasi tanpa laptop Anda menyala. Namun, filesystem layanan Render bersifat sementara secara default. Database aplikasi berupa file `finance_db.json`, sehingga layanan Free cocok untuk pratinjau tetapi tidak menjamin data cloud bertahan setelah restart atau deploy. Untuk penyimpanan server yang bertahan, gunakan database terkelola atau layanan berbayar dengan persistent disk.

Kami telah menyiapkan file konfigurasi siap pakai:
- `server.js` (Server backend Express + Realtime SSE Stream)
- `render.yaml` (Konfigurasi otomatis Render)
- `Dockerfile` (Container standar industri)
- `dist/` (Bundle frontend yang sudah teroptimasi)

### Deploy ke Render.com

1. **Unggah Folder Proyek ini ke GitHub**:
   - Buat akun gratis di [GitHub.com](https://github.com) jika belum punya.
   - Buat repositori baru bernama `student-finance-tracker` (bisa disetel *Private* atau *Public*).
   - Unggah semua file proyek ini ke repositori tersebut.

2. **Buka Render.com**:
   - Kunjungi [https://render.com](https://render.com) dan masuk menggunakan akun GitHub Anda.
   - Klik tombol **"New +"** di pojok kanan atas, lalu pilih **"Web Service"**.

3. **Pilih Repositori GitHub Anda**:
   - Pilih repositori `student-finance-tracker` yang baru saja Anda buat.

4. **Konfigurasi Otomatis**:
   - **Name**: Isi nama yang Anda inginkan (misalnya: `fintrack-mahasiswa` atau `keuangan-andi`).
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - Pilih paket sesuai kebutuhan. Paket Free dapat dipakai untuk pratinjau, tetapi tidak menyediakan persistent disk.
   - Klik tombol **"Create Web Service"**.

5. **Aktifkan penyimpanan persisten untuk data cloud**:
   - Pada halaman layanan Render, tambahkan persistent disk dan gunakan mount path `/var/data`.
   - Tambahkan environment variable `DATA_DIR=/var/data`.
   - Persistent disk tersedia untuk layanan berbayar; penambahannya dapat menimbulkan biaya.

6. **Selesai! Link Cloud HTTPS Anda Siap**:
   - Dalam 2-3 menit, Render akan memberikan Anda tautan permanen HTTPS resmi seperti:
     ```
     https://fintrack-mahasiswa.onrender.com
     ```
   - Tautan ini dapat Anda simpan, bookmark, dan bagikan ke HP Anda.
   - Buka tautan tersebut di HP maupun Laptop kapan saja. Keduanya akan tersinkronisasi secara real-time melalui cloud!

---

## 🛡️ Penyimpanan & Integritas Data

- **Penyimpanan lokal**: Data disimpan di browser (`localStorage`) pada perangkat yang digunakan.
- **Penyimpanan cloud**: Data server disimpan dalam `finance_db.json`. File ini bertahan melewati restart hanya jika `DATA_DIR` diarahkan ke persistent disk atau storage persisten lain.
- **Offline-First Resilience**: Jika internet Anda tiba-tiba terputus di HP saat mencatat pengeluaran, FinTrack akan menyimpannya ke antrean lokal (*Outbox*) dan otomatis mengirimkannya begitu koneksi internet terhubung kembali.
- **Non-Destructive Union Merge**: Sistem FinTrack dirancang agar tidak pernah menghapus data lama secara tidak sengaja saat dua perangkat melakukan update bersamaan.
