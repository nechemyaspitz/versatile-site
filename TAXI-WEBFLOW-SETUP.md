# 🚕 Taxi.js Webflow Setup Guide

## ⚠️ CRITICAL: HTML Structure Changes Required

Your site has been migrated from Barba.js to Taxi.js. **You MUST update your Webflow HTML structure** or navigation will not work correctly (including the scroll jump issue).

---

## 📋 What Needs to Change in Webflow

### ❌ OLD (Barba.js) - Remove This:

```html
<div data-barba="wrapper">
  <div data-barba="container" data-barba-namespace="home">
    <!-- Page content -->
  </div>
</div>
```

### ✅ NEW (Taxi.js) - Use This Instead:

```html
<main data-taxi>
  <div data-taxi-view="home">
    <!-- Page content -->
  </div>
</main>
```

---

## 🔧 Step-by-Step Fix

### 1. Update Webflow CDN Scripts

**Go to: Webflow → Site Settings → Custom Code → Footer Code (before `</body>`)**

Replace with:

```html
<!-- GSAP Core -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>

<!-- Taxi.js Dependencies -->
<script src="https://unpkg.com/@unseenco/e@2.2.2/dist/e.umd.js" crossorigin></script>
<script src="https://unpkg.com/@unseenco/taxi@1.0.3/dist/taxi.umd.js" crossorigin></script>

<!-- Your Code -->
<script defer src="https://nechemyaspitz.github.io/versatile-site/main.js"></script>
```

**Important Changes:**
- ✅ Removed `@barba/core` and `@barba/prefetch`
- ✅ Added `@unseenco/e` (required dependency for Taxi.js)
- ✅ Added `@unseenco/taxi`

---

### 2. Update HTML Structure on EVERY Page

For **each page** in your Webflow project, you need to change the wrapper structure:

#### Home Page
```html
<main data-taxi>
  <div data-taxi-view="home">
    <!-- All your home page content -->
  </div>
</main>
```

#### Collections Page
```html
<main data-taxi>
  <div data-taxi-view="collections">
    <!-- All your collections page content -->
  </div>
</main>
```

#### Product Page (Template)
```html
<main data-taxi>
  <div data-taxi-view="product">
    <!-- All your product page content -->
  </div>
</main>
```

#### Other Pages (About, Contact, etc.)
```html
<main data-taxi>
  <div data-taxi-view>
    <!-- Page content (uses default renderer) -->
  </div>
</main>
```

---

## 🎯 Critical Rules

1. **`data-taxi-view` must be the ONLY direct child of `data-taxi`**
   - ❌ Don't put navigation, header, or footer inside `data-taxi`
   - ✅ Only the content that changes between pages goes inside

2. **The wrapper element stays on ALL pages**
   - The `data-taxi` container should be in your master layout/symbol
   - Only the `data-taxi-view` content changes per page

3. **Navigation must be OUTSIDE `data-taxi`**
   ```html
   <!-- Navigation (persistent) -->
   <nav>...</nav>
   
   <!-- Page content (changes) -->
   <main data-taxi>
     <div data-taxi-view="home">...</div>
   </main>
   ```

---

## 🐛 Why This Fixes the Scroll Jump

The scroll jump happens because:

1. **Without proper `data-taxi` structure**, Taxi.js can't intercept link clicks
2. **Browser default behavior** takes over, causing instant page reload
3. **Browser instantly scrolls to top** on navigation (default behavior)

With correct structure:
1. ✅ Taxi.js intercepts clicks
2. ✅ Smooth fade transitions
3. ✅ Controlled scroll timing (after fade-out)
4. ✅ No jarring jumps

---

## ✅ Verification Checklist

After making changes:

- [ ] Open Webflow Editor
- [ ] Check that EVERY page has `<main data-taxi>` wrapper
- [ ] Check that EVERY page has `<div data-taxi-view="pagename">` inside
- [ ] Check that navigation is OUTSIDE `data-taxi`
- [ ] Publish site
- [ ] Test: Click a link → should fade out/in smoothly (no jump!)
- [ ] Check browser console for: `🚕 Taxi.js ready! Navigation enabled.`

---

## 🆘 Troubleshooting

### Console shows "❌ Taxi.js not found!"
- Check that you added the CDN scripts in the correct order
- Make sure `@unseenco/e` loads BEFORE `@unseenco/taxi`

### Console shows "✅ Taxi.js ready!" but still no smooth transitions
- Check HTML structure: `data-taxi` and `data-taxi-view` must be present
- Check that `data-taxi-view` is the ONLY child of `data-taxi`
- Verify navigation links don't have `target="_blank"` or `data-taxi-ignore`

### Smooth transitions work, but scroll still jumps
- This should be fixed once HTML structure is correct
- If not, check for conflicting scroll libraries (Lenis, Smooth Scroll, etc.)

---

## 📚 Taxi.js vs Barba.js

| Feature | Barba.js | Taxi.js |
|---------|----------|---------|
| HTML Attributes | `data-barba` | `data-taxi` |
| Wrapper | `data-barba="wrapper"` | `data-taxi` |
| Container | `data-barba="container"` | `data-taxi-view` |
| Page ID | `data-barba-namespace` | `data-taxi-view="pagename"` |
| CDN | `@barba/core` | `@unseenco/taxi` |
| Dependencies | None | Requires `@unseenco/e` |

---

## 🚀 After Setup

Once Taxi.js is properly configured:

1. ✅ Smooth page transitions (fade in/out)
2. ✅ No scroll jumping
3. ✅ Faster navigation (content prefetch)
4. ✅ Browser back/forward works
5. ✅ Collections page caching (instant back)
6. ✅ Active link highlighting
7. ✅ Scroll position restoration

---

**Need help?** Check the browser console for Taxi.js logs to diagnose issues.

