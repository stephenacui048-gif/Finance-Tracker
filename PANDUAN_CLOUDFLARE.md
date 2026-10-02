# Pindah Finance Tracker ke Cloudflare Pages + D1

## Isi yang disiapkan

- Frontend Vite dibangun sebagai aset statis di folder `dist`.
- API sinkronisasi berjalan sebagai Cloudflare Pages Functions pada `/api/*`.
- Data sinkronisasi disimpan di Cloudflare D1 dengan binding bernama `DB`.
- Endpoint sinkronisasi lama tetap tersedia: `/api/sync`, `/api/sync/version`, `/api/sync/verify`, `/api/system/info`.
- Endpoint SSE dimatikan; aplikasi memakai polling versi yang sudah ada sebagai fallback.

## Buat database D1 dan tabelnya

Dari folder repo, jalankan:

```sh
npx wrangler login
npx wrangler d1 create student-finance-tracker
npx wrangler d1 execute student-finance-tracker --remote --file=./migrations/0001_create_finance_state.sql
```

Atau buat database lewat Dashboard lalu jalankan isi berkas migrasi pada SQL console D1.

## Buat project Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Pilih repo Finance-Tracker dan branch `main` setelah PR migrasi digabung.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Root directory: `/`.

Cloudflare Pages mendeteksi folder `functions/` di root repo untuk API.

## Pasang binding D1

1. Buka project Pages → **Settings** → **Bindings** → **Add** → **D1 database**.
2. Isi **Variable name** tepat `DB`.
3. Pilih database `student-finance-tracker`.
4. Simpan lalu lakukan redeploy agar binding aktif.

Buka `https://NAMA-PROJECT.pages.dev/api/system/info`; respons yang diharapkan memuat `"status":"cloud_ready"`. Endpoint sync akan mengembalikan pesan setup sampai migrasi tabel dan binding aktif.

## Pindahkan data sebelum ganti domain

1. Di aplikasi Render yang lama, buka **Pengaturan** lalu ekspor data JSON. Simpan salinannya.
2. Deploy Pages dulu dengan URL sementara `pages.dev`, lalu pastikan binding D1 sudah aktif.
3. Buka aplikasi Cloudflare dan impor file JSON ke dalamnya. Pastikan pengaturan URL server sinkronisasi kosong atau memakai URL Pages yang baru agar aplikasi tidak terus menulis ke Render.
4. Periksa akun wallet, transaksi, dan saldo; ekspor ulang salinan cadangan.
5. Setelah data benar, arahkan domain milik Anda ke Pages. Domain `onrender.com` yang disediakan Render tidak dapat dipindahkan; gunakan domain sendiri atau alamat `pages.dev`.

Jangan menghapus layanan Render sampai data terverifikasi di Cloudflare. Import ke D1 dilakukan melalui endpoint sinkronisasi aplikasi setelah JSON dimuat, bukan dengan menyalin file dari filesystem Render.

## Catatan kapasitas

D1 membatasi ukuran satu nilai/row hingga 2 MB. State aplikasi saat ini disimpan sebagai satu dokumen JSON; lampiran struk berukuran besar dapat melewati batas ini. Jika ekspor mendekati 2 MB atau sinkronisasi ditolak, lampiran perlu dipindahkan ke R2 dan struktur state dipecah sebelum cutover. Lihat batas terbaru D1: https://developers.cloudflare.com/d1/platform/limits/
