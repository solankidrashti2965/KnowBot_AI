# KnowBase AI - Start Script (Windows PowerShell)

Write-Host ""
Write-Host "Starting KnowBase AI Platform..." -ForegroundColor Cyan
Write-Host ""

$backendDir  = "c:\knowbase\ai-knowledge-assistant\backend"
$frontendDir = "c:\knowbase\ai-knowledge-assistant\frontend"
$envFile     = Join-Path $backendDir ".env"

# Check .env
if (-not (Test-Path $envFile)) {
    Write-Host "WARNING: Missing backend\.env file!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Run the setup wizard first:" -ForegroundColor Yellow
    Write-Host "   .\setup-env.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Or create it manually at: $envFile" -ForegroundColor Gray
    Write-Host "   Required keys: MONGODB_URI, GEMINI_API_KEY, JWT_SECRET" -ForegroundColor Gray
    Write-Host ""
    Read-Host "   Press Enter to exit"
    exit 1
}

# Start Backend
Write-Host "Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendDir'; .\venv\Scripts\uvicorn main:app --reload --port 8000"
)

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting React frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendDir'; npm run dev"
)

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "Both servers started!" -ForegroundColor Green
Write-Host "   Frontend  --> http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend   --> http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API Docs  --> http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process 'http://localhost:5173'
