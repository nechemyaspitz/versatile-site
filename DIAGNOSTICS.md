# 🔍 Quick Diagnostics

## Check What Version is Loading

1. Open your Webflow site
2. Press **F12** (open console)
3. Look for these logs:

**If you see:**
```
🚀 Versatile Site SPA v1.0.1
```
❌ **Old version is loading** - Purge CDN again

**If you see:**
```
🚀 Versatile Site SPA v1.1.0
✨ NEW: GSAP Flip morph animations + Performance optimizations
```
✅ **New version is loading!**

## Check if Flip Plugin is Loaded

In the same console, type:
```javascript
window.Flip
```

**If you see:**
```
undefined
```
❌ **Flip plugin is NOT loaded** - Add it to Webflow (see below)

**If you see:**
```
{getState: ƒ, from: ƒ, ...}
```
✅ **Flip plugin IS loaded!**

## Fix: Add Flip Plugin to Webflow

**Go to: Webflow Site Settings → Custom Code → Footer Code**

Make sure you have ALL these scripts in this order:

```html
<!-- GSAP Core -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>

<!-- GSAP Flip Plugin (THIS IS REQUIRED!) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js"></script>

<!-- Barba Core -->
<script src="https://unpkg.com/@barba/core"></script>

<!-- Barba Prefetch -->
<script src="https://unpkg.com/@barba/prefetch"></script>

<!-- Your code from GitHub -->
<script defer src="https://cdn.jsdelivr.net/gh/nechemyaspitz/versatile-site@master/main.js"></script>
```

**Then:**
1. Publish your Webflow site
2. Clear browser cache (Ctrl+Shift+R)
3. Test again

## Fix: Purge CDN if Old Version

If console shows v1.0.1, purge the CDN:

1. Visit: https://purge.jsdelivr.net/gh/nechemyaspitz/versatile-site@master/main.js
2. Wait for `{"status":"finished"}`
3. Hard refresh your site (Ctrl+Shift+R)

## Common Issues

### Issue: "Version shows 1.1.0 but no animations"
**Solution:** You're missing the Flip plugin script tag. Add it to Webflow.

### Issue: "Version still shows 1.0.1"
**Solution:** CDN cache not purged. Purge again and hard refresh.

### Issue: "Console errors about Flip"
**Solution:** Flip script needs to load AFTER GSAP core but BEFORE main.js

## Test the Animation

Once everything is loaded:

1. Go to Collections page
2. Open console (F12)
3. Click a product
4. You should see in console: Flip animations running
5. The product card should morph smoothly

## Need Help?

Run this in console for a full diagnostic:

```javascript
console.log('Version:', document.querySelector('[data-barba]') ? 'Barba loaded' : 'Barba missing');
console.log('GSAP:', typeof window.gsap !== 'undefined' ? '✅' : '❌');
console.log('Flip:', typeof window.Flip !== 'undefined' ? '✅' : '❌');
console.log('Collections page:', document.querySelector('[data-barba-namespace="collections"]') ? '✅' : '❌');
console.log('Product items:', document.querySelectorAll('.collection_grid-item').length);
```

This will show you exactly what's missing!

