# Webflow Custom Code - Animation Initial States

## 📋 COPY & PASTE THIS INTO WEBFLOW

**Location:** Project Settings → Custom Code → Head Code

```html
<style>
/* ============================================
   ANIMATION INITIAL STATES - v3.15.0
   Universal solution: Hide entire page until animations start
   ============================================ */

/* Hide page content until GSAP reveals it (prevents FOUC) */
[data-taxi] {
  opacity: 0;
}

/* Optional: Ensure smooth rendering */
[data-taxi] * {
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}
</style>
```

---

## ✅ HOW IT WORKS

### The Problem:
Individual element initial states (like `transform: translateY(102%)`) cause conflicts between CSS and GSAP, leading to elements staying in their transformed state.

### The Solution:
1. **CSS hides the entire page** with `[data-taxi] { opacity: 0; }`
2. **GSAP reveals it instantly** at the start of each animation with `gsap.set('[data-taxi]', { opacity: 1 })`
3. **No conflicts!** Each element's animation starts from its natural state

### Benefits:
- ✅ **No FOUC** (Flash of Unstyled Content)
- ✅ **No CSS/GSAP conflicts**
- ✅ **Simple & universal** - works for all pages
- ✅ **Easy to maintain** - just 2 lines of CSS!

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

### Why `[data-taxi]`?
This is the main container that wraps each page's content in the Taxi.js setup. By hiding this, we hide everything that gets swapped between page transitions.

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
[data-taxi] { opacity: 0; }
```

---

## 🚀 VERSION

Current implementation: **v3.15.0**  
Last updated: 2025-10-10

**Previous approach deprecated:** Individual element CSS initial states removed in favor of universal page-level hiding.
