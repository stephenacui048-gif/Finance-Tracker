@echo off
title FinTrack - Buka Online HTTPS (Akses Dari Mana Saja)
color 0B
chcp 65001 >nul
cd /d "%~dp0"

echo =====================================================================
echo    FinTrack - Akses Online Cloud & HTTPS Dari Mana Saja (HP & Laptop)
echo =====================================================================
echo.
echo   Aplikasi ini dapat diakses dari mana saja tanpa harus 1 WiFi / 1 IP:
echo   - Di jalan menggunakan Kuota Internet Seluler (4G / 5G)
echo   - Di kampus, cafe, atau kos yang berbeda jaringan
echo   - Terenkripsi aman dengan protokol HTTPS resmi (SSL)
echo   - Tersinkronisasi otomatis secara realtime antar perangkat
echo.
echo =====================================================================
echo   PILIH METODE AKSES:
echo =====================================================================
echo   [1] Jalankan Server + Buat Link HTTPS Publik Instan (Langsung Buka di HP)
echo   [2] Jalankan Production Cloud Server (node server.js)
echo   [3] Buka Panduan Deploy Gratis 24 Jam ke Render.com / Railway
echo   [4] Keluar
echo =====================================================================
echo.
set /p "PILIHAN=Ketik pilihan Anda (1/2/3/4) lalu tekan ENTER: "

if "%PILIHAN%"=="1" goto OPSI_TUNNEL
if "%PILIHAN%"=="2" goto OPSI_SERVER
if "%PILIHAN%"=="3" goto OPSI_PANDUAN
if "%PILIHAN%"=="4" exit /b

:OPSI_TUNNEL
cls
echo =====================================================================
echo  [1/2] Menjalankan Server FinTrack di Latar Belakang...
echo =====================================================================
set "PATH=C:\Users\user\.nodejs\node-v22.14.0-win-x64;%PATH%"

:: Build frontend jika dist belum ada
if not exist "dist" (
    echo Membangun frontend (npm run build)...
    call npm.cmd run build
)

:: Jalankan server lokal di background
start /b cmd.exe /c "node server.js" >nul 2>&1
timeout /t 2 >nul

echo Server lokal aktif di http://localhost:3000
echo.
echo =====================================================================
echo  [2/2] Menghubungkan ke Cloud Tunnel HTTPS Publik...
echo =====================================================================
echo.
echo   Link HTTPS publik sedang dibuat...
echo   Setelah muncul tautan HTTPS (contoh: https://xxxx.a.pinggy.link):
echo   ► Salin atau ketik link HTTPS tersebut di Browser HP Anda!
echo   ► Anda juga bisa memindai (scan) QR Code yang muncul di layar dengan HP.
echo.
echo   (Biarkan jendela ini tetap terbuka agar koneksi dari HP tetap aktif)
echo =====================================================================
echo.
ssh -o StrictHostKeyChecking=no -p 443 -R0:localhost:3000 a.pinggy.io
pause
exit /b

:OPSI_SERVER
cls
echo =====================================================================
echo   Menjalankan FinTrack Production Cloud Server...
echo =====================================================================
set "PATH=C:\Users\user\.nodejs\node-v22.14.0-win-x64;%PATH%"
if not exist "dist" (
    echo Membangun bundle produksi (npm run build)...
    call npm.cmd run build
)
echo.
echo Server siap di http://localhost:3000
echo Tekan Ctrl + C untuk menghentikan.
echo.
node server.js
pause
exit /b

:OPSI_PANDUAN
cls
start notepad "PANDUAN_CLOUD_HTTPS.md"
exit /b
