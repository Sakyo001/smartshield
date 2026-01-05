# SmartShield Server Restart Script
Write-Host "🔄 Restarting SmartShield Servers..." -ForegroundColor Cyan

# Stop Python API
Write-Host "`n1. Stopping Python WHOIS API..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*whois_dns_api*" 
} | Stop-Process -Force
Start-Sleep -Seconds 2

# Stop Next.js dev server
Write-Host "2. Stopping Next.js web server..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*next*" 
} | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "`n✓ Servers stopped" -ForegroundColor Green
Write-Host "`nStarting servers..." -ForegroundColor Cyan

# Start Python API in new terminal
Write-Host "3. Starting Python WHOIS API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Users\RANCC Design\Desktop\smartshield\packages\ml'; python whois_dns_api.py"
Start-Sleep -Seconds 3

# Start Next.js in new terminal
Write-Host "4. Starting Next.js web server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Users\RANCC Design\Desktop\smartshield'; pnpm dev --filter=web"

Write-Host "`n✓ Servers starting in new terminals!" -ForegroundColor Green
Write-Host "`nWait 10-15 seconds for servers to fully start, then:" -ForegroundColor Cyan
Write-Host "  → Python API: http://localhost:5001" -ForegroundColor White
Write-Host "  → Web App: http://localhost:3000" -ForegroundColor White
Write-Host "`nPress any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
