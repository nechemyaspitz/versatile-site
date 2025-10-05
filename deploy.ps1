# Quick Deploy Script with Optional Versioning
# Usage: 
#   .\deploy.ps1 "Your commit message"
#   .\deploy.ps1 "Your message" -Version "v1.0.2"  (creates git tag)

param(
    [string]$message = "Update site",
    [string]$Version = ""
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
    
    # If version tag provided, create and push tag
    if ($Version) {
        Write-Host "Creating version tag: $Version" -ForegroundColor Cyan
        git tag $Version
        git push origin $Version
        
        Write-Host ""
        Write-Host "Deployed successfully with version tag!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Update your Webflow script to:" -ForegroundColor Yellow
        Write-Host "<script defer src=`"https://cdn.jsdelivr.net/gh/nechemyaspitz/versatile-site@$Version/main.js`"></script>" -ForegroundColor Blue
    } else {
        # Get current commit hash for cache-free URL
        $commitHash = (git log -1 --format="%h").Trim()
        
        Write-Host ""
        Write-Host "Deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "INSTANT UPDATE (use commit hash - no cache!):" -ForegroundColor Green
        Write-Host "<script defer src=`"https://cdn.jsdelivr.net/gh/nechemyaspitz/versatile-site@$commitHash/main.js`"></script>" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "PRODUCTION (use @master, but cache may delay):" -ForegroundColor Yellow  
        Write-Host "<script defer src=`"https://cdn.jsdelivr.net/gh/nechemyaspitz/versatile-site@master/main.js`"></script>" -ForegroundColor Blue
    }
    Write-Host ""
    
} else {
    Write-Host "Build failed! Fix errors and try again." -ForegroundColor Red
}
