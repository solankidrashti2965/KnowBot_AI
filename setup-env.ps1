# KnowBase AI - Environment Setup Helper (PowerShell)
#
# Run this ONCE to create your .env file interactively.
# Usage: .\setup-env.ps1

Write-Host ""
Write-Host "KnowBase AI - Environment Setup" -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

$envPath = "$PSScriptRoot\backend\.env"

if (Test-Path $envPath) {
    Write-Host "WARNING: .env already exists at:" -ForegroundColor Yellow
    Write-Host "   $envPath" -ForegroundColor Gray
    $overwrite = Read-Host "   Overwrite? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-Host "SUCCESS: Keeping existing .env. Run .\start.ps1 to launch." -ForegroundColor Green
        exit 0
    }
}

Write-Host "You need ONE free credential:" -ForegroundColor White
Write-Host ""
Write-Host "  1. GROQ_API_KEY" -ForegroundColor Yellow
Write-Host "     -> Go to https://console.groq.com/keys" -ForegroundColor DarkGray
Write-Host "     -> Click 'Create API Key' (completely FREE with Groq)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "---------------------------------------------------" -ForegroundColor DarkGray

$groqKey = Read-Host "Paste your Groq API Key"

# Generate a random JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

$envContent = @"
# Database (Bypassed! Running safely in-memory now)
MONGODB_URI=mongodb://localhost:27017
DB_NAME=ai_knowledge_assistant

# JWT Auth
# Auto-generated secure random secret
JWT_SECRET=$jwtSecret

# LLM API
GROQ_API_KEY=$groqKey

# App Config
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
"@

$envContent | Out-File -FilePath $envPath -Encoding utf8 -Force

Write-Host ""
Write-Host "SUCCESS: .env created successfully!" -ForegroundColor Green
Write-Host "   Location: $envPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Now run: .\start.ps1" -ForegroundColor Cyan
Write-Host ""
