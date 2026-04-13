# PowerShell script to create PostgreSQL database

$env:PGPASSWORD = "admin123"
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "🚀 Creating Fordham SwipeShare Database..." -ForegroundColor Cyan
Write-Host ""

# Create database
Write-Host "Creating database 'fordham_swipeshare'..." -ForegroundColor Yellow
& $psqlPath -U postgres -c "CREATE DATABASE fordham_swipeshare;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database might already exist. Checking..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verifying database..." -ForegroundColor Yellow
& $psqlPath -U postgres -c "\l" | Select-String "fordham_swipeshare"

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Connection details:" -ForegroundColor Cyan
Write-Host "  Database: fordham_swipeshare" -ForegroundColor White
Write-Host "  User: postgres" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host ""
Write-Host "CONNECTION STRING:" -ForegroundColor Cyan
Write-Host "  postgresql://postgres:admin123@localhost:5432/fordham_swipeshare" -ForegroundColor White
