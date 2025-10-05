# Animation Performance Guide

## ✅ What Was Fixed (v1.2.0)

### Product Morph Animation
The morph animation now **actually morphs** the clicked collection item into the product slider:

**Before (v1.1.0):**
- ❌ Clicked item faded out
- ❌ Product slider faded in
- ❌ No actual morphing happened

**After (v1.2.0):**
- ✅ Clicked item stays visible
- ✅ Product slider starts at the clicked item's position/size
- ✅ Smooth transform animation from small → large
- ✅ Reverse animation on back button works the same way

### How It Works

**Forward (Collections → Product):**
1. Capture clicked item's position/size
2. Position `.slider-wrap` at the clicked item's location
3. Animate `.slider-wrap` to its natural position/size
4. Hide clicked item once morph starts

**Reverse (Product → Collections, back button):**
1. Find the matching collection item
2. Animate `.slider-wrap` to shrink to collection item position
3. Once complete, show collection item and hide product

---

## 🚀 Performance Optimizations Implemented

### 1. **GPU Acceleration**
All animations use `transform` and `opacity` (GPU-accelerated properties):
```javascript
// ✅ GOOD - Uses GPU
gsap.to(element, { x: 100, y: 100, scale: 1.5, opacity: 1 });

// ❌ BAD - Triggers layout recalculations
gsap.to(element, { left: '100px', top: '100px', width: '500px' });
```

### 2. **will-change Hints**
Before animations, we add `will-change` to hint the browser:
```javascript
element.style.willChange = 'transform, opacity';
// ... animate ...
element.style.willChange = 'auto'; // Clean up after
```

### 3. **Reduced Motion Respect**
All animations respect the user's `prefers-reduced-motion` setting:
```javascript
const duration = prefersReducedMotion ? 0 : 0.7;
```

### 4. **Simple Mode**
Flip animations use `simple: true` to skip extra calculations.

### 5. **Deferred Heavy Work**
Heavy DOM operations are deferred using `requestAnimationFrame`.

---

## 📊 Current Performance Benchmarks

**Target:** 60 FPS (16.67ms per frame)

**Morph Animation:**
- Duration: 700ms
- Easing: `power3.inOut`
- Properties: `x, y, scaleX, scaleY, borderRadius, opacity`
- Expected frame time: ~8-12ms per frame ✅

---

## 🔧 Additional Optimization Opportunities

### 1. **Webflow Interactions**
Your site might have Webflow IX animations that compete with our custom animations.

**Recommendation:**
- Disable IX animations on pages with custom transitions
- Or: Only enable IX after page enter animation completes

### 2. **Image Loading**
Large images can cause jank during morphing.

**Current Status:** Using progressive blur placeholders ✅

**Further optimization:**
- Preload product images when hovering over collection items
- Use WebP format with fallbacks
- Implement `loading="lazy"` on below-fold images

### 3. **Carousel Initialization**
The product carousel initializes during page enter.

**Current:** Loads synchronously
**Better:** Defer until after morph completes:
```javascript
morphToProduct().then(() => {
  // Now init carousel
  initProductCarousel();
});
```

### 4. **Infinite Scroll**
The collections page uses Intersection Observer for infinite scroll.

**Current Status:** Already optimized ✅
- Uses `rootMargin: "100px"`
- Debounced loading

### 5. **Filter State Caching**
We already cache API responses in memory.

**Current Status:** Optimized ✅
- No refetch on back button
- In-memory response cache

---

## 🎯 Testing Checklist

Test these scenarios to ensure smooth 60fps animations:

- [ ] Click product from collections → morphs smoothly
- [ ] Press back button → morphs back smoothly
- [ ] Scroll collections, click product → still smooth
- [ ] On mobile (slower GPU) → animations still smooth
- [ ] With slow network → animations don't wait for images
- [ ] Multiple rapid clicks → no animation stacking/jank

---

## 🐛 Debugging Animation Issues

### Check FPS in DevTools:
1. Open Chrome DevTools
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type "Show Rendering"
4. Enable "Frame Rendering Stats"
5. Click a product and watch FPS

**Target:** Should stay at 60 FPS during morph

### Common Issues:

**Choppy Animation:**
- Check if other scripts are running during animation
- Disable Webflow IX temporarily to test
- Look for layout thrashing in Performance tab

**Animation Doesn't Start:**
- Check console for errors
- Verify `.slider-wrap` exists on product page
- Verify collection items have `data-base-url` attribute

**Wrong Element Morphs:**
- Check that clicked element has `.collection_grid-item` class
- Verify product slug matches collection item slug

---

## 📝 Next Steps for Even Better Performance

1. **Preload Next Page:**
   - Barba prefetch is already enabled
   - Consider preloading specific routes on hover

2. **Split Code:**
   - Current: One bundle (~150KB minified)
   - Future: Split by route (Home, Collections, Product)

3. **Service Worker:**
   - Cache the main.js file
   - Cache product images
   - Offline support

4. **Web Vitals:**
   - Monitor LCP, FID, CLS
   - Use Lighthouse CI in GitHub Actions

---

## 🎨 Animation Customization

Want to tweak the morph animation? Edit `src/core/flipTransition.js`:

```javascript
// Change duration (default: 0.7s)
const duration = getAnimationDuration(0.5); // faster

// Change easing
ease: 'elastic.out(1, 0.5)' // bouncy

// Add scale overshoot
scaleX: 1.05,
scaleY: 1.05,
```

After changes, run:
```bash
.\deploy.ps1 "Tweak morph animation timing"
```

Wait ~30 seconds, then hard refresh your site!

