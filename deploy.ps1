# Quick Deploy Script
# Usage: .\deploy.ps1 "Your commit message"

param(
    [string]$message = "Update site"
)

Write-Host "Building production bundle..." -ForegroundColor Cyan
npm run build:prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git add .
    git commit -m $message
    
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push
    
    Write-Host "" 
    Write-Host "Deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Purge CDN cache (opens in browser):" -ForegroundColor Yellow
    Write-Host "https://purge.jsdelivr.net/gh/nechemyaspitz/versatile-site@master/main.js" -ForegroundColor Blue
    Write-Host ""
    
    # Optionally auto-open purge URL
    # Start-Process "https://purge.jsdelivr.net/gh/nechemyaspitz/versatile-site@master/main.js"
} else {
    Write-Host "Build failed! Fix errors and try again." -ForegroundColor Red
}
