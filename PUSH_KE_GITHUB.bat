@echo off
title FinTrack - Push Pembaruan ke GitHub
color 0A
chcp 65001 >nul
cd /d "%~dp0"

echo =====================================================================
echo    FinTrack - Sinkronisasi Proyek Lengkap ke GitHub
echo =====================================================================
echo.
echo Repositori Target: https://github.com/stephenacul048-git/Finance-Tracker
echo.

:: Inisialisasi git jika belum ada
if not exist ".git" (
    echo [1/4] Menginisialisasi Git lokal...
    git init
    git branch -M main
    git remote add origin https://github.com/stephenacul048-git/Finance-Tracker.git
) else (
    echo [1/4] Git lokal sudah terhubung.
)

echo.
echo [2/4] Menambahkan semua file proyek (termasuk src dan dist)...
git add -A

echo.
echo [3/4] Membuat commit pembaruan...
git commit -m "Update FinTrack: include pre-built dist and fixed config"

echo.
echo [4/4] Mengunggah (Push) ke GitHub branch main...
git push -u origin main --force

echo.
echo =====================================================================
echo Jika berhasil terunggah (Push), silakan buka kembali dashboard Render:
echo Klik tombol "Manual Deploy" -> "Clear build cache & deploy".
echo =====================================================================
echo.
pause
