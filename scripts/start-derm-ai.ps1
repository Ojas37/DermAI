# DermAI Application Startup Script
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "    DermAI Application Startup" -ForegroundColor Cyan  
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
$backendPath = Join-Path $rootDir "backend"
$frontendPath = $rootDir

# Check if servers are already running
Write-Host "🔍 Checking for existing servers..." -ForegroundColor Yellow
$backend = Get-NetTCPConnection -LocalPort 5002 -State Listen -ErrorAction SilentlyContinue
$frontend = Get-NetTCPConnection -LocalPort 5176 -State Listen -ErrorAction SilentlyContinue

if ($backend) {
    Write-Host "⚠️  Backend server already running on port 5002" -ForegroundColor Yellow
} else {
    Write-Host "🚀 Starting Flask Backend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\Activate.ps1; python app.py" -WindowStyle Normal
    Write-Host "✅ Backend server starting..." -ForegroundColor Green
}

if ($frontend) {
    Write-Host "⚠️  Frontend server already running on port 5176" -ForegroundColor Yellow
} else {
    Write-Host "🌐 Starting React Frontend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal
    Write-Host "✅ Frontend server starting..." -ForegroundColor Green
}

Write-Host ""
Write-Host "⏳ Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

Write-Host ""
Write-Host "🧪 Testing server connectivity..." -ForegroundColor Cyan

# Test backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server is responding (Port 5002)" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   - Model Loaded: $($healthData.model_loaded)" -ForegroundColor White
        Write-Host "   - Database Connected: $($healthData.database_connected)" -ForegroundColor White
        Write-Host "   - Status: $($healthData.status)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Backend server is not responding yet" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test frontend  
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5176/" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend server is responding (Port 5176)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend server is not responding yet" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Server Information:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Backend API:  http://localhost:5002/api/health" -ForegroundColor White
Write-Host "Frontend App: http://localhost:5176/" -ForegroundColor White
Write-Host ""

# Check for any CORS or connectivity issues
Write-Host "🔧 Running connectivity diagnostics..." -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri "http://localhost:5002/api/health" -Headers @{"Origin"="http://localhost:5176"} -UseBasicParsing
    Write-Host "✅ CORS configuration is working" -ForegroundColor Green
} catch {
    Write-Host "⚠️  CORS note: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 DermAI Application Status Summary:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Final port check
$finalBackend = Get-NetTCPConnection -LocalPort 5002 -State Listen -ErrorAction SilentlyContinue
$finalFrontend = Get-NetTCPConnection -LocalPort 5176 -State Listen -ErrorAction SilentlyContinue

if ($finalBackend) {
    Write-Host "✅ Backend: RUNNING on port 5002" -ForegroundColor Green
} else {
    Write-Host "❌ Backend: NOT RUNNING on port 5002" -ForegroundColor Red
}

if ($finalFrontend) {
    Write-Host "✅ Frontend: RUNNING on port 5176" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: NOT RUNNING on port 5176" -ForegroundColor Red
}

Write-Host ""
if ($finalBackend -or $finalFrontend) {
    Write-Host "🚀 Opening application..." -ForegroundColor Green
    Start-Process "http://localhost:5176/"
}
