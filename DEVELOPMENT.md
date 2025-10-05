# Development Workflow

## 🚀 Quick Development Setup

### Using GitHub + jsDelivr CDN (Recommended for Development)

This setup lets you push changes to GitHub and see them live on your site immediately (with ~5 minute CDN cache).

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it something like `versatile-site` or `barba-spa`
3. Make it **public** (required for CDN access)
4. Don't initialize with README (we already have files)

### Step 2: Push Your Code

In your project directory, run:

```bash
# Initialize git (if not already done)
git init

# Configure git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Use jsDelivr CDN in Webflow

In Webflow **Site Settings** → **Custom Code** → **Footer Code**:

```html
<!-- Barba Core -->
<script src="https://unpkg.com/@barba/core"></script>

<!-- Barba Prefetch (optional, for better performance) -->
<script src="https://unpkg.com/@barba/prefetch"></script>

<!-- Your code from GitHub via jsDelivr -->
<script defer src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO-NAME@main/main.js"></script>
```

**Replace:**
- `YOUR-USERNAME` with your GitHub username
- `YOUR-REPO-NAME` with your repository name

### Step 4: Development Workflow

Now your workflow is simple:

1. **Make changes** to your code in `src/` files
2. **Build**: `npm run build:prod`
3. **Commit & push**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. **Wait ~5 minutes** for jsDelivr CDN cache to update
5. **Refresh your Webflow site** - changes are live!

### Fast Development with Auto-Build

Use watch mode while developing:

```bash
npm run dev
```

This automatically rebuilds `main.js` whenever you save changes to `src/` files.

Then just commit and push when ready.

## 🔄 Instant Cache Purge (Optional)

If you don't want to wait 5 minutes for CDN cache, you can purge it manually:

### Method 1: Version Your Releases
```bash
# Create a git tag for each release
git tag v1.0.1
git push origin v1.0.1
```

Then use in Webflow:
```html
<script defer src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO-NAME@v1.0.1/main.js"></script>
```

Change the version number each time you want to deploy.

### Method 2: Purge jsDelivr Cache
Visit this URL in your browser:
```
https://purge.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO-NAME@main/main.js
```

This immediately purges the cache.

## 🎯 Development Tips

### Local Testing

You can't test the Barba SPA locally without a server because Barba needs to fetch HTML pages. Options:

1. **Use Webflow's preview** - Changes reflect after you purge CDN
2. **Set up a local server** with your Webflow exported site
3. **Use Webflow's staging domain** for testing

### Source Maps

For easier debugging, build without minification during development:

```bash
npm run build
```

This creates `main.js` with source maps. Switch to `npm run build:prod` for production (minified).

### File Organization

```
src/
├── pages/          # Page-specific logic
├── components/     # Reusable components
├── core/           # Framework/routing
└── utils/          # Helpers

main.js             # Built bundle (commit this!)
```

**Always commit `main.js`** so jsDelivr can serve it!

## 🐛 Troubleshooting

### Changes Not Showing?

1. Check if you committed and pushed `main.js`
2. Wait 5 minutes for CDN cache
3. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
4. Purge jsDelivr cache (see above)
5. Check browser console for errors

### Build Fails?

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build:prod
```

### Git Issues?

```bash
# Check status
git status

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

## 📦 Production Deployment

When you're ready to deploy to production:

1. **Build production bundle:**
   ```bash
   npm run build:prod
   ```

2. **Commit and push:**
   ```bash
   git add main.js
   git commit -m "Production build"
   git push
   ```

3. **Create a release tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Update Webflow to use the tagged version:**
   ```html
   <script defer src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO-NAME@v1.0.0/main.js"></script>
   ```

This ensures production uses a stable, versioned build.

## 🚀 Quick Commands Reference

```bash
# Development (auto-rebuild on save)
npm run dev

# Build for testing
npm run build

# Build for production (minified)
npm run build:prod

# Git workflow
git add .
git commit -m "Your message"
git push

# Create release
git tag v1.0.0
git push origin v1.0.0
```

## 🌐 Alternative CDN Options

### unpkg (Alternative to jsDelivr)

```html
<script defer src="https://unpkg.com/YOUR-USERNAME/YOUR-REPO-NAME@main/main.js"></script>
```

### GitHub Pages

1. Enable GitHub Pages in repo settings
2. Use: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/main.js`

Note: Requires public repository.

---

**Happy developing!** 🎉

