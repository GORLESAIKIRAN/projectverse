# GSK MEDIAVERSE PowerShell Launcher
Write-Host "=========================================================================" -ForegroundColor Magenta
Write-Host "             GSK MEDIAVERSE - ALL-IN-ONE MEDIA STUDIO" -ForegroundColor Cyan
Write-Host "          'Everything Media. One Powerful Studio.'" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "[*] Status: Ready" -ForegroundColor Green
Write-Host "[*] Web Portal: http://localhost:3000" -ForegroundColor White
Write-Host ""

$env:ELECTRON_RUN_AS_NODE = "1"
$env:PORT = "3000"

Start-Process "http://localhost:3000"
& "C:\Users\saiki\AppData\Local\Programs\antigravity\Antigravity.exe" "$PSScriptRoot\server.js"
