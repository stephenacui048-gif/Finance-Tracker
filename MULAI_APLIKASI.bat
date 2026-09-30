@echo off
title FinTrack - Student Finance Tracker
color 0A
chcp 65001 >nul
cd /d "%~dp0"

echo =============================================================
echo    FinTrack - Student Finance Tracker (Aplikasi Mahasiswa)
echo =============================================================
echo.
echo [1/3] Menyiapkan lingkungan Node.js...
set "PATH=C:\Users\user\.nodejs\node-v22.14.0-win-x64;%PATH%"

:: Cek ketersediaan Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] PERINGATAN: Node.js tidak ditemukan di C:\Users\user\.nodejs\node-v22.14.0-win-x64
    echo     Mencoba menggunakan Node.js sistem...
)

echo [2/3] Mendeteksi alamat IP lokal untuk koneksi HP Android...
set "LOCAL_IP=localhost"
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*' } | Select-Object -First 1).IPAddress" 2^>nul`) do (
    set "LOCAL_IP=%%i"
)

echo.
echo =============================================================
echo   APLIKASI FINTRACK BERHASIL DIMULAI!
echo =============================================================
echo.
echo   ► Buka di Laptop / PC  : http://localhost:3000
echo   ► Buka di HP Android   : http://%LOCAL_IP%:3000
echo.
echo   -----------------------------------------------------------
echo   CARA MEMBUKA & MEMASANG DI HP ANDROID:
echo   1. Pastikan HP dan Laptop terhubung ke Wi-Fi / Hotspot yang sama.
echo   2. Buka Google Chrome di HP Android Anda.
echo   3. Ketik alamat: http://%LOCAL_IP%:3000
echo   4. Di Chrome, ketuk titik tiga (⋮) di kanan atas
echo      lalu pilih "Pasang Aplikasi" atau "Tambahkan ke Layar Utama".
echo   5. Aplikasi akan muncul di Homescreen HP Anda!
echo   6. Tetap dapat dipakai dan diedit saat OFFLINE maupun ONLINE.
echo   -----------------------------------------------------------
echo   ► INGIN BUKA DARI MANA SAJA (LEWAT HTTPS / CLOUD)?
echo     Jalankan: BUKA_ONLINE_HTTPS.bat (atau baca PANDUAN_CLOUD_HTTPS.md)
echo   -----------------------------------------------------------
echo.
echo [3/3] Membuka browser otomatis...
start http://localhost:3000

echo.
echo Server sedang berjalan... (Jangan tutup jendela ini selama menggunakan aplikasi)
echo Tekan Ctrl + C jika ingin menghentikan server.
echo.
call npm.cmd run dev

pause
