# Local Development Setup for Webflow

## Quick Start

### 1. Add the loader script to Webflow

In **Webflow Designer → Project Settings → Custom Code → Before `</body>` tag**:

```html
<script defer src="https://nechemyaspitz.github.io/versatile-site/loader.js"></script>
```

That's it! The loader automatically:
- ✅ **Tries local server first** (`http://localhost:8000/main.js`) when you're developing
- ✅ **Falls back to production** (GitHub Pages) when local isn't available
- ✅ **No manual switching needed!**

### 2. Development Workflow

When developing locally:

```bash
# Terminal 1: Auto-rebuild on changes
npm run dev

# Terminal 2: Serve the file with CORS enabled
python3 dev-server.py
```

Now:
1. View your Webflow site (preview or published)
2. It loads from `localhost:8000` (you'll see `🔧 Loading LOCAL version` in console)
3. Make changes → Save → Refresh browser → See changes instantly!

### 3. Testing on Other Devices

**No extra steps needed!**

- View Webflow site on phone/tablet → Automatically loads production version
- View on your dev computer without local server running → Loads production version
- Share preview link with others → They get production version

**Only your dev machine with local server running gets the local version!**

## How It Works

The `loader.js` script:
1. Tries to load `http://localhost:8000/main.js`
2. If found → Uses local version (for development)
3. If not found → Uses GitHub Pages version (production)

Console will show:
- `🔧 Loading LOCAL version` = Development mode
- `🌐 Loading PRODUCTION version` = Production mode

## Deployment Workflow

### When Ready to Deploy

```bash
# 1. Stop the dev watcher (Ctrl+C in both terminals)

# 2. Build production version
npm run build:prod

# 3. Commit and deploy
git add -A
git commit -m "Your update message"
git push origin master
git checkout gh-pages
git merge master -m "Auto-deploy"
git push origin gh-pages
git checkout master
```

**That's it!** No need to change anything in Webflow - the loader stays the same.

### Testing the Deployment

1. View your Webflow site (without local server running)
2. Console should show: `🌐 Loading PRODUCTION version`
3. Test on other devices - they automatically get the new version

## Complete Workflow Example

```bash
# === Development Session ===
npm run dev                      # Terminal 1: Auto-rebuild
python3 dev-server.py            # Terminal 2: Serve file with CORS

# Make changes → Save → Refresh browser → Repeat
# Console shows: 🔧 Loading LOCAL version

# === Ready to Deploy ===
Ctrl+C                           # Stop both terminals
npm run build:prod               # Build production
git add -A && git commit -m "..." && git push
# ... deploy to gh-pages ...

# === Test on Other Devices ===
# Just view the site, loader handles everything!
# Console shows: 🌐 Loading PRODUCTION version
```

## Benefits

✅ **Set once, forget it** - loader stays in Webflow permanently  
✅ **Automatic dev/prod switching** - no manual changes  
✅ **Test on any device instantly** - production always available  
✅ **Rapid local development** - just refresh browser  

## Troubleshooting

**Issue**: CORS error when trying to load local version  
**Fix**: Make sure you're using `python3 dev-server.py` (not `python3 -m http.server`). The dev-server.py includes CORS headers needed for cross-origin requests.

**Issue**: Still loading production version on dev machine  
**Fix**: Make sure both `npm run dev` and `python3 dev-server.py` are running. Check console for which version is loading.

**Issue**: Changes not showing up  
**Fix**: Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Issue**: Other devices showing old version  
**Fix**: Wait ~1 minute for GitHub Pages to update, then hard refresh

**Issue**: Build errors  
**Fix**: Check the terminal where `npm run dev` is running for error messages

**Issue**: "ERR_FAILED 200 (OK)" in console  
**Fix**: This is a CORS error. Use `python3 dev-server.py` instead of the regular Python HTTP server.

