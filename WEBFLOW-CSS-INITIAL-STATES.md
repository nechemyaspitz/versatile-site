# Webflow Custom Code - Animation Initial States

## 📋 COPY & PASTE THIS INTO WEBFLOW

**Location:** Project Settings → Custom Code → Head Code

```html
<style>
/* ============================================
   ANIMATION INITIAL STATES - v3.15.1
   Prevents FOUC on initial load
   ============================================ */

/* Hide page content on initial load (before JS executes) */
[data-taxi-view] {
  opacity: 0;
}

/* Optional: Ensure smooth rendering (recommended) */
[data-taxi-view] * {
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}
</style>
```

---

## ✅ HOW IT WORKS

### The Problem:
Individual element initial states cause conflicts between CSS and GSAP, and generic page hiding still caused flashes when transitioning between pages.

### The Solution:
1. **CSS hides initial page load** with `[data-taxi-view] { opacity: 0; }` - prevents FOUC before JS loads
2. **SmartTransition hides during navigation** with `gsap.set(to, { opacity: 0 })` - no flash between pages
3. **Page animations reveal at perfect moment** with `gsap.set(view, { opacity: 1 })` - works for both scenarios
4. **No conflicts!** Each element's animation starts from its natural state

### Benefits:
- ✅ **No FOUC on initial load** - CSS hides before JS executes
- ✅ **No flashes between pages** - SmartTransition + animations handle it
- ✅ **No CSS/GSAP conflicts** - only opacity hiding, no transforms
- ✅ **Simple & universal** - one CSS rule covers everything
- ✅ **Minimal CSS** - just one line to prevent initial FOUC!

---

## 🔧 VERIFICATION CHECKLIST

After adding the CSS to Webflow:

- [ ] Publish the site
- [ ] Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
- [ ] Test each page:
  - [ ] Home page: Should be blank, then animate in smoothly
  - [ ] Collections page: Should be blank, then animate in smoothly
  - [ ] Product page: Should be blank, then animate in smoothly
- [ ] Verify no flash of content before animations start
- [ ] Check that navigation between pages feels smooth

---

## 📝 TECHNICAL NOTES

### Why CSS + JavaScript Hiding?
- **CSS is essential for initial page load** - Without it, there's a guaranteed flash before JavaScript executes
- **SmartTransition handles navigation** - After initial load, JavaScript controls all page swaps
- **Together they're perfect** - No gaps, no flashes, works in all scenarios

### Why `backface-visibility: hidden`?
This CSS property forces GPU acceleration, which can make animations smoother, especially on mobile devices.

### Why `-webkit-font-smoothing: antialiased`?
Ensures text remains crisp during animations, particularly on macOS/iOS.

---

## 🎯 COMPARISON WITH OLD APPROACH

### ❌ OLD (Complex, Conflicts):
```css
.hero-heading { opacity: 0; transform: scale(0.8); }
.btn-group > * { transform: translateY(102%); }
.hero-cover { width: 100%; }
.sm-premium { opacity: 0; }
.swiper { transform: scale(1.1); }
.font-color-primary { overflow: hidden; }
#filters-open { transform: translateY(100%); }
.product-description { overflow: hidden; }
.variant-buttons { opacity: 0; transform: translateY(20%); }
/* ... 10+ more rules ... */
```

### ✅ NEW (Simple, No Conflicts):
```css
/* One CSS rule prevents initial FOUC */
[data-taxi-view] { opacity: 0; }
```

```javascript
// SmartTransition hides incoming pages during navigation
gsap.set(to, { opacity: 0 });

// Page animations reveal at the perfect moment (both scenarios)
gsap.set(view, { opacity: 1 });
```

---

## 🚀 VERSION

Current implementation: **v3.15.1**  
Last updated: 2025-10-10

**Change from v3.15.0:** Removed CSS-based hiding. SmartTransition now handles initial page hiding, eliminating flashes during navigation.
