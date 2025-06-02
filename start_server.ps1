# Start Stream Info Manager
Set-Location "d:\Projects\obs-StreamInfoSaver"

Write-Host "Starting Stream Info Manager..." -ForegroundColor Green
Write-Host ""
Write-Host "The application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    python app.py
}
catch {
    Write-Host "Error starting the application: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
