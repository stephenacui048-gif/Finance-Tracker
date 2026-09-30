$desktop = [Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell
$target = Join-Path $desktop "Student Finance Tracker.lnk"
$shortcut = $wsh.CreateShortcut($target)
$shortcut.TargetPath = "c:\Users\user\Downloads\student-finance-tracker\MULAI_APLIKASI.bat"
$shortcut.WorkingDirectory = "c:\Users\user\Downloads\student-finance-tracker"
$shortcut.Description = "FinTrack - Student Finance Tracker (Aplikasi Keuangan Mahasiswa)"
$shortcut.Save()
Write-Host "Shortcut sukses dibuat di: $target"
