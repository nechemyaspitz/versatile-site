# 🚀 Deploy Guide - macOS Version

## ✅ Setup Complete!

Everything is configured and ready to go:
- ✅ Git installed and configured
- ✅ GitHub connected and authenticated
- ✅ Node.js and npm installed
- ✅ Dependencies installed (33 packages)
- ✅ Build system tested and working
- ✅ Deploy script created for macOS

---

## 📦 Quick Deploy Commands

### Standard Deploy (Recommended)
```bash
./deploy.sh "Your commit message"
```

**Example:**
```bash
./deploy.sh "Fixed collections animation"
```

This will:
1. Build production bundle
2. Commit changes to master
3. Push to GitHub
4. Auto-deploy to GitHub Pages
5. Changes live in ~30-60 seconds

### Deploy with Version Tag
```bash
./deploy.sh "Your commit message" v2.3.0
```

**Example:**
```bash
./deploy.sh "Added wishlist feature" v2.3.0
```

This creates a git tag for versioned releases (useful for production).

---

## 🛠️ Development Workflow

### 1. Start Development Mode (Recommended)
```bash
npm run dev
```

This watches your files and auto-rebuilds on save. Leave it running while you work!

### 2. Make Your Changes
Edit files in the `src/` directory:
- `src/pages/` - Page-specific logic
- `src/renderers/` - Taxi.js renderers
- `src/transitions/` - Page transitions
- `src/components/` - Reusable components
- `src/utils/` - Helper functions

### 3. Test Locally
Build manually if needed:
```bash
npm run build:prod
```

### 4. Deploy When Ready
```bash
./deploy.sh "Description of what you changed"
```

---

## 🔥 Common Commands

```bash
# Development (auto-rebuild on save)
npm run dev

# Build for production
npm run build:prod

# Check git status
git status

# View recent commits
git log --oneline -5

# Pull latest changes
git pull

# Deploy
./deploy.sh "Your message"
```

---

## 🌐 Your Webflow Script URL

Use this in Webflow Site Settings → Custom Code → Footer:

```html
<!-- Taxi.js Core (required) -->
<script src="https://unpkg.com/@unseenco/e@latest/dist/e.min.js"></script>
<script src="https://unpkg.com/@unseenco/taxi@latest/dist/taxi.min.js"></script>

<!-- Your bundled code from GitHub Pages -->
<script defer src="https://nechemyaspitz.github.io/versatile-site/main.js"></script>
```

**This URL never changes!** Every deploy automatically updates it.

---

## 📊 What Happens When You Deploy?

```
./deploy.sh "Your message"
    ↓
1. npm run build:prod (creates minified main.js)
    ↓
2. git add . && git commit -m "Your message"
    ↓
3. git push (updates master branch)
    ↓
4. Switches to gh-pages branch
    ↓
5. Copies main.js from master
    ↓
6. git commit && git push (deploys to GitHub Pages)
    ↓
7. Returns to master branch
    ↓
✅ DONE! Live in ~30-60 seconds
```

---

## 🐛 Troubleshooting

### Changes not showing on site?
1. Wait 60 seconds after deploy
2. Hard refresh browser (Cmd+Shift+R)
3. Check browser console for errors
4. Verify the script URL in Webflow

### Build fails?
```bash
# Clean reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build:prod
```

### Git authentication issues?
```bash
# Test connection
git fetch --dry-run

# If it fails, you may need to set up GitHub credentials
# See: https://docs.github.com/en/authentication
```

### Deploy script won't run?
```bash
# Make sure it's executable
chmod +x deploy.sh

# Try running with bash explicitly
bash deploy.sh "Your message"
```

---

## 🎯 Best Practices

### Commit Messages
Be descriptive:
```bash
# Good ✅
./deploy.sh "Fixed morph animation on back button"
./deploy.sh "Added lazy loading to product images"
./deploy.sh "Optimized collections page performance"

# Bad ❌
./deploy.sh "fix"
./deploy.sh "update"
./deploy.sh "changes"
```

### Before Deploying
1. ✅ Test your changes work
2. ✅ Check browser console for errors
3. ✅ Make sure build succeeds
4. ✅ Write a clear commit message

### Development Tips
- Keep `npm run dev` running while coding
- Test in multiple browsers
- Check mobile responsiveness
- Monitor browser console for errors

---

## 📁 Project Structure

```
versatile-site/
├── src/                    # Your source code (edit these!)
│   ├── main.js            # Entry point
│   ├── taxi.js            # Taxi.js initialization
│   ├── core/              # State management
│   ├── pages/             # Page modules (home, collections, product)
│   ├── renderers/         # Taxi.js renderers
│   ├── transitions/       # Page transitions
│   ├── components/        # Reusable components
│   └── utils/             # Helper functions
├── main.js                # Bundled output (auto-generated, committed)
├── package.json           # Dependencies
├── rollup.config.js       # Build configuration
├── deploy.sh              # Deploy script (macOS)
├── deploy.ps1             # Deploy script (Windows)
└── node_modules/          # Dependencies (not committed)
```

---

## 🚀 You're All Set!

Everything is configured and ready. To start working:

1. Open terminal in project directory
2. Run `npm run dev` to start development mode
3. Make your changes in `src/` files
4. When ready, run `./deploy.sh "Description of changes"`
5. Wait ~30-60 seconds and refresh your site

**Happy coding!** 🎉

---

## 📞 Quick Help

**Build not working?**
```bash
npm install
npm run build:prod
```

**Deploy not working?**
```bash
chmod +x deploy.sh
./deploy.sh "test deploy"
```

**Want to see what changed?**
```bash
git status
git diff
```

**Need to undo changes?**
```bash
git restore <filename>    # Undo specific file
git restore .             # Undo all changes
```

