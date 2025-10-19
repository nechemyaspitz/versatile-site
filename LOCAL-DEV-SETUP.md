# Local Development Setup

## Quick Start

### 1. Replace the script tag in your HTML

**Old:**
```html
<script defer src="https://nechemyaspitz.github.io/versatile-site/main.js"></script>
```

**New:**
```html
<script defer src="https://nechemyaspitz.github.io/versatile-site/loader.js"></script>
```

### 2. Start the watch mode

In your terminal:
```bash
npm run dev
```

This will automatically rebuild `main.js` whenever you make changes to any file in `src/`.

### 3. Serve your site locally

You need a local web server to test the site. Choose one:

**Option A: Using Python (built-in)**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Using Node.js `http-server`**
```bash
# Install globally (one time)
npm install -g http-server

# Run server
http-server -p 8000
```

**Option C: Using VS Code Live Server**
- Install the "Live Server" extension
- Right-click on your HTML file and select "Open with Live Server"

### 4. Open your site

Navigate to `http://localhost:8000` (or whatever port you're using)

## How It Works

The `loader.js` script:
1. **Tries to load `/main.js` from your local server** (your development build)
2. **If that fails, loads from GitHub Pages** (production build)

When working locally:
- You see: `🔧 Loading LOCAL version of main.js`
- Changes rebuild automatically via `npm run dev`
- Refresh the page to see changes

When viewing the live site:
- Users see: `🌐 Loading PRODUCTION version from GitHub Pages`
- No changes needed to deploy

## Deployment Workflow

### During Development
```bash
# Terminal 1: Watch and rebuild
npm run dev

# Terminal 2: Serve locally
python3 -m http.server 8000

# Make changes → Files rebuild automatically → Refresh browser
```

### When Ready to Deploy
```bash
# Stop the dev watcher (Ctrl+C)

# Build production version
npm run build:prod

# Commit and deploy
git add -A
git commit -m "Your commit message"
git push origin master
git checkout gh-pages
git merge master -m "Auto-deploy"
git push origin gh-pages
git checkout master
```

Or use the existing deploy script patterns!

## Benefits

✅ **No more deploying for every tiny change**  
✅ **Automatic rebuilds** - just refresh the browser  
✅ **Seamless fallback** - live site still works without changes  
✅ **Same codebase** - no environment-specific code needed  

## Troubleshooting

**Issue**: Still loading from GitHub Pages  
**Fix**: Make sure you're running a local server (not opening HTML directly via `file://`)

**Issue**: Changes not showing up  
**Fix**: Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Issue**: Build errors  
**Fix**: Check the terminal where `npm run dev` is running for error messages

