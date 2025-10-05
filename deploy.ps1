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
    
    # Auto-deploy to GitHub Pages for instant updates
    Write-Host "Updating GitHub Pages..." -ForegroundColor Cyan
    git checkout gh-pages
    git checkout master -- main.js
    git add main.js
    git commit -m "Auto-deploy: $message" --allow-empty
    git push origin gh-pages
    git checkout master
    
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
        Write-Host ""
        Write-Host "Deployed successfully to GitHub Pages!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Use this URL in Webflow (NEVER needs to change!):" -ForegroundColor Yellow
        Write-Host "<script defer src=`"https://nechemyaspitz.github.io/versatile-site/main.js`"></script>" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Every time you run deploy.ps1, changes go live in ~30 seconds!" -ForegroundColor Green
    }
    Write-Host ""
    
} else {
    Write-Host "Build failed! Fix errors and try again." -ForegroundColor Red
}
