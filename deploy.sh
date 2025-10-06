#!/bin/bash
# Quick Deploy Script with Optional Versioning
# Usage: 
#   ./deploy.sh "Your commit message"
#   ./deploy.sh "Your message" v1.0.2  (creates git tag)

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get commit message (default if not provided)
MESSAGE="${1:-Update site}"
VERSION="${2:-}"

echo -e "${CYAN}Building production bundle...${NC}"
npm run build:prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful!${NC}"
    
    echo -e "${CYAN}Committing changes...${NC}"
    git add .
    git commit -m "$MESSAGE"
    
    echo -e "${CYAN}Pushing to GitHub...${NC}"
    git push
    
    # Auto-deploy to GitHub Pages for instant updates
    echo -e "${CYAN}Updating GitHub Pages...${NC}"
    git checkout gh-pages
    git checkout master -- main.js
    git add main.js
    git commit -m "Auto-deploy: $MESSAGE" --allow-empty
    git push origin gh-pages
    git checkout master
    
    # If version tag provided, create and push tag
    if [ -n "$VERSION" ]; then
        echo -e "${CYAN}Creating version tag: $VERSION${NC}"
        git tag "$VERSION"
        git push origin "$VERSION"
        
        echo ""
        echo -e "${GREEN}Deployed successfully with version tag!${NC}"
        echo ""
        echo -e "${YELLOW}Update your Webflow script to:${NC}"
        echo -e "${BLUE}<script defer src=\"https://cdn.jsdelivr.net/gh/nechemyaspitz/versatile-site@$VERSION/main.js\"></script>${NC}"
    else
        echo ""
        echo -e "${GREEN}Deployed successfully to GitHub Pages!${NC}"
        echo ""
        echo -e "${YELLOW}Use this URL in Webflow (NEVER needs to change!):${NC}"
        echo -e "${CYAN}<script defer src=\"https://nechemyaspitz.github.io/versatile-site/main.js\"></script>${NC}"
        echo ""
        echo -e "${GREEN}Every time you run deploy.sh, changes go live in ~30 seconds!${NC}"
    fi
    echo ""
    
else
    echo -e "${RED}Build failed! Fix errors and try again.${NC}"
    exit 1
fi

